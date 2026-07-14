# 🔐 Linux Commands — Permissions & Users

> Linux is a multi-user system. Every file has an owner, a group,  
> and permissions. Understanding this system is critical for both security  
> and system administration — many of Bandit's levels rely on it.

---

## 📋 Table of Contents

- [chmod](#chmod)
- [chown](#chown)
- [whoami & id](#whoami--id)
- [su & sudo](#su--sudo)
- [passwd](#passwd)
- [groups](#groups)
- [SUID / SGID / Sticky Bit](#suid--sgid--sticky-bit)

---

## The Linux Permission System

Every file and directory has permissions defined for three groups:

```
-rwxr-xr--  1 bandit7 bandit6 33 May 7 file
 ^^^         owner   group
 |||
 ||+-- execute: x = yes, - = no
 |+--- write: w = yes, - = no
 +---- read: r = yes, - = no

First character:
  - = regular file
  d = directory
  l = symbolic link
  s = socket
  p = pipe
```

**Three groups:**
```
-rwxr-xr--
  ^^^       → owner permissions: rwx
     ^^^    → group permissions: r-x
        ^^^ → others' permissions: r--
```

### Numeric (Octal) Notation

| Number | Permissions | Description |
|---|---|---|
| 7 | rwx | Read + write + execute |
| 6 | rw- | Read + write |
| 5 | r-x | Read + execute |
| 4 | r-- | Read only |
| 0 | --- | No permissions |

```
chmod 755 file
       ^^^
       ||+-- others: 5 = r-x
       |+--- group: 5 = r-x
       +---- owner: 7 = rwx
```

---

## chmod

**Change Mode** — Changes file permissions.

### Basic Usage
```bash
chmod 755 file          # numeric: rwxr-xr-x
chmod +x file           # symbolic: add execute permission
chmod -w file           # symbolic: remove write permission
chmod u+x file          # add execute for the owner only
chmod go-w file         # remove write from group and others
chmod -R 755 folder/    # recursive (apply to subdirectories too)
```

### Symbolic Notation

```
chmod [who][operation][permission] file

Who:
  u = user (owner)
  g = group
  o = others
  a = all

Operation:
  + = add a permission
  - = remove a permission
  = = set the permission exactly

Permission:
  r = read
  w = write
  x = execute
  s = SUID/SGID
  t = sticky bit
```

```bash
chmod u+x file           # add execute for the owner
chmod g-w file           # remove write from the group
chmod o=r file           # others get read only
chmod a+r file           # add read for everyone
chmod ug+rw file         # read+write for owner and group
chmod u=rwx,g=rx,o= file # full control
```

### Common Permission Combinations

| Number | Symbol | Use |
|---|---|---|
| `755` | `rwxr-xr-x` | Executable files, directories |
| `644` | `rw-r--r--` | Regular files |
| `600` | `rw-------` | SSH private keys, secret files |
| `777` | `rwxrwxrwx` | Full access for everyone (use carefully!) |
| `700` | `rwx------` | Only the owner can access |
| `400` | `r--------` | Read-only, owner only |

### Usage in Bandit
```bash
# Level 13: the right permission for an SSH key (must be 700 or 600)
chmod 600 sshkey.private
# otherwise you get: "Permissions 0644 are too open"

# Level 23: make the cron script executable
chmod +rx bandit24_pass.sh

# Level 23: let everyone write to the tmp folder
chmod 777 /tmp/mywork
```

---

## chown

**Change Owner** — Changes a file's owner or group. Requires root privileges.

### Basic Usage
```bash
chown user file                 # change the owner
chown user:group file           # change owner and group
chown :group file               # change the group only
chown -R user:group folder/     # recursive
```

### Examples

```bash
chown robin file.txt            # make robin the owner
chown robin:developers file.txt # owner robin, group developers
chown :www-data /var/www/       # make the group www-data
sudo chown root:root /etc/hosts # make it root:root
```

> 💡 You can give your own file to someone else, but taking someone else's file requires root privileges.

---

## whoami & id

**Whoami** — Shows which user you currently are.  
**Id** — Shows the user ID, group ID, and the groups you belong to.

### Basic Usage
```bash
whoami              # show the username
id                  # show uid, gid, and groups
id user             # show another user's info
```

### Example Outputs

```bash
$ whoami
bandit7

$ id
uid=11007(bandit7) gid=11007(bandit7) groups=11007(bandit7)
#    ^                ^                  ^
#    |                |                  groups you belong to
#    |                group ID (gid)
#    user ID (uid)

$ id root
uid=0(root) gid=0(root) groups=0(root)
```

### Usage in Bandit
```bash
# after running a SUID binary
./bandit20-do whoami
# bandit20 → thanks to SUID, we became bandit20
```

---

## su & sudo

**Su (Switch User)** — Switches to another user.  
**Sudo (Superuser Do)** — Runs a command with root privileges.

### Using su
```bash
su user                 # switch to that user (password required)
su -                    # switch to root
su - user               # switch with that user's environment
```

### Using sudo
```bash
sudo command            # run as root
sudo -u user command    # run as a specific user
sudo -l                 # list which commands you can run
sudo su -               # open a root shell
```

### /etc/passwd and /etc/shadow

```bash
# user information
cat /etc/passwd
# user:x:uid:gid:description:home:shell
# bandit26:x:11026:11026:bandit level 26:/home/bandit26:/usr/bin/showtext
#                                                                ^ shell!

# passwords (root required)
sudo cat /etc/shadow
```

### Usage in Bandit
```bash
# Level 25-26: which shell does it use?
cat /etc/passwd | grep bandit26
# /usr/bin/showtext → not bash!
```

---

## passwd

**Password** — Changes a user's password.

### Basic Usage
```bash
passwd                  # change your own password
sudo passwd user        # change another user's password
sudo passwd -l user     # lock the account
sudo passwd -u user     # unlock the account
```

---

## groups

**Groups** — Lists the groups a user belongs to.

### Basic Usage
```bash
groups                  # show your own groups
groups user             # show another user's groups
```

```bash
$ groups
bandit5 bandit6         # a user can belong to multiple groups
```

---

## SUID / SGID / Sticky Bit

One of Bandit's most critical topics. The special permission bits.

### SUID (Set User ID)

In `ls -l` output, you see an `s` instead of execute for the owner:

```
-rwsr-xr-x  1 root root 12345 file
    ^
    s = SUID bit is active
```

**Normal execution:** The program runs with the privileges of whoever runs it.  
**With SUID active:** The program runs with the privileges of the **file's owner**, not the one running it.

```bash
# Example: the passwd command
ls -la /usr/bin/passwd
-rwsr-xr-x 1 root root ... /usr/bin/passwd
# everyone can run it, but it runs with root privileges
# this is how everyone can change their own password
```

### SGID (Set Group ID)

In `ls -l` output, you see an `s` instead of execute for the group:

```
-rwxr-sr-x  1 user group 12345 file
       ^
       s = SGID bit is active
```

For a file: It runs with the privileges of the **file's group**, not its owner.  
For a directory: Files created in it inherit the directory's group.

### Sticky Bit

In `ls -l` output, you see a `t` instead of execute for others:

```
drwxrwxrwt  root root ... /tmp
         ^
         t = sticky bit
```

On directories: Everyone can create files, but only the **file's owner** can delete them. It's used on the `/tmp` directory.

### Searching for SUID Bits

```bash
# all SUID files on the system
find / -perm -4000 2>/dev/null

# SUID + SGID
find / -perm /6000 2>/dev/null

# list SUID binaries
find / -perm -u=s -type f 2>/dev/null
```

### Numeric Notation

```bash
chmod 4755 file     # SUID + 755
chmod 2755 file     # SGID + 755
chmod 1755 folder   # sticky bit + 755

# SUID = 4000
# SGID = 2000
# Sticky = 1000
```

### Usage in Bandit
```bash
# Level 19: SUID binary
ls -la
# -rwsr-x---  1 bandit20 bandit19 7296 bandit20-do
# rws = SUID → runs with bandit20's privileges

./bandit20-do cat /etc/bandit_pass/bandit20

# Leviathan Level 1-6: there's a SUID binary in every level
ls -la /leviathan/
# -r-sr-x--- 1 leviathan2 leviathan1 ... check
```

---

## 📚 Quick Reference Table

| Command | Basic Usage | What It Does |
|---|---|---|
| `chmod 755` | `chmod 755 file` | Set permissions numerically |
| `chmod +x` | `chmod +x file` | Add execute permission |
| `chmod 600` | `chmod 600 ssh.key` | Only the owner can read |
| `chown` | `chown user:group file` | Change owner/group |
| `whoami` | `whoami` | Show the current user |
| `id` | `id` | Show UID, GID, and groups |
| `su` | `su user` | Switch user |
| `sudo` | `sudo command` | Run as root |
| `groups` | `groups` | Groups you belong to |
| `find -perm -4000` | `find / -perm -4000 2>/dev/null` | Find SUID files |

---

## 📊 Permission Reference Table

| Octal | Symbolic | Typical Use |
|---|---|---|
| `777` | `rwxrwxrwx` | Temporary/test (insecure) |
| `755` | `rwxr-xr-x` | Programs, directories |
| `700` | `rwx------` | Personal directories |
| `664` | `rw-rw-r--` | Group-writable files |
| `644` | `rw-r--r--` | Regular files |
| `600` | `rw-------` | Secret files (SSH key) |
| `444` | `r--r--r--` | Read-only |
| `400` | `r--------` | Only the owner can read |

---

## 🔗 More Information

- `man chmod` · `man chown` · `man sudo`
- [Linux File Permissions](https://www.linux.com/training-tutorials/understanding-linux-file-permissions/)
- [SUID/SGID/Sticky Bit](https://www.redhat.com/sysadmin/suid-sgid-sticky-bit)

---

**Previous section:** [networking.md](./networking.md)  
**Next section:** [process_shell.md](./process_shell.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
