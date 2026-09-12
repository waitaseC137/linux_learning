# 👾 CWE-59 — Improper Link Resolution Before File Access ('Link Following')

> **Link following.** The program opens a file by its **name**. But a name is not
> the file itself — it can be a signpost pointing somewhere else. The program reads
> the signpost and never questions where it led.

| | |
|---|---|
| **Official name** | Improper Link Resolution Before File Access ('Link Following') |
| **Parent class** | CWE-706 — Use of Incorrectly-Resolved Name or Reference |
| **Its variants** | CWE-61 (UNIX symbolic link) · CWE-62 (hard link) · CWE-64/65 (Windows shortcut and hard link) · CWE-1386 (Windows junction) |
| **Where you meet it** | [Leviathan · Lesson 5](../leviathan_komutlari/what_leviathan_teaches.md#lesson-5--symbolic-link-attack--insecure-tmp) · [binary_exploitation/07](../binary_exploitation/07_sembolik_link.md) |

---

## A Name Is Not an Identity

A path (`/tmp/record.log`) does not point at a file — it points at a **name**. The
bond between the name and the file is made by the operating system, and that bond
is a place someone can step into.

```
the program opens:   /tmp/record.log
                           │
                           ▼
                  ┌─────────────────┐
                  │  symbolic link  │ ────►  /etc/passwords
                  └─────────────────┘
                           │
the program writes:  actually HERE
```

The program broke no rule. It opened the name it was given, correctly; it was not
the one deciding where that name led.

> 🔑 The heart of the weakness is one sentence: **what the program trusts is a name,
> but someone else can decide where that name points.** File permissions will not
> save you here — the program is already privileged, and it goes where it goes with
> that privilege.

What you saw in Leviathan 5 was the purest form of this: a privileged program used
a **predictable** name in `/tmp` and **never checked what it was.**

---

## 59 · 367 · 363 — Do Not Confuse Them

There is a fine distinction here, and MITRE draws it explicitly in its own
relationship table:

```
CWE-59   →  NO check at all.    The program follows the link without question.
CWE-367  →  There IS a check, but the race is lost (TOCTOU).
CWE-363  →  The combination: winning the race and placing a LINK in between.
```

> ⚠️ **CWE-59 and [CWE-367](./cwe_367.md) are not directly related.** A separate
> number connects them: **CWE-363 — Race Condition Enabling Link Following**, which
> sits in 59's *CanFollow* relationship.
>
> In practice the distinction is: if the link is already there and the program never
> looks, that is **59**. If the program looks but the link is placed after it
> looked, that is **363**, and the racing mechanism underneath it is **367**.

---

## MITRE's Recorded Examples

The age of this weakness is as striking as its reach — from 1999 to today, from a
single machine to containers:

| CVE | What happened |
|---|---|
| **CVE-1999-1386** | An option of Perl follows a symbolic link, allowing a file to be overwritten |
| **CVE-2004-0217** | An antivirus update is open to a link attack through its log file |
| **CVE-2000-1178** | A text editor follows links while creating a rescue copy |
| **CVE-2015-3629** | A link attack in a container image achieves a **container escape** |
| **CVE-2021-21272** | "Zip Slip" — writing **outside** the intended directory in an image registry |

> 💡 Note the last two. The 2015 case pierces isolation itself: the container was
> assumed to be a boundary, and the link went underneath it. And the pattern has not
> changed in twenty years — only what "a file" is: first a log file, then a container
> layer, then the contents of an archive.

---

## How It Is Prevented

The whole defence rests on one idea: **verify after opening, not before** — or do
not allow it at all.

- **`O_NOFOLLOW`.** Pass this flag to the open call; if the last component of the
  path is a symbolic link, the open fails. A prohibition rather than a question.
- **An unpredictable name.** Calls like `mkstemp()` create the file **atomically**
  with a name that cannot be guessed. An attacker cannot pre-place a link there,
  because they cannot know the name.
- **Do not use a shared directory.** `/tmp` is open to everyone. A per-user directory
  with tight permissions closes most of this class.
- **Drop privileges before the work.** If the program is not writing as root, it
  cannot write wherever the link points
  ([lesson 19](../binary_exploitation/19_setuid_yetki_dususu_ve_p_bayragi.md)).
- **Separation of privilege.** The design principle MITRE highlights: least privilege
  plus protected areas. What the program can write to and where sensitive files live
  should not be the same pool.

---

## Summary — Keep in Mind

```
☐ A name is not an identity. A path points at a name, not at a file.
☐ The program breaks no rule; it opens the name correctly, it just doesn't know where the name leads.
☐ File permissions do not save you — the program is already privileged and travels with that privilege.
☐ Leviathan 5 was the purest form: a predictable name plus no check at all.
☐ 59 = no check · 367 = check exists but the race is lost · 363 = both together.
☐ In MITRE, 59 and 367 are NOT directly related; the number that links them is 363.
☐ It has variants: symbolic link, hard link, Windows shortcut, junction.
☐ The pattern is unchanged from 1999 to 2021; only what "a file" is has changed (container, archive).
☐ Defences: O_NOFOLLOW · an unpredictable name via mkstemp · avoid shared directories.
☐ And the sturdiest: drop privileges before the work — a program that cannot write cannot write to the wrong place either.
```

---

## 🔗 Related Topics

- [CWE-367](./cwe_367.md) — There is a check, but the race is lost: TOCTOU
- [CWE-78](./cwe_78.md) — The neighbouring weakness in the same lesson: command injection
- [Leviathan · Lesson 5](../leviathan_komutlari/what_leviathan_teaches.md#lesson-5--symbolic-link-attack--insecure-tmp) — The first encounter
- [binary_exploitation/07 · Symbolic Links](../binary_exploitation/07_sembolik_link.md) — The mechanism in detail
- [binary_exploitation/19 · setuid](../binary_exploitation/19_setuid_yetki_dususu_ve_p_bayragi.md) — How privileges are dropped
- [👾 CWE Map](./README.md) — The index of every CWE

---

*Numbers and official names are taken from MITRE's CWE list: [cwe.mitre.org](https://cwe.mitre.org).*
