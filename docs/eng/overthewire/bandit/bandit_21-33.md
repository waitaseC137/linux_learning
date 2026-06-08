# 🏴 OverTheWire: Bandit — Level 21 to Level 33 Guide

> Final section! Covers cron jobs, bash scripting, brute-force, escaping restricted environments, and Git.  
> In this section you're not just running commands — you're thinking and writing scripts.

**Previous section:** [bandit_11-20.md](./bandit_11-20.md) | **Reference:** [mayadevbe.me](https://mayadevbe.me/posts/overthewire/bandit/overview/)

---

## Level 20 → Level 21 — SUID Binary + Netcat + Background Process

### 🔐 Connection
```bash
ssh bandit20@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
There's a SUID binary in the home directory (`suconnect`). It connects to the port you specify, waits for bandit20's password; if correct, it sends bandit21's password. You need to run both a netcat server and the binary at the same time.

### 📖 Theory: Background Process (`&`)

Normally when you run a command, the terminal waits until it finishes. With `&`, you can send a command to the **background** — the terminal is freed up and you can run other commands.

```bash
command &     # run in background
jobs          # list background processes
fg            # bring background process to foreground
```

`echo -n` → writes without a newline character (`\n`). Critical in netcat protocols — an extra `\n` can sometimes break the connection.

### 🔧 Solution

```bash
# 1. Start a netcat server in the background — pipe the password to it
bandit20@bandit:~$ echo -n 'GbKksEFF4yrVs6il55v6gwY5aVje5f0j' | nc -l -p 1234 &
[1] 24661

# 2. Point the SUID binary at the same port
bandit20@bandit:~$ ./suconnect 1234
Read: GbKksEFF4yrVs6il55v6gwY5aVje5f0j
Password matches, sending next password
<next level's password>
[1]+  Done
```

> 💡 You choose the port number — you can use something other than 1234. Just make sure both commands use the same one.

---

## Level 21 → Level 22 — Reading a Cron Job

### 🔐 Connection
```bash
ssh bandit21@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
A program is running automatically at regular intervals. Look inside `/etc/cron.d/` to find out what's being run.

### 📖 Theory: What is a Cron Job?

**Cron** is Linux's scheduler that automatically runs commands/scripts at specified time intervals. Defined in files in directories like `/etc/cron.d/`.

Cron line format:
```
* * * * * user /command/path
│ │ │ │ │
│ │ │ │ └── Day of week (0-7)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)

* * * * * → run every minute
@reboot   → run at system startup
```

### 🔧 Solution

```bash
bandit21@bandit:~$ ls /etc/cron.d/
cronjob_bandit22  cronjob_bandit23  cronjob_bandit24  ...

bandit21@bandit:~$ cat /etc/cron.d/cronjob_bandit22
* * * * * bandit22 /usr/bin/cronjob_bandit22.sh &> /dev/null

bandit21@bandit:~$ cat /usr/bin/cronjob_bandit22.sh
#!/bin/bash
chmod 644 /tmp/t7O6lds9S0RqQh9aMcz6ShpAoZKF7fgv
cat /etc/bandit_pass/bandit22 > /tmp/t7O6lds9S0RqQh9aMcz6ShpAoZKF7fgv

# The script writes bandit22's password to that file every minute!
bandit21@bandit:~$ cat /tmp/t7O6lds9S0RqQh9aMcz6ShpAoZKF7fgv
<password goes here>
```

---

## Level 22 → Level 23 — Bash Script Analysis and md5sum

### 🔐 Connection
```bash
ssh bandit22@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
There's another cron job. This time the script uses variables and `md5sum` — you need to calculate the filename yourself.

### 📖 Theory: Bash Variables and md5sum

Defining variables in Bash:
```bash
name="value"                 # fixed value
name=$(command)              # store command output
echo $name                   # use the variable
```

**`md5sum`:** Produces an MD5 hash of a string or file — a fixed-length unique fingerprint. The same input always gives the same output.

**`cut -d ' ' -f 1`:** Splits by space (`-d ' '`) and takes field 1 (`-f 1`). `md5sum` output is `hash  file`, we only want the hash.

### 🔧 Solution

```bash
bandit22@bandit:~$ cat /etc/cron.d/cronjob_bandit23
* * * * * bandit23 /usr/bin/cronjob_bandit23.sh

bandit22@bandit:~$ cat /usr/bin/cronjob_bandit23.sh
#!/bin/bash
myname=$(whoami)
mytarget=$(echo I am user $myname | md5sum | cut -d ' ' -f 1)
cat /etc/bandit_pass/$myname > /tmp/$mytarget
```

The script runs as bandit23. `$myname` = `bandit23`. We can compute the filename ourselves:

```bash
bandit22@bandit:~$ echo I am user bandit23 | md5sum | cut -d ' ' -f 1
8ca319486bfbbc3663ea0fbe81326349

bandit22@bandit:~$ cat /tmp/8ca319486bfbbc3663ea0fbe81326349
<password goes here>
```

---

## Level 23 → Level 24 — Write Your Own Script (Execute via Cron)

### 🔐 Connection
```bash
ssh bandit23@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
A cron job runs scripts in `/var/spool/bandit24/` **as bandit24** and then deletes them — but only those owned by `bandit23`. Use this to write a script that steals bandit24's password.

### 📖 Theory: Writing Bash Scripts

The first line of a bash script must be the **shebang** — it tells which interpreter to use:
```bash
#!/bin/bash
```

To make a file executable:
```bash
chmod +x script.sh    # give execute permission
chmod +rx script.sh   # read + execute
chmod 777 folder      # full permissions to everyone (use carefully)
```

### 🔧 Solution

```bash
# Create a temporary working directory
bandit23@bandit:~$ mktemp -d
/tmp/tmp.ljEyl6kv1M
bandit23@bandit:~$ cd /tmp/tmp.ljEyl6kv1M

# Write the script
bandit23@bandit:/tmp/tmp.ljEyl6kv1M$ nano bandit24_pass.sh
```

Script contents:
```bash
#!/bin/bash
cat /etc/bandit_pass/bandit24 > /tmp/tmp.ljEyl6kv1M/password
```

```bash
# Set permissions
bandit23@bandit:/tmp/tmp.ljEyl6kv1M$ chmod +rx bandit24_pass.sh
bandit23@bandit:/tmp/tmp.ljEyl6kv1M$ chmod 777 /tmp/tmp.ljEyl6kv1M
bandit23@bandit:/tmp/tmp.ljEyl6kv1M$ touch password
bandit23@bandit:/tmp/tmp.ljEyl6kv1M$ chmod 777 password

# Copy the script to the cron directory
bandit23@bandit:/tmp/tmp.ljEyl6kv1M$ cp bandit24_pass.sh /var/spool/bandit24/

# Wait ~1 minute, then read
bandit23@bandit:/tmp/tmp.ljEyl6kv1M$ cat password
<password goes here>
```

> ⚠️ If the file is empty: check the permissions on the script and folder. If the cron job can't run the script, it won't write to the file.

---

## Level 24 → Level 25 — Brute Force (Bash Script + Netcat)

### 🔐 Connection
```bash
ssh bandit24@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
The daemon on port 30002 expects bandit24's password + a 4-digit PIN code. You don't know the PIN; try all 10,000 combinations.

### 📖 Theory: For Loop and Brute Force

For loop in Bash:
```bash
for i in {0000..9999}
do
    echo "value: $i"
done
```

`{0000..9999}` → counts from 0000 to 9999, preserving leading zeros.

The `>>` operator **appends** to a file (doesn't overwrite).

**Brute force:** The method of systematically trying all possible combinations. In the real world, strong passwords and rate limiting prevent this.

### 🔧 Solution

```bash
bandit24@bandit:~$ mktemp -d
/tmp/tmp.3YQNHtW1Uu
bandit24@bandit:~$ cd /tmp/tmp.3YQNHtW1Uu
bandit24@bandit:/tmp/tmp.3YQNHtW1Uu$ nano brute.sh
```

Script contents:
```bash
#!/bin/bash
for i in {0000..9999}
do
    echo UoMYTrfrBFHyQXmg6gzctqAwOmw1IohZ $i >> possibilities.txt
done
cat possibilities.txt | nc localhost 30002 > result.txt
```

```bash
bandit24@bandit:/tmp/tmp.3YQNHtW1Uu$ chmod +x brute.sh
bandit24@bandit:/tmp/tmp.3YQNHtW1Uu$ ./brute.sh

# Filter out lines containing "Wrong!" → the correct PIN line remains
bandit24@bandit:/tmp/tmp.3YQNHtW1Uu$ grep -v "Wrong" result.txt
Correct!
The password of user bandit25 is <password goes here>
```

---

## Level 25 → Level 26 — Escape from Restricted Shell (more + vim)

### 🔐 Connection
```bash
ssh bandit25@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
bandit26's shell isn't `/bin/bash` — it's something else. Find out what it is and escape from it.

### 📖 Theory: User Shell, more, and vim

Every user's default shell is written in `/etc/passwd`:
```
bandit26:x:11026:11026:...:/home/bandit26:/usr/bin/showtext
                                                   ↑ this isn't bash!
```

**`more`:** Shows large files page by page. But if the file is small (all content fits on screen), it does **not** enter interactive mode — it exits immediately. If you shrink the terminal window, `more` is forced into interactive mode.

**In `more` interactive mode, press `v`** → opens the file in `vim`.

**Spawning a shell from vim:**
```
:set shell=/bin/bash    → set default shell to bash
:shell                  → open that shell
```
Or to read a file:
```
:e /etc/bandit_pass/bandit26
```

### 🔧 Solution

```bash
# As bandit25: which shell does bandit26 use?
bandit25@bandit:~$ cat /etc/passwd | grep bandit26
bandit26:x:11026:11026:bandit level 26:/home/bandit26:/usr/bin/showtext

bandit25@bandit:~$ cat /usr/bin/showtext
#!/bin/sh
export TERM=linux
more ~/text.txt
exit 0

# There's an SSH key, use it to connect
bandit25@bandit:~$ ls
bandit26.sshkey

# Copy to your own machine, set permissions
$ chmod 600 bandit26.sshkey
$ ssh -i bandit26.sshkey bandit26@bandit.labs.overthewire.org -p 2220
```

When you connect, `more` starts but if the terminal is large it immediately closes. **Make the terminal window very small**, then connect again. `more` will stay in interactive mode:

```
# In more interactive mode:
v          → vim opens

# Inside vim:
:set shell=/bin/bash
:shell

# Now you have a bash shell!
bandit26@bandit:~$ cat /etc/bandit_pass/bandit26
<password goes here>
```

---

## Level 26 → Level 27 — SUID Binary (Again)

### 🔐 Connection
Use the method from the previous level to get a bandit26 shell.

### 🎯 Objective
Use the `bandit27-do` binary in the home directory to get bandit27's password.

### 🔧 Solution

```bash
# In the shell you obtained from Level 26:
bandit26@bandit:~$ ls
bandit27-do  text.txt

bandit26@bandit:~$ ./bandit27-do cat /etc/bandit_pass/bandit27
<password goes here>
```

Same SUID binary logic as Levels 19-20 — the binary runs with bandit27 privileges.

---

## Level 27 → Level 28 — Git Clone

### 🔐 Connection
```bash
ssh bandit27@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
Clone the Git repository at `ssh://bandit27-git@localhost/home/bandit27-git/repo` and find the password.

### 📖 Theory: What is Git?

**Git** is a distributed version control system that tracks code history and changes. Platforms like GitHub and GitLab are built on top of Git.

Basic commands:
- `git clone <url>` → download the repository
- `git log` → show commit history
- `git branch -a` → list all branches
- `git checkout <branch>` → switch branch

`.git/` directory → all version information is stored here.

### 🔧 Solution

```bash
bandit27@bandit:~$ mktemp -d
/tmp/tmp.pUEZdMrFfV
bandit27@bandit:~$ cd /tmp/tmp.pUEZdMrFfV

bandit27@bandit:/tmp/tmp.pUEZdMrFfV$ git clone ssh://bandit27-git@localhost:2220/home/bandit27-git/repo
# Password: bandit27's password

bandit27@bandit:/tmp/tmp.pUEZdMrFfV$ cd repo
bandit27@bandit:/tmp/tmp.pUEZdMrFfV/repo$ cat README
The password to the next level is: <password goes here>
```

---

## Level 28 → Level 29 — Git History (git log + git show)

### 🔐 Connection
```bash
ssh bandit28@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
The password in the repo's README is hidden with `xxxxxxxxxx`. Look at older commits.

### 📖 Theory: git log and git show

```bash
git log              # show commit history
git show <commit_id> # what changed in that commit?
```

> ⚠️ **Important lesson:** Git history keeps everything. If you commit sensitive data (password, API key), even if you delete it later, it remains in history!

### 🔧 Solution

```bash
bandit28@bandit:/tmp/...$ git clone ssh://bandit28-git@localhost:2220/home/bandit28-git/repo
bandit28@bandit:/tmp/.../repo$ cat README.md
- password: xxxxxxxxxx   # hidden

bandit28@bandit:/tmp/.../repo$ git log
commit edd935d...   fix info leak    ← suspicious!
commit c086d11...   add missing data
commit de2ebe2...   initial commit

bandit28@bandit:/tmp/.../repo$ git show edd935d60906b33f0619605abd1689808ccdd5ee
-  password: <old password — next level's password>
+  password: xxxxxxxxxx
```

---

## Level 29 → Level 30 — Git Branches

### 🔐 Connection
```bash
ssh bandit29@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
README says "no passwords in production!" Look at other branches.

### 📖 Theory: Git Branching

Branches are parallel lines of development. Typically:
- `master` / `main` → production (live) code
- `dev` → development code
- `feature/...` → new feature

```bash
git branch -a          # list all branches (including remote)
git checkout <branch>  # switch to branch
```

### 🔧 Solution

```bash
bandit29@bandit:/tmp/.../repo$ git clone ssh://bandit29-git@localhost:2220/home/bandit29-git/repo
bandit29@bandit:/tmp/.../repo$ cat README.md
- password: <no passwords in production!>

bandit29@bandit:/tmp/.../repo$ git branch -a
* master
  remotes/origin/dev          ← interesting!
  remotes/origin/master
  remotes/origin/sploits-dev

bandit29@bandit:/tmp/.../repo$ git checkout dev
bandit29@bandit:/tmp/.../repo$ cat README.md
- password: <password goes here>   ✓
```

---

## Level 30 → Level 31 — Git Tag

### 🔐 Connection
```bash
ssh bandit30@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
README is empty. No log, no branches — what else could there be?

### 📖 Theory: Git Tags

**Tags** mark important points in repo history (e.g., `v1.0.0` release). They may not appear in log or branches.

```bash
git tag              # list tags
git show <tag_name>  # show tag details
```

### 🔧 Solution

```bash
bandit30@bandit:/tmp/.../repo$ git clone ssh://bandit30-git@localhost:2220/home/bandit30-git/repo
bandit30@bandit:/tmp/.../repo$ cat README.md
just an empty file... muahaha

bandit30@bandit:/tmp/.../repo$ git log    # single commit, no info
bandit30@bandit:/tmp/.../repo$ git branch -a  # only master

bandit30@bandit:/tmp/.../repo$ git tag
secret                  ← what's this?

bandit30@bandit:/tmp/.../repo$ git show secret
<password goes here>
```

---

## Level 31 → Level 32 — Git Push + .gitignore Bypass

### 🔐 Connection
```bash
ssh bandit31@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
The README makes the task clear: push a file named `key.txt` with content "May I come in?" to remote. But `.gitignore` blocks all `.txt` files.

### 📖 Theory: git add, commit, push, and .gitignore

**`.gitignore`:** Lists files Git should not track. `*.txt` → all txt files are ignored.

**`git add -f`:** The `-f` (force) flag bypasses `.gitignore` and forcibly adds the file.

```bash
git add -f file.txt          # add despite gitignore
git commit -m "message"      # save changes
git push -u origin master    # send to remote
```

### 🔧 Solution

```bash
bandit31@bandit:/tmp/.../repo$ git clone ssh://bandit31-git@localhost:2220/home/bandit31-git/repo
bandit31@bandit:/tmp/.../repo$ cat README.md
# Filename: key.txt, Content: 'May I come in?', Branch: master

bandit31@bandit:/tmp/.../repo$ cat .gitignore
*.txt    # all txt files blocked!

# Create the file
bandit31@bandit:/tmp/.../repo$ echo 'May I come in?' > key.txt

# Force add, commit, push
bandit31@bandit:/tmp/.../repo$ git add -f key.txt
bandit31@bandit:/tmp/.../repo$ git commit -m "add key"
bandit31@bandit:/tmp/.../repo$ git push -u origin master

remote: Well done! Here is the password for the next level:
remote: <password goes here>
```

---

## Level 32 → Level 33 — Escape from Uppercase Shell ($0)

### 🔐 Connection
```bash
ssh bandit32@bandit.labs.overthewire.org -p 2220
```

### 🎯 Objective
A strange shell greets you on login: everything you type is converted to uppercase. Commands don't work. Escape!

### 📖 Theory: Linux Variables and $0

Linux variables are written in uppercase:
```bash
$HOME   → home directory
$PATH   → command search paths
$SHELL  → current shell
$0      → name of the running script/shell (e.g. /bin/bash)
```

Typing `$0` in a shell restarts the current shell — this is a **shell escape** technique.

The uppercase shell converts everything to uppercase. `ls` → `LS: not found`. But `$0` is a variable reference — it's a symbol, not a letter — so it doesn't get converted to uppercase!

### 🔧 Solution

```bash
WELCOME TO THE UPPERCASE SHELL
>> ls
sh: 1: LS: not found

>> $0          # shell variable → escape!
$              # normal shell prompt!

$ whoami
bandit33       # running as bandit33 thanks to SUID

$ cat /etc/bandit_pass/bandit33
<password goes here>

$ cat README.txt
Congratulations on solving the last level of this game!
```

**Congratulations — Bandit complete! 🎉**

---

## 📚 Commands Summary (Level 21-33)

| Command | What it does |
|---|---|
| `command &` | Runs command in the background |
| `jobs` | Lists background processes |
| `echo -n` | Writes without newline |
| `cat /etc/cron.d/` | Shows cron job definitions |
| `$(command)` | Assigns command output to variable |
| `md5sum` | Generates MD5 hash |
| `cut -d ' ' -f 1` | Cuts text by fields |
| `for i in {0000..9999}` | Bash for loop |
| `chmod +x` | Gives execute permission |
| `grep -v "pattern"` | Shows lines not containing the pattern |
| `cat /etc/passwd` | Shows user and shell information |
| `git clone <url>` | Downloads the repository |
| `git log` | Shows commit history |
| `git show <id/tag>` | Shows commit or tag details |
| `git branch -a` | Lists all branches |
| `git checkout <branch>` | Changes branch |
| `git tag` | Lists tags |
| `git add -f` | Adds file bypassing gitignore |
| `git commit -m "msg"` | Saves changes |
| `git push` | Sends to remote |
| `$0` | Restarts the current shell |
| `printenv` | Lists all environment variables |

---

## 🏁 Bandit Complete!

What you learned across 33 levels:

**Section 1 (0-10):** SSH, filesystem navigation, text processing basics  
**Section 2 (11-20):** Encoding, compression, network communication, advanced SSH features, file permissions  
**Section 3 (21-33):** Cron, bash scripting, brute force, escaping restricted environments, Git

**Next OverTheWire games:**
- **Leviathan** → basic reverse engineering
- **Natas** → web security basics
- **Krypton** → cryptography

---

**Previous sections:** [bandit_0-10.md](./bandit_0-10.md) · [bandit_11-20.md](./bandit_11-20.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
