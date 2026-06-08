# 🏴 OverTheWire: Bandit — Level 0 to Level 10 Guide

> **Bandit** is one of the best ways to improve Linux terminal skills through gameplay.  
> In this guide, we'll solve the first 10 levels step by step, **explaining why we do what we do**.  
> Since passwords change occasionally, we share the **method** here, not the passwords.

**Reference:** [mayadevbe.me](https://mayadevbe.me/posts/overthewire/bandit/overview/) · [overthewire.org](https://overthewire.org/wargames/bandit/)

---

## 📋 General Info

| Info | Value |
|---|---|
| **Server** | `bandit.labs.overthewire.org` |
| **Port** | `2220` |
| **Starting user** | `bandit0` |
| **Starting password** | `bandit0` |

> 💡 Write down the password you find at each level. Passwords are not saved automatically!

---

## Level 0 — Connect via SSH

### 🎯 Objective
Connect to the server via SSH.

### 📖 Theory: What is SSH?
**SSH (Secure Shell Protocol)** lets you establish an encrypted connection to a remote server. It encrypts all communication between two computers, making it secure.

Basic command syntax:
```
ssh <user>@<server> -p <port>
```

- `user@server` → specifies who is connecting and where
- `-p 2220` → the default SSH port is 22; we're using a different one
- For more info about any command: `man ssh`

Windows users can also connect with [PuTTY](https://www.putty.org/).

### 🔧 Solution
```bash
ssh bandit0@bandit.labs.overthewire.org -p 2220
# When asked for password: bandit0
```

Once connected, you'll see the `bandit0@bandit:~$` prompt — you made it!

---

## Level 0 → Level 1 — Basic File Commands

### 🔐 Connection
```bash
ssh bandit0@bandit.labs.overthewire.org -p 2220
# Password: bandit0
```

### 🎯 Objective
Read the `readme` file in the home directory and find the password inside.

### 📖 Theory: pwd, ls, cat

When you connect via SSH, you land in your **home directory**. The `~` symbol in the prompt indicates this:
```
bandit0@bandit:~$
```

Basic commands:
- `pwd` → shows which directory you're in *(print working directory)*
- `ls` → lists files in the current directory. `-l` for detailed, `-a` to include hidden files
- `cat <file>` → prints the file contents to the terminal

### 🔧 Solution
```bash
bandit0@bandit:~$ ls
readme

bandit0@bandit:~$ cat readme
# Output: next level's password
```

---

## Level 1 → Level 2 — File with Special Name: `-`

### 🔐 Connection
```bash
ssh bandit1@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
Read the file named `-`.

### 📖 Theory: The Dash (`-`) Character

`-` is the **standard option character** in Linux — used to add flags to commands (like `-p`, `-a`). So using it as a filename causes problems:

```bash
bandit1@bandit:~$ cat -
# Terminal waits, returns nothing — because it tries to read from stdin
```

Solution: specify the file by its **full path**. `./` means "the directory I'm currently in", so `-` is interpreted as a real filename rather than a special character.

### 🔧 Solution
```bash
bandit1@bandit:~$ ls
-

bandit1@bandit:~$ cat ./-
# Output: next level's password
```

---

## Level 2 → Level 3 — File with Spaces in Name

### 🔐 Connection
```bash
ssh bandit2@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
Read the file named `spaces in this filename`.

### 📖 Theory: Spaces and Quotes

The Linux terminal uses **spaces as argument separators**. So:
```bash
bandit2@bandit:~$ cat spaces in this filename
cat: spaces: No such file or directory
cat: in: No such file or directory
cat: this: No such file or directory
cat: filename: No such file or directory
```
It looked for 4 separate files and found none.

**Two solutions:**

**Method 1 — Wrap in quotes:**  
Treats the entire string as a single argument.

**Method 2 — Escape with backslash:**  
`\` makes the next character a plain character with no special meaning.

> 💡 **Tip:** Type the beginning of the filename and press **Tab** — autocomplete will escape the spaces automatically!

### 🔧 Solution
```bash
bandit2@bandit:~$ cat "spaces in this filename"
# or
bandit2@bandit:~$ cat spaces\ in\ this\ filename
# Output: next level's password
```

---

## Level 3 → Level 4 — Hidden Files

### 🔐 Connection
```bash
ssh bandit3@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
Find and read the hidden file in the `inhere` folder.

### 📖 Theory: Hidden Files and cd

In Linux, **files whose names start with `.` are hidden** — `ls` won't show them by default. Configuration files like `.bashrc`, `.gitignore` are hidden for this reason.

```bash
ls      # shows only normal files
ls -a   # shows all files (including hidden)
ls -la  # shows all files in detailed list format
```

The first two hidden entries in `-a` output are special:
- `.` → current directory
- `..` → parent directory

**Navigate directories with `cd`:**
- `cd inhere` → enter the inhere folder
- `cd ..` → go up one directory
- `cd ~` → return to home directory
- `cd /` → go to the root directory

### 🔧 Solution — Navigating the Directory
```bash
bandit3@bandit:~$ cd inhere
bandit3@bandit:~/inhere$ ls -a
.  ..  .hidden

bandit3@bandit:~/inhere$ cat .hidden
# Output: next level's password
```

### 🔧 Alternative — Without Entering the Directory
```bash
bandit3@bandit:~$ ls -a inhere/
bandit3@bandit:~$ cat inhere/.hidden
```

---

## Level 4 → Level 5 — Human-Readable File

### 🔐 Connection
```bash
ssh bandit4@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
Find the only **human-readable** file among 10 files in the `inhere` folder.

### 📖 Theory: file Command and Wildcard

The `file <file>` command tells you the **data type** of a file: `ASCII text`, `data`, `ELF`, `Perl script`, etc.

If you try to `cat` a binary file, your terminal fills with meaningless characters. **Human-readable** means text encoded in ASCII or Unicode.

**Wildcard (`*`):** Provides pattern matching for multiple files. `file ./*` shows the type of all files in the current directory at once.

Since filenames start with `-`, the `./` prefix is needed again (same reason as Level 1).

### 🔧 Solution
```bash
bandit4@bandit:~$ cd inhere
bandit4@bandit:~/inhere$ file ./*
./-file00: data
./-file01: data
./-file02: data
./-file03: data
./-file04: data
./-file05: data
./-file06: data
./-file07: ASCII text   ← this one!
./-file08: data
./-file09: data

bandit4@bandit:~/inhere$ cat ./-file07
# Output: next level's password
```

---

## Level 5 → Level 6 — Multi-Criteria Search with `find`

### 🔐 Connection
```bash
ssh bandit5@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
Find the file under `inhere` with these properties:
- Human-readable (ASCII)
- Size **1033 bytes**
- Non-executable

### 📖 Theory: find and grep

The `find` command searches for files by multiple criteria:
```
find [where] [criteria1] [criteria2] ...
```

Key flags:
- `-type f` → files only (no directories)
- `-size 1033c` → exactly 1033 bytes (`c` = bytes)
- `! -executable` → non-executable files
- `-exec <command> '{}' \;` → runs a command on each found file

`grep` with `|` (pipe): feeds one command's output as input to another.
- `grep "ASCII"` → filters lines containing ASCII
- `grep -v "pattern"` → shows lines that **don't** contain the pattern

### 🔧 Solution — Single Command
```bash
bandit5@bandit:~/inhere$ find . -type f -size 1033c ! -executable -exec file '{}' \; | grep ASCII
./maybehere07/.file2: ASCII text, with very long lines

bandit5@bandit:~/inhere$ cat ./maybehere07/.file2
# Output: next level's password
```

### 🔧 Alternative — By Size
```bash
bandit5@bandit:~/inhere$ du -b -a | grep 1033
1033    ./maybehere07/.file2
```
`du -b -a` shows each file's size in bytes; we filter with `grep 1033`.

---

## Level 6 → Level 7 — Searching the Entire Server

### 🔐 Connection
```bash
ssh bandit6@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
The password is stored **somewhere on the server**. Properties:
- Owner (user): `bandit7`
- Group: `bandit6`
- Size: **33 bytes**

### 📖 Theory: File Ownership and 2>/dev/null

In Linux, every file has an **owner** and a **group**. You can see it with `ls -l`:
```
-rw-r----- 1 bandit7 bandit6 33 May 7 2020 bandit7.password
             ^user    ^group
```

Ownership-based search with `find`:
- `-user bandit7` → files owned by bandit7
- `-group bandit6` → files in group bandit6

**What is `2>/dev/null`?**  
Scanning from `/` root will generate hundreds of `Permission denied` errors for folders you can't access. `2>` redirects **standard error output**; `/dev/null` is Linux's "trash bin" — anything sent there disappears.

### 🔧 Solution
```bash
bandit6@bandit:~$ find / -type f -user bandit7 -group bandit6 -size 33c 2>/dev/null
/var/lib/dpkg/info/bandit7.password

bandit6@bandit:~$ cat /var/lib/dpkg/info/bandit7.password
# Output: next level's password
```

---

## Level 7 → Level 8 — Searching Inside Text with `grep`

### 🔐 Connection
```bash
ssh bandit7@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
Find the password next to the word `millionth` in `data.txt`.

### 📖 Theory: grep and pipe

`data.txt` is about 4 MB — thousands of lines, impossible to search manually:
```bash
bandit7@bandit:~$ du -b data.txt
4184396 data.txt
```

`grep <pattern> <file>` finds lines matching the pattern in a file. Critical in real-world log analysis and debugging.

**Pipe (`|`):** Feeds one command's output directly as input to the next:
```bash
cat data.txt | grep millionth
# cat's output → becomes grep's input
```

### 🔧 Solution
```bash
bandit7@bandit:~$ cat data.txt | grep millionth
millionth       <password goes here>

# Or shorter:
bandit7@bandit:~$ grep millionth data.txt
```

---

## Level 8 → Level 9 — Find the Unique Line

### 🔐 Connection
```bash
ssh bandit8@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
Find the line in `data.txt` that appears **only once**.

### 📖 Theory: sort and uniq

**`sort`:** Sorts lines alphabetically. `-r` reverses, `-n` sorts numerically.

**`uniq`:** Filters consecutive duplicate lines. But note: `uniq` only catches lines that are **adjacent and identical**. That's why `sort` is needed first.

```
uniq flags:
  -u  → only unique (appearing exactly once) lines
  -d  → only duplicate (repeated) lines
  -c  → counts how many times each line appears
```

**Pipe chain:** `sort data.txt | uniq -u`  
→ sort output → uniq input → unique line appears

### 🔧 Solution
```bash
bandit8@bandit:~$ sort data.txt | uniq -u
# Output: next level's password (single line)
```

---

## Level 9 → Level 10 — String Search in Binary File

### 🔐 Connection
```bash
ssh bandit9@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
`data.txt` is a binary file. Find a readable string inside it that starts with several `=` signs.

### 📖 Theory: strings Command

If you open the binary file with `cat`, the screen fills with meaningless characters — the file is in binary format. The `strings` command extracts **printable character sequences** (minimum 4 characters) from binary files. Especially useful for binary/executable analysis.

Then we can filter lines containing `=` with `grep "==="`.

**Pipe chain:** `strings data.txt | grep "==="`  
→ strings output → grep filters → password appears

### 🔧 Solution
```bash
bandit9@bandit:~$ strings data.txt | grep ===
========== the
========== password
========== is
========== <password goes here>
```

> The number of `=` signs doesn't matter much; 1 through 10 give the same result.

---

## 📚 Commands Summary

| Command | What it does |
|---|---|
| `ssh user@host -p port` | Securely connect to a remote server |
| `pwd` | Show current directory |
| `ls` / `ls -la` | List files (including hidden) |
| `cat file` | Show file contents |
| `cat ./-` | Read files with special characters (`-`) |
| `cat "file with spaces"` | Read files with spaces in name |
| `cd folder` | Enter a folder |
| `file ./*` | Show type of all files |
| `find / -user X -group Y -size 33c` | Search files by criteria |
| `grep "pattern" file` | Search text inside a file |
| `sort file` | Sort lines |
| `uniq -u` | Show unique lines |
| `strings file` | Extract readable text from binary |
| `du -b file` | Show file size in bytes |
| `2>/dev/null` | Suppress error messages |
| `\|` (pipe) | Chain commands together |

---

## 🔗 Useful Resources

- [OverTheWire Bandit](https://overthewire.org/wargames/bandit/)
- [MayADevBe Full Walkthrough](https://mayadevbe.me/posts/overthewire/bandit/overview/)
- [Linux Man Pages](https://manpages.ubuntu.com/)
- [Explain Shell](https://explainshell.com/) — Visually explains commands
- [Linux Commands Introduction](https://manpages.ubuntu.com/manpages/noble/man1/intro.1.html)

---

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
