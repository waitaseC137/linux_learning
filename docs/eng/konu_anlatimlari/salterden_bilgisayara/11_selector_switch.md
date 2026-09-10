# 🔀 From Switches to a Computer — Selector and Switch: The Circuit's First Decision

> Every circuit you've built in this series so far did **one fixed job.** Give the adder two
> numbers and it adds them. It has no other option — nobody even asks it.
>
> The two circuits you build in this lesson bring in one more wire: **the wire that says
> what to do.** The root of a processor being programmable is exactly here.

> We take the two levels together because they are two directions of one idea: one asks
> *"which one should I take?"*, the other *"where should I send it?"*

---

## 📋 Table of Contents

- [Data Wire, Control Wire](#data-wire-control-wire)
- [AND Is a Valve](#and-is-a-valve)
- [⚠️ An Open Valve Does Not Mean the Data Is 1](#️-an-open-valve-does-not-mean-the-data-is-1)
- [Two Opposite Commands From One Wire](#two-opposite-commands-from-one-wire)
- [Merging: Why OR Is Safe](#merging-why-or-is-safe)
- [🎮 Now You Build It — Selector](#-now-you-build-it--selector)
- [Switch: The Mirror Image](#switch-the-mirror-image)
- [🎮 Now You Build It — Switch](#-now-you-build-it--switch)
- [The Two-Way Switch — and Where the Analogy Breaks](#the-two-way-switch--and-where-the-analogy-breaks)
- [Closing: When a Decision Becomes a Wire](#closing-when-a-decision-becomes-a-wire)

---

## Data Wire, Control Wire

The Selector has three inputs:

```
d0, d1   →   DATA wires        "the thing to be worked on"
s        →   CONTROL wire      "what is to be done"
```

Physically there is **no difference** between them. All three are wires carrying 0 or 1. Put
a voltmeter on them and you can't tell them apart.

The difference is in **meaning**: `s`'s value doesn't enter the computation. `s` isn't
added, isn't subtracted, isn't part of the result. `s` only says **which computation
happens.**

> 🔑 This is one floor above what you did in `04`. There you loaded **number** meaning onto
> wires. Here you load **decision** meaning onto a wire. The circuit didn't change — the
> meaning you put on it did; one more rung on the ladder
> ([03.5](./03.5_soyutlama_merdiveni.md)).

What the level wants is simple:

```
s = 0   →   output = d0
s = 1   →   output = d1
```

---

## AND Is a Valve

You have `AND`. Don't read it the usual way — *"are both 1?"* — this time **fix one input**
and watch what the other one does.

You've made this move before: in `06` we split the table into "floors". Same trick:

```
 a  b │ AND
─────────────
 0  0 │  0     ┐
 1  0 │  0     ┘  ← b fixed at 0 · a varies → the output never twitched
 
 0  1 │  0     ┐
 1  1 │  1     ┘  ← b fixed at 1 · a varies → the output followed a
```

Two floors give two **identities**:

```
x AND 1 = x        ←  x passes through unchanged
x AND 0 = 0        ←  x is never even looked at
```

> ⚠️ These are **not equations, they are identities.** In an equation you find the unknown
> (`x + 3 = 7` → `x = 4`). In an identity you simplify the expression: you say what it
> equals for *every* `x`. And here's the easy part — `x` can't take infinitely many values,
> there are only two possibilities. "For every x" means "try both cases".

Read together, those two lines turn `AND`'s second input into something else entirely:

```
command 1  →  valve OPEN     ·  the data passes
command 0  →  valve CLOSED   ·  nothing passes
```

The same gate, two readings: one a **logic gate** asking *"are both 1?"*, the other a **tap**
saying *"let this through / don't."*

### The algebra underneath: the identity element

This is really something you already know from arithmetic:

```
a + 0 = a          0 is addition's identity element
a × 1 = a          1 is multiplication's identity element
```

Boolean algebra has the same thing:

```
x AND 1 = x        1 is AND's identity element
x OR  0 = x        0 is OR's  identity element
```

> 🔑 **What makes a gate a valve is having an identity element.** Feed it the identity and it
> passes; feed it the opposite and it blocks. Not something to memorise, something to derive
> — and deriving it only takes a look at the truth table.

---

## ⚠️ An Open Valve Does Not Mean the Data Is 1

This is where people trip up most in this lesson, so it gets its own heading.

You opened the tap. **Does water come out?** Not necessarily — it does if there's water in
the pipe, and doesn't if there isn't. Opening a tap does not **create** water.

```
s = 0  →  d0's valve is open
       →  "from now on the output looks at d0"
       →  whatever d0 is. d0 = 0 → output 0. d0 = 1 → output 1.
```

`s = 0` does **not** mean *"d0 = 1"*. `s = 0` means *"it's d0's turn to speak."*

Once you've built the circuit you need to see this with your own eyes. Try all four cases in
order:

| # | s | d0 | d1 | output | what happened |
|:-:|:-:|:-:|:-:|:-:|---|
| 1 | 0 | 1 | 0 | **1** | d0 is selected, d0 passed |
| 2 | 0 | 0 | 1 | **0** | there's a `1` sitting right there — and it was **ignored** |
| 3 | 1 | 1 | 0 | **0** | there's a `1` sitting right there — and it was **ignored** |
| 4 | 1 | 0 | 1 | **1** | d1 is selected, d1 passed |

**The real proof is in 2 and 3.** In both of them a `1` is present at the circuit's input,
but because it sits on the closed-valve side it has no effect at all on the output.

> 🔑 `s` doesn't change the numbers — it changes **who gets to speak.** What proves that a
> selection is happening is a piece of data being present and yet **unable to affect** the
> output.

The level's own sentence says exactly this: *"If 0, d0 is **selected**."* Here **selected**
means *"it's the one being listened to"*, not *"its value is 1"*. The selected input can be
`0` as well; then the output is `0`, and it is still the selected one.

---

## Two Opposite Commands From One Wire

You'll put a valve in front of each data wire:

```
d0 ──[valve]──
d1 ──[valve]──
```

What you want is clear: **at any moment exactly one open, the other closed.**

But you only have **one `s`**. When `s = 1` you have to tell one valve "open" and the other,
**at the same instant**, "close".

The solution is sitting in the toolbox: split `s` in two and invert one of them.

```
d0's valve  ←  inv(s)
d1's valve  ←  s
```

Check it: when `s = 0`, `inv(s) = 1` → d0's valve is open, d1's is closed. What did the spec
say? `s = 0 → d0`. **It matches.**

> 💡 Wiring one wire into two places (fan-out) isn't new — in `06` you sent `add₁`'s `l`
> output to one place and elsewhere at the same time. Wires don't run out; reading a signal
> doesn't consume it.

---

## Merging: Why OR Is Safe

Now you have **two outputs** but the level has only **one**.

And you **know** this:

```
one of them carries the data  ·  the other is CERTAINLY 0
```

Certainly, because if one valve is open the other is closed. They can never both be full.

To collapse two wires into one, `OR`:

```
x OR 0 = x
```

`0` is OR's identity element. So the `0` coming from the closed valve adds **nothing** to
the data coming from the open one. Here `OR` isn't working as "or", it's working as a
**merger.**

> 🔑 You've done this before. In `06_full_adder` the justification for merging the two
> carries with OR was the same: *they can never both be 1, so OR's suspicious (1,1) row is
> never visited.* Same proof, new place. **A circuit's correctness depends not only on its
> gates but also on which inputs are possible.**

The whole circuit:

```
d0 ──┬──[AND]──┐
     │    ↑    │
     │  inv(s) │
     │         ├──[OR]──► output
 s ──┴──┐      │
        ↓      │
d1 ────[AND]───┘
```

In one line:

```
output = (d0 AND inv s)  OR  (d1 AND s)
```

This circuit is called a **multiplexer**, **mux** for short. Yours is a 2→1 mux.

---

## 🎮 Now You Build It — Selector

**Task:** NandGame → **Selector** level.

What you have: `nand`, `inv`, `and`, `or`, `xor`.

After building it, try the four cases above **by hand.** Especially 2 and 3 — there's a `1`
there and it doesn't reach the output. Without seeing that, this lesson won't settle.

<details>
<summary>🔒 Solution schematic — try it yourself first, then open</summary>

1. `inv`: input **`s`**.
2. `AND₁`: inputs **`d0`** and **`inv`'s output**.
3. `AND₂`: inputs **`d1`** and **`s`**.
4. `OR`: inputs are the two ANDs' outputs → to the **output**.

</details>

---

## Switch: The Mirror Image

The next level builds the same idea in the **opposite direction**:

| | input | output | its question |
|---|---|---|---|
| **Selector** | 2 data + s | 1 | *"which one should I take?"* |
| **Switch** | 1 data + s | 2 | *"where should I send it?"* |

The game's table:

```
 s  d │ c1  c0
 0  0 │  0   0
 0  1 │  0   1     ← s=0 → d went to c0
 1  0 │  0   0
 1  1 │  1   0     ← s=1 → d went to c1
```

> ⚠️ Look at rows 1 and 3: `s` changed but **nothing changed**, because `d = 0`. The tap is
> open, the pipe is empty. The valve idea gets tested here one more time.

This time the valves are **not in front of the inputs but in front of the outputs.** And a
single `d` feeds both valves:

```
       ┌──[AND]──► c1      (command: s)
d ──┬──┤
    │  └──[AND]──► c0      (command: inv s)
    │
 s ─┴──► s and inv(s)
```

```
c1 = d AND s
c0 = d AND inv(s)
```

**There is no merging step** — because you want the outputs to stay separate. Delete the
`OR` from the Selector's formula and leave the two halves apart, and out comes the Switch.
Same materials, different assembly.

---

## 🎮 Now You Build It — Switch

**Task:** NandGame → **Switch** level.

> ⚠️ On screen the outputs sit `c1` on the **left** and `c0` on the **right** — not in
> reading order. When you plug in a wire, look at its **name**, not its position. It's the
> same trap you met in `07` with the `add` box's pin names.

<details>
<summary>🔒 Solution schematic — try it yourself first, then open</summary>

1. `inv`: input **`s`**.
2. `AND₁`: inputs **`d`** and **`s`** → output to **`c1`**.
3. `AND₂`: inputs **`d`** and **`inv`'s output** → output to **`c0`**.

You didn't use `or`. It sits in the toolbox but it's unnecessary at this level — not every
part has to be used.

</details>

---

## The Two-Way Switch — and Where the Analogy Breaks

The Switch has an exact counterpart in electrical wiring: the **two-way switch** (its
technical name is **SPDT** — single pole, double throw). The switch in a stairwell that
turns the same light on and off from two different places.

Match up the terminals:

```
common terminal (C)   →  d       the single input
traveler 1 (L1)       →  c1
traveler 2 (L2)       →  c0
the lever's position  →  s
```

While the lever is on one side the current goes there and the other terminal is **dead.**
Exactly what our valves do.

And the lovely part: **turn the two-way switch around.** Feed it from the two travelers and
take the output from the common terminal — two inputs, one output, the lever choosing which
one passes. **A Selector.**

```
forward  :  1 input → 2 outputs     Switch
reversed :  2 inputs → 1 output     Selector
```

The same part, two directions. A sibling of the *"one wire, two names"* business from `07`.

### But the analogy breaks somewhere

A mechanical switch is **bidirectional** — it's a piece of metal, current flows both ways.
You can turn one part around and get two jobs out of it.

Logic gates are **not.** `AND`'s input is an input and its output is an output; you cannot
reverse it. That's why you have to build the Selector and the Switch **separately** — and
it's exactly why the game makes them two levels.

> 🔑 Where the analogy breaks teaches as much as the analogy itself: **electricity has
> symmetry, logic has direction.**

---

## Closing: When a Decision Becomes a Wire

One end is left hanging in the two-way-switch analogy: **what does `s` correspond to?**

To no wire at all. `s` is the lever's **physical position** — and what sets that position is
a **hand.**

```
mechanical switch :  the decision comes from a HAND    (OUTSIDE the circuit)
logic circuit     :  the decision comes from a WIRE    (INSIDE the circuit)
```

Everything is in that difference:

> 🔑 The moment a decision becomes a wire, that wire can be **another circuit's output.**
> Which means the machine can throw its own switch.

In a stairwell, someone has to come and touch the lever for the light to come on. In a
circuit, connect the `s` wire to the output of a comparison circuit and the switch throws
**itself.** That is precisely what automation is.

And so is programmability: feed `s` from an **instruction** and you've told the machine what
to do in writing.

### The bridge to the ALU

This pays off directly in the next unit:

```
addition result  ──┐
subtraction      ──┼──[SELECTOR]──► ALU output
logic result     ──┘        ↑
                         opcode
```

Inside an ALU all the circuits run **at the same time** — the adder adds, the subtractor
subtracts, the logic unit does its own thing. Then a selector asks *"which one do we want
today?"* and lets only one through.

Which means a processor isn't afraid of doing unnecessary work. **It does all of them and
picks one.** Choosing is cheaper than waiting.

> 💡 **The bonus we shelved:** `AND` isn't the only valve. `x OR 0 = x` and `x OR 1 = 1` —
> so `OR` is a valve too, it just emits **`1`** rather than `0` when closed. An equivalent
> selector comes out of that; but then you merge with `AND` instead of `OR` (because `1` is
> AND's identity element). The two designs are mirror images of each other — this is called
> **De Morgan duality.** `XOR`, on the other hand, cannot be a valve: `x XOR 1 = inv(x)`, so
> it doesn't block, it **inverts.**

---

## Summary — Keep in Mind

```
☐ Data wire ≠ control wire. Same physics, different MEANING. s doesn't enter the sum, it PICKS it.
☐ AND is a valve: x AND 1 = x (open), x AND 0 = 0 (closed).
☐ These are IDENTITIES, not equations — what the expression equals for every x. x has 2 states; try both.
☐ What makes a gate a valve is its IDENTITY ELEMENT (1 for AND, 0 for OR).
☐ ⚠️ An open valve does NOT mean the data is 1. The tap can be open and the pipe empty.
☐ "selected" = the one being listened to. The selected input can be 0.
☐ The proof of selection: a 1 being present and yet UNABLE TO AFFECT the output (rows 2 and 3).
☐ Two opposite commands from one wire → inv. Fan-out is free; wires don't run out.
☐ A closed valve emits 0; 0 is OR's identity → OR becomes a merger.
☐ The two branches can never both be full → OR is safe (the same proof as in 06).
☐ Selector: output = (d0 AND inv s) OR (d1 AND s) — a 2→1 multiplexer.
☐ Switch:  c1 = d AND s · c0 = d AND inv s — NO merging, the outputs stay apart.
☐ A two-way switch (SPDT) is the same circuit; reverse it and it becomes a Selector.
☐ The analogy breaks on direction: electricity has symmetry, logic has DIRECTION.
☐ Mechanically a HAND decides, in a circuit a WIRE does → and a wire can be another circuit's output.
☐ ALU: every circuit runs at once, a selector lets one through. Choosing is cheaper than waiting.
```

---

## 🔗 Related Topics

- [10_bayraklar.md](./10_bayraklar.md) — The circuit that **produces** the decision; the one that will feed this `s`
- [06_full_adder.md](./06_full_adder.md) — The "two branches can't both be full → OR is safe" proof
- [04_teller_sayi_olunca.md](./04_teller_sayi_olunca.md) — Loading meaning onto a wire
- [03.5_soyutlama_merdiveni.md](./03.5_soyutlama_merdiveni.md) — One more rung on the ladder

---

**Previous topic:** [10_bayraklar.md](./10_bayraklar.md)
**Next topic:** *(on the way — the ALU: every operation in one box)*

*This lesson is part of the "From Switches to a Computer" series. The series moves along together with [nandgame.com](https://nandgame.com).*
