# 🔗 From Switches to a Computer — Subtraction: A World With No Minus Sign

> The level asks you for `A − B`. You look at the toolbox and **there is no box called
> "subtract".** All you have is a tool that adds.
>
> This isn't an omission, it's the lesson itself. Because real processors don't have
> separate subtraction hardware either.

> But first you have to answer this question. It sounds philosophical and it's entirely
> engineering: **what does a negative number look like on a wire?** A wire either has voltage
> or it doesn't — there is no "minus sign" state.

---

## 📋 Table of Contents

- [Turning Subtraction Into Addition](#turning-subtraction-into-addition)
- [There Is No Minus Sign on the Wires](#there-is-no-minus-sign-on-the-wires)
- [Turn the Counter Backwards](#turn-the-counter-backwards)
- [Proof: Does It Really Behave Like −1?](#proof-does-it-really-behave-like-1)
- [Producing −B: Invert, Add 1](#producing-b-invert-add-1)
- [Why It Always Works](#why-it-always-works)
- [The Same Wires, Two Meanings](#the-same-wires-two-meanings)
- [🔒 The Security Bridge](#-the-security-bridge)
- [🎮 Now You Build It](#-now-you-build-it)
- [Closing: The Birth of the Flags](#closing-the-birth-of-the-flags)

---

## Turning Subtraction Into Addition

If the tool in your hands adds, you have to translate the job into the language of addition.
Middle-school algebra is enough:

```
A − B  =  A + (−B)
```

*(The parentheses here only say "minus B is one piece" — they have nothing to do with the
sign.)*

The left side is subtraction, the right side is **addition.** Same result. And `add 16` can
already do the right side.

So the whole level has collapsed into a single question:

> **How do I take `B` and produce `−B`?**

Solve that and the adder handles the rest.

---

## There Is No Minus Sign on the Wires

Now the hard part. There is no wire called `−B`, and there cannot be.

You have 16 wires, each 0 or 1. That's **65536** distinct patterns in total. If you're going
to show a negative number, you have to pick **one** of those patterns and decide *"from now
on this means minus one."*

> 🔑 Negative numbers are not **stored** in a machine, they are **represented.** There is no
> such thing as "minus" out there — only an agreement about which pattern means what.

So which pattern should we pick? We can't pick at random — the pattern we choose has to
**actually behave like minus one** inside the adder.

---

## Turn the Counter Backwards

Remember the odometer (lesson 08): after 999999 comes 000000. And if you turn it
**backwards**? Go one click back from 000000 and you drop to 999999.

Turn your 16-bit counter one click back from 0:

```
   0000000000000010  =  2
   0000000000000001  =  1
   0000000000000000  =  0
   1111111111111111  =  ?     ← one click back: it lands here
```

The pattern **one below** zero is `1111111111111111`. And "one below zero" means, by
definition, **minus one.**

> 💡 You already built this wrap. In lesson 08, `65535 + 1 = 0` — that is, going forward.
> Now you're reading the same circle in the reverse direction. There's no new mechanism, just
> the other end of the same one.

---

## Proof: Does It Really Behave Like −1?

"We decided so" isn't enough. Prove it.

The definition of −1 is one sentence: **add 1 to it and you get 0.** Let's test:

```
   1111111111111111        (65535)
 + 0000000000000001        (1)
 ──────────────────────
  10000000000000000        the 17th bit doesn't fit, it falls off
   0000000000000000  =  0  ✓
```

Passed. And is `1111111111111110` really −2? Add 2 to it:

```
   65534 + 2 = 65536  →  doesn't fit in 16 bits  →  0  ✓
```

That passed too.

| pattern | read as unsigned | read as signed |
|---|---:|---:|
| `0000000000000000` | 0 | 0 |
| `0000000000000001` | 1 | +1 |
| `1111111111111101` | 65533 | **−3** |
| `1111111111111110` | 65534 | **−2** |
| `1111111111111111` | 65535 | **−1** |

The level's own sentence is the formula for this: *"If the result is less than zero it is
represented as **65536 plus the result**."* So `−1` → `65536 + (−1)` = `65535`.

> 🔑 This representation is called **two's complement**. Nobody sat down at a table and said
> "let's write negative numbers like this" — **it fell out of the wrapping by itself.** The
> adder was already behaving this way; we just gave it a name.

---

## Producing −B: Invert, Add 1

Now for the rule. Take `B = 1` and try to reach `−1`:

```
B          =  0000000000000001     (1)
inv16(B)   =  1111111111111110     (65534 = −2)   ← we inverted it
target −1  =  1111111111111111
```

We inverted and landed on **−2**. The target is **−1**. The difference: **1.**

```
inc16( inv16(B) )  =  1111111111111111  =  −1  ✓
```

> 🔑 **`−B = inc16( inv16(B) )`** — invert all the bits, then add 1.

Now you see why exactly `inv 16` and `inc 16` are sitting in the toolbox. The game gave you
the ingredients and withheld the recipe.

---

## Why It Always Works

One example isn't a proof. Let's prove it on paper.

Add a number to its own inversion — since for every place one of them is 0 and the other 1,
the result is **always** all-ones:

```
    0000000000000011      B = 3
  + 1111111111111100      inv16(B)
  ──────────────────
    1111111111111111      65535    (always)
```

Which means:

```
B + inv16(B) = 65535        →        inv16(B) = 65535 − B
```

Add one to it:

```
inc16( inv16(B) ) = 65536 − B
```

And the level's rule defined `−B` as `65536 − B`.

**The same expression.** Not a coincidence — algebra.

> 💡 **Real processors shorten this by one more step.** They don't put a separate `inc`
> block in; they feed `inv(B)` to the adder and **pin the carry-in to 1.** So `A + ~B + 1`
> happens in a single pass. In lesson 08 we said "the carry-in is the cheapest place to
> inject a 1 into a circuit" — this is exactly how an ALU subtracts.

---

## The Same Wires, Two Meanings

Look carefully at this:

```
   1111111111111111
```

Is this pattern **65535** or **−1**?

**Both. And the wires don't tell you which.**

> ⚠️ Whether a number is signed or unsigned **is not written inside the data.** The program
> reading it decides. The same 16 wires, the same voltages — two different realities.

This is the sharpest form of the idea from lesson 04: *the number doesn't exist in the
circuit, it exists in the way you read the wires.*

---

## 🔒 The Security Bridge

This ambiguity has a price, and its name is **signed/unsigned confusion.**

Imagine a length value. `65535` arrives from the network. The program puts it into a
**signed** variable — its value is now **−1**.

```c
if (len > MAX)          //  −1 > MAX  →  FALSE  →  the check passes
    return ERROR;
memcpy(buf, src, len);  //  here len is used as UNSIGNED → 65535 bytes
```

The check saw `−1` and said "small, no problem". The copy saw `65535`.

> ⚠️ A sibling of the pattern from lesson 08: **the check exists, but the number the check
> looks at and the number that gets used are not the same.** There it was the overflow that
> toppled it, here it's the sign interpretation.

The shared root of both is the same sentence: **the pattern is the same, the meaning is the
reader's decision.**

---

## 🎮 Now You Build It

**Task:** NandGame → **Subtraction** level.

What you have: `add 16`, `inv 16`, `inc 16`, `or`, `inv`, `0`, `nand`.

<details>
<summary>🔒 Solution schematic — try it yourself first, then open</summary>

```
B  →  inv 16  →  inc 16  ──┐
                           ├──►  add 16  ──►  S  →  OUTPUT
A  ────────────────────────┘
```

1. Run `B` through **`inv 16`**.
2. Feed the result into **`inc 16`**. What you now hold is **`−B`**.
3. `add 16`: **`A`** on one pin, **`−B`** on the other.
4. **`S`** → to the output.

⚠️ **Leave `add 16`'s carry-in pin empty.** `inc 16` already did the "add 1"; feed another 1
in there and you'll be computing `A − B + 1`.

</details>

---

## Closing: The Birth of the Flags

Everything you've built so far **computed**: add, increment, subtract. All of them produce a
number and hand it over.

The next two levels do something different: they **ask a question.**

- *"Is this number zero?"*
- *"Is this number negative?"*

The answers are one bit: yes or no. And when you combine those two questions with the
subtractor you built in this lesson, out comes this:

```
a == b   →   do a − b, is the result ZERO?
a <  b   →   do a − b, is the result NEGATIVE?
```

There is no separate comparison circuit. **Subtract, then look at the result.** This is
where a processor's ability to say "if" begins.

---

## Summary — Keep in Mind

```
☐ There is no subtraction hardware; A − B = A + (−B) turns it into addition.
☐ No minus sign on the wires. A negative number isn't STORED, it's REPRESENTED by a pattern.
☐ The pattern one below 0 is 1111111111111111 → that's why it's −1.
☐ Proof: 65535 + 1 = 0. That is already the definition of −1.
☐ This representation is two's complement; nobody designed it, it FELL OUT of the wrap.
☐ −B = inc16(inv16(B)) — invert, add 1.
☐ Its proof: inv16(B) = 65535 − B, +1 → 65536 − B = the level's own rule.
☐ A real ALU doesn't use inc: A + ~B with carry-in = 1. Same result, single pass.
☐ The same 16 wires are both 65535 and −1. The meaning is set by the PROGRAM, not the DATA.
☐ signed/unsigned confusion: the number the check sees and the number used diverge.
```

---

## 🔗 Related Topics

- 👾 **For the curious:** [this lesson's CWEs](../cwe/README.md#unit-2--the-limit-of-a-number-and-negative-numbers) — the three CWEs in the Security Bridge example: 196 → 839 → 195
- [08_increment.md](./08_increment.md) — Wrapping, and how cheap the carry-in is
- [08.5_sayac_basa_donunce.md](./08.5_sayac_basa_donunce.md) — The mathematics of wrapping: `ℤ/2ⁿℤ` and CWE-190
- [04_teller_sayi_olunca.md](./04_teller_sayi_olunca.md) — "The number lives in the way you read"
- [07_multibit_adder.md](./07_multibit_adder.md) — The adder itself

---

**Previous topic:** [08.5_sayac_basa_donunce.md](./08.5_sayac_basa_donunce.md)
**Next topic:** [10_bayraklar.md](./10_bayraklar.md) — How a machine says "if"

*This lesson is part of the "From Switches to a Computer" series. The series moves along together with [nandgame.com](https://nandgame.com).*
