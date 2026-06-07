# 📚 Topic Guides

> Wargame-independent reference files for commands and concepts.

---

## 🖥️ Linux Commands

| File | Commands |
|---|---|
| [file_system.md](./linux_komutlari/file_system.md) | `pwd` `ls` `cd` `cat` `file` `find` `mkdir` `cp` `mv` `touch` `mktemp` `du` |
| [text_processing.md](./linux_komutlari/text_processing.md) | `grep` `sort` `uniq` `strings` `cut` `tr` `diff` `echo` `md5sum` `wc` `head` `tail` |
| [compression_encoding.md](./linux_komutlari/compression_encoding.md) | `base64` `xxd` `gzip` `bzip2` `tar` `zip` |
| [networking.md](./linux_komutlari/networking.md) | `ssh` `scp` `nc` `openssl` `nmap` `curl` `wget` |
| [permissions_users.md](./linux_komutlari/permissions_users.md) | `chmod` `chown` `whoami` `id` `su` `sudo` `groups` `SUID/SGID` |
| [process_shell.md](./linux_komutlari/process_shell.md) | `\|` `>` `>>` `&` `jobs` `fg` `$()` `for` `alias` `export` |
| [git.md](./linux_komutlari/git.md) | `git clone` `log` `show` `branch` `checkout` `tag` `add` `commit` `push` |

---

## 🔬 Binary Analysis & Reverse Engineering

| File | Commands / Concepts |
|---|---|
| [file_permissions_suid.md](./leviathan_komutlari/file_permissions_suid.md) | `chmod` `find -perm` `whoami` `SUID` privilege escalation |
| [binary_analysis.md](./leviathan_komutlari/binary_analysis.md) | `file` `strings` `xxd` `od` binary→ASCII |
| [ltrace_strace.md](./leviathan_komutlari/ltrace_strace.md) | `ltrace` `strace` `strcmp` `fopen` `access` `system` |
| [symbolic_links.md](./leviathan_komutlari/symbolic_links.md) | `ln -s` `readlink` argument splitting / TOCTOU |
| [gdb.md](./leviathan_komutlari/gdb.md) | `disassemble` `break` `run` `info registers` `x` `print/d` |
| [brute_force_bash.md](./leviathan_komutlari/brute_force_bash.md) | `for` loop, conditionals, PIN brute force |

---

## 🌐 Web Security

| File | Topics |
|---|---|
| [01_html_source_and_devtools.md](./web_guvenligi/01_html_source_and_devtools.md) | HTML source code, Developer Tools, hidden fields |
| [02_http_protocol.md](./web_guvenligi/02_http_protocol.md) | HTTP request/response structure, methods, headers |
| [03_robots_and_directory_discovery.md](./web_guvenligi/03_robots_and_directory_discovery.md) | robots.txt, directory discovery, hidden paths |
| [04_cookie_manipulation.md](./web_guvenligi/04_cookie_manipulation.md) | Cookie structure, manipulation, security flags |
| [05_php_source_code.md](./web_guvenligi/05_php_source_code.md) | Reading PHP source, include, open-source analysis |
| [06_encoding_and_obfuscation.md](./web_guvenligi/06_encoding_and_obfuscation.md) | Base64, hex, URL encoding, obfuscation techniques |
| [07_command_injection.md](./web_guvenligi/07_command_injection.md) | Command injection, chaining with `;` `\|` `$()` |
| [08_lfi_and_path_traversal.md](./web_guvenligi/08_lfi_and_path_traversal.md) | LFI, path traversal, directory escape with `../` |
| [09_xor_encryption.md](./web_guvenligi/09_xor_encryption.md) | XOR encryption, known-plaintext attack |
| [10_file_upload_bypass.md](./web_guvenligi/10_file_upload_bypass.md) | File upload bypass, MIME type, extension manipulation |
| [11_sql_injection.md](./web_guvenligi/11_sql_injection.md) | SQL injection basics, `' OR 1=1`, UNION attack |
| [12_blind_sql_injection.md](./web_guvenligi/12_blind_sql_injection.md) | Blind SQLi, boolean-based, char-by-char extraction |
| [13_command_injection_advanced.md](./web_guvenligi/13_command_injection_advanced.md) | Advanced command injection, grep bypass, filter evasion |
| [14_session_brute_force.md](./web_guvenligi/14_session_brute_force.md) | Session ID brute force, predictable token attack |
| [15_session_and_newline_injection.md](./web_guvenligi/15_session_and_newline_injection.md) | PHP session manipulation, newline injection |
| [16_http_redirect_bypass.md](./web_guvenligi/16_http_redirect_bypass.md) | HTTP redirect bypass, reading content before 302 |
| [17_php_type_juggling.md](./web_guvenligi/17_php_type_juggling.md) | PHP type juggling, loose comparison vulnerabilities |
| [18_php_object_injection.md](./web_guvenligi/18_php_object_injection.md) | PHP object injection, deserialization, magic methods |
| [19_sql_truncation.md](./web_guvenligi/19_sql_truncation.md) | SQL truncation, VARCHAR cutoff, user impersonation |
| [20_ecb_mode_vulnerability.md](./web_guvenligi/20_ecb_mode_vulnerability.md) | ECB mode weakness, block cut/paste attack |
| [21_perl_rce.md](./web_guvenligi/21_perl_rce.md) | Perl `open()` injection, RCE, pipe character |
| [22_perl_cgi_param_bypass.md](./web_guvenligi/22_perl_cgi_param_bypass.md) | Perl CGI `param()` array bypass, DBI `quote()` evasion |
| [23_log_poisoning.md](./web_guvenligi/23_log_poisoning.md) | Log poisoning, User-Agent injection, LFI + PHP RCE |
| [24_phar_deserialization.md](./web_guvenligi/24_phar_deserialization.md) | Phar deserialization, `phar://` wrapper, upload + LFI RCE |

