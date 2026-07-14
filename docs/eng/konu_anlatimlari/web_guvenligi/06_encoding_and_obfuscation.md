# 🌐 Web Security — Encoding & Obfuscation

> Encoding is converting data into a different format — not encryption.
> Encoded data can always be reversed; no key is required.

---

## 📋 Table of Contents

- [Encoding vs Encryption vs Hashing](#encoding-vs-encryption-vs-hashing)
- [Base64](#base64)
- [Hex (Hexadecimal)](#hex-hexadecimal)
- [URL Encoding](#url-encoding)
- [HTML Encoding](#html-encoding)
- [Chained Encoding](#chained-encoding)
- [Using CyberChef](#using-cyberchef)
- [Usage in Natas](#usage-in-natas)

---

## Encoding vs Encryption vs Hashing

These three concepts are frequently confused:

| Property | Encoding | Encryption | Hashing |
|---------|----------|-----------|---------|
| Purpose | Format conversion | Confidentiality | Integrity verification |
| Reversible? | ✓ Yes (no key needed) | ✓ Yes (key needed) | ✗ No (one-way) |
| Example | Base64, Hex, URL | AES, RSA, XOR | MD5, SHA1, SHA256 |
| Provides security? | ✗ No | ✓ Yes (if used correctly) | ✓ Yes (if used correctly) |

> ⚠️ **Critical:** Base64 is **not encryption**. Anything encoded is easily decoded. The statement "I encrypted it with Base64" is wrong.

---

## Base64

Converts binary data into a format consisting only of ASCII characters. It uses a 64-character alphabet: `A-Z`, `a-z`, `0-9`, `+`, `/`, and `=` (padding).

### Why Is It Used?

- To carry binary data over text-based protocols (HTTP, email)
- To send binary data in a cookie or URL
- **Not for security** — only for format compatibility

### Recognizing It

```
eyJ1c2VybmFtZSI6ImFkbWluIn0=
^                            ^
Base64 characters            = or == padding (depending on length)
```

Base64 values usually end with `=` (0, 1, or 2 of them). Their length is always a multiple of 4.

### Encode / Decode

**Terminal:**

```bash
# Encode
echo -n "natas" | base64
# bmF0YXM=

# Decode
echo "bmF0YXM=" | base64 -d
# natas

# Decode from a file
base64 -d encoded.txt
```

**Python:**

```python
import base64

# Encode
encoded = base64.b64encode(b"natas").decode()
print(encoded)  # bmF0YXM=

# Decode
decoded = base64.b64decode("bmF0YXM=").decode()
print(decoded)  # natas
```

**JavaScript (Browser Console):**

```javascript
// Encode
btoa("natas")           // "bmF0YXM="

// Decode
atob("bmF0YXM=")        // "natas"

// Quickly decode the cookie value
atob(document.cookie.split("data=")[1])
```

---

## Hex (Hexadecimal)

Represents each byte with 2 hex characters. It uses the characters `0-9` and `a-f`.

### Recognizing It

```
6e617461 73          ← only 0-9 and a-f characters
        ^
        every 2 characters = 1 byte
```

### Encode / Decode

**Terminal:**

```bash
# String → Hex
echo -n "natas" | xxd -p
# 6e61746173

# Hex → String
echo "6e61746173" | xxd -r -p
# natas

# Hex dump (show byte by byte)
echo -n "natas" | xxd
# 00000000: 6e61 7461 73                             natas
```

**Python:**

```python
# String → Hex
"natas".encode().hex()           # "6e61746173"

# Hex → String
bytes.fromhex("6e61746173").decode()   # "natas"
```

---

## URL Encoding

Encodes characters that have special meaning in a URL in the `%XX` format. XX is the hex value of the character.

### Why Is It Important?

In a URL, characters like `?`, `&`, `=`, `/`, and space have special meaning. If you want to send these characters as a parameter value, you need to encode them.

```
Space   →  %20  or  +
/       →  %2F
&       →  %26
=       →  %3D
?       →  %3F
#       →  %23
<       →  %3C
>       →  %3E
'       →  %27
"       →  %22
```

### Security Significance

URL encoding can be used to bypass filters:

```bash
# If the / character is being filtered
/etc/passwd      →   %2Fetc%2Fpasswd

# Double encoding (to evade some filters)
%2F  →  %252F    (% is encoded as %25)
```

**Terminal:**

```bash
# URL encode with Python
python3 -c "import urllib.parse; print(urllib.parse.quote('/etc/passwd'))"
# %2Fetc%2Fpasswd

# curl encodes automatically
curl "http://example.com/page?param=special character"
```

---

## HTML Encoding

Encodes characters that have special meaning in HTML in entity format.

```
<   →   &lt;
>   →   &gt;
&   →   &amp;
"   →   &quot;
'   →   &#x27;
```

### Security Significance

HTML encoding is used against XSS (Cross-Site Scripting) attacks. If user input contains `<script>`, after being encoded the browser displays it as text rather than code.

```
Input:    <script>alert(1)</script>
Encoded:  &lt;script&gt;alert(1)&lt;/script&gt;
Browser:  Does not run the code, shows it as plain text
```

---

## Chained Encoding

A situation often encountered in Natas: multiple encodings combined. To take the inverse, apply them in **reverse order**.

```
Original → [base64] → [strrev] → [hex] → Result

In reverse:
Result → [hex decode] → [strrev] → [base64 decode] → Original
```

### Solving It Step by Step

```
What we have: "3d3d516343746d4d6d6c315669563362"

1. hex decode  → "==QcCtmMml1ViV3b"  (hex characters → binary)
2. strrev      → "b3ViV1lmMmtCcQ=="  (reverse the string)
3. base64 dec  → oubWYf2kBq          (result)
```

**With Python:**

```python
import base64

encoded = "3d3d516343746d4d6d6c315669563362"

step1 = bytes.fromhex(encoded)          # hex → bytes
step2 = step1[::-1]                     # strrev (reverse)
step3 = base64.b64decode(step2)         # base64 decode
print(step3.decode())                   # oubWYf2kBq
```

### With CyberChef

1. `From Hex` — hex to binary
2. `Reverse` — reverse the string
3. `From Base64` — base64 decode

---

## Using CyberChef

[CyberChef](https://gchq.github.io/CyberChef/) is the most useful web tool for encoding/decoding.

### Basic Usage

1. Drag operations from the left panel
2. Paste the encoded data into the Input box
3. See the result in the Output

### Operations Frequently Used for Natas

```
From Base64         → Base64 decode
To Base64           → Base64 encode
From Hex            → Hex decode
To Hex              → Hex encode
URL Decode          → URL encoding decode
Reverse             → Reverse the string
XOR                 → XOR operation (for Natas 11)
Magic               → Automatically detect format and decode
```

### The Magic Operation

If you don't know what kind of encoding was applied, use the **Magic** operation. CyberChef analyzes the data, tries possible encodings, and shows the most plausible result.

---

## Usage in Natas

### Natas 8 — Reverse Encoding

**Scenario:** The PHP code encodes like this:

```php
function encodeSecret($secret) {
    return bin2hex(strrev(base64_encode($secret)));
}
// Target value: "3d3d516343746d4d6d6c315669563362"
```

**Take the inverse:**

```python
import base64

target = "3d3d516343746d4d6d6c315669563362"
step1 = bytes.fromhex(target)    # inverse of bin2hex
step2 = step1[::-1]              # inverse of strrev
step3 = base64.b64decode(step2)  # inverse of base64_encode
print(step3.decode())            # oubWYf2kBq
```

**With CyberChef:** `From Hex` → `Reverse` → `From Base64`

---

### Encoding Detection Guide

```
When you see a value, ask:

Only 0-9 and a-f?
  ↓
  Could be Hex → try From Hex

Ends with = or contains A-Z/a-z/0-9/+//?
  ↓
  Could be Base64 → try From Base64

Is there a %XX format?
  ↓
  URL Encoding → try URL Decode

Entities like &lt; &gt; &amp;?
  ↓
  HTML Encoding → try HTML Entity Decode

None of these but looks meaningless?
  ↓
  CyberChef → try Magic
```

---

## 🔗 Resources

- [CyberChef](https://gchq.github.io/CyberChef/) — the Swiss Army knife of encoding/decoding
- [Base64 — Wikipedia](https://en.wikipedia.org/wiki/Base64)
- [MDN — URL Encoding](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding)
- [dCode.fr](https://www.dcode.fr/) — alternative encoding tool

---

**Previous topic:** [05_php_source_code.md](./05_php_source_code.md)
**Next topic:** [07_command_injection.md](./07_command_injection.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
