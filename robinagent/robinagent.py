#!/usr/bin/env python3
"""
Robin Agent — OverTheWire wargame companion.
Entry point: python robinagent.py
"""

import os
import shutil
import sys

# Make project root importable
sys.path.insert(0, os.path.dirname(__file__))


def ensure_tmux() -> None:
    if os.environ.get("TMUX"):
        return
    if not shutil.which("tmux"):
        return
    tmux_conf = os.path.expanduser("~/.tmux.conf")
    try:
        content = open(tmux_conf).read() if os.path.exists(tmux_conf) else ""
        if "mouse on" not in content:
            with open(tmux_conf, "a") as f:
                f.write("\nset -g mouse on\n")
    except Exception:
        pass
    os.execvp("tmux", [
        "tmux", "new-session", "-A",
        "-s", "robin",
        sys.executable, __file__,
    ] + sys.argv[1:])

import ui.welcome as welcome
import ui.game_select as game_select
import ui.game_intro as game_intro
import core.ssh_manager as ssh_manager
import core.progress as progress


def main() -> None:
    try:
        ai_mode = welcome.show()
        _game_loop(ai_mode)
    except KeyboardInterrupt:
        print("\nGüle güle!")
        sys.exit(0)
    finally:
        welcome.close_chat_panel()


def _game_loop(ai_mode: bool) -> None:
    from rich.console import Console
    console = Console()

    while True:
        game_cfg = game_select.show()
        if game_cfg is None:
            console.print("\n[yellow]Güle güle![/yellow]")
            sys.exit(0)

        action = game_intro.show(game_cfg, ai_mode)
        if action is None:
            continue  # back to game select

        if action == "start":
            game_key = game_cfg["name"].lower()

            if ai_mode:
                _ensure_notebook(game_cfg, console)

            # Natas is web-based — no SSH
            if game_cfg.get("web_based"):
                host = game_cfg["host"].replace("{level}", "0")
                console.print(
                    f"\n[bold]Natas web tabanlıdır.[/bold] "
                    f"Tarayıcınızda açın:\n"
                    f"[blue underline]http://{host}[/blue underline]\n"
                )
                input("Devam etmek için Enter'a basın...")
                continue

            while True:
                current = progress.get_current_level(game_key)
                ssh_manager.connect(game_cfg, current, ai_mode)
                next_level = progress.get_current_level(game_key)
                if next_level <= current:
                    break


def _ensure_notebook(game_cfg: dict, console) -> None:
    """
    Notebook ID boşsa veya remote'da geçersizse oluştur.
    """
    from scripts.setup_notebooks import (
        create_notebook, notebook_exists_remote,
        _save_notebook_id, _load_config, _save_config,
    )

    game = game_cfg["name"].lower()
    nb_id = game_cfg.get("notebooklm_notebook_id", "").strip()

    if nb_id:
        console.print(f"[dim]Notebook doğrulanıyor...[/dim]")
        if notebook_exists_remote(nb_id):
            return  # ID geçerli, geç
        # Remote'da yok — eski ID'yi temizle
        console.print(f"[yellow]⚠ Kayıtlı notebook ID geçersiz, yeniden oluşturuluyor...[/yellow]")
        cfg = _load_config()
        cfg.setdefault("notebooklm_notebooks", {})[game] = ""
        _save_config(cfg)
        game_cfg["notebooklm_notebook_id"] = ""

    console.print(f"\n[cyan]{game_cfg['name']} notebook hazırlanıyor...[/cyan]")
    try:
        new_id = create_notebook(game)
    except Exception as e:
        console.print(f"[red]⚠ Notebook hatası: {e}[/red]\n")
        new_id = None

    if new_id:
        _save_notebook_id(game, new_id)
        game_cfg["notebooklm_notebook_id"] = new_id
        console.print("[green]✓ Notebook hazır.[/green]\n")
    else:
        console.print(
            "[yellow]⚠ Notebook oluşturulamadı.[/yellow] "
            "Robin Chat panelinden soru soramazsınız.\n"
        )


ensure_tmux()

if __name__ == "__main__":
    main()
