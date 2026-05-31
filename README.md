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
    ├── leviathan/
    │   └── leviathan_0-7.md   # ltrace, gdb, symlink, privilege escalation
    └── krypton/
        └── krypton_0-6.md     # Base64, ROT13, Caesar, frekans analizi, Vigenère, stream cipher
```

---

## 🎮 OverTheWire

[OverTheWire](https://overthewire.org/wargames/), Linux ve güvenlik becerilerini **oyun formatında** öğreten ücretsiz bir platform. Her wargame farklı bir konuya odaklanıyor.

### 🏴 Bandit — Linux Temelleri

Mutlak başlangıç noktası. Komut satırını hiç kullanmamış biri bile buradan başlayabilir.

| Dosya | Konular | Level'lar |
|---|---|---|
| [bandit_0-10.md](./overthewire/bandit/bandit_0-10.md) | SSH, dosya okuma, find, grep, sort, uniq, strings | 0 → 10 |
| [bandit_11-20.md](./overthewire/bandit/bandit_11-20.md) | Base64, ROT13, hexdump, sıkıştırma, netcat, SSL, nmap, SUID | 11 → 20 |
| [bandit_21-33.md](./overthewire/bandit/bandit_21-33.md) | Cron, bash scripting, brute force, vim escape, git, shell variables | 21 → 33 |

### 🐙 Leviathan — Tersine Mühendisliğe Giriş

Bandit'ten sonra gelen ilk adım. Binary analizi, sembolik linkler ve privilege escalation öğreniliyor.

| Dosya | Konular | Level'lar |
|---|---|---|
| [leviathan_0-7.md](./overthewire/leviathan/leviathan_0-7.md) | ltrace, strings, gdb, symlink, TOCTOU, binary→ASCII | 0 → 7 |

### 🔐 Krypton — Kriptografiye Giriş

Klasik şifreleme yöntemlerini öğrenip nasıl kırılacaklarını görüyorsun.

| Dosya | Konular | Level'lar |
|---|---|---|
| [krypton_0-6.md](./overthewire/krypton/krypton_0-6.md) | Base64, ROT13, Caesar, frekans analizi, Vigenère, stream cipher | 0 → 6 |

---

## 🛠️ Nasıl Kullanılır?

1. [OverTheWire](https://overthewire.org/wargames/) sitesine gir
2. Level sayfasındaki görevi oku
3. Önce **kendi başına dene** — takılırsan buraya bak
4. Çözümü okurken "neden?" sorusunu sormayı unutma

> Şifreler zaman zaman değişebilir. Bu rehberlerde yöntem anlatılıyor, şifreler paylaşılmıyor.

---

## 📚 Kaynaklar

### OverTheWire
- [OverTheWire Wargames](https://overthewire.org/wargames/) — Oyunların ana sitesi
- [Bandit Walkthrough — MayADevBe](https://mayadevbe.me/posts/overthewire/bandit/overview/)
- [Leviathan Walkthrough — MayADevBe](https://mayadevbe.me/posts/overthewire/leviathan/overview/)
- [Krypton Walkthrough — MayADevBe](https://mayadevbe.me/tags/krypton/) (Level 0-5)
- [Krypton Walkthrough — LearnHacking.io](https://learnhacking.io/overthewire-krypton-levels-0-9/) (Level 6 dahil)

### Linux Referans
- [Linux Man Pages](https://manpages.ubuntu.com/) — Her komutun resmi dokümantasyonu
- [Explain Shell](https://explainshell.com/) — Komutları ve bayrakları görsel olarak açıklar
- [Linux Komutlarına Giriş](https://manpages.ubuntu.com/manpages/noble/man1/intro.1.html)

### Kriptografi
- [CyberChef](https://gchq.github.io/CyberChef/) — Her türlü encoding/decoding
- [dCode.fr](https://www.dcode.fr/) — Şifre analiz araçları (Vigenère, frekans analizi)
- [Cryptii](https://cryptii.com/) — Klasik şifreler
- [Base64 — Wikipedia](https://en.wikipedia.org/wiki/Base64)
- [ROT13 — Wikipedia](https://en.wikipedia.org/wiki/ROT13)
- [Vigenère Cipher — Wikipedia](https://en.wikipedia.org/wiki/Vigen%C3%A8re_cipher)
- [Kasiski Sınaması — Wikipedia](https://en.wikipedia.org/wiki/Kasiski_examination)
- [Frekans Analizi — Wikipedia](https://en.wikipedia.org/wiki/Frequency_analysis)
- [Dosya İmzaları Listesi](https://en.wikipedia.org/wiki/List_of_file_signatures) — Magic number'lar
- [ASCII Tablosu](https://www.asciitable.com/)

### Encoding & Sıkıştırma
- [Base64 — Wikipedia](https://en.wikipedia.org/wiki/Base64)

### Tersine Mühendislik
- [GDB Cheat Sheet](https://darkdust.net/files/GDB%20Cheat%20Sheet.pdf)
- [Intel vs AT&T Assembly Syntax](https://imada.sdu.dk/u/kslarsen/dm546/Material/IntelnATT.htm)
- [Ghidra](https://ghidra-sre.org/) — NSA'nın açık kaynak tersine mühendislik aracı

### Ağ
- [Nmap Resmi Site](https://nmap.org/)
- [OpenSSL Dokümantasyon](https://www.openssl.org/docs/)

### Git
- [Git Resmi Dokümantasyon](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)

---

*Repo büyümeye devam ediyor — katkı ve önerilere açık.*
