# 🌐 Web Security — HTML Source Code & Developer Tools

> What you see on a web page is not always the same as what the server sent.
> Reading the source code is the most fundamental skill in web security.

---

## 📋 Table of Contents

- [What Is HTML?](#what-is-html)
- [Viewing Source Code](#viewing-source-code)
- [Browser Developer Tools](#browser-developer-tools)
- [Where Are Secrets Hidden?](#where-are-secrets-hidden)
- [Usage in Natas](#usage-in-natas)

---

## What Is HTML?

**HTML (HyperText Markup Language)** is a markup language that describes how the browser should display a page. The server sends the HTML text, and the browser renders it (turns it into something visual) to show it to the user.

```
Server                          Browser
  |  ----[ HTML text ]---->   |
  |                           |  renders it
  |                           |  user sees the visual
```

Key point: **the rendered visual ≠ the source code**. The browser can hide some things and make some elements invisible with CSS — but those are still present in the source code.

---

## Viewing Source Code

### Method 1: Keyboard Shortcut

| Browser | Shortcut |
|----------|---------|
| Chrome / Edge / Firefox | `Ctrl + U` (Windows/Linux) |
| Chrome / Edge / Firefox | `Cmd + Option + U` (Mac) |

This shortcut opens a new tab and shows the page's raw HTML code.

### Method 2: Add `view-source:` to the URL

Type the following into the address bar:

```
view-source:http://natas0.natas.labs.overthewire.org
```

### Method 3: Right Click → "View Page Source"

In Natas 1, right click is **disabled** — which is why knowing the methods above is critical.

### Method 4: Via the terminal with curl

```bash
curl -u natas0:natas0 http://natas0.natas.labs.overthewire.org
```

`-u user:password` → used for HTTP Basic Authentication.

---

## Browser Developer Tools

Opened with **F12** or `Ctrl + Shift + I`. The tabs you'll use most in web security:

### Elements (Inspector) Tab

Shows the page's live DOM structure. The difference from the HTML source code: it also shows elements that were later modified by JavaScript.

```
Source Code  → the original HTML sent by the server
Elements     → the current DOM after JavaScript has run
```

To find hidden elements: search with `Ctrl + F`.

```html
<!-- Hidden with CSS but present in the DOM -->
<p style="display:none;">Hidden text here!</p>

<!-- type="hidden" input field — invisible in the form but submitted -->
<input type="hidden" name="debug" value="true">
```

### Network Tab

Shows every HTTP request and response:

- **Headers** → Request and response headers (Cookie, Set-Cookie, Referer, etc.)
- **Response** → The raw content returned by the server
- **Preview** → The rendered version

After reloading the page, filter the requests:

```
Filter: Doc    → show only HTML pages
Filter: XHR    → show AJAX requests
Filter: JS     → show JavaScript files
```

### Console Tab

To run JavaScript:

```javascript
// Find all hidden inputs on the page
document.querySelectorAll('input[type="hidden"]')

// Read the cookies
document.cookie

// Find a specific element
document.getElementById('secretDiv').innerText
```

### Storage Tab (Application → Storage)

- **Cookies** → View and edit cookies
- **Local Storage / Session Storage** → Data stored in the browser

---

## Where Are Secrets Hidden?

Web developers sometimes put sensitive information in the wrong places. Places to look in the source code:

### 1. HTML Comments

```html
<!-- Password: abc123 -->
<!-- TODO: don't forget to remove this debug code before production -->
<!-- Backup login: admin / temp123 -->
```

Comments are invisible in the browser but readable in the source code.

### 2. Hidden Input Fields

```html
<form action="/login">
    <input type="text" name="username">
    <input type="password" name="password">
    <input type="hidden" name="isAdmin" value="false">   <!-- watch out here -->
</form>
```

`type="hidden"` fields are not shown to the user but are sent to the server when the form is submitted — and they can be modified.

### 3. JavaScript Files

```html
<script src="/js/config.js"></script>
```

```javascript
// Inside config.js
const API_KEY = "sk-abc123...";
const SECRET_ENDPOINT = "/admin/debug";
const DEFAULT_PASSWORD = "changeme123";
```

### 4. Elements Hidden with CSS

```html
<div style="display:none; visibility:hidden; opacity:0;">
    Hidden content
</div>
```

CSS hiding is not a security measure — it is still visible in the source code.

### 5. Included Files

In PHP, the content of a file included with `include 'secret.php'` may be embedded in the HTML.

---

## Usage in Natas

### Natas 0 — Basic Source Code

**Scenario:** The page says "the password is on this page" but it isn't visible.

```bash
# Method 1: Ctrl+U in the browser
# Method 2: with curl
curl -u natas0:natas0 http://natas0.natas.labs.overthewire.org
```

The password is hidden inside an HTML comment in the source code:

```html
<!--The password for natas1 is [REDACTED] -->
```

**Lesson learned:** Comments are hidden in the browser but exposed in the source code.

---

### Natas 1 — Right Click Blocked

**Scenario:** Right click has been disabled with JavaScript.

```javascript
// You'll see something like this in the source code:
document.oncontextmenu = function() { return false; }
```

**Solution:** Even if right click doesn't work, `Ctrl + U` does.

```bash
# Or curl:
curl -u natas1:[password] http://natas1.natas.labs.overthewire.org
```

**Lesson learned:** Client-side (browser-side) restrictions provide no real security. They are easily bypassed with `Ctrl + U` or curl.

---

### Tips

```
✓ Always check the source with Ctrl+U
✓ Search for HTML comments (<!-- -->)
✓ Watch out for <input type="hidden"> fields
✓ Read the <script> blocks embedded in the page
✓ If right click doesn't work, use Ctrl+U or curl
✓ Look at the response headers in DevTools → Network tab
```

---

## 🔗 Resources

- [MDN — Introduction to HTML](https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML)
- [MDN — Browser DevTools](https://developer.mozilla.org/en-US/docs/Tools)
- [PortSwigger — Getting Started with Web Security](https://portswigger.net/web-security/getting-started)

---

**Next topic:** [02_http_protocol.md](./02_http_protocol.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
