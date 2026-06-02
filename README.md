# 🐧 linux_learning

> Linux'u öğrenmek için topladığım kaynaklar, notlar ve çözümler.  
> Oyun oynayarak, deneye yanıla, terminal ekranına bakarak.

---

## 📁 Dosya Yapısı

```
linux_learning/
├── konu_anlatimlari/
│   ├── linux_komutlari/
│   │   ├── dosya_sistemi.md       # pwd, ls, cd, cat, file, find, mkdir, cp, mv, touch, du
│   │   ├── metin_isleme.md        # grep, sort, uniq, strings, cut, tr, diff, echo, md5sum, wc
│   │   ├── sikistirma_encoding.md # base64, xxd, gzip, bzip2, tar, zip
│   │   ├── ag.md                  # ssh, scp, nc, openssl, nmap, curl, wget
│   │   ├── izinler_kullanici.md   # chmod, chown, whoami, SUID/SGID, sudo
│   │   ├── surec_shell.md         # pipe, yönlendirme, &, değişkenler, for, bash script
│   │   └── git.md                 # clone, log, show, branch, checkout, tag, push
│   ├── leviathan_komutlari/
│   │   ├── dosya_izinleri_suid.md            # chmod, find -perm, SUID, privilege escalation
│   │   ├── binary_analizi.md                 # file, strings, xxd, od, binary→ASCII
│   │   ├── ltrace_strace.md                  # ltrace, strace, strcmp, fopen, access, system
│   │   ├── sembolik_linkler.md               # ln -s, readlink, TOCTOU açığı
│   │   ├── gdb.md                            # disassemble, breakpoint, register, bellek
│   │   └── brute_force_bash.md               # for döngüsü, koşullar, PIN brute force
│   ├── web_guvenligi/
│   │   ├── 01_html_kaynak_ve_devtools.md     # HTML kaynak, Developer Tools
│   │   ├── 02_http_protokolu.md              # HTTP istek/cevap, metodlar, header'lar
│   │   ├── 03_robots_ve_dizin_kesfi.md       # robots.txt, dizin keşfi
│   │   ├── 04_cookie_manipulasyonu.md        # Cookie yapısı, manipülasyon
│   │   ├── 05_php_kaynak_kodu.md             # PHP kaynak okuma, include
│   │   ├── 06_encoding_ve_obfuscation.md     # Base64, hex, URL encoding
│   │   ├── 07_command_injection.md           # Command injection temelleri
│   │   ├── 08_lfi_ve_path_traversal.md       # LFI, path traversal
│   │   ├── 09_xor_sifrelemesi.md             # XOR, known-plaintext saldırısı
│   │   ├── 10_dosya_yukleme_bypass.md        # File upload bypass
│   │   ├── 11_sql_injection.md               # SQL injection temelleri
│   │   ├── 12_blind_sql_injection.md         # Blind SQLi
│   │   ├── 13_command_injection_ileri.md     # İleri command injection, filtre aşma
│   │   ├── 14_session_brute_force.md         # Session ID brute-force, tahmin edilebilir token
│   │   ├── 15_session_ve_newline_injection.md # PHP session manipülasyonu, newline injection
│   │   ├── 16_http_redirect_bypass.md        # HTTP yönlendirme bypass, 302 öncesi içerik okuma
│   │   ├── 17_php_type_juggling.md           # PHP type juggling, loose comparison
│   │   ├── 18_php_object_injection.md        # PHP object injection, deserialization, magic method
│   │   ├── 19_sql_truncation.md              # SQL truncation, VARCHAR kesme, kullanıcı taklit
│   │   ├── 20_ecb_mode_zafiyeti.md           # ECB mode zafiyeti, blok kesme/yapıştırma
│   │   ├── 21_perl_rce.md                    # Perl open() injection, RCE, pipe karakteri
│   │   ├── 22_perl_cgi_param_bypass.md       # Perl CGI param() array bypass, DBI quote() atlatma
│   │   ├── 23_log_poisoning.md               # Log poisoning, User-Agent injection, LFI + PHP RCE
│   │   └── 24_phar_deserialization.md        # Phar deserialization, phar:// wrapper, LFI RCE
│   ├── kriptografi/
│   │   └── krypton_komutlar_ve_kavramlar.md  # wc, sort -nr, tr -cd, Caesar, Vigenère, XOR
│   └── binary_exploitation/
│       ├── 00_x86_assembly_temelleri.md      # Register'lar, komutlar, stack, CALL/RET, calling convention
│       ├── 00b_gdb_ile_assembly_okumak.md    # Assembly→C çevirme, kalıplar, GDB komut referansı
│       ├── 01_bellek_ve_memory_layout.md     # Stack yapısı, değişken komşuluğu, buffer overflow mantığı
│       ├── 02_little_endian.md               # Byte sırası, adres dönüşümü, struct.pack
│       ├── 03_eip_register_kontrolu.md       # CALL/RET mekanizması, offset hesabı, cyclic pattern
│       ├── 04_shellcode_ve_nop_sled.md       # Shellcode, NOP sled, env var adresi, ;cat hilesi
│       ├── 05_format_string.md               # %x ile bellek sızdırma, %n ile yazma, %hn
│       ├── 06_return_to_libc_ve_fonksiyon_pointer.md  # NX bypass, system()+exit()+/bin/sh, fp manipülasyonu
│       └── 07_sembolik_link.md               # Symlink, TOCTOU, race condition exploit
└── overthewire/
    ├── bandit/
    │   ├── bandit_0-10.md         # SSH, cat, ls, find, grep, sort, uniq, strings
    │   ├── bandit_11-20.md        # Base64, ROT13, hexdump, sıkıştırma, netcat, nmap
    │   └── bandit_21-33.md        # Cron, bash scripting, brute force, git, shell escape
    ├── leviathan/
    │   └── leviathan_0-7.md       # ltrace, gdb, symlink, privilege escalation
    ├── krypton/
    │   └── krypton_0-6.md         # Base64, ROT13, Caesar, frekans analizi, Vigenère, stream cipher
    ├── natas/
    │   ├── natas_0-10.md          # HTML kaynak, cookies, LFI, command injection
    │   ├── natas_11-20.md         # XOR, file upload, SQLi, blind SQLi, session brute-force
    │   └── natas_21-34.md         # Deserialization, ECB, Perl RCE, type juggling
    └── narnia/
        └── narnia_0-8.md          # Buffer overflow, shellcode, format string, return-to-libc
```

