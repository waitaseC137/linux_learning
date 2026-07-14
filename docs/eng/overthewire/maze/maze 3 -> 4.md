# OverTheWire — Maze Level 3 → 4

> Goal: Get `maze4` password from `maze3`. Result: **`**********`** (hidden)
> Technique: **Self-modifying code** + `mprotect` RWX + XOR decryption → hidden "magic byte"
> password.

---

## 1. First Look
```bash
file /maze/maze3       # statically linked, 32-bit, NOT stripped, only 4728 bytes
/maze/maze3            # output: "./level4 ev0lcmds!"   <-- TRAP / misdirection
```
Statically linked, very small, hand-written assembly (`maze3.asm`). 11 symbols:
`_start, fine, l1, d1, d1sz, prgmsz`.

## 2. Analysis — `_start`
```asm
pop eax ; dec eax ; jne fine     ; is argc==1? (i.e., no arguments?)
call ...                          ; jmp/call/pop trick to get string address
; write(1, "./level4 ev0lcmds!\n", 20) ; exit(1)   <-- printed when run without args (TRAP)
```
If an argument is provided, execution goes to `fine` — the real work happens there.

## 3. Analysis — `fine` (self-modifying)
```asm
mov eax, 0x7d                ; __NR_mprotect (125)
mov ebx, 0x8049000 ; and ebx, 0xfffff000   ; align code page
mov ecx, 0xa3 ; mov edx, 0x7 ; int 0x80     ; mprotect(page, , PROT_RWX) -> code is writable
lea esi, [0x804906b]         ; esi = d1 (encrypted region)
mov edi, esi ; mov ecx, 0x38 ; mov edx, 0x12345678   ; XOR key
l1: lodsd ; xor eax, edx ; stosd ; loop l1  ; decrypt d1 IN-PLACE
; ... falls through to decrypted d1 and executes it
```
The `d1` region is XOR-encrypted with `0x12345678`. It is decrypted in place then executed →
code hidden from static analysis.

## 4. Cracking the Password
I decrypted `d1` locally with XOR and disassembled it:
```asm
pop eax                        ; eax = argv[1]
cmp DWORD PTR [eax], 0x1337c0de ; first 4 bytes of argv[1] must equal the MAGIC value
jne  exit                       ; if not, exit(1)
mov ebx, 0x3a9c                 ; 0x3a9c = 15004 = maze4 UID
push 0x46 ; pop eax             ; eax = 70 = __NR_setreuid
mov ecx, ebx ; int 0x80         ; setreuid(15004, 15004)  -> switch to maze4
; execve("/bin//sh", ...)
exit: exit(1)
```
So `argv[1]` must start with `0x1337c0de` ("1337 c0de") → little-endian bytes `\xde\xc0\x37\x13`.
With the correct bytes the program does `setreuid(maze4)` + `execve("/bin/sh")`.

## 5. Exploit
```bash
# argv[1] = \xde\xc0\x37\x13  (0x1337c0de little-endian)
printf 'cat /etc/maze_pass/maze4; id\n' | \
  python3 -c "import os; os.execve('/maze/maze3',['/maze/maze3', bytes.fromhex('dec03713')], {'PATH':'/usr/bin:/bin'})"
# uid=15004(maze4) ... <maze4 password>
```

## Lessons
| Topic | Note |
|-------|------|
| Self-modifying code | Encrypted/packed payload is decrypted at runtime → static disasm alone is insufficient |
| `mprotect(...,PROT_EXEC|WRITE)` | Makes code page RWX and writes to itself; signature of runtime-decrypt |
| XOR decryption | With key (`0x12345678`) + encrypted region (`d1`) in hand, decrypt offline and disassemble |
| Misdirection (red herring) | "./level4 ev0lcmds!" is only a trap printed when run without arguments |
| jmp/call/pop | Classic shellcode trick for position-independent string address retrieval |
| Magic constants | Constants like `0x1337c0de` and `0x3a9c` (=target uid) reveal intent |
