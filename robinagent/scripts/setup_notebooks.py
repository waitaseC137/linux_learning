"""
NotebookLM kurulum + notebook oluşturma betiği.

Adımlar:
  1. notebooklm-py[browser] + playwright chromium kur
  2. notebooklm login (CLI, browser açılır)
  3. Her wargame için notebook oluştur, .md kaynaklarını ekle
  4. ID'leri games/*.yaml ve config.json'a yaz

Çalıştırma:
  python scripts/setup_notebooks.py
  python scripts/setup_notebooks.py --game bandit
  python scripts/setup_notebooks.py --notebooks-only
"""

from __future__ import annotations
import argparse
import asyncio
import glob
import json
import os
import subprocess
import sys

import yaml
from rich.console import Console
from rich.panel import Panel
from rich import box

console = Console()

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAMES_DIR = os.path.join(REPO_ROOT, "games")
CONFIG_FILE = os.path.join(REPO_ROOT, "config.json")
LINUX_LEARNING = os.path.dirname(REPO_ROOT)

GAME_SOURCES: dict[str, tuple[list[str], str]] = {
    # Bandit: Temel Linux komutları yeterli.
    # SSH, dosya okuma, grep, find, base64, ROT13, netcat, git — hepsi linux_komutlari'nda.
    "bandit": (
        ["linux_komutlari"],
        "bandit",
    ),

    # Leviathan: Temel Linux bilgisi + SUID/ltrace/symlink teknikleri.
    # Leviathan walkthrough'unda grep ve cat kullanılıyor → linux_komutlari şart.
    "leviathan": (
        ["leviathan_komutlari", "linux_komutlari"],
        "leviathan",
    ),

    # Krypton: Kriptografi odaklı. base64, tr, grep ile şifre kırma → linux_komutlari gerekli.
    "krypton": (
        ["kriptografi", "linux_komutlari"],
        "krypton",
    ),

    # Natas: Web güvenliği. curl, base64, grep komut satırında kullanılıyor
    # (natas_11-20 ve natas_21-34'te curl ile HTTP istekleri, base64 decode, grep ile blind injection).
    # ag.md (curl, wget) ve metin_isleme.md (grep, base64) Natas için kritik.
    "natas": (
        ["web_guvenligi", "linux_komutlari"],
        "natas",
    ),

    # Narnia: Binary exploitation girişi. assembly, BOF, shellcode, NOP sled,
    # format string, return-to-libc, function pointer — hepsi 00-09 aralığında.
    # 10-19 (checksec, FSOP, ptrace…) narnia'da geçmiyor; notebook'u kirletmemek için dışarıda.
    "narnia": (
        ["binary_exploitation/0[0-9]*.md", "leviathan_komutlari", "linux_komutlari"],
        "narnia",
    ),

    # Behemoth: Orta seviye binary. BOF+shellcode, PATH hijack, format string+GOT,
    # symlink, UDP sniffing, mmap RWX (beh6 → 14_self_modifying), env-wipe BOF.
    # konu_anlatimlari/behemoth/ dizini yok; tüm konular binary_exploitation'da mevcut.
    "behemoth": (
        ["binary_exploitation", "leviathan_komutlari", "linux_komutlari"],
        "behemoth",
    ),

    # Utumno: İleri seviye binary. relative write (03), integer truncation (04,06 → 11),
    # strncpy null (05), setuid (00 → 19) — binary_exploitation 00-19 tamamı gerekli.
    # konu_anlatimlari/utumno/ ve behemoth/ dizinleri yok; tümü binary_exploitation'da.
    "utumno": (
        ["binary_exploitation", "leviathan_komutlari", "linux_komutlari"],
        "utumno",
    ),

    # Maze: Capstone — her seviye farklı teknik. lib hijacking (12), self-modifying (14),
    # setuid-p (19), ptrace (13), FSOP (16), ELF parser (15), format string (05).
    # Tüm binary_exploitation 00-19 gerekli.
    "maze": (
        ["binary_exploitation", "leviathan_komutlari", "linux_komutlari"],
        "maze",
    ),
}