---

## 📚 Konu Anlatımları

Komutların ve kavramların war game bağımsız, referans olarak tutulduğu dosyalar.

### 🖥️ Linux Komutları

| Dosya | Komutlar |
|---|---|
| [dosya_sistemi.md](./konu_anlatimlari/linux_komutlari/dosya_sistemi.md) | `pwd` `ls` `cd` `cat` `file` `find` `mkdir` `cp` `mv` `touch` `mktemp` `du` |
| [metin_isleme.md](./konu_anlatimlari/linux_komutlari/metin_isleme.md) | `grep` `sort` `uniq` `strings` `cut` `tr` `diff` `echo` `md5sum` `wc` `head` `tail` |
| [sikistirma_encoding.md](./konu_anlatimlari/linux_komutlari/sikistirma_encoding.md) | `base64` `xxd` `gzip` `bzip2` `tar` `zip` |
| [ag.md](./konu_anlatimlari/linux_komutlari/ag.md) | `ssh` `scp` `nc` `openssl` `nmap` `curl` `wget` |
| [izinler_kullanici.md](./konu_anlatimlari/linux_komutlari/izinler_kullanici.md) | `chmod` `chown` `whoami` `id` `su` `sudo` `groups` `SUID/SGID` |
| [surec_shell.md](./konu_anlatimlari/linux_komutlari/surec_shell.md) | `\|` `>` `>>` `&` `jobs` `fg` `$()` `for` `alias` `export` |
| [git.md](./konu_anlatimlari/linux_komutlari/git.md) | `git clone` `log` `show` `branch` `checkout` `tag` `add` `commit` `push` |

### 🔬 Binary Analizi ve Tersine Mühendislik

| Dosya | Komutlar / Kavramlar |
|---|---|
| [dosya_izinleri_suid.md](./konu_anlatimlari/leviathan_komutlari/dosya_izinleri_suid.md) | `chmod` `find -perm` `whoami` `SUID` privilege escalation |
| [binary_analizi.md](./konu_anlatimlari/leviathan_komutlari/binary_analizi.md) | `file` `strings` `xxd` `od` binary→ASCII |
| [ltrace_strace.md](./konu_anlatimlari/leviathan_komutlari/ltrace_strace.md) | `ltrace` `strace` `strcmp` `fopen` `access` `system` |
| [sembolik_linkler.md](./konu_anlatimlari/leviathan_komutlari/sembolik_linkler.md) | `ln -s` `readlink` TOCTOU açığı |
| [gdb.md](./konu_anlatimlari/leviathan_komutlari/gdb.md) | `disassemble` `break` `run` `info registers` `x` `print/d` |
| [brute_force_bash.md](./konu_anlatimlari/leviathan_komutlari/brute_force_bash.md) | `for` döngüsü koşullar PIN brute force |

