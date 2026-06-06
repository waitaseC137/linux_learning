"""
games/*.yaml oyun tanımlarının YAPISINI doğrular.

İçeriğin doğruluğunu değil, uygulamanın çalışması için GEREKEN alanların
var olduğunu ve doğru tipte olduğunu kontrol eder. Yeni bir wargame eklerken
bir alanı unutursan ya da dosya adını yanlış koyarsan burası yakalar.
"""
import glob
import os

import pytest
import yaml

# Bu dosya robinagent/tests/ içinde → bir üst klasör robinagent/
ROOT = os.path.dirname(os.path.dirname(__file__))
GAMES_DIR = os.path.join(ROOT, "games")
YAML_DOSYALARI = sorted(glob.glob(os.path.join(GAMES_DIR, "*.yaml")))

# Hem SSH hem web tabanlı oyunların ortak kullandığı zorunlu alanlar
GEREKLI_ALANLAR = {
    "name": str,
    "host": str,
    "port": int,
    "user_prefix": str,
    "levels": int,
}


def _yukle(yol):
    with open(yol) as f:
        return yaml.safe_load(f)


def test_en_az_bir_oyun_tanimi_var():
    assert YAML_DOSYALARI, "games/ klasöründe hiç .yaml dosyası bulunamadı"


@pytest.mark.parametrize("yol", YAML_DOSYALARI, ids=lambda p: os.path.basename(p))
def test_gerekli_alanlar_var_ve_dogru_tipte(yol):
    cfg = _yukle(yol)
    ad = os.path.basename(yol)
    for alan, tip in GEREKLI_ALANLAR.items():
        assert alan in cfg, f"{ad} → '{alan}' alanı eksik"
        # bool, int'in alt sınıfıdır; port/levels'ın gerçekten sayı olmasını isteriz
        assert not isinstance(cfg[alan], bool), f"{ad} → '{alan}' bool olamaz"
        assert isinstance(cfg[alan], tip), (
            f"{ad} → '{alan}' {tip.__name__} olmalı, "
            f"{type(cfg[alan]).__name__} bulundu"
        )


@pytest.mark.parametrize("yol", YAML_DOSYALARI, ids=lambda p: os.path.basename(p))
def test_dosya_adi_oyun_adiyla_eslesiyor(yol):
    # Kod oyunu name.lower() ile YAML'a eşliyor → dosya adı buna uymalı
    cfg = _yukle(yol)
    stem = os.path.splitext(os.path.basename(yol))[0]
    assert cfg["name"].lower() == stem, (
        f"{os.path.basename(yol)} → name '{cfg['name']}' "
        f"dosya adı '{stem}' ile uyuşmuyor"
    )


@pytest.mark.parametrize("yol", YAML_DOSYALARI, ids=lambda p: os.path.basename(p))
def test_port_gecerli_aralikta(yol):
    cfg = _yukle(yol)
    assert 1 <= cfg["port"] <= 65535, (
        f"{os.path.basename(yol)} → port aralık dışı: {cfg['port']}"
    )