# ── terminal helpers ──────────────────────────────────────────────────────────

def _step(msg: str) -> None:
    console.print(f"  [dim]►[/dim] {msg}", end="", highlight=False)

def _ok() -> None:
    console.print(" [green]✓[/green]")

def _fail(msg: str) -> None:
    console.print(f" [red]✗[/red]  {msg}")


# ── file helpers ──────────────────────────────────────────────────────────────

def _collect_md_files(game: str) -> list[str]:
    topic_dirs, ow_subdir = GAME_SOURCES[game]
    files: list[str] = []
    for subdir in topic_dirs:
        # glob pattern içeriyorsa (örn. "binary_exploitation/0[0-9]*.md") olduğu gibi kullan
        if "*" in subdir or "?" in subdir or "[" in subdir:
            pattern = os.path.join(LINUX_LEARNING, "konu_anlatimlari", subdir)
        else:
            pattern = os.path.join(LINUX_LEARNING, "konu_anlatimlari", subdir, "*.md")
        files.extend(sorted(glob.glob(pattern)))
    ow_pattern = os.path.join(LINUX_LEARNING, "overthewire", ow_subdir, "*.md")
    files.extend(sorted(glob.glob(ow_pattern)))
    return files

def _load_config() -> dict:
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE) as f:
            return json.load(f)
    return {"ai_mode": False, "notebooklm_notebooks": {}}

def _save_config(cfg: dict) -> None:
    with open(CONFIG_FILE, "w") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)

def _load_game_yaml(game: str) -> dict:
    path = os.path.join(GAMES_DIR, f"{game}.yaml")
    with open(path) as f:
        return yaml.safe_load(f)

def _save_notebook_id(game: str, notebook_id: str) -> None:
    yaml_path = os.path.join(GAMES_DIR, f"{game}.yaml")
    with open(yaml_path) as f:
        data = yaml.safe_load(f)
    data["notebooklm_notebook_id"] = notebook_id
    with open(yaml_path, "w") as f:
        yaml.dump(data, f, allow_unicode=True, default_flow_style=False)
    cfg = _load_config()
    cfg.setdefault("notebooklm_notebooks", {})[game] = notebook_id
    _save_config(cfg)

def _local_notebook_id(game: str) -> str:
    """games/<game>.yaml içindeki kayıtlı notebook ID'sini döndür (yoksa boş)."""
    try:
        return _load_game_yaml(game).get("notebooklm_notebook_id", "").strip()
    except FileNotFoundError:
        return ""

def _config_notebook_id(game: str) -> str:
    """config.json'da BU kullanıcının kaydettiği notebook ID (yoksa boş)."""
    cfg = _load_config()
    return cfg.get("notebooklm_notebooks", {}).get(game, "").strip()


def _owned_notebook_id(game: str) -> str:
    """
    Bu kullanıcıya ait güvenilir notebook ID.
    YAML'da olup config.json'da OLMAYAN ID = repoyla gelen başkasının ID'i,
    güvenilmez → boş döndür (yeniden oluşturulsun).
    Hem YAML hem config'de varsa veya sadece config'de varsa → güvenilir.
    """
    yaml_id = _local_notebook_id(game)
    config_id = _config_notebook_id(game)
    # config'de kayıtlı olan bu kullanıcının kendi oluşturduğu ID'dir
    if config_id:
        return config_id
    # config boş ama YAML dolu → repoyla gelen başkasının ID'i, güvenme
    return ""

def _notebook_exists(game: str) -> bool:
    return bool(_local_notebook_id(game))

def _mark_ready(notebooks_ready: bool = True) -> None:
    cfg = _load_config()
    cfg["ai_mode"] = True
    cfg["notebooks_ready"] = notebooks_ready
    _save_config(cfg)

def _nlm_bin() -> str:
    """venv içindeki notebooklm binary yolunu döndür."""
    from pathlib import Path
    return str(Path(sys.executable).parent / "notebooklm")

