"""
Manages an interactive SSH session via pexpect.
/ commands are intercepted before being sent to the remote shell.
"""

from __future__ import annotations
import os
import signal
import shutil
import subprocess
import sys
import termios
import tty
import pexpect
from rich.console import Console
import core.command_handler as cmd_handler
import core.progress as progress

console = Console()


def connect(game_cfg: dict, level: int, ai_mode: bool) -> None:
    """Open an interactive SSH session; intercept / commands."""
    game_name = game_cfg["name"].lower()
    host = game_cfg["host"]
    port = game_cfg["port"]
    user_prefix = game_cfg["user_prefix"]
    notebook_id = game_cfg.get("notebooklm_notebook_id", "")

    username = f"{user_prefix}{level}"
    password = progress.get_password(game_name, level)

    if password is None:
        if level == 0 and game_cfg.get("start_password"):
            password = game_cfg["start_password"]
        else:
            console.print(
                f"[yellow]Level {level} için kayıtlı şifre bulunamadı. "
                "Şifreyi girin:[/yellow] ",
                end="",
            )
            password = input().strip()
            if not password:
                console.print("[red]Şifre boş, bağlantı iptal edildi.[/red]")
                return

    console.print(f"[dim]Şifre: {password[:4]}...[/dim]")
    _show_level_banner(game_name, level, username, host, port)

    ssh_cmd = (
        f"ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "
        f"-o RequestTTY=yes "
        f"-p {port} {username}@{host}"
    )

    try:
        cols, rows = shutil.get_terminal_size()
        child = pexpect.spawn(ssh_cmd, encoding="utf-8", timeout=30)
        child.setwinsize(rows, cols)
        child.expect(["password:", "Password:"], timeout=30)
        child.sendline(password)

        idx = child.expect(
            [r"\$", r"#", r">", "Permission denied", pexpect.TIMEOUT],
            timeout=15,
        )
        if idx == 3:
            console.print("[red]Şifre hatalı veya erişim reddedildi.[/red]")
            return
        if idx == 4:
            console.print("[red]Bağlantı zaman aşımına uğradı.[/red]")
            return

    except pexpect.exceptions.EOF:
        console.print("[red]SSH bağlantısı başarısız.[/red]")
        return
    except Exception as e:
        console.print(f"[red]Bağlantı hatası: {e}[/red]")
        return

    _interactive_loop(child, game_cfg, game_name, level, notebook_id, ai_mode)


class _NextLevel(Exception):
    def __init__(self, level: int):
        self.level = level


class _ExitSession(Exception):
    pass


class _SavePassword(Exception):
    def __init__(self, partial_cmd: str):
        self.partial_cmd = partial_cmd