### 🌐 Web Güvenliği

| Dosya | Konular |
|---|---|
| [01_html_kaynak_ve_devtools.md](./konu_anlatimlari/web_guvenligi/01_html_kaynak_ve_devtools.md) | HTML kaynak kodu, Developer Tools, gizli alanlar |
| [02_http_protokolu.md](./konu_anlatimlari/web_guvenligi/02_http_protokolu.md) | HTTP istek/cevap yapısı, metodlar, header'lar |
| [03_robots_ve_dizin_kesfi.md](./konu_anlatimlari/web_guvenligi/03_robots_ve_dizin_kesfi.md) | robots.txt, dizin keşfi, gizli yollar |
| [04_cookie_manipulasyonu.md](./konu_anlatimlari/web_guvenligi/04_cookie_manipulasyonu.md) | Cookie yapısı, manipülasyon, güvenlik bayrakları |
| [05_php_kaynak_kodu.md](./konu_anlatimlari/web_guvenligi/05_php_kaynak_kodu.md) | PHP kaynak kodu okuma, include, açık kaynak analizi |
| [06_encoding_ve_obfuscation.md](./konu_anlatimlari/web_guvenligi/06_encoding_ve_obfuscation.md) | Base64, hex, URL encoding, obfuscation teknikleri |
| [07_command_injection.md](./konu_anlatimlari/web_guvenligi/07_command_injection.md) | Command injection, `;` `|` `$()` ile komut zincirleme |
| [08_lfi_ve_path_traversal.md](./konu_anlatimlari/web_guvenligi/08_lfi_ve_path_traversal.md) | LFI, path traversal, `../` ile dizin atlama |
| [09_xor_sifrelemesi.md](./konu_anlatimlari/web_guvenligi/09_xor_sifrelemesi.md) | XOR şifreleme, known-plaintext saldırısı |
| [10_dosya_yukleme_bypass.md](./konu_anlatimlari/web_guvenligi/10_dosya_yukleme_bypass.md) | Dosya yükleme bypass, MIME type, uzantı manipülasyonu |
| [11_sql_injection.md](./konu_anlatimlari/web_guvenligi/11_sql_injection.md) | SQL injection temelleri, `' OR 1=1`, UNION saldırısı |
| [12_blind_sql_injection.md](./konu_anlatimlari/web_guvenligi/12_blind_sql_injection.md) | Blind SQLi, boolean tabanlı, karakter karakter çekme |
| [13_command_injection_ileri.md](./konu_anlatimlari/web_guvenligi/13_command_injection_ileri.md) | İleri command injection, grep bypass, filtre aşma |
| [14_session_brute_force.md](./konu_anlatimlari/web_guvenligi/14_session_brute_force.md) | Session ID brute-force, tahmin edilebilir token saldırısı |
| [15_session_ve_newline_injection.md](./konu_anlatimlari/web_guvenligi/15_session_ve_newline_injection.md) | PHP session manipülasyonu, newline injection |
| [16_http_redirect_bypass.md](./konu_anlatimlari/web_guvenligi/16_http_redirect_bypass.md) | HTTP yönlendirme bypass, 302 öncesi içerik okuma |
| [17_php_type_juggling.md](./konu_anlatimlari/web_guvenligi/17_php_type_juggling.md) | PHP type juggling, loose comparison zafiyetleri |
| [18_php_object_injection.md](./konu_anlatimlari/web_guvenligi/18_php_object_injection.md) | PHP object injection, deserialization, magic method |
| [19_sql_truncation.md](./konu_anlatimlari/web_guvenligi/19_sql_truncation.md) | SQL truncation, VARCHAR kesme, kullanıcı taklit saldırısı |
| [20_ecb_mode_zafiyeti.md](./konu_anlatimlari/web_guvenligi/20_ecb_mode_zafiyeti.md) | ECB mode zafiyeti, blok kesme/yapıştırma saldırısı |
| [21_perl_rce.md](./konu_anlatimlari/web_guvenligi/21_perl_rce.md) | Perl `open()` injection, RCE, pipe karakteri |
| [22_perl_cgi_param_bypass.md](./konu_anlatimlari/web_guvenligi/22_perl_cgi_param_bypass.md) | Perl CGI `param()` array bypass, DBI `quote()` atlatma |
| [23_log_poisoning.md](./konu_anlatimlari/web_guvenligi/23_log_poisoning.md) | Log poisoning, User-Agent injection, LFI + PHP RCE |
| [24_phar_deserialization.md](./konu_anlatimlari/web_guvenligi/24_phar_deserialization.md) | Phar deserialization, `phar://` wrapper, dosya yükleme + LFI RCE |

