# 🗂️ x86 Assembly — mov and Memory: Reaching Into Boxes with `[...]`

> In 04 we sketched the worker's **warehouse–pocket dance**: FETCH (from memory to pocket), PROCESS (in the pocket), DROP (from pocket to memory). But back then we said "we'll see the real instructions in Unit 1."
> This is that moment: in this lesson we do **FETCH** and **DROP** with a real instruction — again `mov`.

> And in 04 we planted a seed: *one box can hold the address of another box* (a pointer). We said "we're leaving actually following it to 08."
> Today we keep that promise too: for the first time you'll **follow a pointer** and grab the value at the place it points to. The only new thing is a small mark: **`[...]`**.

---

## 📋 Table of Contents

- [`[...]`: The Box at an Address](#-the-box-at-an-address)
- [Putting a Box in Memory: `section .data`](#putting-a-box-in-memory-section-data)
- [FETCH: From Memory to a Register](#fetch-from-memory-to-a-register)
- [DROP: From a Register to Memory](#drop-from-a-register-to-memory)
- [Your First Pointer Follow](#your-first-pointer-follow)

---

## `[...]`: The Box at an Address

So far you've seen two forms of `mov` (06): `mov eax, 5` (a number into a box) and `mov ebx, eax` (box to box). In both, the source and destination were **registers** — boxes in the worker's pocket. But most of the work sits in the **warehouse** (in memory); how do we reach out there?

The answer is a single mark: **square brackets, `[...]`.** The rule is this simple:

- A number/name without brackets → **the value itself.** `mov eax, 5` = "put 5 into eax."
- Inside brackets → **"the contents of the box at that address."** `mov eax, [5]` = "**go to box number 5**, put the value there into eax."

This is the real-instruction form of the address/value distinction from 04. The brackets are the way to tell the worker "this is an address — go there, take what's there." Think of the brackets as a "→ go there" arrow: `[number]` = "go to the *place number points to*."

A warning: the `[5]` here only shows the **idea** — 5 isn't a real address that belongs to you. Don't try to run this on its own in a program; the kernel will say "that's not yours" and stop the program. In a moment we'll actually do the same job with `[number]` over an *allowed* address.

> 🔑 `[...]` = "this is an address, go there and use the value there." Without brackets = the value itself; with brackets = the contents of the box at that address. This is the instruction-level counterpart of the address/value distinction from 04.

---

## Putting a Box in Memory: `section .data`

To be able to read from memory, we first need to have **something** in memory. So far our programs used only `section .text` (the code section). To put our data, there's a second section: **`section .data`.**

```nasm
section .data
    sayi:  dd 42
```

Line by line:
- `section .data` → "from here on it's **data**, not code."
- `sayi:` → the **label** (name) we tack onto the box we put in memory. Actually `sayi` is the **address** of that box — we give it a readable name so you don't have to memorize the numeric address.
- `dd 42` → **d**efine **d**word: "make room for 4 bytes (as big as a register; see 04), put 42 inside." (`db` = 1 byte, `dw` = 2 bytes, `dd` = 4 bytes.)

So `sayi: dd 42` means **a 4-byte box named "sayi" with 42 written inside** in memory. Now when you write `[sayi]` in the code, the worker will understand "go to sayi's address, take the value there."

> 💡 **You might be wondering:** *"You said `sayi` is an address, but I wrote `42` — which is it?"* They're two separate things, just like in 04: `sayi` is the box's **place** (address), `42` is the box's **contents** (value). If you write `sayi` in the code you mean the address, if you write `[sayi]` you mean the 42 inside. In a moment we'll see both in gdb — the address is a big number, the value is 42.

---

## FETCH: From Memory to a Register

The **FETCH** step of 04: pull a box from the warehouse into the pocket. The real instruction:

```nasm
mov eax, [sayi]        ; "go to sayi's address, put the value there into eax"
```

Let's try it with a full program. `bellek.asm`:

```nasm
section .data
    sayi:  dd 42

section .text
    global _start

_start:
    mov eax, [sayi]         ; FETCH: read from memory → eax = 42
    mov dword [sayi], 99    ; DROP: write to memory → sayi is now 99
    mov eax, [sayi]         ; read again (proof) → eax = 99
    mov ebx, eax            ; the result into the exit code
    mov eax, 1
    int 0x80
```

Assemble and open in gdb (the habit from 07):

```
nasm -f elf32 bellek.asm -o bellek.o
ld -m elf_i386 bellek.o -o bellek
gdb ./bellek
(gdb) set disassembly-flavor intel
(gdb) starti
```

This time we won't just look at a register, but at **memory itself**. The command to look at a memory box is **`x`** (*examine*): `x/1dw &sayi` = "show 1 dword at sayi's address in decimal." (`&sayi` = "sayi's address"; `d` = show in decimal; `w` = **a 4-byte dword**.)

> 💡 **Don't mix it up:** the `w` here is the **same letter but a different dictionary** than the `dw` in `section .data`. In NASM, `dw` = 2 bytes; in gdb's `x/…w`, `w` = **4 bytes** (dword). Same letter, two tools, two sizes — here it shows 4 bytes.

```
(gdb) info registers eax
(gdb) x/1dw &sayi
```

The real output — before any instruction has run yet:

```
eax            0x0                 0
0x804a000:	42
```

`eax` is still `0` (no loading has happened), but **`sayi` in memory** is already `42` — because we put it there with `dd 42`. The `0x804a000` on the left is sayi's **address** (we'll use that big number in a moment on the pointer tour).

Now run `mov eax, [sayi]`:

```
(gdb) si
(gdb) info registers eax
```

```
eax            0x2a                42
```

**That's FETCH.** `eax` is now `42` (`0x2a`, from 03: the hexadecimal of 42) — the value came from memory into the pocket. The "pull from warehouse into pocket" step we drew as a Turkish draft in 04, you've now done for the first time with a real instruction.

---

## DROP: From a Register to Memory

Now the reverse direction — the **DROP** step of 04: put a value from the pocket (or from our hand) into the warehouse. The destination is bracketed (an address), the source is the value:

```nasm
mov dword [sayi], 99        ; "write 99 to sayi's address"
```

The `dword` here is a small but necessary detail: when writing **a number directly** (99) into memory, the worker can't know "how many bytes should I write — 1 or 4?" (99 fits in all of them). `dword` tells it "write 4 bytes." (If the source were a register — `mov [sayi], eax` — you wouldn't need to write this, since a register is already 4 bytes.)

Continue in gdb from where we left off — do one `si`, then look at **memory**:

```
(gdb) si
(gdb) x/1dw &sayi
```

```
0x804a000:	99
```

**That's DROP.** The memory box that was `42` a moment ago is now `99`. You saw with your own eyes that you changed memory *itself* — not a register, but a box in the warehouse. Let's read it one more time as proof (`mov eax, [sayi]`):

```
(gdb) si
(gdb) info registers eax
```

```
eax            0x63                99
```

`eax` is `99` this time, not `42` (`0x63`) — because 99 is now written in memory. FETCH → DROP → FETCH again: you've spun 04's dance from start to finish with real instructions. (When the program ends, `echo $?` — in fish: `echo $status` — says **99**; because on exit the 99 we put into `ebx` is read.)

> 💡 Forward note: with `x/1dw` we looked at memory as "one big number" and saw a clean `42`/`99`. But how those 4 bytes are laid out in memory *one by one* — which byte comes first? — has its own peculiar rule that seems strange at first glance. We'll open up this "exactly reversed" surprise in the next short lesson ([08.5_little_endian](./08.5_little_endian.md)) by looking at memory byte by byte. For now, "`[sayi]` = the value there" is enough.

---

## Your First Pointer Follow

Now we make 04's most powerful seed bloom. There we said: a box can hold, instead of the actual data, **where the actual data is** (its address) — we called this a **pointer** (like a coat-check ticket: the ticket isn't your coat, it tells you the *location* of your coat). And we drew that "go to the place someone points to" is two steps. Now we take those two steps with a real instruction.

The key idea: a **register** can hold an address inside it. If it does, that register is a pointer — and with `[...]` we can *follow* it. `pointer.asm`:

```nasm
section .data
    sayi:  dd 42

section .text
    global _start

_start:
    mov ebx, sayi          ; ebx = sayi's ADDRESS (NO brackets → not the value, the address)
    mov eax, [ebx]         ; go to the place ebx points to, take what's there into eax
    mov ebx, eax           ; the result into the exit code (ebx's pointer duty is done)
    mov eax, 1
    int 0x80
```

Pay attention to two instructions, because the whole lesson is in these two:
- `mov ebx, sayi` → **no brackets.** So put sayi's **address** into ebx. Now ebx is a pointer — inside it is not a value, but a *place*.
- `mov eax, [ebx]` → **with brackets.** "Go to the address inside ebx, take the value there." That is, **follow** the pointer.

Assemble, watch in gdb:

```
nasm -f elf32 pointer.asm -o pointer.o
ld -m elf_i386 pointer.o -o pointer
gdb ./pointer
(gdb) set disassembly-flavor intel
(gdb) starti
(gdb) si                       # mov ebx, sayi
(gdb) info registers ebx eax
```

The real output:

```
ebx            0x804a000           134520832
eax            0x0                 0
```

**Look inside `ebx`:** `0x804a000` — a big number, but not a **value**, sayi's **address** (its place in memory). `eax` is still 0. ebx is now a pointer: it holds not 42, but *where* 42 is. Exactly the "box 5 points to box 12" picture from 04 — here ebx points to sayi.

Now follow the pointer:

```
(gdb) si                       # mov eax, [ebx]
(gdb) info registers ebx eax
```

```
ebx            0x804a000           134520832
eax            0x2a                42
```

**That's a pointer follow.** `eax` became `42` — but we didn't write this 42 directly; we *went to the address ebx points to* and took it from there. `ebx` still holds the address (unchanged), while `eax` holds the value at that address. In 04 we said "first look at box 5 (12 inside it), read that 12 as an address, go to box 12 (the actual value is there)" — that's exactly what you did, with real instructions. (`echo $?` → **42**.)

> 🔑 A pointer = a register that holds an address. `mov ebx, sayi` (no brackets) puts the **address** into ebx; `mov eax, [ebx]` (with brackets) goes to that address and takes the **value** — that is, it *follows* the pointer. The difference is a single pair of square brackets.

> 💡 **You might be wondering:** *"`mov eax, [sayi]` already gave 42. Why do I need `mov ebx, sayi` + `mov eax, [ebx]` — two instructions for the same result?"* In this example, yes, it's the same. But the difference is this: in `[sayi]` the address is **embedded/fixed in the code.** In a pointer, the address is in a **register**, that is, *changeable* — you can put another address into ebx and reach a completely different box with the same `[ebx]` instruction. Walking through an array, carrying big data from hand to hand by its address (04) — all of it happens with this. Fixed `[sayi]` is a single door; `[ebx]` is the key that **opens whichever door you want**.

---

## Summary — Keep in Mind

```
☐ [...] = "this is an address, go there, use the value there." (04's address/value distinction, in an instruction.)
    - mov eax, 5      → 5 into eax (value)
    - mov eax, [5]    → the contents of box NUMBER 5 into eax
☐ section .data + label = putting a named box in memory.
    - sayi: dd 42   → a 4-byte box named "sayi", 42 inside. (db=1, dw=2, dd=4 bytes)
    - sayi = address (the box's place) · [sayi] = value (the box's contents).
☐ FETCH  (memory → register):  mov eax, [sayi]     → eax = the value in memory (42).
☐ DROP (register/value → memory):  mov dword [sayi], 99  → write to memory.
    - When writing a number DIRECTLY to memory, state the size: dword (4 bytes). Not needed if the source is a register.
☐ Look at memory in gdb:  x/1dw &sayi   → show the dword at that address. (&sayi = sayi's address)
☐ POINTER = a register that holds an address.
    - mov ebx, sayi   (no brackets) → ebx = ADDRESS (pointer).
    - mov eax, [ebx]  (with brackets)  → FOLLOW the pointer → eax = the value at that address (42).
    - The difference: [sayi]'s address is fixed; [ebx]'s address is in a register → changeable (that's the real power).
```

---

## 🔗 Related Topics

- [04_bellek_ve_registerlar.md](./04_bellek_ve_registerlar.md) — Where the FETCH→DROP dance and the pointer seed (address/value) were drawn; this lesson is its real instructions
- [06_ilk_gercek_program.md](./06_ilk_gercek_program.md) — The first (register-to-register) form of `mov`
- [07_gdb_tek_adim.md](./07_gdb_tek_adim.md) — The tool we used here to look live at memory (`x`) and registers
- 09_aritmetik.md 🚧 *(being written)* — The "PROCESS" step: no longer just moving, but doing arithmetic with the numbers you move

---

**Previous topic:** [07_gdb_tek_adim.md](./07_gdb_tek_adim.md)
**Next topic:** [08.5_little_endian.md](./08.5_little_endian.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
