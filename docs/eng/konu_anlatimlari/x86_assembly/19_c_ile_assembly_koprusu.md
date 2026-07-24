# 🌉 x86 Assembly — The C-to-Assembly Bridge

> Throughout this course we wrote assembly **by hand** — every `mov`, every `push`, you thought out and placed yourself. But in the real world nobody writes whole programs this way; they write in **higher-level languages** like C, C++, Rust, and then a **compiler** translates them into assembly.
> So what does that compiler produce? Here is the surprise of this lesson (and the reward of the whole course): what the compiler produces is **the very patterns you wrote by hand in this course.** We'll look at the assembly of a C program and there — `push ebp`, `[ebp+8]`, `add`, `ret` — you'll see nothing but old friends. In that moment, you'll become someone who "can read compiled code."

> **This lesson has code, and we run all of it.** The C source below and the assembly it produces are real: I compiled it with `gcc` on my own machine and took its output.

---

## 📋 Table of Contents

- [Not by Hand, by Compiler: Where Does C Come From?](#not-by-hand-by-compiler-where-does-c-come-from)
- [Compile a Tiny C Function](#compile-a-tiny-c-function)
- [Familiar Patterns: The Ones You Wrote by Hand](#familiar-patterns-the-ones-you-wrote-by-hand)
- [Optimization: Why Did `× 8` Become `shl`?](#optimization-why-did--8-become-shl)

---

## Not by Hand, by Compiler: Where Does C Come From?

Back in 00 we said this: you write assembly → `nasm` (an *assembler*) translates it into machine code. The assembler's job was easy, because assembly was already one-to-one close to machine code — it just turned labels into numbers.

Higher-level languages (like C) sit one layer further up. You write `a + b`; but the processor knows no such thing as "a + b" — it knows `mov`, `add`, registers. The program that does the translation in between is called a **compiler**. The `gcc` we'll use takes C source and **produces assembly** — that is, it does automatically exactly the work you did in your head throughout this course.

And here's the nice part: we can tell `gcc`, "translate, but stop at assembly, don't go all the way to machine code." That way we get to see with our own eyes **which assembly** the compiler produces. Command: `gcc -S` (`-S` = "stop at assembly").

> 🔑 Higher-level languages (C...) are languages the processor doesn't directly understand; the program that translates them into assembly is called a **compiler** (`gcc`). `nasm` translates your asm into machine code; `gcc` translates C into **asm** — that is, the very work you did by hand in this course. With `gcc -S` we can see the asm it produces.

---

## Compile a Tiny C Function

Let's pick a familiar example — the C version of the addition function we wrote by hand in 16. `topla.c`:

```c
int topla(int a, int b) {
    return a + b;
}
```

In plain terms: "take two numbers (`a`, `b`), return their sum." The same `topla` function from 16, but as three readable lines of C. Now let's tell `gcc` to translate this into 32-bit assembly:

```
gcc -m32 -S -masm=intel -O0 -fno-pie -fno-pic topla.c -o topla.s
```

Let's get to know the flags: `-m32` (the 32-bit we've been learning), `-S` (stop at assembly), `-masm=intel` (the Intel syntax used in this course — so it resembles `nasm`), `-O0` (do no optimization, translate plainly). The last two, `-fno-pie -fno-pic`, are a closed box for now: they force the compiler to produce old-style, simple output. Without them, modern gcc would insert extra address-computation code and the output would get murky — and then we couldn't see the clean skeleton. The detail isn't the subject of this course, don't worry. The core of the `topla.s` file it produces:

```nasm
topla:
    push  ebp
    mov   ebp, esp
    mov   edx, DWORD PTR [ebp+8]
    mov   eax, DWORD PTR [ebp+12]
    add   eax, edx
    pop   ebp
    ret
```

Take a minute to look at this output. Is there a single unfamiliar line?

> 💡 **You might be wondering:** *"What's `DWORD PTR [ebp+8]`? We used to write `[ebp+8]`."* Same thing. In `gcc`'s syntax, `DWORD PTR [ebp+8]` = "the **4-byte (dword)** value at address `[ebp+8]`" — in `nasm`, since the size can usually be understood from context, we just wrote `[ebp+8]` for short. Two assemblers have small differences in syntax (just like two dialects); but **the machine instruction they describe is exactly the same.**

---

## Familiar Patterns: The Ones You Wrote by Hand

Now let's **label** that output line by line — and see which lesson each line is familiar from:

```nasm
topla:
    push  ebp                    ; ┐ PROLOGUE          → lesson 16
    mov   ebp, esp               ; ┘ (set up the anchor)
    mov   edx, DWORD PTR [ebp+8]  ; 1st argument (a)    → lesson 16 ([ebp+8])
    mov   eax, DWORD PTR [ebp+12] ; 2nd argument (b)    → lesson 16 ([ebp+12])
    add   eax, edx               ; a + b               → lesson 09 (add)
    pop   ebp                    ; ┐ EPILOGUE          → lesson 16
    ret                          ; ┘ (return to caller) → lesson 15 (ret)
```

**This table holds the whole reward of the course.** The compiler turned an innocent C line like `a + b` into exactly the skeleton you **built by hand** in 16: set up the `ebp` anchor with the prologue, read the arguments from `[ebp+8]` and `[ebp+12]` (the convention from 16!), sum them with `add` (09) — **the result stays in `eax`, which in cdecl is where the return value lives (16); the "return" part of C's `return a + b;` is exactly this, not a separate instruction** — clean up with the epilogue and return with `ret` (15). Had you looked at this before the course it would have been a mystery; now you **can read it.**

(A small difference: the compiler used `edx` as a scratch register while computing the sum, whereas when we wrote it by hand we used `eax` directly. This is normal — which register it picks as scratch is the compiler's choice; as long as both obey the same convention, the result doesn't change.)

> 🔑 When you translate a C program with `gcc -S`, what you meet are the **patterns** you learned in this course: prologue/epilogue (16), `[ebp+8]` arguments (16), `add`/`sub` (09), `call`/`ret` (15). C is not "magic" — it compiles into these patterns. Learning assembly = **being able to read every compiled program.** This is where the door to reverse engineering opens.

---

## Optimization: Why Did `× 8` Become `shl`?

Above we said `-O0`: "do no optimization, translate plainly." But if you tell the compiler to "**speed it up**" (`-O1`), it behaves far more cleverly — and here you'll see a promise I made you back in 13. In 13 I said "`shl` = ×2ⁿ, compilers turn multiplication by a power of 2 into `shl`, you'll see it in 19." Let's prove it. `carp8.c`:

```c
int carp8(int x) {
    return x * 8;
}
```

Translate it with `gcc -m32 -S -masm=intel -O1 -fno-pie -fno-pic carp8.c -o carp8.s` (the same flags, the only difference `-O1` instead of `-O0`). What it produces:

```nasm
carp8:
    mov   eax, DWORD PTR [esp+4]   ; take x
    sal   eax, 3                   ; x << 3  = x × 8   ← NOT MULTIPLICATION, A SHIFT!
    ret
```

**Here is 13's promise.** In 13 I told you `shl`; here gcc wrote `sal` — don't be surprised, this is the instruction you expected: **for shifting left, `sal` and `shl` are exactly the same instruction** (same machine code, same opcode), just two different names. In C you wrote `x * 8`, but the compiler placed no multiplication instruction (`mul`) — instead it placed `sal eax, 3` (shift left by 3 = ×2³ = ×8), because shifting is much faster (13). In C you saw "multiplication"; on the machine there's a **bit shift**. The two give the same result, but the compiler chose the fast one.

A small extra observation: with `-O1` on, there's **not even** a `push ebp`/`mov ebp, esp` prologue — the compiler saw that this tiny function doesn't need the `ebp` anchor, skipped it, and read the argument directly from `[esp+4]`.

Why `[esp+4]` and not `[ebp+8]` like just before? In three steps:

- The moment the function is entered, the **return address** sits at the top of the stack (`[esp]`); the 1st argument is right above it: **`[esp+4]`**.
- **If** there were a prologue, `push ebp` would push `esp` down 4 bytes, and `mov ebp, esp` would fix the anchor there — so relative to `ebp` the argument would sit 4 bytes farther away: **`[ebp+8]`**.
- In this function there's **no** prologue, that push never happened; we measure directly from `esp`: **`[esp+4]`**.

("Wasn't `esp` constantly moving, so trusting it was dangerous (16)?" — yes; but this tiny function never touches the stack (no `push`/`pop`/`call`), so `esp` **doesn't budge** from start to finish, and here trusting it is safe.)

(In 16 we said "the prologue is a *convenience*, not an obligation"; here's the proof.) Optimized code looks more "cunning" than what you wrote by hand — but underneath it are always the instructions you know.

> 🔑 With `-O1`/`-O2` (optimization) on, the compiler gets smart: `× 8` → `shl/sal` (13), it drops the unnecessary prologue, it uses registers cunningly. That's why optimized code can look unfamiliar at first glance — but its bricks are always the bricks of this course. In reverse engineering, most of the work is taking apart these "cunning but familiar" patterns.

---

## Summary — Keep in Mind

```
☐ Higher-level language (C) → COMPILER (gcc) → assembly.  (nasm: your asm to machine code; gcc: C to asm.)
    gcc -m32 -S -masm=intel  → SEE the asm the compiler produces (-S = stop at asm).
☐ int topla(int a,int b){return a+b;}  →  THE COMPILER PRODUCED THIS:
    push ebp / mov ebp,esp        (PROLOGUE, 16)
    mov ..., [ebp+8] / [ebp+12]   (arguments, 16)
    add                            (09)
    pop ebp / ret                  (EPILOGUE 16 + ret 15)
    → i.e. the same as what you wrote BY HAND. C is not magic; it compiles into these patterns.
☐ Optimization (-O1): x*8 → sal eax,3 (13's ×2ⁿ, a shift not a multiply); the unnecessary prologue is dropped.
    Optimized code looks "cunning" but its bricks are always this course's.
☐ THE BIG WIN: knowing assembly = BEING ABLE TO READ EVERY COMPILED PROGRAM. This is the door to reverse engineering.
☐ DWORD PTR [ebp+8] (gcc) = [ebp+8] (nasm): same instruction, different dialect.
```

---

## 🔗 Related Topics

- [16_calling_convention.md](./16_calling_convention.md) — The prologue/epilogue and `[ebp+8]` arguments the compiler produces; this lesson is the proof that it's "really like that"
- [13_bit_islemleri.md](./13_bit_islemleri.md) — The promise "`shl` = ×2ⁿ, compilers turn multiplication into a shift"; here it is, `x*8 → sal eax,3`
- [09_aritmetik.md](./09_aritmetik.md) — `add`; C's `a + b` comes down to the same instruction
- [00_buradan_basla.md](./00_buradan_basla.md) — The promise "when you compile a C program and look at its asm you'll see familiar patterns"; here it held true

---

**Previous topic:** [18_ilk_etkilesimli_program.md](./18_ilk_etkilesimli_program.md)
**Next topic:** [20_buradan_nereye.md](./20_buradan_nereye.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
