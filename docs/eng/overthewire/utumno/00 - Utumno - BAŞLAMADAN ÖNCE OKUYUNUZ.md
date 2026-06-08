# Before You Start Utumno — Prerequisites & Topic Guide

> This document describes what you need to know before starting the OverTheWire **Utumno**
> wargame. Utumno is a **32-bit Linux x86 binary exploitation** lab; the goal is not "find the
> password" but to **trick a running program into giving you a shell**. The topics below are
> what you actually need for levels 0→8.

---

## 0. What is Utumno, what does it expect?

- 8 binaries (utumno0 → utumno7); each is a **setuid** program that runs with the next
  user's privileges. Exploit one to get a shell, then read that user's password.
- They all share these properties:
  - **32-bit** (i386) ELF
  - **`-fno-stack-protector`** → NO stack canary
  - **`GNU_STACK = RWE`** → stack is **EXECUTABLE** (shellcode can run on the stack)
  - **ASLR disabled** → addresses are fixed / predictable
- So modern protections are largely off; these are textbook versions of classic techniques.

**Prerequisite wargames (finish these first):**
`Bandit` (Linux/shell basics) → `Leviathan`/`Narnia` (intro exploits) →
`Behemoth` (one difficulty below Utumno). Utumno difficulty: 4/10.

---

## 1. Linux & Shell Basics

| Topic | Why you need it |
|-------|-----------------|
| SSH login (`ssh user@host -p 2227`) | Lab access |
| File permissions `rwx`, **setuid bit (`s`)** | What `-r-sr-x---` means, why it runs as that user |
| User/group, `id`, `whoami` | What privileges do I have, who is the target |
| `/tmp`, `mktemp -d`, temp workspace | Compile and run exploit files |
| I/O redirection `< > \|`, pipe, `/dev/null` | Feed input to programs, capture output |
| Environment variables (`export`, `env`, `environ`) | Putting shellcode in env (very common) |
| `argc`/`argv` (command line arguments) | Most levels take input via argv |

**Key concept — setuid:** A file like `-r-sr-x--- utumno8 utumno7 utumno7` can be run by
the utumno7 group but executes **with utumno8's privileges**. If you exploit it and get a
shell, that shell is utumno8 → you can read `/etc/utumno_pass/utumno8`.

---

## 2. C Language — The Source of Vulnerabilities

The levels are small C programs. You need to be able to read and understand:

- **Pointers**, array-pointer relationship, `&`, `*`
- **Dangerous functions:** `strcpy`, `strcat`, `gets`, `sprintf` (no length check)
  vs. `strncpy`, `memcpy`, `snprintf` (have bounds but are tricky)
- **Integer types and signedness:** `int` vs `unsigned`, `short`, `char`;
  **truncation** (32-bit → 16-bit) and **signed/unsigned comparison** bugs
- `setjmp`/`longjmp` (save/restore control flow) — advanced
- `malloc`, `atoi`, `strtoul`, `strlen`, `getchar` behavior

> Typical bugs seen in Utumno: unchecked `strcpy`, length check bypassed by `(short)` truncation,
> **signed** bounds check, negative/huge array index.

---

## 3. x86 (32-bit) Assembly Basics

Static analysis requires reading `objdump` output and mentally visualizing the stack.

- **Registers:** `eax ebx ecx edx esi edi`, **`esp`** (stack pointer), **`ebp`**
  (base/frame pointer), **`eip`** (instruction pointer)
- **Stack mechanics:** grows downward (high→low address); `push`/`pop`
- **Function prologue/epilogue:**
  ```
  push ebp ; mov ebp,esp ; sub esp,N     ; set up frame
  leave (= mov esp,ebp ; pop ebp) ; ret  ; tear down frame, return
  ```
- **Stack frame layout:**
  ```
  [ebp-N] ... local variables (buffers)
  [ebp+0] = saved ebp
  [ebp+4] = RETURN ADDRESS   <-- exploit target
  [ebp+8] = 1st argument ...
  ```
