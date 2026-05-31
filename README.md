# 🐧 linux_learning

> Linux'u öğrenmek için topladığım kaynaklar, notlar ve çözümler.  
> Oyun oynayarak, deneye yanıla, terminal ekranına bakarak.

---

## 📁 İçerik

```
linux_learning/
└── overthewire/
    ├── bandit/
    │   ├── bandit_0-10.md     # SSH, cat, ls, find, grep, sort, uniq, strings
    │   ├── bandit_11-20.md    # Base64, ROT13, hexdump, sıkıştırma, netcat, nmap
    │   └── bandit_21-33.md    # Cron, bash scripting, brute force, git, shell escape
    └── leviathan/
        └── leviathan_0-7.md   # ltrace, gdb, symlink, privilege escalation
```

---

## 🎮 OverTheWire

[OverTheWire](https://overthewire.org/wargames/), Linux terminal becerilerini **oyun formatında** öğreten ücretsiz bir platform. Her wargame farklı bir konuya odaklanıyor.

### 🏴 Bandit — Linux Temelleri

Mutlak başlangıç noktası. Komut satırını hiç kullanmamış biri bile buradan başlayabilir.

| Dosya | Konular | Level'lar |
|---|---|---|
| [bandit_0-10.md](./overthewire/bandit/bandit_0-10.md) | SSH, dosya okuma, find, grep, sort, uniq, strings | 0 → 10 |
| [bandit_11-20.md](./overthewire/bandit/bandit_11-20.md) | Base64, ROT13, hexdump, sıkıştırma, netcat, SSL, nmap, SUID | 11 → 20 |
| [bandit_21-33.md](./overthewire/bandit/bandit_21-33.md) | Cron, bash scripting, brute force, vim escape, git, shell variables | 21 → 33 |

### 🐙 Leviathan — Tersine Mühendisliğe Giriş

Bandit'ten sonra gelen ilk adım. Programlama bilgisi gerekmiyor — binary analizi, sembolik linkler ve privilege escalation öğreniliyor.

| Dosya | Konular | Level'lar |
|---|---|---|
| [leviathan_0-7.md](./overthewire/leviathan/leviathan_0-7.md) | ltrace, strings, gdb, symlink, TOCTOU, binary→ASCII | 0 → 7 |

---

## 🛠️ Nasıl Kullanılır?

1. [OverTheWire](https://overthewire.org/wargames/) sitesine gir
2. Level sayfasındaki görevi oku
3. Önce **kendi başına dene** — takılırsan buraya bak
4. Çözümü okurken "neden?" sorusunu sormayı unutma

> Şifreler zaman zaman değişebilir. Bu rehberlerde yöntem anlatılıyor, şifreler paylaşılmıyor.

---

## 📌 Kaynaklar

- [OverTheWire Wargames](https://overthewire.org/wargames/)
- [MayADevBe Blog — Full Walkthroughs](https://mayadevbe.me/posts/overthewire/bandit/overview/)
- [Explain Shell](https://explainshell.com/) — Komutları görsel açıklar
- [Linux Man Pages](https://manpages.ubuntu.com/)

---

*Repo büyümeye devam ediyor — katkı ve önerilere açık.*
