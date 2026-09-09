# 🔗 From Switches to a Computer — Multi-bit Adder: One Wire, Two Names

> At the end of the last lesson you saw that the boxes can plug into each other: one's `h`
> became the `c` of the one to its left. In this lesson you'll actually build that chain —
> and the moment you do, you'll have moved from a single-digit toy to a machine that
> **works with real numbers.**

> But the real lesson isn't in the wiring. That single wire you run between two boxes has
> **two different names**, and most people lock up right there. That wire is the spine of
> this lesson.

---

## 📋 Table of Contents

- [From a Single Digit to a Number](#from-a-single-digit-to-a-number)
- [One Wire, Two Names](#one-wire-two-names)
- [And a Third Vocabulary: sum / carry](#and-a-third-vocabulary-sum--carry)
- [The Wrong Way: Starting From the Left](#the-wrong-way-starting-from-the-left)
- [Direction of Analysis ≠ Direction of Computation](#direction-of-analysis--direction-of-computation)
- [The Carry With Nowhere to Go](#the-carry-with-nowhere-to-go)
- [🎮 Now You Build It](#-now-you-build-it)
- [Closing: The Price of the Chain](#closing-the-price-of-the-chain)

---

## From a Single Digit to a Number

A full adder was the machine for **one digit**. But numbers don't have one digit — `27` has
two, `1453` has four. So: one box per digit.

Let's add two two-digit numbers plus an incoming carry. On paper you write exactly this:

```
         a1    a0
       + b1    b0
                c      ← the carry coming in from the right
    ──────────────
     c    s1    s0
```

Every vertical column is a **column**, and every column is a **full adder**. That's all.

> 🔑 Chaining isn't a new idea — it's the same ladder from 03.5. One box's **answer**
> becomes the neighbouring box's **input**. You're just building the ladder **sideways**
> this time instead of upward.

---

## One Wire, Two Names

Now the heart of the lesson. You built the box for the right-hand column and it produced an
`h` output. The box for the left-hand column wants a `c` input. You run **one wire** between
them.

Let's look at that wire from both sides:

```
   ┌──────────────┐            ┌──────────────┐
   │ LEFT COLUMN  │            │ RIGHT COLUMN │
   │   (a1,b1)    │            │   (a0,b0)    │
   └──────┬───────┘            └──────┬───────┘
          │  c  ◄────── ONE WIRE ─────┤  h
          │                           │
   "a carry came IN to me"      "my carry went OUT"
        carry IN                    carry OUT
```

From the right-hand box's point of view this wire is called **carry out**. From the
left-hand box's point of view the very same wire is called **carry in**.

> 🔑 **Carry-in and carry-out are not two different things — they are the two ends of one
> wire.** The name has nothing to do with the wire itself; it has to do with **which box
> you're looking out from.**

Did you notice why this distinction is so hard to learn? Because there **aren't two things
to distinguish.** Your brain hears two names, goes looking for two objects, doesn't find
them, and locks up. There is one object and two points of view.

> 💡 The same story is already on your paper. When you say `7+5=12` and write the 1 above,
> that 1 is a carry that went **out** as far as you're concerned; when you move to the next
> column and say `2+3+1`, that same 1 is now a carry that came **in**. Same digit, same
> sheet of paper, two sentences.

---

## And a Third Vocabulary: sum / carry

At this level the game calls the outputs `s1` and `s0`. That `s` is no accident: **sum**.

So by now you've seen three different names for the same two wires:

| NandGame | classic name | what it means |
|---|---|---|
| `l` (low bit) | **sum** | the digit you **write** in that column |
| `h` (high bit) | **carry** | the digit you **carry** to the left |

> ⚠️ These four words (`h`, `l`, `sum`, `carry`) are **two** concepts, not four. If you see
> "sum" in a text, think `l`; if you see "carry", think `h`. Textbooks use the second
> column, the game uses the first — the circuit is the same circuit.

---

## The Wrong Way: Starting From the Left

While building the chain this question comes up: which column should you start from? Trying
it costs nothing — take `17 + 25` on paper and do it **from the left**:

```
   17          Left column:   1 + 2 = 3    →  you wrote "3"
 + 25          Right column:  7 + 5 = 12   →  write "2", carry 1
 ────
                Where does that carry go? To the LEFT column.
                But you already wrote the left column.
                → go back, erase the 3, make it 4.
```

The answer is `42`, you had written `32`, and to fix it you were forced to **go back**.

The reason is one sentence:

> 🔑 **A carry only ever goes left. It never goes right.** Which means information flows in
> one direction only. For you to compute a column correctly, **the column to its right must
> already be finished.**

If you start from the left, you're using information that doesn't exist yet. In a circuit
there's no such thing as "going back and erasing" — so the chain has to be built in the
right direction from the start.

---

## Direction of Analysis ≠ Direction of Computation

There's a very easy inference mistake here; let's close it off in advance:

> ⚠️ Saying "the carry doesn't travel left-to-right" does **not** mean "**you** can't think
> left-to-right."

We're talking about two separate things:

| | direction | free? |
|---|---|:-:|
| **Direction of analysis** — while *looking at* the circuit | whichever end you like | ✅ free |
| **Direction of computation** — while the circuit *runs* | right to left | ⛔ forced |

Taking the result you want and walking backwards asking "what would the inputs have to have
been to land here?" is a perfectly valid method — that's the whole of reverse engineering,
and we solved several tables in this series exactly that way.

What's forced is that while **electricity** flows, the order is dictated by the carry. You
don't get to dictate it.

---

## The Carry With Nowhere to Go

You've reached the leftmost box in the chain. It produces an `h` too. So where does it go?

There's no column to its left.

```
     c    s1    s0        ← outputs
    ×4    ×2    ×1        ← place values
```

> 🔑 **A carry with nowhere to go becomes the highest digit of the result.**

So the `c` at the output is doing two things at once: it's both "the last column's carry"
and "the 4s place of the answer". Not two separate jobs — when a carry runs out of places to
be carried to, it **turns into a digit.**

With the level's own example: `2 + 2 + 1 = 5`

```
  c   s1   s0
  1    0    1
 ×4   ×2   ×1
 ───────────────
  4 +  0 +  1  =  5  ✓
```

You added two two-digit numbers and got a **three**-digit answer. That's a direct consequence
of the token logic from lesson 04: each new place is twice the previous one, and when the
total overflows, a new place opens up.

---

## 🎮 Now You Build It

**Task:** NandGame → **Multi-bit Adder** level.

You now have a three-input box called `add` — the full adder you built last lesson; the game
handed it back to you as a ready-made part (03.5, at work again).

Place two of them. Then answer the one question: **where does the right-hand box's `h` go?**

> ⚠️ The box's pins are labelled `A`, `B`, `c`. Those are **that box's local pin names** —
> the fact that they share letters with the `a1`, `b1` signals in your circuit is a
> coincidence. The box isn't saying "bring me a signal called `a`", it's saying "bring me two
> wires, and inside I'll call them `A` and `B`." Which wire goes to which pin is up to you —
> the adder is symmetric in its two inputs (lesson 05).

<details>
<summary>🔒 Solution schematic — try it yourself first, then open</summary>

1. **Right column:** `add₀` → inputs `a0`, `b0` and the incoming carry `c`.
2. `add₀`'s **`l`** → output **`s0`**.
3. **Left column:** `add₁` → inputs `a1`, `b1` and **`add₀`'s `h`**. ← the wire of the chain
4. `add₁`'s **`l`** → output **`s1`**.
5. `add₁`'s **`h`** → output **`c`**. (Nowhere to go, so it became a digit.)

Step three is the entire lesson: you plugged one box's carry-**out** into its neighbour's
carry-**in**.

</details>

---

## Closing: The Price of the Chain

Take one last look at what you built and notice this: **the left column cannot be computed
until the right column is finished.** One of its inputs is literally the right column's
output.

You built this at 2 bits. At 16 bits it's 16 boxes, and the leftmost box cannot produce the
right answer **until all fifteen below it are done.** The carry advances through the chain in
order — exactly like a row of dominoes.

This arrangement is called a **ripple-carry adder**, and it has a price: the wider the
number, the later the result is ready. In real processors this delay directly limits the
**clock speed** — which is why engineers build more complicated circuits that *predict* the
carry (carry-lookahead).

What you just built is the most honest and most understandable one. To understand the fast
one, you had to build this one first.

In the next lesson the numbers grow to 16 bits — and instead of drawing 16 wires, the game
teaches you a new notation. We'll also give the adder you built a job that looks very
simple: **adding 1.** That simple-looking job will open the door to one of the most
productive vulnerability classes in computer security.

---

## Summary — Keep in Mind

```
☐ One full adder per digit of the number. The chain = the columns on paper.
☐ carry-out and carry-in are THE SAME WIRE; the name depends on which box you look from.
☐ h/l and sum/carry are two vocabularies for the same two wires. Four words, two concepts.
☐ A carry only goes LEFT → computation MUST run right to left.
☐ Compute from the left and you'll have to go back and erase what you wrote (17+25).
☐ Direction of analysis is free (you may look backwards); direction of COMPUTATION is not.
☐ A carry with nowhere to go becomes the highest digit of the result.
☐ A box's pin names are LOCAL; don't confuse them with your circuit's signals.
☐ Ripple-carry: the top digit waits for all the ones below → delay = the clock-speed limit.
```

---

## 🔗 Related Topics

- [06_full_adder.md](./06_full_adder.md) — The box itself, the one lined up in the chain
- [04_teller_sayi_olunca.md](./04_teller_sayi_olunca.md) — Place values, the token logic
- [03.5_soyutlama_merdiveni.md](./03.5_soyutlama_merdiveni.md) — "The answer is the neighbour's signal"

---

**Previous topic:** [06_full_adder.md](./06_full_adder.md)
**Next topic:** [08_increment.md](./08_increment.md) — The wire nobody reads

*This lesson is part of the "From Switches to a Computer" series. The series moves along together with [nandgame.com](https://nandgame.com).*