- **cdecl calling convention:** arguments pushed right-to-left, return in `eax`
- How **`call`/`ret`** push/pop the return address
- Addressing like **`mov [ebp+eax*4-0x30], edx`** (base+index*scale+offset)
- **Syscall (int 0x80):** `eax`=number, `ebx,ecx,edx`=arguments (for shellcode)

**Why this is critical:** "How many bytes from the buffer to the return address?" always
comes from this frame layout (e.g. `buf=ebp-0xc` → return address is `0xc+4=16` bytes away).

---

## 4. Process Memory Layout

- A process's map: **text (code)**, **data/bss**, **heap** (malloc), **stack**,
  **shared libraries (libc)**, **env/argv** (at the top of the stack)
- **Top of stack:** env strings first, then argv strings below, then pointer arrays,
  then `argc` at the bottom. (That's why **even a huge argv doesn't shift env addresses** —
  env is always at the top.)
- **ASLR (Address Space Layout Randomization):** when enabled, addresses change every run;
  in Utumno it's **DISABLED** → addresses are fixed, can be hardcoded in exploits.
- Reading your own memory map via `/proc/self/maps` (useful for dump techniques)

---

## 5. Tools — Static & Dynamic Analysis

| Tool | Purpose |
|------|---------|
| `file` | 32/64-bit, dynamically linked, stripped? |
| `strings` | Text inside the binary, hints, compiler flags |
| `readelf -l ... \| grep GNU_STACK` | Is the stack executable (RWE)? |
| `objdump -d -M intel` | **Disassembly** (main analysis tool) |
| `objdump -s -j .rodata` | Constants (strings, tables) |
| `gdb` (+ pwndbg/gef) | Dynamic analysis, breakpoints, register/stack inspection |
| `strace` | Trace **syscalls** (is it reading input, where does it write, segfault address) |
| `ltrace` | Trace libc calls |
| `gcc -m32` | Compile 32-bit helper programs/launchers |
| `objdump -D -b binary -m i386` | Disassemble raw bytes |

