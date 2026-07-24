# 🔀 x86 Assembly — Jumps: Making the Worker Decide

> In 10 we set flags, but we admitted honestly: **nothing happened.** `cmp` set a flag, and the program still flowed straight down. We said, "the flag is raw material; the instructions that read it and decide come in 11."
> Here are those instructions: **jumps.** In this lesson, for the first time, we'll break the program's straight top-to-bottom path — "if that flag is set, go here; otherwise keep going from here." What we call a computer "making a decision" is exactly this.

> **This lesson has code, and we run all of it.** Every program, every exit code, and every GDB output below is real: I assembled and ran them on my own machine.

---

## 📋 Table of Contents

- [Breaking the Straight Path: `jmp`](#breaking-the-straight-path-jmp)
- [Conditional Jump: `jz` and `jnz`](#conditional-jump-jz-and-jnz)
- [Jump by Ordering: `jl` and `jg`](#jump-by-ordering-jl-and-jg)
- [Putting It Together: Even or Odd?](#putting-it-together-even-or-odd)

---

## Breaking the Straight Path: `jmp`

Up to now, the worker always did the same thing: start from the topmost instruction, go **line by line downward**, exit at the very end. One path, one direction. That's the first rule we'll break.

The simplest jump instruction is `jmp` (from *jump*): **"don't continue from here, go to that point."** But how do we point out "that point"? With a **label**. You already know labels: `_start:` was a label — the colon (`:`) at its end makes it "a name for this point in memory." We can place our own labels exactly the same way.

`atla.asm` — with `jmp` we **jump over** an instruction:

```nasm
section .text
    global _start

_start:
    mov ebx, 1
    jmp bitir          ; break the straight path → skip below
    mov ebx, 99        ; SKIPPED — this line is never reached
bitir:
    mov eax, 1
    int 0x80
```

The logic is this: we put 1 in `ebx`, then we say `jmp bitir`. The worker leaps straight to the `bitir:` label — the `mov ebx, 99` sitting in between **never runs.** So the exit code should be 1, not 99. Assemble, run:

```
nasm -f elf32 atla.asm -o atla.o
ld -m elf_i386 atla.o -o atla
./atla
echo $?
```

```
1
```

**99 is gone, 1 came back.** `mov ebx, 99` is right there, in plain sight — but it didn't run, because `jmp` jumped over it. For the first time an instruction changed *which instruction was up next* in the program.

Let's see this with our own eyes in GDB, as in 07. The worker's "where am I right now" indicator was `eip` (04.5/07); let's watch it step by step:

```
gdb ./atla
(gdb) set disassembly-flavor intel
(gdb) starti
(gdb) x/i $eip      # which instruction now?
(gdb) si
(gdb) x/i $eip
(gdb) si
(gdb) x/i $eip
```

Real output:

```
=> 0x8049000 <_start>:      mov    ebx,0x1
=> 0x8049005 <_start+5>:    jmp    0x804900c <bitir>
=> 0x804900c <bitir>:       mov    eax,0x1
```

Notice the addresses. `jmp` is at `0x8049005`. On the next step, `eip` jumped to `0x804900c` (`bitir`). So what was at `0x8049007` in between? Exactly `mov ebx, 99` (`0x63` = 99). **`eip` never visited there** — straight from 0x8049005 to 0x804900c. That's what "jumping over" is: the worker's step indicator never even saw that address.

> 🔑 `jmp etiket` = "change the next instruction: continue from `etiket`." It forcibly moves the worker's "where am I" indicator (`eip`) to that point; the instructions in between are **skipped**, they never run. Label = a name you give to a point in memory (like `_start:`).

> ⚠️ `jmp` is **unconditional** — it doesn't look at any flag or anything, it *always* jumps. On its own it's not much use (in fact, used carelessly, it makes an infinite loop). Its real power comes together with its **conditional** siblings, which you'll see in a moment: "if you meet the condition, jump; if not, keep going straight."

---

## Conditional Jump: `jz` and `jnz`

`jmp` always jumped. What we really want is to jump **conditionally**: "if the previous result was zero, go there." This is exactly where the flags we set in 10 come into play.

The first conditional-jump pair reads **ZF** (the zero flag) directly:

- `jz etiket` → **jump if zero:** if ZF is set (the result was zero), jump; otherwise keep going straight.
- `jnz etiket` → **jump if not zero:** if ZF is clear (the result was not zero), jump.

Recall the chain — the bridge from 10: **`cmp`/`test` sets → `jz`/`jnz` reads.** Now let's put the two side by side and write our first real "decision-making" program. `sifirmi.asm` — a **different** exit code depending on whether a number is zero:

```nasm
section .text
    global _start

_start:
    mov eax, 0
    test eax, eax      ; is eax zero? (from 10: if zero, ZF=1)
    jz  sifir          ; if ZF set → jump to 'sifir' label
    mov ebx, 200       ; reached only if NOT zero
    jmp bitir
sifir:
    mov ebx, 100       ; reached only if ZERO
bitir:
    mov eax, 1
    int 0x80
```

Follow the path: `test eax, eax` sets the flag. Then `jz sifir` — if ZF is set, it jumps to `sifir:` (`ebx = 100`); if it's not set, it doesn't jump, it keeps going straight (`ebx = 200`, then `jmp bitir` skips the `sifir` block below). Two separate paths, both merging at `bitir`.

Let's run it with `mov eax, 0` (zero):

```
100
```

Now change a single line — `mov eax, 5` (not zero) — reassemble, run:

```
200
```

**Here's your first decision.** The same program behaved **differently** when just one number changed: 100 if zero, 200 if not. The program's flow is no longer a straight line — depending on the input, it **forked**. `test` set the flag, `jz` read it and chose the path.

> 🔑 `jz` (jump if ZF is set) and `jnz` (jump if ZF is clear) are the conditional jumps that read the ZF from 10. The pattern is always the same: **first set the flag with `cmp`/`test`, then immediately conditional-jump.** This pair is the machine-language equivalent of saying "if ...".

> 💡 **You might be wondering:** *"`jz` is a slightly odd name for equality — why does 'jump if zero' mean 'jump if equal'?"* Because `cmp a, b` was doing `a - b` inside (10); and if `a == b`, the difference is **zero**, so ZF gets set. So the question "are they equal" is really the question "is the difference zero." That's why `jz` also has the name **`je`** (*jump if equal*) — the two are **exactly the same instruction**, just two different readings. Likewise `jnz` = **`jne`** (*jump if not equal*). Writing `je`/`jne` after `cmp` and `jz`/`jnz` after `test` is purely a readability preference.

> 💡 **Where it comes in handy:** the classic way to crack a program's password/license check is to find exactly this `cmp`/`test` + `jz` pair in the disassembly — then you either flip the `jz` to a `jnz` or `nop` out the jump; that way the "wrong password" branch behaves as if it were "correct." So the pattern you *write* by hand today is what reverse engineering *takes apart.* Breaking a "decision" = changing the conditional jump it rests on. This is also the first brick of the binary exploitation we'll return to in 20.

---

## Jump by Ordering: `jl` and `jg`

ZF only lets us ask "equal or not." But most of the time we want to ask **which one is bigger**. In 10 the hint for that was in SF, but we left an honest warning: the "which is bigger" rule has a subtlety with very large numbers, and you **won't need to solve it by hand**, because the jump instructions themselves know the right flag combination. Here are those instructions:

- `jl etiket` → **jump if less:** after `cmp a, b`, jump if `a < b`.
- `jg etiket` → **jump if greater:** jump if `a > b`.

(Alongside them are `jle` = "less than or equal" and `jge` = "greater than or equal"; same family.) You just write `cmp a, b` and say `jl`/`jg`; which flag to check and how is the instruction's own job.

Let's write a program that finds the **larger** of two numbers — `enbuyuk.asm`:

```nasm
section .text
    global _start

_start:
    mov eax, 12        ; first number
    mov ecx, 30        ; second number
    cmp eax, ecx       ; eax - ecx  → set the flags
    jg  eax_buyuk      ; if eax > ecx, jump
    mov ebx, ecx       ; if reached here, ecx is the larger
    jmp bitir
eax_buyuk:
    mov ebx, eax       ; eax was the larger
bitir:
    mov eax, 1
    int 0x80           ; exit code = the larger number
```

`cmp eax, ecx` compares the two numbers (without altering their values — 10). `jg` jumps to `eax_buyuk` if eax is bigger (`ebx = eax`); otherwise it doesn't jump, and `ebx = ecx`. Both paths put the larger number in `ebx`. With `12` and `30`:

```
30
```

Make the numbers `mov eax, 40` / `mov ecx, 30` and run again:

```
40
```

Each time, the program picked **the larger one** — you built the `if (a > b)` logic in the worker's language.

> 🔑 `cmp a, b` + `jl`/`jg` = the decision "is a less than / greater than b?" The "signed-comparison subtlety" mentioned in 10 has a name: **overflow** — and `jl`/`jg` knows the right flag combination for you, so you don't fuss with it by hand. The exact mechanism of this overflow is a deeper topic in signed arithmetic — it falls outside the scope of this beginner series; all you need here is to know its name, and `jl`/`jg` handles the rest for you. Just pick the right one: `jl`/`jg`/`jle`/`jge` for ordering, `je`/`jne` for equality. The pattern is the same again: **set with `cmp`, conditional-jump.**

---

## Putting It Together: Even or Odd?

Now let's combine what you've learned in a single small but real program: given a number, write **even or odd** to the exit code (even → 0, odd → 1).

How do we tell whether a number is even or odd? Recall a fact from 03 (binary numbers): a number's **rightmost (smallest) bit** tells you whether it's odd or even — if the bit is `0` it's even, if `1` it's odd. (Just like in decimal we look at the last digit and say "0,2,4,6,8 are even"; in binary we look at the last *bit*.)

The way to look at that last bit is another use of the `test` from 10: `test eax, 1`. This asks, "is eax's lowest bit 1?" — if the bit is 1 (odd), ZF stays clear; if the bit is 0 (even), ZF stays set.

```nasm
section .text
    global _start

_start:
    mov eax, 7         ; the number we'll test
    test eax, 1        ; is the lowest bit 1? (i.e. odd?)
    jz  cift           ; ZF set → low bit 0 → EVEN
    mov ebx, 1         ; if reached here → ODD
    jmp bitir
cift:
    mov ebx, 0         ; EVEN
bitir:
    mov eax, 1
    int 0x80
```

With `7` (odd):

```
1
```

Make it `mov eax, 8` (even) and run again:

```
0
```

**And there's the whole thing.** The knowledge of three lessons met in one program: from 03, "the last bit tells even/oddness"; from 10, "`test` sets the flag"; from 11, "`jz` reads the flag and chooses the path." This is a real program skeleton — it looks at the input, decides, and behaves differently according to the result.

> 💡 **You might be wondering:** *"Why does `test eax, 1` look at the 'lowest bit'? What's going on inside?"* `test`'s working mechanism is a **bit operation** (`and`), and we haven't seen it yet — as I promised in 10, a **closed box**; the full explanation is in lesson 13 (`and`/`or`/`xor`). All you need here is its function: `test eax, 1` → writes the answer to the question "is eax odd?" into ZF. When we take the mechanism apart in 13, this will click into place.

---

## Summary — Keep in Mind

```
☐ jmp etiket = UNCONDITIONAL jump: always go to 'etiket'; the instructions in between are SKIPPED (never run).
    Label = a name given to a point in memory (like _start:). eip is forcibly moved there.
☐ CONDITIONAL jumps read the flag (10). The pattern is ALWAYS the same: first cmp/test (set), then immediately conditional-jump (read).
    - jz / je   → jump if ZF is set   ("if zero / equal")
    - jnz / jne → jump if ZF is clear ("if not zero / not equal")
    - jl / jg   → after cmp a,b, jump if a<b / a>b  (the instruction handles the signed-ordering subtlety)
    - jle / jge → less-or-equal / greater-or-equal
☐ This means "IF ... THEN" (if) in machine language: the flow is no longer straight, it FORKS according to the input.
☐ Verified programs:
    - atla:     jmp skipped mov ebx,99 → exit 1 (not 99). In gdb, eip 0x...05 → 0x...0c, the middle skipped.
    - sifirmi:  eax=0 → 100 ;  eax=5 → 200   (first fork with test+jz)
    - enbuyuk:  (12,30) → 30 ;  (40,30) → 40 (pick the larger with cmp+jg)
    - ciftek:   7 → 1(odd) ;    8 → 0(even)  (03 last-bit + test eax,1 + jz)
☐ Up next: jumping BACK to the same place gives birth to a "loop" → lesson 12.
```

---

## 🔗 Related Topics

- [10_bayraklar_ve_cmp.md](./10_bayraklar_ve_cmp.md) — Where we set the flags (ZF/SF) that the jumps read, and `cmp`/`test`; the far side of the "sets → reads" bridge
- [03_sayilar_ikilik_onaltilik.md](./03_sayilar_ikilik_onaltilik.md) — The fact that "the rightmost bit tells even/oddness"; the basis of the even-odd program
- [07_gdb_tek_adim.md](./07_gdb_tek_adim.md) — Tracking `eip` (the worker's "where am I" indicator) with `si`; where we saw `jmp`'s leap
- [04.5_registerin_ici.md](./04.5_registerin_ici.md) — What `eip` is; a jump is really "changing eip"

---

**Previous topic:** [10_bayraklar_ve_cmp.md](./10_bayraklar_ve_cmp.md)
**Next topic:** [12_donguler.md](./12_donguler.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
