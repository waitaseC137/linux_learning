# Binary Analysis

Binary files don't contain directly readable text — but they can hide information inside. These tools are used to analyze binaries.

---

## file — File Type Detection

```bash
file [file]
```

Tells you the real type of a file — based on its content (magic bytes), not its extension.

```bash
$ file check
check: ELF 32-bit LSB executable, Intel 80386, dynamically linked

$ file data.txt
data.txt: ASCII text

$ file data.bin
data.bin: gzip compressed data

$ file ./-
./-: ASCII text    ← to tell whether something is binary or text
```

**Common outputs:**

| Output | Meaning |
|---|---|
| `ELF 32-bit LSB executable` | Linux executable binary |
| `ASCII text` | Readable text file |
| `data` | Unrecognized binary format |
| `gzip compressed data` | Compressed with gzip |
| `Bourne-Again shell script` | Bash script |

---

## strings — Extracting Text from a Binary

```bash
strings [file]
strings -n 8 file     # strings at least 8 characters long
strings file | grep "password"
```

Extracts the **printable character sequences** inside binary files. Minimum 4 characters (configurable).

```bash
$ strings check
/lib/ld-linux.so.2
libc.so.6
strcmp
printf
getchar
sex          ← the password right there in the binary!
/bin/sh
```

> ⚠️ The password is not always visible via `strings` — `ltrace` is more reliable. But it should always be tried as a first look.

---

## xxd — Hex Dump

```bash
xxd [file]
xxd -l 32 file        # first 32 bytes
xxd -s 100 file       # start at byte 100
xxd file | head -20   # first 20 lines
```

Shows the file in **hex + ASCII** format. Used to inspect the exact content of a binary.

```bash
$ xxd data | head -5
00000000: 1f8b 0808 3445 4b62 0003 6461 7461 322e  ....4EKb..data2.
00000010: 6269 6e00 0bc9 48cd c9c9 d751 2847 28ca  bin...H....Q(G(.
```

Left: offset (which byte), middle: hex values, right: ASCII equivalent (`.` = non-printable character).

**Converting hex back to a file:**
```bash
xxd -r file.hex > file.bin    # turn a hex dump into binary
```

---

## od — Octal Dump

```bash
od [file]
od -c file      # show in character format
od -x file      # show in hex format
od -An -tx1 file  # no offset, each byte in hex
```

An alternative to `xxd` — used especially for character-based analysis.

```bash
$ od -c data | head -3
0000000   \t  h  e     p  a  s  s  w  o  r  d     i  s  ...
```

---

## Converting Binary to ASCII

In Leviathan Level 4, running the binary prints output made of 0s and 1s. To convert it to ASCII:

**With Perl:**
```bash
# IMPORTANT: pack "B*" counts spaces as bits too → strip the spaces first
echo "01010100 01101001 ..." | tr -d ' ' | perl -lpe '$_=pack"B*",$_'
```

`pack "B*"` → converts a binary string into a byte sequence. With space-separated input, each space is interpreted as an extra bit and throws off the alignment (you get garbage), so the spaces must be stripped first with `tr -d ' '`. Likewise, the Python example below expects a contiguous bit string.

**With Python:**
```bash
python3 -c "
bits = '0101010001101001...'
n = int(bits, 2)
text = n.to_bytes((n.bit_length() + 7) // 8, 'big').decode()
print(text)
"
```

**With CyberChef:**  
Operations → "From Binary" → paste with the space separator → Output

---

## Summary

| Tool | What for |
|---|---|
| `file` | Learn the real type of a file (ELF, text, archive...) |
| `strings` | Extract readable text inside a binary |
| `xxd` | View a file in hex + ASCII format |
| `od` | Octal/character dump, character analysis |
| `perl -lpe 'pack"B*"'` | Convert a binary string to ASCII |
