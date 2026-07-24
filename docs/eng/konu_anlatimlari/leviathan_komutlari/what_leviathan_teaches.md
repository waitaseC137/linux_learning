# What Does Leviathan Teach Us?

> More than exploit writing, Leviathan teaches the **everyday language of local privilege escalation**: the classic ways of going from a "low-privilege user" to a "privileged user" on a system. Below is each lesson, together with the level where it appears and its real-world counterpart.

---

## The Big Picture

The whole of Leviathan can be summarized in a single sentence:

> **Abusing input/a file/a behavior that a program trusts, through that program's privilege (SUID).**

Every level is a different variation of this idea. What you learn is not commands; it's **how to look at a target** — the reflex of seeing what counts as an "attack surface."

---

## Lesson 1 — Information Disclosure
**Level:** leviathan0

The password was embedded in plain text inside a backup file (`.backup/bookmarks.html`). Sensitive data had been left forgotten in an accessible file with a "we'll fix it later" note.

- **Attack reflex:** Reveal hidden files with `ls -la`, scan for secrets with `grep -i pass`.
- **Real world:** API keys that slipped into Git history, passwords in log files, credentials left in comment lines.
- **Defense:** Don't embed secrets in code/backups; use a secret manager, tighten permissions, clean the history.

🔗 Solution: [leviathan 0 -> 1](../../overthewire/leviathan/leviathan%200%20-%3E%201.md)

---

## Lesson 2 — Finding an Embedded Secret with Dynamic Analysis
**Level:** leviathan1, leviathan3

The programs asked for a password, but they had hardcoded the password inside the binary (`strcmp(input, "sex")`, `strcmp(input, "snlprintf")`). Tracing the library calls with `ltrace` revealed the password instantly.

- **Attack reflex:** Before diving into reverse engineering, observe with `ltrace`/`strace`. Most "hidden" comparisons show up there.
- **Real world:** API keys embedded in mobile apps/firmware, license checks, "secret" comparisons.
- **Defense:** "Security through obscurity" is not security. Do authentication on the server side, with a hash + constant-time comparison.

🔗 Solutions: [leviathan 1 -> 2](../../overthewire/leviathan/leviathan%201%20-%3E%202.md) · [leviathan 3 -> 4](../../overthewire/leviathan/leviathan%203%20-%3E%204.md)

---

## Lesson 3 — Command & Argument Injection (`system()`)
**Level:** leviathan2

The `printfile` program checked its access with `access()`, then printed the file with `system("/bin/cat " + argv[1])`. Because the shell **splits the filename on whitespace**, it became possible to inject an extra argument; moreover, `access` and `cat` interpreted the same string differently.

- **Attack reflex:** If user input flows into a shell command, try injection with whitespace / `;` / `|` / `$()`.
- **Real world:** **OS command injection** (CWE-78) on the web — this is the exact same logic as the most common and dangerous form of that class.
- **Defense:** Instead of `system()`/`popen()`, pass arguments **separately** with `execv()`; never embed user input into a shell as a string.

🔗 Solution: [leviathan 2 -> 3](../../overthewire/leviathan/leviathan%202%20-%3E%203.md)

---

## Lesson 4 — Encoding ≠ Encryption
**Level:** leviathan4

`.trash/bin` printed the password as binary ASCII, in the form `00110000 01100100 ...`. This is not encryption, just a **representation (encoding)**; converting the bits in groups of 8 to ASCII was enough.

- **Attack reflex:** With "unreadable" output like 0/1, base64, hex, try decoding first — most of it is just encoding.
- **Real world:** Tokens "hidden" with base64, hex dumps, URL-encoded data.
- **Defense:** Encoding data does not hide it. If you genuinely need secrecy, you need encryption (and key management).

🔗 Solution: [leviathan 4 -> 5](../../overthewire/leviathan/leviathan%204%20-%3E%205.md)

---

## Lesson 5 — Symbolic Link Attack & Insecure `/tmp`
**Level:** leviathan5

