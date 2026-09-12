# 👾 CWE-78 — OS Command Injection

> **OS command injection.** The program builds a command line by **concatenating**
> it with data that came from outside, then hands it to a shell. As the shell reads
> that line it does not treat the data as data — it counts it as part of the
> command.

| | |
|---|---|
| **Official name** | Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection') |
| **Parent class** | CWE-77 — Command Injection (general, not limited to the OS) |
| **Its relative** | CWE-88 — Argument Injection |
| **Where you meet it** | [Leviathan · Lesson 3](../leviathan_komutlari/what_leviathan_teaches.md#lesson-3--command--argument-injection-system) · [web_guvenligi/07](../web_guvenligi/07_command_injection.md) |

---

## Root Cause: Data and Command Travelling Down the Same Channel

A shell command is plain text. The program builds a string like this:

```
"/bin/cat " + input_from_user
```

In the program's head these are two parts: a **command** and **data**. But they go
to the shell as a single string, and the shell parses that string by its own rules.
In the shell's rules a space separates arguments, `;` separates commands, `|`
redirects output. The shell has no way of knowing which character came "from your
data".

> 🔑 Every member of this family shares the same root sentence: **data and command
> travel down the same channel.** SQL injection is that sentence; so is format
> string. The moment you notice it, what the defence must be also falls out:
> **separate the channels.**

MITRE distinguishes two subtypes of this weakness:

| form | what happens |
|---|---|
| **Argument injection** | The program knows which program it will run, but does not sanitise the arguments |
| **Full command control** | The user gets to decide which program runs at all |

The second is more devastating, the first more common. What you met in Leviathan 2
was the first: the program knew it would run `cat`; it just did not know where the
argument ended.

---

## Why Filtering Is a Weak Defence

The first fix that comes to mind is to forbid dangerous characters. The recorded
cases show why that is brittle — two rows from MITRE's table:

| CVE | What happened |
|---|---|
| **CVE-2024-44335** | A filter checks only **some** of the shell characters; the rest remain open |
| **CVE-2024-6091** | An **incomplete denylist** allows `/./` sequences in a pathname, leading to injection |

The problem is this: a denylist **permits everything you forgot to list.** A
shell's set of special characters varies between shells and between versions. While
you are writing the list, the shell keeps growing.

> ⚠️ This is why the tool is not a denylist but an **allowlist**: instead of
> enumerating what is forbidden, enumerate what is permitted. Everything outside the
> list is closed — including what you forgot.

---

## The Real Defence: Separate the Channel

At the top of MITRE's design recommendations sits one that closes most of this
family on its own:

> **Drop the calls that take a single string; use the ones that take an array.**

```c
system("/bin/cat " + name);          //  ✗  one string — the shell parses it
execv("/bin/cat", (char*[]){"cat", name, NULL});   //  ✓  arguments kept SEPARATE
```

The difference: `execv` never invokes a shell at all. Because the arguments are
placed in an array, a space, a `;` or a `|` inside `name` changes nothing — those
characters are no longer separators, just letters in a filename.

> 💡 This is exactly the defence from Leviathan Lesson 3. And recognise the shape:
> for every member of the injection family the right fix has the same form —
> prepared statements in SQL, an argument array in the shell. All of it means
> **taking the data out of the channel.**

Added on top:

- **A library call instead of an external process.** To copy a file, use the file
  API rather than running `cp`; where there is no command there is no injection.
- **Least privilege.** If an injection happens, the attacker inherits the process's
  privileges. A low-privileged process means low damage.
- **Confinement.** chroot, AppArmor, SELinux — even if the process escapes, its room
  to move is small.

---

## Why This Class Is Still Alive

The earliest example recorded for CWE-78 is **CVE-1999-0067**: a CGI phonebook
program failing to neutralise the pipe (`|`) character. The newest entries in
MITRE's table are from 2024–2025 and include wireless access points, network
configuration tools and AI platforms (**CVE-2024-52803**: insecure `Popen` usage in
an LLM platform).

In twenty-five years the technology changed; the pattern did not: **somewhere, a
string was concatenated.**

> 🔑 Several cases carry a note that they were exploited in the wild
> (CVE-2020-10987, CVE-2020-9054). This class is not a theoretical risk; it is
> actively used against devices at the level of a home router.

---

## Summary — Keep in Mind

```
☐ Root cause: data and command travel down the same channel. The shell cannot tell them apart.
☐ Two forms: argument injection (common) and full command control (devastating).
☐ Leviathan 2 was argument injection: it was known that cat would run, not where the argument ended.
☐ A denylist is brittle — it permits everything you forgot to list.
☐ Use an allowlist: everything outside the list is closed, including what you forgot.
☐ The real fix is not filtering but SEPARATING THE CHANNEL: not system() but execv(), arguments as an array.
☐ execv never invokes a shell; a space or a ; is no longer a separator, just a letter.
☐ The same shape is prepared statements in SQL, a fixed format string in format-string bugs.
☐ Where there is no command there is no injection — prefer a library call where possible.
☐ Least privilege bounds the damage: the attacker inherits the process's privileges.
☐ From 1999 to 2025 the technology changed, the pattern did not: somewhere a string was concatenated.
```

---

## 🔗 Related Topics

- [Leviathan · Lesson 3](../leviathan_komutlari/what_leviathan_teaches.md#lesson-3--command--argument-injection-system) — The first form of the weakness you meet
- [web_guvenligi/07 · Command Injection](../web_guvenligi/07_command_injection.md) — The same class on the web, with filter-bypass examples
- [CWE-59](./cwe_59.md) — The neighbouring weakness in the same lesson: link following
- [binary_exploitation/19](../binary_exploitation/19_setuid_yetki_dususu_ve_p_bayragi.md) — Least privilege and separating arguments with `execv`
- [👾 CWE Map](./README.md) — The index of every CWE

---

*Numbers and official names are taken from MITRE's CWE list: [cwe.mitre.org](https://cwe.mitre.org).*