def _ask_authuser() -> None:
    """
    notebooklm auth inspect ile aktif hesapları göster,
    kullanıcıya hangisini seçeceğini sor ve config'e kaydet.
    """
    console.print("\n[bold]Google Hesabı Seçimi[/bold]")
    try:
        result = subprocess.run(
            [_nlm_bin(), "auth", "inspect"],
            capture_output=True, text=True, timeout=10,
        )
        if result.stdout.strip():
            console.print(result.stdout.strip())
        elif result.stderr.strip():
            console.print(f"[dim]{result.stderr.strip()}[/dim]")
    except (FileNotFoundError, subprocess.TimeoutExpired):
        console.print("[dim](hesap bilgisi alınamadı)[/dim]")

    console.print(
        "[dim]Birden fazla hesap varsa indeks girin (0 = ilk, 1 = ikinci, vb.) — genellikle 0[/dim]"
    )
    console.print("[dim]authuser [0]: [/dim]", end="")
    raw = input().strip()
    authuser = int(raw) if raw.isdigit() else 0
    cfg = _load_config()
    cfg["authuser"] = authuser
    _save_config(cfg)
    console.print(f"  [dim]authuser={authuser} kaydedildi.[/dim]\n")


# ── CLI helpers ───────────────────────────────────────────────────────────────

def _nlm_cmd() -> list[str]:
    """venv/bin/notebooklm yoksa PATH'tekini kullan."""
    venv_bin = os.path.join(REPO_ROOT, ".venv", "bin", "notebooklm")
    return [venv_bin] if os.path.isfile(venv_bin) else ["notebooklm"]

def _cli_on_path() -> bool:
    try:
        subprocess.run(_nlm_cmd() + ["--version"], capture_output=True, timeout=5)
        return True
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False

def _check_cli() -> bool:
    """Aktif bir oturumun var olup olmadığını doğrula."""
    try:
        result = subprocess.run(
            _nlm_cmd() + ["auth", "check", "--test", "--json"],
            capture_output=True, text=True, timeout=10,
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


# ── install steps ─────────────────────────────────────────────────────────────

def install_package() -> bool:
    _step("Paketler yükleniyor...")
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", "notebooklm-py[browser]", "-q"],
        capture_output=True, text=True,
    )
    if result.returncode == 0:
        _ok()
        return True
    _fail(result.stderr.strip().splitlines()[-1] if result.stderr else "hata")
    return False

def install_chromium() -> bool:
    _step("Chromium indiriliyor...")
    result = subprocess.run(
        [sys.executable, "-m", "playwright", "install", "chromium"],
        capture_output=True, text=True,
    )
    if result.returncode == 0:
        _ok()
        return True
    _fail(result.stderr.strip().splitlines()[-1] if result.stderr else "hata")
    return False

def login() -> bool:
    _step("notebooklm CLI kontrol ediliyor...")
    if not _cli_on_path():
        _fail("notebooklm komutu bulunamadı")
        console.print(
            "\n  [dim]Deneyin: [cyan]source .venv/bin/activate.fish[/cyan][/dim]\n"
        )
        return False
    _ok()

    while True:
        _step("Google girişi bekleniyor... [dim](tarayıcı açılacak)[/dim]")
        sys.stdout.flush()
        try:
            result = subprocess.run(_nlm_cmd() + ["login"])
        except FileNotFoundError:
            _fail("notebooklm komutu bulunamadı")
            return False

        if result.returncode != 0:
            _fail(f"login çıkış kodu: {result.returncode}")
        else:
            _step("Oturum doğrulanıyor...")
            if _check_cli():
                _ok()
                _ask_authuser()
                return True
            _fail("auth check başarısız")

        console.print("\n  [bold][1][/bold] Tekrar dene  [bold][2][/bold] İptal\n")
        console.print("[dim]Seçiminiz: [/dim]", end="")
        if input().strip() != "1":
            return False


# ── async notebook API ────────────────────────────────────────────────────────

