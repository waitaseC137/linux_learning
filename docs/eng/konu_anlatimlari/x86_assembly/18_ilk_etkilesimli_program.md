# 🗣️ x86 Assembly — First Interactive Program: Ask a Name, Say Hello

> In 17 we crossed a big threshold: the program **spoke** for the first time (printing "Hello World" to the screen with `sys_write`). But the conversation was one-way — the program talked, you listened. For a real interaction we need the second half: the program **listening to you.**
> This lesson is a milestone. There's very little new here; the real work is to combine the pieces you've been collecting since the start of the course — memory, register, `mov`, system call — into **one real program.** By the end you'll have a program you wrote yourself, from scratch, that asks you a question and responds based on your answer.

> **This lesson has code and we run all of it.** The program below and its output are real: I compiled and ran it on my own machine (I typed the input on the keyboard).

---

## 📋 Table of Contents

- [The Missing Piece: Reading Input — `sys_read`](#the-missing-piece-reading-input--sys_read)
- [Where the Input Goes: `section .bss`](#where-the-input-goes-section-bss)
- [Put It All Together: The Name-Asking Program](#put-it-all-together-the-name-asking-program)
- [How Much Was Read? The Return of `eax`](#how-much-was-read-the-return-of-eax)

---

## The Missing Piece: Reading Input — `sys_read`

In 17 we saw three numbers in the system-call table: `1` exit, `4` write, and one we haven't used yet, `3` — **`sys_read`** (read). You learned how to write to the screen; now the reverse: **reading** from the keyboard.

`sys_read` is the **mirror image** of `sys_write`. The same three arguments, but the direction is reversed:

| | `sys_write` (write) | `sys_read` (read) |
|---|---|---|
| `eax` | 4 | **3** |
| `ebx` (to where / from where) | 1 = screen (stdout) | **0 = keyboard (stdin)** |
| `ecx` | address of the data to write | **address where the read data goes** |
| `edx` | how many bytes to write | **at most how many bytes to read** |

So `sys_read`: "from location `0` (the keyboard), read at most `edx` bytes and put them where `ecx` points." When the user types something and presses Enter, that text fills the memory region you specified.

> 🔑 `sys_read` (eax=**3**) = read from the keyboard; the mirror of `sys_write`. `ebx=0` (keyboard/stdin), `ecx` = the address where the read data **goes**, `edx` = at most how many bytes. What the user types fills the memory at `ecx`.

---

## Where the Input Goes: `section .bss`

A small problem: `sys_read` will put what it reads somewhere — but where? We need an **empty**, pre-allocated memory region (a "buffer"). We could use `section .data` from 08, but that's for data whose **value is known up front** (like `db "Hello"`). Our input buffer has no starting value — we just want to say "reserve me 32 bytes of empty space."

There's a separate section for this: **`section .bss`** — memory that has no starting value, just **reserved** space. You ask for room inside it with `resb` ("reserve bytes"):

```nasm
section .bss
    isim:    resb 32        ; reserve a 32-byte empty buffer called 'isim'
```

`resb 32` means "32 bytes of empty space, named `isim`." Unlike `db` it doesn't write anything into it — it just opens a blank notebook page for `sys_read` to come and fill.

> 🔑 Data with a known starting value → `section .data` (`db`, 08). An empty buffer to be filled (for input) → `section .bss` (`resb N` = reserve N bytes of empty space). The input buffer goes in `.bss` because it's empty to begin with.

---

## Put It All Together: The Name-Asking Program

Now let's combine the pieces. The program's plan in plain English:

1. Write **"What's your name? "** to the screen. (`sys_write`, 17)
2. **Read** the name from the keyboard, put it in the buffer. (`sys_read`)
3. Write **"Hello, "** to the screen.
4. Write the **name** that was read back out.
5. Exit. (`sys_exit`, 17)

`selam.asm`:

```nasm
section .data
    soru:    db "What's your name? "
    soru_uz  equ $ - soru
    selam:   db "Hello, "
    selam_uz equ $ - selam

section .bss
    isim:    resb 32            ; empty buffer for input

section .text
    global _start
_start:
    ; 1) write the question
    mov eax, 4
    mov ebx, 1
    mov ecx, soru
    mov edx, soru_uz
    int 0x80

    ; 2) read the name
    mov eax, 3              ; sys_read
    mov ebx, 0              ; keyboard
    mov ecx, isim           ; put it in the buffer
    mov edx, 32             ; at most 32 bytes
    int 0x80
    mov esi, eax            ; save the number of bytes read (explained below)

    ; 3) write "Hello, "
    mov eax, 4
    mov ebx, 1
    mov ecx, selam
    mov edx, selam_uz
    int 0x80

    ; 4) write the name back (exactly as many bytes as were read)
    mov eax, 4
    mov ebx, 1
    mov ecx, isim
    mov edx, esi            ; number of bytes read
    int 0x80

    ; 5) exit
    mov eax, 1
    mov ebx, 0
    int 0x80
```

The only new line is `mov esi, eax` (in a moment). The rest is familiar: four system calls with `mov`s sprinkled between them. Assemble it, run it, and **when it asks you, type your name:**

```
nasm -f elf32 selam.asm -o selam.o
ld -m elf_i386 selam.o -o selam
./selam
```

```
What's your name? Ada
Hello, Ada
```

(Above, `Ada` is what you typed; the program read it and greeted you.) **That's it.** At the start of the course "the computer was a box"; now you've written a program for that box from scratch, one instruction at a time, that asks you a question and responds based on your answer. Something that asks you something, listens, and answers — a small but **complete** interaction.

---

## How Much Was Read? The Return of `eax`

Let's return to that `mov esi, eax` line I didn't explain, because it solves a small but important subtlety. Names have different lengths: "Ada" is 3 letters, "Rüzgar" is longer. When we write the name back out, what do we put in `edx` (how many bytes)? If we write a fixed number, we either cut the name short or print extra (garbage from the buffer).

Here's the trick: **system calls return a result, and that result comes back in `eax`** (recall the "return value is in eax" rule from 16 — same thing here). When `sys_read` finishes, `eax` tells you **how many bytes it read.** So we immediately save it into `esi` (`mov esi, eax`), then when writing the name we say `edx = esi` — that way it's **exactly what the user typed**, no more, no less. `esi` is a general-purpose register just like `eax`, `ebx` — one member of that handful you met in 04.5, put to use here for the first time. But why `esi` specifically? Because the `sys_write` that comes right after does `mov eax, 4` and would **overwrite** that value — if the read result had stayed in `eax` it would have been lost. But we never touch `esi` between the two calls, so the number waits there safe and sound. Any other register we don't touch would have worked too; the point is to get it out of `eax` and into a safe place.

```nasm
    int 0x80            ; sys_read
    mov esi, eax        ; eax = number of bytes read → save it
    ...
    mov edx, esi        ; when writing back: exactly that many bytes
```

That's why in the output we also dropped to the next line after the name: when the user presses Enter, that line-ending (`10`) is also included in the bytes read (the `10` from 17), `sys_read` counted it too, and when we wrote it back the cursor moved down a line. So the behavior isn't a "coincidence" — it's the result of honestly using the number `eax` returned.

> 🔑 A system call also gives a **return value**, in `eax` (16's rule). For `sys_read` this = **how many bytes were read.** Save it (`mov esi, eax`) and use it as the length when writing back, and you print exactly the input no matter its length. (The user's Enter = the last byte, which counts too.)

> 💡 **You might be wondering:** *"Is this program 'real', or is it still a toy?"* Small but real. It contains the whole skeleton of a professional program: take input from the user, put it in memory, process it, print the result. The only thing missing is **scale** — error checking, more features, bigger structure. But the core loop (in→process→out) is exactly this. From here on it's "more," not "different."

---

## Summary — Keep in Mind

```
☐ sys_read (eax=3) = read from the keyboard; the mirror of sys_write. ebx=0 (keyboard), ecx=where it goes, edx=at most how many bytes.
☐ Empty input buffer → section .bss:  isim: resb 32  (32 bytes of empty space). (Filled data .data/db; empty buffer .bss/resb.)
☐ Interaction skeleton: write(question) → read(answer) → write(reply) → exit. Four syscalls, mov's between them.
☐ A system call's RETURN value is in eax (16). sys_read → number of bytes read. Save it (mov esi,eax), and when writing back edx=esi.
    → You print exactly the input no matter its length (Enter's newline counts too → moves to the next line).
☐ Verified: "What's your name? " → user types "Ada" → "Hello, Ada". Works with variable-length names.
☐ MILESTONE: from scratch, one instruction at a time, you wrote a complete interactive program that asks you a question and answers.
```

---

## 🔗 Related Topics

- [17_sistem_cagrilari.md](./17_sistem_cagrilari.md) — `sys_write`, `int 0x80` and the syscall table; this lesson adds its `sys_read` half and combines the two
- [16_calling_convention.md](./16_calling_convention.md) — The "return value is in eax" rule; `sys_read` returning the byte count in eax is exactly this
- [08_mov_ve_bellek.md](./08_mov_ve_bellek.md) — `section .data`, label and address; `.bss`/`resb` is its "reserve empty space" sibling
- [06_ilk_gercek_program.md](./06_ilk_gercek_program.md) — From the first "does-nothing" program to here: now the program asks, listens, answers

---

**Previous topic:** [17_sistem_cagrilari.md](./17_sistem_cagrilari.md)
**Next topic:** [19_c_ile_assembly_koprusu.md](./19_c_ile_assembly_koprusu.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
