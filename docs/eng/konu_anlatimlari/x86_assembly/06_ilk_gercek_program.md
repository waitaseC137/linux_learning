# 🎯 x86 Assembly — The First Real Program: mov and the Exit Code

> The three lines we wrote in 05 were, for now, a **closed box** — we didn't fully know what they did. Now we open the first of those boxes.
> In this lesson you learn the worker's most basic order: `mov`, that is, **"put this number in that box."**
> And for the first time, you make **a number of your own choosing** appear on the screen. A small moment —
> but for the first time you take command, and the machine listens to you.

> **We're writing real instructions now, and this time we know what we're doing.** We'll pull `mov`
> out of the skeleton from 05 and shine a light on it; we still leave the full insides of `int 0x80` to [17_sistem_cagrilari](./17_sistem_cagrilari.md).
> In the end `echo $?` will tell you the number you put in — **"8!"** — and in that moment you'll say "I made this machine do something."

---

## 📋 Table of Contents

- [mov: The Worker's First Order](#mov-the-workers-first-order)
- [What Is an Exit Code?](#what-is-an-exit-code)
- [Write and Run the Program](#write-and-run-the-program)
- [Change the Number: You Took Command](#change-the-number-you-took-command)
- [Can I See Inside a Box Directly?](#can-i-see-inside-a-box-directly)

---

## mov: The Worker's First Order

In [01_bilgisayar_nedir](./01_bilgisayar_nedir.md), when we looked at the kinds of orders the worker takes, we put "**move**" first: *"put this number in that box."* Well, the real name of that order is **`mov`** (from English *move*).

Its syntax is very simple:

```nasm
mov destination, source  ; "put the source into the destination box"
```

The form you'll use most often is putting a number into a register (a pocket box):

```nasm
mov eax, 5               ; "put 5 in the eax box"
mov ebx, 100             ; "put 100 in the ebx box"
```

Recall, `eax`/`ebx` were the worker's pocket boxes ([04_bellek_ve_registerlar](./04_bellek_ve_registerlar.md)). `mov` is exactly the way to put a value into those boxes — and it's the worker's most-used order.

> 💡 Its name is "move," but what it really does is **"copy / put."** The source is not emptied. For example you can copy from one box to another: `mov ebx, eax` = "put what's in eax into ebx" — eax still keeps its old value. (I tried this: after putting 13 in `eax` and doing `mov ebx, eax`, ebx also became 13, and eax wasn't lost.) We'll see the other, memory-related forms of `mov` in [08_mov_ve_bellek](./08_mov_ve_bellek.md); for now "put a number in a box" is enough.

> 🔑 `mov destination, source` = "put the source into the destination box." This is the only instruction you need to know in this lesson.

---

## What Is an Exit Code?

When a program finishes, it leaves behind a small number: the **exit code**. This is the program's way of saying "I'm done, and here's my one-number summary." There's a convention: **0 = no problem / success**, a nonzero number = "such-and-such a situation/error happened."

Who reads this number? The shell. And when you type `echo $?` (we met it in [05_kurulum_ve_ilk_program](./05_kurulum_ve_ilk_program.md); *if you use fish, `echo $status`*), what it shows you is exactly this: the exit code of the last program that finished.

So where does the program put this number? In the exit operation we use, the exit code is taken **from the `ebx` box**. That is:

```nasm
mov ebx, 8               ; exit code will now be 8
```

Well, recall the skeleton from 05: there we wrote `mov ebx, 0`, which is why `echo $?` always said 0. Now we'll replace that 0 with a number **of our own choosing**.

> 🔑 Exit code = the single number a program leaves behind when it finishes (convention: 0 = no problem). On exit, this number is read from the `ebx` box; so `mov ebx, <number>` determines it. You see it with `echo $?` (fish: `echo $status`).

---

## Write and Run the Program

With an editor, create a file named **`cikis.asm`** and write this:

```nasm
section .text
    global _start

_start:
    mov ebx, 8          ; exit code: 8  ← the number we chose
    mov eax, 1          ; job to do: "exit" (sys_exit request)
    int 0x80            ; call the kernel: do the above
```

You can already read most of these lines:

- `mov ebx, 8` → "put 8 in the ebx box." This will be our exit code.
- `mov eax, 1` → "put 1 in the eax box." The 1 here is the number that tells the kernel "the job to do is **exit**." (We'll fully explain where these numbers come from in [17_sistem_cagrilari](./17_sistem_cagrilari.md).)
- `int 0x80` → "call the kernel, do what I prepared above." (Its insides are also in 17.)

These two `mov`s are independent of each other — it doesn't matter which one you write first (in 05 the order was reversed, `mov eax, 1` came first; the result was still the same). What matters is that both are ready before we reach `int 0x80`.

Now assemble, link, and run with the **same chain** as in 05:

```
nasm -f elf32 cikis.asm -o cikis.o
ld -m elf_i386 cikis.o -o cikis
./cikis
echo $?
```

What you'll see:

```
8
```

There it is! This **8** on the screen isn't a random 0 like in 05 — it's **the number you put in with `mov ebx, 8`.** For the first time you told the machine a number, and it gave it right back to you.

> 💡 *If you're in the fish shell*, the last line will be `echo $status` (see 05). The result is the same: `8`.

> 💡 **You may be wondering:** *"What if I never write those last lines (`mov eax, 1` + `int 0x80`)? After the worker does `mov ebx, 42`, will it stop on its own?"* No — and the reason matters: **there is no place where the worker stops by itself.** The end of the list doesn't mean "stop." If you don't write the exit, the worker keeps on fetch-do-advance; it reads the **memory garbage** after your last line as if it were an instruction — like a brakeless car, it plunges off the cliff where your code ends. Before long it touches memory it isn't allowed to, and **that's the moment the operating system steps in:** it stops you and kills **only your program.** The terminal says `Segmentation fault`, and `echo $?` gives **139** (meaning "killed by a signal"). I really tried it: `mov ebx, 42` with no exit → `Segmentation fault`. **But the computer is perfectly fine** — the kernel, like a bouncer at the door, throws the misbehaving process out and lets it touch nothing in the system. (Proof against the "will I break something" fear from 02: you can't lock up the machine with an ordinary program.) The lesson's point: **telling the worker "stop" is your job** — that's exactly why the last of those three lines exists.

---

## Change the Number: You Took Command

Now enjoy it. Open `cikis.asm`, replace the `8` with another number — make it `42`, for example:

```nasm
    mov ebx, 42         ; exit code: 42
```

Assemble, link, run again (three commands), then `echo $?`:

```
42
```

You see whatever you put in. I really tried it: `8 → 8`, `42 → 42`. **You now determine the output** — this is the essence of programming. It looks like a small number, but a big door just opened here: the machine does what you say.

> 💡 **You may be wondering:** *"I put 300 in `ebx` and tried it, but `echo $?` said 44 — why not 300? And what happens if I put in a negative number?"* Because the exit code is **a single byte** ([03_sayilar_ikilik_onaltilik](./03_sayilar_ikilik_onaltilik.md)): it only holds 0–255, and it **wraps around in both directions** — just like a car's odometer. It overflows upward: `300` doesn't fit, so it rolls over from the top → `300 − 256 = 44`. Below, a negative wraps from the bottom: I tried `mov ebx, -5`, and `echo $?` said **251** (`-1 → 255`, `-2 → 254`, … `-5 → 251`). The name of this trick for storing a negative inside a byte is *two's complement*; we'll fully explain how it works later, in the arithmetic topic ([09_aritmetik](./09_aritmetik.md)). For now: **the exit code is a byte from 0–255, and it wraps around in both directions.**

---

## Can I See Inside a Box Directly?

You may have thought: "I put 8 in `ebx` and saw it with `echo $?`. So if I put something in `eax`, can I see that too?"

Right now you **can't** — and the reason matters: `echo $?` only shows the **exit code**, and that comes only from `ebx`. So your only "window" for now is `ebx` (by way of the exit code). Even if you put 8 in `eax`, `echo $?` won't show it; it always looks at `ebx`.

So what if you want to see inside any box (`eax`, `ecx`, `edx`… ) **at any moment** you like? For that you need a tool: **`gdb`** (recall we installed it in 05). The next lesson ([07_gdb_tek_adim](./07_gdb_tek_adim.md)) is exactly for this: gdb opens all the windows — you watch the value of each box one by one while the program runs. Your "write an instruction → see what changed" moments start there.

> 🔑 Right now the only way to see inside a box is to put it in the exit code (`ebx`) and type `echo $?`. We'll unlock seeing all the boxes whenever you want, with `gdb`, in 07.

---

## Summary — Keep in Mind

```
☐ mov dest, source  = "put the source into the dest box." The worker's most basic order.
    - mov eax, 5     → put 5 in eax        (number into a box)
    - mov ebx, eax   → copy what's in eax into ebx  (source not emptied; "move" is really "copy")
☐ Exit code = the single number a program leaves when it finishes (convention: 0 = no problem).
    - On exit it's read from ebx → mov ebx, <number> determines it.
    - You see it with echo $?  (fish: echo $status).
☐ First meaningful program: mov ebx, <number> + mov eax, 1 + int 0x80.
    Chain: nasm -f elf32 → ld -m elf_i386 → ./cikis → echo $?  → your number!
☐ Exit code is a SINGLE BYTE (03): 0..255. Wraps in both directions: overflows at the top (256→0, 300→44), a negative wraps from the bottom (-5→251). 
☐ The worker does NOT stop by itself: if you don't write the exit (int 0x80) it runs into memory garbage → Segmentation fault (139). But the kernel kills only the process, the system is fine.
☐ echo $? shows only ebx (the exit code). To see the other boxes → gdb (07).
```

---

## 🔗 Related Topics

- [01_bilgisayar_nedir.md](./01_bilgisayar_nedir.md) — Where the "move" order and the "put the result in the exit code" idea were first previewed
- [07_gdb_tek_adim.md](./07_gdb_tek_adim.md) — Seeing inside all the boxes (registers) live
- [09_aritmetik.md](./09_aritmetik.md) — With `add`/`sub`, not just putting anymore, but computing

---

**Previous topic:** [05.5_perde_arkasi.md](./05.5_perde_arkasi.md)
**Next topic:** [07_gdb_tek_adim.md](./07_gdb_tek_adim.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
