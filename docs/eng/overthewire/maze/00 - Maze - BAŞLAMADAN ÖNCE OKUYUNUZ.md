# Read Before Starting Maze — Prerequisites & Topic Guide

> This document explains what topics you need to master before starting the OverTheWire **Maze**
> wargame. Maze is a lab mixing **32-bit Linux x86 binary exploitation + reverse engineering**
> (9 levels: maze0 → maze8, each giving the next user's password). Unlike Behemoth/Utumno,
> it doesn't repeat a single pattern — **each level covers a completely different vulnerability
> class**. The following are genuinely required knowledge areas. (Contains no solutions.)

---

## 0. What is Maze, what does it expect?

- Server: `maze.labs.overthewire.org:2225`, start with `maze0 / maze0`.
- 9 setuid programs (`/maze/maze0..maze8`), each `-r-sr-x---` (setuid to the next user).
- Protections **vary by level** (run `checksec` at each level):
  - Some have NX **disabled** (stack shellcode), some NX **enabled** (ROP/GOT/FSOP).
  - Canary present on some levels, absent on others; PIE always disabled; **no RELRO** (GOT writable).
  - **ASLR is OFF system-wide** → addresses are deterministic.
- All compiled **with debug_info** (not stripped) → symbols available via `objdump`/`gdb`.

**Prerequisite wargames:** `Bandit` → `Narnia` → `Behemoth` → `Utumno` (then Maze).
Maze difficulty: ~5/10 but **high topic variety**.

---

## 1. Vulnerability Classes Found in Maze (overview)

The essence of Maze: each level is a **different technique**. You must be familiar with these topics:

| # | Theme | Key concept |
|---|-------|-------------|
| 0 | **TOCTOU race condition** | `access()` vs `open()`, symlink swap, confused deputy |
| 1 | **Library hijacking** | relative `DT_NEEDED` (`./libc.so.4`), loading `.so` from CWD, constructor |
| 2 | **Executable stack** | calling a buffer as a function pointer, env shellcode + NOP sled |
| 3 | **Self-modifying code** | `mprotect` RWX, XOR runtime decrypt, hidden "magic constant" |
| 4 | **Weak file validation** | `execv(argv[1])`, setuid script + `#!/bin/sh -p` |
| 5 | **Keygen RE + anti-debug** | algorithm reversal, `ptrace(TRACEME)`, stdio buffering |
| 6 | **FILE struct exploitation (FSOP)** | `fp` overwrite, fake `_IO_FILE`, vtable validation, GOT write |
| 7 | **Parser overflow** | ELF header read with untrusted `e_shentsize` → stack overflow |
| 8 | **Format string** | `snprintf(buf,n,user)`, `%n` arbitrary write, GOT→`system` |

---

## 2. Linux & Shell Fundamentals (required)

| Topic | Why |
|-------|-----|
| SSH (`ssh maze0@maze.labs.overthewire.org -p 2225`) | access |
| **setuid bit**, `-r-sr-x---`, real vs **effective uid** | level 0 and general logic |
| `access(2)` uses real-uid, `open(2)` uses euid | the heart of TOCTOU |
| symlink, `ln -sf`, `/tmp` sticky bit | setting up race conditions |
| Environment variables (`environ`), `argv` layout | env shellcode addressing |
| `setresuid`/`setreuid`, why `#!/bin/sh -p` | preventing privilege drop in setuid |
| `/etc/maze_pass/mazeN` permissions | target password files |

---

## 3. Dynamic Linker (ld.so) Knowledge

- `readelf -d` → `DT_NEEDED`, `RPATH/RUNPATH`. Danger of **relative paths** (`./lib`).
- Setuid + **AT_SECURE**: `LD_PRELOAD`/`LD_LIBRARY_PATH` ignored; but **embedded** relative
  `NEEDED` in the binary still applies → loads `.so` from CWD.
- Lazy binding: an unresolved symbol doesn't error at load time (exiting in the constructor is enough).
- **Library constructor**: `__attribute__((constructor))` runs before `main`.
- Permission trap: the setuid victim enters the target directory as **euid** → directory must be `o+x`.

---

## 4. x86 (32-bit) Assembly & Memory

- Registers, **stack frame** (`ebp-N` locals, `[ebp+4]` return address), `leave; ret`.
- Reading `objdump -d -M intel`; breakpoints/stack/registers in `gdb`.
- **Syscall (`int 0x80`):** `eax`=number, `ebx/ecx/edx`=args (for shellcode).
- **Self-modifying:** `mprotect(addr&~0xfff, len, 7)` to make the page RWX, then write self.
- Stack layout: env/argv at the top; with ASLR off, addresses are **fixed** → learned via a printer.

---

## 5. Shellcode

- `execve("/bin/sh")` shellcode (32-bit), must be **null-free** (if embedded in a string).
- Typically prepend `setresuid(geteuid x3)` → prevents the shell from dropping privileges.
- **NOP sled + env shellcode**: without ASLR, env address is deterministic; a large sled forgives
  small address errors.
- `MAX_ARG_STRLEN = 128KB`: a single argv/env string cannot exceed this.
- A small **stub** (`mov eax,addr; jmp eax`) fitting in a small buffer jumps to the large shellcode.

---

## 6. ELF Format (for level 7)

- ELF32 header fields and offsets: `e_shoff(0x20)`, `e_shentsize(0x2e)`,
  `e_shnum(0x30)`, `e_shstrndx(0x32)`; `Elf32_Shdr` (40 bytes) fields.
- "Untrusted size field + `read` into fixed buffer" = parser overflow.

---

## 7. glibc FILE Structure (level 6 — advanced)

- `_IO_FILE` (32-bit) field offsets: `_flags(0x00)`, `_IO_write_ptr(0x14)`,
  `_IO_write_end(0x18)`, `_vtable_offset(0x46)`, `_mode(0x68)`, vtable(0x94).
- `fwrite/fprintf` → `_IO_file_xsputn` → `memcpy` to `_IO_write_ptr`.
- **vtable validation** (`_IO_vtable_check`): fake vtable forbidden → use the **real** `_IO_file_jumps`.
- `fopen("a")` + overflow to overwrite `fp` → **arbitrary write** primitive.

---

## 8. Format String (level 8)

- `printf(user)` / `snprintf(buf,n,user)` → `%p` leak, **`%n` arbitrary write**.
- Direct parameter access `%k$`, partial-address writes with `%hn`/`%hhn`.
- Even if `snprintf` truncates output, `%n` still counts the **full** (would-be) length.
- GOT overwrite → turn a function into `system`; control its argument.

---

## 9. Security Protections — Check These FIRST at Each Level

| Protection | Check | Effect |
|------------|-------|--------|
| NX/DEP | `checksec` / `readelf -l` GNU_STACK | disabled → shellcode; enabled → GOT/FSOP/ROP |
| Canary | `checksec` | affects overflow strategy |
| RELRO | `checksec` | **No RELRO** → GOT writable |
| ASLR | `/proc/sys/kernel/randomize_va_space` | **0** (off) in Maze → deterministic |
| PIE | `checksec` | disabled → fixed code/GOT addresses |

---

## 10. Anti-Debug & Service Details

- `ptrace(PTRACE_TRACEME)`: -1 ⇒ debugger present. Bypass: **don't pre-trace**; instead use a
  **parent tracer** that auto-sends `PTRACE_CONT` when the child stops. Use `setsid` to prevent
  job-control stops.
- TCP services that `fork`: the vulnerability is triggered **in the child** (after `setreuid`).
- **stdio buffering**: `scanf`/`fread` reads ahead → feeding input to a spawned shell requires
  **timing** (credentials first, short delay, then commands).

---

## 11. Tools

`ssh`, `objdump -d -M intel`, `readelf -d/-l/-S`, `nm`, `strings`, `file`,
`checksec`, `gdb`, `strace`, `ltrace`, `gcc -m32`, `python3` (socket/exploit),
`base64` (binary transfer).

---

## 12. "Am I Ready?" Checklist

- [ ] I understand setuid + real/effective uid difference and TOCTOU
- [ ] I can spot `DT_NEEDED`/relative path danger with `readelf -d`
- [ ] I can read 32-bit stack frames and `objdump` disassembly
- [ ] I know null-free `execve` shellcode + env/NOP-sled addressing
- [ ] `mprotect`/self-modifying and XOR decrypt concepts are clear
- [ ] I know ELF header fields and the parser overflow pattern
- [ ] I can apply format string `%n`/`%hn` and GOT overwrite
- [ ] I have heard of glibc FILE/FSOP basics (vtable check) (level 6, advanced)
- [ ] I know `ptrace` anti-debug and fork-service exploitation

If you can say "yes" to most of these, you're ready for Maze. For any "no" items,
reinforce **Behemoth + Utumno** first.

---

> This guide is a **topics/prerequisites** list only and contains no solutions. OverTheWire
> requests that solutions not be published online — these notes are for personal study only.
