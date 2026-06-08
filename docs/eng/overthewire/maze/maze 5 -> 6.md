# OverTheWire — Maze Level 5 → 6

> Goal: Get `maze6` password from `maze5`. Result: **`**********`** (hidden)
> Technique: Simple **keygen** (key generator) reverse engineering + `ptrace(TRACEME)` anti-debug
> bypass (auto-continue tracer) + stdio buffering timing.

---

## 1. First Look
```bash
/maze/maze5
# X----------------
#  Username:       Key: Wrong length you!
```
Reads **Username** and **Key** via `scanf("%8s")`; both must be **exactly 8 characters**. Then
calls `foo(user,key)` and gives a shell if it returns true.

## 2. Analysis — `main`
```c
scanf("%8s", user);  scanf("%8s", key);
if (strlen(user)!=8 || strlen(key)!=8) { puts("Wrong length you!"); exit(-1); }
if (ptrace(PTRACE_TRACEME,0,0,0) != 0) { puts("nahnah..."); return; }   // anti-debug
if (foo(user, key)) {
    puts("Yeh, here's your shell");
    setreuid(geteuid(), geteuid());
    system("/bin/sh");                  // <-- maze6 shell
} else puts("Nah, wrong.");
```

## 3. Analysis — `foo` (keygen)
```c
char buf[9] = "printlol";
for (i=0; i<strlen(user); i++)
    buf[i] = buf[i] - (2*i + (user[i]-'A'));   // transform based on user
for (i=7; i>=0; i--)
    if (buf[i] != key[i]) return 0;            // key must EQUAL the transformed buf
return 1;
```
We control both `user` and `key`. Choosing `user="AAAAAAAA"` makes `user[i]-'A'=0` →
`buf[i]="printlol"[i] - 2*i`:
```
p p e h l b c ^   ->  key = "ppehlbc^"   (all printable, enterable via scanf %s)
```
(Key bytes must not contain spaces/NUL — this choice guarantees that.)

## 4. Two Complications
- **`ptrace(PTRACE_TRACEME)`**: returns -1 under a debugger → prints "nahnah". Returns 0 when
  run normally → **passes**. But it has a side effect: the process is now considered "traced" by
  its parent; a SIGCHLD during `system()` causes it to **hang**.
  - **Solution:** run maze5 under a tiny **parent tracer** that auto-sends `PTRACE_CONT` when
    the child stops. TRACEME still returns 0 (check passes) but the flow doesn't block.
    Use `setsid()` to remove the controlling tty → prevents job-control stops too.
- **stdio buffering**: `scanf` reads stdin in blocks; it slurps up shell commands too, so by the
  time `system("/bin/sh")` spawns, those bytes are lost. **Solution:** send credentials first,
  **wait briefly** (let scanf finish), then send commands → the shell reads them from the raw pipe.

## 5. Exploit
```c
// tr.c — auto-continue tracer
setsid();
if(fork()==0) execl("/maze/maze5","/maze/maze5",0);
while(waitpid(pid,&st,0)==pid && !WIFEXITED(st)){
    int s=WSTOPSIG(st); if(s==SIGTRAP)s=0; ptrace(PTRACE_CONT,pid,0,s);
}
```
```bash
( printf 'AAAAAAAA\nppehlbc^\n'; sleep 2; printf 'cat /etc/maze_pass/maze6\n'; sleep 1 ) | ./tr
# Yeh, here's your shell
# uid=15006(maze6) ... <maze6 password>
```

## Lessons
| Topic | Note |
|-------|------|
| Keygen RE | Reverse the validation algorithm to produce valid input; trivial when we control both user and key |
| Printability | `scanf %s` rejects spaces/NUL → choose input that satisfies this |
| `ptrace(TRACEME)` anti-debug | -1 ⇒ debugger present; bypass: DON'T pre-trace (TRACEME would fail), instead use an **auto-continue tracer** to suppress the side effect |
| `setsid` | Removes the controlling tty, preventing job-control stops (SIGTTIN/TTOU) |
| stdio buffering | Difference between `scanf`/`read`; **timing** (credentials first, then commands) is needed to feed input to the spawned shell |