---

## 🔐 Cryptography

| File | Topics |
|---|---|
| [krypton_commands_and_concepts.md](./kriptografi/krypton_commands_and_concepts.md) | `wc -c` `sort -nr` `tr -cd` `for {A..Z}` `python3 -c` · Caesar · Frequency Analysis · Vigenère · Kasiski · Stream Cipher/XOR |

---

## 💥 Binary Exploitation

> ⚠️ This section's content is not translated to English yet (still Turkish). The links open the Turkish files for now.

| File | Topics |
|---|---|
| [00_x86_assembly_temelleri.md](./binary_exploitation/00_x86_assembly_temelleri.md) | Registers, data types, MOV/LEA/arithmetic, PUSH/POP, CALL/RET, calling convention, prologue/epilogue |
| [00b_gdb_ile_assembly_okumak.md](./binary_exploitation/00b_gdb_ile_assembly_okumak.md) | Assembly→C method, common patterns (memset/memcpy/strlen/switch), GDB command reference |
| [01_bellek_ve_memory_layout.md](./binary_exploitation/01_bellek_ve_memory_layout.md) | Stack layout, variable adjacency, buffer overflow logic, `x/20wx $esp` |
| [02_little_endian.md](./binary_exploitation/02_little_endian.md) | Byte order, `0xdeadbeef` → `\xef\xbe\xad\xde`, `struct.pack`, 32 vs 64-bit difference |
| [03_eip_register_kontrolu.md](./binary_exploitation/03_eip_register_kontrolu.md) | CALL/RET mechanism, saved EIP, offset via cyclic pattern, GDB verification |
| [04_shellcode_ve_nop_sled.md](./binary_exploitation/04_shellcode_ve_nop_sled.md) | Shellcode anatomy, NOP sled, finding env var addresses, program-name shifting, `(payload; cat)` |
| [05_format_string.md](./binary_exploitation/05_format_string.md) | `printf(buf)` bug, leaking memory with `%x`, writing with `%n`, two-stage `%hn` write |
| [06_return_to_libc_ve_fonksiyon_pointer.md](./binary_exploitation/06_return_to_libc_ve_fonksiyon_pointer.md) | NX protection, `system()+exit()+"/bin/sh"` chain, function pointer manipulation |
| [07_sembolik_link.md](./binary_exploitation/07_sembolik_link.md) | `ln -s`, TOCTOU race condition, exploiting the `access()`+`open()` race window |
| [08_pointer_manipulation.md](./binary_exploitation/08_pointer_manipulation.md) | Reading memory via pointers, indirect access, redirecting program flow |
| [09_got_plt_overwrite.md](./binary_exploitation/09_got_plt_overwrite.md) | GOT/PLT mechanism, dynamic linking, arbitrary write via format string `%n` |

### Advanced Topics (Behemoth · Utumno · Maze)

| File | Topics | Game |
|---|---|---|
| [10_bellek_korumalari_ve_checksec.md](./binary_exploitation/10_bellek_korumalari_ve_checksec.md) | NX, ASLR, Stack Canary, PIE, RELRO + `checksec`, decision tree | All |
| [11_integer_bug_truncation_signedness.md](./binary_exploitation/11_integer_bug_truncation_signedness.md) | Truncation (16/8-bit), signed/unsigned bypass, `×4` wraparound | Utumno 4/6, Maze 7 |
| [12_dinamik_linker_ve_kutuphane_hijacking.md](./binary_exploitation/12_dinamik_linker_ve_kutuphane_hijacking.md) | DT_NEEDED relative path, LD_PRELOAD, AT_SECURE, constructor | Maze 1, Utumno 0 |
| [13_ptrace_anti_debugging.md](./binary_exploitation/13_ptrace_anti_debugging.md) | `PTRACE_TRACEME`, auto-continue tracer, `setsid` | Maze 5 |
| [14_self_modifying_code_ve_mprotect.md](./binary_exploitation/14_self_modifying_code_ve_mprotect.md) | `mprotect` RWX, runtime XOR decrypt, magic constants | Maze 3, Behemoth 6 |
| [15_elf_formati_ve_parser_zafiyetleri.md](./binary_exploitation/15_elf_formati_ve_parser_zafiyetleri.md) | ELF header fields, untrusted size → parser overflow | Maze 7 |
| [16_file_yapisi_fsop.md](./binary_exploitation/16_file_yapisi_fsop.md) | `_IO_FILE`, `fp` overwrite, vtable check, write-what-where | Maze 6 |
| [17_setjmp_longjmp_ptr_mangle.md](./binary_exploitation/17_setjmp_longjmp_ptr_mangle.md) | `jmp_buf`, PTR_MANGLE, ebp-pivot bypass | Utumno 7 |
| [18_ag_servisi_exploitasyonu.md](./binary_exploitation/18_ag_servisi_exploitasyonu.md) | socket/bind/fork server, exploit over socket, UDP sniffing | Maze 8, Behemoth 5 |
| [19_setuid_yetki_dususu_ve_p_bayragi.md](./binary_exploitation/19_setuid_yetki_dususu_ve_p_bayragi.md) | ruid/euid/suid, `setresuid`, privilege drop, `#!/bin/sh -p`, setuid script | Maze 4 + All |

---
