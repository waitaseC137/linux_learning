# 🎛️ x86 Assembly — Bit Operations: `and`, `or`, `xor` and Shifting

> I owe you a debt from 10 and 11. We used the `test eax, eax` ("is it zero?") and `test eax, 1` ("is it odd?") instructions, but I put off what actually happens inside them as a *"closed box, we'll open it in 13."* Well, here we are in 13 — we're opening that box.
> But first, one thing to understand: the instructions so far (`add`, `sub`) treated numbers as **a whole**. In this lesson, for the first time, we'll touch the number's **individual bits** — those 1's and 0's you met in 03 are now in our hands one at a time.

> **This lesson has code and we run all of it.** Every program and every exit code below is real: I compiled and ran them on my own machine.

---

## 📋 Table of Contents

- [Working Bit by Bit: How It Differs from Addition](#working-bit-by-bit-how-it-differs-from-addition)
- [`and`: Filtering Bits with a Mask](#and-filtering-bits-with-a-mask)
- [`or` and `xor`: Setting and Flipping Bits](#or-and-xor-setting-and-flipping-bits)
- [`xor eax, eax`: The Most Common 'Zero It Out'](#xor-eax-eax-the-most-common-zero-it-out)
- [Shifting: `shl` / `shr` = Fast ×2 and ÷2](#shifting-shl--shr--fast-2-and-2)
- [Paying the Debt: `test` Was Really `and`](#paying-the-debt-test-was-really-and)

---

## Working Bit by Bit: How It Differs from Addition

When you do `add eax, 1`, something happens: if the number overflows, a **carry** passes to the next digit (like `9 + 1 = 10` in 09, but in binary). So addition **talks** between digits — one bit affects another.

Bit operations are **not** like that. Each bit is processed **on its own** with the bit across from it; it never looks at its neighbor, and there is no such thing as a carry. Write the two numbers one above the other, process each column separately — done. This is why bit operations are both very simple and very fast.

There are three basic bit operations, and each answers a single question. For two bits (a and b), the rules — the **truth table** — are:

```
   a b │ and │ or  │ xor
   ────┼─────┼─────┼─────
   0 0 │  0  │  0  │  0
   0 1 │  0  │  1  │  1
   1 0 │  0  │  1  │  1
   1 1 │  1  │  1  │  0
```

In words:
- **`and`** ("and"): 1 if **both are 1**. (Stubborn: if there's the slightest 0, it's 0.)
- **`or`** ("or"): 1 if **at least one is 1**. (Generous: if there's the slightest 1, it's 1.)
- **`xor`** ("exclusive or"): 1 if **exactly one is 1**; if the two are the same (0-0 or 1-1), 0. (The differ-er: it asks "are they different?")

> 🔑 Bit operations process a number **bit by bit**, without a carry (unlike addition, where digits mix into each other). `and` = are both 1, `or` = is at least one 1, `xor` = is one different from the other. Their rules are the truth table above.

---

## `and`: Filtering Bits with a Mask

The most common job for `and` is the **mask**: looking at only the bits **you want** of a number and zeroing the rest. The logic comes from the table: if you `and` a bit with `1`, it **stays as is** (`1 and 1 = 1`, `0 and 1 = 0`); if you `and` it with `0`, it gets **wiped** (`x and 0 = 0`). So the places where you put `1` "let through," the places where you put `0` "shut off" — just like a stencil.

`vebit.asm` — `13 and 6`:

```nasm
section .text
    global _start

_start:
    mov eax, 13         ; 1101
    and eax, 6          ; 0110
    mov ebx, eax
    mov eax, 1
    int 0x80
```

Column by column (recall from 03, bits from right to left):

```
   1101   (13)
   0110   (6)   ← mask
   ────  and  (each column: are both 1?)
   0100   (4)
```

Run it, `echo $?`:

```
4
```

Where the mask was `1` (the middle two bits), 13's bits were filtered and passed through; where it was `0`, they were wiped. The result is `4`.

There's a **very** familiar use of this: the even-odd test from 11. If you `and` a number with `1` (that is, `0001`), **only the lowest bit** survives — and that tells you whether the number is odd/even (03). `vetek.asm`, `mov eax, 7` + `and eax, 1`:

```
1
```

`7 and 1 = 1` → lowest bit is 1 → odd. This is exactly what `test eax, 1` was really doing back in 11 (we'll tie it together completely in a moment).

> 🔑 `and` is a **mask**: bits that are `1` in the mask pass through, bits that are `0` get wiped. It's the way to say "I want only these bits of this number." `and eax, 1` → only the lowest bit remains (odd/even test).

---

## `or` and `xor`: Setting and Flipping Bits

`or`'s typical job is the opposite of `and`'s: **setting** a bit (making it 1). If you `or` a bit with `1`, it's guaranteed to become 1 (`x or 1 = 1`); if you `or` it with `0`, it stays as is. So it's the way to say "definitely make these bits 1, leave the rest alone." `veyabit.asm`, `12 or 3`:

```
   1100   (12)
   0011   (3)
   ────  or  (each column: is at least one 1?)
   1111   (15)
```

```
15
```

`xor`, on the other hand, **flips**. If you `xor` a bit with `1`, it turns to its opposite (`0→1`, `1→0`); if you `xor` it with `0`, it stays as is. So it means "flip these bits." But where `xor` is really famous is the little magic — pardon, little **trick** — in the next section.

> 🔑 `or` **sets** a bit (definitely makes the mask's 1's into 1); `xor` **flips** a bit (turns the mask's 1's to their opposite). `and` filters/wipes, `or` sets, `xor` flips — three stencil operations.

---

## `xor eax, eax`: The Most Common 'Zero It Out'

When you look at assembly code, you'll see this almost everywhere:

```nasm
xor eax, eax
```

At first glance it's odd: "xor eax with eax"? Look at the truth table — `xor` was asking "are the two bits **different**?" But if you xor a number with **itself**, each bit meets itself: `0 xor 0 = 0`, `1 xor 1 = 0`. Since every column is the same, **they all come out 0.** So `xor eax, eax` **zeroes out** eax, no matter what's inside it.

`xorsifir.asm`:

```nasm
section .text
    global _start

_start:
    mov eax, 123        ; full inside
    xor eax, eax        ; xor with itself → 0
    mov ebx, eax
    mov eax, 1
    int 0x80
```

Let's catch the exact moment in GDB:

```
(gdb) starti
(gdb) si                    # mov eax, 123
(gdb) info registers eax
eax            0x7b                123
(gdb) si                    # xor eax, eax
(gdb) info registers eax
eax            0x0                 0
```

`123` (`0x7b`) became `0` in an instant. `echo $?` also gives `0`.

So why this instead of `mov eax, 0`? Both zero out eax — but `xor eax, eax` takes up **less** space in machine code (and the processor loves it). This is why it's the *idiomatic* way to say "zero it out"; in other people's code you'll see `xor eax, eax` far more often than `mov eax, 0`. Now when you see it, you'll know what it is: "this just means eax = 0."

> 🔑 `xor eax, eax` = **zero out eax.** When a number is xored with itself, each bit becomes `1 xor 1 = 0` / `0 xor 0 = 0` → all 0. Same result as `mov eax, 0` but encoded shorter; that's why it's the standard idiom for "zero it out." Don't stumble when you see it.

---

## Shifting: `shl` / `shr` = Fast ×2 and ÷2

The last two bit instructions **shift bits sideways**:

- `shl destination, n` → **shift left:** push all bits `n` places to the **left**, fill in with zeros from the right.
- `shr destination, n` → **shift right:** push all bits `n` places to the **right**.

Their magic comes from 03. In a decimal number, pushing a digit left and putting a 0 on the right (`5` → `50`) makes the number **×10**. Since binary's base is 2, shifting left by one is **×2**:

```
    5  =  0000 0101
  5<<1 =  0000 1010  = 10   (×2)
  5<<3 =  0010 1000  = 40   (×2×2×2 = ×8)
```

`kaydir.asm`, `mov eax, 5` + `shl eax, 3`:

```
40
```

`5 << 3 = 5 × 2³ = 5 × 8 = 40`. The same logic in reverse: `shr` is **÷2** at each step. `kaydir2.asm`, `mov eax, 20` + `shr eax, 2`:

```
5
```

`20 >> 2 = 20 ÷ 2² = 20 ÷ 4 = 5`. Processors love this: a shift is **much faster** than a full multiply/divide. That's why, when multiplication/division by a power of 2 is needed, compilers often use `shl`/`shr` — so later, when you look at a C program's assembly (lesson 19) and see `shl ..., 3` instead of `× 8`, don't be surprised.

> 🔑 `shl x, n` = shift bits left = **× 2ⁿ**;  `shr x, n` = shift right = **÷ 2ⁿ**. In binary, "push left, add zero" is just like "×10" in decimal, but ×2. It's the fast way to multiply/divide; it comes free for powers of 2. (Small caveat: `shr`'s "÷2" holds only for unsigned numbers — to divide a negative number you need `sar`; `shl`, on the other hand, is a clean ×2 in both cases.)

---

## Paying the Debt: `test` Was Really `and`

Now we can open the closed box I left back in 10 and 11. `test` is the **"result thrown away"** form of an operation you learned in this lesson — just as `cmp` is the result-thrown-away form of `sub` (10):

```
   cmp  = sub  but throws away the result, only sets flags
   test = and  but throws away the result, only sets flags
```

So `test eax, eax` does `eax and eax` inside (it doesn't write the result anywhere), it only looks at the flags. Since `x and x = x`, the result is eax itself; if eax is **zero**, the result is zero → **ZF is set.** This is exactly the "is eax zero?" from 10.

And `test eax, 1`? Now it's plain: `eax and 1` = **only the lowest bit**. If the lowest bit is 1 (odd number), the result is not zero → ZF off; if it's 0 (even), the result is zero → ZF on. This was the whole mechanism of the even-odd test in 11 — the flag version of this section's `vetek.asm` (`7 and 1 = 1`).

> 🔑 `test a, b` = `and a, b` but throws away the result, only sets flags (the same as `cmp`'s relationship to `sub`). `test eax, eax` → "is eax zero" (ZF); `test eax, 1` → "is eax odd" (lowest bit). This was the closed box in 10-11; now you've seen it.

---

## Summary — Keep in Mind

```
☐ Bit operations process a number BIT BY BIT (NO carry, digits don't mix). Truth table:
    and = are both 1   |  or = is at least one 1  |  xor = are they different (one 1 one 0)
☐ and = MASK/FILTER: what's 1 in the mask passes, what's 0 gets wiped.   13 and 6 = 4 ;  x and 1 = lowest bit (odd/even).
☐ or  = SET a bit (definitely make it 1):    12 or 3 = 15.
☐ xor = FLIP a bit (opposite).  SPECIAL: xor eax, eax = ZERO OUT eax (xor with itself → always 0). The short/idiomatic form of mov eax,0.
☐ shl x, n = shift left = × 2ⁿ   (5 << 3 = 40).
   shr x, n = shift right = ÷ 2ⁿ   (20 >> 2 = 5).   The fast way to multiply/divide (powers of 2).
   Note: shr's ÷2 is only for unsigned numbers; to divide a negative you need sar.
☐ DEBT PAID:  test = and but throws away the result (same idea as cmp = sub but throws away the result).
    test eax,eax → "is it zero" (ZF) ;  test eax,1 → "is it odd".  This was the closed box in 10-11.
☐ Verified: 13&6=4, 12|3=15, xor eax,eax→0 (gdb 123→0), 7&1=1, 5<<3=40, 20>>2=5.
```

---

## 🔗 Related Topics

- [03_sayilar_ikilik_onaltilik.md](./03_sayilar_ikilik_onaltilik.md) — Bits, binary digits, and the root of the "shift left = ×base" intuition
- [10_bayraklar_ve_cmp.md](./10_bayraklar_ve_cmp.md) — The idea that `test` is the "throw away the result, set flags" sibling; `cmp = sub`'s counterpart here
- [11_ziplamalar.md](./11_ziplamalar.md) — The even-odd decision with `test eax, 1`; its mechanism (`and`) was opened right here in this lesson
- [09_aritmetik.md](./09_aritmetik.md) — The "carry-bearing" nature of addition; its contrast with the "carry-free" nature of bit operations

---

**Previous topic:** [12_donguler.md](./12_donguler.md)
**Next topic:** [14_stack.md](./14_stack.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
