# 🎮 OverTheWire War Games

> [OverTheWire](https://overthewire.org/wargames/), Linux ve güvenlik becerilerini
> **oyun formatında** öğreten ücretsiz bir platform. Her war game için
> level-by-level çözüm rehberleri.

> 📖 Komut ve kavram açıklamaları için → **[Konu Anlatımları](../konu_anlatimlari/KONU_ANLATIMLARI.md)**

---

## 🗺️ Önerilen Sıra

```
Bandit  →  Leviathan  →  Krypton  →  Narnia  →  Behemoth  →  Utumno  →  Maze
(temel)    (RE giriş)    (kripto)    (binary)   (orta)       (ileri)     (karma/capstone)

Natas — web güvenliği, ayrı dal olarak istediğin zaman
```

| Wargame | Zorluk | Level | Odak |
|---|---|---|---|
| [Bandit](#-bandit--linux-temelleri) | 1/10 | 34 | Linux terminal temelleri |
| [Leviathan](#-leviathan--tersine-mühendisliğe-giriş) | 3/10 | 8 | Binary analizi, privilege escalation |
| [Krypton](#-krypton--kriptografiye-giriş) | 3/10 | 7 | Klasik şifreleme |
| [Natas](#-natas--web-güvenliğine-giriş) | 4/10 | 35 | Web güvenliği |
| [Narnia](#-narnia--binary-exploitationa-giriş) | 6/10 | 10 | Buffer overflow, shellcode |
| [Behemoth](#-behemoth--orta-seviye-binary-exploitation) | 7/10 | 9 | PATH hijack, format string, symlink, UDP, BOF |
| [Utumno](#-utumno--ileri-seviye-binary-exploitation) | 9/10 | 9 | Keyfi yazma, integer bug'ları, jmp_buf/PTR_MANGLE |
| [Maze](#-maze--karma-binary-exploitation--re) | 5/10 | 9 | TOCTOU, lib hijack, self-modifying, FSOP, ELF parser, format string |

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
| [narnia 0 -> 1.md](./narnia/narnia%200%20-%3E%201.md) | Stack buffer overflow, değişken değiştirme | 0 → 1 |
| [narnia 1 -> 2.md](./narnia/narnia%201%20-%3E%202.md) | Shellcode, ortam değişkeni, EIP kontrolü | 1 → 2 |
| [narnia 2 -> 3.md](./narnia/narnia%202%20-%3E%203.md) | Buffer overflow, shellcode injection | 2 → 3 |
| [narnia 3 -> 4.md](./narnia/narnia%203%20-%3E%204.md) | TOCTOU, symlink, race condition | 3 → 4 |
| [narnia 4 -> 5.md](./narnia/narnia%204%20-%3E%205.md) | Buffer overflow, NOP sled, shellcode | 4 → 5 |
| [narnia 5 -> 6.md](./narnia/narnia%205%20-%3E%206.md) | Format string, bellek okuma/yazma | 5 → 6 |
| [narnia 6 -> 7.md](./narnia/narnia%206%20-%3E%207.md) | Heap, fonksiyon pointer overwrite | 6 → 7 |
| [narnia 7 -> 8.md](./narnia/narnia%207%20-%3E%208.md) | Return-to-libc | 7 → 8 |
| [narnia 8 -> 9.md](./narnia/narnia%208%20-%3E%209.md) | İleri seviye format string, arbitrary write | 8 → 9 |

---

## 👾 Behemoth — Orta Seviye Binary Exploitation

Dinamik analiz, PATH hijack, sembolik link, ağ sniffing, format string ve gelişmiş buffer overflow. Kaynak kodu **olmadan** binary'leri tersine mühendislikle çözmek.

> ⚠️ 32-bit (x86) Linux, ASLR kapalı, executable stack. Şifreler md'lerde gizli (`**********`).

| Dosya | Konu / Teknik | Level'lar |
|---|---|---|
| [behemoth 0 -> 1.md](./behemoth/behemoth%200%20-%3E%201.md) | `ltrace` ile gömülü şifre (`strcmp`) | 0 → 1 |
| [behemoth 1 -> 2.md](./behemoth/behemoth%201%20-%3E%202.md) | `gets()` overflow → env shellcode (offset 71) | 1 → 2 |
| [behemoth 2 -> 3.md](./behemoth/behemoth%202%20-%3E%203.md) | PATH hijack (`system("touch %d")`) | 2 → 3 |
| [behemoth 3 -> 4.md](./behemoth/behemoth%203%20-%3E%204.md) | Format string → `puts@GOT` overwrite | 3 → 4 |
| [behemoth 4 -> 5.md](./behemoth/behemoth%204%20-%3E%205.md) | `/tmp/<pid>` symlink (pid pencere brute) | 4 → 5 |
| [behemoth 5 -> 6.md](./behemoth/behemoth%205%20-%3E%206.md) | UDP sniffing (`localhost:1337`) | 5 → 6 |
| [behemoth 6 -> 7.md](./behemoth/behemoth%206%20-%3E%207.md) | `mmap`-exec shellcode.txt, 0x0b filtresi, strcmp kapısı | 6 → 7 |
| [behemoth 7 -> 8.md](./behemoth/behemoth%207%20-%3E%208.md) | Env-wipe + kısmi karakter kontrolü → argv[2] shellcode | 7 → 8 |

---

## 🕳️ Utumno — İleri Seviye Binary Exploitation

Execute-only binary okuma, kasıtlı shellcode exec, `getchar` keyfi-yazma primitifi, integer truncation, signed bounds bypass ve `jmp_buf` + PTR_MANGLE bypass. Serinin en derin tekniklerini içerir.

> 📌 **Başlamadan önce oku:** [00 - Utumno - BAŞLAMADAN ÖNCE OKUYUNUZ.md](./utumno/00%20-%20Utumno%20-%20BAŞLAMADAN%20ÖNCE%20OKUYUNUZ.md) — gereken ön bilgi & konu rehberi.
>
> ⚠️ 32-bit (x86) Linux, ASLR kapalı, executable stack. Şifreler md'lerde gizli (`**********`).

| Dosya | Konu / Teknik | Level'lar |
|---|---|---|
| [utumno 0 -> 1.md](./utumno/utumno%200%20-%3E%201.md) | Execute-only binary'i bellekten okuma (LD_PRELOAD dump) | 0 → 1 |
| [utumno 1 -> 2.md](./utumno/utumno%201%20-%3E%202.md) | Dosya adı = shellcode (RWX buffer, ret-overwrite) | 1 → 2 |
| [utumno 2 -> 3.md](./utumno/utumno%202%20-%3E%203.md) | Stack overflow + `argc=0` hilesi (`argv[10]=envp`) + env shellcode | 2 → 3 |
| [utumno 3 -> 4.md](./utumno/utumno%203%20-%3E%204.md) | `getchar` keyfi-yazma primitifi → byte-byte ret ezme | 3 → 4 |
| [utumno 4 -> 5.md](./utumno/utumno%204%20-%3E%205.md) | Integer truncation (16-bit kontrol vs 32-bit `memcpy`) | 4 → 5 |
| [utumno 5 -> 6.md](./utumno/utumno%205%20-%3E%206.md) | `strncpy` null-eklemeyen overflow (tam 4-byte ret) | 5 → 6 |
| [utumno 6 -> 7.md](./utumno/utumno%206%20-%3E%207.md) | Signed bounds bypass + `×4` wraparound → keyfi yazma | 6 → 7 |
| [utumno 7 -> 8.md](./utumno/utumno%207%20-%3E%208.md) | `jmp_buf` overflow + PTR_MANGLE bypass (ebp-pivot) | 7 → 8 |

---

## 🌀 Maze — Karma Binary Exploitation & RE

Tek bir kalıbı değil, **her seviyede bambaşka bir zafiyet sınıfını** işleyen karma bir lab.
TOCTOU yarışından FILE-yapısı sömürüsüne, self-modifying koddan format string'e kadar
serinin tüm tekniklerini bir araya getirir — bu yüzden 5/10 puanına rağmen **Behemoth +
Utumno sonrası** capstone olarak en sona konuldu.

> 📌 **Başlamadan önce oku:** [00 - Maze - BAŞLAMADAN ÖNCE OKUYUNUZ.md](./maze/00%20-%20Maze%20-%20BAŞLAMADAN%20ÖNCE%20OKUYUNUZ.md) — gereken ön bilgi & konu rehberi.
>
> ⚠️ 32-bit (x86) Linux, ASLR kapalı, **No RELRO**; NX/canary seviyeye göre değişir (her seviyede `checksec`). Şifreler md'lerde gizli (`**********`).

| Dosya | Konu / Teknik | Level'lar |
|---|---|---|
| [maze 0 -> 1.md](./maze/maze%200%20-%3E%201.md) | TOCTOU yarışı — `access()`/`open()` symlink takası | 0 → 1 |
| [maze 1 -> 2.md](./maze/maze%201%20-%3E%202.md) | Library hijack — göreli `./libc.so.4`, constructor'lı sahte `.so` | 1 → 2 |
| [maze 2 -> 3.md](./maze/maze%202%20-%3E%203.md) | Exec stack — buffer'ı fonksiyon çağırma, env shellcode + NOP sled | 2 → 3 |
| [maze 3 -> 4.md](./maze/maze%203%20-%3E%204.md) | Self-modifying code — `mprotect` RWX + XOR decrypt, sihirli `0x1337c0de` | 3 → 4 |
| [maze 4 -> 5.md](./maze/maze%204%20-%3E%205.md) | `execv` doğrulama bypass — setuid script + `#!/bin/sh -p` | 4 → 5 |
| [maze 5 -> 6.md](./maze/maze%205%20-%3E%206.md) | Keygen RE + `ptrace(TRACEME)` anti-debug (auto-continue tracer) | 5 → 6 |
| [maze 6 -> 7.md](./maze/maze%206%20-%3E%207.md) | FSOP — `fp` overwrite → sahte `FILE` → `fprintf` ile `GOT[exit]` write | 6 → 7 |
| [maze 7 -> 8.md](./maze/maze%207%20-%3E%208.md) | ELF parser overflow — güvenilmeyen `e_shentsize` → ret2env | 7 → 8 |
| [maze 8 -> 9.md](./maze/maze%208%20-%3E%209.md) | Format string — `snprintf(buf,n,user)` → `%n` → `GOT[strlen]=system` | 8 → 9 |


---

## 🛠️ Nasıl Kullanılır?

1. [OverTheWire](https://overthewire.org/wargames/) sitesine gir
2. Level sayfasındaki görevi oku
3. Önce **kendi başına dene** — takılırsan buraya bak
4. Bir komut veya kavram için [Konu Anlatımları](../konu_anlatimlari/KONU_ANLATIMLARI.md)'na bak

> Şifreler zaman zaman değişebilir. Bu rehberlerde yöntem anlatılıyor, şifreler paylaşılmıyor.
