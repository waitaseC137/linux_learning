# Read Before You Start Vortex — Prerequisites & Topic Guide

> This document describes which topics you need to master before starting the OverTheWire
> **Vortex** wargame. Vortex is a **32-bit x86 Linux binary exploitation** game, but
> interestingly it **starts with network/socket programming** (27 levels: vortex0 → vortex26).
> Unlike Narnia/Behemoth, it doesn't drill a single pattern but walks through **the entire
> classic binary exploitation curriculum**: overflow, format string, heap, ret2libc/ROP, then
> cryptanalysis + RE/keygen.
> (This document **contains no solutions** — only prerequisites and a map of the terrain.)

---

## 0. What is Vortex, what does it expect?

- **The entry is different:** vortex0 doesn't start with SSH but by connecting to the port **`vortex.labs.overthewire.org:5842`** and solving a network task; as a reward it hands you the vortex1 credentials.
- **After that it's SSH:** `ssh vortexN@vortex.labs.overthewire.org -p 2228` (⚠️ **2228**, not 2223 — that's Leviathan).
- The server is **32-bit x86, little-endian**. Files live under `/vortex/`; each level program is `-r-sr-x---` (**setuid** to the next user).
- The target password is `/etc/vortex_pass/vortexN` (readable only by that user) → the general idea is to exploit the program and get it to read the file with that user's privileges.
- **Source code is NOT provided for most levels** → you disassemble the binary yourself with `objdump`/`gdb`. This is the concrete reason it's said to "teach assembly."
- **Prerequisite wargames:** Bandit → Narnia → Behemoth → Utumno (then Vortex). Difficulty ~6/10, but the **range of topics** is very broad.

**Surprise warning:** the "advanced memory corruption" (heap/ROP) you'd expect **is not** in the upper half but clusters in the middle region (8–13). The upper half (14–26) is more about **cryptanalysis + reverse engineering + keygen**.

---

## 1. Level Map (conceptual — not solutions)

| # | Theme | Key concept |
|---|------|----------------|
| 0 | **Network + endianness** | socket client; read/sum/send 4×uint32 in **host byte order** (little-endian) |
| 1 | **Unbounded pointer** | `ptr` decrement (no bound) → overwrite itself → embedded shell condition |
| 2 | **Argument injection** | setuid program passes a user argument to `tar` as an operand |
| 3 | **Shellcode + setuid** | stack overflow; the shell drops privileges → `setresuid` in the shellcode |
| 4 | **Format string** | leak with `%x` / write with `%n`; argc-check twist; GOT overwrite |
| 5 | **Crypto brute** | short (5-character) MD5 brute force |
| 6 | **Reverse engineering** | no source → disassemble and find the hole yourself |
| 7 | **CRC32 inversion** | produce input that reaches the target checksum |
| 8 | **Dynamic linking / PLT-GOT** | analyze a dynamically-linked binary + function pointer |
| 9 | **NX / ret2libc** (no official description → verify yourself) | defeat a non-executable stack with code reuse |
| 10 | **PRNG seed** | recover the seed from 20 numbers (30-second limit) |
| 11 | **Heap** | phkmalloc (OpenBSD) metadata corruption |
| 12 | **NX bypass** | ret2libc / ROP |
| 13 | **ROP + size constraint** | NX + a payload that fits into a very small space |
| 14 | **Weak stream cipher** | RC4-type + traffic analysis |
| 15 | **Known-plaintext** | 8-byte A–Z key brute + file-signature verification |
| 16 | **Partial key** | 100 bits of a 128-bit key given, ~28 bits brute |
| 17 | **Working backwards** | no target given; infer the vulnerability from black-box observation |
| 18 | **Predictable seed** | weak `urandom`/PRNG seeding |
| 19 | **Keygen** | break a weak binary encryption and write a key generator |
| 20 | **Integer overflow** | remote integer boundary bug |
| 21 | **Reverse-me** | solve it by understanding the encryptor |
| 22 | **Object analysis** | verification logic from `.o` files → keygen |
| 23 | **"Mirror"** (unclear) | title hint; independent research |
| 24 | **glibc `random_r`** | recompute the seed from the RNG internal state |
| 25 | **MISSING** | no longer active (24→26 bridge) |
| 26 | **Meta-final** | write your own level + its exploit (the end) |

