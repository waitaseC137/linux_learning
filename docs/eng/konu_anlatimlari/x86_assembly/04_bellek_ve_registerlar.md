# 🗄️ x86 Assembly — Memory and Registers

> In 01 we drew a picture from a distance: a huge warehouse, a few pockets on the worker, and a very fast but very dumb worker.
> Now we're zooming in on that picture. Exactly how big are the boxes in the warehouse, what fits inside them; how are the worker's
> pockets different from the ones in the warehouse; and how does the worker shuttle back and forth between the two all day long?
> This is the lesson that closes Unit 0 — by the time you're done, the picture in your head will be clear enough to put your first real code on top of.

> **There's still not a single line of code in this lesson.** We're only sharpening the picture from 01: taking a close look at memory
> and registers and establishing the relationship between them. We'll see the instructions and the real syntax in the next unit, when we
> write and run our first program. No rush; if this ground is solid, the rest will settle into place on its own.

---

## 📋 Table of Contents

- [A Close Look at Memory](#a-close-look-at-memory)
- [Address or Value — Once More](#address-or-value--once-more)
- [A Close Look at Registers](#a-close-look-at-registers)
- [The Worker's Real Dance: Between Warehouse and Pocket](#the-workers-real-dance-between-warehouse-and-pocket)
- [The Program Lives in These Boxes Too](#the-program-lives-in-these-boxes-too)
- [The Worker's Finger Is a Register Too](#the-workers-finger-is-a-register-too)

---

## A Close Look at Memory

In 01 we got to know memory as a "warehouse of numbered boxes": each box has a number, and inside it sits a number. Back then we said, "a box holds a number between 0 and 255, and we'll see why 255 later." After 03, we can finally fill in that blank.

Each box is exactly one **byte** — that is, 8 switches side by side (8 bits). The smallest number a byte can hold is 0 (all off), the largest is 255 (all on). Here are those rows upon rows of memory boxes, each one a byte:

```
 Address:  0      1      2      3      4      5     ...
          ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
 Content: │ 72 │ │ 13 │ │  0 │ │255 │ │ 42 │ │  7 │ ...
          └────┘ └────┘ └────┘ └────┘ └────┘ └────┘
           each box = 1 byte = 8 switches = a number between 0..255
```

The boxes' numbers — that is, their **addresses** — go 0, 1, 2, 3… **consecutively**, without leaving any gaps. And as you learned in 03, at the low level these addresses are usually written in hex: something scary-looking like `0x080484b6` is really just a **box number.** Long, but a single number.

Now that classic question: what if we want to hold a number bigger than 255? We put that on hold in 03 too — we said "the machine uses several bytes side by side." Here's how it happens:

```
 A large number like "1,000,000" does NOT FIT in a single box (a box holds at most 255).
 The machine spreads it across several CONSECUTIVE boxes:

 Address:  100    101    102    103
          ┌────┐ ┌────┐ ┌────┐ ┌────┐
          │ .. │ │ .. │ │ .. │ │ .. │   ← 4 boxes TOGETHER = a single big number
          └────┘ └────┘ └────┘ └────┘
```

So a large value means "several boxes side by side, read together." A single box is small; but boxes are cheap and ordered, so you can combine as many as you want.

> 🔑 Memory in two sentences: (1) each box is exactly 1 byte, holding 0–255; (2) a larger number is several consecutive boxes held together. The box's **number = address** (usually written in hex), the box's **inside = value**.

> 💡 Forward-note: We said "several boxes together," but the *order* in which these bytes get lined up in memory follows its own rule (one that seems odd the first time you see it). We'll see it when we actually look at memory with GDB ([07_gdb_tek_adim](./07_gdb_tek_adim.md), [08_mov_ve_bellek](./08_mov_ve_bellek.md)). For now it's enough to say "big number = several boxes" — the order isn't a worry.

> 💡 **You might be wondering:** *"That dumb worker — how does it know whether 4 boxes side by side are a single big number or 4 separate small numbers? What if I put 4 independent small values there?"* It doesn't know — there's no label on the boxes saying "we belong together." The grouping is determined entirely by the **instruction**: if it says "read 1 byte from box 100," it's a single small number; if it says "read 4 bytes," all four together are one big number. So it's **your** responsibility to read the data the way you wrote it; if you read it at the wrong size, a nonsense number comes out and the machine won't stop you. (This is exactly the "the instruction gives the meaning" rule from [01.5_sayi_ve_anlam](./01.5_sayi_ve_anlam.md).)

---

## Address or Value — Once More

In 01 we called this the distinction that "trips people up most often down the road"; it's so important that let's reinforce it once more, with a fresh example. Let's look at box number 5 in memory and say it holds 12:

```
        box number 5
          ┌──────┐
Address 5→│  12  │← Value 12
          └──────┘
   "the box's PLACE" = 5      "the box's INSIDE" = 12   (two separate numbers)
```

Address 5, value 12. Two numbers that look nothing alike, two separate roles. Think about this for a second: if someone tells the worker "bring box number 12," does the worker bring **box 5**, which has 12 inside it? No — it goes to a completely different box, **box 12**. Because "12" here was said as an address, not as a value.

Now a strange but powerful idea: the number **inside** a box can perfectly well be another box's **number.** If box 5 holds 12, you can also read it as "box 5 is *pointing me* to 12" — as if one box points at another box.

> 🔑 The same number can play the role of a **value** in one place and an **address** in another. Which role you read it in is determined by **the command you give the worker** — the box itself doesn't know, doesn't care. The "literally obedient worker" idea from 01 comes in handy right here: you supply the meaning, it just does what it's told.

Let's make this a bit more concrete, because it'll be very useful down the road. Say box 5 again holds 12, and box 12 holds 99. If we tell someone "go to the place box 5 *points to*," they have to take two steps:

```
   1) First look at box 5      → it holds 12 inside
   2) Read that 12 as an ADDRESS,
      go to box 12             → the value you actually want is there (99)

          ┌──────┐                      ┌──────┐
 Address 5│  12  │ ──────────────────►  │  99  │ Address 12
          └──────┘   "go to box 12"     └──────┘
       (holds an ADDRESS)               (the actual VALUE)
```

So box 5 holds, not the actual data, but **where** the actual data is. A box like this, holding another box's address inside it, is called a **pointer**: "box 5 points to box 12."

Ground it in everyday life: it's like a coat-check ticket. The ticket itself is not your coat; the number on it tells the attendant **which hook** your coat is on. Or an address book — the "Alice" line doesn't contain Alice's house, it contains **where** her house is. A pointer is exactly like this: it carries not the data, but the location of the data.

So what's it good for? Because instead of carrying a huge thing from hand to hand, just saying "it's over there" is often much cheaper — like giving someone your address instead of mailing them your house. As you'll see later, programs always manage large data this way, by passing its address (its pointer) around.

> 💡 Forward-note: Actually *following* a pointer — going to the address inside it and grabbing the value there — takes an instruction. We'll do that with real syntax in [08_mov_ve_bellek](./08_mov_ve_bellek.md). For now it's enough for the idea to settle: **a box can hold the location (address) of another box.** If you've firmly grasped the address/value distinction, you've already understood half of what a pointer is.

---

## A Close Look at Registers

In 01 we got to know registers as "the boxes in the worker's pocket, instantly accessible, few in number," and we heard a few of their names (EAX, EBX, ECX, EDX). Now let's zoom in on them too.

**How many are there?** In x86's 32-bit world there's a handful of "general-purpose" registers. The main four are `EAX`, `EBX`, `ECX`, `EDX`; to these are added `ESI` and `EDI`; and there are two more "special-duty" ones, `ESP` and `EBP` (we'll meet them in [14_stack](./14_stack.md)). In total a bit more than the fingers on one hand — that promise from 01 is this concrete.

**How big are they?** Here we pay off one of 03's debts. In 03 you saw a line like this:

```
 Example from 03: ebx = 0xffffd6a4
                        └────┬────┘
                       8 hex digits

 1 byte = 2 hex digits   →   8 hex digits = 4 byte = 32 bit
 This is EXACTLY how much a register holds: 32 bit = 4 byte.
```

So a register holds a 4-byte number. By the "powers of 2" logic from 03, this means a range from 0 up to `2³² − 1` (exactly 4,294,967,295, or roughly 4.3 billion). Let's set it next to a memory box:

```
 Memory box:     1 byte   →  0 .. 255
 Register:       4 byte   →  0 .. ~4.3 billion  (exactly 2³² - 1)
```

> 💡 Forward-note: If you noticed, up to here we've always counted **from 0 upward** — both in the box and in the register. But what about negative numbers, say −7? They fit in these same bits too, no need to invent a separate box; but the question "*how* is a negative number written with these switches?" we'll open up when we see signed numbers and flags ([10_bayraklar_ve_cmp](./10_bayraklar_ve_cmp.md)). For now it's enough to say "the range is on the positive side."

If you noticed, this connects to the previous section: a register carries exactly as much number as 4 memory boxes. When you drop what's inside a register into the warehouse, that value spreads across 4 consecutive boxes — which is the very thing we meant by "big number = several boxes."

> 💡 Why are registers so few but so fast? Because physically they're **inside the worker itself** — on the processor. The pocket is in the worker's apron; the warehouse is across the room. What's close is fast but space is expensive (that's why there are few); what's far is plentiful but slow. We're not digging into the deep physical reasons; the intuition "close = fast + few, far = slow + plentiful" is more than enough for now.

> 💡 Forward-note: The letters in the register names (A, B, C, D) and that leading "E" aren't random — there's a small but pleasant bit of history behind them. For the curious, I've told it in the [Appendix](#appendix--where-does-the-e-in-eax-come-from-history-and-reasons) at the very end; for now just think of the names as labels.

---

## The Worker's Real Dance: Between Warehouse and Pocket

Now we come to the heart of this lesson. We've seen the two parts (warehouse + pocket) separately; but what does the worker do all day long? The answer is a **shuttling back and forth** between these two.

The key rule is this: the worker does its real work — adding, subtracting, comparing — almost always **in its pocket**, that is, in the registers. It can't just grab a box sitting on a shelf in the warehouse and "play with it"; it first has to pull it into its pocket. That's why nearly every task has this three-step shape:

```
        WORKER (registers in its pocket)
        ┌───────────────────────────┐
        │   [EAX]   [EBX]   ...      │
        └───────────────────────────┘
            ▲  FETCH                 │  STORE
            │  (warehouse → pocket)  ▼  (pocket → warehouse)
   ┌─────────────────────────────────────────┐
   │   WAREHOUSE (memory): numbered boxes    │
   └─────────────────────────────────────────┘

        PROCESS = do it in the pocket (add / subtract / compare)
```

- **FETCH:** Bring the number(s) you need from the warehouse into the pocket. (memory → register)
- **PROCESS:** Do it in the pocket — add, subtract, compare. (on the registers)
- **STORE:** If you need to keep the result, put it back from the pocket into the warehouse. (register → memory)

A concrete example (not a real instruction yet, just a plain-language draft):

```
 Task: add the number in box 100 to the number in box 200,
        write the result to box 300.

   FETCH  :  box 100      →  EAX        (warehouse to pocket)
   FETCH  :  box 200      →  EBX        (warehouse to pocket)
   PROCESS:  add EBX to EAX             (in pocket; now EAX = sum)
   STORE  :  EAX          →  box 300    (pocket to warehouse)
```

As you can see, the whole job amounts to pulling from the warehouse into the pocket, handling it in the pocket, and if necessary dropping it back into the warehouse. This **fetch → process → store** pattern is the skeleton of nearly every program you'll write. When you see the real instructions in Unit 1, you'll recognize this shape again and again.

> ⚠️ Let's head off a confusion here from the start. **fetch → do → advance** (01) and **fetch → process → store** are NOT the same thing:
> - **fetch-do-advance:** the rhythm the worker reads *commands* — it turns once per instruction: fetch the next command, apply it, advance to the next command.
> - **fetch-process-store:** the pattern of moving *data* between warehouse and pocket — the big picture of most programs. It's what happens inside the "do" steps above.
>
> In short: while individual instructions cycle through fetch-do-advance, the pattern they produce all together is fetch-process-store.

> 🔑 In Unit 1 you'll meet an instruction called `mov` — that's the instruction that does the **FETCH** and **STORE** above ([08_mov_ve_bellek](./08_mov_ve_bellek.md)). **PROCESS** is the arithmetic instructions ([09_aritmetik](./09_aritmetik.md)). So this dance is nothing but the plain-language draft of the real instructions you're about to learn.

> 💡 An honest little note: x86 sometimes allows shortcuts too (there are cases where you can touch a memory box directly, without always pulling into the pocket). But the basic pattern you need to keep in your head is fetch-process-store; I'll mention the exceptions when the time comes.

---

## The Program Lives in These Boxes Too

Up to now we've always thought of the boxes as being for **data**: numbers, letters, the health in a game. But in 01 we said in passing "you put the program into memory." Let's complete that picture now: the program **itself** also lives in the same boxes.

How can that be? Because every instruction the worker knows is, at the very bottom, again a **number** — the machine encodes each command with a certain number. So your "list of commands" is really just numbers written into consecutive boxes. Let's tie it to 03: those instructions you'll write in assembly live in memory as hex numbers.

This also clarifies the exact meaning of the word "**fetch**" in fetch-do-advance: the worker **reads the next command from memory, from a box.** The warehouse that's there for data is also where the program lives.

> 🔑 Memory holds both **data** and the **program** — both are, in the end, numbers in boxes. The "fetch" of "fetch-do-advance" means pulling the next instruction from one of these boxes.

> 💡 Forward-note: The idea that "code is really data / numbers in memory" is a powerful insight that will open many doors down the road. For now we're just completing the picture: the warehouse isn't filled only with data, it's also the home of the program.

---

## The Worker's Finger Is a Register Too

Let's close Unit 0 with one last connection. In 01, as a small 💡, we said this: "the worker holds the information 'which line of the list am I on right now,' as if keeping its finger over the line it's reading." We can now say what that finger is.

That finger is a special pocket box — that is, a **register.** So what does it hold inside? The **memory address** of the next command: that is, the information of which box the worker will read its next command from.

```
   Special register ("finger")          MEMORY (the program is here too)
      ┌──────────┐                      Address
      │  0x....  │ ──────────────────►  ...    ┌─────────┐
      └──────────┘                     now   → │ command │  ← read from here (FETCH)
       holds an ADDRESS inside                 └─────────┘
       (which box number),                     ...
       not a VALUE
```

Notice how this is a nice closing for this section's address/value lesson: this register holds not a **value** but an **address** — it carries the "which box" information, not what's inside that box. The thing we distinguished two sections ago comes in handy right here.

Now let's re-read fetch-do-advance with this finger register:

```
   FETCH  :  read the command in the box the finger points to
   DO     :  apply the command literally
   ADVANCE:  slide the finger to the box where the next command sits
```

And the "**jump / leap**" instructions we previewed in 01? They're exactly this: putting **another address** into this finger register. You make the finger jump to whichever line of the list you want — decisions and loops arise exactly this way ([11_ziplamalar](./11_ziplamalar.md)).

> 💡 Forward-note: This special register's name in x86 is **EIP** (Instruction Pointer). You don't have to memorize it; when you step through the program one at a time with GDB, you'll see the finger walk from box to box *live* ([07_gdb_tek_adim](./07_gdb_tek_adim.md)). At that moment you'll say "ah, so this is what it was."

> 🔑 All of Unit 0 in one breath: **memory** = numbered boxes that hold data and the program; **registers** = a few fast boxes inside the worker (one of them the finger, holding "where are we right now"); **the worker** = a very fast but very dumb being that processes the command the finger points to with fetch-do-advance, and the data with the fetch-process-store dance. That's what a computer is.

---

## Summary — Keep in Mind

```
☐ Memory box = exactly 1 byte = 8 switches = 0..255. Addresses are consecutive (0,1,2,...), usually hex.
    - The box's NUMBER = address.   The box's INSIDE = value.   (Still completely separate!)
☐ Big number (over 255) = several consecutive boxes together. (Ordering: later, in gdb.)
☐ The same number can be a VALUE in one place, an ADDRESS in another; its role is set by the COMMAND you give the worker.
    - "A box can hold another box's address" → the seed of the later pointer (not opening it now).
☐ Register = fast pocket box inside the worker; FEW in number (EAX,EBX,ECX,EDX,ESI,EDI + ESP,EBP).
☐ One register = 32 bit = 4 byte = 0..~4.3 billion. (The answer to the 8-digit "ebx = 0xffffd6a4" from 03.)
☐ The worker's real dance: FETCH (warehouse→pocket) → PROCESS (in pocket) → STORE (pocket→warehouse). The skeleton of programs.
    - CAREFUL: fetch-do-advance = COMMAND reading rhythm; fetch-process-store = DATA moving pattern. Don't mix them up.
☐ The program lives in memory too: commands are numbers as well. "Fetch" = reading the next command from a box.
☐ The worker's "finger" = a special register; it holds the ADDRESS of the next command inside it (in x86 its name is EIP).
    - Jumping/leaping = putting another address into this finger.
☐ Unit 0 is done: you now have the full picture in your head. In Unit 1 we'll write and run real code for the FIRST TIME.
```

---

## Appendix — Where Does the "E" in EAX Come From? (History and Reasons)

> This section is for the curious. If you skip it, it won't get in the way of understanding the rest of the lesson at all — but if you asked above "why A, B, C, D, and why the leading E?", the answer (and its short story) is here.

### First the letters: A, B, C, D aren't random

In the first x86 processors (8086/8088, 1978), the registers had specific roles, and their names came from those roles:

```
 AX → Accumulator : where the calculation "accumulates" (sums, results)
 BX → Base        : was used as the "base" in memory addressing
 CX → Counter     : counter — the repeat count of loops
 DX → Data        : extra data / helper in multiply-divide
```

Today most of these count as "general-purpose" — that is, you can put them to almost any job you want. But the names stuck, and some instructions **still** prefer certain registers (for example some loop/counter instructions like ECX, some multiply instructions like EAX/EDX). We'll see these in the relevant lessons as they come up. So they're "general-purpose" but not exactly equal — keep this small honest note in your pocket.

### Then the leading "E": Extended

On the old machines these registers were **16-bit** — that is, AX, BX, CX, DX held 16 bits (2 bytes). With the 80386 processor (1985) the registers were extended to **32 bits**. This extended form was called "**E**xtended AX" → **EAX**. So the leading E, in short, means "extended, 32-bit version."

The nice part: the old 16-bit AX didn't disappear — today AX lives on as the name for accessing the **lower 16 bits** of EAX:

```
        EAX  (32 bit)
   ┌───────────────────────────────────┐
   │                  │       AX        │   AX = lower 16 bits of EAX
   │                  │   (16 bit)      │
   └───────────────────────────────────┘
```

(As for AX itself being split internally into two bytes called AH and AL — and why that means "not separate boxes, but different windows onto the same bits" — we look at that in the very next short interlude lesson, [04.5_registerin_ici](./04.5_registerin_ici.md). For now it's enough to say "AX is the small form of EAX.")

### And afterward: RAX (64-bit)

Let's complete the story: on 64-bit machines the same register grew once more, became 64 bits, and its name became **RAX** (the R here from "register," a bit arbitrary). So the same pocket box has three sizes it has grown into:

```
 AX (16-bit)  →  EAX (32-bit)  →  RAX (64-bit)
```

In this course we work at the **32-bit (EAX)** tier. But if you see AX, EAX, or RAX somewhere, you now know: they're all the same register at different sizes.

> 🔑 Summary: The letters (A/B/C/D) came from old special roles; the leading **E** = Extended (16→32-bit expansion). AX(16) → EAX(32) → RAX(64) are three sizes of the same box. Our world is EAX.

---

## 🔗 Related Topics

- [01_bilgisayar_nedir.md](./01_bilgisayar_nedir.md) — The source of the box/register/worker model we deepened in this lesson
- [04.5_registerin_ici.md](./04.5_registerin_ici.md) — Going one level deeper inside the registers: AL, AH, and "same bits, different window"
- [08_mov_ve_bellek.md](./08_mov_ve_bellek.md) — Where the "fetch → store" dance is done with real instructions
- [07_gdb_tek_adim.md](./07_gdb_tek_adim.md) — The lesson where you'll watch registers, addresses, and the "finger" walking, live

---

**Previous topic:** [03_sayilar_ikilik_onaltilik.md](./03_sayilar_ikilik_onaltilik.md)
**Next topic:** [04.5_registerin_ici.md](./04.5_registerin_ici.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
