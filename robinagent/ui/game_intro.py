import shutil

import core.progress as progress
from ui.robin_art import COMMON_CSS, CatMixin, pick_frames

from textual.app import App, ComposeResult
from textual.containers import Vertical
from textual.widgets import Static, OptionList, Input
from textual.widgets.option_list import Option
from rich.text import Text


class GameIntroApp(App, CatMixin):
    CSS = COMMON_CSS + """
    OptionList {
        width: 72;
        margin: 1 0;
        border: round $accent;
        background: $surface;
    }
    #ask_input {
        width: 72;
        margin: 1 0;
        display: none;
    }
    #output {
        width: 72;
        padding: 0 2;
        height: auto;
        color: $text;
    }
    """
    BINDINGS = [
        ("q", "go_back", "Geri"),
        ("escape", "go_back", "Geri"),
    ]

    def __init__(self, game_cfg: dict, ai_mode: bool):
        super().__init__()
        self.game_cfg = game_cfg
        self.ai_mode = ai_mode
        self.game_name = game_cfg["name"]
        self.current = progress.get_current_level(self.game_name.lower())
        self._frames = pick_frames(shutil.get_terminal_size().columns)
        self.result = None

    def _info_card(self) -> Text:
        g = self.game_cfg
        t = Text()
        t.append(f"{self.game_name}\n\n", style="bold white")
        t.append(g["description"] + "\n\n")
        t.append("Zorluk: ", style="bold")
        t.append(f"{g['difficulty']}   ")
        t.append("Seviye sayısı: ", style="bold")
        t.append(f"{g['levels']}   ")
        t.append("Mevcut seviye: ", style="bold")
        t.append(str(self.current))
        prereqs = g.get("prereqs", [])
        if prereqs:
            t.append("\n\nÖn Koşullar:\n", style="bold")
            for p in prereqs:
                t.append(f"  • {p}\n", style="dim")
        topics = g.get("topics", [])
        if topics:
            t.append("\nKonular: ", style="bold")
            t.append("  •  ".join(topics), style="dim")
        return t

    def _build_options(self):
        opts = [Option("/repo  — GitHub'da konu anlatımını aç", id="repo")]
        if self.ai_mode:
            opts.append(Option("/ask   — AI'ye bu oyun hakkında sor", id="ask"))
        opts.append(Option("Başla  — SSH bağlantısı aç", id="start"))
        opts.append(Option("Geri", id="back"))
        return opts

    def compose(self) -> ComposeResult:
        yield Vertical(
            Static(id="cat"),
            Static(f"── {self.game_name} ──", classes="title-bar"),
            Static(self._info_card(), classes="card"),
            OptionList(*self._build_options(), id="menu"),
            Input(placeholder="Sorunuzu yazıp Enter'a basın…", id="ask_input"),
            Static("", id="output"),
            Static("[dim]↑↓ seç, Enter onayla — q/Esc geri[/dim]",
                   classes="hint", markup=True),
        )

    def on_mount(self) -> None:
        self._start_cat()
        self.query_one("#menu", OptionList).focus()

    def _close_ask(self) -> bool:
        """Ask input açıksa kapat ve True dön."""
        inp = self.query_one("#ask_input", Input)
        if str(inp.styles.display) == "block":
            inp.styles.display = "none"
            inp.value = ""
            self.query_one("#menu", OptionList).focus()
            return True
        return False

    def on_key(self, event) -> None:
        # Input odaktayken Escape ile kapat (q metin girişi olabilir)
        if event.key == "escape" and self._close_ask():
            event.stop()
            event.prevent_default()

    def on_option_list_option_selected(self, event) -> None:
        choice = event.option.id
        out = self.query_one("#output", Static)

        if choice == "back":
            self.result = None
            self.exit()
        elif choice == "start":
            self.result = "start"
            self.exit()
        elif choice == "repo":
            url = self.game_cfg.get("repo_url", "")
            if url:
                msg = Text()
                msg.append("Repo: ", style="bold")
                msg.append(url, style="blue underline")
                out.update(msg)
            else:
                out.update(Text("Repo URL'si henüz eklenmemiş.", style="yellow"))
        elif choice == "ask":
            inp = self.query_one("#ask_input", Input)
            inp.styles.display = "block"
            inp.focus()
            out.update(Text("Robin'e sorunuzu yazın (Esc ile vazgeç)…", style="dim"))

    def on_input_submitted(self, event) -> None:
        question = event.value.strip()
        out = self.query_one("#output", Static)
        self._close_ask()

        if not question:
            return

        out.update(Text("Robin düşünüyor…", style="dim"))

        def _do_ask() -> None:
            import core.notebooklm_bridge as nlm
            nb_id = self.game_cfg.get("notebooklm_notebook_id", "")
            try:
                answer = nlm.ask(question, nb_id)
            except Exception as e:
                answer = f"Hata: {e}"
            self.call_from_thread(out.update, Text(answer, style="green"))

        import threading
        threading.Thread(target=_do_ask, daemon=True).start()

    def action_go_back(self) -> None:
        # Bu binding yalnızca menü odaktayken tetiklenir (Input Escape'i on_key alır)
        if self._close_ask():
            return
        self.result = None
        self.exit()


def show(game_cfg: dict, ai_mode: bool):
    """Oyun intro ekranı. Dönüş: 'start' veya None (geri)."""
    app = GameIntroApp(game_cfg, ai_mode)
    app.run()
    return app.result