### 🔐 Kriptografi

| Dosya | Konular |
|---|---|
| [krypton_komutlar_ve_kavramlar.md](./konu_anlatimlari/kriptografi/krypton_komutlar_ve_kavramlar.md) | `wc -c` `sort -nr` `tr -cd` `for {A..Z}` `python3 -c` · Caesar · Frekans Analizi · Vigenère · Kasiski · Stream Cipher/XOR |

### 💥 Binary Exploitation

| Dosya | Konular |
|---|---|
| [00_x86_assembly_temelleri.md](./konu_anlatimlari/binary_exploitation/00_x86_assembly_temelleri.md) | Register'lar, veri tipleri, MOV/LEA/aritmetik komutlar, PUSH/POP, CALL/RET, calling convention, prologue/epilogue |
| [00b_gdb_ile_assembly_okumak.md](./konu_anlatimlari/binary_exploitation/00b_gdb_ile_assembly_okumak.md) | Assembly→C çevirme yöntemi, yaygın kalıplar (memset/memcpy/strlen/switch), GDB komut referansı |
| [01_bellek_ve_memory_layout.md](./konu_anlatimlari/binary_exploitation/01_bellek_ve_memory_layout.md) | Stack yapısı, değişken komşuluğu, buffer overflow mantığı, `x/20wx $esp` |
| [02_little_endian.md](./konu_anlatimlari/binary_exploitation/02_little_endian.md) | Byte sırası, `0xdeadbeef` → `\xef\xbe\xad\xde`, `struct.pack`, 32 vs 64-bit farkı |
| [03_eip_register_kontrolu.md](./konu_anlatimlari/binary_exploitation/03_eip_register_kontrolu.md) | CALL/RET mekanizması, saved EIP, cyclic pattern ile offset, GDB doğrulama |
| [04_shellcode_ve_nop_sled.md](./konu_anlatimlari/binary_exploitation/04_shellcode_ve_nop_sled.md) | Shellcode anatomy, NOP sled, env var adres bulma, program adı kaydırma, `(payload; cat)` |
| [05_format_string.md](./konu_anlatimlari/binary_exploitation/05_format_string.md) | `printf(buf)` açığı, `%x` ile bellek sızdırma, `%n` ile yazma, `%hn` iki kademeli yazma |
| [06_return_to_libc_ve_fonksiyon_pointer.md](./konu_anlatimlari/binary_exploitation/06_return_to_libc_ve_fonksiyon_pointer.md) | NX koruması, `system()+exit()+"/bin/sh"` zinciri, fonksiyon pointer manipülasyonu |
| [07_sembolik_link.md](./konu_anlatimlari/binary_exploitation/07_sembolik_link.md) | `ln -s`, TOCTOU race condition, `access()`+`open()` arası race window exploit |

---

## 🎮 OverTheWire War Games

