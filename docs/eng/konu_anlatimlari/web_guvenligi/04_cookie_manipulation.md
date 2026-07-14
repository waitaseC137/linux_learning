# 🌐 Web Security — Cookie Manipulation

> The server gives you a cookie, your browser stores it and sends it back
> with every request. But what if you change that cookie?

---

## 📋 Table of Contents

- [What Is a Cookie?](#what-is-a-cookie)
- [How Do Cookies Work?](#how-do-cookies-work)
- [Cookie Fields and Flags](#cookie-fields-and-flags)
- [Cookie Security Vulnerabilities](#cookie-security-vulnerabilities)
- [Viewing and Changing Cookies](#viewing-and-changing-cookies)
- [Usage in Natas](#usage-in-natas)

---

## What Is a Cookie?

A cookie is a small piece of data that the server tells the browser to "store this, send it back to me with every request." Because HTTP is stateless — every request is independent — cookies allow the server to "recognize" the user.

```
User logs in
       ↓
Server verifies → Set-Cookie: isloggedin=1
       ↓
Browser stores the cookie
       ↓
On every subsequent request → Cookie: isloggedin=1
       ↓
Server says "already logged in"
```

---

## How Do Cookies Work?

### Set-Cookie — From the Server to the Browser

The server sets a cookie in the response header:

```
HTTP/1.1 200 OK
Set-Cookie: isloggedin=1; path=/; HttpOnly
Set-Cookie: username=admin; expires=Thu, 01 Jan 2026 00:00:00 GMT
```

### Cookie — From the Browser to the Server

The browser sends the cookie in subsequent requests:

```
GET /dashboard.php HTTP/1.1
Host: example.com
Cookie: isloggedin=1; username=admin
```

Multiple cookies are separated by semicolons.

---

## Cookie Fields and Flags

```
Set-Cookie: name=value; Domain=example.com; Path=/; Expires=...; Secure; HttpOnly; SameSite=Lax
```

| Field | Description |
|------|----------|
| `name=value` | Cookie name and value |
| `Domain` | Which domain it should be sent to |
| `Path` | Which URL paths it applies to |
| `Expires` / `Max-Age` | When it should be deleted |
| `Secure` | Send only over HTTPS |
| `HttpOnly` | Cannot be read by JavaScript (XSS protection) |
| `SameSite` | Don't send on cross-site requests (CSRF protection) |

### Flags from a Security Standpoint

`HttpOnly` → Prevents JavaScript from reading the cookie via `document.cookie`. But it **can still be read and modified from the browser DevTools or Burp Suite**.

`Secure` → The cookie is only sent over HTTPS connections. It is not sent over HTTP.

`SameSite` → The cookie is only sent on requests from the same site. It blocks CSRF attacks made from other sites.

> ⚠️ **Critical:** Even with the `HttpOnly` and `Secure` flags, if the cookie value itself is insecure (for example a simple boolean or a guessable value), an attacker can change it with Burp Suite.

---

## Cookie Security Vulnerabilities

### 1. Insecure Value (Natas 5)

The cookie value is not verified server-side; the server just checks "is it 1 or 0":

```
Cookie: isloggedin=0  →  access denied
Cookie: isloggedin=1  →  access granted   ← simply change it
```

**Problem:** The server doesn't verify where the cookie came from. Unsigned and unencrypted.

### 2. Cookie Containing Sensitive Data (Natas 6 style)

The cookie contains data that affects application logic:

```
Cookie: showpassword=no  →  don't show the password
Cookie: showpassword=yes →  show the password  ← change it
```

### 3. Predictable Session ID

```
Cookie: PHPSESSID=1
Cookie: PHPSESSID=2
Cookie: PHPSESSID=3
```

If session IDs are sequential, other users' sessions can be hijacked by brute-force.

### 4. Unencrypted / Unsigned Data

```
Cookie: data=eyJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6InVzZXIifQ==
```

This is Base64 — decode it:

```json
{"username":"admin","role":"user"}
```

Change the `role` value to `admin`, Base64-encode it again, change the cookie → admin access.

---

## Viewing and Changing Cookies

### Method 1: Browser DevTools

`F12` → **Application** tab → **Storage** → **Cookies**

- You see the cookie name, value, and flags
- You can edit the value by double-clicking it
- You can add a new cookie

### Method 2: Browser Console (JavaScript)

```javascript
// See all cookies (the non-HttpOnly ones)
document.cookie

// Set a cookie
document.cookie = "isloggedin=1"

// Change a cookie (re-set it with the same name)
document.cookie = "showpassword=yes"
```

> Note: Cookies with the `HttpOnly` flag are not visible via `document.cookie`. DevTools or Burp must be used for those.

### Method 3: Sending Cookies with curl

```bash
# Send a cookie with -b
curl -u natas5:[password] \
     -b "isloggedin=1" \
     http://natas5.natas.labs.overthewire.org/

# Send as a header with -H
curl -u natas5:[password] \
     -H "Cookie: isloggedin=1" \
     http://natas5.natas.labs.overthewire.org/

# Multiple cookies
curl -b "isloggedin=1; username=admin" http://example.com
```

### Method 4: With Burp Suite

1. Open Burp Suite, Proxy → Intercept on
2. Route the browser through the Burp proxy
3. Capture the request
4. Edit the cookie value directly
5. Forward it

This method also lets you change cookies with the `HttpOnly` flag.

---

## Usage in Natas

### Natas 5 — Boolean Cookie

**Scenario:** It says "Access disallowed. You are not logged in."

```bash
# Step 1: See the current cookie
curl -v -u natas5:[password] http://natas5.natas.labs.overthewire.org/ 2>&1 | grep -i cookie
# Set-Cookie: isloggedin=0

# Step 2: Send it again with the cookie changed
curl -u natas5:[password] \
     -b "isloggedin=1" \
     http://natas5.natas.labs.overthewire.org/
# "Access granted. The password for natas6 is..."
```

**Lesson learned:** The server trusts the cookie blindly. Unsigned cookies are unreliable for verification.

---

### Natas 6 — PHP Include & Hidden Cookie Value

**Scenario:** The page asks for a secret, and there's a PHP `include` in the source code.

```php
// In the source code:
include "includes/secret.inc";
if(array_key_exists("submit", $_POST)) {
    if($secret == $_POST['secret']) {
        // show the password
    }
}
```

Visit the `includes/secret.inc` file directly:

```bash
curl -u natas6:[password] \
     http://natas6.natas.labs.overthewire.org/includes/secret.inc
# <?php $secret = "XXXXXXXXXXX"; ?>
```

You found the secret. Fill the form with this value.

**Lesson learned:** Included files may be accessible directly via URL. Even PHP files can be displayed as source under some server configurations.

---

### Cookie Security — The Right Approach

```
Insecure ✗                    Secure ✓
─────────────────────         ──────────────────────────
isloggedin=1                  Signed session token
role=admin                    Session stored on the server
showpassword=yes              Cookie verified with HMAC
username=admin                Opaque (meaningless) session ID
```

Secure cookie management:
- Don't carry application logic in the cookie
- Store the session ID server-side; keep only a random token in the cookie
- Sign the token cryptographically (HMAC)
- Use the `HttpOnly`, `Secure`, `SameSite` flags

---

## 🔗 Resources

- [MDN — HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [PortSwigger — Cookie Manipulation](https://portswigger.net/web-security/authentication/multi-factor/lab-mfa-bypass-using-a-brute-force-attack)
- [OWASP — Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---

**Previous topic:** [03_robots_and_directory_discovery.md](./03_robots_and_directory_discovery.md)
**Next topic:** [05_php_source_code.md](./05_php_source_code.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
