# ➕ x86 Assembly — Arithmetic: `add`, `sub`, and the Secret of Negative Numbers

> In 04 we sketched the worker's dance: **FETCH** (from storage to the pocket) → **WORK** (compute in the pocket) → **DROP** (from the pocket back to storage).
> In 08 we did **FETCH** and **DROP** with the real `mov` instruction — but the middle step, **WORK**, stayed empty: we kept moving things around, never actually *computing.*
> That missing piece gets filled in this lesson. With `add` and `sub` you make the machine do a **calculation** for the first time; then we pay off a debt we left in 06 — "how do negative numbers fit into a byte?"

> **This lesson has code, and we run all of it.** Every program and every GDB output below is real: I assembled and ran them on my own machine, and the numbers you see are not made up.

---

## 📋 Table of Contents

- [`add`: The Worker's Add Order](#add-the-workers-add-order)
- [The First Calculation Program](#the-first-calculation-program)
- [Watch It in GDB: Addition Live](#watch-it-in-gdb-addition-live)
- [`sub`: Subtraction](#sub-subtraction)
- [`inc` / `dec`: Add One, Subtract One](#inc--dec-add-one-subtract-one)
- [The Secret of Negative Numbers: Two's Complement](#the-secret-of-negative-numbers-twos-complement)
- [The Whole Dance: FETCH → WORK → DROP](#the-whole-dance-fetch--work--drop)

---

## `add`: The Worker's Add Order

In 01, when we looked at the kinds of orders the worker can take, we put "**compute**" in second place. The most basic one is addition, and its real name is `add` (English *add*, "to add").

Its spelling looks a lot like `mov` — it takes two boxes:

```nasm
add destination, source  ; "into destination, ADD source"
```

But there's one difference from `mov`, and the whole point is in that difference:

- `mov eax, 3` → eax's old value is **erased**, and 3 takes its place. (*puts*)
- `add eax, 3` → eax's old value **stays**, and 3 is added on top. (*adds*)

So `add` doesn't zero out the target; it puts it **on top of what's already there**. If eax holds 5 and you say `add eax, 3`, eax now becomes 8 (5 + 3). This is the most basic form of 04's **WORK** step.

> 🔑 `add destination, source` = "destination = destination + source." Unlike `mov`, it doesn't erase the old value, it adds on top. `mov` puts, `add` accumulates.

---

## The First Calculation Program

Now let's make the machine do an addition for the first time. `topla.asm`:

```nasm
section .text
    global _start

_start:
    mov eax, 5          ; eax = 5
    add eax, 3          ; eax = 5 + 3 = 8
    mov ebx, eax        ; result into the exit code
    mov eax, 1
    int 0x80
```

You can now read every one of these lines: `mov eax, 5` puts down the five, `add eax, 3` adds three on top (eax = 8), `mov ebx, eax` moves the result into the exit code. Assemble, link, and run with the familiar chain:

```
nasm -f elf32 topla.asm -o topla.o
ld -m elf_i386 topla.o -o topla
./topla
echo $?
```

What you'll see (in the fish shell, `echo $status`):

```
8
```

**There's your first calculation.** You didn't write this `8` directly — the machine did `5 + 3` *itself.* In 06 you were *telling* the machine a number; now you're making it *perform* an operation.

---

## Watch It in GDB: Addition Live

Recall from 06 the "difference between knowing and seeing." Let's watch with our own eyes how `add` changes eax (the habit from 07):

```
gdb ./topla
(gdb) set disassembly-flavor intel
(gdb) starti
```

First run `mov eax, 5`, then look at eax:

```
(gdb) si
(gdb) info registers eax
```
```
eax            0x5                 5
```

`eax` is now `5`. Now for the main event — `add eax, 3`:

```
(gdb) si
(gdb) info registers eax
```
```
eax            0x8                 8
```

**There's WORK.** `eax` went from `5` to `8` — the machine added right before your eyes. `add` didn't erase the old 5; it added 3 on top. The "compute in the pocket" step we sketched as a rough draft in 04 you've now done for the first time with a real instruction.

---

## `sub`: Subtraction

Subtraction is addition's sibling: `sub` (English *subtract*). The rule is exactly the same, it just subtracts instead of adds:

```nasm
sub destination, source  ; "destination = destination − source"
```

`cikar.asm`:

```nasm
section .text
    global _start

_start:
    mov eax, 10         ; eax = 10
    sub eax, 4          ; eax = 10 − 4 = 6
    mov ebx, eax
    mov eax, 1
    int 0x80
```

Assemble, link, run, `echo $?`:

```
6
```

`10 − 4 = 6`. `add` and `sub` — the worker's two basic calculations. Both follow the same template: "update the target with the source." Addition accumulates, subtraction diminishes.

> 💡 While doing `add`/`sub`, the worker also keeps little notes on the side: "did the result come out zero? did it overflow?" and so on. These notes are called **flags** (*flag*), and we're ignoring them for now — but in the next lesson (10) they'll be the foundation of every *decision* (if, loop). For now, "add adds, sub subtracts" is enough.

---

## `inc` / `dec`: Add One, Subtract One

Two more tiny instructions you'll need very often — to increase or decrease a number by **exactly 1**:

- `inc destination` → increase the target by 1 (*increment*). `inc eax` does the same job as `add eax, 1`.
- `dec destination` → decrease the target by 1 (*decrement*). `dec eax` = `sub eax, 1`.

`incdec.asm`:

```nasm
section .text
    global _start

_start:
    mov eax, 7          ; 7
    inc eax             ; 8
    inc eax             ; 9
    dec eax             ; 8
    mov ebx, eax
    mov eax, 1
    int 0x80
```

`echo $?`:

```
8
```

`7 → 8 → 9 → 8`. Why a separate instruction? Because "counting one by one" is so common (especially in loops) that the machine gave it a shortcut. While advancing a counter you'll see `inc` constantly.

---

## The Secret of Negative Numbers: Two's Complement

Now we keep the promise we made in 06. There, when we did `mov ebx, -5`, we saw `echo $?` say **251**, and we said "we'll explain how in 09." Here we are in 09.

Let's state the question clearly first. `sub` subtracts — but what happens if the result drops below zero? Let's try. `eksi.asm`: `5 − 8`, that is **−3**.

```nasm
section .text
    global _start

_start:
    mov eax, 5
    sub eax, 8          ; eax = 5 − 8 = −3 ... but how does a negative fit in a byte?
    mov ebx, eax
    mov eax, 1
    int 0x80
```

`echo $?`:

```
253
```

**There's the puzzle.** We expected `−3` but got `253`. Asking GDB opens the secret a bit:

```
(gdb) si                    # mov eax, 5
(gdb) si                    # sub eax, 8
(gdb) info registers eax
```
```
eax            0xfffffffd          -3
```

Look how nicely: GDB shows `eax` both in its raw form (`0xfffffffd`) and as "this is actually **−3**." So the machine holds `−3` in its memory as `0xFFFFFFFD`. But why does this number mean `−3`?

### Think of it like an odometer

When a car's odometer is at `000` and you go **back** one, what happens? It rolls over to `999`. That's exactly the machine's negative logic: **one back from 0 = the very top.**

For a single byte (0–255):

```
   0 − 1  →  255   (that is, 255 means "−1")
   0 − 2  →  254   (   "−2")
   0 − 3  →  253   (   "−3")   ← our result!
```

Just as a number wraps from the bottom when it overflows upward (06: `300 → 44`), when it overflows downward into the negatives it wraps from the **top**. `5 − 8` gives `253`, which corresponds to `−3`. The `−5 → 251` in 06 is exactly this: `−5` = `256 − 5` = `251`.

### The recipe: flip the bits, add 1

There's a short way to produce a number's negative — **flip all the bits, then add 1.** For `3` (as a byte):

```
 3            =  0000 0011
 bits flipped =  1111 1100   (0xFC)
 + 1          =  1111 1101   (0xFD = 253 = −3)
```

So the byte form of `−3` is `0xFD` (253). In 32 bits the same trick is written longer: `0xFFFFFFFD` — exactly what GDB showed above. The name of this "flip + add 1" trick is **two's complement**.

### Why is it so clever? Because there's no such thing as subtraction

Here's the beautiful part, and the peak of 01's theme that "the machine is actually very simple": the machine has **no** separate "subtraction circuit." Subtraction is just **adding the negative.** `5 − 3`, in the machine's eyes, is `5 + (−3)`.

Let's prove it. We said the byte form of `−3` is `253` (in 32 bits, `0xFFFFFFFD`). Then, instead of `5 − 3`, if we directly **add** `0xFFFFFFFD` to `5`, we should also get `2`. `negekle.asm`:

```nasm
section .text
    global _start

_start:
    mov eax, 5
    add eax, 0xFFFFFFFD   ; 5 + (−3 in two's complement form)
    mov ebx, eax
    mov eax, 1
    int 0x80
```

`echo $?`:

```
2
```

**There's the proof.** We didn't write `sub eax, 3` — we added `−3` with `add`, and `5 − 3 = 2` came out. So `sub`, behind the curtain, is nothing more than "add the negative." The machine both adds and subtracts with a single addition circuit; two's complement is the trick that makes it possible.

> 🔑 The machine holds a negative number with **two's complement**: flip the bits + add 1 (`−3` → `0xFD`/`0xFFFFFFFD`). A number that overflows downward wraps from the top (`0−3 → 253`), just like an odometer — this is the answer to the `−5 → 251` puzzle from 06. And the real beauty: subtraction isn't a separate job, it's just **adding the negative** — the machine does both with a single addition circuit.

> 💡 **You might be wondering:** *"How does the machine know whether `253` is `−3` or really `253`?"* It doesn't — and this should feel familiar, because it's [01.5_sayi_ve_anlam](./01.5_sayi_ve_anlam.md) itself: the same bit sequence is `253` in one instruction's eyes and `−3` in another's. The difference is decided by the instruction that says whether to read the number as **signed or unsigned** (GDB, in saying "−3" above, chose the signed reading). The same number, two meanings; the meaning is again given by the code.

---

## The Whole Dance: FETCH → WORK → DROP

Now all three steps are in your hands. In 04 we sketched exactly this task as a rough draft:

```
 Task: add the number in box 100 to the number in box 200, write the result to box 300.
   FETCH: box 100 → EAX
   WORK : add box 200 on top
   DROP : write the result back to the box
```

Back then we said "we'll see the real instructions later." Here they all are, ready. `dans.asm`:

```nasm
section .data
    a:     dd 100
    b:     dd 200
    sonuc: dd 0

section .text
    global _start

_start:
    mov eax, [a]        ; FETCH: pull a into the pocket  (eax = 100)
    add eax, [b]        ; WORK : add b on top            (eax = 300)
    mov [sonuc], eax    ; DROP : drop the result into storage
    mov eax, 1
    mov ebx, 0
    int 0x80
```

A small nicety: in `add eax, [b]` we read the operand **directly from memory** — without first pulling it into the pocket with a separate `mov`. In 04 we made an honest note that "x86 sometimes allows a shortcut, you can touch a memory box directly" — well, this is that shortcut.

Let's watch the dance step by step in GDB:

```
gdb ./dans
(gdb) set disassembly-flavor intel
(gdb) starti
(gdb) si            # FETCH mov eax, [a]
(gdb) si            # WORK  add eax, [b]
(gdb) si            # DROP  mov [sonuc], eax
(gdb) x/1dw &sonuc
```

The real output, step by step:

```
FETCH → eax = 100          (a came from memory into the pocket)
WORK  → eax = 300          (b added on top: 100 + 200)
DROP  → x/1dw &sonuc = 300 (result written to storage)
```

**There's the whole dance.** That picture we sketched from afar in 04 — pull from storage, add in the pocket, drop back to storage — has now turned in your own hands, with real instructions. Everything we called "later" in Unit 0 has come down to here, to a single working program.

> 🔑 `mov [a]` (FETCH) → `add [b]` (WORK) → `mov [sonuc]` (DROP): the whole fetch-work-drop dance of 04, with real instructions. A program is most often a repetition of this skeleton: pull the data, compute on it, store the result.

---

## Summary — Keep in Mind

```
☐ add destination, source  = destination + source → destination.  (mov PUTS, add ADDS: doesn't erase the old, piles on top.)
    - mov eax,5 + add eax,3 → eax = 8.  (the WORK step: 04's missing piece)
☐ sub destination, source  = destination − source → destination.  (10 − 4 = 6.)
☐ inc / dec = increase / decrease by exactly 1.  inc eax ≡ add eax,1 ;  dec eax ≡ sub eax,1. (common in counters.)
☐ Negative numbers = TWO'S COMPLEMENT: flip the bits + add 1. −3 → 0xFD (byte) / 0xFFFFFFFD (32-bit).
    - Downward overflow wraps from the top: 0−3 → 253. (the answer to 06's −5→251.) Since the exit code is a byte, 5−8 → 253.
    - Subtraction is NOT a separate job: sub = "add the negative." The machine does both with a single addition circuit.
      Proof: add eax, 0xFFFFFFFD (i.e. +(−3)) → 2 comes out of 5.
☐ add/sub also keep "flags" on the side (is it zero, did it overflow) → the foundation of decisions, in lesson 10.
☐ The whole dance (dans.asm): mov [a] (FETCH) → add [b] (WORK) → mov [sonuc] (DROP) → sonuc = 300.
    04's 100+200→300 example, now real and working. This is the skeleton of programs.
```

---

## 🔗 Related Topics

- [04_bellek_ve_registerlar.md](./04_bellek_ve_registerlar.md) — where the "FETCH → WORK → DROP" dance was sketched; this lesson fills in its **WORK** step
- [06_ilk_gercek_program.md](./06_ilk_gercek_program.md) — `mov` and the exit code; where the `−5 → 251` puzzle was asked (and here answered)
- [08_mov_ve_bellek.md](./08_mov_ve_bellek.md) — the **FETCH** and **DROP** steps of the dance; reaching into memory with `[...]`
- [01.5_sayi_ve_anlam.md](./01.5_sayi_ve_anlam.md) — "Same number, different meaning": the root of the `253` or `−3`? question
- [07_gdb_tek_adim.md](./07_gdb_tek_adim.md) — watching live what an instruction does with `si` + `info registers`

---

**Previous topic:** [08.5_little_endian.md](./08.5_little_endian.md)
**Next topic:** [10_bayraklar_ve_cmp.md](./10_bayraklar_ve_cmp.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
