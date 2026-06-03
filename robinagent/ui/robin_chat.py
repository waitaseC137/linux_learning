#!/usr/bin/env python3
"""
Robin Chat — tmux split panelinde çalışan soru-cevap arayüzü.
"""

from __future__ import annotations
import argparse
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from rich.console import Console
from rich.panel import Panel
from rich.text import Text
import core.notebooklm_bridge as nlm

console = Console()

_PANE_FILE = "/tmp/robin_chat_pane"


def _register_pane() -> None:
    try:
        result = subprocess.run(
            ["tmux", "display-message", "-p", "#{pane_id}"],
            capture_output=True, text=True,
        )
        pane_id = result.stdout.strip()
        if pane_id:
            with open(_PANE_FILE, "w") as f:
                f.write(pane_id)
    except Exception:
        pass


def _unregister_pane() -> None:
    try:
        os.remove(_PANE_FILE)
    except FileNotFoundError:
        pass


def _ask(question: str, notebook_id: str, game_name: str) -> None:
    console.print(f"[bold cyan]Sen:[/bold cyan] {question}")
    with console.status("[dim]Robin düşünüyor...[/dim]", spinner="dots"):
        answer = nlm.ask(question, notebook_id, game=game_name)
    console.print(Panel(Text(answer), title="[bold green]Robin[/bold green]", border_style="green"))


def main() -> None:
    parser = argparse.ArgumentParser(description="Robin Chat")
    parser.add_argument("--game", required=True)
    parser.add_argument("--notebook", default="")
    parser.add_argument("--question", default="")
    args = parser.parse_args()

    game_name = args.game
    notebook_id = args.notebook

    _register_pane()

    console.print(
        Panel(
            f"[bold]{game_name.capitalize()}[/bold] — Robin Chat\n"
            "[dim]Çıkmak için 'exit' yaz veya Ctrl+C'ye bas.[/dim]",
            border_style="cyan",
        )
    )

    if not nlm.is_available():
        console.print("[red]notebooklm-py kurulu değil — pip install notebooklm-py\\[browser][/red]")
        _unregister_pane()
        sys.exit(1)

    if args.question:
        _ask(args.question, notebook_id, game_name)

    while True:
        try:
            console.print()
            question = console.input("[bold cyan]Soru:[/bold cyan] ").strip()
        except (EOFError, KeyboardInterrupt):
            break
        if not question or question.lower() == "exit":
            break
        _ask(question, notebook_id, game_name)

    _unregister_pane()


if __name__ == "__main__":
    main()
