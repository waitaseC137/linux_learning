#!/usr/bin/env bash
# index.html + assets/*  ->  tek dosya (telefona atmak icin)
# Kullanim: ./paketle.sh    ->  _tek-dosya/cekirdek-ip-bellegi-tek-dosya.html
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p _tek-dosya
python3 - <<'PY'
import re, pathlib
root = pathlib.Path('.')
html = (root / 'index.html').read_text(encoding='utf-8')
css  = (root / 'assets/style.css').read_text(encoding='utf-8')
js   = (root / 'assets/rope.js').read_text(encoding='utf-8')

before = html
html = html.replace(
    '<link rel="stylesheet" href="assets/style.css">',
    '<style>\n' + css + '\n</style>')
assert html != before, 'style.css baglantisi bulunamadi'

before = html
html = html.replace(
    '<script src="assets/rope.js"></script>',
    '<script>\n' + js + '\n</script>')
assert html != before, 'rope.js baglantisi bulunamadi'

assert 'assets/' not in html, 'geriye assets/ referansi kaldi'

out = root / '_tek-dosya/cekirdek-ip-bellegi-tek-dosya.html'
out.write_text(html, encoding='utf-8')
print(f'{out}  ({out.stat().st_size/1024:.0f} KB)')
PY