[OverTheWire](https://overthewire.org/wargames/), Linux ve güvenlik becerilerini **oyun formatında** öğreten ücretsiz bir platform. Her war game için level-by-level çözüm rehberleri.

### 🏴 Bandit — Linux Temelleri
Mutlak başlangıç noktası. Komut satırını hiç kullanmamış biri bile buradan başlayabilir.

> 📖 Komut açıklamaları ve detaylar için → [Linux Komutları Konu Anlatımı](#️-linux-komutları)

| Dosya | Konular | Level'lar |
|---|---|---|
| [bandit_0-10.md](./overthewire/bandit/bandit_0-10.md) | SSH, dosya okuma, find, grep, sort, uniq, strings | 0 → 10 |
| [bandit_11-20.md](./overthewire/bandit/bandit_11-20.md) | Base64, ROT13, hexdump, sıkıştırma, netcat, SSL, nmap, SUID | 11 → 20 |
| [bandit_21-33.md](./overthewire/bandit/bandit_21-33.md) | Cron, bash scripting, brute force, vim escape, git, shell variables | 21 → 33 |

### 🐙 Leviathan — Tersine Mühendisliğe Giriş
Binary analizi, sembolik linkler ve privilege escalation. Bir binary'nin içini ltrace ile okumak, gdb ile assembly'e bakmak, symlink ile sistemi kandırmak.

> 📖 Komut açıklamaları ve detaylar için → [Binary Analizi ve Tersine Mühendislik Konu Anlatımı](#-binary-analizi-ve-tersine-mühendislik)

| Dosya | Konular | Level'lar |
|---|---|---|
| [leviathan_0-7.md](./overthewire/leviathan/leviathan_0-7.md) | ltrace, strings, gdb, symlink, TOCTOU, binary→ASCII | 0 → 7 |

### 🔐 Krypton — Kriptografiye Giriş
Klasik şifreleme yöntemlerini öğrenip nasıl kırılacaklarını görüyorsun. Base64'ten stream cipher'a kadar.

> 📖 Komut açıklamaları ve detaylar için → [Kriptografi Konu Anlatımı](#-kriptografi)

| Dosya | Konular | Level'lar |
|---|---|---|
| [krypton_0-6.md](./overthewire/krypton/krypton_0-6.md) | Base64, ROT13, Caesar, frekans analizi, Vigenère, stream cipher | 0 → 6 |

### 🌐 Natas — Web Güvenliğine Giriş
34 level boyunca web güvenliğinin temellerini öğreniyorsun — HTML'den Perl RCE'ye kadar.

> 📖 Komut açıklamaları ve detaylar için → [Web Güvenliği Konu Anlatımı](#-web-güvenliği)

| Dosya | Konular | Level'lar |
|---|---|---|
| [natas_0-10.md](./overthewire/natas/natas_0-10.md) | HTML kaynak, robots.txt, cookie, LFI, command injection | 0 → 10 |
| [natas_11-20.md](./overthewire/natas/natas_11-20.md) | XOR kırma, web shell, SQLi, blind SQLi, session brute-force | 11 → 20 |
| [natas_21-34.md](./overthewire/natas/natas_21-34.md) | Deserialization, ECB, Perl RCE, type juggling, truncation | 21 → 34 |

### 💥 Narnia — Binary Exploitation'a Giriş
C programlarındaki açıkları exploit etmeyi öğreniyorsun. Stack ve heap yapısını, EIP kontrolünü, shellcode yazmayı, format string saldırılarını ve return-to-libc tekniğini adım adım öğreten 9 seviyeli bir lab.

> ⚠️ **Not:** Narnia 32-bit (x86) Linux sistemde çalışır. 64-bit sistemlerden farklı davranışlar gözlemlenebilir.

> 📖 Kavram açıklamaları ve detaylar için → [Binary Exploitation Konu Anlatımı](#-binary-exploitation)

| Dosya | Konular | Level'lar |
|---|---|---|
| [narnia_0-8.md](./overthewire/narnia/narnia_0-8.md) | Buffer overflow, shellcode, EIP kontrolü, TOCTOU, format string, fonksiyon pointer, return-to-libc | 0 → 8 |

---

## 🛠️ Nasıl Kullanılır?

1. [OverTheWire](https://overthewire.org/wargames/) sitesine gir
2. Level sayfasındaki görevi oku
3. Önce **kendi başına dene** — takılırsan buraya bak
4. Bir komut veya kavram hakkında daha fazla bilgi için `konu_anlatimlari/` klasörüne bak

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
- [Bash Guide for Beginners](https://tldp.org/LDP/Bash-Beginners-Guide/html/)

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
- [pwntools Dokümantasyonu](https://docs.pwntools.com/en/stable/)
- [pwntools GitHub](https://github.com/Gallopsled/pwntools)
- [Practical Reverse Engineering — Bruce Dang et al. (Wiley, 2014)](https://www.wiley.com/en-us/Practical+Reverse+Engineering%3A+x86%2C+x64%2C+ARM%2C+Windows+Kernel%2C+Reversing+Tools%2C+and+Obfuscation-p-9781118787311)
- [Intel x86 Software Developer's Manual](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [x86 Instruction Reference — Felix Cloutier](https://www.felixcloutier.com/x86/)
- [Exploit Education — Phoenix](https://exploit.education/phoenix/) *(modern pwntools ile pratik)*
- [pwn.college](https://pwn.college/) *(binary exploitation eğitim platformu)*

### Kriptografi
- [CyberChef](https://gchq.github.io/CyberChef/)
- [dCode.fr](https://www.dcode.fr/)
- [Vigenère Cipher — Wikipedia](https://en.wikipedia.org/wiki/Vigen%C3%A8re_cipher)
- [ECB Mode Weakness](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#ECB)
- [ASCII Tablosu](https://www.asciitable.com/)
- [Dosya İmzaları](https://en.wikipedia.org/wiki/List_of_file_signatures)

### Git
- [Git Resmi Dokümantasyon](https://git-scm.com/doc)
- [Pro Git Kitabı](https://git-scm.com/book/tr/v2)
- [Learn Git Branching](https://learngitbranching.js.org/)

---

*Repo büyümeye devam ediyor — katkı ve önerilere açık.*