The `leviathan5` program opened and printed a fixed path (`/tmp/file.log`) with leviathan6's privilege, but **didn't check what the file was**. When we made that path a symlink to the password file, the program read the password for us.

- **Attack reflex:** If a privileged program uses a **predictable** filename in `/tmp`, redirect it to your target with a symlink.
- **Real world:** **Symlink following / insecure temporary file** (CWE-59) — here there isn't even a check; the symlink is followed directly. (If an `access()` check had come in between, the check↔use race = **TOCTOU**, CWE-367.) Both are the basis of many local privesc CVEs.
- **Defense:** `O_NOFOLLOW`, per-user secure directories, `mkstemp`, and dropping privilege before the work (`setresuid`).

🔗 Solution: [leviathan 5 -> 6](../../overthewire/leviathan/leviathan%205%20-%3E%206.md)

---

## Lesson 6 — Static Analysis & Weak Secrets
**Level:** leviathan6

`leviathan6` asked for a 4-digit PIN. There were two ways: either **brute force** 0000–9999, or read the compared constant directly with `objdump` (`mov [ebp-0xc], 0x1bd3` before `cmp [ebp-0xc], eax` = 7123). Static analysis gave the answer in seconds.

- **Attack reflex:** If the search space is small, brute force; if you have the binary, read the constant with `objdump`/`gdb`.
- **Real world:** Short PINs, predictable tokens, "magic" values embedded in the binary.
- **Defense:** Don't put secrets in the binary as immediates; rate-limit PINs and validate them on the server.

🔗 Solution: [leviathan 6 -> 7](../../overthewire/leviathan/leviathan%206%20-%3E%207.md)

---

## Level → Concept Map

| Level | Vulnerability class | Key tool |
|---|---|---|
| 0 → 1 | Information disclosure | `ls -la`, `grep` |
| 1 → 2 | Embedded secret + dynamic analysis | `ltrace` |
| 2 → 3 | Argument/command injection (`system`) | logic + `ltrace` |
| 3 → 4 | Embedded secret + dynamic analysis | `ltrace` |
| 4 → 5 | Encoding ≠ encryption | binary→ASCII |
| 5 → 6 | Symlink following + insecure `/tmp` | `ln -s` |
| 6 → 7 | Weak secret (brute / static analysis) | `objdump`, `for` loop |

---

## High-Level Takeaways

1. **SUID is powerful but dangerous.** Every program that runs with privilege can be exploited through every input/file/behavior it trusts. Narrow the attack surface, drop privilege early.
2. **Security ≠ obscurity.** An embedded password, encoded data, a short PIN — none of them is protection.
3. **Observe first, then solve.** The sequence `ls -la` → `file` → `ltrace`/`objdump` solves most of the levels on its own.
4. **The same mistakes are everywhere.** The command injection, TOCTOU and info-disclosure lessons here are exact miniatures of the most common security vulnerability classes in the web and in real systems.

---

## What's Next?

Leviathan gave you the fundamentals. The next steps:

- **Behemoth** — buffer overflow and more serious memory errors.
- **Narnia** — the beginning of exploit development (shellcode, EIP control).
- If you want to move on to the fundamentals of memory exploitation: [../binary_exploitation/00_x86_assembly_temelleri.md](../binary_exploitation/00_x86_assembly_temelleri.md)

---

## 🔗 Related Topics

- 👈 **Before you start — background knowledge:** [before_you_start.md](./before_you_start.md)
- Technical references: [file_permissions_suid.md](./file_permissions_suid.md) · [ltrace_strace.md](./ltrace_strace.md) · [symbolic_links.md](./symbolic_links.md) · [gdb.md](./gdb.md) · [binary_analysis.md](./binary_analysis.md) · [brute_force_bash.md](./brute_force_bash.md)
- Full topic index: [../KONU_ANLATIMLARI.md](../KONU_ANLATIMLARI.md)
