# 📜 x86 Assembly — Calling Convention: Giving Data to a Function

> In 15 we wrote a function called `ekle5`, but we pulled a little trick: the function took its data straight from `eax` and left the result back in `eax` — we just said "everyone use eax" and moved on. Real functions don't work like that.
> Because you have to tell a real function **"add these two numbers"**: how do you *give* it the numbers? Where do you *collect* the result from? And that "stack balance" business I warned about at the end of 15 — whose responsibility is it? That's the subject of this lesson: a shared **contract** everyone abides by.

> **This lesson has code and we run all of it.** Every program, every exit code, and every GDB output below is real: I compiled and ran them on my own machine.

---

## 📋 Table of Contents

- [We Need a Contract: cdecl](#we-need-a-contract-cdecl)
- [Pass Arguments via the Stack, Get the Result in `eax`](#pass-arguments-via-the-stack-get-the-result-in-eax)
- [The `ebp` Anchor: Prologue and `[ebp+8]`](#the-ebp-anchor-prologue-and-ebp8)
- [All Together: `Topla(3, 5)`](#all-together-topla3-5)

---

## We Need a Contract: cdecl

There is no "natural" way to give data to a function — someone has to **set the rules**. The caller and the callee are two separate pieces of code; if they don't agree, it's chaos. For example:

- Should the caller put the numbers in `eax`/`ebx`, or on the stack?
- Where should the function leave its result so the caller can find it?
- If the function trashes `ecx` while running, does the caller's `ecx` get destroyed?
- Who cleans up the arguments pushed onto the stack afterward?

We need an **agreement** whose answers to these questions everyone knows in advance. This agreement is called a **calling convention**. There is no single "right" one — different systems have different conventions. On **32-bit Linux** the most common is **cdecl**; that's the one we'll learn.

cdecl's three core rules (the rest is detail):

1. **Arguments are pushed onto the stack** — and moreover **right to left** (last argument first).
2. **The return value comes back in `eax`.**
3. **The caller cleans up the arguments** (not the function).

(The answer to the question we asked above — *"if `ecx` gets trashed, does the caller's `ecx` get destroyed?"* — is also part of this contract: which register is preserved by whom is bound to a definite rule. But that's a detail — for now these three rules are enough to write `Topla`, so we won't get into that subtlety.)

Now let's see each of these one by one, with running code.

> 🔑 **Calling convention** = the agreement between the caller and the function about "where we'll put the data, where we'll get the result from, who will clean up." There's no single right answer; on 32-bit Linux the standard is **cdecl**: arguments on the stack (right to left), result in `eax`, cleanup on the caller.

---

## Pass Arguments via the Stack, Get the Result in `eax`

In 15 we looked for a way to give data to a function and saw that we put the return address on the stack. Arguments go to the same place: **before calling, you `push` them onto the stack.** cdecl wants them **right to left** — that is, for `Topla(3, 5)` you push `5` first, then `3`:

```nasm
    push dword 5        ; 2nd argument first (right to left)
    push dword 3        ; 1st argument after
    call topla
```

Why reversed? This way, **right before `call`**, the 1st argument sits at the top of the stack; when `call` pushes the return address on top of it (15), the top becomes the **return address** again, and the 1st argument stays right **below** it (closest to the return address) — so when the function asks "where's my first argument?" it looks at a consistent spot. We'll see its exact address in a moment.

The result comes back in `eax` (rule 2) — after all, `ekle5` in 15 already left its result in eax; cdecl just makes this an official rule. When the function returns, the caller looks at `eax` and finds the result there.

> 🔑 Arguments are `push`ed onto the stack **before** `call`, in cdecl **right to left** (last argument pushed first → first argument stays on top). The return value comes in **`eax`**. Data going in: stack; result coming back: eax.

---

## The `ebp` Anchor: Prologue and `[ebp+8]`

How will the function reach the arguments? First idea: "they're at the top of the stack, I'll read them with `[esp+...]`." But there's a trap: inside the function every `push`/`pop`, and `call`, means **`esp` keeps moving** (14). Sometimes you'd look for the argument at `[esp+4]`, a moment later at `[esp+12]` — shifting ground. We need a fixed reference.

The solution is to make one register a **fixed anchor**: **`ebp`** (*base pointer*). At the start of the function you copy `esp`'s current value into `ebp`; then no matter how much `esp` moves, `ebp` **doesn't budge** and you always read the arguments relative to it. These two setup lines are called the **prologue**:

```nasm
topla:
    push ebp            ; save the caller's ebp (they need it, don't trash it)
    mov ebp, esp        ; ebp = current top → fixed anchor
```

(In this first example the caller is `_start`; it hadn't written anything meaningful into `ebp`, so the **content** of the value we save is unimportant. But **the line itself** matters: most callers have a real `ebp` that needs to be preserved — you'll see it with C functions in 19 — so the pattern saves the caller's `ebp` whoever the caller is. Here it's just protecting that "empty" one.)

After these two lines the stack is laid out like this (from 14: up = larger address). `ebp` is now fixed; relative to it, the arguments:

```
   [ebp + 12] → 2nd argument  (5)
   [ebp + 8]  → 1st argument  (3)
   [ebp + 4]  → return address  (put by call, 15)
   [ebp + 0]  → saved old ebp   ← ebp points here
```

So the **1st argument is always `[ebp+8]`**, the 2nd argument `[ebp+12]` — it doesn't change no matter what `esp` does. (Why 8? `[ebp]` holds the old ebp, `[ebp+4]` holds the return address; the arguments are above them, starting at +8.) When the work is done you return the anchor and the stack to their old state — this is called the **epilogue**:

```nasm
    pop ebp             ; give the caller's ebp back
    ret                 ; go to the return address (15)
```

> 🔑 Because `esp` keeps moving, reading arguments relative to it is fragile; instead you make **`ebp` a fixed anchor**. The **prologue** (`push ebp` / `mov ebp, esp`) sets up the anchor; now the **1st argument is `[ebp+8]`**, the 2nd is `[ebp+12]`. The **epilogue** (`pop ebp` / `ret`) restores the old state. Nearly every function begins and ends with this pattern.

---

## All Together: `Topla(3, 5)`

Let's gather all three rules into a single program. `topla_fn.asm` — a real `Topla(3, 5)` call:

```nasm
section .text
    global _start

_start:
    push dword 5        ; 2nd argument (right to left)
    push dword 3        ; 1st argument
    call topla          ; Topla(3, 5)
    add esp, 8          ; CALLER cleans up: 2 arguments × 4 bytes = 8
    mov ebx, eax        ; return value in eax → to exit
    mov eax, 1
    int 0x80

topla:
    push ebp            ; --- prologue ---
    mov ebp, esp
    mov eax, [ebp+8]    ; 1st argument  (3)
    add eax, [ebp+12]   ; + 2nd argument (5)  → eax = 8  (return value)
    pop ebp             ; --- epilogue ---
    ret
```

There's just one new piece: the `add esp, 8` after `call`. This is **rule 3** — the caller cleans up the 2 arguments (2 × 4 = 8 bytes) it pushed onto the stack. Why `add` and not `sub`? The stack grows downward (toward smaller addresses) (14); when you `push`ed the arguments, `esp` had **decreased** by 8, so cleanup **increases** it back by 8 — "erasing" here means moving `esp` above where we pushed, back up to the old top. (Recall the warning from 15: if the stack doesn't stay balanced, things break. Since it's the caller that pushes the arguments, it's also the one that cleans them.) Run it:

```
nasm -f elf32 topla_fn.asm -o topla_fn.o
ld -m elf_i386 topla_fn.o -o topla_fn
./topla_fn
echo $?
```

```
8
```

`Topla(3, 5) = 8`. Replace the arguments with two different numbers (`push 20` / `push 10`, i.e. `Topla(10, 20)`):

```
30
```

Same function, different arguments, correct result. Let's verify in GDB that the function really reads its arguments from `[ebp+8]`/`[ebp+12]` — after the prologue:

```
gdb ./topla_fn
(gdb) break topla
(gdb) run
(gdb) si                    # push ebp
(gdb) si                    # mov ebp, esp   (anchor set up)
(gdb) x/1dw $ebp+8          # 1st argument
(gdb) x/1dw $ebp+12         # 2nd argument
(gdb) x/1xw $ebp+4          # return address
```

Real output:

```
[ebp+8]  (1.arg)          = 3
[ebp+12] (2.arg)          = 5
[ebp+4]  (return address) = 0x08049009
```

**There's the contract, in action.** `3` and `5` are exactly where expected (`[ebp+8]`, `[ebp+12]`), and the return address is right between them (`[ebp+4]`), just as we learned in 15. The function read them, added them, returned the result in `eax` (8); the caller found the result in eax and cleaned up the stack. Nobody stepped on anybody's toes — because both obeyed the same contract.

> 💡 **You might be wondering:** *"Isn't all this ceremony a bit much just to add three numbers?"* In a tiny example it looks that way. But the idea is this: **any** function that obeys this contract can talk to **any** other one — the ones you write, the ones the compiler produces, the operating system's libraries. In a moment (19), when you look at the assembly of a C program, you'll see exactly this pattern — `push ebp` / `mov ebp, esp` / `[ebp+8]`. cdecl is "the common language everyone speaks"; its hassle is the price of its universality.

---

## Summary — Keep in Mind

```
☐ CALLING CONVENTION = caller↔function agreement (data where, result from where, who cleans). 32-bit Linux = cdecl.
☐ cdecl 3 rules:
    1) Arguments pushed onto the stack, RIGHT TO LEFT (last arg first → 1st arg on top).
    2) Return value in EAX.
    3) The CALLER cleans up the arguments (after call: add esp, <arg_count × 4>).
☐ ebp = FIXED ANCHOR (esp keeps moving, can't be trusted):
    - PROLOGUE:  push ebp ; mov ebp, esp
    - Arguments:  1st = [ebp+8] ,  2nd = [ebp+12]   ([ebp]=old ebp, [ebp+4]=return address, above them the arguments)
    - EPILOGUE:  pop ebp ; ret
☐ Verified: Topla(3,5)=8 ; Topla(10,20)=30. gdb: [ebp+8]=3, [ebp+12]=5, [ebp+4]=return address.
☐ Why it matters: the C compiler produces exactly this pattern too (you'll see in 19). cdecl = everyone's common language.
```

---

## 🔗 Related Topics

- [15_call_ve_ret.md](./15_call_ve_ret.md) — `call`/`ret` and the return address on the stack (`[ebp+4]`); this lesson lays a "passing data" layer on top of it
- [14_stack.md](./14_stack.md) — Where the arguments and `ebp` live; `push`/`pop` and `esp`'s movement. The prologue/epilogue are pure stack work
- [08_mov_ve_bellek.md](./08_mov_ve_bellek.md) — `[ebp+8]` = "the box at address ebp+8"; reading an argument is exactly following a pointer
- [09_aritmetik.md](./09_aritmetik.md) — The `add` inside the function; the contract just wraps around it

---

**Previous topic:** [15_call_ve_ret.md](./15_call_ve_ret.md)
**Next topic:** [17_sistem_cagrilari.md](./17_sistem_cagrilari.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
