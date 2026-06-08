# 🐙 OverTheWire: Leviathan — Level 0 to Level 7 Guide

> Leviathan is the first real **reverse engineering** experience after Bandit.  
> No programming knowledge required — but you'll learn to analyze binaries, use SUID,  
> and find exploitable weaknesses in the system.

**Platform:** `leviathan.labs.overthewire.org` | **Port:** `2223`  
**Starting:** user `leviathan0`, password `leviathan0`  
**Reference:** [mayadevbe.me](https://mayadevbe.me/posts/overthewire/leviathan/overview/) · [overthewire.org](https://overthewire.org/wargames/leviathan/)

---

## 🗺️ Overview

At each Leviathan level, you'll find a **SUID binary** in the home directory. You need to analyze these binaries and manipulate the system to obtain the password. Core tools:

| Tool | What it does |
|---|---|
| `strings` | Extracts readable text from a binary |
| `ltrace` | Shows library calls made while a binary runs |
| `gdb` | Used to debug a binary step by step |
| `ln -s` | Creates a symbolic link |

Passwords are always located at `/etc/leviathan_pass/leviathan<N>`.

---

## Level 0 — Login

### 🔐 Connection
```bash
ssh leviathan0@leviathan.labs.overthewire.org -p 2223
# Password: leviathan0
```

You're in. Now move on to Level 0 → Level 1.

---

## Level 0 → Level 1 — Hidden Password in a Backup File

### 🎯 Objective
Explore the home directory and find hidden folders.

### 📖 Theory: Backups and Privilege Escalation

**Backup** is a fundamental part of data security. But if poorly protected, it becomes an open door for attackers. **Privilege escalation** is the technique of gaining higher access rights — that's what this entire game is about.

### 🔧 Solution

```bash
leviathan0@leviathan:~$ ls -la
drwxr-x---  2 leviathan1 leviathan0  4096 .backup
...

leviathan0@leviathan:~$ cd .backup/
leviathan0@leviathan:~/.backup$ ls -la
-rw-r----- 1 leviathan1 leviathan0 133259 bookmarks.html

# File is large, first check its structure
leviathan0@leviathan:~/.backup$ head bookmarks.html
# A Firefox bookmarks file appears

# Search for the word "leviathan"
leviathan0@leviathan:~/.backup$ grep "leviathan" bookmarks.html
<DT><A HREF="http://leviathan.labs.overthewire.org/passwordus.html | 
This will be fixed later, the password for leviathan1 is <PASSWORD>" ...
```

> 💡 **Lesson:** Backup files may contain sensitive information. Such exposures are common in the real world too — attackers look at backups first.

---

## Level 1 → Level 2 — Binary Analysis with ltrace

### 🔐 Connection
```bash
ssh leviathan1@leviathan.labs.overthewire.org -p 2223
```

### 🎯 Objective
There's a SUID binary in the home directory. Find the correct password and take over the leviathan2 shell.

### 📖 Theory: ltrace and strcmp

**`ltrace`:** Shows the **library function calls** a binary makes while running. Password checks are often done with the `strcmp` (string compare) library function — and ltrace exposes it.

```
strcmp("your_input", "real_password") → ltrace shows this!
```

**`strings`:** Extracts readable text strings from a binary. Sometimes the password is stored directly in the binary.

### 🔧 Solution

```bash
leviathan1@leviathan:~$ ls -la
-r-sr-x---  1 leviathan2 leviathan1 7452 check   # SUID binary!

leviathan1@leviathan:~$ ./check
password: test
Wrong password, Good Bye ...

# Try with strings
leviathan1@leviathan:~$ strings check
# Suspicious things but not clear

# Run with ltrace
leviathan1@leviathan:~$ ltrace ./check
printf("password: ")
getchar(...)          # first char: t
getchar(...)          # second char: e
getchar(...)          # third char: s
strcmp("tes", "sex")  # ← REAL PASSWORD HERE!
puts("Wrong password, Good Bye ...")
```

The binary only compares the first 3 characters. Password: `sex`

```bash
leviathan1@leviathan:~$ ./check
password: sex
$                      # shell opened!

$ whoami
leviathan2             # we became leviathan2 thanks to SUID

$ cat /etc/leviathan_pass/leviathan2
<password goes here>
```

---

## Level 2 → Level 3 — Symbolic Link + Space Manipulation

### 🔐 Connection
```bash
ssh leviathan2@leviathan.labs.overthewire.org -p 2223
```

### 🎯 Objective
There's a SUID binary called `printfile`. Make it read a file you don't have permission to access.

### 📖 Theory: Symbolic Links and Name Manipulation

**Symbolic Link:** A shortcut that points to a file from another location. Created with the `ln -s target link` command.

This level has two critical behaviors:
- `access()` function → checks with the full filename (including spaces)
- `/bin/cat` → uses space as a separator, only reads the first part

We can exploit this difference:

```
"test file.txt" → access("/tmp/dir/test file.txt") = OK ✓
                → cat /tmp/dir/test file.txt       = cat /tmp/dir/test + cat file.txt
```

If the `test` file is a symbolic link to the password file, `cat` will read it!

### 🔧 Solution

```bash
leviathan2@leviathan:~$ ls -la
-r-sr-x---  1 leviathan3 leviathan2 7436 printfile   # SUID

leviathan2@leviathan:~$ ./printfile /etc/leviathan_pass/leviathan3
You cant have that file...   # no direct access

# Understand how it works with ltrace
leviathan2@leviathan:~$ ltrace ./printfile .bashrc
access(".bashrc", 4)                  # access check first
snprintf("/bin/cat .bashrc", ...)     # then read with cat

# PLAN:
# 1. Create a temp directory
leviathan2@leviathan:~$ mktemp -d
/tmp/tmp.BykcxJXZxD

# 2. Create an empty file with a space in the name
leviathan2@leviathan:~$ touch "/tmp/tmp.BykcxJXZxD/test file.txt"

# 3. Create a symbolic link named "test" pointing to the password file
leviathan2@leviathan:~$ ln -s /etc/leviathan_pass/leviathan3 /tmp/tmp.BykcxJXZxD/test

# 4. Allow everyone to access the directory
leviathan2@leviathan:~$ chmod 777 /tmp/tmp.BykcxJXZxD

# 5. Run the binary with "test file.txt"
leviathan2@leviathan:~$ ./printfile "/tmp/tmp.BykcxJXZxD/test file.txt"
<password goes here>        # access() saw the full name ✓
                             # cat only read "test" → symlink → password!
/bin/cat: file.txt: No such file or directory   # this error is normal
```

> 💡 **Lesson:** Vulnerabilities based on the time gap between `access()` and `open()` are called **TOCTOU (Time-of-check to time-of-use)**. Frequently encountered in real security vulnerabilities.

---

## Level 3 → Level 4 — Password Detection with ltrace (Again)

### 🔐 Connection
```bash
ssh leviathan3@leviathan.labs.overthewire.org -p 2223
```

### 🎯 Objective
A binary called `level3` asks for the correct password. Find it with `ltrace`.

### 🔧 Solution

```bash
leviathan3@leviathan:~$ ls -la
-r-sr-x---  1 leviathan4 leviathan3 10288 level3   # SUID

leviathan3@leviathan:~$ ./level3
Enter the password> test
bzzzzzzzzap. WRONG

# Catch the password with ltrace
leviathan3@leviathan:~$ ltrace ./level3
strcmp("h0no33", "kakaka")        # first fake comparison (misleading!)
printf("Enter the password> ")
fgets("test\n", 256, ...)
strcmp("test\n", "snlprintf\n")   # ← REAL COMPARISON
puts("bzzzzzzzzap. WRONG")
```

Password: `snlprintf`

```bash
leviathan3@leviathan:~$ ./level3
Enter the password> snlprintf
[You've got shell]!

$ whoami
leviathan4

$ cat /etc/leviathan_pass/leviathan4
<password goes here>
```

> 💡 A binary may have multiple `strcmp` calls — read carefully to find which one is the real check. Here the first is fake (a decoy), the second is real.

---

## Level 4 → Level 5 — Converting Binary to ASCII

### 🔐 Connection
```bash
ssh leviathan4@leviathan.labs.overthewire.org -p 2223
```

### 🎯 Objective
Running the binary in the `.trash/` folder outputs a bunch of 0s and 1s. Decode them.

### 📖 Theory: Binary and ASCII

**Binary (base-2) number system:** The fundamental language of computers — only 0 and 1. Every character is represented by 8 bits (1 byte).

**ASCII:** The standard encoding system that maps letters to numbers. For example:
- `01000001` → 65 → `A`
- `01101000` → 104 → `h`

Perl's `pack` function can be used to convert binary to ASCII:
```bash
echo "01000001" | perl -lpe '$_=pack"B*",$_'
# Output: A
```

### 🔧 Solution

```bash
leviathan4@leviathan:~$ ls -la
dr-xr-x---  2 root leviathan4 4096 .trash

leviathan4@leviathan:~$ cd .trash/
leviathan4@leviathan:~/.trash$ ls -la
-r-sr-x--- 1 leviathan5 leviathan4 7352 bin   # SUID

leviathan4@leviathan:~/.trash$ ./bin
01010100 01101001 01110100 01101000 00110100 01100011 01101111 01101011 01100101 01101001 00001010
```

Remove the spaces to make a single string, then convert with Perl:

```bash
leviathan4@leviathan:~/.trash$ echo "0101010001101001011101000110100000110100011000110110111101101011011001010110100100001010" | perl -lpe '$_=pack"B*",$_'
<password goes here>
```

> 💡 Instead of converting binary by hand, use command-line tools. It can also be done with Python: `python3 -c "print(bytes.fromhex(hex(int('01010100',2))[2:]).decode())"`.

---

## Level 5 → Level 6 — Tricking a Binary with Symlink

### 🔐 Connection
```bash
ssh leviathan5@leviathan.labs.overthewire.org -p 2223
```

### 🎯 Objective
The `leviathan5` binary tries to read `/tmp/file.log`. Replace that file with a symbolic link pointing to the password file.

### 📖 Theory: Tricking Binaries with Symbolic Links

Binaries often read from a hardcoded file path. If you can control that file and the binary is SUID → you can make the binary read any file you want.

The logic:
```
binary → reads /tmp/file.log
we     → link /tmp/file.log to leviathan6's password
binary → actually reads leviathan6's password
```

### 🔧 Solution

```bash
leviathan5@leviathan:~$ ls -la
-r-sr-x---  1 leviathan6 leviathan5 7560 leviathan5   # SUID

leviathan5@leviathan:~$ ./leviathan5
Cannot find /tmp/file.log

# Verify with ltrace
leviathan5@leviathan:~$ ltrace ./leviathan5
fopen("/tmp/file.log", "r") = 0    # file doesn't exist, returned 0
puts("Cannot find /tmp/file.log")

# Create symlink: /tmp/file.log → leviathan6's password
leviathan5@leviathan:~$ ln -s /etc/leviathan_pass/leviathan6 /tmp/file.log

# Binary now reads the password
leviathan5@leviathan:~$ ./leviathan5
<password goes here>
```

---

## Level 6 → Level 7 — Reverse Engineering with GDB

### 🔐 Connection
```bash
ssh leviathan6@leviathan.labs.overthewire.org -p 2223
```

### 🎯 Objective
The `leviathan6` binary asks for a 4-digit PIN. `ltrace` doesn't help — find the PIN by reading the assembly code with GDB.

### 📖 Theory: GDB and Assembly

**GDB (GNU Debugger):** A debugging tool for running binaries step by step and inspecting their internal state.

**Assembly:** The programming language closest to machine code. Each line typically performs a single operation.

Key GDB commands:
```
gdb --args program argument   → start GDB
disassemble main              → show assembly code of main function
break *0xADDRESS              → stop at that address
run                           → run the program
info registers                → show register values
print $ebp-0xc                → calculate address
x 0xADDRESS                  → show value at that address
print/d 0xHEX                 → convert hex to decimal
```

**Basic assembly concepts:**
- `cmp a, b` → compare a and b
- `jne address` → jump to address if not equal
- `atoi` → converts a string to an integer (our input)
- `movl $0x1bd3, -0xc(%ebp)` → writes a constant to memory (PIN is here!)

### 🔧 Solution

```bash
leviathan6@leviathan:~$ ls -la
-r-sr-x---  1 leviathan7 leviathan6 7452 leviathan6   # SUID

leviathan6@leviathan:~$ ./leviathan6 0000
Wrong

# ltrace doesn't work — need a different approach
# Let's look at the assembly with GDB
leviathan6@leviathan:~$ gdb --args leviathan6 0000

(gdb) disassemble main
# ...
0x080491ea <+20>: movl $0x1bd3,-0xc(%ebp)   # ← constant value being loaded!
# ...
0x08049222 <+76>: call atoi                  # convert our input to integer
0x0804922a <+84>: cmp %eax,-0xc(%ebp)        # compare
0x0804922d <+87>: jne ...                    # jump if not equal (failure)
```

Set a breakpoint and read register values:

```bash
(gdb) break *0x0804922a
(gdb) run

Breakpoint 1, 0x0804922a in main ()

(gdb) print $ebp-0xc
$1 = 0xffffd4cc

(gdb) x 0xffffd4cc
0xffffd4cc: 0x00001bd3

(gdb) print/d 0x00001bd3
$3 = 7123          # ← this is the PIN!
```

```bash
leviathan6@leviathan:~$ ./leviathan6 7123
$                  # shell opened!

$ whoami
leviathan7

$ cat /etc/leviathan_pass/leviathan7
<password goes here>
```

### 🔧 Alternative — Brute Force
If you don't want to learn GDB, it can also be solved with brute force:
```bash
for i in {0000..9999}; do
    result=$(./leviathan6 $i 2>/dev/null)
    if [ "$result" != "Wrong" ]; then
        echo "PIN: $i → $result"
        break
    fi
done
```

---

## 🏁 Level 7 — Congratulations!

```bash
ssh leviathan7@leviathan.labs.overthewire.org -p 2223

leviathan7@leviathan:~$ cat CONGRATULATIONS
Well done, you seem to have used a light to see in the dark...
```

---

## 📚 Commands and Concepts Summary

| Command / Concept | What it does |
|---|---|
| `grep "word" file` | Searches for a word in a file |
| `strings binary` | Extracts text from a binary |
| `ltrace ./binary` | Shows library calls (exposes strcmp password!) |
| `ln -s target link` | Creates a symbolic link |
| `chmod 777 folder` | Gives full permissions to everyone |
| `gdb --args prog arg` | Starts debugging with GDB |
| `disassemble main` | Shows assembly code |
| `break *0xADDRESS` | Sets a breakpoint |
| `info registers` | Shows register values |
| `print/d 0xHEX` | Converts hex to decimal |
| `perl -lpe '$_=pack"B*",$_'` | Converts binary to ASCII |
| **SUID binary** | Program that runs with its owner's privileges |
| **Privilege Escalation** | Gaining higher access rights |
| **TOCTOU** | Vulnerability between check and use |
| **Symbolic Link** | A shortcut that points to a file |

---

## 🔗 Useful Resources

- [OverTheWire Leviathan](https://overthewire.org/wargames/leviathan/)
- [MayADevBe Leviathan Walkthrough](https://mayadevbe.me/posts/overthewire/leviathan/overview/)
- [GDB Cheat Sheet](https://darkdust.net/files/GDB%20Cheat%20Sheet.pdf)
- [ASCII Table](https://www.asciitable.com/)
- [Intel vs AT&T Assembly Syntax](https://imada.sdu.dk/u/kslarsen/dm546/Material/IntelnATT.htm)

---

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
