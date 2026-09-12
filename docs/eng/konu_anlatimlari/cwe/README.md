# 👾 CWE Map

> If you got here from a **👾 For the Curious** link in a lesson, you're in the
> right place. This page first explains what a CWE and a CVE are, then lists the
> weaknesses you run into across the lessons, all in one spot.
>
> This is an **index**. Every weakness has its own page: what it is, which circuit
> it is born in, what it has done in the real world, and how it is prevented.
> The lessons themselves only teach the circuit and the math.

---

## 📋 Table of Contents

- [What Is a CWE?](#what-is-a-cwe)
- [What Is a CVE?](#what-is-a-cve)
- [CWE vs CVE](#cwe-vs-cve)
- [Chains: The Wire Between Two Bugs](#chains-the-wire-between-two-bugs)
- [From Switches to a Computer](#from-switches-to-a-computer)
- [Binary Analysis & RE (Leviathan)](#binary-analysis--re-leviathan)
- [Not Yet Mapped](#not-yet-mapped)

---

## What Is a CWE?

**CWE** (*Common Weakness Enumeration*) is a catalogue of the **kinds of mistakes**
that keep showing up in software and hardware. It is maintained by MITRE, and every
kind has a number.

Example: **CWE-190 — Integer Overflow or Wraparound.** In lesson 08 you saw that
the 17th bit of a 16-bit adder has nowhere to go. That is the name of that kind of
mistake.

> 🔑 A CWE is a **weakness**, not a vulnerability on its own. A counter can wrap and
> nothing happens. It turns dangerous the moment the overflowed number is used as a
> memory size, a bounds check, or an array index.

---

## What Is a CVE?

**CVE** (*Common Vulnerabilities and Exposures*) is the identifier given to **one
specific vulnerability in one specific product**. The format is `CVE-year-number`.

Example: **CVE-2018-10299.** In the BEC Token smart contract, the total amount to
send was computed as `number of recipients × amount`. An attacker made that product
wrap in 256 bits (`2 × 2²⁵⁵ = 2²⁵⁶` → `0`); the balance check saw zero and let it
through. The kind of this vulnerability: **CWE-190.**

---

## CWE vs CVE

| | CWE | CVE |
|---|---|---|
| **What does it name?** | The **kind** of mistake | A single **case** |
| **Example** | CWE-190: integer overflow | CVE-2018-10299: the overflow in BEC Token |
| **Question it answers** | "What kind of bug is this?" | "Which product, which version?" |
| **What is it good for?** | Knowing **what to look for** when auditing code | Knowing **what to update** |

> 🔑 Many CVEs can sit under a single CWE. CVEs record what has already happened;
> knowing the CWE is what lets you find the next bug *before* it becomes a CVE.

---

## Chains: The Wire Between Two Bugs

Some CWE numbers do not name a single mistake — they name how one mistake gives
birth to another. MITRE calls these **chains**.

```
   CWE-190                                      CWE-787
 number wraps  ─────────  CWE-680  ─────────►  out-of-bounds write
                    (the name of this wire)
```

`CWE-680` is not a third event; it is the name of the wire between two events: the
moment the wrapped number is used as a memory size. The two-box model explains it →
[CWE-680](./cwe_680.md#there-are-two-boxes-here)

---

## From Switches to a Computer

Not every lesson has a CWE. If there is no real connection to the circuit, the
lesson is not listed here.

📄 has its own page · 📖 taught inside the lesson · 👾 short write-up on this page · 🔜 on the way

### Unit 0 — Bricks: From Switches to Gates

NandGame assumes its gates are **perfect**: they burn no energy, they never lag,
they never get it wrong. The CWEs at this level stand exactly where that assumption
breaks.

| Lesson | CWE | Official name | |
|---|---|---|---|
| [01 · Current, the Switch, and NAND](../salterden_bilgisayara/01_akim_salter_role.md) | [**CWE-1300**](./cwe_1300.md) | Improper Protection of Physical Side Channels | 📄 |
| [02 · All the Gates from One Brick](../salterden_bilgisayara/02_nanddan_kapilar.md) | [**CWE-1247**](./cwe_1247.md) | Improper Protection Against Voltage and Clock Glitches | 📄 |

**📄 CWE-1300 — Physical side channel.** A gate spends energy when it changes state; the current it draws, the waves it radiates and the sound it makes are all related to the data being processed. Even with flawless code, the leak comes from physics → [its page](./cwe_1300.md)

**📄 CWE-1247 — Voltage and clock glitching.** A gate only works correctly as long as its supply and its clock hold. Break either one for an instant and the circuit produces a wrong result — and if that result was a security decision, "no" turns into "yes" → [its page](./cwe_1247.md)

### Unit 1 — Counting and Adding

| Lesson | CWE | Official name | |
|---|---|---|---|
| [04 · When Wires Become Numbers](../salterden_bilgisayara/04_teller_sayi_olunca.md) | [**CWE-1261**](./cwe_1261.md) | Improper Handling of Single Event Upsets | 📄 |

**📄 CWE-1261 — Single event upset.** A charged particle can flip the value held in a memory cell. The `n wires → 2ⁿ patterns` rule from lesson 04 is what lets you track it down: if exactly a power of two was added to a number, a single bit flipped → [its page](./cwe_1261.md)

### Unit 2 — The Limit of a Number, and Negative Numbers

| CWE | Official name | Where it is born | |
|---|---|---|---|
| [**CWE-190**](./cwe_190.md) | Integer Overflow or Wraparound | [08 · Increment](../salterden_bilgisayara/08_increment.md) · [08.5](../salterden_bilgisayara/08.5_sayac_basa_donunce.md) | 📄 |
| [**CWE-191**](./cwe_191.md) | Integer Underflow (Wrap or Wraparound) | [09 · Subtraction](../salterden_bilgisayara/09_subtraction.md) · [08.5](../salterden_bilgisayara/08.5_sayac_basa_donunce.md) | 📄 |
| [**CWE-680**](./cwe_680.md) | Integer Overflow to Buffer Overflow | [08 · Increment](../salterden_bilgisayara/08_increment.md#-the-security-bridge) | 📄 |
| [**CWE-787**](./cwe_787.md) | Out-of-bounds Write | [08 · Increment](../salterden_bilgisayara/08_increment.md#-the-security-bridge) | 📄 |
| [**CWE-681**](./cwe_681.md) | Incorrect Conversion between Numeric Types | [04 · When Wires Become Numbers](../salterden_bilgisayara/04_teller_sayi_olunca.md) | 📄 |
| **CWE-196** → **CWE-839** → **CWE-195** | below | [09 · Subtraction](../salterden_bilgisayara/09_subtraction.md#-the-security-bridge) | 👾 |

**👾 Three CWEs back to back in the lesson 09 example.** A length of `65535` arrives
from the network, is stored in a signed variable, and the same number is then
misread three times in a row:

| Step | What happens | CWE |
|---|---|---|
| Going into the variable | `65535` becomes `−1` in a signed type | **CWE-196** — Unsigned to Signed Conversion Error |
| At the check | `if (len > MAX)` only looks at the upper bound, so `−1` passes | **CWE-839** — Numeric Range Comparison Without Minimum Check |
| At the use | `memcpy` reads the same value as unsigned: `65535` bytes | **CWE-195** — Signed to Unsigned Conversion Error |

**🔗 The exploitation side:** how this same family is actually abused on real levels →
[binary_exploitation/11 · Integer Bugs](../binary_exploitation/11_integer_bug_truncation_signedness.md)
(truncation, signed/unsigned bypass, `×4` wraparound · Utumno 4/6, Maze 7)

### Unit 3 — Making Decisions and Routing

Lessons 10 and 11 have no direct CWE yet. The overflow flag (OF) promised in 10
arrives at the Condition level, and the comparison bugs come with it.

### On the Way — The ALU Unit and Beyond

🔜 These are plans. They get fixed as the lessons are written, and they may change.

| Where | CWE | Official name | Why there |
|---|---|---|---|
| Logic Unit | **CWE-480** | Use of Incorrect Operator | A logical operation where a bitmask was meant: `&&` instead of `&` |
| Arithmetic Unit | **CWE-193** | Off-by-one Error | One increment or decrement and the bounds: is it `<` or `<=` |
| ALU | **CWE-1242** | Inclusion of Undocumented Features or Chicken Bits | Control-bit combinations nobody ever documented |
| Condition | **CWE-697** | Incorrect Comparison | Comparison = subtraction + looking at the sign; overflow makes the sign lie |
| After the memory unit | **CWE-416** | Use After Free | Carrying on using memory that has already been handed back |
| Clock | **CWE-1298** | Hardware Logic Contains Race Conditions | Signals travelling at different speeds |

---

## Binary Analysis & RE (Leviathan)

| Lesson | CWE | Official name | |
|---|---|---|---|
| [What Leviathan Teaches · Lesson 3](../leviathan_komutlari/what_leviathan_teaches.md#lesson-3--command--argument-injection-system) | **CWE-78** | Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection') | 📖 leviathan2 |
| [What Leviathan Teaches · Lesson 5](../leviathan_komutlari/what_leviathan_teaches.md#lesson-5--symbolic-link-attack--insecure-tmp) | **CWE-59** | Improper Link Resolution Before File Access ('Link Following') | 📖 leviathan5 |
| Same lesson + [binary_exploitation/07](../binary_exploitation/07_sembolik_link.md#what-is-a-toctou-vulnerability) | **CWE-367** | Time-of-check Time-of-use (TOCTOU) Race Condition | 📖 briefly in Leviathan, in detail in 07 *(07 does not name the number)* |

---

## Not Yet Mapped

The lessons in the **Web Security** and **Binary Exploitation** series map onto CWEs
just as directly: command injection, SQL injection, format string, path traversal
and so on. That mapping has not been done yet; it will be added to this page as it
is.

---

## 🔗 Related Topics

- [08.5_sayac_basa_donunce.md](../salterden_bilgisayara/08.5_sayac_basa_donunce.md) — The math of overflow: `ℤ/2ⁿℤ`, the error set, deriving the correct check
- [CWE-680](./cwe_680.md#there-are-two-boxes-here) — Why 680 is a wire and not an event: the two-box model
- [KONU_ANLATIMLARI.md](../KONU_ANLATIMLARI.md) — The full topic index

---

*Numbers and official names are taken from MITRE's CWE list: [cwe.mitre.org](https://cwe.mitre.org).*
