# 📁 Linux Commands — File System

> In Linux, everything is a file. Directories, devices, even network sockets.  
> That's why knowing the file system commands well is the foundation of getting around in Linux.

---

## 📋 Table of Contents

- [pwd](#pwd)
- [ls](#ls)
- [cd](#cd)
- [cat](#cat)
- [file](#file)
- [find](#find)
- [mkdir](#mkdir)
- [cp](#cp)
- [mv](#mv)
- [touch](#touch)
- [mktemp](#mktemp)
- [du](#du)

---

## pwd

**Print Working Directory** — Shows the directory you're currently in.

```bash
$ pwd
/home/robin
```

In the terminal prompt, the `~` symbol represents the home directory. To see the full path, you use `pwd`.

---

## ls

**List** — Lists the contents of a directory.

### Basic Usage
```bash
ls              # list the current directory
ls /tmp         # list a specific directory
ls file.txt     # list a single file
```

### Important Flags

| Flag | Description | Example |
|---|---|---|
| `-l` | Detailed listing (permissions, owner, size, date) | `ls -l` |
| `-a` | Also show hidden files (those starting with `.`) | `ls -a` |
| `-la` or `-al` | Detailed + hidden | `ls -la` |
| `-h` | Show sizes in human-readable form (KB, MB) | `ls -lh` |
| `-r` | List in reverse order | `ls -r` |
| `-t` | Sort by date (newest to oldest) | `ls -lt` |
| `-R` | List subdirectories too (recursive) | `ls -R` |

### Reading the Detailed Listing Output

```bash
$ ls -la
drwxr-x---  2 bandit1 bandit1 4096 May  7 2020 .
drwxr-xr-x 41 root    root    4096 May  7 2020 ..
-rw-r-----  1 bandit2 bandit1   33 May  7 2020 -
^            ^ ^       ^        ^               ^
|            | |       |        |               file name
|            | |       |        size (bytes)
|            | |       group
|            | owner (user)
|            link count
permissions
```

**Permission column:** `drwxr-xr-x`
```
d → directory (- if a regular file, l if a symbolic link)
rwx → owner permissions (read/write/execute)
r-x → group permissions
r-x → other users' permissions
```

### Usage in Bandit
```bash
# Level 3: to find the hidden file
ls -la inhere/

# Level 19: to see the SUID bit
ls -la
# -rwsr-x--- → the 's' in the 'rws' part = SUID bit
```

---

## cd

**Change Directory** — Changes the current directory.

### Basic Usage
```bash
cd /tmp             # go using an absolute path
cd inhere           # go using a relative path
cd ..               # go up one directory
cd ~                # return to the home directory
cd -                # return to the previous directory
cd /                # go to the root directory
```

### Special Directory Symbols

| Symbol | Meaning |
|---|---|
| `.` | Current directory |
| `..` | Parent directory |
| `~` | Home directory (`/home/user`) |
| `-` | Previous directory |
| `/` | Root directory |

### Relative vs Absolute Path

```bash
# Absolute path (always starts with /)
cd /home/bandit0/inhere

# Relative path (from the current location)
cd inhere           # enter the 'inhere' folder in the current directory
cd ../inhere        # go up one directory and enter 'inhere'
```

### Usage in Bandit
```bash
# Level 3: to enter the inhere folder
cd inhere
ls -la              # see the hidden file
cat .hidden
```

---

## cat

**Concatenate** — Prints file contents to the terminal. It can also display several files joined together.

### Basic Usage
```bash
cat file.txt                # read a file
cat file1.txt file2.txt     # join and display two files
cat > new.txt               # read from the keyboard and write to a file (finish with Ctrl+D)
cat file1.txt >> file2.txt  # append file1 to the end of file2
```

### Important Flags

| Flag | Description |
|---|---|
| `-n` | Show line numbers |
| `-A` | Show invisible characters (`$` = end of line, `^I` = tab) |
| `-s` | Squeeze consecutive blank lines into one |

### Special Cases

**Reading a file named `-`:**
```bash
# WRONG — reads stdin, not the file
cat -

# CORRECT — specify the current directory with ./
cat ./-
```

**Reading a file with spaces in its name:**
```bash
# put it in quotes
cat "spaces in this filename"

# or escape it with a backslash
cat spaces\ in\ this\ filename
```

> 💡 **Tab autocompletion:** If you type the start of the file name and press Tab, the spaces are escaped automatically.

### Usage in Bandit
```bash
# Level 0: read the readme file
cat readme

# Level 1: read the file named -
cat ./-

# Level 2: read the file with spaces
cat "spaces in this filename"

# Level 3: read the hidden file
cat .hidden
```

---

## file

**File Type** — Tells you the type of a file. It decides based on the file's content (magic bytes), not its extension.

### Basic Usage
```bash
file file.txt       # type of a single file
file ./*            # type of every file in the current directory
file /bin/ls        # you can check system binaries too
```

### Example Outputs

```bash
$ file ./*
./-file00: data                          # binary / unreadable data
./-file01: ASCII text                    # plain text
./-file02: ELF 64-bit LSB executable    # executable program
./-file03: gzip compressed data         # compressed file
./-file04: JPEG image data              # image
./-file05: Perl script text             # script
```

### What Are Magic Bytes?

Every file type carries special bytes at its start. The `file` command detects the type by looking at them:

| File Type | Magic Bytes (hex) |
|---|---|
| gzip | `1f 8b` |
| bzip2 | `42 5a 68` |
| ZIP | `50 4b 03 04` |
| JPEG | `ff d8 ff` |
| PNG | `89 50 4e 47` |
| ELF (binary) | `7f 45 4c 46` |

### Usage in Bandit
```bash
# Level 4: find the readable one among 10 files
cd inhere
file ./*
# ./-file07: ASCII text ← this one!
cat ./-file07
```

---

## find

**Find** — Searches for files and directories by criteria.

### Basic Usage
```bash
find .              # list the current directory and everything under it
find /tmp           # search in /tmp
find / -name "*.txt"  # find .txt files across the whole system
```

### Important Flags

| Flag | Description | Example |
|---|---|---|
| `-name "pattern"` | Search by file name | `find . -name "*.txt"` |
| `-iname "pattern"` | Case-insensitive | `find . -iname "readme"` |
| `-type f` | Files only | `find . -type f` |
| `-type d` | Directories only | `find . -type d` |
| `-size N` | Search by size | `find . -size 1033c` |
| `-user user` | Search by owner | `find . -user bandit7` |
| `-group group` | Search by group | `find . -group bandit6` |
| `-perm 644` | Search by permissions | `find . -perm 644` |
| `-executable` | Executable files | `find . -executable` |
| `! -executable` | Non-executable files | `find . ! -executable` |
| `-readable` | Readable files | `find . -readable` |
| `-mtime N` | Modified N days ago | `find . -mtime -7` |
| `-exec cmd {} \;` | Run a command on each found file | `find . -exec cat {} \;` |

### Size Units

| Unit | Meaning |
|---|---|
| `c` | byte |
| `k` | kilobyte |
| `M` | megabyte |
| `G` | gigabyte |

```bash
find . -size 33c      # exactly 33 bytes
find . -size +1M      # larger than 1 MB
find . -size -10k     # smaller than 10 KB
```

### Multiple Criteria

```bash
# AND (both conditions must hold — default)
find . -type f -size 33c -user bandit7

# OR
find . -name "*.txt" -o -name "*.md"

# NOT
find . ! -executable
```

### Using -exec

```bash
# read the contents of each found file
find . -type f -exec cat {} \;

# show the type of each found file
find . -type f -exec file {} \;

# pipe + xargs can be used instead of -exec
find . -type f | xargs cat
```

### Usage in Bandit
```bash
# Level 5: size + non-executable + readable
find . -type f -size 1033c ! -executable -exec file '{}' \; | grep ASCII

# Level 6: user + group + size across the whole system
find / -type f -user bandit7 -group bandit6 -size 33c 2>/dev/null
```

---

## mkdir

**Make Directory** — Creates a new directory.

### Basic Usage
```bash
mkdir newFolder               # create a single directory
mkdir -p a/b/c                # create nested directories at once
mkdir folder1 folder2         # create multiple directories
```

### Important Flags

| Flag | Description |
|---|---|
| `-p` | Create intermediate directories too; don't error on existing ones |
| `-m 755` | Create with the specified permissions |

```bash
# without -p you get an error
mkdir a/b/c        # error: 'a' doesn't exist

# with -p it works fine
mkdir -p a/b/c     # creates a, a/b, and a/b/c
```

### Usage in Bandit
```bash
# Level 12: temporary working folder
mkdir /tmp/mywork
cd /tmp/mywork

# Level 3 (Narnia): for the exploit
mkdir /tmp/ex3
mkdir /tmp/ex3/$(python -c 'print "A"*22')
```

---

## cp

**Copy** — Copies a file or directory.

### Basic Usage
```bash
cp source target             # copy a file
cp source /tmp/              # copy into a directory (same name)
cp file1 file2 /tmp/         # copy multiple files into a directory
cp -r folder /tmp/           # copy a directory with its contents
```

### Important Flags

| Flag | Description |
|---|---|
| `-r` or `-R` | Copy a directory with its contents (recursive) |
| `-p` | Preserve permissions, owner, and timestamps |
| `-i` | Ask before overwriting |
| `-v` | Show what's being done (verbose) |
| `-u` | Copy only if newer |

### Usage in Bandit
```bash
# Level 12: copy the data into the temporary folder
cp ~/data.txt /tmp/mywork/
```

---

## mv

**Move** — Moves or renames a file.

### Basic Usage
```bash
mv old_name new_name         # rename
mv file /tmp/                # move to a different location
mv file /tmp/new_name        # move and rename
mv *.txt /tmp/               # move multiple files
```

### Important Flags

| Flag | Description |
|---|---|
| `-i` | Ask before overwriting |
| `-v` | Show what's being done |
| `-n` | Don't overwrite an existing file |

### Usage in Bandit
```bash
# Level 12: rename the hexdump file with the correct extension
mv compressed_data compressed_data.gz
gzip -d compressed_data.gz

mv data8.bin data8.gz
gzip -d data8.gz
```

---

## touch

**Touch** — Creates an empty file or updates a file's access/modification time.

### Basic Usage
```bash
touch new_file.txt            # create an empty file
touch existing_file.txt       # update the timestamp
touch file1 file2 file3       # create multiple files
```

### Important Flags

| Flag | Description |
|---|---|
| `-t YYYYMMDDHHMM` | Set a specific timestamp |
| `-a` | Update only the access time |
| `-m` | Update only the modification time |

### Usage in Bandit
```bash
# Level 23 (Cron): create the output file that cron will write to
touch /tmp/mywork/password
chmod 777 /tmp/mywork/password
```

---

## mktemp

**Make Temporary** — Creates a unique temporary file or directory under `/tmp`.

### Basic Usage
```bash
mktemp                        # create a temporary file
mktemp -d                     # create a temporary directory
mktemp /tmp/myapp.XXXXXX      # create with a custom name pattern
```

The `X` characters are replaced with random characters.

### Why Use mktemp?

Fixed names like `/tmp/mywork` can collide with other users or create a security hole. `mktemp` generates a unique name every time.

```bash
$ mktemp -d
/tmp/tmp.K7aX92mLpQ    # random name — different every time
```

### Usage in Bandit
```bash
# Level 12: safe temporary workspace
TMPDIR=$(mktemp -d)
cd $TMPDIR
cp ~/data.txt .
```

---

## du

**Disk Usage** — Shows the disk usage of files and directories.

### Basic Usage
```bash
du file.txt                   # size of a file
du folder/                    # total size of a directory
du -a                         # show all files individually
du -sh *                      # size of everything in the current directory
```

### Important Flags

| Flag | Description |
|---|---|
| `-b` | Show in bytes |
| `-k` | Show in kilobytes (default) |
| `-m` | Show in megabytes |
| `-h` | Human-readable format (KB, MB, GB) |
| `-s` | Show the total only |
| `-a` | List all files individually |

### Usage in Bandit
```bash
# Level 5: find the file of a specific size
du -b -a | grep 1033
# 1033    ./maybehere07/.file2

# Level 7: check the file size
du -b data.txt
# 4184396 data.txt
```

---

## 📚 Quick Reference Table

| Command | Basic Usage | What It Does |
|---|---|---|
| `pwd` | `pwd` | Show the current directory |
| `ls` | `ls -la` | List files (including hidden, detailed) |
| `cd` | `cd /tmp` | Change directory |
| `cat` | `cat file` | Show file contents |
| `file` | `file ./*` | Show file types |
| `find` | `find / -name "*.txt"` | Search for files |
| `mkdir` | `mkdir -p a/b/c` | Create a directory |
| `cp` | `cp source target` | Copy a file |
| `mv` | `mv old new` | Move/rename a file |
| `touch` | `touch file` | Create an empty file |
| `mktemp` | `mktemp -d` | Create a temporary directory |
| `du` | `du -b file` | Show file size |

---

## 🔗 More Information

- `man ls` — the detailed manual for any command
- [Linux Man Pages](https://manpages.ubuntu.com/)
- [Explain Shell](https://explainshell.com/) — explains commands visually

---

**Next section:** [text_processing.md](./text_processing.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