async def _create_notebook_async(game: str) -> str | None:
    """
    NotebookLMClient async API ile notebook oluştur ve kaynakları ekle.
    Notebook ID döndürür, hata varsa None.
    """
    from notebooklm import NotebookLMClient  # type: ignore

    game_cfg = _load_game_yaml(game)
    sources = _collect_md_files(game)
    if not sources:
        console.print(f"  [yellow]⚠ {game}: .md dosyası bulunamadı, atlanıyor.[/yellow]")
        return None

    _step(f"{game_cfg['name']} notebook oluşturuluyor...")
    try:
        async with await NotebookLMClient.from_storage() as client:
            nb = await client.notebooks.create(f"Robin — {game_cfg['name']}")
            notebook_id: str = nb.id
        _ok()
    except Exception as e:
        _fail(f"{type(e).__name__}: {e}")
        raise  # _ensure_notebook'ta görünür hale gelsin

    _step(f"Kaynaklar yükleniyor ({len(sources)} dosya)...")
    failed: list[str] = []
    try:
        async with await NotebookLMClient.from_storage() as client:
            for path in sources:
                try:
                    await client.sources.add_file(notebook_id, path, wait=False)
                    await asyncio.sleep(1.0)
                except Exception as e:
                    failed.append(os.path.basename(path))
                    console.print(
                        f"\n    [dim]⚠ {os.path.basename(path)}: {e}[/dim]",
                        end="",
                    )
        if failed:
            console.print(
                f"\n  [yellow]⚠ {len(failed)}/{len(sources)} dosya yüklenemedi:[/yellow] "
                + ", ".join(failed)
            )
        else:
            _ok()
    except Exception as e:
        _fail(str(e))
        # Notebook oluştu, ID'yi yine de döndür

    return notebook_id


def create_notebook(game: str) -> str | None:
    """Sync wrapper — asyncio.run ile async API'yi çağırır."""
    return asyncio.run(_create_notebook_async(game))


async def _notebook_exists_remote_async(notebook_id: str) -> bool:
    try:
        from notebooklm import NotebookLMClient  # type: ignore
        async with await NotebookLMClient.from_storage() as client:
            notebooks = await client.notebooks.list()
            return any(nb.id == notebook_id for nb in notebooks)
    except Exception:
        return False


def notebook_exists_remote(notebook_id: str) -> bool:
    """Remote'da notebook_id gerçekten var mı kontrol et."""
    return asyncio.run(_notebook_exists_remote_async(notebook_id))


async def _list_remote_ids_async() -> set[str] | None:
    try:
        from notebooklm import NotebookLMClient  # type: ignore
        async with await NotebookLMClient.from_storage() as client:
            notebooks = await client.notebooks.list()
            return {nb.id for nb in notebooks}
    except Exception:
        return None


def list_remote_ids() -> set[str] | None:
    """
    NotebookLM'deki tüm notebook ID'lerini tek istekte döndür.
    None → uzaktan liste alınamadı (ağ/auth hatası) — yerel duruma güvenilmeli.
    """
    return asyncio.run(_list_remote_ids_async())


# ── main ──────────────────────────────────────────────────────────────────────

