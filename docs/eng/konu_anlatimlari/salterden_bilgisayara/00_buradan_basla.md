# 🧭 From Switches to a Computer — Start Here (Truly From Scratch)

> The phone in your pocket has billions of transistors inside it. That number looks
> terrifying — until you learn this secret: **they are all repetitions of the same simple part.**
> This series won't explain the computer to you; it will **make you build it.** We'll start
> from a single switch that turns on and off, and gate by gate, floor by floor, you will
> build every part with your own hands, all the way up to a working computer.

> **Who is this series for?** For everyone. You don't need to know electronics, you don't
> need to have written code, you don't even need to remember high-school physics. The only
> prerequisite is accepting this sentence: *"electricity flows through a wire, and a button
> opens or cuts it off."* We'll build the rest together.

---

## 📋 Table of Contents

- [What This Series Is NOT](#what-this-series-is-not)
- [First, Let's Break the Fear](#first-lets-break-the-fear)
- [One Tool: NandGame](#one-tool-nandgame)
- [What Will You Be Able to Do in the End?](#what-will-you-be-able-to-do-in-the-end)
- [The Big Picture: Why Do We Start From the Switch?](#the-big-picture-why-do-we-start-from-the-switch)
- [Roadmap — Lesson by Lesson](#roadmap--lesson-by-lesson)
- [How Should You Study?](#how-should-you-study)
- [Sister Series: x86 Assembly](#sister-series-x86-assembly)

---

## What This Series Is NOT

- **It's not an electronics course.** Voltage calculations, resistance, formulas — none of
  that. All we need is electricity's single habit: it either flows or it doesn't.
- **It's not a memorization course.** I won't make you memorize any gate's table. You'll get
  to know each part *the very moment you need it*, recognizing it as "without this, that job
  can't be done."
- **It's not a spectator sport.** **You** will build every part. A circuit you read past is
  forgotten; a circuit you build with your own hands is yours.
- **It's not fast.** Each lesson sits on top of the previous one. A stone you skip will trip
  your foot three lessons later.

---

## First, Let's Break the Fear

The answer to "how does a processor work?" is, in most places, either a two-sentence brush-off
("it's very complex, billions of transistors...") or a university textbook. Both send the same
message: *this place is not for you.*

Here's a secret: **at the very bottom of the computer there is nothing hard.** At the very
bottom there are switches that turn on and off — no different from the lamp switch in your
home. The difficulty isn't in the individual parts, it's in the *number* of parts. And once
you learn how to build one, the number stops being terrifying: laying the same brick over and
over is no harder than understanding a single brick.

> 💡 Getting stuck, the "my brain is fried" feeling, looking at the same spot twice — all of
> it is normal, and everyone passes through that gate. In this series, slowing down isn't a
> weakness, it's the method.

---

## One Tool: NandGame

Throughout the whole series we'll use one single tool: **[nandgame.com](https://nandgame.com)**

- **Free.** No sign-up, no installation, no ads. It opens in the browser, you play.
- **Like a game but real:** each level gives you a task ("build the circuit that satisfies
  this table"), you drag parts from the boxes on the left and connect them with wires, then
  you click **Check solution**. The game tries all the combinations for you; if they all
  pass, the level is done.
- **Its order is the same as this series' order:** the game's levels follow the construction
  layers of a real computer. At the end of each lesson, the "now you build it" section sends
  you to exactly that level of the game.

> 🔑 Let the division of labor be clear from the start: **the lesson gives you the concept,
> you solve the level.** At the end of each lesson there's also the logic of the solution —
> but inside folded (click-to-open) boxes, with a "try it yourself first" warning. Opening
> that box early is up to you; but know that all the joy of this series is in the "I figured
> it out myself" moments.

---

## What Will You Be Able to Do in the End?

When you finish the part of the series written so far (Unit 0 + 1):

- You'll know what "1 and 0" **physically** is — not a metaphor, but wire and current.
- You'll have **derived yourself** all the logic gates from a single kind of part (NAND).
- You'll be able to explain how the computer **counts** and how it **adds**, because you
  built the adding circuit yourself.
- The phrase "billions of transistors" won't scare you — because you'll have seen how the
  floors stack on top of one another.

The series will grow as the game advances: next up are multi-digit addition, subtraction,
the compute core (ALU), memory, and finally **a real processor that executes instructions.**
All from the same bricks.

---

## The Big Picture: Why Do We Start From the Switch?

A computer is made of floors. Each floor is built from the one below it — and the moment each
floor is built, it **lets you forget** the one beneath it:

```
   PROCESSOR          "the machine that executes instructions"
      ▲  is built from these
   MEMORY + ALU       "the parts that remember and compute"
      ▲  is built from these
   ADDERS             "circuits that add numbers"
      ▲  is built from these
   GATES              "AND, OR, NOT... the little parts that make decisions"
      ▲  is built from these
   SWITCH / RELAY     "the single motion that turns current on and off"
```

Explanations that start from the top always get stuck in the same place: a floor with no
foundation turns into rote memorization. We'll do the opposite — starting from **the very
bottom** and casting each floor ourselves. That way I'll never have to say "just accept this
as it is" at any point.

> 💡 The claim in this series' name is real: the transistor inside a modern chip is the
> grandchild of the relay you're about to meet, shrunk billions of times over. The difference
> is size and speed; **the idea is the same.** Whoever understands the switch has understood
> the transistor.

---

## Roadmap — Lesson by Lesson

Read the files in this order. Each lesson leans on the previous one.

### 🧱 Unit 0 — The Bricks: From Switches to Gates

| # | File | What it teaches | NandGame level |
|:---:|---|---|---|
| 1 | [01_akim_salter_role](./01_akim_salter_role.md) | What 1 and 0 really are; the relay; the first gate | Nand |
| 2 | [02_nanddan_kapilar](./02_nanddan_kapilar.md) | All gates from a single brick: NOT, AND, OR | Invert, And, Or |
| 3 | [03_xor_iki_fedai](./03_xor_iki_fedai.md) | The difference detector XOR — the tale of the two that do the dirty work | Xor |
| 3.5 | [03.5_soyutlama_merdiveni](./03.5_soyutlama_merdiveni.md) | *(interlude)* Boxing up the floors — the computer's construction secret | — |

### ➕ Unit 1 — Counting and Adding

| # | File | What it teaches | NandGame level |
|:---:|---|---|---|
| 4 | [04_teller_sayi_olunca](./04_teller_sayi_olunca.md) | Loading number-meaning onto wires; binary counting | — *(concept lesson)* |
| 5 | [05_half_adder](./05_half_adder.md) | The first adder: 1 + 1 = 10 | Half Adder |
| 6 | [06_full_adder](./06_full_adder.md) | The carry chain: the brick for adding numbers of unlimited size | Full Adder |

### 🔜 On the way (to be written as the game advances)

Multi-bit Adder → subtraction and negative numbers → data routing (Switching) → the compute
core (ALU) → memory (latch, register, RAM) → **the processor.**

> 💡 Files whose number ends in `.5` are short **interludes**: on the side of the main road,
> lighter. But don't skip 03.5 — the most important idea of the series is there.

---

## How Should You Study?

1. **Don't break the order.** Both the game levels and the lessons stack on top of each other.
2. **Solve every level yourself.** Before opening the solution box, genuinely try at least
   once. Getting stuck is part of the job; the difference between *seeing* the solution and
   *finding* it is everything this series will give you.
3. **Decide "done" yourself — but honestly.** A topic is finished not when you pass the level
   in the game, but when you **can explain it to someone else.** Explain it out loud to
   yourself; the sentence where you get stuck is the place you go back to.
4. **Keep a screenshot archive.** Toss the screenshot of every level you solve into a folder.
   You'll both see your progress and have concrete proof to say "I built this."
5. **Slow = fast.** A gate you rush past will stop you three levels later.

---

## Sister Series: x86 Assembly

This series has a sibling: the **x86 Assembly** course. The two look at the same machine from
two ends:

- **This series** builds the worker (the processor) **from parts** — "what is this machine
  made of?"
- **The x86 series** teaches you to **give orders** to that worker — "how do you make this
  machine do work?"

They can be read independently of each other; but if you carry both at once, one day the two
paths meet: there, you'll see that the `add` order you wrote goes to the adder you built here
with your own hands. That moment is the reason both of these series exist.

---

## 🔗 Next Step

- [01_akim_salter_role.md](./01_akim_salter_role.md) — continue here. We'll learn
  electricity's single habit and build our first gate.

---

*This lesson is part of the "From Switches to a Computer" series. The series proceeds alongside [nandgame.com](https://nandgame.com).*
