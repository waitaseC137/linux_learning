# 📚 Konu Anlatımları

> Komutların ve kavramların wargame bağımsız, referans olarak tutulduğu dosyalar.

---

## 🖥️ Linux Komutları

| Dosya | Komutlar |
|---|---|
| [dosya_sistemi.md](./linux_komutlari/dosya_sistemi.md) | `pwd` `ls` `cd` `cat` `file` `find` `mkdir` `cp` `mv` `touch` `mktemp` `du` |
| [metin_isleme.md](./linux_komutlari/metin_isleme.md) | `grep` `sort` `uniq` `strings` `cut` `tr` `diff` `echo` `md5sum` `wc` `head` `tail` |
| [sikistirma_encoding.md](./linux_komutlari/sikistirma_encoding.md) | `base64` `xxd` `gzip` `bzip2` `tar` `zip` |
| [ag.md](./linux_komutlari/ag.md) | `ssh` `scp` `nc` `openssl` `nmap` `curl` `wget` |
| [izinler_kullanici.md](./linux_komutlari/izinler_kullanici.md) | `chmod` `chown` `whoami` `id` `su` `sudo` `groups` `SUID/SGID` |
| [surec_shell.md](./linux_komutlari/surec_shell.md) | `\|` `>` `>>` `&` `jobs` `fg` `$()` `for` `alias` `export` |
| [git.md](./linux_komutlari/git.md) | `git clone` `log` `show` `branch` `checkout` `tag` `add` `commit` `push` |

---

## 🔬 Binary Analizi ve Tersine Mühendislik

| Dosya | Komutlar / Kavramlar |
|---|---|
| [dosya_izinleri_suid.md](./leviathan_komutlari/dosya_izinleri_suid.md) | `chmod` `find -perm` `whoami` `SUID` privilege escalation |
| [binary_analizi.md](./leviathan_komutlari/binary_analizi.md) | `file` `strings` `xxd` `od` binary→ASCII |
| [ltrace_strace.md](./leviathan_komutlari/ltrace_strace.md) | `ltrace` `strace` `strcmp` `fopen` `access` `system` |
| [sembolik_linkler.md](./leviathan_komutlari/sembolik_linkler.md) | `ln -s` `readlink` TOCTOU açığı |
| [gdb.md](./leviathan_komutlari/gdb.md) | `disassemble` `break` `run` `info registers` `x` `print/d` |
| [brute_force_bash.md](./leviathan_komutlari/brute_force_bash.md) | `for` döngüsü, koşullar, PIN brute force |

---

## 🌐 Web Güvenliği

