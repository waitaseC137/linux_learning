# 🌐 Web Security — HTTP Protocol Fundamentals

> Every conversation between the browser and the server happens over HTTP.
> Being able to read and modify this conversation is the foundation of web security.

---

## 📋 Table of Contents

- [What Is HTTP?](#what-is-http)
- [Request Structure](#request-structure)
- [Response Structure](#response-structure)
- [Important Headers](#important-headers)
- [HTTP Status Codes](#http-status-codes)
- [HTTP Requests with curl](#http-requests-with-curl)
- [Usage in Natas](#usage-in-natas)

---

## What Is HTTP?

**HTTP (HyperText Transfer Protocol)** is the communication protocol between the browser and the web server. Every page load, every form submission, every image request is an HTTP message.

```
Browser                           Server
   |                                 |
   |  ----[ HTTP Request ]------->   |
   |                                 |  processes
   |  <----[ HTTP Response ]------   |
   |                                 |
```

HTTP is a **stateless** protocol: the server evaluates each request independently and does not "remember" the previous request. Cookie and session mechanisms were developed to solve this problem.

---

## Request Structure

When the browser wants to open a page, it sends the server a message like this:

```
GET /index.php HTTP/1.1
Host: natas4.natas.labs.overthewire.org
User-Agent: Mozilla/5.0 (X11; Linux x86_64) Firefox/120.0
Accept: text/html,application/xhtml+xml
Referer: http://natas5.natas.labs.overthewire.org/
Cookie: PHPSESSID=abc123xyz
Connection: keep-alive
```

### Parts of the Structure

**1. Request Line (First line)**

```
GET /index.php HTTP/1.1
^    ^          ^
|    |          HTTP version
|    request path
HTTP method
```

| Method | When It's Used |
|-------|---------------------|
| `GET` | To retrieve a page/data — parameters appear in the URL |
| `POST` | To submit a form — parameters go hidden in the body |
| `PUT` | To update data |
| `DELETE` | To delete data |

**2. Headers**

Each line is in the format `Header-Name: Value`.

**3. Body**

Present only in methods like POST and PUT. GET requests have no body.

```
POST /login.php HTTP/1.1
Host: natas14.natas.labs.overthewire.org
Content-Type: application/x-www-form-urlencoded
Content-Length: 42

username=admin&password=test123
^
body (form data)
```

---

## Response Structure

After the server processes the request, it returns a response like this:

```
HTTP/1.1 200 OK
Date: Mon, 01 Jan 2024 12:00:00 GMT
Server: Apache/2.4.41 (Ubuntu)
Content-Type: text/html; charset=UTF-8
Set-Cookie: PHPSESSID=xyz789; path=/
Content-Length: 1234

<!DOCTYPE html>
<html>
  <body>Page content...</body>
</html>
```

### Parts of the Structure

**1. Status Line**

```
HTTP/1.1 200 OK
         ^   ^
         |   status message
         status code
```

**2. Response Headers**

**3. Body**

Page content (HTML, JSON, binary data, etc.)

---

## Important Headers

### Request Headers

| Header | Description | Security Significance |
|--------|----------|----------------|
| `Host` | Domain name of the requested server | Indicates which site is meant in virtual hosting |
| `User-Agent` | Browser/client information | The server may change behavior based on it — can be faked |
| `Referer` | Which page the user came from | **Critical in Natas 4** — can be manipulated |
| `Cookie` | Data stored by the browser | **Critical in Natas 5-6** — for session and auth |
| `Content-Type` | The format of the body | Important for bypasses in file uploads |
| `Authorization` | HTTP Basic Auth information | In the format `Basic base64(user:pass)` |

### Response Headers

| Header | Description | Security Significance |
|--------|----------|----------------|
| `Set-Cookie` | Sets a cookie in the browser | Cookie flags (HttpOnly, Secure) are important |
| `Location` | Redirect target | Present in 302 redirects |
| `Content-Type` | The format of the response | If misconfigured, can lead to XSS |
| `Server` | Server software/version | Information leak — attackers use this |

---

### Referer Header — Critical for Natas 4

The `Referer` header tells the browser: "From which page did I make this request?"

```
# From the site natas5.natas.labs.overthewire.org
# when you go to natas4, the browser adds this:
Referer: http://natas5.natas.labs.overthewire.org/
```

Natas 4 says "only accept users coming from natas5" and checks the `Referer` header. The problem: **the Referer header is sent by the browser and can easily be faked.**

```bash
# Set the Referer header manually with curl
curl -u natas4:[password] \
     -H "Referer: http://natas5.natas.labs.overthewire.org/" \
     http://natas4.natas.labs.overthewire.org/
```

---

## HTTP Status Codes

| Code | Meaning | When |
|-----|-------|----------|
| `200 OK` | Success | Normal page load |
| `301 Moved Permanently` | Permanent redirect | Domain change |
| `302 Found` | Temporary redirect | Redirect after login |
| `401 Unauthorized` | Authentication required | HTTP Basic Auth |
| `403 Forbidden` | Access forbidden | Unauthorized access |
| `404 Not Found` | Page not found | Wrong URL |
| `500 Internal Server Error` | Server error | Seen with bad SQL injection |

> 💡 **Tip:** During a 302 redirect, the server can send content in the body — the browser doesn't show it but curl/Burp do. This is critical in Natas 22.

---

## HTTP Requests with curl

`curl` is a tool that sends HTTP requests from the terminal. In Natas it is the fundamental tool for every level.

### Basic Usage

```bash
# Simple GET request
curl http://example.com

# With HTTP Basic Auth
curl -u user:password http://example.com

# Verbose mode — show all headers
curl -v http://example.com

# Show only the headers
curl -I http://example.com
```

### Adding and Changing Headers

```bash
# Add a single header
curl -H "Referer: http://another-site.com" http://example.com

# Multiple headers
curl -H "Referer: http://natas5.natas.labs.overthewire.org/" \
     -H "User-Agent: Mozilla/5.0" \
     http://natas4.natas.labs.overthewire.org/

# Send a cookie
curl -H "Cookie: isloggedin=1" http://example.com

# Alternative cookie syntax
curl -b "isloggedin=1" http://example.com
```

### Sending a POST Request

```bash
# Send form data
curl -X POST \
     -d "username=admin&password=test" \
     http://example.com/login.php

# auth + POST with -u
curl -u natas14:[password] \
     -X POST \
     -d "username=admin&password=test" \
     http://natas14.natas.labs.overthewire.org/
```

### Following Redirects

```bash
# Follow redirects automatically (default: does not)
curl -L http://example.com

# Do NOT follow redirects (see the body of the 302 response)
curl --max-redirs 0 http://natas22.natas.labs.overthewire.org/
```

### Through the Burp Suite Proxy

```bash
# Route all traffic to Burp (127.0.0.1:8080)
curl --proxy http://127.0.0.1:8080 \
     -u natas4:[password] \
     http://natas4.natas.labs.overthewire.org/
```

---

## Usage in Natas

### Natas 4 — Referer Manipulation

**Scenario:** The page says "I only accept users coming from natas5."

```bash
# Step 1: Normal visit — will be rejected
curl -u natas4:[password] http://natas4.natas.labs.overthewire.org/
# "Access disallowed. You are visiting from..."

# Step 2: Manipulate the Referer header
curl -u natas4:[password] \
     -H "Referer: http://natas5.natas.labs.overthewire.org/" \
     http://natas4.natas.labs.overthewire.org/
# "Access granted. The password for natas5 is..."
```

**Lesson learned:** Even with a server-side check, HTTP headers can be modified by the client. `Referer` is not a reliable verification mechanism.

---

### Summary: Anatomy of an HTTP Request

```
┌─────────────────────────────────────────────────────┐
│                   HTTP REQUEST                       │
├─────────────────────────────────────────────────────┤
│  GET /index.php HTTP/1.1          ← Request Line    │
│  Host: example.com                ← Header          │
│  User-Agent: Mozilla/5.0          ← Header          │
│  Referer: http://other-site.com   ← Header (fake!)  │
│  Cookie: session=abc123           ← Header          │
│                                   ← Empty line      │
│  (no body — in a GET request)                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   HTTP RESPONSE                      │
├─────────────────────────────────────────────────────┤
│  HTTP/1.1 200 OK                  ← Status Line     │
│  Set-Cookie: PHPSESSID=xyz        ← Header          │
│  Content-Type: text/html          ← Header          │
│                                   ← Empty line      │
│  <!DOCTYPE html>...               ← Body (HTML)     │
└─────────────────────────────────────────────────────┘
```

---

## 🔗 Resources

- [MDN — HTTP Overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview)
- [MDN — HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [PortSwigger — Manipulating HTTP Requests](https://portswigger.net/web-security/getting-started)
- [curl Man Page](https://curl.se/docs/manpage.html)

---

**Previous topic:** [01_html_source_and_devtools.md](./01_html_source_and_devtools.md)
**Next topic:** [03_robots_and_directory_discovery.md](./03_robots_and_directory_discovery.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
