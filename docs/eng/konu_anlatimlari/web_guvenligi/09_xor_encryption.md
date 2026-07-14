# 🌐 Web Security — XOR Encryption & Known-Plaintext Attack

> XOR has a nice property: if A XOR B = C, then C XOR A = B.
> So you use the same operation both to encrypt and to decrypt.
> And if you know the plaintext, you can also find the key.

---

## 📋 Table of Contents

- [What Is XOR?](#what-is-xor)
- [Encryption with XOR](#encryption-with-xor)
- [The Critical Property of XOR](#the-critical-property-of-xor)
- [Known-Plaintext Attack](#known-plaintext-attack)
- [Key Repetition Vulnerability](#key-repetition-vulnerability)
- [Usage in Natas](#usage-in-natas)

---

## What Is XOR?

**XOR (Exclusive OR)** is a logical operator that works on two bits.

| A | B | A XOR B |
|---|---|---------|
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

The rule: **0 if the two are the same, 1 if they differ.**

### XOR on Characters

When XOR is applied to characters, the operation is done bit by bit on the characters' ASCII values (their numeric equivalents).

```
'A' = 65  = 01000001
'n' = 110 = 01101110
      XOR = 00101111 = 47 = '/'

So: 'A' XOR 'n' = '/'
```

In PHP the XOR operator is the `^` character:

```php
$a = "A";
$b = "n";
echo $a ^ $b;   // '/'

// Numeric:
echo 65 ^ 110;  // 47
```

---

## Encryption with XOR

To "encrypt" a text with XOR, you XOR each character with a key character.

```php
function xor_encrypt($text, $key) {
    $result = "";
    for ($i = 0; $i < strlen($text); $i++) {
        $result .= $text[$i] ^ $key[$i % strlen($key)];
    }
    return $result;
}
```

`$i % strlen($key)` → The key may be shorter than the text, so it is repeated cyclically.

### Example

```
Plaintext:  "HELLO"
Key:        "KEY"  (repeated: "KEYKE")

H XOR K = ?
E XOR E = ?
L XOR Y = ?
L XOR K = ?
O XOR E = ?
```

```python
plaintext = "HELLO"
key       = "KEY"
result    = ""

for i, c in enumerate(plaintext):
    result += chr(ord(c) ^ ord(key[i % len(key)]))

print(result)  # the encrypted text
```

---

## The Critical Property of XOR

The most important mathematical property of XOR:

```
A XOR B = C
C XOR A = B    ← decrypting
C XOR B = A    ← finding the key
```

**That is:**

```
Plaintext  XOR Key = Ciphertext   (encryption)
Ciphertext XOR Key = Plaintext    (decryption)
Ciphertext XOR Plaintext = Key    (finding the key!)
```

This property is the basis of the **Known-Plaintext Attack**.

### The Same Thing for More Than Two Values

```
A XOR A = 0          ← If you XOR something with itself you get 0
A XOR 0 = A          ← If you XOR something with 0 you get itself
(A XOR B) XOR B = A  ← XOR with the same thing twice → original
```

---

## Known-Plaintext Attack

If you **know both the plaintext and the ciphertext**, you can find the key by XOR-ing the two.

```
Ciphertext XOR Plaintext = Key
```

### When Is It Possible?

In web applications, this situation arises as follows:

1. The server encrypts some data with XOR and sends it as a cookie
2. We see the encrypted cookie (ciphertext)
3. We can guess the contents of the cookie (plaintext)

```
Cookie contents (plaintext guess):
  {"showpassword":"no","bgcolor":"#ffffff"}

Cookie value (ciphertext — Base64 decoded):
  [binary data]

XOR them → the key
```

---

## Key Repetition Vulnerability

When a short key is repeated to encrypt a long text, cryptanalysis becomes possible.

```
Plaintext:   AAABBBCCC
Key:         KEYKEYKEYKEY  ← KEY is repeated

The same key block encrypts different plaintext blocks
→ By analyzing the patterns, the key length and value can be found
```

In Natas 11 the key is between 1 and 4 characters — and we already know the plaintext.

---

## Usage in Natas

### Natas 11 — Cracking the XOR Cookie

**Source code (summary):**

```php
<?php
$defaultdata = array("showpassword"=>"no", "bgcolor"=>"#ffffff");

function xor_encrypt($in) {
    $key = '<my_secret_key>';   // ← we need to find this
    $text = $in;
    $outText = '';
    $i = 0;
    do {
        $outText .= $text[$i] ^ $key[$i % strlen($key)];
        $i++;
    } while ($i < strlen($text));
    return $outText;
}

function loadData($def) {
    $mydata = $def;
    if(array_key_exists("data", $_COOKIE)) {
        $str = base64_decode(urldecode($_COOKIE['data']));
        $arr = json_decode(xor_encrypt($str), true);
        if(is_array($arr) && array_key_exists("showpassword", $arr)
           && array_key_exists("bgcolor", $arr)) {
            $mydata['showpassword'] = $arr['showpassword'];
            $mydata['bgcolor']      = $arr['bgcolor'];
        }
    }
    return $mydata;
}

function saveData($d) {
    setcookie("data", base64_encode(xor_encrypt(json_encode($d))));
}
?>
```

**Flow:**

```
Saving:   PHP array → json_encode → xor_encrypt → base64_encode → cookie
Reading:  cookie → base64_decode → xor_encrypt → json_decode → PHP array
```

To make the `showpassword` value `"yes"`, we need to find the key and produce a new cookie.

---

### Step 1: Find the Plaintext and Ciphertext

**Ciphertext:** Visit the page, copy the `data` cookie from the browser, Base64 decode it.

```python
import base64

# Cookie value obtained from the page
cookie = "HmYkBwozJw4WNyAAFyB1VUcqOE1JZjUIBis7ABdmbU1GIjEJAyIxTRg="
ciphertext = base64.b64decode(cookie)
```

**Plaintext:** We know it from the source code — the `$defaultdata` value:

```python
import json
# use separators to produce it without spaces — it must match PHP json_encode's output exactly (otherwise the key comes out wrong)
plaintext = json.dumps({"showpassword": "no", "bgcolor": "#ffffff"}, separators=(',', ':'))
# '{"showpassword":"no","bgcolor":"#ffffff"}'
```

---

### Step 2: Find the Key

```python
# Ciphertext XOR Plaintext = Key
key = ""
for i in range(len(plaintext)):
    key += chr(ciphertext[i] ^ ord(plaintext[i]))

print(key)
# qw8Jqw8Jqw8Jqw8Jqw8Jqw8Jqw8Jqw8Jqw8Jqw8J
# Repeating pattern → the real key: "qw8J"
```

Because the key is repeated, you see a pattern in the output. Separate out the repeating part → the real key.

---

### Step 3: Produce a New Cookie

Now you know the key. Make the `showpassword` value `"yes"` and produce a new cookie:

```python
import base64, json

def xor_encrypt(text, key):
    result = ""
    for i, c in enumerate(text):
        result += chr(ord(c) ^ ord(key[i % len(key)]))
    return result

key = "qw8J"
new_data = {"showpassword": "yes", "bgcolor": "#ffffff"}
plaintext = json.dumps(new_data, separators=(',', ':'))

encrypted = xor_encrypt(plaintext, key)
new_cookie = base64.b64encode(encrypted.encode('latin-1')).decode()
print(new_cookie)
```

---

### Step 4: Change the Cookie and Send It

**With curl:**

```bash
curl -u natas11:[password] \
     -b "data=[NEW_COOKIE_VALUE]" \
     http://natas11.natas.labs.overthewire.org/
```

**In the browser:** DevTools → Application → Cookies → change the `data` value → reload the page.

---

### Summary: XOR Cookie Cracking Flow

```
1. Get the cookie → Base64 decode → Ciphertext
2. Guess the plaintext (from the source code, $defaultdata)
3. Ciphertext XOR Plaintext = Key (find the repeating pattern)
4. Build a new payload (showpassword: yes)
5. Payload → json_encode → XOR(key) → Base64 encode → New cookie
6. Change the cookie → Get the password
```

---

## 🔗 Resources

- [XOR cipher — Wikipedia](https://en.wikipedia.org/wiki/XOR_cipher)
- [PortSwigger — Symmetric Encryption](https://portswigger.net/web-security/jwt/algorithm-confusion)
- [CyberChef — XOR](https://gchq.github.io/CyberChef/#recipe=XOR)

---

**Previous topic:** [08_lfi_and_path_traversal.md](./08_lfi_and_path_traversal.md)
**Next topic:** [10_file_upload_bypass.md](./10_file_upload_bypass.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
