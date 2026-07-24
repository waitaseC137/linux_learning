# 🔢 x86 Assembly — Numbers: The Way the Machine Counts

> The machine doesn't write numbers the way you do. Inside there is only **on** and **off** —
> that is, only two digits: 1 and 0. This gives rise to long, tiring-to-read numbers; so people write
> them with a short notation called **hexadecimal**. The only goal of this lesson is for you to be able to
> *read* the machine's numbers. Not to do arithmetic — to read. So that when `0xff` shows up in GDB you don't
> say "what on earth is this?"

> **There is no code in this lesson, and no math homework at all.** We'll learn binary and hexadecimal only
> enough to *recognize* them. No four operations by hand, no memorization. Promise: this is not the thing you feared.

---

## 📋 Table of Contents

- [Don't Be Afraid: This Is Not Math, It's Literacy](#dont-be-afraid-this-is-not-math-its-literacy)
- [Why Binary? Because Inside There's Only On/Off](#why-binary-because-inside-theres-only-onoff)
- [You Already Know the Decimal System](#you-already-know-the-decimal-system)
- [Binary: Same Idea, Just Two Digits](#binary-same-idea-just-two-digits)
- [Why Is a Byte 0–255? (The Answer from 01)](#why-is-a-byte-0255-the-answer-from-01)
- [Hexadecimal: A Shorthand for Humans](#hexadecimal-a-shorthand-for-humans)
- ["Reading" Hex (Not Calculating It)](#reading-hex-not-calculating-it)
- [Where Will I See This?](#where-will-i-see-this)
- [Appendix: Why Is a Byte 8 Bits? (History and Reasons)](#appendix-why-is-a-byte-8-bits-history-and-reasons)

---

## Don't Be Afraid: This Is Not Math, It's Literacy

Most people, when they hear the phrase "binary number system," remember the nightmare math from school. There's nothing like that here.

Imagine you're learning a foreign alphabet. Your goal isn't to write poetry in that language; it's just to be able to **read** the signs. That's our concern too: the machine writes numbers in its own alphabet (1s and 0s, or their shorthand, hex), and we're going to learn to read those signs. You don't need to do any addition or subtraction by hand — the computer already does that.

> 🔑 The single goal of this lesson: when you see something like `1011` or `0xff`, to be able to say "this is a number, roughly this big." You don't need to be a fluent translator; being *literate* is enough.

---

## Why Binary? Because Inside There's Only On/Off

In the previous lesson we thought of the computer as "numbered boxes + a worker." So how does the number inside those boxes *physically* sit there?

The inside of a computer is nothing but billions of tiny **switches**. Each switch is either **on** or **off** — like a light switch, no in-between. These are all the "digits" the machine has to work with:

```
 on   →  1
 off  →  0
```

Only two symbols. That's why the machine has to write every number with these two digits — this is called **binary**. Everything you see (numbers, letters, images, music) ultimately comes down to these sequences of on/off switches.

A single switch (a single on/off) is called a **bit**. A bit is the smallest piece of information in a computer: either 0 or 1.

> 💡 "Why 2 digits instead of 10?" Because there are two states a switch can reliably tell apart: present/absent, on/off. The machine can't reliably hold something like "exactly 63% on." Two states are solid and clear — and that's why the machine counts in binary.

---

## You Already Know the Decimal System

You've actually used the idea of "place value" your whole life, you just never named it. Look at this number: **347**

```
   3      4      7
   ↓      ↓      ↓
  3×100  4×10   7×1     →  300 + 40 + 7 = 347
```

So every digit has a **value**: rightmost the ones, then tens, then hundreds... These values go 1, 10, 100, 1000 — that is, **powers of 10.** Why 10? Because we have **10 digits** (0–9).

Here's the whole secret: **binary is exactly the same system, only because it has 2 digits instead of 10, the place values are powers of 2.** You're not learning anything new; you're doing what you already know with a different number of digits.

---

## Binary: Same Idea, Just Two Digits

In decimal the places grew 1, 10, 100… In binary they grow 1, 2, 4, 8, 16… (doubling at each step):

```
 ... 128   64   32   16    8    4    2    1     ← place values (powers of 2)
```

To read a binary number, you add up the values of the places that are **1**. Example — `1011`:

```
 place value:      8   4   2   1
 bit:              1   0   1   1
                   ↓   ↓   ↓   ↓
                   8 + 0 + 2 + 1   =  11
```

So binary `1011` is the number **11** that we know. One more example — `110`:

```
 place value:      4   2   1
 bit:              1   1   0    →  4 + 2 + 0 = 6
```

That's all. "Add up the values of the ones." You don't even need to grab paper and practice it; seeing the logic is enough.

---

## Why Is a Byte 0–255? (The Answer from 01)

If you recall, in the first lesson I said "each box holds a number between 0–255, and we'll see later why it's 255." Here's the answer.

The computer uses bits not one by one, but **in groups.** A group of 8 bits is called a **byte** — that is, 8 switches side by side. Those "boxes" of memory are each a byte.

With 8 switches, what's the smallest and largest number?

```
 Smallest:  0 0 0 0 0 0 0 0   →  all off  =  0

 Largest:   1 1 1 1 1 1 1 1   →  all on
 values:   128 64 32 16 8 4 2 1
         = 128+64+32+16+8+4+2+1 = 255
```

> 🔑 So 8 bits can hold a total of **256** different values, **from 0 to 255.** That's the answer to "why 255?": the largest number reached when all 8 switches of a byte are on is 255. For larger numbers the machine uses several bytes side by side (we'll see this later).

> 💡 **Something you might be wondering:** *"If a box holds at most 255, then where does my score of 5000 in a game, or my money in the bank, sit?"* It doesn't fit in one box — the machine spreads the big number across **several consecutive boxes** (we touched on this above). How these boxes are counted as a single big number, and the question "how does the worker know they're a single number and not 4 separate small numbers?", we explain exactly in [04_bellek_ve_registerlar](./04_bellek_ve_registerlar.md).

> 💡 **But why exactly 8 switches — why not 7 or 9?** And why is the maximum therefore 255? This isn't actually a math rule, it's a historical **choice.** We explain both the reason and the story in detail in the [Appendix: Why Is a Byte 8 Bits?](#appendix-why-is-a-byte-8-bits-history-and-reasons) section at the very end of the lesson. For now it's enough to say "groups of 8 are a convention, and we explain why at the end."

---

## Hexadecimal: A Shorthand for Humans

Binary is great for the machine but tiring for humans: writing and reading `11111111` strains the eyes and is easy to get wrong. The solution is **hexadecimal** (hexadecimal, or *hex* for short).

Hex has one neat trick: **4 bits correspond exactly to a single hex digit.** (Because 4 bits write 16 different values, and hex also has 16 digits.) Since 16 digits don't end at 0–9, the ones from 10 to 15 are written with letters:

```
 binary  hex          binary  hex
 0000  =  0           1000  =  8
 0001  =  1           1001  =  9
 0010  =  2           1010  =  A   (10)
 0011  =  3           1011  =  B   (11)
 0100  =  4           1100  =  C   (12)
 0101  =  5           1101  =  D   (13)
 0110  =  6           1110  =  E   (14)
 0111  =  7           1111  =  F   (15)
```

A byte is 8 bits; 8 bits = two groups of 4 = **exactly 2 hex digits.** Here's the short form of that tiring byte:

```
 binary:   1111 1111
 hex:        F    F     →  written:  0xFF
 decimal:  255
```

The leading `0x` is placed to say "attention, this is a hex number" — otherwise we'd confuse whether `FF` is a number or letters. When you see `0xFF`, you read it as "a single byte, all on, i.e. 255."

> 💡 That's the entire reason hex exists: a faithful, one-to-one but **short** way of writing binary. That's why at the low level (assembly, GDB, memory dumps) numbers are almost always written in hex. It doesn't hide the binary — it just tidies it up.

---

## "Reading" Hex (Not Calculating It)

Now the most reassuring part: **you don't have to convert hex to decimal in your head.** The trick of it is recognition:

- If you see `0x` in front → "this is a raw machine number / address."
- `0xFF` → a byte, all its bits on (255).
- Something long like `0x080484b6` → not scary; it's just a **box number** (an address), written in short form. The numbers of the boxes in the warehouse from the previous lesson look exactly like this.

When you need the exact number, **let the computer do the conversion.** For example, in the terminal (recall from lesson 02) you can type `python3` and try these:

```
>>> 0xff
255
>>> 0b1011
11
```

So when you type `0x...` it tells you the decimal equivalent, and the same for `0b...` (binary). No need to fuss by hand; the goal is to *recognize* these notations.

> 🔑 The literacy bar is this much: (1) `0x` = hex, `0b` = binary; (2) one byte = 2 hex digits; (3) when you see it, not panicking and being able to say "this is a number/address." Over time, familiarity by sight comes on its own.

---

## Where Will I See This?

If this lesson felt abstract, you'll see its payoff concretely very soon. Later, when tracing programs with GDB (lesson 07), the screen will be full of things like this:

```
 eax = 0x5
 ebx = 0xffffd6a4
 address 0x08048000 ...
```

From today on, these are no longer meaningless charms: `eax = 0x5` → "there's a 5 in the EAX box"; `0xffffd6a4` → "an address, i.e. a box number." You've learned to read the machine language of numbers; the rest will settle in with practice.

---

## Summary — Keep in Mind

```
☐ Goal: to READ machine numbers (not calculate). Not math homework, literacy.
☐ Inside there's only on(1)/off(0) → the machine counts in BINARY. One switch = 1 bit.
☐ Binary is the same as decimal; place values are powers of 2, not 10: 1,2,4,8,16,32,64,128...
    - Reading = add up the values of the places that are 1.  (1011 = 8+2+1 = 11)
☐ 1 byte = 8 bits → largest 11111111 = 255. So a byte is 0–255 (256 values). [the answer from 01]
☐ "8" is not a law of nature, but a historical choice (a letter fits + 2 BCD digits + power of 2). Detail: the Appendix at the end.
☐ HEX = the short form of binary. 4 bits = 1 hex digit; 1 byte = 2 hex digits.
    - Digits: 0–9, then A,B,C,D,E,F (10–15). 0x goes in front. E.g.: 11111111 = 0xFF = 255.
☐ Don't do the conversion by hand: in python3, 0xff → 255, 0b1011 → 11. You just RECOGNIZE.
☐ The bar: 0x=hex, 0b=binary; byte=2 hex digits; when you see it, say "this is a number/address."
```

---

## Appendix: Why Is a Byte 8 Bits? (History and Reasons)

> This section is for the curious. Skipping it won't stop you from understanding the rest of the lesson — but if you asked above "why is a byte exactly 8?", the answer (and its story) is here. And the story is actually a good one.

### First, the most important fact: 8 is not a rule, it's a choice

There is **no** law in math or physics that says "a byte must be 8 bits." You can group bits in any number you like; the question is only "how many to a group?" Indeed, the first computers were complete chaos on this front — every machine chose its own size. "8" is a convention that later won out for specific reasons.

### Where does the word "byte" come from?

The term was coined in 1956 by IBM engineer **Werner Buchholz**, while IBM's first transistorized supercomputer "Stretch" (IBM 7030) was being designed. Buchholz deliberately spelled the English word *bite* (a mouthful) as *byte* so it wouldn't be confused with "bit" — so a byte roughly meant "a mouthful of bits the machine bites off and processes at once."

The interesting thing is: on Stretch, the size of a byte was **not fixed.** The machine could address individual bits, and how many bits a byte would be was specified inside the instruction (variable length). So at the start "byte" didn't yet mean "8 bits"; it just meant "a group of bits."

### Before standardization: the chaos of bit sizes

Before 8 was standardized, machines tried every route:

```
 4 bit  → BCD: to write a single decimal digit (0–9)
 5 bit  → Baudot: old telex/telegraph code
 6 bit  → BCDIC, military Fieldata: letter+digit+symbol (weak upper/lower case distinction)
 ...    → word sizes also varied widely, like 12, 36, 60 bit
```

36-bit machines (for example the PDP-10) were common into the 1970s. In that era numbers were often written in **octal**, because word sizes were multiples of 3. So the world of "everything in hex" didn't exist yet.

### The standardization of 8: IBM System/360 (1964)

The turning point was the **IBM System/360** (announced in 1964). This machine **fixed the byte at 8 bits**, made memory addressable byte by byte, and introduced an 8-bit character encoding called **EBCDIC**. Because System/360 was a colossal commercial success, the 8-bit byte became the de facto standard for the whole world. Then Intel's 8008/8080 microprocessors carried this 8-bit tradition into the personal-computer era; everything you have today is built on top of it.

Fred Brooks, one of the chief architects of System/360, later said "the most important technical decision of my career was choosing the 8-bit byte for the 360" — his wager was that **text/character processing** would become more important than pure decimal arithmetic. It turned out right.

### So why exactly 8? (three reasons came together)

1. **So that a letter fits exactly (character encoding).** 6 bits give only 64 possibilities — not enough for uppercase + lowercase + digits + punctuation. 8 bits give 256 possibilities: room for a whole character set, and even accented/extra characters on top. (7-bit ASCII was enough for English; going to 8 left room both for extra characters and for error checking/parity.) In short, "1 byte = 1 character" sat comfortably.

2. **Practical for decimal (BCD) arithmetic.** The business/finance machines of that era worked with decimal numbers, and a decimal digit was written in 4 bits (BCD). Two 4-bit digits fit exactly into one 8-bit byte. So 8 sat cleanly into the decimal world too.

3. **A power of 2 / hardware-friendly.** 8 = 2³. Binary addressing, memory layout, and data buses work cleanly with powers of 2. Moreover, 8 divides into two 4-bit groups — that is, into the **two hex digits** you just learned. That's exactly why a byte is exactly 2 hex digits. Had it been 9 bits, it would neither sit cleanly into hex nor have this alignment.

### There's also "octet"

In some places (especially in networking/communication standards, in RFCs) you'll see the word **octet** instead of byte. The reason is precisely this history: because "byte" hasn't always been 8 bits in the past, those who want to say "definitely 8 bits" use the unambiguous term "octet." So when you see octet, read it as "exactly 8 bits."

### And the essence of the "why 255?" question

Now it's clear why 255 is 255: because a byte was fixed at 8 bits, 8 bits hold `2⁸ = 256` different values, i.e. **0–255.** Had the convention been 7 bits the largest number would be 127, had it been 9 bits it would be 511. So 255 is not a magic number; it's the **direct arithmetic result of the 8-bit tradition** chosen for the reasons above. First (for those reasons) came 8, and 255 fell out of it.

> 🔑 Summary: "byte = 8 bits" is not a law of nature, but a historical agreement. 8 was settled on so that a letter fits (256 characters), two decimal digits are packed (2×4 bits), and it comes out "round" to the machine (a power of 2, two hex digits); IBM System/360 made it the standard. And 255 is the natural consequence of that 8.

---

## 🔗 Related Topics

- [01_bilgisayar_nedir.md](./01_bilgisayar_nedir.md) — Boxes, the byte, and the "why 0–255" question
- [04_bellek_ve_registerlar.md](./04_bellek_ve_registerlar.md) — Where addresses (box numbers) are written in hex
- [07_gdb_tek_adim.md](./07_gdb_tek_adim.md) — The lesson where you'll see registers and addresses live, in hex

---

**Previous topic:** [02_terminal_ile_tanisma.md](./02_terminal_ile_tanisma.md)
**Next topic:** [04_bellek_ve_registerlar.md](./04_bellek_ve_registerlar.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
