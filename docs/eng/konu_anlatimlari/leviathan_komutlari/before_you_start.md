# Before You Start — Leviathan Prerequisites

> Everything you need to know before sitting down at the Leviathan lab: the logic of the game, how to connect, what fundamentals you need, and what kind of exploration reflex you should build in the very first shell you open.

---

## What is Leviathan?

Leviathan is an **entry-level** wargame on the [OverTheWire](https://overthewire.org/wargames/leviathan/) site. Unlike Narnia/Behemoth, it doesn't teach you to write exploits; it teaches you **basic Linux skills, file permissions, SUID logic, and simple reverse engineering**. There are 8 levels (leviathan0 → leviathan7), and most levels are solved in 5–15 minutes.

There are no hints/theory — each level only gives you a user and a directory; you find the rest by exploring.

---

## How the game works

The common rule across all OverTheWire games is this:

```
Each level is about capturing the password of the NEXT level.
```

- You log in as `leviathan0`, and your goal is to find the `leviathan1` password.
- The password always sits here:

```bash
/etc/leviathan_pass/leviathan<N>
```

- Only the `leviathanN` user can read this file. You are `leviathan(N-1)` → you can't `cat` it directly.
- So, using a **SUID program** in the home directory or a misconfiguration, you escalate to `leviathanN` privileges, then read the password.

---

## How do you connect? (SSH)

```bash
ssh leviathan0@leviathan.labs.overthewire.org -p 2223
```

| Part | Value |
|---|---|
| User | `leviathan0` (first level) |
| Server | `leviathan.labs.overthewire.org` |
| Port | `2223` |
| Starting password | `leviathan0` |

Once you solve a level and find the next password, you exit (`exit`) and reconnect as the next user up:

```bash
ssh leviathan1@leviathan.labs.overthewire.org -p 2223   # with the password you found
```

> **Note:** When you type the password it won't appear on screen (this is normal). When you copy-paste, watch out for leading/trailing whitespace.

---

## What fundamentals do you need?

Knowing the topics below is enough. For each one there is a separate topic writeup in this folder:

| Need | Why it's needed | Topic file |
|---|---|---|
| **Navigating the terminal** (`ls -la`, `cd`, `cat`, `pwd`) | Exploring directories, seeing hidden files | [linux_komutlari/dosya_sistemi.md](../linux_komutlari/dosya_sistemi.md) |
| **Text searching** (`grep`, `strings`) | Finding a leaked password inside a file | [linux_komutlari/metin_isleme.md](../linux_komutlari/metin_isleme.md) |
| **File permissions & SUID** | The whole logic of the game rests on this | [file_permissions_suid.md](./file_permissions_suid.md) |
| **Binary recognition** (`file`, `xxd`, binary→ASCII) | Figuring out whether a program is 32/64-bit and decoding its output | [binary_analysis.md](./binary_analysis.md) |
| **Dynamic analysis** (`ltrace`, `strace`) | Seeing which password the program compares against | [ltrace_strace.md](./ltrace_strace.md) |
| **Static analysis** (`gdb`, `objdump`) | Reading embedded constants/code | [gdb.md](./gdb.md) |
| **Symbolic links** (`ln -s`) | Redirecting the file the program reads | [symbolic_links.md](./symbolic_links.md) |
| **Bash loops & brute force** | Trying short codes/PINs | [brute_force_bash.md](./brute_force_bash.md) |

> All of these tools are **already installed on the server** (`ltrace`, `strace`, `gdb`, `objdump`, `strings`, `file` are present). You don't need to install anything on your own machine; just an SSH client is enough.

---

## The exploration reflex in the first shell you open

Every time you enter a new level, apply these steps without thinking:

```bash
# 1) Where am I, who am I?
pwd; id; whoami

# 2) What's IN the home directory? (including hidden files — the most critical command)
ls -la

# 3) If there's an interesting file/binary, learn its type
file <file>

# 4) If it's a binary: run it, see what it wants; then trace it with ltrace
./<binary>
ltrace ./<binary>

# 5) If there's a text/backup file, search inside it for a secret
grep -i -E 'pass|key|secret' <file>
```

The **hidden files** in `ls -la` (like `.backup`, `.trash`) and the **SUID bit** (`-r-s...`) are almost always the key to the solution.

---

## Safe working habits

- Create temporary files in your own space: open a private directory with `cd /tmp && mktemp -d`.
- Clean up the symlinks/files you create when you're done (`rm`), so they don't break your next attempt.
- When you find a password, **note it down somewhere** (but per OTW rules, don't share it publicly).

---

## Summary

| Question | Answer |
|---|---|
| What's the goal? | At each level, find the next user's password |
| Where's the password? | `/etc/leviathan_pass/leviathan<N>` |
| How do I read it? | Escalate privileges with a SUID binary / misconfiguration |
| How do I connect? | `ssh leviathanN@leviathan.labs.overthewire.org -p 2223` |
| What do I do first? | `ls -la` → look for hidden files & SUID, inspect with `file`/`ltrace` |

---

## 🔗 Related Topics

- 👉 **What Leviathan teaches:** [what_leviathan_teaches.md](./what_leviathan_teaches.md)
- Solutions: [../../overthewire/leviathan/](../../overthewire/leviathan/) (`leviathan N -> M` files)
- Full topic index: [../KONU_ANLATIMLARI.md](../KONU_ANLATIMLARI.md)
