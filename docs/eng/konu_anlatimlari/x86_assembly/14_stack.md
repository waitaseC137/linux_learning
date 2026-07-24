# 🗂️ x86 Assembly — The Stack: The Worker's Notebook

> You finished Unit 2: the worker now does arithmetic (09), makes decisions (10-11), builds loops (12), plays with bits (13). But there's a problem, and it will only grow: **too few hands.** We saw it in 04.5 — a handful of registers (eax, ebx, ecx...), and that's all. So what if you need to set aside more numbers than you can hold?
> That's the subject of this unit: giving the worker a **notebook**. Its name is the **stack**, and as you'll see shortly, this notebook is also the foundation of the next two lessons — functions.

> **There's code in this lesson and we run all of it.** Every program below, every exit code, and every GDB output is real: I compiled and ran it on my own machine.

---

## 📋 Table of Contents

- [The Worker's Notebook: What Is the Stack?](#the-workers-notebook-what-is-the-stack)
- [`push` / `pop`: Put on Top, Take from Top](#push--pop-put-on-top-take-from-top)
- [LIFO: Last In, First Out](#lifo-last-in-first-out)
- [`esp` and 'Why Does the Stack Grow Downward?'](#esp-and-why-does-the-stack-grow-downward)

---

## The Worker's Notebook: What Is the Stack?

Registers are fast but **few** (04.5). When you need to do a new job in the middle of a calculation without losing a value you're holding, you have to **set it down** somewhere temporarily. You could open a named box in memory (`section .data`, 08) — but making up a name for every temporary value is tedious. You need something more practical: quickly "set this aside," then "take it back."

That's what the **stack** is for: a special region of memory that the worker uses for temporary notes. The name fits perfectly — think of a **stack of plates**:

- You put a new plate **on top** (`push`).
- When you take a plate, you again take it **from the top** (`pop`).
- You can't pull one out of the middle or from the bottom — always from the top.

This "always from the top" rule looks simple but is very powerful; we'll give it a name shortly (LIFO). For now, the mental image: the stack = the worker's notebook, where notes are added on top and taken from the top.

> 🔑 **Stack** = the region of memory used to set down temporary values and take them back; the worker's "notebook." It exists because registers are few. The rule: like a stack of plates, work is always done **from the top** — put on top, take from top.

---

## `push` / `pop`: Put on Top, Take from Top

You talk to the stack with two instructions:

- `push source` → **put** `source` **on top** of the stack.
- `pop destination` → take the value at the **top** of the stack, put it in `destination` (and remove it from the top).

So how does the worker know where the "top" is? A special register tracks it: **`esp`** (*stack pointer*). `esp` always holds the address of the value at the **top of the stack**; that is, `[esp]` (the square brackets from 08!) = the value on top.

- When you `push`: `esp` points to a new location and the value is written there — the top rises.
- When you `pop`: the value at `[esp]` is read and `esp` points to an older location — the top falls.

This movement of `esp` holds the stack's most confusing yet most elegant detail (last section). First, let's see the instructions in action.

> 🔑 `push x` = put x on top of the stack; `pop r` = take the top value into r (and remove it). The **`esp`** register always points to the top; `[esp]` = the value on top. `push` grows the top, `pop` shrinks it.

---

## LIFO: Last In, First Out

The stack of plates' "always from the top" rule has a consequence: the last plate you put down is the first one you take back. This is called **LIFO** — *Last In, First Out*. Let's prove it with a program. `stack.asm` — let's put three numbers down in order and take them back in order:

```nasm
section .text
    global _start

_start:
    push dword 10       ; put: 10
    push dword 20       ; put: 20  (on top of 10)
    push dword 30       ; put: 30  (at the very top)
    pop eax             ; take: the top → 30
    pop ebx             ; take: the next → 20
    pop ecx             ; take: the next → 10
    mov ebx, eax        ; put what we took first (30) into the exit
    mov eax, 1
    int 0x80
```

A small detail: why is that `dword` there in `push dword 10`? `10` is a bare number; the assembler can't tell how many bytes to push it onto the stack as, so you tell it by saying `dword` (= 4 bytes). In `pop eax`, though, `eax` is a register whose size is already known (32-bit) — there you don't need to write `dword`.

Follow the order: we put down `10, 20, 30` (30 was last, on top). When taking them back we started from the top: the first `pop` took **30** (the one we put down last), then 20, then 10. So they came back in **reverse** order. Run it:

```
nasm -f elf32 stack.asm -o stack.o
ld -m elf_i386 stack.o -o stack
./stack
echo $?
```

```
30
```

The first `pop` brought back the `30` we put down last — the exit code confirms it. **Last in, first out.** The order in was `10→20→30`, the order out was `30→20→10`. The stack's whole character is in that one word: LIFO.

> 🔑 The stack is **LIFO** (Last In, First Out). `push 10,20,30` then `pop,pop,pop` → `30,20,10` (reversed). You always take back what you put down last; you can't reach into the middle or the bottom.

---

## `esp` and 'Why Does the Stack Grow Downward?'

Now the loveliest detail. Your intuition probably says "as the stack grows, the addresses **increase**" — after all, we're stacking things on top. But the truth is exactly the opposite: **as the stack grows, `esp` GETS SMALLER.** The stack grows from the high addresses of memory **downward**, toward the small addresses. Let's watch `esp` at every `push` in GDB:

```
gdb ./stack
(gdb) starti
(gdb) print/x $esp        # start
(gdb) si                  # push 10
(gdb) print/x $esp
(gdb) x/1dw $esp          # value on top
... (repeat after each push)
```

Real output:

```
start esp = 0xffffc570
after push 10, esp = 0xffffc56c   top = 10
after push 20, esp = 0xffffc568   top = 20
after push 30, esp = 0xffffc564   top = 30
after pop eax, esp = 0xffffc568   eax = 30
```

So who set that first `esp` value (`0xffffc570`) before you even did a single `push`? Not you: when the program starts, the operating system prepares the stack region and writes the top address into `esp` — the notebook comes already open, pen in hand. (The OS rules over memory and hardware; a closed box for now, we'll open it in 17.)

Look at the addresses: at every `push`, `esp` decreased by exactly **4** (`c570 → c56c → c568 → c564`). Four each time, because a dword is 4 bytes (03/08). The value was written to that new (smaller) address — `[esp]` always points to the top. And when you did `pop eax`, `esp` went back **up by 4** (`c564 → c568`) and took the value (30). So:

- **`push`** = decrease `esp` by 4, write the value there. (the top descends)
- **`pop`** = take the value at `[esp]`, increase `esp` by 4. (the top rises)

But why downward? The logic is this: think of memory as a street. The **program itself** (code and data) sits at the **bottom** end of the street (small addresses) — like the `0x8049000` you saw in 11. The stack is placed at the **top** end of the street (big addresses) and grows **downward**. This way the two start from opposite ends of the street and grow **toward each other**; both can use the space in the middle, and no room is wasted. If you grew both in the same direction, one would collide with the other sooner.

> 🔑 The stack grows **downward**: `push` → `esp` **decreases by 4** (the top descends to a small address), `pop` → `esp` **increases by 4**. The reason: the program starts from the bottom of memory (small address), the stack from the top (big address); by growing in opposite directions they share the same gap without colliding. Counterintuitive but consistent.

> 💡 **You might be wondering:** *"What is this LIFO / notebook going to be good for? Putting down and taking back three numbers is a bit of a toy."* You're right — its real power isn't on its own. The stack's real life begins in the next two lessons: **functions.** When a worker is about to "go do another job and come back," it writes down "where it will return to" and the values it's holding in this notebook (15), then reads them back when it returns. You learned `push`/`pop` now so that in 15 functions won't look like magic — just like "leaving a note on the stack."

---

## Summary — Keep in Mind

```
☐ STACK = the temporary-value region of memory; the worker's "notebook" (because registers are few). Like a stack of plates: always from the top.
☐ push x = put x on top ;  pop r = take the top value into r (and remove it).
☐ the esp register ALWAYS points to the top; [esp] = the value on top.
☐ LIFO (Last In First Out): push 10,20,30 → pop,pop,pop = 30,20,10 (reverse order). What you put down last comes out first.
☐ The stack grows DOWNWARD (counterintuitive):
    - push → esp DECREASES by 4 (dword=4 bytes), the value is written there.
    - pop  → the value is read, esp INCREASES by 4.
    - gdb proof: esp c570→c56c→c568→c564 (each push -4), +4 back on pop.
    - Why: the program from the bottom of memory, the stack from the top; growing in opposite directions they share the gap without colliding.
☐ Why it matters: this is the foundation of functions (15). "Where I'll return to" + temporary values are written to the stack.
```

---

## 🔗 Related Topics

- [04.5_registerin_ici.md](./04.5_registerin_ici.md) — The fact that registers are "few"; the stack is exactly the solution to that scarcity. `esp` is a register too
- [08_mov_ve_bellek.md](./08_mov_ve_bellek.md) — `[...]` = "the box at the address"; `[esp]` = the value on top. The stack is memory after all
- [08.5_little_endian.md](./08.5_little_endian.md) — The dwords written to the stack also sit in memory byte by byte; the same layout rule
- [03_sayilar_ikilik_onaltilik.md](./03_sayilar_ikilik_onaltilik.md) — "Why 4?" — a dword is 4 bytes; the reason `esp` moves 4 at a time

---

**Previous topic:** [13_bit_islemleri.md](./13_bit_islemleri.md)
**Next topic:** [15_call_ve_ret.md](./15_call_ve_ret.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
