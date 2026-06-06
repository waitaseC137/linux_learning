"""
core/progress.py için birim testler.

Önemli: her test gerçek progress.json dosyasına DOKUNMAZ. monkeypatch ile
PROGRESS_FILE geçici bir dosyaya yönlendirilir; böylece testler hem birbirinden
izole olur hem de senin asıl ilerlemeni bozmaz.
"""
import json

import pytest

import core.progress as progress

TUM_OYUNLAR = {
    "bandit", "leviathan", "krypton", "natas",
    "narnia", "behemoth", "utumno",
}


@pytest.fixture
def temiz_progress(tmp_path, monkeypatch):
    """progress.py'yi geçici, boş bir dosyayla çalışacak şekilde ayarla."""
    sahte_dosya = tmp_path / "progress.json"
    monkeypatch.setattr(progress, "PROGRESS_FILE", str(sahte_dosya))
    return progress


def test_dosya_yokken_varsayilanlar_doner(temiz_progress):
    veri = temiz_progress.load()
    assert set(veri) == TUM_OYUNLAR
    # bandit level 0'da ve başlangıç şifresi hazır olmalı
    assert veri["bandit"]["current_level"] == 0
    assert veri["bandit"]["passwords"]["0"] == "bandit0"


def test_sifre_kaydet_ve_oku(temiz_progress):
    temiz_progress.save_password("narnia", 1, "gizli-sifre")
    assert temiz_progress.get_password("narnia", 1) == "gizli-sifre"


def test_kaydedilmemis_sifre_none_doner(temiz_progress):
    assert temiz_progress.get_password("narnia", 7) is None


def test_sifre_kaydetmek_leveli_ilerletir(temiz_progress):
    temiz_progress.save_password("behemoth", 3, "abc")
    assert temiz_progress.get_current_level("behemoth") == 3


def test_geri_level_kaydetmek_ilerlemeyi_dusurmez(temiz_progress):
    temiz_progress.save_password("behemoth", 5, "ust")
    temiz_progress.save_password("behemoth", 2, "alt")
    # 5'teyken 2'yi kaydetmek current_level'i 5'te tutmalı (geri gitmemeli)
    assert temiz_progress.get_current_level("behemoth") == 5
    # ama level 2'nin şifresi yine de okunabilmeli
    assert temiz_progress.get_password("behemoth", 2) == "alt"


def test_save_ve_load_ayni_veriyi_korur(temiz_progress):
    temiz_progress.save_password("krypton", 1, "k1")
    temiz_progress.save_password("krypton", 2, "k2")
    veri = temiz_progress.load()
    assert veri["krypton"]["passwords"]["1"] == "k1"
    assert veri["krypton"]["passwords"]["2"] == "k2"


def test_eksik_oyun_load_sirasinda_tamamlanir(temiz_progress):
    # İçinde sadece bandit olan eski/eksik bir dosya yaz
    eksik = {"bandit": {"current_level": 4, "passwords": {"0": "bandit0"}}}
    with open(temiz_progress.PROGRESS_FILE, "w") as f:
        json.dump(eksik, f)
    veri = temiz_progress.load()
    # var olan veri korunmalı
    assert veri["bandit"]["current_level"] == 4
    # eksik oyunlar varsayılandan tamamlanmalı
    assert TUM_OYUNLAR <= set(veri)
    assert veri["utumno"]["current_level"] == 0


def test_summary_sifre_sayisini_dogru_verir(temiz_progress):
    temiz_progress.save_password("natas", 1, "a")
    temiz_progress.save_password("natas", 2, "b")
    ozet = temiz_progress.summary()
    assert ozet["natas"]["passwords_saved"] == 2
    assert ozet["natas"]["current_level"] == 2


def test_load_varsayilanlari_bozmaz(temiz_progress):
    """
    load() ile gelen veriyi değiştirmek, bir sonraki load()'u etkilememeli.
    (Bu test, deepcopy düzeltmesi olmadan KIRMIZI olur — düzeltmenin bekçisi.)
    """
    d1 = temiz_progress.load()
    d1["narnia"]["passwords"]["99"] = "kirli"
    d2 = temiz_progress.load()  # dosya hâlâ yok → yeni, temiz yükleme
    assert "99" not in d2["narnia"]["passwords"]
