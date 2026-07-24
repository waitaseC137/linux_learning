# ➕ From Switches to a Computer — Half Adder: The First Adder

> If you dig down to the bottom of everything a processor does, you always reach the same thing: **addition.**
> Subtraction is addition with a negative number; multiplication is repeated addition; the health in
> a game, the tick of a counter, an address calculation in memory — all of it is addition. In this lesson you'll build
> the deepest cell of that giant pyramid: **the circuit that adds two bits.** And you'll see
> that you've been carrying the pieces in your pocket all along.

---

## 📋 Table of Contents

- [Task: How Much Is 1 + 1?](#task-how-much-is-1--1)
- [Why Isn't One Output Enough?](#why-isnt-one-output-enough)
- [Build the Table, Spot the Familiar Faces](#build-the-table-spot-the-familiar-faces)
- [The Circuit: Two Old Friends, Side by Side](#the-circuit-two-old-friends-side-by-side)
- [Why a "HALF" Adder?](#why-a-half-adder)
- [🎮 Now Build It Yourself](#-now-build-it-yourself)

---

## Task: How Much Is 1 + 1?

The box we want to build looks simple: two inputs (`a`, `b`), each a single bit.
Let the box add them **as numbers.**

There are only four possibilities in total:

```
   0 + 0 = 0        0 + 1 = 1        1 + 0 = 1        1 + 1 = ... 2
```

And while the first three are trouble-free, in the fourth things get interesting: **2.** From the last lesson
you know — on a single wire there's no such thing as "2". In binary, 2 is written `10`: *one
2, zero 1s.*

---

## Why Isn't One Output Enough?

This is exactly why our adder is forced to have **two output wires:**

- **l** (low) → **the 1s wire:** the ones digit of the sum.
- **h** (high) → **the 2s wire:** the twos digit of the sum.

To put it in the language you learned in school: `l` = "**write down**", `h` = "**carry**". In 7+5=12, when you say
"write 2, carry 1" you're doing exactly the same thing — it's just that our digit doesn't fill up at 9,
it fills up at 1: 1+1 = "write 0, carry 1" = `10`.

> 🔑 Always read the output with the formula from 04: **sum = 2·h + l.** The two wires aren't two separate
> answers; they are **the two digits of a single number.**

---

## Build the Table, Spot the Familiar Faces

Write the four possibilities one under another, ask only "how much did it come to?" on each row, and write the result
as `h l`:

| a | b | a+b | h (2s) | l (1s) |
|---|---|:---:|:---:|:---:|
| 0 | 0 | 0 | 0 | 0 |
| 0 | 1 | 1 | 0 | 1 |
| 1 | 0 | 1 | 0 | 1 |
| 1 | 1 | **2** | **1** | **0** |

Now look at the columns **one by one.** One of the sweetest surprises of this series is waiting for you:

- **The l column:** `0, 1, 1, 0`... You've seen this before. 1 if they differ, 0 if they're the same —
  **this is the table of XOR.** The "trailer" at the end of lesson 03 came true: this turns out to be XOR's secret
  identity — *the ones digit of addition.*
- **The h column:** `0, 0, 0, 1` — 1 only when both are 1... **this is AND.** Makes sense:
  a carry is born only if *two* 1s come together; the gate that asks the "both of them?" question was already AND.

> 💡 We didn't invent any new gate. Addition — the computer's most fundamental ability —
> turns out to be two of your old acquaintances (XOR and AND) **looking at the same question from two angles**:
> XOR asks "what do the ones say?", AND asks "did a pair form?".

---

## The Circuit: Two Old Friends, Side by Side

The design wrote itself. Fork `a` and `b`; give one copy to XOR, one copy to
AND:

```
   a ──┬──────────► [ XOR ] ──────► l   (write / ones digit)
       │
   b ──┴──────────► [ AND ] ──────► h   (carry / twos digit)
```

The two gates are **side by side**, at the same time, looking at the same inputs — one producing the lower
digit of the sum, the other the upper digit. The name of this box is **half adder**.

---

## Why a "HALF" Adder?

Calling a box that does a perfectly good job "half" seems unfair. It isn't — the box has
a real shortcoming, and that shortcoming is the very reason the next lesson exists.

Do a multi-digit addition on paper: 27 + 35. The right digit: 7+5=12, "write 2, carry 1".
Now look at the **middle digit**: 2 + 3 + **1 (carry)** — the middle digit is adding **three things**!
Every digit has to take into account the carry coming from its right neighbor.

The half adder, however, has only **two inputs.** It has no third mouth to take in an incoming carry.
So on its own it can only do the job **in the rightmost digit** — it can be the first link of the chain,
but not a middle one.

> 🔑 **Half adder = an adder that CAN PRODUCE a carry but CANNOT ACCEPT one.** That's what its "half"-ness
> is. You'll build the "full" version that can accept a carry — the full adder — in the next lesson,
> and you'll do it using this very box you built today as a part.

---

## 🎮 Now Build It Yourself

**Task:** NandGame → **Arithmetics** section → **Half Adder** level.

This time you know almost everything; when you see the target table in the game, you'll recognize it.
Build it, then try the four combinations by hand and each time read it off in your head: *"how many apples
did I count → with which tokens did I pay?"*

<details>
<summary>🔒 The logic of the solution — try it yourself first, then open</summary>

Fork `a` and `b` and give them to **both XOR and AND**. XOR's output → `l`,
AND's output → `h`. Two gates, four wires — you've planted the seed of computer arithmetic.

</details>

---

## Summary — Keep in Mind

```
☐ At the bottom of everything a computer does there's always addition; its smallest cell is this box.
☐ 1+1 = 2 = `10` in binary → even a single column needs TWO outputs: l (write) + h (carry).
☐ Reading: sum = 2·h + l. Two wires = the two digits of a single number.
☐ The l column = XOR (its secret identity: the ones digit of addition).
☐ The h column = AND (a carry is born only from two 1s).
☐ The reason for its "half"-ness: it PRODUCES a carry but CANNOT ACCEPT one → it can only be the rightmost digit.
```

---

## 🔗 Related Topics

- [04_teller_sayi_olunca.md](./04_teller_sayi_olunca.md) — where the `2·h + l` formula comes from
- [03_xor_iki_fedai.md](./03_xor_iki_fedai.md) — the construction of XOR and the "secret identity" trailer
- [06_full_adder.md](./06_full_adder.md) — completing the missing mouth: the adder that accepts a carry

---

**Previous topic:** [04_teller_sayi_olunca.md](./04_teller_sayi_olunca.md)
**Next topic:** [06_full_adder.md](./06_full_adder.md)

*This lesson is part of the "From Switches to a Computer" series. The series moves along in the company of [nandgame.com](https://nandgame.com).*