| Dosya | Konular |
|---|---|
| [01_html_kaynak_ve_devtools.md](./web_guvenligi/01_html_kaynak_ve_devtools.md) | HTML kaynak kodu, Developer Tools, gizli alanlar |
| [02_http_protokolu.md](./web_guvenligi/02_http_protokolu.md) | HTTP istek/cevap yapısı, metodlar, header'lar |
| [03_robots_ve_dizin_kesfi.md](./web_guvenligi/03_robots_ve_dizin_kesfi.md) | robots.txt, dizin keşfi, gizli yollar |
| [04_cookie_manipulasyonu.md](./web_guvenligi/04_cookie_manipulasyonu.md) | Cookie yapısı, manipülasyon, güvenlik bayrakları |
| [05_php_kaynak_kodu.md](./web_guvenligi/05_php_kaynak_kodu.md) | PHP kaynak kodu okuma, include, açık kaynak analizi |
| [06_encoding_ve_obfuscation.md](./web_guvenligi/06_encoding_ve_obfuscation.md) | Base64, hex, URL encoding, obfuscation teknikleri |
| [07_command_injection.md](./web_guvenligi/07_command_injection.md) | Command injection, `;` `\|` `$()` ile komut zincirleme |
| [08_lfi_ve_path_traversal.md](./web_guvenligi/08_lfi_ve_path_traversal.md) | LFI, path traversal, `../` ile dizin atlama |
| [09_xor_sifrelemesi.md](./web_guvenligi/09_xor_sifrelemesi.md) | XOR şifreleme, known-plaintext saldırısı |
| [10_dosya_yukleme_bypass.md](./web_guvenligi/10_dosya_yukleme_bypass.md) | Dosya yükleme bypass, MIME type, uzantı manipülasyonu |
| [11_sql_injection.md](./web_guvenligi/11_sql_injection.md) | SQL injection temelleri, `' OR 1=1`, UNION saldırısı |
| [12_blind_sql_injection.md](./web_guvenligi/12_blind_sql_injection.md) | Blind SQLi, boolean tabanlı, karakter karakter çekme |
| [13_command_injection_ileri.md](./web_guvenligi/13_command_injection_ileri.md) | İleri command injection, grep bypass, filtre aşma |
| [14_session_brute_force.md](./web_guvenligi/14_session_brute_force.md) | Session ID brute-force, tahmin edilebilir token saldırısı |
| [15_session_ve_newline_injection.md](./web_guvenligi/15_session_ve_newline_injection.md) | PHP session manipülasyonu, newline injection |
| [16_http_redirect_bypass.md](./web_guvenligi/16_http_redirect_bypass.md) | HTTP yönlendirme bypass, 302 öncesi içerik okuma |
| [17_php_type_juggling.md](./web_guvenligi/17_php_type_juggling.md) | PHP type juggling, loose comparison zafiyetleri |
| [18_php_object_injection.md](./web_guvenligi/18_php_object_injection.md) | PHP object injection, deserialization, magic method |
| [19_sql_truncation.md](./web_guvenligi/19_sql_truncation.md) | SQL truncation, VARCHAR kesme, kullanıcı taklit saldırısı |
| [20_ecb_mode_zafiyeti.md](./web_guvenligi/20_ecb_mode_zafiyeti.md) | ECB mode zafiyeti, blok kesme/yapıştırma saldırısı |
| [21_perl_rce.md](./web_guvenligi/21_perl_rce.md) | Perl `open()` injection, RCE, pipe karakteri |
| [22_perl_cgi_param_bypass.md](./web_guvenligi/22_perl_cgi_param_bypass.md) | Perl CGI `param()` array bypass, DBI `quote()` atlatma |
| [23_log_poisoning.md](./web_guvenligi/23_log_poisoning.md) | Log poisoning, User-Agent injection, LFI + PHP RCE |
| [24_phar_deserialization.md](./web_guvenligi/24_phar_deserialization.md) | Phar deserialization, `phar://` wrapper, dosya yükleme + LFI RCE |

---

## 🔐 Kriptografi

| Dosya | Konular |
|---|---|
| [krypton_komutlar_ve_kavramlar.md](./kriptografi/krypton_komutlar_ve_kavramlar.md) | `wc -c` `sort -nr` `tr -cd` `for {A..Z}` `python3 -c` · Caesar · Frekans Analizi · Vigenère · Kasiski · Stream Cipher/XOR |

---

## 💥 Binary Exploitation

| Dosya | Konular |
|---|---|
| [00_x86_assembly_temelleri.md](./binary_exploitation/00_x86_assembly_temelleri.md) | Register'lar, veri tipleri, MOV/LEA/aritmetik komutlar, PUSH/POP, CALL/RET, calling convention, prologue/epilogue |
| [00b_gdb_ile_assembly_okumak.md](./binary_exploitation/00b_gdb_ile_assembly_okumak.md) | Assembly→C çevirme yöntemi, yaygın kalıplar (memset/memcpy/strlen/switch), GDB komut referansı |
| [01_bellek_ve_memory_layout.md](./binary_exploitation/01_bellek_ve_memory_layout.md) | Stack yapısı, değişken komşuluğu, buffer overflow mantığı, `x/20wx $esp` |
| [02_little_endian.md](./binary_exploitation/02_little_endian.md) | Byte sırası, `0xdeadbeef` → `\xef\xbe\xad\xde`, `struct.pack`, 32 vs 64-bit farkı |
| [03_eip_register_kontrolu.md](./binary_exploitation/03_eip_register_kontrolu.md) | CALL/RET mekanizması, saved EIP, cyclic pattern ile offset, GDB doğrulama |
| [04_shellcode_ve_nop_sled.md](./binary_exploitation/04_shellcode_ve_nop_sled.md) | Shellcode anatomy, NOP sled, env var adres bulma, program adı kaydırma, `(payload; cat)` |
| [05_format_string.md](./binary_exploitation/05_format_string.md) | `printf(buf)` açığı, `%x` ile bellek sızdırma, `%n` ile yazma, `%hn` iki kademeli yazma |
| [06_return_to_libc_ve_fonksiyon_pointer.md](./binary_exploitation/06_return_to_libc_ve_fonksiyon_pointer.md) | NX koruması, `system()+exit()+"/bin/sh"` zinciri, fonksiyon pointer manipülasyonu |
| [07_sembolik_link.md](./binary_exploitation/07_sembolik_link.md) | `ln -s`, TOCTOU race condition, `access()`+`open()` arası race window exploit |
| [08_pointer_manipulation.md](./binary_exploitation/08_pointer_manipulation.md) | Pointer üzerinden bellek okuma, dolaylı erişim, program akışını yönlendirme |
| [09_got_plt_overwrite.md](./binary_exploitation/09_got_plt_overwrite.md) | GOT/PLT mekanizması, dinamik linking, format string `%n` ile arbitrary write |

