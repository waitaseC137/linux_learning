# 🧭 x86 Assembly — Where To From Here?

> You did it. In 00 the computer was "a box"; now you can look inside that box and give it orders in its lowest language. This final lesson won't teach a new instruction — instead it will take a look at **where you came from**, then map out **where you can go.**
> Because this course is not an *ending*, it is a *foundation.* What you learned (how the machine really works) is a floor you can build a great deal on top of. Now let's look at which buildings can be raised on that floor.

> **There is only a single piece of code in this lesson** (a taste of 64-bit), and it is real: I compiled and ran it on my own machine. The rest is a roadmap.

---

## 📋 Table of Contents

- [What Did You Learn? A Short Look Back](#what-did-you-learn-a-short-look-back)
- [Next Stop: Moving to 64-bit](#next-stop-moving-to-64-bit)
- [Reverse Engineering: Reading Someone Else's Code](#reverse-engineering-reading-someone-elses-code)
- [Binary Exploitation: Bending the Flow](#binary-exploitation-bending-the-flow)
- [Resources and a Final Word](#resources-and-a-final-word)

---

## What Did You Learn? A Short Look Back

Stop for a minute and look at the road you've traveled. When you started this course, even the word "register" was foreign; now you have all of this:

- **The machine model** (Unit 0): memory = numbered boxes, registers = the worker's hands, binary/hexadecimal, how the worker works without ever reasoning.
- **First instructions** (Unit 1): `mov`, memory & pointers (`[...]`), little-endian, arithmetic (`add`/`sub`, two's complement), and **watching each instruction live** in GDB.
- **Flow** (Unit 2): flags & `cmp`, jumps (`jmp`/`jz`/`jl`), loops, bit operations — that is, **decision** and **repetition.**
- **Parts & the OS** (Unit 3): the stack, `call`/`ret`, the calling convention, system calls — and finally a real program that **asks you a question and answers it.**
- **The bridge** (Unit 4): being able to **read** the assembly of a C program.

So now you know, not abstractly but **concretely**: what a computer really does when it "runs." This is a floor that even most programmers can't see clearly. From here, there are three main roads.

> 🔑 This course is a foundation, not an ending. The machine model + instructions + flow + the OS interface + reading compiled code — you have all of it. Three forward roads: **going deeper into 64-bit**, **reverse engineering**, **binary exploitation.** All three rise on top of the floor you're standing on here.

---

## Next Stop: Moving to 64-bit

Throughout this course we learned **32-bit** — because it's simpler and shows the concepts more cleanly. But most machines today run **64-bit**. The good news: the ideas are **exactly the same**; only a few names and details change. Let's write the same "Hello" in 64-bit (`merhaba64.asm`):

```nasm
section .text
    global _start
_start:
    mov rax, 1          ; sys_write   (1 in 64-bit — was 4 in 32-bit)
    mov rdi, 1          ; screen      (rdi instead of ebx)
    mov rsi, mesaj      ; address     (rsi instead of ecx)
    mov rdx, uzunluk    ; length
    syscall             ; NOT int 0x80 → syscall

    mov rax, 60         ; sys_exit    (60 in 64-bit — was 1 in 32-bit)
    mov rdi, 0
    syscall
```

Assemble it with `nasm -f elf64 ... && ld ...`, run it → it prints `Hello (64-bit world)` to the screen. What changed is the grown-up version of things you already know:

| | 32-bit (what you learned) | 64-bit |
|---|---|---|
| Registers | `eax`, `ebx`... (32 bit) | `rax`, `rbx`... (64 bit) + 8 new: `r8`–`r15` |
| System call | `int 0x80` | `syscall` |
| Call numbers | write=4, exit=1 | write=1, exit=60 |
| Syscall arguments | `ebx, ecx, edx` | `rdi, rsi, rdx`... |

As you can see, the **concept** never changed — "put a value in a register, write the number into `rax`, make the call." Only the names and a couple of numbers differ. If you understood 32-bit, moving to 64-bit is an afternoon's work.

(The only real *new habit* is this: in 64-bit you put a **function's** arguments — instead of `push`ing them onto the stack and reading from `[ebp+8]` as you did in 16 — directly into **registers** (`rdi`, `rsi`, `rdx`...). So the `[ebp+8]` stack-argument model from 16 is specific to 32-bit cdecl; inside a 64-bit function you won't see `[ebp+8]` — you'll want to know this in reverse engineering. The fact that the *syscall* arguments in the table above sit in registers is already an example of the very same logic.)

> 🔑 64-bit is the **grown-up version** of what you learned: `e__` registers become `r__` (+ `r8`–`r15`), `syscall` replaces `int 0x80`, the call numbers change. Most of the concepts (register, stack, syscall) are the same; the **idea** of the calling convention is the same too — the only real difference is that function arguments move to **registers** instead of the stack. If 32-bit is a solid foundation, 64-bit is just a new dialect.

---

## Reverse Engineering: Reading Someone Else's Code

In 19 we cracked the big door ajar: you were able to read the assembly of a C program. **Reverse engineering** is exactly the scaled-up version of that — but this time **without** having the source code (C) in hand, answering the question "what does this do?" just by looking at the compiled program (the binary).

Why is it done? To understand how a program with no source works: to analyze a virus, to find a security hole, to understand a closed format, or simply out of curiosity to say "how did they do this?" And the new eye you've just gained — the eye that recognizes `push ebp`, `[ebp+8]`, `call` — is **exactly the foundation** of this work.

You've already met, or will meet, the tools that make this easier:

- **`objdump -d`** — dumps the assembly of a binary (we used `objdump` in this course).
- **GDB** — stepping through live while it runs (the course's most powerful tool; the same in RE).
- **Ghidra / radare2 / Cutter** — professional tools for analyzing huge programs; they even turn assembly into readable "pseudo-C." But whether that pseudo-C is correct can only be understood by someone who **can read assembly** — that is, you.

> 🔑 **Reverse engineering** = looking at a compiled binary without its source code and saying "what does it do." It's the source-less version of what you did in 19 (reading asm). The tools (`objdump`, GDB, Ghidra) speed the work up, but the core skill is the **assembly-reading** eye you gained in this course.

---

## Binary Exploitation: Bending the Flow

The third road is the most exciting. Reverse engineering asks "what does the program do?"; **binary exploitation** goes one step further: *"how do I force the program to do something its author **never wanted**?"*

And here is where the finest gift the course gave you is rewarded: **the stack you learned in 14 is the heart of exploitation.** Recall — when you make a `call`, the **return address** was written onto the stack (15). What if a program stores the data it takes from the user on the stack without any bounds, and that data overflows and writes **over the return address**? Then `ret` no longer returns to where the program should go, but to the address **you** placed there — you've bent the flow. This is called a *buffer overflow*, and it is the door to an entire world of security.

Everything you need to understand this (the stack, `call`/`ret`, the return address, memory) you gathered in this course. And you're lucky: inside this very repo there are series that continue right from here —

- **[The Binary Exploitation series](../binary_exploitation/00_buradan_basla.md)** — the direct continuation of this course; start *bending* the stack.
- **OverTheWire** wargames (especially **Narnia**, **Behemoth**) — get your hands dirty and learn by exploiting real vulnerabilities.

> 🔑 **Binary exploitation** = forcing a program into behavior its author didn't want. The classic example is the *buffer overflow*: overflowing data crushes the **return address** on the stack, and `ret` returns to wherever you want (14+15!). This course's stack is the very heart of exploitation — the continuation is in the repo's binary_exploitation series and on OverTheWire.

---

## Resources and a Final Word

Wherever you go, a few solid compasses:

- **This repo** — [x86_assembly](./00_buradan_basla.md) (this series you just finished), [binary_exploitation](../binary_exploitation/00_buradan_basla.md), and the OverTheWire solutions. It continues in the same "from the very bottom up" spirit.
- **Don't let go of GDB.** The most powerful thing you learned in this course wasn't a command but a **habit**: "if you don't understand it, step through it, see it with your own eyes." In 64-bit, in RE, in exploitation — it's your best teacher everywhere.
- **Follow your own curiosity.** If you ever wonder how a program works, look inside it with `objdump -d`. That output won't feel foreign to you anymore. Not a warning but an encouragement: a real binary — especially one that's optimized, PIE, and stripped of symbols — looks messier than this course's spotless `-O0` examples; PLT/GOT jumps, nameless chunks of code... No panic, the bricks are still familiar — just more of them, laid out more cunningly. Scale up the `-O1` cunning you saw in 19, and that's all it is.

And a final word. The promise at the start of this course was this: *no magic, no hidden work, no invisible rules sneak in between.* I hope it held. Nothing a computer does is magic — it's just very simple operations stacking on top of one another at an unimaginable speed, with exactly the instructions you can now read. That box is no longer closed.

From here on it's up to your curiosity. Safe travels. 🚀

> 🔑 This course was the foundation; three roads (64-bit, RE, exploitation) lead out from here. Your most lasting tool isn't a command but the habit **"if you don't understand it, step through it in GDB, see it with your own eyes."** And the promise from the start: there is no magic in the machine — just instructions you can now read. The box is open.

---

## 🔗 Related Topics

- [00_buradan_basla.md](./00_buradan_basla.md) — Recall where you started; every item on the "what you'll be able to do at the end" list is now in your hands
- [19_c_ile_assembly_koprusu.md](./19_c_ile_assembly_koprusu.md) — Reading compiled code; the direct first step of reverse engineering
- [14_stack.md](./14_stack.md) — The heart of binary exploitation; the basis of the idea of "crushing the return address"
- [../binary_exploitation/00_buradan_basla.md](../binary_exploitation/00_buradan_basla.md) — The direct continuation of this course: start *bending* the flow you learned

---

**Previous topic:** [19_c_ile_assembly_koprusu.md](./19_c_ile_assembly_koprusu.md)
**Next step:** [The Binary Exploitation series](../binary_exploitation/00_buradan_basla.md) — 🎉 **The x86 Assembly series is completed here.** Keep bending the stack you learned.

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