> Tip: Even for an execute-only binary (no read permission), once it runs it's mapped into
> memory as readable segments — you can "read" it via `LD_PRELOAD`/`/proc/self/maps` or a
> debugger (that's the essence of utumno0).

---

## 6. Security Mitigations & How to Check

Check these FIRST for every level — they determine your attack strategy:

| Mitigation | What it does | How to check | In Utumno |
|------------|-------------|--------------|-----------|
| **Stack canary** | Catches overflow on return | `strings`/compiler flag `-fstack-protector` | OFF |
| **NX / DEP** | Forbids executing code on stack | `readelf -l` GNU_STACK `RWE` or `RW` | OFF (RWE) |
| **ASLR** | Randomizes addresses | banner / behavior | OFF |
| **RELRO** | Protects GOT | `readelf -l` | out of scope |
| **PTR_MANGLE** | Masks `esp/eip` in `setjmp/longjmp` (`ror/xor guard`) | glibc internal | ON (utumno7) — guard random per exec |

---

## 7. Vulnerability Classes (Seen in This Lab)

Knowing these conceptually lets you quickly identify what type of bug each level contains:

1. **Classic stack buffer overflow** — overwriting return address via `strcpy`/`memcpy`
2. **Off-by / null-terminator difference** — `strcpy` (adds null) vs `strncpy` (doesn't)
3. **Integer truncation** — length check is 16-bit, copy is 32-bit
4. **Signed/unsigned comparison bug** — a large value looks negative, bypasses the check
5. **Out-of-bounds / arbitrary write** — `array[index]=value`
6. **`getchar` loop for byte-by-byte arbitrary write**
7. **`jmp_buf` overflow + PTR_MANGLE bypass** (advanced, ebp-pivot)
8. **Reading an execute-only file** (permission/recon problem)

---

## 8. Shellcode

- **What is shellcode:** directly executed machine code; typical goal is to open a shell
  with `execve("/bin/sh", ...)`.
- **setuid protection:** before spawning a shell, call `setreuid(geteuid(), geteuid())` to
  lock in the privilege (otherwise the shell may drop it).
- **Bad characters (forbidden bytes):** some bytes cannot be used depending on how the data
  is copied:
  - `strcpy`/`strlen` context → **null byte (`0x00`) forbidden**
  - Embedded in filename → **`/` (0x2f) and `0x00` forbidden**
  - Therefore build strings **at runtime** (via XOR/stack push) — the concept of
    "null-free, slash-free shellcode".
- **NOP sled (`0x90`...):** when it's hard to hit the exact return address, jump to a large
  region of NOPs in front; execution slides down to the shellcode.
- **Where to put shellcode:** usually put NOP sled + shellcode in an **environment variable**
  (env), then calculate the (fixed, since ASLR is off) address deterministically.

---

## 9. Exploitation Techniques

- **Return address overwrite:** redirect return address to shellcode
- **ret2stack:** run shellcode on the stack if it's executable
- **env-shellcode + NOP sled:** put sled in env, jump to midpoint
- **Address finding (without ASLR):** run a "printer" under identical conditions (same
  argv/env/path length) and print `environ[0]` — deterministic
- **When you can't pass arguments directly:** write a **launcher** that uses `execve()` with
  a crafted `argv`/`envp` to start the target (e.g. levels requiring `argc==0`)
- **ebp/stack pivot:** instead of overwriting the return address directly, control `ebp`
  and use `leave; ret` to redirect flow (used to bypass PTR_MANGLE)

---

## 10. Practical Workflow (Every Level)

```
1. ls -la /utumno/   → permissions, which binary, who is suid
2. file / strings / readelf → architecture, mitigations, hints, function names
3. objdump -d -M intel → read main + helpers, FIND THE BUG
4. Extract buffer→ret offset and input channel (argv? stdin? env?)
5. Identify badchars → choose/write appropriate shellcode
6. Put shellcode in env, find address deterministically
7. Build payload (padding up to offset + address), run it
8. Debug with strace (segfault address, syscalls)
9. Once you have a shell: cat /etc/utumno_pass/<next>
```

> **Golden debugging rule:** `strace` drops setuid (runs as your user) but since ASLR is off
> **addresses remain the same** → great for seeing logic/segfault without affecting the exploit.
> `rc=0` (clean return) ≠ `rc=139` (segfault); that difference tells you a lot.

---

## 11. "Am I Ready?" Checklist

- [ ] I can SSH in and interpret file permissions and setuid
- [ ] I can draw a 32-bit stack frame and calculate "how many bytes from buffer to ret"
- [ ] I can read `objdump` disassembly and convert it to C pseudocode
- [ ] I know the `int`/`unsigned`/`short` and signed comparison traps
- [ ] I understand the differences between `strcpy` vs `strncpy`, truncation, OOB write
- [ ] I can explain a simple `execve("/bin/sh")` shellcode
- [ ] I know NOP sled, badchar, and env-shellcode concepts
- [ ] I'm comfortable using `gcc -m32`, `strace`, and `gdb`
- [ ] I know what ASLR/NX/canary do and how to check for them

If you can say "yes" to most of these, you're ready for Utumno. For the "no"s, first solidify
with **Bandit + Narnia/Behemoth**.

---

## 12. Recommended Resources

- **Bandit / Leviathan / Narnia / Behemoth** (OverTheWire) — sequential prerequisites
- "Smashing The Stack For Fun And Profit" (Aleph One) — classic foundation
- *Hacking: The Art of Exploitation* (Jon Erickson) — shellcode/env address techniques
- Linux man pages: `execve(2)`, `setjmp(3)`, `strcpy(3)`, `dlopen/ld.so(8)`
- x86 assembly reference + `pwntools` documentation (shellcraft, asm)

> This guide is a **topic/prerequisite list only** — it contains no solutions.