def run_full_setup(
    games: list[str] | None = None,
    skip_install: bool = False,
    skip_login: bool = False,
) -> bool:
    """
    Tam kurulum akışı. True → AI modu aktif.
    skip_install: paket/chromium adımını atla
    skip_login:   login adımını atla (oturum zaten açık)
    """
    console.print(
        Panel(
            "[bold]Robin — AI Kurulum[/bold]\n\n"
            "NotebookLM entegrasyonu yapılandırılıyor...",
            box=box.ROUNDED,
        )
    )

    if not skip_install:
        if not install_package():
            console.print("\n[red]Paket kurulumu başarısız. Hard mode'a geçiliyor.[/red]")
            return False
        if not install_chromium():
            console.print("\n[red]Chromium kurulumu başarısız. Hard mode'a geçiliyor.[/red]")
            return False
    else:
        console.print("  [dim]►[/dim] Paket kurulumu [dim](atlandı — zaten kurulu)[/dim]")

    if not skip_login:
        if not login():
            console.print("\n[yellow]Giriş iptal edildi. Hard mode ile devam ediliyor.[/yellow]")
            return False
    else:
        console.print("  [dim]►[/dim] Giriş [dim](atlandı — oturum aktif)[/dim]")

    # ── tüm wargame'ler için toplu notebook kontrolü ──────────────────────────
    all_games = list(GAME_SOURCES.keys())
    console.print(
        f"\n[bold]{len(all_games)} wargame için notebook kontrol ediliyor...[/bold]"
    )

    # Yerel ID kayıtlı olsa bile NotebookLM'de gerçekten duruyor mu doğrula.
    # None → uzaktan liste alınamadı; bu durumda yalnız yerel duruma güveniriz.
    remote_ids = list_remote_ids()
    if remote_ids is None:
        console.print(
            "  [dim](uzaktan notebook listesi alınamadı — yalnız yerel kayda güveniliyor)[/dim]"
        )

    existing = 0
    created = 0
    for game in all_games:
        local_id = _owned_notebook_id(game)
        # Yerel ID var ve (uzaktan doğrulanamıyorsa kabul, doğrulanıyorsa listede ise) → mevcut
        if local_id and (remote_ids is None or local_id in remote_ids):
            console.print(f"  [dim]►[/dim] {game}: zaten var [green]✓[/green]")
            existing += 1
            continue
        if local_id:  # kayıtlı ama NotebookLM'de bulunamadı (silinmiş)
            console.print(
                f"  [dim]►[/dim] {game}: NotebookLM'de bulunamadı, yeniden oluşturuluyor..."
            )
        else:
            console.print(f"  [dim]►[/dim] {game}: oluşturuluyor...")
        try:
            nb_id = create_notebook(game)
        except Exception as e:
            console.print(f"    [red]✗ {game} atlandı: {type(e).__name__}: {e}[/red]")
            continue
        if nb_id:
            _save_notebook_id(game, nb_id)
            created += 1
        else:
            console.print(f"    [yellow]⚠ {game}: notebook oluşturulamadı, atlanıyor.[/yellow]")

    ready_count = existing + created
    notebooks_ready = ready_count > 0
    _mark_ready(notebooks_ready=notebooks_ready)

    if not notebooks_ready:
        console.print(
            "\n[yellow]⚠ Hiçbir notebook hazır değil. "
            "Oyun seçilince tekrar denenecek.[/yellow]\n"
        )
    elif ready_count == len(all_games):
        console.print(
            f"\n[green]✓ Tüm notebook'lar hazır.[/green] "
            f"({created} yeni, {existing} mevcut)\n"
        )
    else:
        console.print(
            f"\n[green]✓ {ready_count}/{len(all_games)} notebook hazır.[/green] "
            f"({created} yeni, {existing} mevcut)\n"
        )
    return True


# ── CLI entry point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Robin NotebookLM kurulum betiği")
    parser.add_argument("--game", choices=list(GAME_SOURCES.keys()),
                        help="Sadece bu oyun için notebook oluştur")
    parser.add_argument("--notebooks-only", action="store_true",
                        help="Kurulum/login atla, sadece notebook oluştur")
    args = parser.parse_args()

    games_arg = [args.game] if args.game else None

    if args.notebooks_only:
        targets = games_arg or list(GAME_SOURCES.keys())
        console.print(f"[bold]Notebook oluşturma ({', '.join(targets)}):[/bold]")
        for g in targets:
            if _owned_notebook_id(g):
                console.print(f"  [dim]► {g}: zaten var, atlanıyor.[/dim]")
                continue
            nb_id = create_notebook(g)
            if nb_id:
                _save_notebook_id(g, nb_id)
        _mark_ready()
    else:
        sys.exit(0 if run_full_setup(games_arg) else 1)
