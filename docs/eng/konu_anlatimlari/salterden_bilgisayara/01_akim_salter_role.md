# ⚡ From Switches to a Computer — Current, the Switch, and the First Gate: NAND

> The computer's alphabet has two letters: **present** and **absent.**
> In this lesson you'll see what those two letters physically are, you'll meet the
> part that lets electricity manage itself (the relay), and you'll build the gate
> that gives the series its name — NAND — with your own hands.

> **This lesson is the foundation of the series.** If the single idea here ("electricity
> can manage electricity") settles in, the rest of the series is just a repetition of
> that idea. Don't rush.

---

## 📋 Table of Contents

- [What Are 1 and 0, Really?](#what-are-1-and-0-really)
- [The Switch: The Part That Decides on Current](#the-switch-the-part-that-decides-on-current)
- [The Relay: A Switch Whose Own Lever Is Pushed by Electricity](#the-relay-a-switch-whose-own-lever-is-pushed-by-electricity)
- [The Relay's Two Temperaments: Normally Passing, Normally Cutting](#the-relays-two-temperaments-normally-passing-normally-cutting)
- [The Transistor: The Relay's Grandchild](#the-transistor-the-relays-grandchild)
- [First Task: The NAND Gate](#first-task-the-nand-gate)
- [Why Is the First Gate NAND?](#why-is-the-first-gate-nand)
- [🎮 Now You Build It](#-now-you-build-it)

---

## What Are 1 and 0, Really?

Every explanation of computers says "ones and zeros," but most of them never say what
these things **are.** Let's say it:

> **1 = there is current in the wire. 0 = there is no current in the wire.** That's all.

Think of the light switch on your wall. Switch on → there's current in the wire → the
lamp is lit. We call this state "1." Switch off → no current → "0." In each of the
billions of wires inside a computer, at every moment, one of these two holds: either
there is current, or there isn't.

Let's pause here and underline something important:

> 🔑 **The wire doesn't know it's carrying a "1."** In the wire there is simply
> electricity, or there isn't. "This current means 1," "those three wires mean a
> number," "that number means the letter A" — these are all **meanings we assign.**
> Sand (silicon) doesn't know how to add; we give the pattern its meaning. What we do
> in this series is exactly this: dressing meaningless currents, layer by layer, in
> meaning.

---

## The Switch: The Part That Decides on Current

The simplest part that turns current on and off is the switch — the very light switch
itself:

```
   Current source ───o   o─── lamp        (lever open:   NO current → 0)

   Current source ───o───o─── lamp        (lever closed: current YES → 1)
```

The switch has just one trick: to **open or close** the path of a wire. But it has a
problem: its lever is pushed by a **finger.** You can't build a computer out of
something pushed by a finger — there's no finger that can press a button billions of
times per second.

So what if, instead of a finger... **electricity** pushed the lever?

---

## The Relay: A Switch Whose Own Lever Is Pushed by Electricity

A **relay** is a switch whose lever is pushed by an electromagnet. Inside it there are
two independent paths:

- **Coil (control input):** if you feed current here, the magnet inside works and pulls
  the switch's lever.
- **Contact (the actual path):** the path that the lever opens and closes, the one the
  actual current flows through.

```
        control current (to the coil)
              │
              ▼
         ┌───────────┐
   in ───┤ ⚡ lever  ├─── out        if the coil is full the lever is pulled,
         └───────────┘               the in→out path opens or is cut
```

It looks like an ordinary part. It isn't. Hidden here is the most important idea of
this series — and, really, of the whole history of computers:

> 💡 **Electricity is managing electricity.** The current in one wire (the coil) decides
> the fate (the contact) of the current in another wire. This means: you can connect the
> **output** of one relay to the **control input** of another relay. Decisions can be
> chained. If decisions can be chained — computation can be built. No finger needed.

---

## The Relay's Two Temperaments: Normally Passing, Normally Cutting

The relay is made in two different temperaments; both are waiting for you in NandGame's
box:

| NandGame name | Temperament | Coil **empty** (c=0) | Coil **full** (c=1) |
|---|---|---|---|
| **relay (default on)** | normally passing | **passes** `in` to the output | **cuts** the path |
| **relay (default off)** | normally cutting | output **empty** (0) | **passes** `in` to the output |

Think of two guards: one keeps the door **open** by default and closes it when the order
comes; the other keeps it **closed** by default and opens it when the order comes.

> 💡 **If you're someone who's seen an electrical panel:** these are exactly the NC
> (normally closed) and NO (normally open) contacts — "default on" = NC, "default off" =
> NO. If you've built a control circuit, you'll soon see that the computer too is born
> from the same parts. And if you've never seen one, no worries: saying "normally passing
> / normally cutting" is enough.

---

## The Transistor: The Relay's Grandchild

Real chips have no relays — because a relay's lever **physically moves,** and a moving
thing is both slow and wears out. The modern solution is the **transistor**: a part so
small it's invisible to the eye, which does the same job (one current turning another
current on and off) **with no moving parts at all.**

To feel the consequence of that size difference: the processor in the device you're
reading these lines on has **billions** of transistors, and each one can switch on and
off billions of times per second.

> 🔑 But the idea hasn't changed: **transistor = a switch whose lever is pushed by
> electricity.** Every circuit you can build with a relay can also be built with a
> transistor — it's just smaller and faster. That's why in this series we start with the
> relay with an easy conscience: whoever understands the relay has understood the
> transistor.

---

## First Task: The NAND Gate

Now we can build our first **gate.** A gate (*gate*) is a few switches joined together
to make a single **decision:** it looks at the inputs and produces a single output.

Our first gate is named **NAND** (*Not AND* in English — "AND-not"). Its rule is a single
sentence:

> **If both inputs are 1, the output is 0; in every other case the output is 1.**

Its table (you'll see exactly this table in the game too):

| a | b | output |
|---|---|:---:|
| 0 | 0 | **1** |
| 0 | 1 | **1** |
| 1 | 0 | **1** |
| 1 | 1 | **0** |

Like a grumpy guard: it always keeps the door open, but *"if the two of you came
together, you can't come in."*

---

## Why Is the First Gate NAND?

Because NAND is **universal**: using NAND alone you can build NOT, AND, OR, XOR — that
is, **all the other gates.** From gates come adders, from adders a computing unit, from
there memory and the processor... So:

> 🔑 **A single kind of brick is enough.** A chip with billions of transistors is not "a
> whole lot of different things" — it's largely **billions of repetitions of the same
> idea.** That's why the game is named NandGame: everything from here on, you'll derive
> from this first gate.

You'll do this yourself in the next lesson. First let's finish the job at hand.

---

## 🎮 Now You Build It

**Task:** [nandgame.com](https://nandgame.com) → first level: **Nand.**

The game gives you two kinds of relay (default on / default off) and also a **V** input —
"always 1," that is, a source that supplies current continuously (think of it as a wire
plugged into the outlet). The goal: build the circuit that satisfies the NAND table
above.

Two pointers before you try:

1. The single row where the inputs are **1 1** is special: only there is the output 0.
   Which temperament of relay, and connecting the inputs how, asks the question "did both
   arrive?"
2. If you need the **opposite** of the result: which temperament of relay *cuts* the path
   when a 1 reaches its coil?

<details>
<summary>🔒 The logic of the solution — try it yourself first, then open</summary>

Two relays, two jobs:

1. **The "did both arrive?" question — the default off relay.** Connect `a` to its coil
   and `b` to its input (`in`). Since this relay passes only when the coil is full, for
   there to be current at its output you need **both a=1 (coil) and b=1 (the current
   passing through).** So this relay's output = "a AND b".
2. **The negation — the default on relay.** Connect the previous relay's output to its
   coil, and `V` (always 1) to its input. When the coil is empty it passes V (output 1);
   when "a AND b" happens and the coil fills, it cuts the path (output 0).

Result: output = "**not** a AND b" = NAND. With two rusty relays, you've built the
computer's universal brick.

</details>

When you pass the level, stop and feel this: you just **made electricity make a
decision.** No finger, no human — current managed current. Everything else is a
repetition of this.

---

## Summary — Keep in Mind

```
☐ 1 = current present, 0 = current absent. Nothing else.
☐ The wire knows no meaning; WE assign the meaning to the 1/0, the number, the letter.
☐ The switch turns current on and off — but its lever needs a finger.
☐ Relay = a switch whose lever is pushed by ELECTRICITY → electricity manages electricity → decisions chain.
☐ Two temperaments: default on = normally passes (NC), default off = normally cuts (NO).
☐ Transistor = the relay's motionless, tiny, billions-of-times-fast grandchild. Same idea.
☐ NAND: only "1 1" gives 0, the rest give 1. The universal brick — everything will derive from it.
```

---

## 🔗 Related Topics

- [00_buradan_basla.md](./00_buradan_basla.md) — The roadmap of the series
- [02_nanddan_kapilar.md](./02_nanddan_kapilar.md) — Deriving all the gates from this brick

---

**Previous topic:** [00_buradan_basla.md](./00_buradan_basla.md)
**Next topic:** [02_nanddan_kapilar.md](./02_nanddan_kapilar.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
