# 🔗 From Switches to a Computer — Full Adder: The Carry Chain

> Last lesson you built a box, but it earned a "half" stamp: it produced a carry,
> but it couldn't accept one. In this lesson you'll complete the missing input. The box
> you build will be called a **full adder** — and, no exaggeration, this is the **brick**
> of the arithmetic inside a modern processor: line up 64 of them side by side and you've
> built the hardware that adds 64-bit numbers.

> This is the most demanding build in the series so far. The difficulty isn't in the parts —
> they're all familiar — it's in the **way of thinking.** We'll walk the path together,
> the wrong turn included.

---

## 📋 Table of Contents

- [Why Three Inputs?](#why-three-inputs)
- [The Box's Entire Logic in One Sentence](#the-boxs-entire-logic-in-one-sentence)
- [Not Eight Rows, Four Cases](#not-eight-rows-four-cases)
- [The Wrong Way: "Let Me Add All the Pairs"](#the-wrong-way-let-me-add-all-the-pairs)
- [The Right Way: Like on Paper, In Order](#the-right-way-like-on-paper-in-order)
- [The Last Wire: Two Carries, One Output](#the-last-wire-two-carries-one-output)
- [Three Separate ORs — Don't Mix Them Up](#three-separate-ors--dont-mix-them-up)
- [🎮 Now You Build It](#-now-you-build-it)
- [Closing: The Chain of 64](#closing-the-chain-of-64)

---

## Why Three Inputs?

Add 27 + 35 on paper and watch what your hand does:

```
      ¹        ← carry
      2 7
```
```
    + 3 5
    ─────
      6 2
```

- Rightmost digit: 7+5=12 → "write 2, **carry 1**". Here you added **two** things.
- Middle digit: 2+3+**1** → 6. Here you added **three** things: two digits + the incoming carry.

Every digit in the middle of the chain has three inputs. That is exactly what a full adder
is: the machine for that middle digit:

> **Full adder = a box that adds a + b + c** — where `c` is the **carry** coming in from
> the right neighbor. Its output is again two wires: `l` (write) and `h` (the new carry,
> heading to the left neighbor).

---

## The Box's Entire Logic in One Sentence

Adding three single-bit numbers is really just counting:

> 🔑 **COUNT how many 1s are among the three inputs. Write the resulting number in binary: h l.** That's all.

The count can come out 0, 1, 2, or 3 (there's nothing more than three inputs). You already
know the binary form of all four from lesson 04: `00`, `01`, `10`, `11`.

---

## Not Eight Rows, Four Cases

In the game an eight-row table will greet you. Don't let it scare you — group the rows by
the question "how many 1s are there?" and eight rows collapse to four:

| How many 1s? | Which rows | h l | In token language |
|:---:|---|:---:|---|
| 0 | 000 | `0 0` | no tokens |
| 1 | 001, 010, 100 | `0 1` | one 1-token |
| 2 | 011, 101, 110 | `1 0` | one 2-token |
| 3 | 111 | `1 1` | 2-token + 1-token |

Make two observations:

- **All three** of the rows with a single 1 give the same answer; so do the ones with two 1s.
  **Which** input is 1 doesn't matter at all — only the **count** matters. (Just like 7+5
  and 5+7 being the same.)
- The half adder's table had no `1 1` output — two inputs count to 2 at most. The only
  novelty the third input brings is that last row: 3 = `11`.

> 💡 Read the table one more time by **splitting it into floors**: separate the four rows
> where c=0 and look at h,l — out comes the **exact same table as the half adder's**. Makes
> sense: if the third basket is empty, a three-basket box has to behave like a two-basket
> box. This observation is the soul of the circuit you're about to build: inside the full
> adder, a half adder **lives.**

---

## The Wrong Way: "Let Me Add All the Pairs"

At this level the first idea that comes to mind is usually this (and it's worth trying — the
wrong way teaches too): *"I have a box that adds two things; so I'll add all the pairs:
a+b, a+c, b+c... then I'll combine them."*

You place three or four half adders, wire them up, and... you find yourself with a pile of
outputs and not a single "sum". Each box reports separately "how many 1s are in these two";
the reports repeat each other and nobody tells you the **overall total**. As the part count
grows, you get closer not to a solution but to a crowd of wires.

> ⚠️ The lesson here isn't a circuit lesson, it's a thinking lesson: **adding parts is not
> progress.** If your circuit is growing but your clarity is shrinking, go back to the table
> and look at the operation *itself*: how were you doing this job by hand?

---

## The Right Way: Like on Paper, In Order

Add 2 + 3 + 4 in your head and pay attention to **what you do**: "2+3 = 5... 5+4 = 9."
You didn't add all the pairs at once; **you added two, then added the third onto the
result.** Addition is sequential — the **answer** of one addition becomes the **input** of
the next.

You know this sentence from lesson 03.5: *the answer of one floor is the signal of the floor
above.* So then:

1. **First half adder:** let it add `a + b`.
2. **Second half adder:** let it add `c` onto the first one's result.

One subtlety remains: the first box's result is **two wires** (h and l). Which one do you
feed to the second box? Think in token language: `c` is a value **in 1-token units** (0 or 1
apple). The wire that goes on the same scale as it must also be in 1-token units: **`l`.**
(`h`, on the other hand, is in 2-token units — that belongs on a different scale, and will
wait off to the side.)

```
   a ──► [ add ] h₁ ─────────────────────┐  (2-token — waiting)
   b ──► [  1  ] l₁ ──► [ add ] h₂ ──────┤  (2-token — waiting)
                  c ──► [  2  ] l₂ ──────►│──► l  ✓ (ones place done)
                                          ▼
                                    last wire: h = ?
```

---

## The Last Wire: Two Carries, One Output

You have two h wires in hand (h₁, h₂) but the box has only one `h` output. Both wires shout
the same sentence: *"I found a pair!"* — the first in a+b, the second in remainder+c. But
your `h` output's question is: "**is there a pair inside?**" It doesn't care who found the pair.

"If at least one is shouting, h=1" — you know this sentence: **OR.**

But let's be meticulous; OR's table also has a `(1,1) → 1` row. What if both shout at once?
Two pairs = 4 apples would be needed; three inputs give 3 at most. Still, prove it on paper:
for h₁=1 you'd need a=b=1 → then l₁ = 0 → 0 and c enter the second box → the second box can
**never** find a pair. **Two shouts at the same time are impossible.** OR's one suspect row
will never be visited — use it with confidence.

> 💡 A subtle bonus: since the (1,1) case never occurs, **XOR** — which differs from OR only
> on that very row — would do the same job. Both pass. That two different gates can do the
> same task in a circuit feels strange at first — the secret is that they live in a world
> where their difference is never tested.

### The concrete consequence: you can build it without an OR gate at all

Let's not leave that bonus as talk. A half adder's `l` output **is already an XOR**
(lesson 05). Which means you can use the `add` box you already have in place of the OR:

```
   add₃ = add(h₁, h₂)      →  l₃  =  XOR(h₁, h₂)  →  the box's h output
```

You place a third half adder, feed it the two carries, and take its **`l` output**. The
`h₃` pin is left dangling — never used, because it is never 1.

| h₁ | h₂ | OR | XOR |
|:-:|:-:|:-:|:-:|
| 0 | 0 | 0 | 0 |
| 0 | 1 | 1 | 1 |
| 1 | 0 | 1 | 1 |
| ~~1~~ | ~~1~~ | ~~1~~ | ~~0~~ | ← proved above: never happens |

Because the **one row** where they differ is never visited, the two circuits behave
identically.

> 🔑 The real lesson here: a circuit's correctness depends not only on its gates but also on
> **which inputs are possible.** Knowing that a state is impossible buys you freedom in
> choosing gates. Using that freedom without proving it is dangerous — which is why we
> proved it on paper first and used it after.

---

## Three Separate ORs — Don't Mix Them Up

The sneakiest trap in this lesson isn't a circuit mistake, it's a **word** mistake. "OR"
comes up in three different places here and the three have nothing to do with each other:

| # | where | what |
|:-:|---|---|
| 1 | **inside XOR** | `XOR = (A OR B) AND (A NAND B)` — from lesson 03. Nothing to do with the full adder. |
| 2 | **while reading the table** | on the `a = 1` floor, `h = OR(b, c)` comes out. That's an **observation**, not a gate to build. |
| 3 | **in the circuit** | `OR(h₁, h₂)` — the one that combines the two carries. **This is the real one.** |

> ⚠️ The second is especially dangerous: after splitting the table into floors and making
> the observation `h = OR(b, c)`, it becomes very tempting to go to the circuit and wire `b`
> and `c` into an OR. **That's the wrong road.** That observation is a *description* of the
> `a = 1` floor; the circuit's `h` looks at all three inputs.
>
> The general rule: when you see two things carrying the same name, **say out loud, every
> single time, which one you're talking about.** Later in this series the same trap will
> come back with the letter `c` (carry in / carry out) and with box pin names.

---

## 🎮 Now You Build It

**Task:** NandGame → **Full Adder** level.

Your directions: two `add`s (the game put your half adder into your box under that name —
03.5 at work), one OR. Build it, and try a few of the eight combinations by hand: each time
read out to yourself "how many apples → which tokens".

<details>
<summary>🔒 Solution schematic — try it yourself first, then open</summary>

1. `add₁`: inputs **a, b**.
2. `add₂`: inputs **the l of add₁** and **c**.
3. **OR**: inputs **the h of add₁** and **the h of add₂** → its output to the box's **h**.
4. **The l of add₂** → to the box's **l**.

Summary of the summary: *full adder = two half adders + one OR.* But you now say this
sentence not by rote but knowing the "why" of each of its wires — that's the difference.

**Alternative (without using an OR gate):** instead of the OR in step 3, place a third
`add`, feed `h₁` and `h₂` into its inputs, and wire its **`l` output** to the box's `h`.
Leave `h₃` dangling. The fact you proved above — that the two carries can never be 1 at the
same time — makes this circuit valid too. Both solutions are correct; the second is the one
that *uses* the proof.

</details>

---

## Closing: The Chain of 64

Look at the box you built one last time: it has a carry **input** called `c` and a carry
**output** called `h`. Which means these boxes... **can plug into each other.** One's h
becomes the c of the one to its left:

```
        ...  ◄─h─ [FA₂] ◄─h─ [FA₁] ◄─h─ [FA₀] ◄── (first carry: 0)
              b₂ a₂ │     b₁ a₁ │     b₀ a₀ │
                    l₂          l₁          l₀
```

Each box is one digit; the carry flows from right to left, just like on paper. Line up 8 of
them and you've built the hardware that adds 8-bit numbers; line up 64 and it's the hardware
that adds 64-bit numbers. If a program on your computer just ran an `add` instruction, it
went through exactly this chain — through 64 copies of **the box you built today.**

Building this chain yourself is the job of the next lesson (and the next level in NandGame):
**Multi-bit Adder.** See you there.

---

## Summary — Keep in Mind

```
☐ Full adder = a + b + carry-in. The machine for the MIDDLE digit on paper (three inputs!).
☐ All the logic: COUNT the 1s, write the number in binary (h l). 8 rows = 4 cases.
☐ Who is 1 doesn't matter, HOW MANY 1s matters. The c=0 floor = the half adder itself.
☐ Wrong-way lesson: adding parts isn't progress. Build it the way you do it by hand.
☐ Addition is SEQUENTIAL: add → then add onto the result. (A floor's answer, the floor above's signal.)
☐ The wire added to c is l (both in 1-token units); the h's are 2-token, waiting off to the side.
☐ Two h's can never be 1 at once (paper proof) → OR is enough to combine (XOR would pass too).
☐ A half adder's l output IS an XOR → a third `add` can replace the OR entirely.
☐ A circuit's correctness depends on which inputs are POSSIBLE, not only on its gates.
☐ Three separate ORs: inside XOR / the table observation / the real one in the circuit.
☐ Never wire b and c into an OR — that observation only describes the a=1 floor.
☐ The h output plugs into the neighbor's c input → the chain of 64 = the hardware of the processor's `add`.
```

---

## 🔗 Related Topics

- [05_half_adder.md](./05_half_adder.md) — The box that lives inside this circuit twice
- [04_teller_sayi_olunca.md](./04_teller_sayi_olunca.md) — The basis of "count and write in binary"
- [03.5_soyutlama_merdiveni.md](./03.5_soyutlama_merdiveni.md) — "The answer is the floor above's signal"

---

**Previous topic:** [05_half_adder.md](./05_half_adder.md)
**Next topic:** [07_multibit_adder.md](./07_multibit_adder.md) — Building the chain; one wire, two names

*This lesson is part of the "From Switches to a Computer" series. The series moves along together with [nandgame.com](https://nandgame.com).*
