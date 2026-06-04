# 🐱 Robin Agent — Proje Taslağı

> Maskot: Robin (kedi)
> Giriş noktası: `python robinagent.py` → otomatik olarak **`robin`** adlı tmux oturumuna geçer
> Canlı durum (tamamlanan / devam eden / bilinen sorunlar) için: `robinagent/CLAUDE.md`

---

## Kullanıcı Akışı (Tam)

```
python robinagent.py
        │  (TMUX yoksa "robin" oturumu açılır, mouse on)
        ▼
┌─────────────────────────────────┐
│       WELCOME EKRANI            │
│  Robin maskot ASCII art         │
│  Proje + NotebookLM açıklaması  │
│                                 │
│  [1] AI destekli başla          │
│  [2] Hard mode — AI yok         │
└─────────────────────────────────┘
        │                │
   [1] AI mode      [2] Hard mode
        │                │
        ▼                │
  NotebookLM kurulum     │
  + login + notebook     │
  kontrolü (toplu)       │
        │                │
        └────────┬───────┘
                 ▼
┌─────────────────────────────────┐
│      WARGAME SEÇİMİ             │
│  Bandit · Leviathan · Krypton   │
│  Narnia · Behemoth · Utumno     │
│  Natas  (web — ayrı, SSH yok)   │
└─────────────────────────────────┘
                 ▼
┌─────────────────────────────────┐
│      OYUN AÇIKLAMASI            │
│  Açıklama · zorluk · level sayısı│
│  Ön koşullar                    │
│                                 │
│  /repo  → GitHub konu anlatımı  │
│  /ask   → AI'ye sor (AI modda)  │
│  Başla  → SSH / (Natas: tarayıcı)│
└─────────────────────────────────┘
                 ▼
        web_based ?
          │      └── evet ──►  Tarayıcıda aç: http://natasN.natas.labs...
          │                     (SSH YOK, Enter ile geri dön)
        hayır
          ▼
┌──────────────────────────┬──────────────────────────┐
│   SOL PANE (tmux)        │   SAĞ PANE (tmux)         │
│   SSH oturumu            │   Robin Chat              │
│   bandit0@bandit.labs... │   "Soru:" → NotebookLM    │
│   kullanıcı oynuyor...   │   cevabı panelde gelir    │
│                          │   ('exit' ile kapanır)    │
│   / komutları aktif      │                           │
└──────────────────────────┴──────────────────────────┘
                 │
   Şifreyi buldun  →  /save <şifre>   (bir sonraki level olarak kaydedilir)
                 │
   /next veya level atlayınca  →  SSH otomatik yeniden bağlanır
```

---

## TMUX Düzeni

Robin Agent **tmux içinde** çalışır (`robinagent.py` gerekirse otomatik başlatır).

- **Sol pane:** SSH oturumu — wargame sunucusuna bağlanırsın, normal terminal gibi oynarsın. `/` ile başlayan komutlar burada `command_handler` tarafından yakalanır.
- **Sağ pane:** Robin Chat (`robin_chat.py`) — AI moddaysan açılır. `Soru:` satırına yazdığın her şey ilgili oyunun NotebookLM notebook'una gider, cevap panelde görünür. (Burada `/ask` yazmana gerek yok, doğrudan soruyu yaz.)

Natas seçilirse SSH/pane akışı yok — sadece tarayıcı linki verilir.

---

## Komutlar

| Komut | Nerede | Ne yapar |
|---|---|---|
| `/repo` | Oyun ekranı + SSH | İlgili konu anlatımının GitHub linkini verir |
| `/ask <soru>` | Oyun ekranı (AI modda) | O oyun hakkında NotebookLM'e sorar |
| *(soruyu yaz)* | Sağ Robin Chat paneli | NotebookLM ile serbest soru-cevap |
| `/hint` | SSH | Spoilersız genel ipucu (man, `--help`, level açıklaması) |
| `/level` | SSH | Mevcut oyun + level bilgisi |
| `/save <şifre>` | SSH | Bulduğun şifreyi **bir sonraki** level olarak `progress.json`'a kaydeder |
| `/progress` | SSH | Oyundaki level + kaydedilen şifre sayısı |
| `/next` | SSH | Bir sonraki levele geçer (SSH yeniden bağlanır) |
| `/notebook` | SSH | Notebook durumunu teşhis eder, gerekirse oluşturur |

---

## Klasör Yapısı

