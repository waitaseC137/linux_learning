# 📦 Linux Commands — Compression & Encoding

> Compressing files, archiving them, and converting them between formats  
> is a fundamental part of system administration and security.  
> These commands were used heavily in Bandit's most complex levels (Levels 12-13).

---

## 📋 Table of Contents

- [base64](#base64)
- [xxd](#xxd)
- [gzip](#gzip)
- [bzip2](#bzip2)
- [tar](#tar)
- [zip & unzip](#zip--unzip)

---

## base64

**Base64** — Converts binary data into ASCII text format (or back).

### What Is Base64?

Binary data (images, encrypted data, etc.) can't be sent directly through text channels (email, URLs, JSON). Base64 represents this data using only 64 ASCII characters (`A-Z`, `a-z`, `0-9`, `+`, `/`).

```
Example:
"Hello" → SGVsbG8=
```

- Every 3 bytes → 4 base64 characters
- The `=` characters at the end are padding
- The data size grows by about 33%

### Basic Usage
```bash
base64 file.txt             # encode a file
base64 -d encoded.txt       # decode it
echo "Hello" | base64       # encode a string
echo "SGVsbG8K" | base64 -d # decode a string
```

### Important Flags

| Flag | Description |
|---|---|
| `-d` or `--decode` | Decode |
| `-w 0` | Encode without line breaks (default is 76 characters) |
| `-i` | Ignore invalid characters |

### Example

```bash
$ echo "Hello World" | base64
SGVsbG8gV29ybGQK

$ echo "SGVsbG8gV29ybGQK" | base64 -d
Hello World
```

### Usage in Bandit
```bash
# Level 10: decode the base64-encoded file
cat data.txt
# VGhlIHBhc3N3b3JkIGlzIElGdWt3S0dzRlc4TU9xM0lSRnFyeEUxaHhUTkViVVBSCg==

base64 -d data.txt
# The password is <password>
```

---

## xxd

**Hex Dump** — Displays a file in hexadecimal format, or converts back from hex.

### Basic Usage
```bash
xxd file                # show a hexdump
xxd -r hexdump.txt      # convert a hexdump back to binary
xxd file | head         # show the first few lines
```

### Reading the Output

```bash
$ xxd /etc/hostname
00000000: 6e61 726e 6961 0a                        narnia.
^         ^                                        ^
|         |                                        ASCII equivalent
|         hex values (16 bytes/line)
offset (byte position)
```

### Important Flags

| Flag | Description |
|---|---|
| `-r` | Convert a hexdump back to binary (reverse) |
| `-p` | Plain hex output (no address or ASCII) |
| `-l N` | Show only N bytes |
| `-s N` | Start from byte N |
| `-c N` | Show N bytes per line |
| `-b` | Show in binary (bits) |

### Detecting the Magic Number

To determine a file's type, you look at the first few bytes:

```bash
$ xxd data | head -n 1
00000000: 1f8b 0808 ...   → 1f 8b = gzip!

$ xxd data | head -n 1
00000000: 425a 6839 ...   → 42 5a 68 = BZh = bzip2!

$ xxd data | head -n 1
00000000: 5573 7461 ...   → "Usta" = a file name inside a tar archive
```

### Usage in Bandit
```bash
# Level 12: convert the hexdump file back to binary
xxd -r hexdump_data compressed_data

# check the file type at each step
xxd compressed_data | head -n 1
```

---

## gzip

**GNU Zip** — Compresses/decompresses in the `.gz` format. The most common Linux compression format.

### Basic Usage
```bash
gzip file.txt           # compress → file.txt.gz is created, original is deleted
gzip -d file.txt.gz     # decompress → file.txt is created, .gz is deleted
gunzip file.txt.gz      # same as gzip -d
gzip -k file.txt        # compress but keep the original
```

### Important Flags

| Flag | Description |
|---|---|
| `-d` | Decompress |
| `-k` | Keep the original file |
| `-v` | Show operation details |
| `-l` | Show compression info |
| `-r` | Compress a directory recursively |
| `-1` | Fast (low compression) |
| `-9` | Slow (high compression) |
| `-c` | Write the output to stdout |

### Using It with Pipes

```bash
# read a compressed file directly (without decompressing)
zcat file.gz
zgrep "pattern" file.gz

# write to stdout
gzip -c file.txt > backup.gz
```

### Usage in Bandit
```bash
# Level 12: decompress the .gz file
mv compressed_data compressed_data.gz
gzip -d compressed_data.gz

# gzip detection by magic number: 1f 8b
```

---

## bzip2

**Block-sorting compressor** — Compresses/decompresses in the `.bz2` format. Compresses better than gzip but is slower.

### Basic Usage
```bash
bzip2 file.txt          # compress → file.txt.bz2
bzip2 -d file.txt.bz2   # decompress
bunzip2 file.txt.bz2    # same as bzip2 -d
bzip2 -k file.txt       # keep the original
```

### Important Flags

| Flag | Description |
|---|---|
| `-d` | Decompress |
| `-k` | Keep the original |
| `-v` | Verbose output |
| `-z` | Compress (default) |
| `-t` | Test the file (is it corrupted?) |

### gzip vs bzip2 vs xz

| Format | Extension | Speed | Compression |
|---|---|---|---|
| gzip | `.gz` | Fast | Medium |
| bzip2 | `.bz2` | Medium | Good |
| xz | `.xz` | Slow | Very good |

### Usage in Bandit
```bash
# Level 12: decompress the .bz2 file
mv compressed_data compressed_data.bz2
bzip2 -d compressed_data.bz2

# bzip2 detection by magic number: 42 5a 68 (BZh)
```

---

## tar

**Tape Archive** — Bundles files into a single archive file. It doesn't compress (but can be combined with gzip/bzip2).

### Basic Usage
```bash
tar -cf archive.tar files/      # create an archive
tar -xf archive.tar             # extract an archive
tar -tf archive.tar             # list the contents
tar -xf archive.tar -C /target/ # extract to a specific directory
```

### Important Flags

| Flag | Description |
|---|---|
| `-c` | Create an archive |
| `-x` | Extract an archive |
| `-t` | List the contents |
| `-f file` | Specify the archive file |
| `-v` | Verbose output |
| `-z` | Compress/decompress with gzip |
| `-j` | Compress/decompress with bzip2 |
| `-J` | Compress/decompress with xz |
| `-C dir` | Extract to the specified directory |
| `-p` | Preserve permissions |

### Creating an Archive

```bash
# plain tar (no compression)
tar -cf archive.tar folder/

# compressed with gzip
tar -czf archive.tar.gz folder/

# compressed with bzip2
tar -cjf archive.tar.bz2 folder/

# compressed with xz
tar -cJf archive.tar.xz folder/
```

### Extracting an Archive

```bash
# pick the right flag based on the extension
tar -xf archive.tar
tar -xzf archive.tar.gz
tar -xjf archive.tar.bz2
tar -xJf archive.tar.xz

# modern tar detects the extension automatically
tar -xf archive.tar.gz    # -z may not be needed
```

### Viewing an Archive's Contents (Without Extracting)

```bash
tar -tf archive.tar
tar -tvf archive.tar      # detailed (permissions, size, date)
```

### Usage in Bandit
```bash
# Level 12: extract the tar archive
mv compressed_data compressed_data.tar
tar -xf compressed_data.tar     # data5.bin comes out

tar -xf data5.bin               # data6.bin comes out

# tar detection by magic number:
# a file name string inside → a tar archive
xxd data | head -n 2    # the "ustar" string at offset 257
```

---

## zip & unzip

**Zip** — Creates/extracts archives in the Windows-compatible `.zip` format.

### Basic Usage
```bash
zip archive.zip file1 file2     # create an archive
zip -r archive.zip folder/      # archive a directory
unzip archive.zip               # extract
unzip archive.zip -d /target/   # extract to a specific directory
unzip -l archive.zip            # list the contents
```

### Important Flags

| zip | Description |
|---|---|
| `-r` | Archive a directory recursively |
| `-e` | Archive with a password |
| `-9` | Maximum compression |
| `-j` | Keep the directory structure |

| unzip | Description |
|---|---|
| `-d dir` | Extract to the specified directory |
| `-l` | List without extracting |
| `-o` | Overwrite existing files |
| `-P password` | Extract with a password |

---

## 📊 Format Comparison and Magic Number Table

| Format | Extension | Magic Bytes (hex) | Decompress Command |
|---|---|---|---|
| gzip | `.gz` | `1f 8b` | `gzip -d` |
| bzip2 | `.bz2` | `42 5a 68` | `bzip2 -d` |
| xz | `.xz` | `fd 37 7a 58 5a` | `xz -d` |
| zip | `.zip` | `50 4b 03 04` | `unzip` |
| tar | `.tar` | (`ustar` at offset 257) | `tar -xf` |
| tar.gz | `.tar.gz` | `1f 8b` | `tar -xzf` |
| tar.bz2 | `.tar.bz2` | `42 5a 68` | `tar -xjf` |

---

## 🔄 Level 12 Workflow

In Level 12, here are the steps to go from a hexdump to the password:

```bash
# 1. convert the hexdump back to binary
xxd -r hexdump_data binary_data

# 2. detect the file type
xxd binary_data | head -n 1   # look at the magic number
# 1f8b → gzip

# 3. give it the right extension and decompress
mv binary_data binary_data.gz
gzip -d binary_data.gz

# 4. check the type of the new file
xxd binary_data | head -n 1
# BZh → bzip2

mv binary_data binary_data.bz2
bzip2 -d binary_data.bz2

# repeat this process until you reach the password file
# at each step: xxd → mv (correct extension) → decompress
```

---

## 📚 Quick Reference Table

| Command | Basic Usage | What It Does |
|---|---|---|
| `base64` | `base64 -d file` | Decode base64 |
| `base64` | `base64 file` | Encode to base64 |
| `xxd` | `xxd file \| head` | Show a hexdump |
| `xxd -r` | `xxd -r hex.txt binary` | Convert hex → binary |
| `gzip -d` | `gzip -d file.gz` | Decompress gzip |
| `bzip2 -d` | `bzip2 -d file.bz2` | Decompress bzip2 |
| `tar -xf` | `tar -xf archive.tar` | Extract a tar archive |
| `tar -czf` | `tar -czf archive.tar.gz folder/` | Create tar + gzip |
| `unzip` | `unzip archive.zip` | Extract a zip |

---

## 🔗 More Information

- [File Signatures (Magic Numbers)](https://en.wikipedia.org/wiki/List_of_file_signatures)
- [Base64 — Wikipedia](https://en.wikipedia.org/wiki/Base64)
- `man gzip` · `man bzip2` · `man tar`

---

**Previous section:** [text_processing.md](./text_processing.md)  
**Next section:** [networking.md](./networking.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
