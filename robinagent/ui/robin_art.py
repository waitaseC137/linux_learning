"""Robin (kedi) ASCII kareleri ve ortak Textual stilleri."""

# ── ASCII kedi kareleri ──────────────────────────────────────────────────────

_F1 = r"""  /\_____/\
 /  o   o  \
( ==  ω  == )
 )         (
(__|___|___|__)"""

_F2 = r"""  /\_____/\
 /  -   o  \
( ==  ω  == )
 )         (
(__|___|___|__)"""

_F3 = r"""  /\_____/\
 /  ^   ^  \
( ==  ▽  == )
 )         (
(__|___|___|__)"""

_F4 = r"""  /\_____/\
 /  o   o  \
( ==  ᗝ  == )
 )         (
(__|___|___|__)"""

_F1M = r"""  /\_/\
 (o . o)
  > ω <"""

_F2M = r"""  /\_/\
 (- . o)
  > ω <"""

_F3M = r"""  /\_/\
 (^ . ^)
  > ▽ <"""

_F4M = r"""  /\_/\
 (o . o)
  > ᗝ <"""

FRAMES_WIDE = [_F1, _F2, _F3, _F4]
FRAMES_MID = [_F1M, _F2M, _F3M, _F4M]
FRAMES_MINI = ["=^.^="] * 4

# Göz kırpma sırası: çoğunlukla açık göz, arada bir kırpma/ifade
BLINK_ORDER = [0, 0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 3]


def pick_frames(width: int) -> list:
    if width >= 80:
        return FRAMES_WIDE
    if width >= 60:
        return FRAMES_MID
    return FRAMES_MINI


# Tüm ekranların paylaştığı ortak CSS teması
COMMON_CSS = """
Screen {
    align: center top;
    background: $surface;
}
#cat {
    color: magenta;
    text-style: bold;
    padding: 1 2 0 2;
    height: auto;
}
.title-bar {
    color: $accent;
    text-style: bold;
    padding: 0 2;
}
.card {
    border: round white;
    padding: 1 2;
    width: 72;
    margin: 1 0;
    height: auto;
}
.menu {
    padding: 0 2;
    height: auto;
}
.hint {
    color: $text-muted;
    padding: 1 2;
}
"""


class CatMixin:
    """on_mount içinde self._mount_cat() çağıran ekranlar için animasyon mixin'i.

    Kullanan sınıf:
      - compose içinde Static(id="cat") koymalı
      - on_mount içinde self._start_cat() çağırmalı
      - self._frames'i (pick_frames sonucu) set etmeli
    """

    _frame_i = 0
    _frames = FRAMES_WIDE

    def _start_cat(self) -> None:
        self._frame_i = 0
        self._update_cat()
        self.set_interval(0.4, self._update_cat)

    def _update_cat(self) -> None:
        from rich.text import Text
        idx = BLINK_ORDER[self._frame_i % len(BLINK_ORDER)]
        frame = self._frames[idx]
        block = Text()
        block.append("Robin\n", style="bold yellow")
        block.append(frame, style="bold magenta")
        try:
            self.query_one("#cat").update(block)
        except Exception:
            pass
        self._frame_i += 1