```
robinagent/                    ← çalışma dizini  (giriş: python robinagent.py)
│
├── robinagent.py              # Ana giriş — "robin" tmux oturumunu otomatik açar
├── CLAUDE.md                  # Proje hafızası (canlı durum burada)
├── config.json                # runtime: ai_mode, notebook ID'leri, notebooks_ready
├── progress.json              # level + şifre takibi  (.gitignore'da)
├── requirements.txt
│
├── core/
│   ├── ssh_manager.py         # pexpect/pty ile SSH bağlantısı + level döngüsü
│   ├── notebooklm_bridge.py   # NotebookLM wrapper (ask, is_available)
│   ├── progress.py            # progress.json oku/yaz, şifre kaydet
│   └── command_handler.py     # SSH içindeki / komutları
│
├── ui/
│   ├── welcome.py             # açılış ekranı + mod seçimi + sağ chat panelini açar
│   ├── game_select.py         # wargame listesi (Textual)
│   ├── game_intro.py          # oyun detayı + /repo · /ask · Başla menüsü
│   ├── robin_chat.py          # sağ tmux panelinde soru-cevap UI
│   └── robin_art.py           # Robin ASCII art + ortak Textual CSS
│
├── games/                     # her oyun için YAML tanımı
│   ├── bandit.yaml   leviathan.yaml   krypton.yaml
│   ├── narnia.yaml   behemoth.yaml    utumno.yaml
│   └── natas.yaml             # web_based: true  (SSH yok)
│
└── scripts/
    └── setup_notebooks.py     # NotebookLM kurulum + notebook oluşturma/yükleme

# Ortak kaynaklar üst dizinde (robinagent/ İÇİNDE DEĞİL):
linux_learning/
├── konu_anlatimlari/          → NotebookLM kaynak .md dosyaları
├── overthewire/               → walkthrough notları
├── graphify-out/              → Obsidian bilgi grafiği çıktısı
└── CLAUDE.md                  → ruflo (claude-flow) konfigürasyonu
```

> Not: Taslağın eski sürümündeki `ui/terminal.py` ve `robinagent/content/` **yok**.
> SSH artık `ssh_manager.py` + tmux paneli ile, kaynaklar ise üst dizinden okunuyor.

---

## Wargame İlerlemesi (Güçlük Sırası)

```
Bandit (1/10, 34 lvl)  →  Leviathan (3/10, 8 lvl)  →  Krypton (3/10, 7 lvl)
   →  Narnia (6/10, 10 lvl)  →  Behemoth (7/10, 9 lvl)  →  Utumno (9/10, 8 lvl)

Natas (4/10, 35 lvl) — web tabanlı, AYRI branch (tarayıcıda oynanır, SSH yok)
```

---

## games/bandit.yaml (Gerçek Örnek)

```yaml
name: Bandit
description: Linux terminal becerilerini öğreten başlangıç wargame'i. SSH, dosya
  okuma, izinler ve temel araçları öğrenirsin.
difficulty: 1/10
host: bandit.labs.overthewire.org
port: 2220
levels: 34
user_prefix: bandit            # bandit0, bandit1, ...
start_password: bandit0
prereqs:
  - Hiç yok — sıfırdan başlayabilirsin
topics:
  - SSH
  - Dosya okuma (cat, less, file)
  - grep, sort, uniq, strings
  - find, locate
  - Base64, ROT13
  - Netcat, OpenSSL
  - Git
repo_url: https://github.com/waitaseC137/linux_learning/tree/main/overthewire/bandit
notebooklm_notebook_id: c4a9405e-...   # setup sonrası dolar (_save_notebook_id ile)
```

**Natas farkı** (web tabanlı oyunlarda):

```yaml
name: Natas
host: natas{level}.natas.labs.overthewire.org   # {level} runtime'da değişir
port: 80
start_password: ''
web_based: true                                  # SSH açma — tarayıcı linki ver
```

---

## progress.json (Gerçek Örnek)

```json
{
  "bandit": {
    "current_level": 4,
    "passwords": {
      "0": "bandit0",
      "1": "ZjLjTmM6FvvyRnrb2rfNWOZOTa6ip5If",
      "2": "263JGJPfgU6LtdEvgfWU1XP5yac29mFx",
      "3": "MNk8KNH3Usiio41PRUEoDFPqfxLPlSmx",
      "4": "2WmrDFRmJIq3IPxneAaMGhap0pFhF3NJ"
    }
  },
  "leviathan": { "current_level": 0, "passwords": {} },
  "krypton":   { "current_level": 0, "passwords": {} },
  "natas":     { "current_level": 0, "passwords": {} },
  "narnia":    { "current_level": 0, "passwords": {} },
  "behemoth":  { "current_level": 0, "passwords": {} },
  "utumno":    { "current_level": 0, "passwords": {} }
}
```

---

## config.json (Gerçek Örnek)

```json
{
  "ai_mode": true,
  "notebooklm_notebooks": {
    "bandit":    "c4a9405e-...",
    "leviathan": "68b85bca-...",
    "krypton":   "bb6df6f1-...",
    "natas":     "92dd6e8f-...",
    "narnia":    "5ad47720-...",
    "behemoth":  "d24dfff5-...",
    "utumno":    "f9528ecc-..."
  },
  "notebooks_ready": true
}
```

> Notebook ID'leri hem `config.json`'a hem ilgili `games/*.yaml`'a `_save_notebook_id()` ile yazılır. Doğrudan YAML'a yazma.

---

## Bağımlılıklar (requirements.txt)

```
textual          # TUI framework (welcome, game_select, game_intro)
pexpect          # SSH otomasyon (ssh_manager)
rich             # güzel terminal çıktıları + Robin Chat paneli
pyyaml           # games/*.yaml okuma
# notebooklm-py  # opsiyonel — AI modu için: pip install notebooklm-py[browser]
```

> Sistem gereksinimi: **tmux** (split panel için), Python 3.14, AI modda Playwright Chromium.

---