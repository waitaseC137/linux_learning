# 🏴 OverTheWire: Bandit — Level 11 to Level 20 Guide

> This section covers encoding, compression, network communication, file permissions, and advanced SSH features.  
> Topics get progressively deeper — read carefully, each level builds on the previous one.

**Previous section:** [bandit_0-10.md](./bandit_0-10.md) | **Reference:** [mayadevbe.me](https://mayadevbe.me/posts/overthewire/bandit/overview/)

---

## Level 10 → Level 11 — Base64 Encoding

### 🔐 Connection
```bash
ssh bandit10@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
`data.txt` is encoded with Base64. Decode it.

### 📖 Theory: What is Base64?

**Base64** is an encoding scheme that converts binary data to text format. Visually, it often ends with `==` signs but not always. Commonly used in email attachments, JWT tokens, and similar contexts.

On Linux, the `base64` command both encodes and decodes:
- `base64 file` → encodes
- `base64 -d file` → decodes (`--decode` does the same thing)

### 🔧 Solution
```bash
bandit10@bandit:~$ cat data.txt
VGhlIHBhc3N3b3JkIGlz...

bandit10@bandit:~$ base64 -d data.txt
The password is <password goes here>
```

---

## Level 11 → Level 12 — ROT13 Cipher

### 🔐 Connection
```bash
ssh bandit11@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
All letters in `data.txt` have been shifted 13 positions (ROT13). Reverse it.

### 📖 Theory: ROT13 and the tr Command

**Substitution cipher:** Replaces each letter with another. Caesar cipher is one of the oldest. **ROT13** uses the same algorithm for both encryption and decryption since the Latin alphabet has 26 letters (13+13=26).

```
A → N, B → O, C → P, ..., Z → M
```

The `tr` (*translate*) command in Linux performs character substitution:
```
tr 'old_characters' 'new_characters'
```

### 🔧 Solution
```bash
bandit11@bandit:~$ cat data.txt
Gur cnffjbeq vf ...

bandit11@bandit:~$ cat data.txt | tr 'A-Za-z' 'N-ZA-Mn-za-m'
The password is <password goes here>
```

### 💡 Bonus — Defining an Alias
You can create an alias to shorten the frequently used `tr` command:
```bash
alias rot13="tr 'A-Za-z' 'N-ZA-Mn-za-m'"
alias rot5="tr '0-9' '5-90-4'"
```
Now just writing `cat data.txt | rot13` is enough.

---

## Level 12 → Level 13 — Hexdump and Repeated Compression

### 🔐 Connection
```bash
ssh bandit12@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
`data.txt` is a hexdump. Reverse the file, then unwrap the repeatedly compressed layers.

### 📖 Theory: Hexdump, Compression, and Magic Numbers

**Hexdump:** Displays binary data in hex format. Has three columns: address | hex values | string representation. The `xxd` command creates/reverses hexdumps:
- `xxd file` → creates a hexdump
- `xxd -r hexdump outputfile` → reverses it

**Magic Number / File signature:** Every file type carries special bytes at the start. The `file` command uses this. Common ones:
- `1f 8b` → gzip
- `42 5a 68` (BZh) → bzip2
- `75 73 74 61 72` (ustar) → tar archive  *(note: this signature is NOT at the start of the file but at offset 257 — tar is the exception to the "magic bytes at the beginning" rule)*

**Compression commands:**
- `gzip -d file.gz` → decompress gzip
- `bzip2 -d file.bz2` → decompress bzip2
- `tar -xf file.tar` → extract tar archive

**Other helpers:**
- `mkdir <path>` → creates a directory
- `cp <source> <dest>` → copies
- `mv <source> <dest>` → moves / renames
- `mktemp -d` → creates a temporary directory with a random name in /tmp

### 🔧 Solution

**Step 1 — Create a temporary working directory:**
```bash
bandit12@bandit:~$ cd /tmp
bandit12@bandit:/tmp$ mktemp -d
/tmp/tmp.W5t1vua6G9
bandit12@bandit:/tmp$ cd /tmp/tmp.W5t1vua6G9
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ cp ~/data.txt .
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ mv data.txt hexdump_data
```

**Step 2 — Reverse the hexdump:**
```bash
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ xxd -r hexdump_data compressed_data
```

**Step 3 — Identify compression type by magic number and decompress:**
```bash
# First line shows 1f8b → gzip
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ mv compressed_data compressed_data.gz
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ gzip -d compressed_data.gz

# Then you see 42 5a 68 (BZh) → bzip2
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ mv compressed_data compressed_data.bz2
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ bzip2 -d compressed_data.bz2

# Then 1f8b again → gzip
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ mv compressed_data compressed_data.gz
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ gzip -d compressed_data.gz

# You see "data5.bin" filename inside → tar archive
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ mv compressed_data compressed_data.tar
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ tar -xf compressed_data.tar  # → data5.bin extracted
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ tar -xf data5.bin             # → data6.bin extracted

# data6.bin → bzip2
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ bzip2 -d data6.bin            # → data6.bin.out extracted
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ tar -xf data6.bin.out         # → data8.bin extracted

# data8.bin → gzip
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ mv data8.bin data8.gz
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ gzip -d data8.gz

bandit12@bandit:/tmp/tmp.W5t1vua6G9$ cat data8
The password is <password goes here>
```

> 💡 **Tip:** At each step, write `xxd file | head` to check the first few bytes. The magic number tells you which command to use.

---

## Level 13 → Level 14 — SSH Key Login and File Transfer

### 🔐 Connection
```bash
ssh bandit13@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
No password — instead there's a private SSH key. Use it to log in as bandit14. The password is in `/etc/bandit_pass/bandit14`, readable only by bandit14.

### 📖 Theory: SSH Key Authentication

Instead of logging in with a password, SSH also supports **public-key cryptography**. The public key goes on the remote server, and you use the private key. The `-i` flag specifies the private key file.

**`scp`** — Copies files over SSH:
```
scp -P <port> <user>@<host>:<remote_path> <local_path>
```

**`chmod`** — Changes file permissions. If an SSH key file has too open permissions, SSH will refuse the connection:
```bash
chmod 600 sshkey.private   # only owner can read/write
```

### 🔧 Solution

```bash
# First connect as bandit13, see the key
bandit13@bandit:~$ ls
sshkey.private
bandit13@bandit:~$ exit

# On your own machine: download the key
$ scp -P 2220 bandit13@bandit.labs.overthewire.org:sshkey.private .

# Fix permissions (otherwise you get "Permissions too open" error)
$ chmod 600 sshkey.private

# Log in as bandit14 using the key
$ ssh -i sshkey.private bandit14@bandit.labs.overthewire.org -p 2220

# Read the password
bandit14@bandit:~$ cat /etc/bandit_pass/bandit14
```

### 🔧 Alternative — Jump From the Server
Without downloading to your own machine, you can also hop directly from the server:
```bash
bandit13@bandit:~$ ssh -i sshkey.private bandit14@localhost -p 2220
```

---

## Level 14 → Level 15 — Port Communication with Netcat

### 🔐 Connection
```bash
ssh -i sshkey.private bandit14@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
Send this level's password to port `localhost:30000` and receive the next level's password in return.

### 📖 Theory: Localhost and Netcat

**Localhost:** The hostname referring to the machine itself. IP address is `127.0.0.1`. Used for testing network services.

**`nc` (netcat):** A versatile tool for reading and writing data over a network. Supports TCP and UDP:
- `nc <host> <port>` → connect as a client to a service
- `nc -l <port>` → start a listening server

### 🔧 Solution
```bash
# First find this level's password
bandit14@bandit:~$ cat /etc/bandit_pass/bandit14
<current password>

# Send the password to port 30000
bandit14@bandit:~$ nc localhost 30000
<current password>
Correct!
<next level's password>
```

---

## Level 15 → Level 16 — Encrypted Communication with OpenSSL

### 🔐 Connection
```bash
ssh bandit15@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
Send this level's password to `localhost:30001` using **SSL encryption**.

### 📖 Theory: SSL/TLS and OpenSSL

**SSL/TLS:** Protocols that encrypt network traffic. It's the technology behind HTTPS. You can't connect to an SSL-speaking server with plain `nc` — it can't understand the SSL handshake.

**`openssl s_client`:** A simple client for connecting to SSL/TLS-enabled servers.

### 🔧 Solution
```bash
bandit15@bandit:~$ openssl s_client -connect localhost:30001
# (Connection info appears, then waits)
<current password>
Correct!
<next level's password>
```

> 💡 If you see messages like `HEARTBEATING` or `Read R BLOCK`, press `R` or use `openssl s_client -connect localhost:30001 -ign_eof`.

---

## Level 16 → Level 17 — Port Scanning (Nmap)

### 🔐 Connection
```bash
ssh bandit16@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
Which port between 31000-32000 speaks SSL and hosts the correct service? Send the password to that port.

### 📖 Theory: Port Scanning and Nmap

**Port:** The address of a network service on a computer. Numbered 0-65535. Standard ports: HTTP=80, SSH=22, etc.

**`nmap`:** Network scanner. Detects open ports and running services:
- `-p 31000-32000` → scan a specific port range
- `-sV` → service/version detection

### 🔧 Solution
```bash
bandit16@bandit:~$ nmap -sV localhost -p 31000-32000
PORT      STATE SERVICE  VERSION
31046/tcp open  echo
31518/tcp open  ssl/echo
31691/tcp open  echo
31790/tcp open  ssl/unknown   ← this one!
31960/tcp open  echo
```

Two ports use SSL: 31518 and 31790. Port 31518 just echoes (mirrors what you send). Port 31790 is unknown — that's the correct target.

```bash
bandit16@bandit:~$ openssl s_client -connect localhost:31790
<current password>
Correct!
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
```

Save the private key and fix its permissions:
```bash
bandit16@bandit:~$ nano /tmp/sshkey17.private   # paste the key
bandit16@bandit:~$ chmod 600 /tmp/sshkey17.private
bandit16@bandit:~$ ssh -i /tmp/sshkey17.private bandit17@localhost -p 2220
```

---

## Level 17 → Level 18 — Difference Between Two Files (diff)

### 🔐 Connection
```bash
ssh -i sshkey17.private bandit17@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
Only one line has changed between `passwords.old` and `passwords.new`. Find that line.

### 📖 Theory: diff Command

`diff file1 file2` shows the differences between two files:
- `<` → line belonging to the first file
- `>` → line belonging to the second file
- `42c42` → there's a change at line 42

### 🔧 Solution
```bash
bandit17@bandit:~$ diff passwords.old passwords.new
42c42
< old_password_line
---
> <new password — this is the next level's password>
```

Since we passed the second file (`passwords.new`) as the second argument, the line shown with `>` is the new password.

### 🔧 Alternative — sort + uniq
```bash
bandit17@bandit:~$ sort passwords.old passwords.new | uniq -u
# Two lines appear; verify which one is in passwords.new with grep:
bandit17@bandit:~$ grep "<line>" passwords.new
```

---

## Level 18 → Level 19 — Running Commands Remotely via SSH

### 🔐 Connection
```bash
ssh bandit18@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
The `readme` file is in the home directory. But `.bashrc` has been modified — it kicks you out immediately on login!

### 📖 Theory: .bashrc and SSH Remote Command

**`.bashrc`:** A script that runs every time a terminal opens (including SSH logins). Someone added `exit` here.

**SSH remote command:** SSH doesn't just open a terminal; it can also run a command directly when connecting:
```
ssh user@host -p port <command>
```
In this case, the command runs before `.bashrc` fully loads and the shell closes without opening interactively.

### 🔧 Solution
```bash
# First list the files
$ ssh bandit18@bandit.labs.overthewire.org -p 2220 ls
readme

# Read directly
$ ssh bandit18@bandit.labs.overthewire.org -p 2220 cat readme
<password goes here>
```

### 🔧 Alternative — Spawn a Shell
If you want to run multiple commands, you can spawn a shell:
```bash
# Open a bash shell
ssh bandit18@bandit.labs.overthewire.org -p 2220 /bin/bash

# Or open sh with a pseudo-terminal
ssh bandit18@bandit.labs.overthewire.org -p 2220 -t /bin/sh
```

---

## Level 19 → Level 20 — SUID Binary and Linux Permissions

### 🔐 Connection
```bash
ssh bandit19@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
There's a special binary in the home directory. Use it to read `/etc/bandit_pass/bandit20`.

### 📖 Theory: Linux Permissions and SUID

Let's understand the permission column in `ls -l` output:
```
-rwsr-x---  1 bandit20 bandit19 7296 bandit20-do
 ^^^
 rws → s here is the SUID bit!
```

**SUID (Set User ID):** Normally, a program runs with the privileges of whoever executes it. When the SUID bit is set (`s` instead of `x`), the program runs as **the file's owner, not the person running it**.

So:
- Binary's owner: `bandit20`
- Group: `bandit19` (you're a member of this group)
- SUID bit: active → binary runs with `bandit20` privileges

This lets you access `/etc/bandit_pass/bandit20` which only `bandit20` can read.

### 🔧 Solution
```bash
bandit19@bandit:~$ ls -la
-rwsr-x---  1 bandit20 bandit19 7296 May  7  2020 bandit20-do

# What does the binary do?
bandit19@bandit:~$ ./bandit20-do
Run a command as another user.
  Example: ./bandit20-do id

# Read the password
bandit19@bandit:~$ ./bandit20-do cat /etc/bandit_pass/bandit20
<password goes here>
```

---

## 📚 Commands Summary (Level 11-20)

| Command | What it does |
|---|---|
| `base64 -d file` | Decodes Base64-encoded file |
| `tr 'A-Za-z' 'N-ZA-Mn-za-m'` | Applies ROT13 |
| `xxd file` | Creates a hexdump |
| `xxd -r hexdump output` | Reverses a hexdump |
| `gzip -d file.gz` | Decompresses gzip |
| `bzip2 -d file.bz2` | Decompresses bzip2 |
| `tar -xf file.tar` | Extracts tar archive |
| `mktemp -d` | Creates a temporary directory in /tmp |
| `scp -P port user@host:remote local` | Copies files over SSH |
| `chmod 600 file` | Sets file permissions |
| `ssh -i key user@host -p port` | Logs in with SSH key |
| `nc host port` | Establishes TCP connection to a port |
| `openssl s_client -connect host:port` | Establishes SSL/TLS connection |
| `nmap -sV host -p range` | Scans open ports and services |
| `diff file1 file2` | Shows differences between two files |
| `ssh user@host command` | Runs a command remotely via SSH |
| `./binary-do command` | Runs as a different user via SUID binary |

---

**Next section:** [bandit_21-33.md](./bandit_21-33.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
