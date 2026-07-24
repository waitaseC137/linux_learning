# 📞 x86 Assembly — `call` and `ret`: Functions

> In 14 we handed the worker a notepad (the stack) and left off with a small promise: *"the real life of the stack begins with functions; you learned `push`/`pop` so that in 15 functions won't look like magic, but like 'leaving a note on the stack.'"*
> This is that moment. In this lesson we'll learn to write one piece of work **once and use it many times** — in programming this is called a **function**. And we'll see that the whole secret of functions is hidden in that simple stack you learned in 14.

> **This lesson has code, and we run all of it.** Every program, every exit code, and every GDB output below is real: I assembled and ran it on my own machine.

---

## 📋 Table of Contents

- [A Reusable Piece: The Function](#a-reusable-piece-the-function)
- [What `jmp` Is Missing: But Where Do I Return To?](#what-jmp-is-missing-but-where-do-i-return-to)
- [`call` and `ret`: Go and Come Back](#call-and-ret-go-and-come-back)
- [Behind the Curtain: `call` = `push` + `jmp`](#behind-the-curtain-call--push--jmp)

---

## A Reusable Piece: The Function

Say you need to do a job in **many places** in your program — for example, "add 5 to the number in hand." You could rewrite those three lines everywhere you need them, but that's both tiring and error-prone. Better: write that piece **once**, give it a name, and every time you need it just say "run this."

That's exactly what a **function** is: a reusable piece of code that has a name. With the **label** you learned in 11 (`ekle5:`) you give the piece a name, then you call it from wherever you want. And the beauty of it: you can call the same piece **multiple times**. In this program we call `ekle5` twice:

```nasm
_start:
    mov eax, 10
    call ekle5         ; 10 + 5 = 15
    call ekle5         ; 15 + 5 = 20  (reused the same piece)
    ...
ekle5:
    add eax, 5
    ret
```

This program gives `20` (we'll run it in a moment) — we used the three-line `ekle5` piece twice, without copying it at all. But how does "calling" (`call`) actually work? To understand that, let's first see why the only "go" instruction we have (`jmp`) isn't enough.

> 🔑 **Function** = a reusable piece of code that has a name. Write it once, use it every time you call it. It's named with a label (11) and called with `call`. The goal: to avoid copy-paste.

---

## What `jmp` Is Missing: But Where Do I Return To?

Your first instinct might be "I'll do `jmp ekle5`, done." The going part really is like that — but there's a problem: when `ekle5` finishes its work, **where does it return to?**

Think about it: we called `ekle5` from two different places in the program. When `ekle5` finishes, sometimes it needs to return below the first call, sometimes below the second call. But `ekle5` itself is always the same — we can't write a fixed "return here" address into it, because the place to return to is **different on every call.**

So the thing that's missing is **memory**: we need to **jot down** somewhere the fact of "where was I right before I called you?", and when the worker returns, to **read** that note. Leaving a temporary value somewhere and taking it back later... this should sound familiar — this is exactly the job of the **stack** from 14.

> 🔑 `jmp` **goes** to the function but doesn't remember "where to return to." When the same function is called from different places the return point changes; that's why jotting down a **return address** somewhere is essential. That "somewhere" = the stack (14).

---

## `call` and `ret`: Go and Come Back

x86 put these two jobs (go + remember the return / come back) into two instructions:

- `call label` → **remember the return address, then go to `label`.**
- `ret` → **return to the remembered return address.**

The two are a pair: you go with `call`, you return with `ret`. You put `ret` at the end of the function; it means "return to whoever called me." `fonksiyon.asm`:

```nasm
section .text
    global _start

_start:
    mov eax, 10
    call ekle5         ; go to ekle5 (and remember the return)
    mov ebx, eax       ; ← ekle5 returns here. result (15) to exit
    mov eax, 1
    int 0x80

ekle5:
    add eax, 5         ; eax += 5
    ret                ; return to the caller
```

Follow the flow: `eax = 10`, `call ekle5` → the worker goes to `ekle5`, does `add eax, 5` making `eax = 15`, says `ret` → returns to the line **right below** the `call` (`mov ebx, eax`). Run it:

```
nasm -f elf32 fonksiyon.asm -o fonksiyon.o
ld -m elf_i386 fonksiyon.o -o fonksiyon
./fonksiyon
echo $?
```

```
15
```

Now run the two-call version from the top (`fonksiyon2.asm`, `call ekle5` twice):

```
20
```

**There's your reusable piece.** You wrote `ekle5` once; call it once and you get 15, call it twice and you get 20. Every `call` went, made it do the work, and `ret` returned it to the right place. But how do `call`/`ret` pull off this "coming back" trick? Let's pull the curtain aside — and you'll see why 14 came right before this lesson.

> 🔑 `call label` = remember the return address + go to the label. `ret` = return to the remembered address. You put `ret` at the end of the function. `call`/`ret` are a pair: one goes, one returns.

---

## Behind the Curtain: `call` = `push` + `jmp`

Here's the secret, and it's not magic at all. `call ekle5` actually does two things:

1. **`push`** — pushes the address of the next instruction (the return address) onto the stack.
2. **`jmp ekle5`** — jumps to the function.

And `ret` does just one thing: it **`pop`**s the address at the top of the stack and jumps there. So the "return address" is nothing but a note left on the stack from 14! Let's see this with our own eyes in GDB.

First let's know the addresses from the disassembly — the instruction **after** `call` is `mov ebx, eax`, at address `0x804900a`:

```
 8049005:  call   8049013 <ekle5>
 804900a:  mov    ebx,eax          ← instruction after call = return address
 ...
 8049013 <ekle5>:  add eax,0x5
 8049016:          ret
```

Now let's look at `esp` and the top of the stack before and after `call`:

```
call BEFORE  esp = 0xffffc570    (next instruction = will be the return address: 0x804900a  mov ebx,eax)
call AFTER   esp = 0xffffc56c    stack top [esp] = 0x0804900a    eip now: 0x8049013 <ekle5>
```

Catch three things at once:

1. **`esp` decreased by 4** (`c570 → c56c`) — that is, `call` did a **`push`** (14: push = esp−4).
2. **`0x0804900a` was written to the top of the stack** — exactly the address of the instruction after `call` (`mov ebx, eax`). There's the **return address**, jotted into the notepad.
3. **`eip` jumped to `0x8049013`** (`ekle5`) — we went to the function.

`call` = "jot the return address onto the stack, then leap to the function." When the function finishes its work and says `ret`, that note (`0x804900a`) is `pop`ped from the stack and the worker returns right there. If you call from different places, a different return address is jotted down each time — the problem `jmp` couldn't solve is solved with a single `push`/`pop`.

> 🔑 `call` = **`push` (return address) + `jmp` (to the function)**; `ret` = **`pop` (return address) + go there.** The return address is a note left on the stack (14!). Functions aren't magic; they're just jumps that "write onto the stack where to return to." That's why 14 came right before 15.

> ⚠️ Small but critical: if you `push` inside the function and forget the balancing `pop`, `ret` will find **the value you left** at the top of the stack instead of the return address and "return" there — the program crashes or goes haywire. How we keep the stack **balanced** inside a function (and how we pass data to a function) is exactly the topic of lesson 16.

---

## Summary — Keep in Mind

```
☐ FUNCTION = a reusable piece of code that has a name (named with a label, called with call). Avoids copy-paste.
☐ Why jmp isn't enough: it goes but doesn't remember "where to return to." Different call sites → different return point.
☐ call label = REMEMBER the return address + go to the label.   ret = RETURN to the remembered address. (A pair; end of function = ret.)
☐ BEHIND THE CURTAIN (no magic):
    - call = push (return address = address of the instruction after call) + jmp (to the function).
    - ret  = pop (return address) + go there.
    - Return address = a note left on the stack from 14.
    - gdb proof: at call esp c570→c56c (-4 = push), [esp]=0x804900a (instruction after call), eip→ekle5.
☐ Verified: one call 10+5=15 ; two calls 10+5+5=20 (same piece reused).
☐ WATCH OUT: if push/pop is unbalanced inside a function ret returns to the wrong place → crash. Balance + passing data = lesson 16.
```

---

## 🔗 Related Topics

- [14_stack.md](./14_stack.md) — the foundation `call`/`ret` is built on; the return address is a note `push`ed onto the stack. This lesson wouldn't exist without 14
- [11_ziplamalar.md](./11_ziplamalar.md) — `call` is essentially a `jmp` (+ a return address); labels come from here too
- [09_aritmetik.md](./09_aritmetik.md) — the `add` inside `ekle5`; functions package up familiar instructions
- [04.5_registerin_ici.md](./04.5_registerin_ici.md) — `eip` ("where am I"); `call`/`ret` are really about managing `eip` through the stack

---

**Previous topic:** [14_stack.md](./14_stack.md)
**Next topic:** [16_calling_convention.md](./16_calling_convention.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
