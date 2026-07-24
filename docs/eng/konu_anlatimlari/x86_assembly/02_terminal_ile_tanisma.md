# 💻 x86 Assembly — Getting to Know the Terminal

> Until now you've always talked to the computer by *clicking*: press an icon, a window opens.
> The terminal, on the other hand, is where you give the computer orders by **typing** — not with the mouse, with the keyboard, one at a time.
> At first it looks bare and intimidating; but it's actually the cleanest way to talk directly, without a middleman, to that "letter-for-letter obedient worker" from the previous lesson.
> In this lesson, for the first time, we'll give it orders with our own hands.

> **There is not a single line of assembly in this lesson.** We'll just get to know the terminal, type a few commands into it, and *see with our own eyes* what happens. The goal: to feel comfortable in front of the terminal. That comfort will be the foundation of everything later, when you write and run code.

---

## 📋 Table of Contents

- [What Is the Terminal? (And Why Not the Mouse?)](#what-is-the-terminal-and-why-not-the-mouse)
- [How Do I Open the Terminal?](#how-do-i-open-the-terminal)
- [The Anatomy of the Terminal: Type, Press Enter, Read](#the-anatomy-of-the-terminal-type-press-enter-read)
- [Your First Order: `echo`](#your-first-order-echo)
- [Where Am I? What's Here?](#where-am-i-whats-here)
- [Make a Folder, Go Inside](#make-a-folder-go-inside)
- [Create a File and Look Inside It](#create-a-file-and-look-inside-it)
- [What Just Happened? (A Program or a Process?)](#what-just-happened-a-program-or-a-process)
- [Did You Get an Error? Good.](#did-you-get-an-error-good)

---

## What Is the Terminal? (And Why Not the Mouse?)

When you double-click an icon, what you're really telling the computer is: "run that program." You just say it **with the mouse**. The terminal is a window where you say the same thing **by typing**: you write a command, you press Enter, the computer does it.

So why type when clicking is right there? Because:

- **Precision.** With the mouse there's no "I meant that one"; whatever command you type is exactly what runs. This is the natural way to talk to the "letter-for-letter obedient worker" from the previous lesson.
- **Power.** With a single line, you can instantly make it do work that would take minutes of fiddling with the mouse.
- **Necessity.** Writing and running assembly, compiling code, tracing a program step by step — all of this is done from the terminal. So for this course the terminal isn't a choice, it's our home.

> 💡 "Terminal", "console", "command line", "shell" — you'll hear all of them for more or less the same thing: that window where you give commands by typing. For now, don't worry about the fine differences between them.

---

## How Do I Open the Terminal?

This course is entirely about **Linux** — our assembly tools (nasm, ld, gdb) live there. We won't be using Windows or macOS; we go straight through Linux.

There are a few ways to open the terminal on Linux:

- Find and open the application named **"Terminal"** (on some systems **"Console"**) among your applications.
- Or the shortcut that works on most desktops: **`Ctrl + Alt + T`**.

> 💡 If you don't have a working Linux yet, don't worry: we'll do the full setup of the environment and tools together, start to finish, in [05_kurulum_ve_ilk_program](./05_kurulum_ve_ilk_program.md). It's perfectly fine to get through this lesson just by **reading** for now, and to come back and try the commands yourself once you've set up the terminal.

When you open it, what most likely appears is a dark-colored window with a few words in it and a small, blinking line. Don't be afraid — we'll figure it out in a moment.

---

## The Anatomy of the Terminal: Type, Press Enter, Read

That first line you see in the terminal window is called the **prompt** (the command prompt). It's the line that says to you, "go ahead, type your order." Roughly, it looks like this:

```
kullanici@bilgisayar:~$ ▮
```

Piece by piece:

```
 kullanici   → your username
 @           → means "at"
 bilgisayar  → the name of the machine
 ~           → the folder you're currently in (~ = your home folder)
 $           → the "you can type a command here" mark
 ▮           → the blinking cursor: the letters you type go here
```

You talk to the terminal in a single rhythm:

```
   1) TYPE the command
   2) Press ENTER
   3) The computer runs the command, prints the result (the output)
   4) It gives you a new prompt: "go ahead, what's next?"
```

That's all. The blinking cursor is patient because it's waiting for you; there's no rush. If you type wrong, you can delete it before pressing Enter. Let's give it its first order.

---

## Your First Order: `echo`

`echo` means "whatever I give you, write it back to the screen." It's the most harmless, most reassuring first command. Type this and press Enter:

```
echo Hello
```

What you'll see:

```
Hello
```

It worked! You told the computer something, and it did it letter for letter — no more, no less, just like that dumb-but-obedient worker. Print something else if you like:

```
echo i command the computer
```
```
i command the computer
```

> 💡 This little moment matters: **you** made that text appear on the screen, without clicking anywhere with the mouse. That's the whole logic of the terminal — type, let it run, see the result.

---

## Where Am I? What's Here?

The terminal is always standing **inside a folder** (just like you're standing in an open folder in a file manager, but invisibly). Two basic questions:

**"Which folder am I in right now?"** → `pwd` (in English, *print working directory*)

```
pwd
```
```
/home/kullanici
```

So right now you're in the home folder of the person named `kullanici`. (The `~` mark in the prompt was already telling you this.)

**"What's in this folder?"** → `ls` (in English, *list*)

```
ls
```
```
Documents  Downloads  Desktop  Pictures
```

`ls` lists the files and folders in the folder you're in. In an empty folder it prints nothing — that's normal too, it means "there's nothing here."

> 🔑 Keep in mind: in the terminal you are **always somewhere.** "Where am I?" `pwd`, "what's here?" `ls`. If you feel lost, these two are your compass.

---

## Make a Folder, Go Inside

So we don't leave the course files scattered around, let's open a work folder for ourselves.

**Create a folder** → `mkdir` (in English, *make directory*)

```
mkdir asm_dersi
```

It prints nothing to the screen — but the silence here means "okay, done." (The worker doesn't talk unnecessarily.) Check with `ls`, and now `asm_dersi` should show up.

**Go inside the folder** → `cd` (in English, *change directory*)

```
cd asm_dersi
```

Now if you type `pwd` you'll notice you see `/asm_dersi` at the end — you went inside. If you want to go back out:

```
cd ..
```

`..` means "one folder up." With `cd` you move between folders like walking between the rooms of a building.

> 💡 While typing a command, try writing the first few letters of a folder/file name and pressing **Tab** — the terminal completes the rest for you. It both speeds you up and prevents typos. (This is called *tab completion*; it'll be indispensable to you.)

---

## Create a File and Look Inside It

While you're inside the `asm_dersi` folder, let's create a small note file:

```
echo "my first note" > not.txt
```

There are two new things here. First, the `"..."` quotes: they hold several words together as a single piece of text. In `echo Hello` there was no need since it was a single word (the three-word example above also worked without quotes); but when writing text to a file, quotes are the cleanest way of saying "all of these are one piece." Second, the `>` mark: normally `echo` would write the output **to the screen**; `>` instead means "write the output not to the screen, but **to that file**." So this line creates a file named `not.txt` with `my first note` written inside it. Nothing appears on the screen — the output went to the file now.

If you type `ls` you'll see `not.txt`. So what's inside it? **To see the contents of a file** → `cat`:

```
cat not.txt
```
```
my first note
```

There you go: you created a file and looked inside it — all from the keyboard.

> ⚠️ Careful: `>` **wipes the file's contents and writes from scratch.** If `not.txt` is already full and you do `echo "..." > not.txt` again, the old content is erased. If you want to **append to the end** of the content, use a double `>>` instead of a single `>`. For now, just jot this down on the side.

---

## What Just Happened? (A Program or a Process?)

Now let's go back and make a nice connection. `echo`, `ls`, `cat` — these are all actually **programs.** Small programs that sit on the disk and know how to do the job of "write to the screen", "list the folder", "show the file".

What happens when you type `ls` and press Enter is the very picture from the previous lesson:

```
  1) The operating system finds the program named "ls" on the disk
  2) It loads it into memory (the storehouse)
  3) The worker (the processor) runs that program's list of orders → the output comes to the screen
  4) The program ends, control returns to you → a new prompt
```

> 🔑 Here those two words become concrete:
> - **Program** = the list of orders sitting on the disk (the recipe). E.g.: the `ls` program.
> - **Process** = that program loaded into memory and **currently running** (the recipe cooking in the kitchen).
>
> So `ls` is a program on the disk; when you run it a short-lived process is born, does its job, dies, and gives you back the prompt. Every command is a small process being born and dying.

Later we'll write and run **our own** program with `nasm`. That will be exactly like this: the file you write is a program on the disk, and when you run it, a process. The terminal is where you kick off this cycle.

---

## Did You Get an Error? Good.

Sooner or later you'll type a command wrong. For instance, instead of `echo`, by mistake:

```
eco Hello
```
```
eco: command not found
```

No panic — this isn't the terminal getting mad at you; it's just saying **"I don't recognize a program called eco"**. In other words, you typed a letter wrong. Fix it, try again. That's exactly the usual programming cycle: type → get an error → read → fix.

See error messages as a **clue, not an enemy**. Most of the time they tell you exactly what's wrong:

- `command not found` → you typed the command name wrong, or that program isn't installed.
- `No such file or directory` → you gave a file/folder name that doesn't exist (again, most of the time a typo).
- `Permission denied` → you don't have permission to do that job (we'll touch on this later).

> 💡 All three of the most common errors actually turn out to be "typos." That's why **completion with Tab** (which we saw above) is both a speed boost and a shield against errors.

> 💡 **You might be wondering:** *"If I type something wrong, could I accidentally delete my precious Linux or my files?"* The commands you know (`echo`, `ls`, `pwd`, `cd`, `mkdir`, `cat`) **delete** nothing — they only look, move around, and create. The real sharp knife that deletes files is `rm`, but we haven't even taught it yet; when it comes, we'll point at it loudly. Typing a command wrong is harmless too: the result is at most `command not found`, meaning nothing happens. (System files also require `sudo` + a password, so you can't stumble into them by accident.)

---

## Summary — Keep in Mind

```
☐ Terminal = the window where you give the computer orders by TYPING, not with the mouse.
☐ Rhythm: type the command → Enter → read the output → new prompt.
☐ In the terminal you're always inside a folder:
    - pwd  → "where am I?"       (which folder)
    - ls   → "what's here?"      (file/folder list)
☐ Navigating and creating:
    - mkdir <name>  → create a folder
    - cd <name>     → go into a folder   |   cd ..  → one folder up
☐ File:
    - echo "..." > file  → write output not to the screen but to a file (WIPES its contents; use >> to append)
    - cat file           → show the file's contents
☐ echo/ls/cat are PROGRAMS; when you run them they become short-lived PROCESSES.
☐ Error = not an enemy, a clue. Most errors are typos. Complete with Tab.
```

---

## 🔗 Related Topics

- [01_bilgisayar_nedir.md](./01_bilgisayar_nedir.md) — The "worker" that runs the program and the program/process distinction
- [05_kurulum_ve_ilk_program.md](./05_kurulum_ve_ilk_program.md) — Installing the assembly tools in the terminal and running the first program
- [03_sayilar_ikilik_onaltilik.md](./03_sayilar_ikilik_onaltilik.md) — Counting the way the machine counts

---

**Previous topic:** [01.5_sayi_ve_anlam.md](./01.5_sayi_ve_anlam.md)
**Next topic:** [03_sayilar_ikilik_onaltilik.md](./03_sayilar_ikilik_onaltilik.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
