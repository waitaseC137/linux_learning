# OverTheWire — Behemoth Level 0 → 1

> Goal: Get behemoth1 password from `behemoth0`. Result: **`**********`** (hidden)
> Technique: Read the hardcoded password comparison (`strcmp`) via `ltrace`.

---

## 1. Connection
```bash
ssh behemoth0@behemoth.labs.overthewire.org -p 2221   # password: behemoth0
```
Binaries are readable/executable (`-r-sr-x---`, group r-x).

## 2. Behavior
```
/behemoth/behemoth0   →   "Password: " ... "Access denied.."
```

## 3. Vulnerability — ltrace
The password is embedded in the binary and compared with `strcmp`:
```bash
echo "test123" | ltrace /behemoth/behemoth0
# printf("Password: ")
# strcmp("test123", "eatmyshorts")    <-- REAL PASSWORD
# puts("Access denied..")
```
Password = **`eatmyshorts`**. Entering it correctly gives `Access granted` + a behemoth1 shell.

## 4. Exploit
```bash
python3 -c '
import sys,time
sys.stdout.buffer.write(b"eatmyshorts\n"); sys.stdout.flush(); time.sleep(1.0)
sys.stdout.buffer.write(b"id; cat /etc/behemoth_pass/behemoth1\n"); sys.stdout.flush(); time.sleep(1.0)
' | /behemoth/behemoth0
```
> Send the password and wait briefly, then feed the command (for the spawned shell's stdin — stdio buffering).
Output: `Access granted..` → `uid=13001(behemoth1)` → password.



## Lessons
| Topic | Note |
|-------|------|
| ltrace | Shows libc calls → reveals `strcmp(input, secret)`, giving away the password |
| Embedded password | Hardcoded strings in a binary are visible via `strings`/`ltrace` |