def _interactive_loop(
    child: pexpect.spawn,
    game_cfg: dict,
    game_name: str,
    level: int,
    notebook_id: str,
    ai_mode: bool,
) -> None:
    console.print(
        "\n[dim]Komutlar: /ask <soru>  /hint  /repo  /level  "
        "/save <şifre>  /next  /progress  |  Çıkmak: exit[/dim]\n"
    )

    cmd_buf = bytearray()
    in_cmd_mode = False
    line_start = True

    def _process_byte(b: bytes) -> bytes:
        nonlocal in_cmd_mode, line_start

        # Escape sequences (arrow keys, F-keys): pass through or ignore in cmd mode
        if b == b"\x1b":
            line_start = False
            if in_cmd_mode:
                return b""
            return b

        # Ctrl+C in cmd mode — cancel the buffered command
        if in_cmd_mode and b == b"\x03":
            cmd_buf.clear()
            in_cmd_mode = False
            line_start = True
            sys.stdout.buffer.write(b"^C\r\n")
            sys.stdout.buffer.flush()
            return b""

        # Enter / CR
        if b in (b"\r", b"\n"):
            if in_cmd_mode:
                line = cmd_buf.decode("utf-8", errors="replace").strip()
                cmd_buf.clear()
                in_cmd_mode = False
                line_start = True
                sys.stdout.buffer.write(b"\r\n")
                sys.stdout.buffer.flush()
                if line.lower() == "/next":
                    raise _NextLevel(level + 1)
                if line.lower().startswith("/save"):
                    raise _SavePassword(line)
                cmd_handler.handle(line, game_name, level, notebook_id)
                line_start = True
                return b""
            line_start = True
            return b

        # Backspace / DEL in cmd mode
        if in_cmd_mode and b in (b"\x7f", b"\x08"):
            if cmd_buf:
                cmd_buf.pop()
                sys.stdout.buffer.write(b"\x08 \x08")
                sys.stdout.buffer.flush()
            return b""

        # '/' at line start → enter cmd mode
        if line_start and b == b"/":
            line_start = False
            in_cmd_mode = True
            cmd_buf.clear()
            cmd_buf.extend(b)
            sys.stdout.buffer.write(b)
            sys.stdout.buffer.flush()
            return b""

        line_start = False

        # In cmd mode — echo locally, buffer, don't send to SSH yet
        if in_cmd_mode:
            cmd_buf.extend(b)
            sys.stdout.buffer.write(b)
            sys.stdout.buffer.flush()
            return b""

        # Normal character — pass straight to SSH (remote PTY handles echo)
        return b

    def input_filter(data: bytes) -> bytes:
        result = bytearray()
        for byte in data:
            r = _process_byte(bytes([byte]))
            result.extend(r)
        return bytes(result)

    def output_filter(data: bytes) -> bytes:
        nonlocal line_start
        if b"\n" in data or b"\r" in data:
            line_start = True
        return data

    def _handle_resize(sig, frame):
        c, r = shutil.get_terminal_size()
        child.setwinsize(r, c)

    fd = sys.stdin.fileno()
    saved_tc = termios.tcgetattr(fd)

    old_sigwinch = signal.signal(signal.SIGWINCH, _handle_resize)
    try:
        while True:
            try:
                child.interact(
                    escape_character=None,
                    input_filter=input_filter,
                    output_filter=output_filter,
                )
                console.print("\n[yellow]Bağlantı kapandı.[/yellow]")
                break
            except _SavePassword:
                termios.tcsetattr(fd, termios.TCSADRAIN, saved_tc)
                sys.stdout.write("\x1b[?2004l")
                sys.stdout.flush()
                console.print("\n[bold cyan]Kaydedilecek şifreyi girin:[/bold cyan] ", end="")
                pw = input().strip()
                pw = pw.replace("\x1b[200~", "").replace("\x1b[201~", "").strip()
                if pw:
                    cmd_handler.handle(f"/save {pw}", game_name, level, notebook_id)
                cmd_buf.clear()
                in_cmd_mode = False
                line_start = True
                # re-enter interact()
            except _NextLevel as e:
                try:
                    child.sendline("exit")
                    child.close()
                except Exception:
                    pass
                subprocess.run(["stty", "sane"])
                console.print(f"[green]Level {e.level}'e geçiliyor...[/green]")
                break
            except _ExitSession:
                child.sendline("exit")
                child.close()
                console.print("[yellow]SSH bağlantısı kapatıldı.[/yellow]")
                break
    except KeyboardInterrupt:
        child.sendline("exit")
        child.close()
        console.print("\n[yellow]Bağlantı kapatıldı.[/yellow]")
    finally:
        signal.signal(signal.SIGWINCH, old_sigwinch)



def _show_level_banner(game_name: str, level: int, username: str, host: str, port: int) -> None:
    console.print(
        f"\n[bold green]Bağlanılıyor:[/bold green] "
        f"[cyan]{username}@{host}:{port}[/cyan]  "
        f"([bold]{game_name.capitalize()}[/bold] Level {level})\n"
    )
