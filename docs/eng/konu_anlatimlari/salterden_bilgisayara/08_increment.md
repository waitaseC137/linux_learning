# 🔗 From Switches to a Computer — Increment: The Wire Nobody Reads

> You built the chain. Now the game raises the numbers to 16 bits and gives you a
> ridiculously small task: **add 1.** That's it.
>
> But hidden inside that small task is the birth of one of the most productive
> vulnerability classes in computer security.

> In this lesson there will be a wire you deliberately **leave unconnected.** The whole
> message of the lesson is in that dangling wire.

---

## 📋 Table of Contents

- [16 Wires, One Line](#16-wires-one-line)
- [The Same Box, Widened](#the-same-box-widened)
- [Where Do You Put the +1?](#where-do-you-put-the-1)
- [Making a 1 Out of Nothing](#making-a-1-out-of-nothing)
- [Overflow: 65535 + 1 = 0](#overflow-65535--1--0)
- [The Wire Nobody Reads](#the-wire-nobody-reads)
- [🔒 The Security Bridge](#-the-security-bridge)
- [🎮 Now You Build It](#-now-you-build-it)
- [Closing: Making an Adder Subtract](#closing-making-an-adder-subtract)

---

## 16 Wires, One Line

When you open the game it's panic time: everything looks like it changed. The only thing
that changed is the **drawing.**

If we drew all 16 wires separately the schematic would become unreadable. Instead the game
gathers the 16 wires into a single line and writes a small **`16`** on it.

```
   one by one (unreadable)           bundle (the same thing)

   ──────────────                        16
   ──────────────                   ═══════════
   ──────────────  × 16
   ──────────────
```

Think of it as a thick cable: there are 16 wires inside it, all of them the wires you
already know. **Conceptually zero novelty.**

> 💡 This is exactly the ladder of abstraction from 03.5. Climb one floor up and the detail
> of the floor below becomes invisible — but it doesn't cease to exist. A cable bundle is
> the floor above "wire".

---

## The Same Box, Widened

There's a box in the toolbox called `add 16`. You don't need to learn anything new, because
that box is **the circuit you built last lesson:**

| 2-bit (lesson 07) | `add 16` | what |
|---|---|---|
| `a1 a0` | `A` | first number |
| `b1 b0` | `B` | second number |
| `c` (bottom) | `c` (bottom) | **carry in** |
| `s1 s0` | `S` | **sum** |
| `c` (top) | `c` (top) | **carry out** |

> ⚠️ The same box has a `c` on the **bottom and on the top**, and they are opposites: the
> bottom one is the carry coming **in**, the top one the carry going **out**. The "one wire,
> two names" business from lesson 07 is visible here on a single component, with your own
> eyes.

The game took the chain you built, stretched it to 16 digits and packed it into one box.
It's handing back what you built — one more rung up the ladder.

---

## Where Do You Put the +1?

The tool in your hands computes this:

```
S = A + B + c
```

What you want is:

```
S = input + 1
```

You wire the input to `A`, that part is obvious. But where does the `1` come in? There are
two candidates:

| candidate | cost | what it takes |
|---|---|---|
| `B` | **16 wires** | producing the pattern `0000000000000001` |
| `c` | **1 wire** | a single `1` |

Both give the mathematically correct result. But one requires wrestling with 16 wires, the
other finishes the job with a single wire.

> 🔑 **The carry input is the cheapest place to inject a "1" into a circuit.** It's already
> there, it's already a single bit, it's already part of the addition. Spotting these "free
> doors" in hardware design is the difference between a good circuit and a bloated one.

If you feed `c` a 1, then `B` must be 0 — because `input + 0 + 1 = input + 1`.

---

## Making a 1 Out of Nothing

A small problem: the toolbox has a constant called `0`, but **there is no constant `1`.**

You have a box with no inputs whose output is always 0. And you have `inv`.

> 🔑 `inv(0) = 1`. You make a constant one by inverting the constant zero.

You didn't create something from nothing — you flipped the only constant you had. This
little trick means you can build any constant pattern you need out of `0` and `inv`.

---

## Overflow: 65535 + 1 = 0

The largest number 16 bits can hold:

```
   1111111111111111  =  65535
```

Add 1 to it and it becomes 65536. And 65536 needs **17 places** in binary:

```
   1111111111111111        (65535)
 + 0000000000000001        (1)
 ──────────────────────
  10000000000000000        ← 17 bits
  ↑
  this bit doesn't fit

   0000000000000000  =  0
```

**The result is 0.** The number wrapped around.

> 🎮 Try it in the game: type decimal `65535` into the input box. You'll see the output drop
> to `0` and the top `c` become `1`.

This is **exactly the same event** as a car's odometer rolling from 999999 to 000000. The
digits ran out and the counter went back to the start.

---

## The Wire Nobody Reads

The level tells you plainly: *"Ignore the carry if the result is larger than 16 bits."* So
you leave `add 16`'s top `c` pin connected to nothing.

Now think carefully: **was that carry computed?**

Yes. The circuit produced it, it's sitting there on the pin, its value is 1. You just didn't
connect it.

> 🔑 **The information isn't lost — nobody is looking at it.**

The same thing happens in a real processor. An addition runs, the overflow is written into a
flag — it's called the **carry flag (CF)** — and it waits there. If the program doesn't look
at that flag (with `jc` / `jnc` on x86), the overflow is treated as if it **never happened.**

The hardware is telling you. The software isn't listening.

---

## 🔒 The Security Bridge

Now let's get to why that wire matters.

First a distinction, because these get mixed up constantly:

| | what it means |
|---|---|
| **integer overflow** | a number doesn't fit in its bits and wraps around (what you just built) |
| **buffer overflow** | writing outside the memory region that was allocated |

**These are not the same thing.** But one gives birth to the other, and the classic route
runs exactly through the `+1` circuit you built in this lesson:

```c
n   = 65535;
buf = malloc(n + 1);        // n+1 WRAPS → malloc(0), zero bytes allocated
for (i = 0; i <= n; i++)
    buf[i] = ...;           // writes 65536 times → buffer overflow
```

> ⚠️ The subtlety here: **it isn't that there's no bounds check — there IS one.** The
> programmer allocated `n + 1` bytes and thought correctly. But because *the check itself*
> overflowed, it saw a small number and waved it through. The overflow **toppled the check.**

This chain has an official name: **CWE-190** (integer overflow) → **CWE-787** (out-of-bounds
write). For years it has been one of the most productive vulnerability classes there is.

And its root is in that single wire you deliberately left dangling:

> 🔑 **The vulnerability is not in the wrapping, it's in ignoring the wrapping.**

---

## 🎮 Now You Build It

**Task:** NandGame → **Increment** level.

What you have: `add 16`, `inv`, the constant `0`, `nand`, `xor`.

Answer three questions in order: which pin does the input go to? Where does the `1` come
from and where does it go? Where does the carry output go?

<details>
<summary>🔒 Solution schematic — try it yourself first, then open</summary>

1. Wire the 16-bit input to `add 16`'s **`A`** pin.
2. The **`B`** pin must stay 0. (If you leave it unconnected NandGame reads it as 0 anyway —
   but do it knowingly, don't take it for a coincidence.)
3. Constant **`0`** → **`inv`** → feed the resulting **`1`** into `add 16`'s bottom **`c`** pin.
4. **`S`** → to the output.
5. The top **`c`** → **nowhere.** That is the lesson itself.

</details>

---

## Closing: Making an Adder Subtract

The next level is going to ask you for `A − B`. You'll look at the toolbox and you'll see
this:

**There is no box called "subtract 16".**

All you have is a tool that adds. So how are you going to subtract?

The answer to that question explains how computers hold negative numbers — and why the
pattern `1111111111111111` sometimes means 65535 and sometimes means −1.

In this lesson one wire was deliberately left dangling. But first we'll take a short break:
we'll talk about the mathematics sitting on top of that wire, and why it has been feeding a
vulnerability class for years. After that, the very same wrapping behaviour will produce
**negative numbers themselves.**

---

## Summary — Keep in Mind

```
☐ A 16-bundle isn't a new concept — it's 16 wires drawn as one line.
☐ add 16 = the 16-digit version of the chain you built. Same pins, wider.
☐ The same box has two c pins: BOTTOM is the carry in, TOP is the carry out.
☐ The cheapest place to inject a "1" into a circuit is the carry-in pin (1 wire, not 16).
☐ There is no constant 1, but inv(0) = 1. Zero + inv builds any constant you need.
☐ 65535 + 1 = 0. The 17th bit doesn't fit, the counter wraps to the start.
☐ The carry IS COMPUTED and sits on the pin. Not lost — unread. (In a CPU: the carry flag.)
☐ integer overflow ≠ buffer overflow, but the first gives birth to the second (CWE-190→787).
☐ A bounds check may exist; when the thing that overflows IS the check, the check topples.
☐ The vulnerability is not in the wrapping, it's in ignoring the wrapping.
```

---

## 🔗 Related Topics

- 👾 **For the curious:** when the overflow topples the check — [CWE-190](../cwe/cwe_190.md) → [CWE-680](../cwe/cwe_680.md) → [CWE-787](../cwe/cwe_787.md)
- [07_multibit_adder.md](./07_multibit_adder.md) — The chain inside `add 16`
- [03.5_soyutlama_merdiveni.md](./03.5_soyutlama_merdiveni.md) — A bundle = the floor above "wire"
- [04_teller_sayi_olunca.md](./04_teller_sayi_olunca.md) — What happens when the digits run out

---

**Previous topic:** [07_multibit_adder.md](./07_multibit_adder.md)
**Next topic:** [08.5_sayac_basa_donunce.md](./08.5_sayac_basa_donunce.md) — Interlude: wrapping and CWE-190

*This lesson is part of the "From Switches to a Computer" series. The series moves along together with [nandgame.com](https://nandgame.com).*
