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
| [before_you_start.md](./leviathan_komutlari/before_you_start.md) | Before starting Leviathan: SSH connection, how the game works, prerequisites, the recon reflex |
| [what_leviathan_teaches.md](./leviathan_komutlari/what_leviathan_teaches.md) | What Leviathan teaches: info disclosure, command injection, symlink/TOCTOU, encoding≠security, level→concept map |
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

## 🔌 From Switches to a Computer (NAND to CPU)

> 🚧 **This course is still being written** — it grew out of the NandGame journey; right now it's written from switch/relay up to the **Full Adder** (00–06). The rest (multi-bit adder, ALU, memory, clock, control unit) will be added as the journey continues.
>
> 🧭 **New to this?** → [00_buradan_basla.md](./salterden_bilgisayara/00_buradan_basla.md) — for people who want to learn the processor not by asking "what is it?" but by **building it from its parts**. It's the sibling and the floor beneath the x86 course: there you learn to give the worker orders, here you build the worker from transistors.

| File | Topics |
|---|---|
| [00_buradan_basla.md](./salterden_bilgisayara/00_buradan_basla.md) | Course map; the journey from switches to a CPU |
| [01_akim_salter_role.md](./salterden_bilgisayara/01_akim_salter_role.md) | Current, switch, relay — the first "logic" |
| [02_nanddan_kapilar.md](./salterden_bilgisayara/02_nanddan_kapilar.md) | NAND is universal: deriving NOT/AND/OR/XOR |
| [03_xor_iki_fedai.md](./salterden_bilgisayara/03_xor_iki_fedai.md) | Building XOR — "the two workhorses" (OR + NAND + AND) |
| [03.5_soyutlama_merdiveni.md](./salterden_bilgisayara/03.5_soyutlama_merdiveni.md) | A gate = a closed box; climbing one floor up |
| [04_teller_sayi_olunca.md](./salterden_bilgisayara/04_teller_sayi_olunca.md) | Assigning value to wires; the token logic |
| [05_half_adder.md](./salterden_bilgisayara/05_half_adder.md) | XOR+AND = the seed of addition (sum + carry) |
| [06_full_adder.md](./salterden_bilgisayara/06_full_adder.md) | a+b+carry-in; two half adders = the skeleton of an ALU |

---
## ⚙️ x86 Assembly (from scratch)

> ✅ **This course is complete (00–20).** From the machine model up through arithmetic · control flow (jmp/loops) · the stack · functions · system calls · the C bridge; **every program in it was verified by running it on a real machine.**
>
> 🧭 **New to this?** → [00_buradan_basla.md](./x86_assembly/00_buradan_basla.md) — for people who want to learn assembly truly from scratch, *by writing it*. It's the deep groundwork for Binary Exploitation ("first learn to give the worker orders, then learn to bend the order").

| File | Topics |
|---|---|
| [00_buradan_basla.md](./x86_assembly/00_buradan_basla.md) | Course map, mental model, how to study |
| [01_bilgisayar_nedir.md](./x86_assembly/01_bilgisayar_nedir.md) | Numbered boxes + a worker; what "running" means |
| [02_terminal_ile_tanisma.md](./x86_assembly/02_terminal_ile_tanisma.md) | The terminal, typing commands, reading output |
| [03_sayilar_ikilik_onaltilik.md](./x86_assembly/03_sayilar_ikilik_onaltilik.md) | Binary/hex — counting the way the machine counts |
| [04_bellek_ve_registerlar.md](./x86_assembly/04_bellek_ve_registerlar.md) | Memory (boxes) + registers (the worker's hands); AL/AH/EAX |
| [05_kurulum_ve_ilk_program.md](./x86_assembly/05_kurulum_ve_ilk_program.md) | Installing nasm/ld/gdb, the write→assemble→run chain |
| [06_ilk_gercek_program.md](./x86_assembly/06_ilk_gercek_program.md) | A value into a register with `mov`, exit code, `echo $?` |
| [07_gdb_tek_adim.md](./x86_assembly/07_gdb_tek_adim.md) | Single-stepping in GDB (`starti` / `si`), watching registers live, `eip` |
| [08_mov_ve_bellek.md](./x86_assembly/08_mov_ve_bellek.md) | `[...]` memory addressing, `section .data`, load/store, the first pointer follow (`[ebx]`) |
| [08.5_little_endian.md](./x86_assembly/08.5_little_endian.md) | Looking at memory byte by byte; the "exactly reversed" byte order (little-endian) |
| [09_aritmetik.md](./x86_assembly/09_aritmetik.md) | `add`/`sub`/`inc`/`dec`; two's complement (negative numbers); the whole load-compute-store dance |
| [10_bayraklar_ve_cmp.md](./x86_assembly/10_bayraklar_ve_cmp.md) | Flags (ZF/SF), `cmp` and `test`; the raw material of a decision |
| [11_ziplamalar.md](./x86_assembly/11_ziplamalar.md) | `jmp`/`jz`/`jnz`/`jl`/`jg`; breaking the straight flow, the even-odd program |
| [12_donguler.md](./x86_assembly/12_donguler.md) | Backward jump + counter = a loop; sum 1..N, multiplication by repeated addition |
| [13_bit_islemleri.md](./x86_assembly/13_bit_islemleri.md) | `and`/`or`/`xor`/`shl`/`shr`; `xor eax,eax`=zero it; `test`=`and` |
| [14_stack.md](./x86_assembly/14_stack.md) | `push`/`pop`, `esp`, LIFO; why the stack grows down (the worker's notepad) |
| [15_call_ve_ret.md](./x86_assembly/15_call_ve_ret.md) | Functions, the return address; `call`=`push`+`jmp`, `ret`=`pop` |
| [16_calling_convention.md](./x86_assembly/16_calling_convention.md) | cdecl: passing arguments, return value, the `ebp` anchor, prologue/epilogue |
| [17_sistem_cagrilari.md](./x86_assembly/17_sistem_cagrilari.md) | `int 0x80`, syscall numbers; "Hello World" on screen (the `sys_exit` debt is paid) |
| [18_ilk_etkilesimli_program.md](./x86_assembly/18_ilk_etkilesimli_program.md) | `sys_read` + `section .bss`; an interactive program that asks your name and greets you |
| [19_c_ile_assembly_koprusu.md](./x86_assembly/19_c_ile_assembly_koprusu.md) | Seeing familiar patterns in compiled code with `gcc -S` (`x*8`→`shl`) |
| [20_buradan_nereye.md](./x86_assembly/20_buradan_nereye.md) | Moving to 64-bit, reverse engineering, binary exploitation, further resources |

*(The interludes 01.5 / 04.5 / 05.5 are linked inside the course. The series is complete: 00–20.)*

---
## 💥 Binary Exploitation

> 🧭 **New to this?** Start here → [00_buradan_basla.md](./binary_exploitation/00_buradan_basla.md) — an intro for people who don't know assembly: minimum instruction dictionary, the little-endian trap, an end-to-end first exploit, and the reading order.

| File | Topics |
|---|---|
| [00a_assembly_bilmeden_giris.md](./binary_exploitation/00a_assembly_bilmeden_giris.md) | Getting started without assembly: minimum instruction dictionary, an end-to-end first exploit |
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
