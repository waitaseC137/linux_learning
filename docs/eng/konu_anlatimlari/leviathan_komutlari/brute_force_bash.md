# Brute Force — With Bash

Finding the password or PIN a binary expects by trying all possibilities. Used when analysis tools (ltrace, gdb) don't help, or when the number of possibilities is reasonable.

---

## The for Loop

```bash
for variable in [list]; do
    command
done
```

**Number range:**
```bash
for i in {0..9}; do echo $i; done        # 0 to 9
for i in {0000..9999}; do echo $i; done  # 4-digit PIN (0000–9999)
for i in {1..100}; do echo $i; done
```

**Zero-padded numbers with brace expansion:**
```bash
{0000..9999}   # 0000, 0001, 0002, ..., 9999
{00..99}       # 00, 01, ..., 99
```

Zero-padding matters — the binary may treat `0042` and `42` differently.

---

## Conditionals

```bash
if [ "$variable" = "value" ]; then
    command
fi

# Or on one line:
[ "$variable" = "value" ] && command
```

**Checking output during brute force:**
```bash
result=$(./binary $i 2>/dev/null)    # run the command, capture output
if [ "$result" != "Wrong" ]; then    # if it's not the wrong-answer message
    echo "Found: $i"
    break                             # end the loop
fi
```

---

## Full Example: 4-Digit PIN (Leviathan Level 6)

```bash
for i in {0000..9999}; do
    result=$(./leviathan6 $i 2>/dev/null)
    if [ "$result" != "Wrong" ]; then
        echo "PIN: $i → $result"
        break
    fi
done
```

- `{0000..9999}` → 10,000 possibilities
- `2>/dev/null` → hide error output
- `$()` → assign command output to a variable
- `break` → stop the loop when a match is found

---

## 2>/dev/null — Hiding Error Output

```bash
command 2>/dev/null
```

- `2>` → redirect standard error
- `/dev/null` → Linux's "trash can", swallows everything

Used in brute force so the error message of every wrong attempt doesn't flood the screen.

```bash
./leviathan6 0000 2>/dev/null    # hides error messages like "Wrong"
```

---

## $() — Capturing Command Output

```bash
result=$(./binary $i)
```

Assigns the command's output to a variable. Use it later as `$result`.

```bash
result=$(./leviathan6 1234 2>/dev/null)
echo "Output: $result"
```

---

## break — Exiting the Loop

```bash
for i in {0..100}; do
    if [ "$i" = "42" ]; then
        echo "Found: $i"
        break    # end the loop here, don't go to the next values
    fi
done
```

Used in brute force to avoid continuing pointlessly after finding the right value.

---

## Performance Note

A 10,000 PIN brute force may take a few minutes. To make it faster:

```bash
# Run in parallel in the background (use carefully)
for i in {0000..9999}; do
    (./binary $i 2>/dev/null | grep -v "Wrong" | grep . && echo $i) &
done
wait
```

For Leviathan, sequential execution is usually enough — don't run in parallel, to avoid overloading the server.

---

## Summary

| Construct | What it does |
|---|---|
| `for i in {0000..9999}` | Generates zero-padded numbers from 0000 to 9999 |
| `result=$(command)` | Assigns command output to a variable |
| `[ "$a" != "b" ]` | String comparison |
| `2>/dev/null` | Hides error messages |
| `break` | Exits the loop |
