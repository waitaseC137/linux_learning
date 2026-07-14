# File Permissions and SUID

---

## The Permission System

In Linux every file has permissions defined for its owner (user), its group, and everyone else (others).

```
Viewing with ls -la:

-rwxr-x---  1  leviathan2  leviathan1  7452  check
 ^^^---^^^      ^^^^^^^^^   ^^^^^^^^^
 |  |  |        owner        group
 |  |  └── others: ---  (no access)
 |  └───── group:  r-x  (read + execute)
 └──────── user:   rwx  (read + write + execute)
```

The first character shows the file type: `-` regular file, `d` directory, `l` symbolic link.

---

## chmod — Changing Permissions

```bash
chmod [mode] file
```

**Symbolic mode:**

```bash
chmod u+x file      # add execute for the owner
chmod g-w file      # remove write from the group
chmod o+r file      # add read for others
chmod a+x file      # add execute for everyone (a = all)
chmod 777 folder    # full access for everyone (rwxrwxrwx)
chmod 755 file      # rwxr-xr-x
```

**Numeric mode:**

| Number | Permission |
|---|---|
| 7 | rwx |
| 6 | rw- |
| 5 | r-x |
| 4 | r-- |
| 0 | --- |

```bash
chmod 777 /tmp/mydir    # full access for everyone — for temporary working dirs
chmod 644 file          # owner reads/writes, others only read
```

---

## SUID — Set User ID

**The SUID bit:** When a binary is executed, it runs with the permissions of the **file's owner**, not the user who ran it.

```
SUID in ls -la output:

-r-sr-x---  1  leviathan2  leviathan1  7452  check
      ^
      s → SUID bit is set (it would normally be x)
```

**Meaning of the `s` character:**
- lowercase `s` → SUID + execute permission present
- uppercase `S` → SUID set but no execute permission (non-functional)

**Why does it matter?**  
The binaries in Leviathan are SUID and owned by the user of the next level. Running the binary performs actions with that user's permissions → you can reach the password file.

```bash
# Find SUID binaries
find / -perm -u=s -type f 2>/dev/null
find / -perm /4000 -type f 2>/dev/null    # same thing, different syntax
```

---

## find -perm — Searching Files by Permission

```bash
find [where] -perm [mode]
```

| Usage | Meaning |
|---|---|
| `-perm 4755` | has exactly this permission set |
| `-perm -4000` | SUID bit is set (other bits don't matter) |
| `-perm /4000` | same — preferred syntax in GNU find |
| `-perm -u=s` | SUID set for the owner |

```bash
# List every SUID binary on the system, hide error output
find / -perm -u=s -type f 2>/dev/null

# Search only under /usr
find /usr -perm -4000 -type f 2>/dev/null
```

---

## whoami and id — Finding Out the Current User

```bash
whoami         # show the current username
id             # show uid, gid and group memberships
```

```bash
$ whoami
leviathan1

$ id
uid=12001(leviathan1) gid=12001(leviathan1) groups=12001(leviathan1)

# After running the SUID binary:
$ ./check
password: sex
$ whoami
leviathan2     ← privileges changed thanks to SUID!
```

---

## Privilege Escalation

**Privilege escalation:** Going from a low-privileged user to a higher-privileged one. The entire point of Leviathan is this.

Basic methods:
1. **SUID binary abuse** — running code with the privileges of the binary's owner
2. **Symbolic link attack** — changing the file the binary reads
3. **Library-call leak** — passwords leaked via `ltrace`

```bash
# The password is always here:
cat /etc/leviathan_pass/leviathan<N>
# Reading it requires that user's privileges — obtained via the SUID binary.
```
