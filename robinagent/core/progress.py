import copy
import json
import os

PROGRESS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "progress.json")

_DEFAULT = {
    "bandit": {"current_level": 0, "passwords": {"0": "bandit0"}},
    "leviathan": {"current_level": 0, "passwords": {}},
    "krypton": {"current_level": 0, "passwords": {}},
    "natas": {"current_level": 0, "passwords": {}},
    "narnia": {"current_level": 0, "passwords": {}},
    "behemoth": {"current_level": 0, "passwords": {}},
    "utumno": {"current_level": 0, "passwords": {}},
    "maze": {"current_level": 0, "passwords": {}},
}


def load() -> dict:
    if not os.path.exists(PROGRESS_FILE):
        return copy.deepcopy(_DEFAULT)
    with open(PROGRESS_FILE) as f:
        data = json.load(f)
    # fill missing games
    for game, default in _DEFAULT.items():
        data.setdefault(game, copy.deepcopy(default))
    return data


def save(data: dict) -> None:
    with open(PROGRESS_FILE, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def save_password(game: str, level: int, password: str) -> None:
    data = load()
    data[game]["passwords"][str(level)] = password
    if level >= data[game]["current_level"]:
        data[game]["current_level"] = level
    save(data)


def get_password(game: str, level: int) -> str | None:
    data = load()
    return data[game]["passwords"].get(str(level))


def get_current_level(game: str) -> int:
    return load()[game]["current_level"]


def summary() -> dict:
    data = load()
    return {
        game: {
            "current_level": info["current_level"],
            "passwords_saved": len(info["passwords"]),
        }
        for game, info in data.items()
    }
