#!/usr/bin/env bash
#
# sync-docs.sh — docs/ içerik aynasını KAYNAKTAN yeniden üretir.
#
# Neden var? Repo'da içerik iki yerde tutuluyor:
#   - Kaynak (kanonik):  konu_anlatimlari/  +  overthewire/
#   - Yayın aynası:       docs/konu_anlatimlari/  +  docs/overthewire/
# Elle iki yeri güncellemeye çalışmak sürüklenmeye (drift) yol açıyordu
# (eski TOCTOU metni, "suncuya" yazım hatası, docs'a hiç eklenmeyen 00a...).
# Bu script kaynağı TEK GERÇEK kabul edip docs aynasını birebir eşitler.
#
# DOKUNULMAYANLAR (site kabuğu ve çeviri — bunlar kaynaktan türemiyor):
#   docs/*.html · docs/assets/** · docs/.nojekyll · docs/eng/**
#
# Kullanım:  bash scripts/sync-docs.sh   (repo kökünden veya herhangi bir yerden)
# CI (.github/workflows/docs-sync-check.yml) bunu çalıştırıp docs/ değişiyorsa
# hata verir → "senkronu unuttun" uyarısı.

set -euo pipefail

# Repo kökü (bu script scripts/ altında)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Aynalanacak içerik dizinleri (kaynak → docs)
DIRS=(konu_anlatimlari overthewire)

for d in "${DIRS[@]}"; do
  if [[ ! -d "$d" ]]; then
    echo "HATA: kaynak dizin yok: $d" >&2
    exit 1
  fi
  mkdir -p "docs/$d"
  # --delete: docs'ta olup kaynakta olmayanı sil (birebir ayna)
  # Not: leviathan dahil TÜM wargame'ler artık per-level; özel durum yok.
  rsync -a --delete \
    --exclude='.DS_Store' \
    --exclude='.gitkeep' \
    "$d/" "docs/$d/"
  echo "  ✓ docs/$d  ←  $d"
done

echo "docs/ içerik aynası kaynakla eşitlendi."
echo "(Site kabuğu docs/*.html · docs/assets · docs/eng dokunulmadı — onlar kaynaktan türemez.)"
