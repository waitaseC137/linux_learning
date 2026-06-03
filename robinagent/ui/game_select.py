import os
import shutil
import yaml

from ui.robin_art import COMMON_CSS, CatMixin, pick_frames

from textual.app import App, ComposeResult
from textual.containers import Vertical
from textual.widgets import Static, OptionList
from textual.widgets.option_list import Option
from rich.text import Text

GAMES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "games")

_GAME_ORDER = ["bandit", "leviathan", "krypton", "natas", "narnia", "behemoth", "utumno"]


def _load_games() -> list:
    games = []
    for name in _GAME_ORDER:
        path = os.path.join(GAMES_DIR, f"{name}.yaml")
        if os.path.exists(path):
            with open(path) as f:
                games.append(yaml.safe_load(f))
    return games


class GameSelectApp(App, CatMixin):
    CSS = COMMON_CSS + """
    OptionList {
        width: 78;
        margin: 1 0;
        border: round $accent;
        background: $surface;
    }
    """
    BINDINGS = [
        ("q", "quit_app", "Çıkış"),
        ("escape", "quit_app", "Çıkış"),
    ]

    def __init__(self, games: list):
        super().__init__()
        self.games = games
        self._frames = pick_frames(shutil.get_terminal_size().columns)
        self.selected = None

    def compose(self) -> ComposeResult:
        options = []
        for g in self.games:
            desc = g["description"]
            if len(desc) > 48:
                desc = desc[:48] + "…"
            label = Text()
            label.append(f"{g['name']:<10}", style="bold cyan")
            label.append(f" {g['difficulty']:<6}", style="yellow")
            label.append(f" {g['levels']:>3} lvl  ", style="dim")
            label.append(desc, style="white")
            options.append(Option(label, id=g["name"].lower()))

        yield Vertical(
            Static(id="cat"),
            Static("── Wargame Seçimi ──", classes="title-bar"),
            OptionList(*options, id="games"),
            Static("[dim]↑↓ ile gez, Enter ile seç — q/Esc ile çık[/dim]",
                   classes="hint", markup=True),
        )

    def on_mount(self) -> None:
        self._start_cat()
        self.query_one("#games", OptionList).focus()

    def on_option_list_option_selected(self, event) -> None:
        key = event.option.id
        for g in self.games:
            if g["name"].lower() == key:
                self.selected = g
                break
        self.exit()

    def action_quit_app(self) -> None:
        self.selected = None
        self.exit()


def show():
    """Wargame seçim ekranı. Seçilen config dict veya None döner."""
    games = _load_games()
    app = GameSelectApp(games)
    app.run()
    return app.selected
