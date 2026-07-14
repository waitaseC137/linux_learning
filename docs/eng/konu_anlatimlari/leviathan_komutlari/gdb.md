# GDB — GNU Debugger

A debugging tool for running binaries step by step and inspecting their internal state. No source code needed — it analyzes the compiled binary directly.

---

## Starting

```bash
gdb ./binary                     # load the binary
gdb --args ./binary argument     # start with an argument
gdb -q ./binary                  # "quiet" mode — no banner
```

When GDB opens, the `(gdb)` prompt appears. Commands are entered there.

---

## Basic Commands

### disassemble — Showing the Assembly Code

```bash
(gdb) disassemble main           # assembly of the main function
(gdb) disassemble function_name
```

```
(gdb) disassemble main
Dump of assembler code for function main:
   0x080491d0 <+0>:  push   %ebp
   0x080491d1 <+1>:  mov    %esp,%ebp
   ...
   0x080491ea <+20>: movl   $0x1bd3,-0xc(%ebp)   ← a constant is loaded!
   ...
   0x08049222 <+76>: call   0x8049090 <atoi@plt>  ← convert input to integer
   0x0804922a <+84>: cmp    %eax,-0xc(%ebp)        ← compare
   0x0804922d <+87>: jne    0x804923f              ← jump if not equal
```

**Critical instructions:**

| Instruction | Meaning |
|---|---|
| `movl $0x1bd3, -0xc(%ebp)` | Write a constant to memory — the PIN/password may be here |
| `cmp %eax, -0xc(%ebp)` | Compare two values |
| `jne address` | Jump if not equal |
| `call atoi` | Convert string to integer — user input is being processed |
| `call strcmp` | String comparison — also catchable with ltrace |

---

### break — Setting a Breakpoint

```bash
(gdb) break main               # stop at the start of main
(gdb) break *0x0804922a        # stop at a specific address
(gdb) break *main+84           # stop at offset main+84
(gdb) info breakpoints         # list all breakpoints
(gdb) delete 1                 # delete breakpoint number 1
```

---

### run — Running the Program

```bash
(gdb) run                      # start the program
(gdb) run argument             # run with an argument
(gdb) run 0000                 # with the argument "0000"
(gdb) continue                 # continue after a breakpoint
(gdb) next                     # execute the next line
(gdb) step                     # step into a function
```

---

### Inspecting Memory and Registers

```bash
(gdb) info registers           # all register values
(gdb) info registers eax       # only eax
(gdb) print $eax               # show eax
(gdb) print $ebp-0xc           # compute an address
```

**x — reading memory:**
```bash
(gdb) x 0xffffd4cc             # show the value at that address
(gdb) x/4x $esp                # 4 words from ESP, in hex
(gdb) x/s 0xffffd4cc           # read as a string
(gdb) x/d 0xffffd4cc           # read as decimal
```

**print — showing values:**
```bash
(gdb) print/d 0x1bd3           # hex to decimal → 7123
(gdb) print/x 7123             # decimal to hex → 0x1bd3
(gdb) print/t 0x41             # convert to binary
(gdb) print (int)'A'           # character → number
```

---

## Full Example: Finding the PIN (Leviathan Level 6)

```bash
$ gdb --args leviathan6 0000
(gdb) disassemble main
# ...
0x080491ea <+20>: movl $0x1bd3,-0xc(%ebp)   ← suspicious constant
# ...
0x0804922a <+84>: call atoi                  ← our input is processed
0x0804922a <+84>: cmp  %eax,-0xc(%ebp)       ← the comparison is here

# Set a breakpoint BEFORE the cmp
(gdb) break *0x0804922a
(gdb) run

Breakpoint 1, 0x0804922a in main ()

# Find the address where the constant is stored
(gdb) print $ebp-0xc
$1 = (void *) 0xffffd4cc

# Read the value at that address
(gdb) x 0xffffd4cc
0xffffd4cc:  0x00001bd3

# Convert hex to decimal → that's the PIN!
(gdb) print/d 0x00001bd3
$2 = 7123
```

---

## Quitting

```bash
(gdb) quit
(gdb) q
```

---

## Summary

| Command | What it does |
|---|---|
| `gdb --args prog arg` | Start GDB with an argument |
| `disassemble main` | Show the assembly code |
| `break *0xADDR` | Set a breakpoint at a specific address |
| `run` | Run the program |
| `info registers` | Show register values |
| `print $ebp-0xc` | Compute an address |
| `x 0xADDR` | Show the value at that address |
| `print/d 0xHEX` | Convert hex to decimal |
| `continue` | Continue from a breakpoint |
