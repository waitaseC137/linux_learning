# 🧱 From Switches to a Computer — All the Gates from a Single Brick

> Last lesson we said "NAND is universal, everything derives from it." Claims like this
> shouldn't stay just words. In this lesson **you** will prove the claim: using only NAND,
> you'll build the NOT, AND and OR gates. When the lesson ends you'll hold a
> four-word language — and we'll never go back to relays again.

> **From this lesson on, NAND is a closed box for you.** We're done with the relays
> inside it; from now on NAND has only a **table**. This forgetting is deliberate — we'll
> talk about exactly why in 03.5.

---

## 📋 Table of Contents

- [What We Have: The Closed-Box NAND](#what-we-have-the-closed-box-nand)
- [NOT (invert): Wiring It to a Mirror](#not-invert-wiring-it-to-a-mirror)
- [AND: The Inverse of the Inverse](#and-the-inverse-of-the-inverse)
- [OR: Entering Through the Inverted Gate](#or-entering-through-the-inverted-gate)
- [A Four-Word Language](#a-four-word-language)
- [🎮 Now Build It Yourself](#-now-build-it-yourself)

---

## What We Have: The Closed-Box NAND

From now on we'll draw NAND like this — no insides, just its behavior:

```
          ┌────────┐
   a ─────┤        │
          │  NAND  ├───── output        0 only when a=b=1, else 1
   b ─────┤        │
          └────────┘
```

NandGame does the same: the moment you clear the Nand level, a ready-made part called
**nand** appears in the box of the later levels. That part is the circuit you built —
its boxed-up form.

Our task: derive three gates using only this box. No tricks, no other parts.

---

## NOT (invert): Wiring It to a Mirror

The simplest gate is **NOT**: it has a single input and inverts it.

| x | output |
|---|:---:|
| 0 | **1** |
| 1 | **0** |

What we have, though, is a two-input NAND. How do you make something with a single input
out of a two-input part?

Look at NAND's table and read only the rows where **both inputs are the same**:

| a | b | NAND |
|---|---|:---:|
| **0** | **0** | 1 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| **1** | **1** | 0 |

`0,0 → 1` and `1,1 → 0`. So when the inputs are always the same, NAND behaves exactly
like an **inverter**. In that case the solution is: **wire the same wire to both inputs of
the NAND.**

```
          ┌────────┐
   x ──┬──┤        │
       │  │  NAND  ├───── inverse of x
       └──┤        │
          └────────┘
```

> 💡 This little trick is the first "derivation" in the series, and it sums up the method
> nicely: we didn't invent a new gate — we **forced** the part we had into the rows of its
> table that serve our purpose. Circuit design is mostly this.

---

## AND: The Inverse of the Inverse

The **AND** gate is just what its name says: 1 if both inputs are 1, otherwise 0.

| a | b | AND |
|---|---|:---:|
| 0 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | **1** |

Now place this table side by side with NAND's... did you notice? **It's the exact opposite,
row by row.** NAND already meant "AND-not"; so:

> **AND = invert NAND's output.** And we just built the inverter.

NAND + NOT (made from NAND) = AND. Two boxes, done.

---

## OR: Entering Through the Inverted Gate

**OR**: 1 if **at least one** of the inputs is 1.

| a | b | OR |
|---|---|:---:|
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 1 |

This time the job looks hard at first: NAND's table doesn't much resemble OR's. But when you
think in the guard's language, a way opens up. Compare the two sentences:

- OR: *"let at least one of them **have come**."*
- NAND: *"don't let both of them **be**."*

Now build the OR sentence backwards: "let at least one have come" = **"don't let both of
them have NOT come."** Do you see the double negative in it? "Not come" (the inverse of the
inputs) + "don't let be" (NAND). So:

> **OR = invert BOTH inputs, then feed them into NAND.**

Verify (for a=0, b=1): the inverses are 1 and 0 → NAND(1,0) = 1 ✓. (a=0, b=0): the inverses
are 1,1 → NAND = 0 ✓. All four rows hold — build it and see.

> 💡 With your own hands you just discovered a famous rule from the history of logic:
> **De Morgan's law** — "OR is the inverse of the AND of the inverses." Books give it as a
> formula; you found it with the guard's sentence. They're the same thing, but yours is
> yours.

---

## A Four-Word Language

Look at your inventory — yesterday it was zero, today you have four gates:

| Gate | Its sentence | How it's built (all from NAND) |
|---|---|---|
| **NAND** | "don't let both be" | 2 relays *(lesson 01)* |
| **NOT** | "the inverse" | NAND with its inputs joined |
| **AND** | "both" | NAND + NOT |
| **OR** | "at least one" | NAND with its inputs inverted |

> 🔑 Notice: the table has no relay column, because we no longer need one. **Everything is
> in terms of NAND** — and what's inside NAND (a relay, a transistor, some entirely
> different technology) is of no concern to this table. Even if the lower layer changes,
> these four words stay valid. This is exactly the power of the concept of a "layer."

---

## 🎮 Now Build It Yourself

**Task:** the next three levels in NandGame: **Invert → And → Or.**

The lesson has already shown the way; still, verify your table yourself as you build: at
each level, change the input buttons by hand and watch the output. The confirmation of
"Check solution" and seeing it with your own eyes are two different things — the second one
teaches.

<details>
<summary>🔒 How all three are built, at a glance — try it yourself first, then open</summary>

- **Invert:** wire `x` to **both inputs** of the NAND.
- **And:** feed `a,b` into NAND; run NAND's output through an **invert**.
- **Or:** run `a` through one invert and `b` through a separate invert; feed the two
  inverses into **NAND**.

(The game puts the part you built in the previous level into the box of the next level — you
can use invert as a ready-made part in And and Or.)

</details>

---

## Summary — Keep in Mind

```
☐ NAND is now a closed box: no insides, just a table. We're done with relays.
☐ NOT  = give the same wire to both NAND inputs ("wiring it to a mirror").
☐ AND  = NAND + invert (NAND already meant "AND-not").
☐ OR   = invert the inputs, then NAND ("don't let both have NOT come").
☐ Along this path you discovered De Morgan's law by yourself.
☐ The method is called derivation: don't invent new parts, force the one you have into its table.
```

---

## 🔗 Related Topics

- [01_akim_salter_role.md](./01_akim_salter_role.md) — What was inside NAND: relays
- [03_xor_iki_fedai.md](./03_xor_iki_fedai.md) — The next gate: XOR, the difference detector
- [03.5_soyutlama_merdiveni.md](./03.5_soyutlama_merdiveni.md) — Why the "closed box" idea matters so much

---

**Previous topic:** [01_akim_salter_role.md](./01_akim_salter_role.md)
**Next topic:** [03_xor_iki_fedai.md](./03_xor_iki_fedai.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
