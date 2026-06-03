"""
Handles / commands typed inside the SSH terminal session.
Returns a string to print, or None if the command was not recognised.
"""

from __future__ import annotations
import os
from rich.console import Console
import core.progress as progress
import core.notebooklm_bridge as nlm

console = Console()


def handle(raw: str, game_name: str, level: int, notebook_id: str) -> bool:
    """
    Process a /command.  Returns True if handled (caller should NOT forward
    the line to the SSH pty), False if not a known command.
    """
    parts = raw.strip().split(maxsplit=1)
    cmd = parts[0].lower()
    arg = parts[1] if len(parts) > 1 else ""

    if cmd == "/hint":
        console.print(
            "[yellow]İpucu:[/yellow] man sayfalarını oku, "
            "--help bayrağını dene ve level açıklamasına bak."
        )
        return True

    if cmd == "/repo":
        _print_repo(game_name)
        return True

    if cmd == "/level":
        console.print(
            f"[bold]Oyun:[/bold] {game_name}  |  "
            f"[bold]Level:[/bold] {level}"
        )
        return True

    if cmd == "/save":
        if not arg:
            console.print("[yellow]Kullanım: /save <şifre>[/yellow]")
            return True
        progress.save_password(game_name, level + 1, arg)
        console.print(
            f"[green]✓ Şifre kaydedildi[/green] — "
            f"{game_name} level {level + 1}: {arg}"
        )
        return True

    if cmd == "/progress":
        _print_progress(game_name, level)
        return True

    if cmd == "/next":
        return False  # handled by terminal.py (needs SSH restart)

    if cmd == "/notebook":
        _notebook_debug(game_name, notebook_id)
        return True

    return False


def _print_repo(game_name: str) -> None:
    import yaml, os
    path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "games", f"{game_name.lower()}.yaml"
    )
    try:
        with open(path) as f:
            cfg = yaml.safe_load(f)
        url = cfg.get("repo_url", "")
        if url:
            console.print(f"[blue underline]{url}[/blue underline]")
        else:
            console.print("[yellow]Bu oyun için repo URL'si henüz eklenmemiş.[/yellow]")
    except FileNotFoundError:
        console.print("[red]Oyun config dosyası bulunamadı.[/red]")


def _notebook_debug(game_name: str, notebook_id: str) -> None:
    """Notebook durumunu teşhis et ve gerekirse oluştur."""
    console.print(f"\n[bold]Notebook Teşhis — {game_name}[/bold]")
    console.print(f"  ssh_manager'dan gelen ID : [cyan]{notebook_id or '(boş)'}[/cyan]")

    from_cfg = nlm._load_notebook_id(game_name)
    console.print(f"  config.json'daki ID      : [cyan]{from_cfg or '(boş)'}[/cyan]")
    console.print(f"  notebooklm_bridge aktif  : {'[green]evet[/green]' if nlm.is_available() else '[red]hayır[/red]'}")

    active_id = notebook_id or from_cfg
    if active_id:
        console.print(f"\n[green]✓ Notebook mevcut — /ask çalışmalı.[/green]")
        return

    if not nlm.is_available():
        console.print("\n[red]notebooklm-py kurulu değil — pip install notebooklm-py[browser][/red]")
        return

    console.print("\n[yellow]Notebook bulunamadı — şimdi oluşturuluyor...[/yellow]")
    try:
        from scripts.setup_notebooks import create_notebook, _save_notebook_id
        new_id = create_notebook(game_name)
        if new_id:
            _save_notebook_id(game_name, new_id)
            console.print(f"[green]✓ Oluşturuldu: {new_id}[/green]")
            console.print("[dim]Şimdi /ask kullanabilirsiniz.[/dim]")
        else:
            console.print("[red]create_notebook None döndürdü — yukarıdaki hata mesajına bakın.[/red]")
    except Exception as e:
        console.print(f"[red]Hata ({type(e).__name__}): {e}[/red]")


def _print_progress(game_name: str, level: int) -> None:
    data = progress.load()
    info = data.get(game_name, {})
    passwords_saved = len(info.get("passwords", {}))
    console.print(
        f"[bold]{game_name.capitalize()}[/bold] — "
        f"Level: [cyan]{level}[/cyan] | "
        f"Kaydedilen şifre: [cyan]{passwords_saved}[/cyan]"
    )
