# 🎮 OverTheWire War Games

> [OverTheWire](https://overthewire.org/wargames/) is a free platform that teaches
> Linux and security skills in a **game format**. Level-by-level solution
> guides for each war game.

> 📖 For command and concept explanations → **[Topic Guides](../konu_anlatimlari/KONU_ANLATIMLARI.md)**

---

## 🗺️ Recommended Order

```
Bandit  →  Leviathan  →  Krypton  →  Narnia  →  Behemoth  →  Utumno  →  Maze
(basics)   (intro RE)    (crypto)    (binary)   (medium)     (advanced)  (mixed/capstone)

Natas — web security, separate branch, start whenever you like
```

| Wargame | Difficulty | Levels | Focus |
|---|---|---|---|
| [Bandit](#-bandit--linux-basics) | 1/10 | 34 | Linux terminal basics |
| [Leviathan](#-leviathan--intro-to-reverse-engineering) | 3/10 | 8 | Binary analysis, privilege escalation |
| [Krypton](#-krypton--intro-to-cryptography) | 3/10 | 7 | Classical ciphers |
| [Natas](#-natas--intro-to-web-security) | 4/10 | 35 | Web security |
| [Narnia](#-narnia--intro-to-binary-exploitation) | 6/10 | 10 | Buffer overflow, shellcode |
| [Behemoth](#-behemoth--intermediate-binary-exploitation) | 7/10 | 9 | PATH hijack, format string, symlink, UDP, BOF |
| [Utumno](#-utumno--advanced-binary-exploitation) | 9/10 | 9 | Arbitrary write, integer bugs, jmp_buf/PTR_MANGLE |
| [Maze](#-maze--mixed-binary-exploitation--re) | 5/10 | 9 | TOCTOU, lib hijack, self-modifying, FSOP, ELF parser, format string |

---

## 🏴 Bandit — Linux Basics

The absolute starting point. Even someone who has never used the command line can start here.

| File | Topics | Levels |
|---|---|---|
| [bandit_0-10.md](./bandit/bandit_0-10.md) | SSH, reading files, find, grep, sort, uniq, strings | 0 → 10 |
| [bandit_11-20.md](./bandit/bandit_11-20.md) | Base64, ROT13, hexdump, compression, netcat, SSL, nmap, SUID | 11 → 20 |
| [bandit_21-33.md](./bandit/bandit_21-33.md) | Cron, bash scripting, brute force, vim escape, git, shell variables | 21 → 33 |

---

## 🐙 Leviathan — Intro to Reverse Engineering

Binary analysis, symbolic links, and privilege escalation. Reading the internals of a binary with `ltrace`, looking at assembly with `gdb`, tricking the system with symlinks.

| File | Topics | Levels |
|---|---|---|
| [leviathan_0-7.md](./leviathan/leviathan_0-7.md) | ltrace, strings, gdb, symlink, TOCTOU, binary→ASCII | 0 → 7 |

---

## 🔐 Krypton — Intro to Cryptography

Learn classical encryption methods and see how to break them. From Base64 to stream ciphers.

| File | Topics | Levels |
|---|---|---|
| [krypton_0-6.md](./krypton/krypton_0-6.md) | Base64, ROT13, Caesar, frequency analysis, Vigenère, stream cipher | 0 → 6 |

---

## 🌐 Natas — Intro to Web Security

Across 35 levels you learn the fundamentals of web security — from HTML to Perl RCE.

| File | Topics | Levels |
|---|---|---|
| [natas_0-10.md](./natas/natas_0-10.md) | HTML source, robots.txt, cookie, LFI, command injection | 0 → 10 |
| [natas_11-20.md](./natas/natas_11-20.md) | XOR cracking, web shell, SQLi, blind SQLi, session brute-force | 11 → 20 |
| [natas_21-34.md](./natas/natas_21-34.md) | Deserialization, ECB, Perl RCE, type juggling, truncation | 21 → 34 |

---

## 💥 Narnia — Intro to Binary Exploitation

Learn to exploit vulnerabilities in C programs. A hands-on lab that teaches stack and heap layout, EIP control, writing shellcode, format string attacks, and return-to-libc step by step.

> ⚠️ **Note:** Narnia runs on a 32-bit (x86) Linux system. Behavior may differ from 64-bit systems.

| File | Topics | Levels |
|---|---|---|
| [narnia 0 -> 1.md](./narnia/narnia%200%20-%3E%201.md) | Stack buffer overflow, variable overwrite | 0 → 1 |
| [narnia 1 -> 2.md](./narnia/narnia%201%20-%3E%202.md) | Shellcode, environment variable, EIP control | 1 → 2 |
| [narnia 2 -> 3.md](./narnia/narnia%202%20-%3E%203.md) | Buffer overflow, shellcode injection | 2 → 3 |
| [narnia 3 -> 4.md](./narnia/narnia%203%20-%3E%204.md) | TOCTOU, symlink, race condition | 3 → 4 |
| [narnia 4 -> 5.md](./narnia/narnia%204%20-%3E%205.md) | Buffer overflow, NOP sled, shellcode | 4 → 5 |
| [narnia 5 -> 6.md](./narnia/narnia%205%20-%3E%206.md) | Format string, memory read/write | 5 → 6 |
| [narnia 6 -> 7.md](./narnia/narnia%206%20-%3E%207.md) | Heap, function pointer overwrite | 6 → 7 |
| [narnia 7 -> 8.md](./narnia/narnia%207%20-%3E%208.md) | Return-to-libc | 7 → 8 |
| [narnia 8 -> 9.md](./narnia/narnia%208%20-%3E%209.md) | Advanced format string, arbitrary write | 8 → 9 |

---

## 👾 Behemoth — Intermediate Binary Exploitation

Dynamic analysis, PATH hijack, symbolic links, network sniffing, format string, and advanced buffer overflow. Solving binaries through reverse engineering **without source code**.

> ⚠️ 32-bit (x86) Linux, ASLR off, executable stack. Passwords are hidden in the writeups (`**********`).

| File | Topic / Technique | Levels |
|---|---|---|
| [behemoth 0 -> 1.md](./behemoth/behemoth%200%20-%3E%201.md) | Embedded password via `ltrace` (`strcmp`) | 0 → 1 |
| [behemoth 1 -> 2.md](./behemoth/behemoth%201%20-%3E%202.md) | `gets()` overflow → env shellcode (offset 71) | 1 → 2 |
| [behemoth 2 -> 3.md](./behemoth/behemoth%202%20-%3E%203.md) | PATH hijack (`system("touch %d")`) | 2 → 3 |
| [behemoth 3 -> 4.md](./behemoth/behemoth%203%20-%3E%204.md) | Format string → `puts@GOT` overwrite | 3 → 4 |
| [behemoth 4 -> 5.md](./behemoth/behemoth%204%20-%3E%205.md) | `/tmp/<pid>` symlink (pid window brute) | 4 → 5 |
| [behemoth 5 -> 6.md](./behemoth/behemoth%205%20-%3E%206.md) | UDP sniffing (`localhost:1337`) | 5 → 6 |
| [behemoth 6 -> 7.md](./behemoth/behemoth%206%20-%3E%207.md) | `mmap`-exec shellcode.txt, 0x0b filter, strcmp gate | 6 → 7 |
| [behemoth 7 -> 8.md](./behemoth/behemoth%207%20-%3E%208.md) | Env-wipe + partial char check → argv[2] shellcode | 7 → 8 |

---

## 🕳️ Utumno — Advanced Binary Exploitation

Reading execute-only binaries, deliberate shellcode exec, `getchar` arbitrary-write primitive, integer truncation, signed bounds bypass, and `jmp_buf` + PTR_MANGLE bypass. Contains the deepest techniques in the series.

> 📌 **Read before starting:** [00 - Utumno - BAŞLAMADAN ÖNCE OKUYUNUZ.md](./utumno/00%20-%20Utumno%20-%20BAŞLAMADAN%20ÖNCE%20OKUYUNUZ.md) — prerequisite knowledge & topic guide.
>
> ⚠️ 32-bit (x86) Linux, ASLR off, executable stack. Passwords are hidden in the writeups (`**********`).

| File | Topic / Technique | Levels |
|---|---|---|
| [utumno 0 -> 1.md](./utumno/utumno%200%20-%3E%201.md) | Reading execute-only binary from memory (LD_PRELOAD dump) | 0 → 1 |
| [utumno 1 -> 2.md](./utumno/utumno%201%20-%3E%202.md) | Filename = shellcode (RWX buffer, ret-overwrite) | 1 → 2 |
| [utumno 2 -> 3.md](./utumno/utumno%202%20-%3E%203.md) | Stack overflow + `argc=0` trick (`argv[10]=envp`) + env shellcode | 2 → 3 |
| [utumno 3 -> 4.md](./utumno/utumno%203%20-%3E%204.md) | `getchar` arbitrary-write primitive → byte-by-byte ret overwrite | 3 → 4 |
| [utumno 4 -> 5.md](./utumno/utumno%204%20-%3E%205.md) | Integer truncation (16-bit check vs 32-bit `memcpy`) | 4 → 5 |
| [utumno 5 -> 6.md](./utumno/utumno%205%20-%3E%206.md) | `strncpy` no-null overflow (exact 4-byte ret) | 5 → 6 |
| [utumno 6 -> 7.md](./utumno/utumno%206%20-%3E%207.md) | Signed bounds bypass + `×4` wraparound → arbitrary write | 6 → 7 |
| [utumno 7 -> 8.md](./utumno/utumno%207%20-%3E%208.md) | `jmp_buf` overflow + PTR_MANGLE bypass (ebp-pivot) | 7 → 8 |

---

## 🌀 Maze — Mixed Binary Exploitation & RE

A mixed lab that covers **a completely different vulnerability class at each level**, not just a single pattern.
From TOCTOU races to FILE-structure exploitation, from self-modifying code to format strings —
it brings together all the techniques in the series, which is why despite a 5/10 rating it's placed
**last as a capstone after Behemoth + Utumno**.

> 📌 **Read before starting:** [00 - Maze - BAŞLAMADAN ÖNCE OKUYUNUZ.md](./maze/00%20-%20Maze%20-%20BAŞLAMADAN%20ÖNCE%20OKUYUNUZ.md) — prerequisite knowledge & topic guide.
>
> ⚠️ 32-bit (x86) Linux, ASLR off, **No RELRO**; NX/canary varies per level (run `checksec` at each level). Passwords are hidden in the writeups (`**********`).

| File | Topic / Technique | Levels |
|---|---|---|
| [maze 0 -> 1.md](./maze/maze%200%20-%3E%201.md) | TOCTOU race — `access()`/`open()` symlink swap | 0 → 1 |
| [maze 1 -> 2.md](./maze/maze%201%20-%3E%202.md) | Library hijack — relative `./libc.so.4`, fake `.so` with constructor | 1 → 2 |
| [maze 2 -> 3.md](./maze/maze%202%20-%3E%203.md) | Exec stack — calling buffer as function, env shellcode + NOP sled | 2 → 3 |
| [maze 3 -> 4.md](./maze/maze%203%20-%3E%204.md) | Self-modifying code — `mprotect` RWX + XOR decrypt, magic `0x1337c0de` | 3 → 4 |
| [maze 4 -> 5.md](./maze/maze%204%20-%3E%205.md) | `execv` validation bypass — setuid script + `#!/bin/sh -p` | 4 → 5 |
| [maze 5 -> 6.md](./maze/maze%205%20-%3E%206.md) | Keygen RE + `ptrace(TRACEME)` anti-debug (auto-continue tracer) | 5 → 6 |
| [maze 6 -> 7.md](./maze/maze%206%20-%3E%207.md) | FSOP — `fp` overwrite → fake `FILE` → `fprintf` writes `GOT[exit]` | 6 → 7 |
| [maze 7 -> 8.md](./maze/maze%207%20-%3E%208.md) | ELF parser overflow — untrusted `e_shentsize` → ret2env | 7 → 8 |
| [maze 8 -> 9.md](./maze/maze%208%20-%3E%209.md) | Format string — `snprintf(buf,n,user)` → `%n` → `GOT[strlen]=system` | 8 → 9 |

---

## 🛠️ How to Use

1. Go to [OverTheWire](https://overthewire.org/wargames/)
2. Read the task on the level page
3. **Try it yourself first** — look here only if you get stuck
4. For command and concept explanations, see the [Topic Guides](../konu_anlatimlari/KONU_ANLATIMLARI.md)

> Passwords may change from time to time. These guides explain the method, not the passwords — the one exception is **Krypton**, where the password is the direct output of the decryption exercise.
