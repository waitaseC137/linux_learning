# ltrace and strace

Tools for observing a binary's behavior at runtime. Without needing source code, you can understand what the binary does.

---

## ltrace — Library Call Tracer

```bash
ltrace ./binary
ltrace ./binary argument
ltrace -e strcmp ./binary     # show only strcmp calls
```

Shows, in real time, the **C library function calls** (libc) a binary makes while running.

```bash
$ ltrace ./check
printf("password: ")
getchar()          → 's'
getchar()          → 'e'
getchar()          → 'x'
strcmp("sex", "sex")   = 0   ← matched!
system("/bin/sh")              ← shell opened
```

**Why is it so powerful?**  
Password checks are often done as `strcmp(entered, real_password)`. `ltrace` shows both arguments — the real password appears directly.

**Watch out — decoy calls:**
```bash
$ ltrace ./level3
strcmp("h0no33", "kakaka")     ← THIS IS NOT THE REAL ONE (a distraction)
printf("Enter the password> ")
fgets("test\n", 256, ...)
strcmp("test\n", "snlprintf\n") ← THE REAL COMPARISON
```

A binary may contain more than one `strcmp`. To figure out which one is the actual check, pay attention to the ordering and context.

---

## Commonly Traced Functions

### strcmp — String Comparison

```c
strcmp(s1, s2)
// Return: 0 → equal, <0 → s1 < s2, >0 → s1 > s2
```

The function most often used in password checks. In `ltrace` output:
```
strcmp("entered_password", "real_password") = -1
```

### fgets — Reading Input

```c
fgets(buffer, size, stdin)
```

Reads a line from the user. In `ltrace` output you can see which buffer received what.

### fopen — Opening a File

```c
fopen("/tmp/file.log", "r")
// Return: 0 → file not found, otherwise → success
```

You see which file the binary tries to open:
```bash
$ ltrace ./leviathan5
fopen("/tmp/file.log", "r") = 0   ← file does not exist
puts("Cannot find /tmp/file.log")
```

With this info you can link `/tmp/file.log` to the password file.

### access — Access Check

```c
access("/path/to/file", 4)   // 4 = read permission
// Return: 0 → access granted, -1 → denied
```

Watch out when you see `access()` followed by `open()`/`system()`: the **difference** between the two can be exploited. There are two ways — (1) by parsing the string differently (the space-based argument splitting in Leviathan 2), (2) by swapping the file in the time window between them (a real **TOCTOU** race).

### system — Running a Command

```c
system("/bin/cat /path/to/file")
```

Shows the shell commands the binary runs:
```bash
$ ltrace ./printfile .bashrc
access(".bashrc", 4)                     = 0
snprintf("/bin/cat .bashrc", 511, ...)   = 16
system("/bin/cat .bashrc")               ← here is the command!
```

---

## strace — System Call Tracer

```bash
strace ./binary
strace -e open,read ./binary    # only open and read calls
strace -p <PID>                 # attach to a running process
```

Lower level than `ltrace` — instead of library functions, it shows **kernel system calls** (syscalls).

```bash
$ strace ./check
execve("./check", ["./check"], ...)
open("/etc/ld.so.cache", O_RDONLY)
read(3, "\177ELF"..., 512)
write(1, "password: ", 10)
read(0, "test\n", 1024)
...
```

**ltrace vs strace:**

| | ltrace | strace |
|---|---|---|
| Shows | Library functions (strcmp, printf...) | Kernel calls (read, write, open...) |
| Level | High (readable) | Low (detailed) |
| For finding passwords | ✅ Better | ❌ Harder |
| For seeing file access | ✅ via fopen | ✅ via open syscall |

In Leviathan, `ltrace` is usually enough. `strace` is used more for investigating file-system accesses.
