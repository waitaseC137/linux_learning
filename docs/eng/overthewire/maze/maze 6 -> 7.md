# OverTheWire — Maze Level 6 → 7

> Goal: Get `maze7` password from `maze6`. Result: **`**********`** (hidden)
> Technique: `strcpy` stack overflow to **overwrite `FILE*` (FSOP)** → use a fake `FILE` to make
> `fprintf` perform an **arbitrary write to `GOT[exit]`** → the immediate `exit()` jumps to
> shellcode (NX disabled).

---

## 1. First Look
```bash
/maze/maze6 file2write2 string     # usage
checksec: No canary | NX DISABLED | No PIE | No RELRO
```

## 2. Analysis (pseudocode)
```c
char buf[256];                  // [ebp-0x104]
FILE *fp;                       // [ebp-0x4]   (immediately after buf)
if (argc != 3) { printf("%s file2write2 string\n", argv[0]); exit(-1); }
fp = fopen(argv[1], "a");
strcpy(buf, argv[2]);           // <-- OVERFLOW (no bound); buf+256 = fp
memfrob(buf, strlen(buf));      // XOR every byte with 42 (0x2a)
fprintf(fp, "%s : %s\n", argv[1], buf);
exit(0);                        // <-- main NEVER RETURNS
```

## 3. The Subtlety of the Vulnerability
- `strcpy` overflows the **256-byte `buf`**; the `fp` (FILE*) immediately above it can be
  clobbered.
- But `main` ends with `exit()` → **overwriting the return address is useless** (ret never runs).
- The only meaningful overflow target: **`fp`**. `fprintf(fp,...)` will use our fake FILE.
- **No RELRO** → `GOT` is writable. If we redirect `fprintf`'s output to **`GOT[exit]`**, we
  write an address there, and the very next `exit()` redirects to shellcode.
  **NX disabled** → point to shellcode in the environment.

## 4. Fake FILE (FSOP) Construction
The `fprintf → vfprintf → _IO_file_xsputn` path does a `memcpy` starting from the FILE's
**`_IO_write_ptr`**. So setting `_IO_write_ptr = GOT[exit]` routes the output to the GOT.

Critical fields for a fake 32-bit `_IO_FILE`:
| Offset | Field | Value | Reason |
|--------|-------|-------|--------|
| 0x00 | `_flags` | `0xFBAD8001` | magic + USER_LOCK (skip lock), no NO_WRITES/LINE_BUF |
| 0x14 | `_IO_write_ptr` | `GOT[exit]-10` | `"argv1 : "` (10 bytes) precedes buf, so buf lands exactly on GOT[exit] |
| 0x18 | `_IO_write_end` | large | ample room → `_IO_OVERFLOW` not called, just memcpy |
| 0x46 | `_vtable_offset` | `8` | read vtable from `0x94+8` (escape the **null** at 0x46) |
| 0x68 | `_mode` | `-1` | `_IO_fwide` returns negative (don't switch to wide mode) |
| 0x9c | vtable ptr | **real** `_IO_file_jumps` (`0xf7faa7a8`) | glibc **vtable validation** rejects fakes; use the real one |

> glibc 2.39 `_IO_vtable_check` rejects a fake vtable. Solution: point vtable to the **real**
> `_IO_file_jumps` (its `__xsputn = _IO_file_xsputn` already does the memcpy we want). The fake
> FILE is placed in env; the `_vtable_offset` trick avoids needing a null inside it.

## 5. Two More Complications
- **`memfrob`**: XORs `buf` with 42. The `fp` overwrite and the bytes to write live inside `buf`
  → **pre-frob them** (`argv2 = image XOR 0x2a`). After `memfrob`, `buf = image`.
- **Addresses**: ASLR off. The shellcode (`SC`) and fake FILE (`FF`) addresses in the env were
  found with a 32-bit printer whose argv/env/execfn lengths match exactly.
  `GOT[exit]=0x804b208`, vtable `0xf7faa7a8` found via gdb.

## 6. Exploit Flow
```
argv1 = "/tmp/m6"  (7 chars; fopen "a")
argv2 = frob( [bytes to write to GOT: SC_target][0x00 terminator][...][buf+256 = &FF] )
env   = { SC: NOPsled+shellcode , FF: fake FILE }
fp (overwritten) -> &FF
fprintf -> writes "/tmp/m6 : " + 4 bytes(SC_target) @ GOT[exit]
exit()  -> jmp *GOT[exit] -> shellcode (maze7) -> execve("/bin/sh")
```
```
SC=0xffffdd1c FF=0xffffdf4b sc_target=0xffffde1c
uid=15007(maze7) ... <maze7 password>
```

## Lessons
| Topic | Note |
|-------|------|
| `exit()` vs `ret` | If main doesn't return, return-address overflow is useless; need a different primitive (FILE*) |
| FSOP | Controlled `FILE*` + `fprintf` = arbitrary write; point `_IO_write_ptr` at target |
| glibc vtable check | Fake vtable rejected → use the **real** `_IO_file_jumps`, just manipulate the other fields |
| No RELRO | `GOT` writable → overwrite exit GOT entry for control |
| `memfrob` | XOR 42; pre-frob the payload |
| `_vtable_offset` | Shift vtable offset instead of zeroing the null-requiring `0x46` field |
