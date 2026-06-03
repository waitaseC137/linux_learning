import os
import shutil
import subprocess
import sys

import core.notebooklm_bridge as nlm
from ui.robin_art import COMMON_CSS, CatMixin, pick_frames

from textual.app import App, ComposeResult
from textual.containers import Vertical
from textual.widgets import Static
from rich.text import Text

_CHAT_PANE_FILE = "/tmp/robin_chat_pane"


class WelcomeApp(App, CatMixin):
    CSS = COMMON_CSS
    BINDINGS = [
        ("1", "choose('1')", "AI destekli"),
        ("2", "choose('2')", "Hard mode"),
        ("q", "choose('quit')", "Çıkış"),
    ]

    def __init__(self):
        super().__init__()
        self._frames = pick_frames(shutil.get_terminal_size().columns)
        self.choice = "quit"
        self._ai_active = nlm.is_available()

    def compose(self) -> ComposeResult:
        yield Vertical(
            Static(id="cat"),
            Static(self._info_text(), classes="card"),
            Static(self._menu_text(), classes="menu"),
            Static("[dim]1 veya 2 tuşuna bas — q ile çık[/dim]",
                   classes="hint", markup=True),
        )

    def _info_text(self) -> Text:
        t = Text()
        t.append("Robin Agent", style="bold white")
        t.append(" — OverTheWire wargame'lerini çözerken sana eşlik eden "
                 "terminal asistanı.\n\n")
        t.append("SSH oturumu açar, şifrelerini kaydeder ve sormak istediğin "
                 "her şeyi NotebookLM ile yanıtlar.", style="dim")
        return t

    def _menu_text(self) -> Text:
        t = Text()
        status = "✓ Aktif" if self._ai_active else "Kurulu değil"
        scolor = "green" if self._ai_active else "yellow"
        t.append("NotebookLM durumu: ")
        t.append(f"{status}\n\n", style=scolor)
        t.append("[1] ", style="bold")
        t.append("AI destekli başla  ")
        t.append("(NotebookLM kurulur, notebook'lar oluşturulur)\n", style="dim")
        t.append("[2] ", style="bold")
        t.append("Hard mode          ")
        t.append("(AI yok — direkt wargame)", style="dim")
        return t

    def on_mount(self) -> None:
        self._start_cat()

    def action_choose(self, value: str) -> None:
        self.choice = value
        self.exit()


def show() -> bool:
    """Welcome ekranını göster. AI modu aktifse True döner."""
    app = WelcomeApp()
    app.run()
    choice = app.choice

    if choice in ("quit", "2"):
        close_chat_panel()
        return False

    # choice == "1"
    _open_chat_panel()

    from scripts.setup_notebooks import _check_cli, _cli_on_path, run_full_setup

    if _check_cli():
        # Oturum zaten aktif — install/login atla ama notebook kontrolünü yine de yap
        return run_full_setup(skip_install=True, skip_login=True)
    if nlm.is_available() and _cli_on_path():
        return run_full_setup(skip_install=True, skip_login=False)
    return run_full_setup(skip_install=False, skip_login=False)


def _chat_pane_alive() -> bool:
    try:
        with open(_CHAT_PANE_FILE) as f:
            pane_id = f.read().strip()
        if not pane_id:
            return False
        result = subprocess.run(
            ["tmux", "list-panes", "-a", "-F", "#{pane_id}"],
            capture_output=True, text=True,
        )
        return pane_id in result.stdout.splitlines()
    except FileNotFoundError:
        return False


def close_chat_panel() -> None:
    """Robin Chat paneli hâlâ açıksa tmux kill-pane ile kapat."""
    if not _chat_pane_alive():
        return
    try:
        with open(_CHAT_PANE_FILE) as f:
            pane_id = f.read().strip()
        subprocess.run(["tmux", "kill-pane", "-t", pane_id],
                       capture_output=True)
        os.remove(_CHAT_PANE_FILE)
    except (FileNotFoundError, OSError):
        pass


def _open_chat_panel() -> None:
    if not os.environ.get("TMUX"):
        return
    if _chat_pane_alive():
        return
    chat_script = os.path.join(os.path.dirname(__file__), "robin_chat.py")
    subprocess.Popen([
        "tmux", "split-window", "-h", "-p", "35",
        sys.executable, chat_script,
        "--game", "genel", "--notebook", "",
    ])
