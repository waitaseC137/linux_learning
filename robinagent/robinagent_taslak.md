# 🐱 Robin Agent — Proje Taslağı

> Maskot: Robin (kedi)
> Giriş noktası: `python robinagent.py`

---

## Kullanıcı Akışı (Tam)

```
python robinagent.py
        │
        ▼
┌─────────────────────────────────┐
│       WELCOME EKRANI            │
│  Robin maskot ASCII art         │
│  Projenin ne olduğu açıklaması  │
│  NotebookLM nedir / ne yapar    │
│                                 │
│  [1] AI destekli başla          │
│      (notebooklm-py kurulur)    │
│  [2] Hard mode — AI yok         │
└─────────────────────────────────┘
        │                │
   AI seçti         Hard mode
        │                │
        ▼                ▼
  NLM kurulum       Direkt wargame
  (pip + login)       seçimine git
        │
        ▼
┌─────────────────────────────────┐
│      WARGAME SEÇİMİ             │
│  [1] Bandit    (Linux temelleri)│
│  [2] Leviathan (Binary analiz)  │
│  [3] Krypton   (Kriptografi)    │
│  [4] Natas     (Web güvenliği)  │
│  [5] Narnia    (Binary exploit) │
│  [6] Behemoth  (Orta exploit)   │
│  [7] Utumno    (İleri exploit)  │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│     OYUN AÇIKLAMASI             │
│  Ne öğretir, zorluk, seviye sayısı│
│  Ön koşullar listesi            │
│                                 │
│  [1] /repo  → GitHub'da oku     │
│  [2] /ask   → AI ile öğren      │
│  [3] Başla  → SSH aç            │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│     SSH TERMİNAL                │
│  Otomatik bağlanır              │
│  Kullanıcı oynuyor...           │
│                                 │
│  Şifreyi buldu:                 │
│  "Şifreyi kaydetmeyi unutma!"   │
│   → /save <şifre>              │
│                                 │
│  Sonraki level için:            │
│  "Şifreyi gir, geçeyim"         │
│   → Şifreyi yaz → SSH açılır   │
└─────────────────────────────────┘
```

---

## Komutlar (SSH içindeyken)

| Komut | Ne yapar |
|---|---|
| `/ask <soru>` | NotebookLM'e sor, cevap terminale gelir |
| `/hint` | Spoilersız küçük ipucu |
| `/repo` | İlgili konu anlatımının GitHub linkini ver |
| `/level` | Mevcut level bilgisi + bağlantı komutu |
| `/save <şifre>` | Şifreyi progress.json'a kaydet |
| `/progress` | Tüm wargame'lerdeki ilerleme özeti |
| `/next` | Sonraki level için şifre sor, SSH aç |

---

## Klasör Yapısı

```
robinagent/
│
├── robinagent.py              # Ana giriş — buradan çalışır
│
├── core/
│   ├── ssh_manager.py         # pexpect SSH bağlantısı
│   ├── notebooklm_bridge.py   # notebooklm-py wrapper (/ask)
│   ├── progress.py            # progress.json okuma/yazma
│   └── command_handler.py     # /ask /hint /repo /save /next ...
│
├── ui/
│   ├── welcome.py             # Welcome ekranı + NLM kurulum akışı
│   ├── game_select.py         # Wargame seçimi
│   ├── game_intro.py          # Oyun açıklaması + ön koşullar
│   └── terminal.py            # SSH terminal (Textual veya raw pty)
│
├── games/
│   ├── bandit.yaml
│   ├── leviathan.yaml
│   ├── krypton.yaml
│   ├── natas.yaml
│   ├── narnia.yaml
│   ├── behemoth.yaml
│   └── utumno.yaml
│
├── content/                   # linux_learning reposundan symlink/kopyala
│   ├── konu_anlatimlari/
│   └── overthewire/
│
├── scripts/
│   └── setup_notebooks.py     # NLM notebook oluştur + md dosyaları yükle
│
├── progress.json              # .gitignore'da
├── config.json                # NLM notebook id'leri, ayarlar
├── requirements.txt
└── README.md
```

---

## games/bandit.yaml (Örnek)

```yaml
name: Bandit
description: Linux terminal becerilerini öğreten başlangıç wargame'i
difficulty: 1/10
levels: 34
host: bandit.labs.overthewire.org
port: 2220
user_prefix: bandit        # bandit0, bandit1, ...
pass_file: /etc/bandit_pass/bandit{level}
start_password: bandit0
prereqs:
  - Hiç yok — sıfırdan başlayabilirsin
topics:
  - SSH, dosya okuma, grep, sort, find, netcat
repo_url: https://github.com/<kullanici>/linux_learning/tree/main/overthewire/bandit
notebooklm_notebook_id: ""    # kullanıcı kurulumda doldurur
```

---

## progress.json (Örnek)

```json
{
  "bandit": {
    "current_level": 5,
    "passwords": {
      "0": "bandit0",
      "1": "ZjLjTmM6FvvyRnrb2rfNWOZOTa6ip5If",
      "2": "263JQ...",
      "5": "bulduğun şifre"
    }
  },
  "leviathan": {
    "current_level": 0,
    "passwords": {}
  }
}
```

---

## Bağımlılıklar (requirements.txt)

```
textual          # TUI framework
pexpect          # SSH otomasyon
rich             # güzel terminal çıktıları
pyyaml           # games/*.yaml okuma
notebooklm-py    # AI entegrasyon (opsiyonel, kullanıcı seçerse)
```

---
