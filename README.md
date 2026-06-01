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
    ├── krypton/
    │   └── krypton_0-6.md     # Base64, ROT13, Caesar, frekans analizi, Vigenère, stream cipher
    ├── natas/
    │   ├── natas_0-10.md      # HTML kaynak, cookies, LFI, command injection
    │   ├── natas_11-20.md     # XOR, file upload, SQLi, blind SQLi, session brute-force
    │   └── natas_21-34.md     # Deserialization, ECB, Perl RCE, type juggling
    └── narnia/
        └── narnia_0-8.md      # Buffer overflow, shellcode, format string, return-to-libc
```

---

## 🎮 OverTheWire

[OverTheWire](https://overthewire.org/wargames/), Linux ve güvenlik becerilerini **oyun formatında** öğreten ücretsiz bir platform.

### 🏴 Bandit — Linux Temelleri
Mutlak başlangıç noktası. Komut satırını hiç kullanmamış biri bile buradan başlayabilir.

| Dosya | Konular | Level'lar |
|---|---|---|
| [bandit_0-10.md](./overthewire/bandit/bandit_0-10.md) | SSH, dosya okuma, find, grep, sort, uniq, strings | 0 → 10 |
| [bandit_11-20.md](./overthewire/bandit/bandit_11-20.md) | Base64, ROT13, hexdump, sıkıştırma, netcat, SSL, nmap, SUID | 11 → 20 |
| [bandit_21-33.md](./overthewire/bandit/bandit_21-33.md) | Cron, bash scripting, brute force, vim escape, git, shell variables | 21 → 33 |

### 🐙 Leviathan — Tersine Mühendisliğe Giriş
Binary analizi, sembolik linkler ve privilege escalation.

| Dosya | Konular | Level'lar |
|---|---|---|
| [leviathan_0-7.md](./overthewire/leviathan/leviathan_0-7.md) | ltrace, strings, gdb, symlink, TOCTOU, binary→ASCII | 0 → 7 |

### 🔐 Krypton — Kriptografiye Giriş
Klasik şifreleme yöntemlerini öğrenip nasıl kırılacaklarını görüyorsun.

| Dosya | Konular | Level'lar |
|---|---|---|
| [krypton_0-6.md](./overthewire/krypton/krypton_0-6.md) | Base64, ROT13, Caesar, frekans analizi, Vigenère, stream cipher | 0 → 6 |

### 🌐 Natas — Web Güvenliğine Giriş
34 level boyunca web güvenliğinin temellerini öğreniyorsun — HTML'den Perl RCE'ye kadar.

| Dosya | Konular | Level'lar |
|---|---|---|
| [natas_0-10.md](./overthewire/natas/natas_0-10.md) | HTML kaynak, robots.txt, cookie, LFI, command injection | 0 → 10 |
| [natas_11-20.md](./overthewire/natas/natas_11-20.md) | XOR kırma, web shell, SQLi, blind SQLi, session brute-force | 11 → 20 |
| [natas_21-34.md](./overthewire/natas/natas_21-34.md) | Deserialization, ECB, Perl RCE, type juggling, truncation | 21 → 34 |

### 💥 Narnia — Binary Exploitation'a Giriş
C programlarındaki açıkları exploit etmeyi öğreniyorsun. Assembly ve GDB bilgisi gerekli.

| Dosya | Konular | Level'lar |
|---|---|---|
| [narnia_0-8.md](./overthewire/narnia/narnia_0-8.md) | Buffer overflow, shellcode, EIP kontrolü, format string, return-to-libc | 0 → 8 |

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
- [OverTheWire Wargames](https://overthewire.org/wargames/)
- [Bandit Walkthrough — MayADevBe](https://mayadevbe.me/posts/overthewire/bandit/overview/)
- [Leviathan Walkthrough — MayADevBe](https://mayadevbe.me/posts/overthewire/leviathan/overview/)
- [Krypton Walkthrough — MayADevBe](https://mayadevbe.me/tags/krypton/) (0-5)
- [Krypton Level 6 — LearnHacking.io](https://learnhacking.io/overthewire-krypton-levels-0-9/)
- [Natas Walkthrough — MayADevBe](https://mayadevbe.me/tags/natas/) (0-6)
- [Natas 6-10 — LearnHacking.io](https://learnhacking.io/overthewire-natas-walkthrough-levels-6-10/)
- [Natas 7-13 — JamesCao](https://jameskaois.com/posts/overthewire-natas-level-7-13/)
- [Natas 14-20 — JamesCao](https://jameskaois.com/posts/overthewire-natas-level-14-20/)
- [Natas 21-24 — JamesCao](https://jameskaois.com/posts/overthewire-natas-level-21-24/)
- [Narnia Full Writeup — cplusperks.com](https://cplusperks.com/narnia/)
- [Narnia 0-4 — HackMD](https://hackmd.io/@Chivato/B112H_I18)

### Linux Referans
- [Linux Man Pages](https://manpages.ubuntu.com/)
- [Explain Shell](https://explainshell.com/)

### Web Güvenliği
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [MDN HTTP Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP)

### Binary Exploitation
- [LiveOverflow — Binary Exploitation](https://www.youtube.com/playlist?list=PLhixgUqwRTjxglIswKp9mpkfPNfHkzyeN)
- [Shell-storm.org Shellcodes](http://shell-storm.org/shellcode/)
- [GDB Cheat Sheet](https://darkdust.net/files/GDB%20Cheat%20Sheet.pdf)
- [Format String Exploits](http://codearcana.com/posts/2013/05/02/introduction-to-format-string-exploits.html)
- [Ghidra](https://ghidra-sre.org/)
- [Intel vs AT&T Assembly Syntax](https://imada.sdu.dk/u/kslarsen/dm546/Material/IntelnATT.htm)

### Kriptografi
- [CyberChef](https://gchq.github.io/CyberChef/)
- [dCode.fr](https://www.dcode.fr/)
- [Vigenère Cipher — Wikipedia](https://en.wikipedia.org/wiki/Vigen%C3%A8re_cipher)
- [ECB Mode Weakness](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#ECB)
- [ASCII Tablosu](https://www.asciitable.com/)
- [Dosya İmzaları](https://en.wikipedia.org/wiki/List_of_file_signatures)

### Git
- [Git Resmi Dokümantasyon](https://git-scm.com/doc)

---

*Repo büyümeye devam ediyor — katkı ve önerilere açık.*
