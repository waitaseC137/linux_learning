# 🔁 x86 Assembly — Loops: Doing the Same Job Over and Over

> In 11 we broke the program's straight road: with `jmp` we jumped **forward**, skipped instructions, branched. At the end we cracked open a little door: *"when you jump **back** to the same place, a 'loop' is born."*
> That is the door we walk through now. Until now we always went forward; in this lesson, for the first time, we will jump **backward** — and make the worker do the same job, over and over, until we say "stop." This is the real source of the computer's "unbelievable speed" (01): tireless repetition.

> **This lesson has code, and we run all of it.** Every program, every exit code, and every GDB output below is real: I compiled and ran them on my own machine.

---

## 📋 Table of Contents

- [Jump Backward: This Is How a Loop Is Born](#jump-backward-this-is-how-a-loop-is-born)
- [The Infinite-Loop Danger: A Counter Is a Must](#the-infinite-loop-danger-a-counter-is-a-must)
- [First Loop: Sum from 1 to N](#first-loop-sum-from-1-to-n)
- [A Loop Is the Brick of Higher Operations: Multiplication](#a-loop-is-the-brick-of-higher-operations-multiplication)

---

## Jump Backward: This Is How a Loop Is Born

In 11 we said `jmp bitir` and jumped to a label **below**. But there is no rule about where the label has to be — `jmp` can jump to **any** point in memory; forward, or **backward**.

What if we put a label **above** the `jmp` and jump there? Then the worker goes back, runs the instructions in between **again**, then goes back once more... That is exactly what a **loop** is: give a point in memory a name, do the job, then `jmp` **back** to that name.

```nasm
tekrar:                ; ← label, ABOVE the jmp
    ; ... work to be done ...
    jmp tekrar         ; go back → work from the top
```

This skeleton works — but it has one problem, and that problem is the real lesson of this lesson.

> 🔑 Loop = jumping **back** to a label. A forward `jmp` skips instructions; a backward `jmp` **repeats** them. We aren't learning a new instruction — we're just turning 11's `jmp` around to point backward. All of repetition comes out of this simple idea.

---

## The Infinite-Loop Danger: A Counter Is a Must

The `jmp tekrar` above was **unconditional** (11): every time, no questions asked, it goes back. So the worker returns to `tekrar`, does the job, returns again, does it again... **forever.** The program never ends, it can never reach `int 0x80` (exit). This is called an **infinite loop**, and it is usually a bug you don't want — the machine spins in one spot, fast, for nothing.

So a loop must have two parts:
1. **The job:** the thing to be done each round.
2. **The exit condition:** a control that says "enough now, get out of the loop" — otherwise it spins forever.

How do we build the exit condition? With the material we already have: 11's **conditional** jump. The idea is this — keep a **counter** (a register that counts how many rounds are left), decrement it by one each round (`dec`, 09), and stop **when it hits zero**. We can already answer the question "did it hit zero?": if the result of `dec` is zero, **ZF** turns on (10), and `jnz` (11) says "jump if not zero."

The pattern settles like this:

```nasm
    mov ecx, 5         ; counter = 5 rounds
tekrar:
    ; ... work ...
    dec ecx            ; counter--  (and sets ZF: when it hits zero, ZF=1)
    jnz tekrar         ; if counter is NOT 0 go back; if 0 fall through, exit the loop
```

See it? Three lessons' pieces came together: **decrement** the counter (09 `dec`), check whether the result **is zero** (10 `ZF`), and if it isn't zero, **jump back** (11 `jnz`). When the counter reaches zero, `jnz` no longer jumps — the worker "falls through" past the bottom of the loop and continues. The infinite loop was tamed with a counter.

> 🔑 A solid loop = **job + exit condition.** The most common condition: `dec` a **counter** register each round, and say "if not zero, repeat" with `jnz`. When the counter hits zero, ZF turns on, `jnz` doesn't jump, the loop ends. Forget the counter → infinite loop.

> ⚠️ This pattern assumes the counter starts at **1 or greater**. If you start with `mov ecx, 0`, `dec` drops the counter **below** zero (not 0, but 0xFFFFFFFF — a huge number), `jnz` doesn't stop, and the loop slides into exactly the infinite loop we just feared. If the counter could be 0, check it before entering the loop (e.g. skip the loop entirely with a `jz` up front).

---

## First Loop: Sum from 1 to N

Let's put the pattern to real work: **sum the numbers from 1 to N** (that is, 1 + 2 + ... + N). We'll use the counter both for "how many rounds are left" and for "the number to add this round" — cleverly: as ecx counts down `3, 2, 1`, those are exactly the numbers we want to add. `toplam.asm` (N = 3):

```nasm
section .text
    global _start

_start:
    mov eax, 0         ; total = 0 (where we accumulate)
    mov ecx, 3         ; counter = N = 3
dongu:
    add eax, ecx       ; total += counter  (WORK: 09's accumulation)
    dec ecx            ; counter--         (+ set ZF)
    jnz dongu          ; if counter not 0 go back to the top
    mov ebx, eax       ; result into the exit code
    mov eax, 1
    int 0x80
```

> 💡 **Which flag is `jnz` reading?** In this loop there are **two** flag-setting instructions before `jnz`: first `add eax, ecx`, then `dec ecx` — both update ZF (10). The rule is simple: **every new arithmetic instruction overwrites the previous one's flag**, so `jnz` only looks at the flag of the instruction **immediately before it** (that is, `dec`'s). That's why we put `dec` right in front of `jnz`; the ZF that `add` set doesn't matter, the one in effect is `dec`'s.

Turn the rounds over in your head: ecx=3 → eax 0+3=3; ecx=2 → eax 3+2=5; ecx=1 → eax 5+1=6; ecx=0 → `jnz` stops. Result 6 (=1+2+3). Run it:

```
nasm -f elf32 toplam.asm -o toplam.o
ld -m elf_i386 toplam.o -o toplam
./toplam
echo $?
```

```
6
```

Now let's actually **see with our own eyes** that the loop really loops. Let's put a **breakpoint** on the `dongu` label — GDB will stop every time the worker visits it — and look at the counter each time:

```
gdb ./toplam
(gdb) break dongu       # put a breakpoint on the 'dongu' label
(gdb) run
(gdb) print $ecx        # round 1
(gdb) continue          # continue until the next 'dongu' visit
(gdb) print $ecx        # round 2
(gdb) continue
(gdb) print $ecx        # round 3
(gdb) continue
```

Real output (this is exactly what you see on screen):

```
Breakpoint 1 at 0x804900a
Breakpoint 1, 0x0804900a in dongu ()
$1 = 3
Breakpoint 1, 0x0804900a in dongu ()
$2 = 2
Breakpoint 1, 0x0804900a in dongu ()
$3 = 1
```

Let's read the lines: the same address `0x804900a` (that is, `dongu`) appears **three times** — GDB stopped there each round when the worker arrived. And `$1 = 3`, `$2 = 2`, `$3 = 1`, that is the three answers of `print $ecx`: the counter dropped by one each round, `3 → 2 → 1`. After the third `continue`, `dec` zeroed ecx, `jnz` no longer jumped; the worker fell through past the bottom of the loop and the program exited — the breakpoint was never hit again.

**This is a loop.** The worker visited the same address (`0x804900a`, `dongu`) **three times** — because each round `jnz` sent it back there. And the counter dropped by one at each visit: `3 → 2 → 1`. The fourth time, `dec` zeroed ecx, `jnz` didn't jump, the worker fell through past the bottom of the loop and exited. You wrote a single program once, and the worker ran it three times — as many repetitions as you want, with a single counter.

> 💡 **You might be wondering:** *"What did `break dongu` do?"* In GDB, a **breakpoint** means "stop me when the worker reaches this point." In 07 we stopped at *every* instruction with `si`; here we only stopped every time we reached `dongu`. Perfect for loops: instead of `si`-ing through each round one instruction at a time, we said "stop at the start of each round, look at the counter." And `continue` (or `c` for short) means "let it run free until the next breakpoint."

---

## A Loop Is the Brick of Higher Operations: Multiplication

In 09 we saw a lovely secret: the machine has **no** separate subtraction circuit — subtraction was "adding the negative." The same spirit is here too. The machine's basic arithmetic is addition; so what about **multiplication**? What does `3 × 4` really mean? It means **"add 3, four times"**: 3 + 3 + 3 + 3. And "doing something N times" is now in our hands — the loop!

`carp.asm` — computing `3 × 4` with repeated addition, without ever using a multiply instruction:

```nasm
section .text
    global _start

_start:
    mov eax, 0         ; result = 0
    mov ecx, 4         ; how many times we'll add (multiplier)
carp:
    add eax, 3         ; each round add the 'multiplicand' (3)
    dec ecx            ; counter--
    jnz carp           ; 4 times: 3+3+3+3
    mov ebx, eax
    mov eax, 1
    int 0x80
```

Run it, `echo $?`:

```
12
```

`3 + 3 + 3 + 3 = 12 = 3 × 4`. If you make the 3 inside it a 7 and the counter a 6 (`7 × 6`), the result:

```
42
```

**This is the power of the loop.** From a primitive operation like addition, by repeating it, you built a bigger operation like **multiplication**. 09's theme peaks here: the machine really knows very little (add, subtract, compare, jump) — but by **repeating and combining** these, it builds everything. A few simple bricks + a loop = huge buildings.

> 🔑 A loop isn't just "repetition," it's a **construction tool:** `3 × 4` = "add 3, four times." By repeating primitive operations (add) you build higher ones (multiplication). If a processor "can multiply," at the very bottom there are usually repetitions like this. (On modern x86 there is also a ready-made `mul` instruction — but the idea is always the same: repeated addition.)

---

## Summary — Keep in Mind

```
☐ LOOP = jumping BACK to a label. Forward jmp skips; backward jmp repeats. (No new instruction, 11's jmp turned backward.)
☐ Unconditional backward jmp → INFINITE LOOP (program never ends). This is usually a BUG.
☐ Solid loop = JOB + EXIT CONDITION. Most common pattern — COUNTER:
      mov ecx, N
    tekrar:
      ; ... work ...
      dec ecx        ; 09: decrement + 10: set ZF
      jnz tekrar     ; 11: if not zero go back; if zero fall through → exit
    (the dec+ZF+jnz trio = 09+10+11 in one place.)
☐ Verified programs:
    - sum (1..N):  N=3 → 6 ;  N=5 → 15 ;  N=10 → 55.
      gdb break dongu: same address visited 3 times, ecx 3→2→1, then exited.
    - carp (repeated addition):  3×4 → 12 ;  7×6 → 42.  ("add N, M times")
☐ BIG IDEA: a few primitive operations (add/sub/cmp/jmp) + loop = everything. Even multiplication is repeated addition.
☐ Up next: bit tricks often needed in the 'job' part (why xor eax,eax means 'zero out') → lesson 13.
```

---

## 🔗 Related Topics

- [11_ziplamalar.md](./11_ziplamalar.md) — `jmp`/`jnz`, the loop's only material; the "jump back = loop" door was cracked open here
- [10_bayraklar_ve_cmp.md](./10_bayraklar_ve_cmp.md) — The counter's "did it hit zero" decision: ZF after `dec`; the flag that ends the loop
- [09_aritmetik.md](./09_aritmetik.md) — `add` (accumulation) and `dec`; and the "build the bigger from the primitive" idea (sub = add the negative)
- [07_gdb_tek_adim.md](./07_gdb_tek_adim.md) — Tracing with GDB; here we added `break`/`continue` (stop at the start of each round, not at every instruction)

---

**Previous topic:** [11_ziplamalar.md](./11_ziplamalar.md)
**Next topic:** [13_bit_islemleri.md](./13_bit_islemleri.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
