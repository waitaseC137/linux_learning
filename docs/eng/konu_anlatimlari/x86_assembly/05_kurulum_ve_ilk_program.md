# 🚀 x86 Assembly — Setup and Your First Program

> Throughout Unit 0 we built up what goes on inside the machine's head without writing a single line of code. That patience now pays off.
> In this lesson, for the first time, you install the real tools, write your first real program, assemble it, and **run it.**
> The program will do almost nothing — on purpose. Because the hero here isn't the program, it's the chain itself:
> how the text coming out of your keyboard turns into a real program the processor runs.

> **This is the first time there's code — but don't be scared.** You don't need to fully understand the asm you'll write just yet; writing a few lines like
> a **closed box** and seeing that the chain works is enough. What those lines actually do we'll open up one by one in the coming lessons.
> The only goal of this lesson: get the tools installed, and let you say "I ran a program."

---

## 📋 Table of Contents

- [Three Tools: nasm, ld, gdb](#three-tools-nasm-ld-gdb)
- [Install the Tools](#install-the-tools)
- [Write Your First Program](#write-your-first-program)
- [Write → Assemble → Run](#write--assemble--run)
- [Did It Work? (Nothing Happened!)](#did-it-work-nothing-happened)
- [Step by Step, What Happened?](#step-by-step-what-happened)
- [If You Got an Error](#if-you-got-an-error)

---

## Three Tools: nasm, ld, gdb

In 00 we said this: **you write assembly → a program translates it into machine code → the processor runs those numbers.** Now we're actually installing that "translating program" (and a couple of its friends). We have three tools:

- **`nasm`** — the *assembler* (translator). It turns lines you write like `mov eax, 5` into the numbers (machine code) the processor actually reads. This is our main tool.
- **`ld`** — the *linker* (combiner). It turns the raw piece nasm produces into a real program the operating system can load into memory and **run**.
- **`gdb`** — the *debugger* (watcher). It lets you step through a program one instruction at a time and watch what happens inside. In this lesson we're only **installing** it; we'll start using it in [07_gdb_tek_adim](./07_gdb_tek_adim.md).

For now, just keep in mind: **`nasm` translates, `ld` combines, `gdb` watches.**

---

## Install the Tools

Depending on which Linux distribution you use, type **one** of the lines below into the terminal. (If you don't know which one: if you use Ubuntu/Mint, the first; if you use an Arch-based one —CachyOS, Manjaro— the second; if you use Fedora, the third.)

**Debian / Ubuntu / Linux Mint:**
```
sudo apt install nasm binutils gdb
```

**Arch / Manjaro / CachyOS:**
```
sudo pacman -S nasm binutils gdb
```

**Fedora:**
```
sudo dnf install nasm binutils gdb
```

(`binutils` is the package that includes `ld`; it's already installed on most systems, but we listed it just to be safe.)

Once the installation is done, check that it installed correctly:

```
nasm --version
```

You should see a line like this: `NASM version 2.16.01`. If you saw it, your tool is ready.

> 💡 `sudo` means "do this with administrator privileges," which is why it may ask for your password. Because **installing** a program is a job that touches the system, it requires privileges — this is exactly the "changing the system requires a password" situation we touched on in 02.

---

## Write Your First Program

Now we'll write your first program. With a text editor (`nano` in the terminal, or VS Code, whatever you use), create a file named **`ilk.asm`** and write exactly this inside it:

```nasm
section .text
    global _start

_start:
    mov eax, 1          ; the number for saying "end the program" (sys_exit)
    mov ebx, 0          ; exit code: 0
    int 0x80            ; call the kernel: "do what I said"
```

Don't worry, we won't dig through it line by line — but knowing roughly what's going on is enough:

- **`section .text`** → means "from here on are the **instructions** the worker will carry out." (The code section of the program.)
- **`global _start`** and **`_start:`** → the marker telling the worker "start the program **here**." `_start` is where the worker will read the first order. (Recall the sentence from 01: "you tell the worker 'start from this line'.")
- The **three lines** below → for now a **closed box.** All together they're the way of saying "end the program cleanly." What `mov` does we'll explain in [06_ilk_gercek_program](./06_ilk_gercek_program.md), and what `int 0x80` (i.e. "calling the kernel") is we'll fully explain in [17_sistem_cagrilari](./17_sistem_cagrilari.md). Right now you don't even need to memorize it — just write it.

> 💡 If you're using `nano`: open it with `nano ilk.asm`, type the above, then **Ctrl+O** (save) → **Enter** → **Ctrl+X** (exit). The parts starting with `;` are *comments* (the worker doesn't see them, they're just notes to you); you can skip writing them if you want.

---

## Write → Assemble → Run

Your file is ready. Now we'll turn it into a program the processor can run and then run it. In the folder where `ilk.asm` lives, three commands in order:

**1) Assemble** (asm text → machine code):
```
nasm -f elf32 ilk.asm -o ilk.o
```
`nasm` reads your file and translates it into machine code. `-f elf32` means "give the output in **32-bit** ELF format" (we're writing 32-bit x86). Result: an intermediate file named `ilk.o` (*object*).

**2) Link** (object → executable program):
```
ld -m elf_i386 ilk.o -o ilk
```
`ld` turns that intermediate file into a real executable program. `-m elf_i386` means "link as **32-bit** (i386)." Result: a program named `ilk` that you can run.

**3) Run:**
```
./ilk
```
The leading `./` means "run the `ilk` program **in this folder**."

> 💡 **You might wonder:** *"We're compiling 32-bit; don't I need to install an extra 32-bit library (multilib)? The internet said so."* No — our program uses no library at all, it calls the kernel directly (`int 0x80`). So what comes out is a standalone, self-contained (*statically linked*) 32-bit program; nothing extra is needed. (If we link to the C library later, that's a separate topic.)

---

## Did It Work? (Nothing Happened!)

You typed `./ilk`, hit Enter, and... nothing happened. No text appeared on screen, the prompt came back. **Don't panic — this is exactly what's expected.**

Our program doesn't do anything; it just says "I was born, I immediately ended." We'll teach writing to the screen in [17_sistem_cagrilari](./17_sistem_cagrilari.md). So the absence of output isn't a bug, it's **by design.**

So how will we know it worked? Let's ask the program for its **exit code**. Type this:

```
echo $?
```

What you'll see:

```
0
```

This `0` means "the program ended **cleanly, without errors**" (0 = no problem). This is the proof that the chain ran from start to finish: you wrote it, it assembled, it linked, it ran, it exited cleanly.

> 💡 **If you're using a different shell:** `echo $?` works in bash and zsh (the defaults on most systems). But some shells like **fish** call this variable `$status` — if you're in fish, `echo $?` gives you an error; use `echo $status` instead (same result). Not sure? If `echo $?` gives an error, that shell uses `$status`; switch to it. (`echo $SHELL` also tells you which shell you're in.)

> 💡 `echo $?` asks "**what was the exit code of the last program that ran?**" For now it's 0, because we wrote `mov ebx, 0` in our program. In [06_ilk_gercek_program](./06_ilk_gercek_program.md) **you** will decide this number — we'll put something else in `ebx` and make `echo $?` report it. Your first "the number I put came out on screen!" moment will be there.

---

## Step by Step, What Happened?

What you just did was actually the picture we drew in 01-04 **becoming real for the first time.** Let's loop back and connect it:

```
  1) You wrote a text (ilk.asm)            → an order list close to the worker's language
  2) nasm translated it to MACHINE CODE     → to numbers (like B8 05 00 00 00 from 00) → ilk.o
  3) ld turned it into an EXECUTABLE program → into a form the kernel can load → ilk
  4) You said ./ilk:
       - the kernel put the program into memory (the storehouse)
       - told the worker "start from _start"
       - the worker carried out the instructions with fetch-do-advance
       - reaching int 0x80 it said "I'm done," control returned to you (the prompt)
```

So that fancy phrase "running a program" ([01_bilgisayar_nedir](./01_bilgisayar_nedir.md)) was exactly this: putting your list of orders into memory, telling the worker "start," and it carrying out the list. Now you've done this **with your own hands.**

---

## If You Got an Error

Getting an error on the first try is very likely — and as we said in [02_terminal_ile_tanisma](./02_terminal_ile_tanisma.md), an error isn't your enemy, it's a **clue.** The most common ones you'll hit:

- **`nasm: command not found`** (or `ld: command not found`) → the tool isn't installed. Go back to the **installation** step above and install the packages.
- **`ilk.asm:5: error: ...`** → there's a typo in your asm file. nasm tells you **which line** it's on (5 in the example); go to that line and compare it letter by letter with the code above.
- **`ld: cannot find ilk.o`** → the `nasm` step before the `ld` step didn't succeed (i.e. `ilk.o` was never created). First run the `nasm` command without errors, then `ld`.
- If a command came back without printing anything (silence) → usually a **good** sign; it means that step finished without a problem. (The worker doesn't talk unnecessarily, remember.)

Don't be afraid of typing a command wrong — worst case you get an error message, you fix it, you try again. That's the usual loop anyway: write → error → read → fix.

---

## Summary — Keep in Mind

```
☐ Three tools: nasm (asm→machine-code translator), ld (linker), gdb (watcher; we'll use it in 07).
☐ Install: with apt / pacman / dnf  nasm binutils gdb.   Verify: nasm --version
☐ First program skeleton:
    section .text + global _start + _start:  + (closed box for now) 3-line clean exit
☐ The chain (in the folder where ilk.asm lives):
    nasm -f elf32 ilk.asm -o ilk.o      (assemble: asm → object)
    ld -m elf_i386 ilk.o -o ilk         (link:     object → program)
    ./ilk                               (run)
☐ Nothing showing up is NORMAL: the program says "born-then-ended."
    echo $?  → 0  = clean exit  (in the fish shell: echo $status).  In 06 you'll decide this number.
☐ 32-bit but multilib NOT NEEDED: our program is library-free, statically linked.
☐ Error = clue: most of the time either the tool isn't installed or there's a typo.
☐ This whole chain = the real form of the "write → put in memory → let the worker run it" picture we drew in Unit 0.
```

---

## 🔗 Related Topics

- [00_buradan_basla.md](./00_buradan_basla.md) — Where the "you write → nasm translates → the processor runs" chain is first told
- [05.5_perde_arkasi.md](./05.5_perde_arkasi.md) — Behind the scenes of the commands you wrote in this lesson (`./`, `nasm`/`ld`, `_start`)
- [06_ilk_gercek_program.md](./06_ilk_gercek_program.md) — Putting a value into a register with `mov` and seeing the exit code in `echo $?`
- [17_sistem_cagrilari.md](./17_sistem_cagrilari.md) — Where `int 0x80` (calling the kernel) is fully explained

---

**Previous topic:** [04.5_registerin_ici.md](./04.5_registerin_ici.md)
**Next topic:** [05.5_perde_arkasi.md](./05.5_perde_arkasi.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
