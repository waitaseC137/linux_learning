"""
Wrapper around notebooklm-py async API. Degrades gracefully when the
library is not installed or no notebook ID is configured.
"""

from __future__ import annotations
import asyncio
import json
import os

_CONFIG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config.json")

try:
    from notebooklm import NotebookLMClient  # type: ignore
    _available = True
except ImportError:
    NotebookLMClient = None  # type: ignore
    _available = False


def is_available() -> bool:
    return _available


def _load_notebook_id(game: str) -> str:
    try:
        with open(_CONFIG_FILE) as f:
            cfg = json.load(f)
        return cfg.get("notebooklm_notebooks", {}).get(game, "")
    except (FileNotFoundError, json.JSONDecodeError):
        return ""


async def _ask_async(notebook_id: str, question: str) -> str:
    async with await NotebookLMClient.from_storage() as client:
        result = await client.chat.ask(notebook_id, question)
        return result.answer


def ask(question: str, notebook_id: str, game: str = "") -> str:
    if not _available:
        return "[AI desteği kapalı — notebooklm-py kurulu değil]"

    nb_id = notebook_id or (game and _load_notebook_id(game)) or ""
    if not nb_id:
        return (
            "[Notebook bulunamadı] Önce ana menüden [1] AI destekli başla "
            "seçip kurulumu tamamla."
        )

    try:
        return asyncio.run(_ask_async(nb_id, question))
    except Exception as e:
        return f"[AI hatası: {e}]"
