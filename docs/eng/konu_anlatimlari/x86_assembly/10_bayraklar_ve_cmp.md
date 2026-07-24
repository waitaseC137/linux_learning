# 🚩 x86 Assembly — Flags and `cmp`: How the Worker Prepares a Decision

> At the end of 09 we made a small promise: while the worker does `add`/`sub` it keeps notes on the side — *"did the result come out zero? was it negative?"* — and these notes are called **flags**; we said "the foundation of every decision is in 10." Here we are, in 10.
> But careful: this lesson does not *make* the decision. The decision will be made by the next lesson (11, the jumps). Here we build the **raw material** of the decision — because before the machine can decide on something, it has to *note* it down somewhere. That notebook is the flags.

> **This lesson has code, and we run all of it.** Every program and every GDB output below is real: I compiled and ran them on my own machine, and the `eflags` lines you see are not made up.

---

## 📋 Table of Contents

- [What Is a Flag? The Worker's Margin Note](#what-is-a-flag-the-workers-margin-note)
- [`cmp`: Compare Without Destroying the Value](#cmp-compare-without-destroying-the-value)
- [Three Cases: Equal, Greater, Less](#three-cases-equal-greater-less)
- [A Common Shortcut: `test eax, eax`](#a-common-shortcut-test-eax-eax)
- [A Flag Alone Does Nothing](#a-flag-alone-does-nothing)

---

## What Is a Flag? The Worker's Margin Note

In 09 you had a calculation done: `add eax, 3`. As the worker did it, even if you didn't ask, it put a few marks into a tiny notebook on the side:

- *"Did this operation's result come out to exactly **zero**?"*
- *"Is the result **negative** (is the top bit 1)?"*
- *"Did the number overflow, was there a carry?"*

Each of these marks is a single **bit** — either on (1) or off (0). Their name is **flag**. After every `add`/`sub`/`cmp` the worker updates these flags **automatically**; you don't have to give an extra order, when the job is done it writes into the notebook on its own.

All the flags sit side by side in a single special register: **`eflags`**. In 04.5 we saw that a register is "the same bits, a different window"; `eflags` is a register too, but each bit inside it has a **separate meaning** — one is "zero?", one is "negative?", and so on.

Right now only **two** of them concern us:

| Flag | Abbreviation | What it says | When it becomes 1 |
|:---:|:---:|---|---|
| Zero flag | **ZF** (*Zero Flag*) | "Is the result zero?" | When the result comes out exactly **0** |
| Sign flag | **SF** (*Sign Flag*) | "Is the result negative?" | When the top bit of the result is **1** (that is, negative) |

> 🔑 A **flag** = a single bit in the `eflags` register; the margin note the worker keeps about the result of a calculation. **ZF** = "the result was zero", **SF** = "the result was negative". `add`/`sub`/`cmp` update these on their own.

---

## `cmp`: Compare Without Destroying the Value

The first step of making a decision is to **compare**: "are these two numbers equal? which is bigger?" So how do you compare two numbers? With a familiar trick: **subtract** one from the other and look at the result.

- If the difference is **zero** → they are equal.
- If the difference is **negative** → the first one is smaller.

But there's a problem. If you do `sub eax, ebx`, eax's **old value is destroyed** — you wrote the result over it. But usually you want to use the number you compared *afterwards* too; you don't want to throw it in the trash just to take a look.

This is exactly what `cmp` (from *compare*) is for: **it does the subtraction, but doesn't write the result anywhere — it only sets the flags.**

```nasm
cmp eax, ebx        ; internally computes eax - ebx, DISCARDS THE RESULT, only sets ZF/SF
```

So `cmp` is `sub`'s "value-preserving" sibling: it does the same subtraction, but the only trace it leaves is the **flags**. Let's prove it. `esit.asm` — let's compare two equal numbers:

```nasm
section .text
    global _start

_start:
    mov eax, 7
    mov ebx, 7
    cmp eax, ebx        ; 7 - 7 = 0  → ZF should turn on
    mov eax, 1
    mov ebx, 0
    int 0x80
```

Assemble, run (with the 07 habit, we'll look in GDB):

```
nasm -f elf32 esit.asm -o esit.o
ld -m elf_i386 esit.o -o esit
```

Let's run `cmp` and look at both the flags and eax/ebx:

```
gdb ./esit
(gdb) set disassembly-flavor intel
(gdb) starti
(gdb) si            # mov eax, 7
(gdb) si            # mov ebx, 7
(gdb) si            # cmp eax, ebx
(gdb) info registers eflags
(gdb) info registers eax ebx
```

Real output:

```
eflags         0x246               [ PF ZF IF ]
eax            0x7                 7
ebx            0x7                 7
```

Notice two things at once:

1. **`ZF` is there** — inside the square brackets. Because `7 - 7 = 0`, the worker jotted down the "result is zero" note. The flag turned on.
2. **eax is still 7, ebx is still 7.** `cmp` compared the numbers but **broke neither of them.** You compared without destroying the value — that's the whole talent of `cmp`.

If you'd written `sub eax, ebx` to compare, ZF would still turn on, **but** eax would become `0` — you'd lose the 7. If you tried the same program with `sub` instead of `cmp`, you'd see eax as `0` in GDB. `cmp` = "subtract but don't touch the value."

> 🔑 `cmp a, b` internally does `a - b` but **writes the result nowhere** — it only sets the flags (ZF/SF). It's `sub`'s value-preserving sibling: the number you compared stays in place. This is the standard way to compare.

> 💡 **You might be wondering:** *"the eflags output also has `PF` and `IF` — what are those?"* GDB shows **all** of the flags that are on in `eflags`; not all of them are ours. `IF` (interrupt flag) is on almost all the time, it's about the operating system, it doesn't concern you. `PF` (parity) is also off-topic for now. In this lesson, follow only **ZF** and **SF**; ignore the rest. (Remember 00's promise: there's no hidden business here — only "not needed for now.")

---

## Three Cases: Equal, Greater, Less

A comparison has three possible outcomes: equal, the first is greater, the first is smaller. We'll distinguish all three with the same `cmp` — the only difference being which flags turn on. Let's run all three programs and look at `eflags` (all of them are identical to the `esit.asm` skeleton above, only the numbers change).

**Equal** — `cmp 7, 7` (the `esit` above):

```
eflags         0x246               [ PF ZF IF ]     → ZF on
```

**First is greater** — `buyuk.asm`, `cmp 9, 4` (difference `+5`, positive):

```
eflags         0x206               [ PF IF ]        → neither ZF nor SF
```

**First is smaller** — `kucuk.asm`, `cmp 4, 9` (difference `-5`, negative):

```
eflags         0x293               [ CF AF SF IF ]  → SF on
```

Let's put it in a table — this is the core of the decision logic:

| Comparison | Internal difference | ZF | SF | What it means |
|---|:---:|:---:|:---:|---|
| `cmp 7, 7` | 0 | **1** | 0 | **equal** (difference zero) |
| `cmp 9, 4` | +5 | 0 | 0 | first is **greater** (difference positive) |
| `cmp 4, 9` | −5 | 0 | **1** | first is **smaller** (difference negative) |

It reads very simply:

- If **ZF = 1**, the two numbers are **equal** (because the difference is zero).
- If **ZF = 0, SF = 1**, the first number is **smaller** (the difference dropped below zero. Negative numbers like `0xFFFFFFFD` from 09 always start with the leftmost bit; in two's complement the **top bit = the "is it negative" mark** — and SF simply copies that bit).
- If **ZF = 0, SF = 0**, the first number is **greater** (the difference is positive, not zero).

This is how the worker "remembers" the "which is bigger" question: it doesn't actually remember — it just leaves two bits, and you (or rather, the next instruction) look at those two bits and read the decision.

> 💡 **You might be wondering:** *"in `cmp 4, 9`, `CF` and `AF` also turned on — do I have to read those too?"* No, not for now. Also, an honest warning: the rule "if SF is on, the first is smaller" works cleanly here, but for **very large** numbers (in the edge cases where overflow gets involved) SF alone can mislead you. Good news: you'll **never** have to work out this subtlety by hand — instructions like `jl` ("jump if less") and `jg` ("jump if greater"), which you'll meet in lesson 11, know the correct flag combination *themselves*. So you won't compute the "which is bigger" decision flag by flag; `cmp` sets it, the jump instruction reads it correctly. For now it's enough that you see the picture.

---

## A Common Shortcut: `test eax, eax`

There's one comparison you need very, very often: *"is this register zero?"* (Did a counter finish, is a result empty, is a flag value 0...) You could do it with `cmp eax, 0` — but in assembly almost everyone writes this instead:

```nasm
test eax, eax       ; "is eax zero?" → if zero, ZF=1
```

`test`, like `cmp`, is an instruction that "discards the result and only sets flags." When `test eax, eax` is used, its practical result is one sentence: **if eax is zero, ZF turns on, otherwise it stays off.** (By the way: `test eax, eax` actually sets SF too — if eax is negative, SF=1 — but in this "is it zero" shortcut we only look at ZF.) Let's see it with two programs.

`testsifir.asm` (eax = 0):

```nasm
section .text
    global _start

_start:
    mov eax, 0
    test eax, eax       ; is eax zero? → ZF=1
    mov eax, 1
    mov ebx, 0
    int 0x80
```

`testdolu.asm` — the only difference is `mov eax, 42`. In both, `eflags` after `test`:

```
testsifir  (eax=0)   →  eflags  [ PF ZF IF ]   → ZF ON    (eax was zero)
testdolu   (eax=42)  →  eflags  [ IF ]          → no ZF    (eax was non-empty)
```

This is the standard form of the "is it zero?" test: `test eax, eax` → look at ZF. You'll see this all over the place in loop counters and "is it empty or full" checks.

> 💡 **You might be wondering:** *"what does `test` do internally, exactly? Why do we write `eax, eax` twice?"* The operation inside `test` is a **bit operation** (`and`) and we haven't seen it yet — so I'll leave the mechanism as a closed box for now: **we'll open it fully in lesson 13 (`and`/`or`/`xor`).** The only thing you need in this lesson is its function: `test eax, eax` asks "is eax zero" and puts the answer in ZF. (Why this instead of `cmp eax, 0`? Because it's shorter/faster — but the reason belongs to 13.)

---

## A Flag Alone Does Nothing

Let's be honest: the programs in this lesson actually **did nothing.** We compared, flags turned on — but then what? The program just flowed straight down again and exited. A flag turning on, on its own, did **not** change the program's behavior.

And that's exactly what's expected. Because a flag is not the decision **itself**, it's the decision's **raw material**. Think of the chain like this:

```
   cmp / test   →   SETS the flag   (this lesson: 10)
        ↓
   jz / jnz / jl / jg   →   READS the flag and JUMPS somewhere accordingly   (next lesson: 11)
```

Up to now we've always told the worker "advance in order, line by line" — the program is a single path from top to bottom. In the next lesson, for the first time, we'll **break** that straight path: "if ZF is on jump over there, otherwise keep going from here." That moment — the program branching onto **different paths** depending on whether a flag is on or off — is the very thing we call a computer "making a decision." And without the flags you set today, that decision is impossible.

> 🔑 `cmp`/`test` **set**, the jump instructions **read.** A flag is the bridge that carries the "was it equal / was it greater" information from one instruction to the next. On its own it doesn't change the program; the jumps in 11 bring it to life. That's why there's no 11 without 10.

---

## Summary — Keep in Mind

```
☐ FLAG = a single bit in the eflags register; the worker's margin note about the result of a calculation.
    add / sub / cmp / test update these ON THEIR OWN.
☐ Two flags matter in this lesson:
    - ZF (Zero Flag)  → 1 when the result is EXACTLY ZERO.  "equal? / zero?"
    - SF (Sign Flag)  → 1 when the result is NEGATIVE (top bit 1).  "negative?" (09's two's complement)
☐ cmp a, b = internally does a - b, DISCARDS THE RESULT, only sets the flags.
    - sub's value-preserving sibling: the number you compared is not corrupted (after cmp 7,7 eax is still 7).
☐ Three cases (cmp a, b):
    - ZF=1            → a == b   (equal)
    - ZF=0, SF=0      → a  > b   (first is greater)
    - ZF=0, SF=1      → a  < b   (first is smaller)   [the subtlety for very large numbers is 11's jl/jg's job]
☐ test eax, eax = the "is eax zero?" shortcut → if zero, ZF=1. (The mechanism inside: and, in 13.)
☐ GDB: info registers eflags → shows the on flags as [ ... ZF ... SF ... ].
    IF/PF/CF/AF may also appear; for now follow ONLY ZF and SF.
☐ A flag alone doesn't change the program: cmp/test SET → the jump instructions in 11 READ and decide.
```

---

## 🔗 Related Topics

- [09_aritmetik.md](./09_aritmetik.md) — this is where we promised that `add`/`sub` "keep a note on the side" (the flag) and two's complement (SF's "negative" meaning); here are those notes
- [04.5_registerin_ici.md](./04.5_registerin_ici.md) — `eflags` is a register too; another face of the "same bits, different meanings" idea
- [01.5_sayi_ve_anlam.md](./01.5_sayi_ve_anlam.md) — A single bit means nothing on its own; the instruction that uses it (ZF = "was zero") gives it meaning
- [07_gdb_tek_adim.md](./07_gdb_tek_adim.md) — watching live, with `si` + `info registers`, how an instruction changes the flags

---

**Previous topic:** [09_aritmetik.md](./09_aritmetik.md)
**Next topic:** [11_ziplamalar.md](./11_ziplamalar.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
