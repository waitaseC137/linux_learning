# 🎮 OverTheWire War Games

> [OverTheWire](https://overthewire.org/wargames/), Linux ve güvenlik becerilerini
> **oyun formatında** öğreten ücretsiz bir platform. Her war game için
> level-by-level çözüm rehberleri.

> 📖 Komut ve kavram açıklamaları için → **[Konu Anlatımları](../konu_anlatimlari/KONU_ANLATIMLARI.md)**

---

## 🗺️ Önerilen Sıra

```
Bandit  →  Leviathan  →  Krypton  →  Narnia  →  Behemoth  →  Utumno
(temel)    (RE giriş)    (kripto)    (binary)   (orta)       (ileri)

Natas — web güvenliği, ayrı dal olarak istediğin zaman
```

| Wargame | Zorluk | Level | Odak |
|---|---|---|---|
| [Bandit](#-bandit--linux-temelleri) | 1/10 | 34 | Linux terminal temelleri |
| [Leviathan](#-leviathan--tersine-mühendisliğe-giriş) | 3/10 | 8 | Binary analizi, privilege escalation |
| [Krypton](#-krypton--kriptografiye-giriş) | 3/10 | 7 | Klasik şifreleme |
| [Natas](#-natas--web-güvenliğine-giriş) | 4/10 | 35 | Web güvenliği |
| [Narnia](#-narnia--binary-exploitationa-giriş) | 6/10 | 10 | Buffer overflow, shellcode |
| [Behemoth](#-behemoth--orta-seviye-binary-exploitation) | 7/10 | 9 | Race condition, gelişmiş BOF |
| [Utumno](#-utumno--ileri-seviye-binary-exploitation) | 9/10 | 8 | GOT/PLT, format string write |

---

## 🏴 Bandit — Linux Temelleri

Mutlak başlangıç noktası. Komut satırını hiç kullanmamış biri bile buradan başlayabilir.

| Dosya | Konular | Level'lar |
|---|---|---|
| [bandit_0-10.md](./bandit/bandit_0-10.md) | SSH, dosya okuma, find, grep, sort, uniq, strings | 0 → 10 |
| [bandit_11-20.md](./bandit/bandit_11-20.md) | Base64, ROT13, hexdump, sıkıştırma, netcat, SSL, nmap, SUID | 11 → 20 |
| [bandit_21-33.md](./bandit/bandit_21-33.md) | Cron, bash scripting, brute force, vim escape, git, shell variables | 21 → 33 |

---

## 🐙 Leviathan — Tersine Mühendisliğe Giriş

Binary analizi, sembolik linkler ve privilege escalation. Bir binary'nin içini `ltrace` ile okumak, `gdb` ile assembly'e bakmak, symlink ile sistemi kandırmak.

| Dosya | Konular | Level'lar |
|---|---|---|
| [leviathan_0-7.md](./leviathan/leviathan_0-7.md) | ltrace, strings, gdb, symlink, TOCTOU, binary→ASCII | 0 → 7 |

---

## 🔐 Krypton — Kriptografiye Giriş

Klasik şifreleme yöntemlerini öğrenip nasıl kırılacaklarını görüyorsun. Base64'ten stream cipher'a kadar.

| Dosya | Konular | Level'lar |
|---|---|---|
| [krypton_0-6.md](./krypton/krypton_0-6.md) | Base64, ROT13, Caesar, frekans analizi, Vigenère, stream cipher | 0 → 6 |

---

## 🌐 Natas — Web Güvenliğine Giriş

35 level boyunca web güvenliğinin temellerini öğreniyorsun — HTML'den Perl RCE'ye kadar.

| Dosya | Konular | Level'lar |
|---|---|---|
| [natas_0-10.md](./natas/natas_0-10.md) | HTML kaynak, robots.txt, cookie, LFI, command injection | 0 → 10 |
| [natas_11-20.md](./natas/natas_11-20.md) | XOR kırma, web shell, SQLi, blind SQLi, session brute-force | 11 → 20 |
| [natas_21-34.md](./natas/natas_21-34.md) | Deserialization, ECB, Perl RCE, type juggling, truncation | 21 → 34 |

---

## 💥 Narnia — Binary Exploitation'a Giriş

C programlarındaki açıkları exploit etmeyi öğreniyorsun. Stack ve heap yapısını, EIP kontrolünü, shellcode yazmayı, format string saldırılarını ve return-to-libc tekniğini adım adım öğreten bir lab.

> ⚠️ **Not:** Narnia 32-bit (x86) Linux sistemde çalışır. 64-bit sistemlerden farklı davranışlar gözlemlenebilir.

| Dosya | Konular | Level'lar |
|---|---|---|
| [narnia_0-8.md](./narnia/narnia_0-8.md) | Buffer overflow, shellcode, EIP kontrolü, TOCTOU, format string, fonksiyon pointer, return-to-libc | 0 → 8 |

---

## 👾 Behemoth — Orta Seviye Binary Exploitation

Dinamik analiz, race condition, ağ sniffing ve gelişmiş buffer overflow teknikleri. Kaynak kodu olmadan binary'leri anlamak, PID tahmin saldırıları ve şifresiz ağ trafiğini yakalamak.

| Dosya | Konular | Level'lar |
|---|---|---|
| [behemoth_walkthrough.md](./behemoth/behemoth_walkthrough.md) | Dinamik analiz, race condition, UDP sniffing, gelişmiş buffer overflow | 0 → 7 |

---

## 🕳️ Utumno — İleri Seviye Binary Exploitation

Pointer manipülasyonu, GOT/PLT yazma, argv BOF ve format string arbitrary write. Leviathan/Behemoth'tan bir adım daha derin — Narnia ile paralel gidilebilir.

| Dosya | Konular | Level'lar |
|---|---|---|
| [utumno_walkthrough.md](./utumno/utumno_walkthrough.md) | Pointer manipülasyonu, GOT/PLT overwrite, argv BOF, format string, sembolik link | 0 → 7 |

---

## 🛠️ Nasıl Kullanılır?

1. [OverTheWire](https://overthewire.org/wargames/) sitesine gir
2. Level sayfasındaki görevi oku
3. Önce **kendi başına dene** — takılırsan buraya bak
4. Bir komut veya kavram için [Konu Anlatımları](../konu_anlatimlari/KONU_ANLATIMLARI.md)'na bak
5. Otomatik SSH + AI destekli çözüm için kök dizindeki **🐱 Robin Agent**'ı kullan

> Şifreler zaman zaman değişebilir. Bu rehberlerde yöntem anlatılıyor, şifreler paylaşılmıyor.
