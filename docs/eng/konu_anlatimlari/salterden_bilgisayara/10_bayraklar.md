# 🔗 From Switches to a Computer — Flags: How a Machine Says "If"

> Everything you've built in this series so far **computed**: it added, incremented,
> subtracted. All of it took numbers and gave back numbers.
>
> The two circuits you'll build in this lesson don't produce a number. They **ask a
> question** and give a one-bit answer: yes or no. A processor's ability to say `if` starts
> exactly here.

> We take the two levels together because both produce the same thing: a **flag.** One
> reports zero-ness, the other negativeness. These two wires sit underneath every `if` and
> every `while` on your computer.

---

## 📋 Table of Contents

- [From Computing to Deciding](#from-computing-to-deciding)
- [Flip the "All Zero" Question Around](#flip-the-all-zero-question-around)
- [Tree or Chain?](#tree-or-chain)
- [The Zero Flag (ZF)](#the-zero-flag-zf)
- [Sign: You Don't Even Need a Circuit](#sign-you-dont-even-need-a-circuit)
- [Why Is the Sign Bit Number 15?](#why-is-the-sign-bit-number-15)
- [The Whole of Comparison](#the-whole-of-comparison)
- [🎮 Now You Build It](#-now-you-build-it)
- [Closing: The Two Ends of the Ladder Meet](#closing-the-two-ends-of-the-ladder-meet)

---

## From Computing to Deciding

See the difference between a computing circuit and a **detector**:

| | its input | its output | what it does |
|---|---|---|---|
| adder | two numbers | one number | **computes** |
| detector | one number | **a single bit** | **decides** |

A detector's output is called a **flag**: raised means a condition holds, lowered means it
doesn't.

Your first task is this: 4 bits go in, one bit comes out.

```
   all 0            →  output 1
   anything else    →  output 0
```

**Only one** of the 16 possibilities gives a 1. So the circuit is looking for a single
pattern.

---

## Flip the "All Zero" Question Around

The first reflex is to go looking for an "are they all 0?" gate. There is no such gate —
what you have works in pairs, and knows nothing about "all four at once".

So flip the question:

```
"every bit is 0"     ≡     "no bit is 1"
```

The two sentences say the same thing. But hidden inside the second one is a question you
*can* build:

> 🔑 **"Is at least one bit a 1?"** — the gate that answers this question is called **OR.**

And once you have the answer you want the exact opposite of it, because "at least one is 1"
and "none is 1" are each other's negation. So you put an `inv` on the end.

> 💡 The combination `OR` + `inv` is already a gate of its own: **NOR.** You just built a
> 4-input NOR. One more member of the family you met in lesson 02 while deriving gates from
> NAND.

**This is the general pattern:** if a question is hard to build directly, build its
**opposite** and invert the result. It's the single most useful trick in circuit design.

---

## Tree or Chain?

OR works in pairs and you have four bits. Three ORs are needed — but **how will you arrange
them?** There are two valid shapes and both give the right answer:

```
        TREE                          CHAIN

   b3 b2   b1 b0                 b3 b2
    └OR┘    └OR┘                  └OR┘ b1
      └──OR──┘                      └OR┘ b0
         │                             └OR┘
        inv                              │
                                        inv

  3 gates deep                  4 gates deep
```

The result is the same. The difference is in how many gates the signal passes through.

Every gate has a small delay (when an input changes, the output takes time to settle) and
those delays **stack up.** At four bits the difference is negligible. But:

| bit count | tree depth | chain depth |
|:-:|:-:|:-:|
| 4 | 3 | 4 |
| 16 | 5 | 16 |
| 64 | 7 | 64 |

The tree grows **logarithmically**, the chain **linearly.** In real processors this choice
directly determines the clock speed.

> ⚠️ Don't confuse this with the ripple-carry from lesson 07. There the chain was
> **mandatory**: every digit had to wait for its right neighbour's carry. Here there's no
> such dependency — all the bits are ready at the same time, none of them waits for another.
>
> 🔑 **A mandatory chain and a chain built out of habit are different things.** If you see a
> sequence in a circuit, ask: is this really a dependency, or was it just laid out that way?

---

## The Zero Flag (ZF)

The wire you built has a real name: the **zero flag**, `ZF` for short.

On x86 the `jz` / `jnz` instructions (jump if zero / not zero) look at exactly this bit.
Every `if (x == 0)` you've ever written passes through this wire.

And the best part surfaces when you combine it with lesson 09:

> 🔑 **There is no separate circuit for equality.** The machine answers the question
> `a == b` like this: compute `a − b`, then ask **is the result zero?**

Subtractor + zero detector = comparison. The product of two lessons.

---

## Sign: You Don't Even Need a Circuit

The second task: *"is this 16-bit number negative?"*

Don't go looking for a gate. The answer is already sitting there waiting.

You saw it in lesson 09: in two's complement the patterns split exactly down the middle.
Whether a number is negative is determined **by looking at the leftmost bit.**

So the entire level is a single wire: open up the 16-bundle and connect **bit 15** to the
output.

> 💡 This is the power of a good representation. If we had represented negative numbers some
> other way (a separate "sign digit" plus a magnitude, say), the negativity test would need
> a circuit of its own. Two's complement buried the job **inside the representation**, and
> what's left is a single wire.
>
> Good design takes work away from the circuit and dumps it on the representation.

---

## Why Is the Sign Bit Number 15?

First the numbering: bits are counted **right to left**, the rightmost one is `bit 0`.

```
  bit:      15    14    13   ...    2     1     0
value:   32768 16384  8192   ...    4     2     1
```

Look familiar — this is the token table from lesson 04. `bit n` = a `2ⁿ` token. `bit 15` is
the **leftmost** and most expensive token in the bundle.

Now why it's the one that announces the sign:

| pattern | bit 15 | signed value |
|---|:-:|---:|
| `0000000000000000` | 0 | 0 |
| `0111111111111111` | 0 | **+32767** ← the largest positive |
| `1000000000000000` | 1 | **−32768** ← the smallest negative |
| `1111111111111111` | 1 | −1 |

Exactly **half** of the 65536 patterns (bit 15 = 0) are zero and the positives; the other
**half** (bit 15 = 1) are the negatives.

> 🔑 Nobody sat down and said "let's make that bit the sign bit". Counting upward from 0,
> bit 15 stays off; go one step below 0 and it turns on instantly. **The sign bit is where
> the wrapping boundary passes** — not a label attached afterwards.

This wire has a name too: the **sign flag (SF).**

---

## The Whole of Comparison

Combine the two flags with the subtractor:

```
a == b   →   do a − b,  look at ZF
a <  b   →   do a − b,  look at SF
```

On x86 this is exactly these two lines:

```asm
cmp  eax, ebx      ; do eax − ebx, DON'T store the result but set the flags
je   if_equal      ; jump if ZF = 1
```

`cmp` is a `sub` that writes its result nowhere. Its only job is to set the flags.

> ⚠️ **A warning for full correctness:** in the `a < b` test, looking only at SF is not
> always enough, because **the subtraction itself can overflow.** Example: `a = −32768`,
> `b = 1`. The true result is `−32769`, which doesn't fit in 16 bits, so it wraps to
> `+32767` — sign bit 0. A circuit that looks at SF says "a isn't smaller", when it is.
>
> This is why real processors keep one more flag, the **overflow flag (OF)**, and in signed
> comparison they check the condition `SF ≠ OF`. You're laying the foundation in this
> lesson; the overflow flag arrives in the ALU lesson.

---

## 🎮 Now You Build It

**Two levels:**

**1. Equal to Zero** — 4 bits go in; give 1 if they're all 0.

<details>
<summary>🔒 Solution schematic — try it yourself first, then open</summary>

1. `OR₁`: inputs `b3`, `b2`
2. `OR₂`: inputs `b1`, `b0`
3. `OR₃`: inputs are `OR₁`'s and `OR₂`'s outputs → *"at least one is 1"*
4. `inv`: invert `OR₃`'s output → **the output**

Arrange it as a tree, not a chain — same result, one gate shallower.

</details>

**2. Less than Zero** — 16 bits go in; give 1 if it's negative.

<details>
<summary>🔒 Solution schematic — try it yourself first, then open</summary>

1. Wire the input to the **16-bit splitter**.
2. Connect the **`bit 15`** pin straight to the output.

That's all. No gates. The difficulty isn't in the circuit, it's in **knowing why it's bit
15.**

</details>

---

## Closing: The Two Ends of the Ladder Meet

This series has a sibling: [x86 Assembly](../x86_assembly/00_buradan_basla.md). Over there,
lesson 10 is titled **"Flags & cmp"** and covers `ZF`, `SF`, `cmp` and `test`.

While reading that lesson the flags were things **handed to you**: mysterious bits sitting
somewhere in the processor that instructions set.

Today you built them **yourself.** ZF is the output of four ORs and an inv. SF is a single
wire pulled out of a bundle.

```
   x86 lessons 00–20           ← the TOP end of the ladder
        ▲
        │   ... the narrowing gap
        ▼
   Flags (this lesson)         ← the BOTTOM end of the ladder
   Subtraction · Increment
   Multi-bit Adder · Full Adder
   NAND · Relay · Switch
```

We've been weaving the ladder from above and we're weaving it from below. This lesson is
where the two ends touch **the same concept** for the first time.

What's left in the gap? Gathering all these operations into a single box and letting
something outside choose "which one to do" — that is, the **ALU.** That's the next stop.

---

## Summary — Keep in Mind

```
☐ A flag = a one-bit answer. A computing circuit gives a number, a detector DECIDES.
☐ Turn a hard-to-build question into its OPPOSITE and flip the result with inv. (best trick)
☐ "all 0" ≡ "none is 1" → an OR tree + inv = NOR = ZF
☐ Tree depth is logarithmic, chain depth linear. At 64 bits it's 7 versus 64.
☐ A mandatory chain (ripple-carry) and a chain built out of habit are not the same thing.
☐ There is NO equality circuit: do a − b and look at ZF.
☐ The negativity test is one wire: bit 15. No gate needed.
☐ The sign bit wasn't added afterwards — it's where the wrapping boundary passes.
☐ Good design takes work off the circuit and puts it on the REPRESENTATION (two's complement).
☐ SF alone isn't enough for a < b; if the subtraction overflows it misleads → you need OF (ALU lesson).
```

---

## 🔗 Related Topics

- [09_subtraction.md](./09_subtraction.md) — The circuit that produces the result the flags look at
- [02_nanddan_kapilar.md](./02_nanddan_kapilar.md) — NOR and the family of gates
- [04_teller_sayi_olunca.md](./04_teller_sayi_olunca.md) — Bit numbers and token values
- [../x86_assembly/10_bayraklar_ve_cmp.md](../x86_assembly/10_bayraklar_ve_cmp.md) — **The same flags, from the software side**

---

**Previous topic:** [09_subtraction.md](./09_subtraction.md)
**Next topic:** *(on the way — the ALU: every operation in one box)*

*This lesson is part of the "From Switches to a Computer" series. The series moves along together with [nandgame.com](https://nandgame.com).*
