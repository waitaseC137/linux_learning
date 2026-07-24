# 🖥️ x86 Assembly — System Calls: "Hello World" on the Screen

> For all these lessons our programs ran in the same silence: they did a calculation, put the result in the **exit code**, and we secretly read it with `echo $?`. We never printed a single letter to the screen. Today we break that silence.
> And along the way, those two mysterious lines we've copied to the end of every program — `mov eax, 1` / `int 0x80` — will finally be explained. The debt I've owed since lesson 06, saying "just write it like this for now, I'll explain it later," is paid off in this lesson.

> **There is code in this lesson and we run all of it.** Every program, every output, and every GDB line below is real: I assembled and ran them on my own machine.

---

## 📋 Table of Contents

- [Why Can't a Program Write to the Screen Directly?](#why-cant-a-program-write-to-the-screen-directly)
- [System Calls and `int 0x80`](#system-calls-and-int-0x80)
- [The First Real Output: Hello World](#the-first-real-output-hello-world)
- [An Old Debt: What Was `mov eax, 1`?](#an-old-debt-what-was-mov-eax-1)

---

## Why Can't a Program Write to the Screen Directly?

Intuition might say: "to write to the screen I'll just write something into the screen's memory, and that's that." But on a modern computer you **can't** — and this isn't a shortcoming, it's a deliberate security wall.

Think about it: dozens of programs are running at the same time (browser, music, terminal...). If each of them could touch the screen, the disk, or the network card however it pleased, it would be complete chaos — one would write into another's window, one would overwrite another's file. That's why direct access to hardware (screen, disk, keyboard) belongs **only to the operating system** (the OS — the Linux kernel). Your program runs on the "user" side, in a locked room.

So how are you going to write to the screen? **By asking the OS to do it for you.** You say, "I can't write to the screen, but you can — would you print this text for me?" The name of this request is a **system call**.

> 🔑 A program can't touch hardware (screen/disk/keyboard) **directly** — that privilege belongs only to the operating system (for security + order). The program's only path is to **ask** the OS. This request is called a **system call** (syscall).

---

## System Calls and `int 0x80`

A system call means telling the OS "do this job" — but the OS can do hundreds of jobs (write, read, open a file, exit...). You say which one you want with a **number**. On 32-bit Linux, a few basic numbers:

| Number | Name | What it does |
|:---:|---|---|
| 1 | `sys_exit` | end the program |
| 3 | `sys_read` | read input (e.g. from the keyboard) |
| 4 | `sys_write` | write somewhere (e.g. to the screen) |

The way to deliver the request to the OS — **on 32-bit Linux** — is the `int 0x80` instruction. `int 0x80` means "knock on the OS's door"; the worker stops, control passes to the OS, the OS sees the request and does it. But the OS asks "which job, with which details?"; you put the answer into **registers** beforehand. The rule:

- **`eax`** = system call number (which job).
- **`ebx`, `ecx`, `edx`** = the arguments of that job (in order).

Sound familiar? This is exactly the calling convention from lesson 16 — only this time the "function" you're calling is the operating system, and you put the arguments into registers instead of the stack. Same idea: "put the data in the agreed-upon places, then call."

> 🔑 A system call = asking the OS to do a job. **`eax`** = job number (1 exit, 3 read, 4 write), **`ebx`/`ecx`/`edx`** = arguments, then **`int 0x80`** = "knock on the door, OS takes over." (This is 32-bit Linux's way.)

---

## The First Real Output: Hello World

To write to the screen we use `sys_write` (number 4). Its arguments are:

- `ebx` = **where** to write — this is called the *file descriptor*; **`1` = the screen** (stdout).
- `ecx` = **what** to write — the **address of the text in memory** (from lesson 08: the address of a label).
- `edx` = **how many bytes** to write — the length of the text.

So: "to place number 1 (the screen), write the text at this address, this many bytes." We put the text into a label in `section .data`, just like in lesson 08. `merhaba.asm`:

```nasm
section .data
    mesaj:   db "Hello World", 10    ; 10 = end of line (newline, '\n')
    uzunluk equ $ - mesaj               ; current address - mesaj address = number of bytes

section .text
    global _start
_start:
    mov eax, 4          ; sys_write
    mov ebx, 1          ; where: 1 = screen (stdout)
    mov ecx, mesaj      ; what: the text's address
    mov edx, uzunluk    ; how many bytes
    int 0x80            ; ask the OS: write!

    mov eax, 1          ; sys_exit
    mov ebx, 0          ; exit code 0
    int 0x80
```

There are two small new things. `db "...", 10`: `db` (the byte sibling of `dd` from lesson 08) puts the text into memory byte by byte; the trailing `10` is the newline character (so the cursor drops to the next line). `uzunluk equ $ - mesaj`: `$` means "the current address"; subtracting the address of `mesaj` from it gives the **number of bytes** in between — so you don't have to count the length by hand. Assemble, run:

```
nasm -f elf32 merhaba.asm -o merhaba.o
ld -m elf_i386 merhaba.o -o merhaba
./merhaba
```

```
Hello World
```

**There's the moment.** After all those calculations, decisions, loops, and functions — for the first time the program told you something **directly**. Not a number hidden in the exit code; text on the screen, with your own eyes.

Let's see in GDB that the registers really are set up right before `int 0x80`:

```
(gdb) starti
(gdb) si   (×4 — skip the four movs)
(gdb) print $eax        →  4       (sys_write)
(gdb) print $ebx        →  1       (screen)
(gdb) print $edx        →  15      (number of bytes)
(gdb) x/s $ecx          →  0x804a000:  "Hello World\n"
(gdb) x/i $eip          →  int 0x80
```

All four registers are exactly in place: job number 4, target 1, length 15 (15 rather than 14 because the letter ü takes 2 bytes in UTF-8 — but `equ` counted this for you), and `ecx` points right at our text. When `int 0x80` fires, the OS reads these and prints to the screen.

> 🔑 Writing to the screen = `sys_write` (eax=4): `ebx`=1 (screen), `ecx`=address of the text, `edx`=number of bytes, then `int 0x80`. You put the text down with `db "...", 10` (10=newline), and `equ $ - label` counts the length for you.

> 💡 **You might be wondering:** *"`sys_read` (3) is in the table too — can we read input as well?"* Yes, by the same logic: `sys_read` takes some text from the keyboard and puts it into memory (ebx=0 = keyboard/stdin, ecx=where, edx=at most how many bytes). You've learned to write to the screen; we'll build **reading** and combine the two into a truly interactive program — *"one that asks you for something and responds based on your answer"* — in the next lesson (18).

---

## An Old Debt: What Was `mov eax, 1`?

Now go back and look at the program's **last two lines**:

```nasm
    mov eax, 1          ; sys_exit
    mov ebx, 0          ; exit code
    int 0x80
```

Recognize it? This is the pattern you've copied to the end of **every** program since lesson 06. It turns out that too was a system call — it always was, we'd just deferred the explanation until today. Now you can read every piece of it:

- `mov eax, 1` → **`sys_exit`** (call number 1): "end the program."
- `mov ebx, 0` → the argument of the exit call: **the exit code.**
- `int 0x80` → ask the OS.

And here's the point that ties the whole course together: back in lesson 06 we said "put the result in `ebx`, and `echo $?` will show it" — **why `ebx`?** Because `sys_exit`'s exit-code argument sits in `ebx` (the rule above: the first argument is `ebx`). That number `echo $?` read was actually the `ebx` you gave as an argument to `sys_exit`. You've been making a system call all along — you just didn't know its name.

> 🔑 The `mov eax, 1` / `int 0x80` you've used since lesson 06 = the **`sys_exit`** system call; `ebx` = the exit-code argument. The number `echo $?` read was this very `ebx`. That was the answer to "why do we put the result in ebx?" — the system call rule.

---

## Summary — Keep in Mind

```
☐ A program CAN'T touch hardware (screen/disk/keyboard) DIRECTLY; only the OS can (security+order). The program ASKS the OS.
☐ This request = SYSTEM CALL. On 32-bit Linux:
    - eax = call number (1=exit, 3=read, 4=write)
    - ebx, ecx, edx = arguments
    - int 0x80 = "knock on the door", control passes to the OS.  (The OS version of lesson 16's calling convention.)
☐ WRITE TO SCREEN = sys_write (eax=4): ebx=1(screen), ecx=address of the text, edx=number of bytes.
    - Text: db "Hello World", 10   (10=newline).  Length: equ $ - mesaj (counts automatically).
    - Verified: "Hello World" printed to the screen; gdb: eax=4, ebx=1, edx=15, ecx→"Hello World\n".
☐ DEBT PAID: mov eax,1 / int 0x80 = sys_exit; ebx = exit code. The number echo $? read = that ebx.
    "Why put the result in ebx?" — because sys_exit's argument is ebx. (Since lesson 06 we'd been making syscalls without realizing it.)
☐ Next up: sys_read (input) + combine it all → an interactive program that asks your name and greets you (18).
```

---

## 🔗 Related Topics

- [06_ilk_gercek_program.md](./06_ilk_gercek_program.md) — where `mov eax, 1` / `int 0x80` and the "put the result in ebx, read it with `echo $?`" pattern first appeared; the debt was incurred here and paid off here
- [16_calling_convention.md](./16_calling_convention.md) — the idea "put the arguments in the agreed-upon places, then call"; the syscall is that idea applied to the OS (registers instead of the stack)
- [08_mov_ve_bellek.md](./08_mov_ve_bellek.md) — `section .data`, labels and addresses; `ecx = mesaj` is an address, and `db` is the byte form of `dd`
- [01_bilgisayar_nedir.md](./01_bilgisayar_nedir.md) — "The operating system is the worker's boss"; why only the OS touches hardware, the big picture

---

**Previous topic:** [16_calling_convention.md](./16_calling_convention.md)
**Next topic:** [18_ilk_etkilesimli_program.md](./18_ilk_etkilesimli_program.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
