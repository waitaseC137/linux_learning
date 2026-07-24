# 🧭 x86 Assembly — Start Here (Really From Scratch)

> A computer is not magic. Inside it there is a worker who does very simple things at an **unimaginable speed**,
> but who does not have a single gram of imagination.
> This worker understands only a handful of orders: *"put this number in that box", "add those two together", "jump over there."*
> Assembly is the art of writing a to-do list for that worker in the **only language** he understands.

> **Who is this course for?** Anyone who knows how to turn on a computer. Never having seen a terminal,
> never having written a line of code before, not knowing "what does register mean" — all completely normal;
> we will build all of it from here, from scratch. The only prerequisite: patience and curiosity.

> ✅ **This course is now complete: all lessons from 00 through 20 are written.** And every lesson is not "on paper" — **every program and every GDB output inside it was verified by running it on a real machine.** The path: **Unit 0** (machine model) → **Unit 1** (first instructions, arithmetic) → **Unit 2** (flow: decisions & loops) → **Unit 3** (stack, functions, system calls) → **Unit 4** (the C bridge, where to go from here). Read from start to finish, in order — each unit leans on the previous one.

---

## 📋 Table of Contents

- [What This Course Is NOT](#what-this-course-is-not)
- [First, Let's Break the Fear](#first-lets-break-the-fear)
- [What Will You Be Able to Do at the End?](#what-will-you-be-able-to-do-at-the-end)
- [The Big Picture: Why Does Assembly Exist?](#the-big-picture-why-does-assembly-exist)
- [Roadmap — Unit by Unit](#roadmap--unit-by-unit)
- [How Should You Study?](#how-should-you-study)
- [If Something Breaks](#if-something-breaks)

---

## What This Course Is NOT

- **Not a fast course.** We won't rush. Every concept will sit on top of the previous one. A stone you skip will trip you up later.
- **Not a memorization course.** I won't make you memorize a list of instructions. I'll introduce each instruction at the *moment you need it* — that way the question "why does this exist?" never even arises.
- **Not a program-writing marathon** (but we will write). The goal is first to **understand**: what is the machine actually doing inside? Once you understand that, the code comes on its own.
- **It does not expect you to know C / Python / "real" programming.** Even if you don't know a single language, you can start here.

---

## First, Let's Break the Fear

Most resources greet you straight away with things like `EAX`, `0xdeadbeef`, `mov dword ptr [ebp-0x4]`, and one rightly says "this isn't for me."

Let me tell you a secret: **the hard part of assembly is not the instructions.** Instructions like `mov`, `add`, `jmp` are surprisingly simple — you'll see in a moment. The real issue is picturing in your head **how the machine thinks** (or rather, *doesn't think*).

Once you've settled this, the rest flows like water. The entire first unit is devoted to this — there **we won't write a single line of code.** We'll only build the picture.

> 💡 Getting stuck, feeling confused, the "am I the stupid one" feeling — all normal, and **everyone** passes through this door. Slowing down here is not a weakness, it's a method. Reading a section twice is no shame; it's advice.

---

## What Will You Be Able to Do at the End?

When you finish this course:

- You'll be able to explain **concretely** what a computer actually does when it "runs".
- You'll comfortably read binary and hexadecimal numbers.
- You'll be able to **write and run** your own 32-bit assembly programs (ones that print text to the screen, do arithmetic, make decisions, build loops).
- You'll be able to follow a program **step by step** with GDB and answer the question "what just happened?".
- When you compile a C program and look at its assembly, you'll be able to see **patterns you recognize**.

In other words: you'll stop being someone for whom "a computer is a box" and become someone who can see inside it.

---

## The Big Picture: Why Does Assembly Exist?

The languages humans read (Python, C...) are not the languages a computer **understands directly**. The only thing a computer understands is a giant **sequence of numbers** — this is called *machine code*. For example, to tell the processor "put 5 in the EAX box", you actually send it this number: `B8 05 00 00 00`.

Writing these numbers by hand is nearly impossible. **Assembly** is the **human-readable labels** attached to these numbers:

```
Machine code (what the processor sees):   B8 05 00 00 00
Assembly (what you write):                mov eax, 5        ← "put 5 in EAX"
```

*(But why five numbers for a single 5? The first one — `B8` — is the "put in EAX" order itself; the remaining four numbers are the 4-byte form of 5 as it sits in memory. We'll open this up in [08_mov_ve_bellek](./08_mov_ve_bellek.md) — for now you don't even need to count, just look.)*

The two **correspond one-to-one** — each assembly line is assembled into specific numbers, and there is no magic you don't understand in between. Assembly is the human language closest to machine code. *(We'll also open up separately in [05.5_perde_arkasi](./05.5_perde_arkasi.md) the invisible wrapper — things like `_start`/ELF — that the machine adds to run the program.)* That's why learning assembly = learning what the machine actually does. Higher-level languages (C, Python) are **convenience layers** built on top of this machine.

> 🔑 Keep in mind: **You write assembly → a program called `nasm` assembles it into machine code (numbers) → the processor reads those numbers and does them.** The translator is called an *assembler*; ours is `nasm`.

---

## Roadmap — Unit by Unit

Read the files in this order. Each unit leans on the previous one.

### 🧩 Unit 0 — No Code Yet: Meeting the Machine

> Here **we won't write a single line of code.** We'll only build the machine's mental model. This unit is the foundation of the course; if it isn't laid solidly, nothing above it will hold.

| # | File | What it teaches | Takeaway |
|:---:|---|---|---|
| 1 | [01_bilgisayar_nedir](./01_bilgisayar_nedir.md) | Computer = numbered boxes + worker; what "running" means | Mental model |
| 1.5 | [01.5_sayi_ve_anlam](./01.5_sayi_ve_anlam.md) | If "everything is a number", how does a cat video happen; meaning comes from code | Number ≠ meaning |
| 2 | [02_terminal_ile_tanisma](./02_terminal_ile_tanisma.md) | What a terminal is, how to open it, typing a command and reading its output | Your first "I did it" moment |
| 3 | [03_sayilar_ikilik_onaltilik](./03_sayilar_ikilik_onaltilik.md) | Binary/hexadecimal — counting the way the machine counts | Reading addresses and values |
| 4 | [04_bellek_ve_registerlar](./04_bellek_ve_registerlar.md) | Memory (boxes) and registers (the worker's hands) | The field assembly plays on |
| 4.5 | [04.5_registerin_ici](./04.5_registerin_ici.md) | Inside a register: AL/AH/AX/EAX, "same bits, different window" | Register anatomy |

> 💡 Files whose number ends in `.5` (`1.5`, `4.5`, `5.5`…) are each a short **side lesson**: added to the main road but lighter. If you're in a hurry you can skip them; but frequently-asked points like "how does a cat video become a number?", "what's inside a register?", "what did those instructions do behind the scenes?" are clarified there.

### ⚙️ Unit 1 — First Instructions: Giving the Worker Orders

| # | File | What it teaches | First thing that runs |
|:---:|---|---|---|
| 5 | [05_kurulum_ve_ilk_program](./05_kurulum_ve_ilk_program.md) | `nasm`/`ld`/`gdb` installation, the "write → assemble → run" chain | A program that does nothing and exits |
| 5.5 | [05.5_perde_arkasi](./05.5_perde_arkasi.md) | Behind the scenes: `./` and PATH, `nasm` vs `ld`, what `_start` really is | (no code) |
| 6 | [06_ilk_gercek_program](./06_ilk_gercek_program.md) | Value into a register with `mov`, exit code, `echo $?` | A number on the screen: "8!" |
| 7 | [07_gdb_tek_adim](./07_gdb_tek_adim.md) | Step one instruction at a time in GDB, watch the registers | "Write an instruction → see what changed" |
| 8 | [08_mov_ve_bellek](./08_mov_ve_bellek.md) | Kinds of `mov`, `[...]` = the place the address in the box points to; first pointer tracking | First pointer intuition |
| 8.5 | [08.5_little_endian](./08.5_little_endian.md) | Looking at memory byte by byte; the "exactly reversed" byte order (little-endian) | Byte-layout intuition |
| 9 | [09_aritmetik](./09_aritmetik.md) | `add`, `sub`, `inc`, `dec` | A tiny calculator |

### 🔀 Unit 2 — Flow: Making the Worker Decide

| # | File | What it teaches | First thing that runs |
|:---:|---|---|---|
| 10 | [10_bayraklar_ve_cmp](./10_bayraklar_ve_cmp.md) | Flags (ZF/SF...), `cmp`/`test` | "How the worker remembers a comparison" |
| 11 | [11_ziplamalar](./11_ziplamalar.md) | `jmp`, `jz`, `jnz`, `jl`, `jg` | An "even or odd" program |
| 12 | [12_donguler](./12_donguler.md) | A loop with a counter + conditional jump | Countdown from 10, sum of 1..N |
| 13 | [13_bit_islemleri](./13_bit_islemleri.md) | `and`, `or`, `xor`, `shl`, `shr` | Why `xor eax, eax` means "zero out" |

### 🧱 Unit 3 — Parts and the Operating System

| # | File | What it teaches | First thing that runs |
|:---:|---|---|---|
| 14 | [14_stack](./14_stack.md) | `push`/`pop`, why the stack grows downward | The worker's "notepad" |
| 15 | [15_call_ve_ret](./15_call_ve_ret.md) | Functions, return address, the `call`/`ret` duo | A reusable part |
| 16 | [16_calling_convention](./16_calling_convention.md) | cdecl: giving data to a part, return value, prologue/epilogue | Calling "add(3,5)" |
| 17 | [17_sistem_cagrilari](./17_sistem_cagrilari.md) | `int 0x80`, syscall numbers, text/input to the screen | A real "Hello World" |
| 18 | [18_ilk_etkilesimli_program](./18_ilk_etkilesimli_program.md) | Put it all together | An asm program that asks your name and greets you |

### 🌉 Unit 4 — The Bridge

| # | File | What it teaches |
|:---:|---|---|
| 19 | [19_c_ile_assembly_koprusu](./19_c_ile_assembly_koprusu.md) | Compile a tiny C program, look at its asm, see familiar patterns |
| 20 | [20_buradan_nereye](./20_buradan_nereye.md) | Moving to 64-bit, reverse engineering, exploitation and advanced resources |

---

## How Should You Study?

1. **Don't break the order.** Even if Unit 0 feels boring, don't skip it — everything above it rests on it.
2. **Run every instruction yourself.** Reading isn't enough; assembly is learned *with your fingertips*. Don't consider a lesson finished until you've written and run a program.
3. **Watch it in GDB.** If you don't understand what an instruction does, step one at a time in GDB and **see with your own eyes** how the registers/memory change. (We'll set it up in Unit 1.) This is the most powerful learning tool of the whole course.
4. **Go back when you're stuck.** A term you don't understand has almost always been explained in the *previous* lesson. Going back is normal.
5. **Slow = fast.** Rushing and half-understanding will cost you double the time later.

---

## If Something Breaks

Throughout this course, getting errors **is part of the job** — programming is already the "get an error, fix it" loop. When an instruction doesn't work, don't panic; most of the time it's a letter/number typo or a skipped step. In Unit 1 we'll also learn to "read the error message".

---

## 🔗 Next Step

- [01_bilgisayar_nedir.md](./01_bilgisayar_nedir.md) — continue from here. First we'll understand what the machine is; no code at all, we're just building the picture.

> 🎯 **Where to after finishing the course?** This asm foundation is the direct preparation for the **[Binary Exploitation series](../binary_exploitation/00_buradan_basla.md)** (*bending* the flow of programs) in the same repo and for the OverTheWire wargames — first learn to *"give the worker orders"*, then learn to *"bend the order."*

---

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
