# 🌐 Web Security — robots.txt & Directory Discovery

> Web servers sometimes say "don't show this directory" — but in saying so,
> they also tell you exactly which directory they're hiding.

---

## 📋 Table of Contents

- [What Is robots.txt?](#what-is-robotstxt)
- [robots.txt Format](#robotstxt-format)
- [Directory Listing](#directory-listing)
- [Hidden File and Directory Discovery](#hidden-file-and-directory-discovery)
- [Usage in Natas](#usage-in-natas)

---

## What Is robots.txt?

`robots.txt` is a file located in the root directory of the web server that tells **search engines** (Google, Bing, etc.) which pages should not be indexed.

```
https://example.com/robots.txt
```

Key point: `robots.txt` is **not an access restriction**. It is merely a "request" directed at search engines. Normal users (and attackers) can read this file and visit the hidden paths in it.

```
# A search engine reads this file and follows the rules
# A human and an attacker read this file and find the hidden paths
```

---

## robots.txt Format

```
User-agent: *
Disallow: /admin/
Disallow: /private/
Disallow: /backup/
Disallow: /secret-config.php
Allow: /public/

User-agent: Googlebot
Disallow: /tmp/
```

### Directives

| Directive | Description |
|----------|----------|
| `User-agent: *` | Applies to all bots |
| `User-agent: Googlebot` | Only for Google's bot |
| `Disallow: /path/` | Don't index this path |
| `Allow: /path/` | Index this path (to override a Disallow) |
| `Sitemap: /sitemap.xml` | Location of the sitemap |

### Reading It Through an Attacker's Eyes

```
User-agent: *
Disallow: /s3cr3t/        ← "I'm hiding something here"
Disallow: /old-admin/     ← "old admin panel"
Disallow: /backup.sql     ← "database backup!"
```

Every path in a `Disallow` directive means a potential target that should be explored.

---

## Directory Listing

If the web server cannot find a main page like `index.html` or `index.php` in a directory, and if the configuration allows it, it **lists the directory contents**. This is like opening a folder of the file system in the browser.

```
Index of /files/
[DIR]  images/          2024-01-01 12:00  -
[TXT]  users.txt        2024-01-01 12:00  1.2K   ← sensitive data!
[TXT]  config.php.bak   2024-01-01 12:00  456    ← backup file!
```

What to do when you see a directory listing:

1. Open every file one by one
2. Pay special attention to files with `.bak`, `.old`, `.tmp`, `.log` extensions
3. Enter subdirectories too

### Common Sensitive File Names

```
config.php.bak       → backed-up config file
database.sql         → database dump
users.txt            → user list
passwords.txt        → password list
.htpasswd            → Apache password file
.git/                → Git repository (all the source code!)
.env                 → Environment variables (API keys, etc.)
wp-config.php.bak    → WordPress config backup
```

---

## Hidden File and Directory Discovery

If directory listing is disabled and the path isn't in robots.txt either, common paths can be tried by guessing.

### Manual Checking

```bash
# Try common paths one by one
curl -u natas2:[password] http://natas2.natas.labs.overthewire.org/files/
curl -u natas2:[password] http://natas2.natas.labs.overthewire.org/backup/
curl -u natas2:[password] http://natas2.natas.labs.overthewire.org/admin/
```

### Gathering Clues from the Source Code

In the HTML source code, the paths of resources like images, CSS, and JavaScript give clues about the directory structure:

```html
<!-- This line says the /files/ directory exists -->
<img src="/files/pixel.png" alt="">
```

Visit the `/files/` directory directly:

```
http://natas2.natas.labs.overthewire.org/files/
```

---

## Usage in Natas

### Natas 3 — Reading robots.txt

**Scenario:** The source code says "Not even Google will find it this time!"

**Thought:** If it wants to be hidden from Google, it may have used `robots.txt`.

```bash
# Step 1: Read the robots.txt file
curl -u natas3:[password] \
     http://natas3.natas.labs.overthewire.org/robots.txt
```

```
User-agent: *
Disallow: /s3cr3t/
```

```bash
# Step 2: Visit the hidden directory
curl -u natas3:[password] \
     http://natas3.natas.labs.overthewire.org/s3cr3t/
```

Directory listing is enabled — the `users.txt` file is visible.

```bash
# Step 3: Read the file
curl -u natas3:[password] \
     http://natas3.natas.labs.overthewire.org/s3cr3t/users.txt
```

**Lesson learned:** robots.txt is not a hiding tool, it's a discovery tool.

---

### Natas 2 — Directory Listing

**Scenario:** The page only says "There is nothing on this page."

```bash
# Step 1: Look at the source code
curl -u natas2:[password] http://natas2.natas.labs.overthewire.org/ | grep -i 'src\|href'
# <img src="files/pixel.png">  ← the /files/ directory exists!

# Step 2: Visit the directory
curl -u natas2:[password] http://natas2.natas.labs.overthewire.org/files/
# Index of /files/ → users.txt appears

# Step 3: Read the file
curl -u natas2:[password] http://natas2.natas.labs.overthewire.org/files/users.txt
# natas3:[password]
```

**Lesson learned:** File paths in the source code reveal the directory structure. If directory listing is enabled, all content is visible.

---

### Checklist

```
On a new Natas level:
  ☐ View the page source (Ctrl+U)
  ☐ Check the /robots.txt address
  ☐ Look at the src/href paths in the source code
  ☐ Visit the directories you find directly (directory listing?)
  ☐ Open the files in the directory one by one
  ☐ Pay special attention to files with .bak, .old, .txt, .sql extensions
```

---

## 🔗 Resources

- [robots.txt — Google Documentation](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [OWASP — Sensitive Data Exposure](https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure)
- [MDN — Directory Listings](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Apache_Configuration_htaccess)

---

**Previous topic:** [02_http_protocol.md](./02_http_protocol.md)
**Next topic:** [04_cookie_manipulation.md](./04_cookie_manipulation.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