### İleri Konular (Behemoth · Utumno · Maze)

| Dosya | Konular | Oyun |
|---|---|---|
| [10_bellek_korumalari_ve_checksec.md](./binary_exploitation/10_bellek_korumalari_ve_checksec.md) | NX, ASLR, Stack Canary, PIE, RELRO + `checksec`, karar ağacı | Hepsi |
| [11_integer_bug_truncation_signedness.md](./binary_exploitation/11_integer_bug_truncation_signedness.md) | Truncation (16/8-bit), signed/unsigned bypass, `×4` wraparound | Utumno 4/6, Maze 7 |
| [12_dinamik_linker_ve_kutuphane_hijacking.md](./binary_exploitation/12_dinamik_linker_ve_kutuphane_hijacking.md) | DT_NEEDED göreli yol, LD_PRELOAD, AT_SECURE, constructor | Maze 1, Utumno 0 |
| [13_ptrace_anti_debugging.md](./binary_exploitation/13_ptrace_anti_debugging.md) | `PTRACE_TRACEME`, auto-continue tracer, `setsid` | Maze 5 |
| [14_self_modifying_code_ve_mprotect.md](./binary_exploitation/14_self_modifying_code_ve_mprotect.md) | `mprotect` RWX, runtime XOR decrypt, sihirli sabitler | Maze 3, Behemoth 6 |
| [15_elf_formati_ve_parser_zafiyetleri.md](./binary_exploitation/15_elf_formati_ve_parser_zafiyetleri.md) | ELF header alanları, güvenilmeyen boyut → parser overflow | Maze 7 |
| [16_file_yapisi_fsop.md](./binary_exploitation/16_file_yapisi_fsop.md) | `_IO_FILE`, `fp` overwrite, vtable check, write-what-where | Maze 6 |
| [17_setjmp_longjmp_ptr_mangle.md](./binary_exploitation/17_setjmp_longjmp_ptr_mangle.md) | `jmp_buf`, PTR_MANGLE, ebp-pivot bypass | Utumno 7 |
| [18_ag_servisi_exploitasyonu.md](./binary_exploitation/18_ag_servisi_exploitasyonu.md) | socket/bind/fork server, soket üzerinden exploit, UDP sniffing | Maze 8, Behemoth 5 |

---

## 🕳️ Utumno — İleri Seviye Exploit Konu Anlatımları

| Dosya | Konu |
|---|---|
| [UTUMNO_KONULAR.md](./utumno/UTUMNO_KONULAR.md) | Level → konu eşlemesi, ön koşullar, hangi modülü okuyacaksın |

---

## 👾 Behemoth — Dinamik Analiz ve İleri Exploit Teknikleri

| Modül | Dosya | Konu |
|---|---|---|
| 1 | [modul1_dinamik_analiz.md](./behemoth/modul1_dinamik_analiz.md) | `ltrace`/`strace`/`gdb`, kaynak kodsuz binary analizi |
| 2 | [modul2_race_condition.md](./behemoth/modul2_race_condition.md) | TOCTOU, PID tahmini, symlink saldırısı, `/proc` |
| 3 | [modul3_udp_sniffing.md](./behemoth/modul3_udp_sniffing.md) | UDP sniffing, `nc -lu`, `tcpdump` |
| 4 | [modul4_buffer_overflow.md](./behemoth/modul4_buffer_overflow.md) | Girdi kanalları, shellcode, dosya tabanlı exploit, env var |
| 5 | [modul5_format_string.md](./behemoth/modul5_format_string.md) | Format string, stack okuma, arbitrary read/write |
| 6 | [modul6_helper_binary.md](./behemoth/modul6_helper_binary.md) | Helper binary zinciri, shellcode filtresi, `0x0b` bypass |
| 7 | [modul7_argv_bof.md](./behemoth/modul7_argv_bof.md) | argv BOF, alphanumeric filtre, environment shellcode |
| 8 | [modul8_genel_ozet.md](./behemoth/modul8_genel_ozet.md) | SUID, privilege escalation, exploit metodolojisi |
