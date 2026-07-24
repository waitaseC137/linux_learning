# 🔬 x86 Assembly — Single-Stepping with GDB: Watching Inside the Boxes Live

> At the end of 06 we made a promise: `echo $?` only showed you a **single window** (`ebx`, through the exit code).
> To see inside all the boxes (`eax`, `ecx`, `edx`…) **whenever you want**, you needed a tool.
> That tool is **`gdb`** — and in this lesson we open it for the first time.

> gdb lets you **pause the worker at any instruction you choose** and look inside each box one by one. You run an instruction, it stops, you check "what changed?" — then one more instruction.
> The course's most powerful learning moment begins here: **write an instruction → see what changed.** The machine is no longer a box to you; you can watch inside it.

---

## 📋 Table of Contents

- [What Is gdb Good For?](#what-is-gdb-good-for)
- [Feeding the Program into gdb and Stopping It](#feeding-the-program-into-gdb-and-stopping-it)
- [First Look: The Boxes Are Still Empty](#first-look-the-boxes-are-still-empty)
- [First Step: `si` and "There, It Changed!"](#first-step-si-and-there-it-changed)
- [eip: Where Is the Worker Right Now?](#eip-where-is-the-worker-right-now)
- [Round 2: Watching the Copy Live](#round-2-watching-the-copy-live)
- [Quitting and the Rest of gdb](#quitting-and-the-rest-of-gdb)

---

## What Is gdb Good For?

So far you've written your program, run it, and seen a single result with `echo $?`. But you couldn't see what happened in between — which instruction changed which box and how. The program was a box: input went in, output came out, and the rest was dark.

**`gdb` (*GNU Debugger*)** is what lights up that darkness. It does two things, and in this lesson you need both:

1. **It pauses.** You can freeze the program at any instruction you choose — the worker is standing there, order in hand, and you've said "stop."
2. **It shows the inside.** The moment it stops, you can read the current value of each box (register).

Combine these two and here's what you get: run an instruction → stop → look at the boxes → one more instruction → look again. You see with your own eyes what the instructions do *one by one*. This is called **single-stepping** (*single-step*).

> 🔑 gdb = the tool for **pausing** the worker and looking inside each box. Single-stepping: run an instruction, stop, look at what changed, repeat.

We already installed gdb back in 05 ([05_kurulum_ve_ilk_program](./05_kurulum_ve_ilk_program.md)). You also have a program left over from 06: `cikis.asm`. We start with it.

---

## Feeding the Program into gdb and Stopping It

First, make sure the program from 06 is still neat and tidy. `cikis.asm` was this:

```nasm
section .text
    global _start

_start:
    mov ebx, 8
    mov eax, 1
    int 0x80
```

Assemble and link (the same chain as in 06):

```
nasm -f elf32 cikis.asm -o cikis.o
ld -m elf_i386 cikis.o -o cikis
```

Now, instead of saying `./cikis`, we open the program **inside gdb**:

```
gdb ./cikis
```

You'll be greeted by a prompt that reads `(gdb)` — from now on you'll type commands here. Our first two commands are setup:

```
(gdb) set disassembly-flavor intel
(gdb) starti
```

- **`set disassembly-flavor intel`** → this tells gdb to "show the instructions **in the order we wrote them**." (*disassembly* = turning machine code back into readable asm instructions; *flavor* = which writing style it shows them in.) By default gdb uses a different, reversed order — throughout this course we always prefer intel, that is, the order you wrote.
- **`starti`** → "start the program, but stop immediately at the **first instruction**." The worker has raised its hand *before doing anything at all*, waiting for you.

On the screen you'll see this (I actually ran it):

```
Program stopped.
0x08049000 in _start ()
```

There it is — the worker stopped. `0x08049000` is the **address of the instruction** the worker is currently stopped at (which instruction is up next); we'll get to it shortly. What matters: the program started but **not a single instruction has run yet.** The ideal moment to look.

> 💡 **You might wonder:** *"Why `starti`? Couldn't I just say `run`?"* `run` runs the program **all the way to the end** — and since our program exits right away, it would finish before you could watch anything. `starti` ("start-instruction"), on the other hand, **stops at the first instruction**; that's exactly what we want in order to watch.

---

## First Look: The Boxes Are Still Empty

While the worker is stopped at the first instruction, let's look at the boxes. The command: **`info registers`** (short form `i r`). If you like, give only the boxes you care about:

```
(gdb) info registers eax ebx
```

Real output:

```
eax            0x0                 0
ebx            0x0                 0
```

Each line is a box: name on the left, value in hexadecimal in the middle (`0x0`), decimal on the right (`0`). So **right now both eax and ebx are 0.** Makes sense — `mov ebx, 8` hasn't run yet; the worker is still waiting *in front of* that instruction.

> 💡 The value is written twice because it's two representations of the same number: `0x0` (hexadecimal) and `0` (decimal) — back in 03 ([03_sayilar_ikilik_onaltilik](./03_sayilar_ikilik_onaltilik.md)) we saw that they're the same number. gdb shows both so you can read whichever you want.

---

## First Step: `si` and "There, It Changed!"

Now make the worker run **a single instruction**. The command: **`si`** (*step-instruction* — "advance one instruction"):

```
(gdb) si
(gdb) info registers eax ebx
```

Real output:

```
eax            0x0                 0
ebx            0x8                 8
```

**There's the moment.** `ebx` was `0` just now, and now it's `8`. You said `si`, the worker ran `mov ebx, 8`, and **you saw the box change with your own eyes.** In 06 we *knew* that `mov ebx, 8` puts 8 into ebx; now we **watched it.** That's the difference: between knowing and seeing.

`eax` is still `0` — because the instruction that changes it (`mov eax, 1`) hasn't run yet; it's up next.

Fire one more `si` so that `mov eax, 1` runs:

```
(gdb) si
(gdb) info registers eax ebx
```

```
eax            0x1                 1
ebx            0x8                 8
```

Now `eax` became `1` too, and `ebx` is still `8`. Each instruction touched **only its own box** and left the other alone. You're now watching the worker's "fetch-do-advance" loop frame by frame.

> 🔑 `si` = run one instruction, stop. In between, look with `info registers eax ebx` → you see which box changed. The course's promise of "write an instruction → see what changed" is exactly this.

---

## eip: Where Is the Worker Right Now?

We've seen the values of the boxes. But how do we see **where in the list** the worker is — that is, "which instruction is next"?

There's a box that holds this too: **`eip`** (*instruction pointer* — "instruction indicator"). Inside it sits the **address** of the next instruction. Remember how in 01 the worker's loop was "fetch-do-**advance**" — well, `eip` is the box for that "where." After each instruction the worker advances eip to the next instruction.

To see the next instruction: **`x/i $eip`** ("show the instruction at the address eip points to, as an instruction"):

> 💡 **What's the `$` at the front?** In gdb, when you use a register **inside an expression, because you need its value**, you put a `$` in front of its name: `$eip` = "the address *inside* eip". In the `info registers eax` above there was no `$` — because there we weren't factoring the register into a computation, we were just **listing it by name**. In short: if you're using its value, `$eip`; if you're only naming it, `eax`.

```
(gdb) x/i $eip
```

At the very start of the program (right after starti) the output was this:

```
=> 0x8049000 <_start>:	mov    ebx,0x8
```

`=>` means "the worker is here right now" — and that address, `0x8049000`, is the **same address** as the `0x08049000` you saw in the `starti` output above; the extra leading zero is just zero-padding and doesn't change the value. And the instruction you see: `mov ebx,0x8` — **exactly your `mov ebx, 8`.** (`0x8` is 8 in hexadecimal; thanks to `disassembly-flavor intel` the order too is as you wrote it: destination `ebx` first, then source.) When you fire a `si`, the `=>` shifts to the next instruction (`mov eax,0x1`), and one more shifts it to `int 0x80`. **The worker is advancing through the list, and you're watching over its shoulder step by step.**

> 💡 **You might wonder:** *"Why do the addresses jump by 5 each time, `0x8049000`, `0x8049005`?"* Because each instruction takes up **a few bytes** in memory; an instruction like `mov ebx, 8` is 5 bytes. When the worker finishes an instruction, it advances eip **by the length of that instruction** — that is, to the start of the next instruction. How instructions are encoded as bytes is a separate and deep topic; for now the only thing you need to know is: **eip = the address of the next instruction, advancing at every step.**

> 🔑 `eip` = the box holding the address of the next instruction (the worker's "where"). With `x/i $eip` you read the next instruction; the `=>` pointer shows the worker's position.

---

## Round 2: Watching the Copy Live

In 06 there was a claim: `mov ebx, eax` "copies" — it puts the value in `eax` into `ebx` but **`eax` doesn't empty out.** Back then I promised, I said "I tried this." Now **you too will see it with your own eyes in gdb.**

Make a new file named `kopya.asm`:

```nasm
section .text
    global _start

_start:
    mov eax, 7
    mov ebx, eax        ; COPY the 7 in eax to ebx
    mov eax, 1
    int 0x80
```

Assemble, link, open in gdb, watch the boxes:

```
nasm -f elf32 kopya.asm -o kopya.o
ld -m elf_i386 kopya.o -o kopya
gdb ./kopya
(gdb) set disassembly-flavor intel
(gdb) starti
```

First, run `mov eax, 7`:

```
(gdb) si
(gdb) info registers eax ebx
```

```
eax            0x7                 7
ebx            0x0                 0
```

`eax` is now `7`, `ebx` is still `0`. Now the main event — `mov ebx, eax` (the copy):

```
(gdb) si
(gdb) info registers eax ebx
```

```
eax            0x7                 7
ebx            0x7                 7
```

**There's the proof.** `ebx` became `7` (the copy arrived) — **but `eax` is still `7`.** The source didn't empty out. The sentence from 06, "move is really copy," you now don't just *know* — you **see it.** (If you like, finish the program: the final `si`s run `mov eax, 1` and `int 0x80`; `echo $?` — in fish: `echo $status` — says **7**, because on exit the 7 in `ebx` is read.)

---

## Quitting and the Rest of gdb

To quit gdb:

```
(gdb) quit
```

(If the program is still mid-run it may ask "kill it?"; say `y`, it only closes that session.)

In this lesson you learned **a single job** gdb does: watching registers by single-stepping. But gdb does far more than this — looking at memory, stopping at a specific place (breakpoint), changing values… These are for now a **closed box**; as you need them, we'll open them right then. Right now the `si` + `info registers` pair you have in hand is your **primary tool** for whenever you don't understand what an instruction does.

> 🔑 Didn't understand what an instruction does? Your rule: open it in gdb, `starti`, then **watch with your own eyes** using `si` + `info registers`. Whenever you get stuck again in this course wondering "what did this do?", your answer is here.

---

## Summary — Keep in Mind

```
☐ gdb = the tool for PAUSING the worker and looking inside each box (installed in 05).
☐ Open the program in gdb:  gdb ./cikis
    (gdb) set disassembly-flavor intel   → show instructions in our order
    (gdb) starti                         → stop at the first instruction (NOT run: run would race to the end)
☐ Look at the boxes:  info registers eax ebx   (short: i r eax ebx)
    - name on left, 0x.. (hex) in middle, decimal on right — same number.
☐ Single step:  si   → run one instruction, stop. Then look again → see WHAT CHANGED.
    - after mov ebx, 8, ebx: 0 → 8.  after mov eax, 1, eax: 0 → 1.
☐ eip = the box holding the address of the next instruction (the worker's "where").
    - x/i $eip  → show the next instruction.  the => pointer shows the worker's position.
☐ Copy proof (kopya.asm): after mov ebx, eax, ebx=7 BUT eax still 7 → the source doesn't empty out.
☐ Rule: if an instruction isn't understood → watch with starti + si + info registers in gdb.
```

---

## 🔗 Related Topics

- [06_ilk_gercek_program.md](./06_ilk_gercek_program.md) — Where the `cikis.asm` we watched and the `mov` came from
- [04_bellek_ve_registerlar.md](./04_bellek_ve_registerlar.md) — What the boxes (registers) we looked inside actually are
- [01_bilgisayar_nedir.md](./01_bilgisayar_nedir.md) — The worker's "fetch-do-advance" loop; eip is the box for that "advance"

---

**Previous topic:** [06_ilk_gercek_program.md](./06_ilk_gercek_program.md)
**Next topic:** 08_mov_ve_bellek.md 🚧 *(being written)*

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