> The last technical level in practice is **24** (25 is missing, 26 is meta). vortex9/23 have no official description → verify yourself in the box.

---

## 2. Network & Byte Order — the heart of vortex0

- **host byte order** = the machine's natural order (x86 → **little-endian**); **network byte order** = big-endian. `htonl`/`ntohl` convert between the two.
- Raw socket: `recv` may return fewer bytes → complete it in a loop; interpret/pack binary data with `struct.pack/unpack` (`<`=little).
- 32-bit overflow: the sum of 4 numbers exceeds 32 bits → `& 0xFFFFFFFF` (mod 2³²).

## 3. x86 (32-bit) Assembly & Memory

- **Stack frame:** `push ebp; mov ebp,esp`; locals at `ebp-N`, the saved return address at `[ebp+4]`. The overflow distance (offset) is computed from this layout.
- **Calling convention (cdecl):** arguments pushed onto the stack right-to-left; the caller cleans up. Decisive in format-string and ret2libc.
- **Registers:** EAX (return), EBP/ESP (frame), EIP (target). Addresses are 4-byte **little-endian**.
- **Syscall:** `int 0x80` + EAX (number) / EBX,ECX,EDX (args). (**Not** the 64-bit `syscall`+RDI/RSI.)
- Reading: `objdump -d -M intel`, `pwndbg`/`gdb` (breakpoint, `x/`, `info registers`).

## 4. Shellcode

- `execve("/bin/sh")` (32-bit); if it's embedded in a string it must be **null-free** (`strcpy` cuts off at 0x00 → zero out registers with xor).
- On setuid levels the shell may drop privileges → `setreuid/setresuid(geteuid())` in the shellcode.
- `pwntools`: `asm(...,arch='i386')`, `shellcraft.i386.linux.sh()`, `cyclic`/`cyclic_find` (offset).

## 5. Cryptanalysis & RNG (upper half)

- Short/weak hash (MD5), weak stream cipher (RC4), known-plaintext, constrained-keyspace brute.
- The **PRNG vulnerability** trio (10, 18, 24): recomputing the seed/state from output; glibc `random_r` internal structure.
- RE/keygen: extract the verification algorithm with `objdump`/`radare2` and reverse-code it.

## 6. Security Mitigations — check FIRST on every level

| Mitigation | Check | Effect |
|--------|---------|--------|
| NX/DEP | `checksec`, `readelf -l` GNU_STACK | off → shellcode; on → ret2libc/ROP |
| Canary | `checksec` | overflow strategy (present on some levels in Vortex) |
| ASLR | usually not deterministic → confirm per level | address finding |

---

## 7. Tools

`ssh`, `nc`, `python3` (socket + `struct`), `objdump -d -M intel`, `readelf`, `nm`, `strings`,
`gdb`/`pwndbg`, `strace`/`ltrace`, `gcc -m32`, `nasm`, `pwntools` (`ssh`/`process`/`p32`/`asm`/`cyclic`/`ROP`),
`ropper`/`ROPgadget` (ROP), `radare2` (RE/keygen).

## 8. "Am I Ready?" Checklist

- [ ] I can write a TCP socket client and apply the **host vs network byte order** difference
- [ ] I can read a 32-bit stack frame + `objdump` disasm (source isn't provided!)
- [ ] I know null-free `execve` shellcode + setuid privilege-drop (`setresuid`)
- [ ] I can apply format string `%n` / GOT overwrite logic
- [ ] I know how to defeat NX with ret2libc / ROP (ropper/ROPgadget)
- [ ] I've heard of heap (phkmalloc) and PRNG-seed recomputation concepts
- [ ] I can extract an algorithm for a keygen with `radare2`/`objdump`

If you say "yes" to most of these, you're ready for Vortex. If you have "no"s, first solidify **Narnia + Behemoth**.

---

> This guide is only a **topic/prerequisite** list, it contains no solutions. OverTheWire asks
> that solutions not be published on the web — these notes are for your personal study. Passwords
> in this repo are always kept **masked** (`**********`).
