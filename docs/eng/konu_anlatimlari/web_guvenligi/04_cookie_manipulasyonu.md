# 🌐 Web Güvenliği — Cookie Manipülasyonu

> Sunucu sana bir cookie verir, tarayıcın bunu saklar ve her istekte
> geri gönderir. Peki sen o cookie'yi değiştirirsen?

---

## 📋 İçindekiler

- [Cookie Nedir?](#cookie-nedir)
- [Cookie Nasıl Çalışır?](#cookie-nasıl-çalışır)
- [Cookie Alanları ve Flag'ler](#cookie-alanları-ve-flagler)
- [Cookie Güvenlik Açıkları](#cookie-güvenlik-açıkları)
- [Cookie'leri Görüntüleme ve Değiştirme](#cookieleri-görüntüleme-ve-değiştirme)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## Cookie Nedir?

Cookie, sunucunun tarayıcıya "bunu sakla, her istekte bana geri gönder" dediği küçük bir veri parçasıdır. HTTP stateless olduğundan — her istek bağımsız — cookie'ler sunucunun kullanıcıyı "tanımasını" sağlar.

```
Kullanıcı giriş yapar
       ↓
Sunucu doğrular → Set-Cookie: isloggedin=1
       ↓
Tarayıcı cookie'yi saklar
       ↓
Sonraki her istekte → Cookie: isloggedin=1
       ↓
Sunucu "zaten giriş yapmış" der
```

---

## Cookie Nasıl Çalışır?

### Set-Cookie — Sunucudan Tarayıcıya

Sunucu response header'ında cookie atar:

```
HTTP/1.1 200 OK
Set-Cookie: isloggedin=1; path=/; HttpOnly
Set-Cookie: username=admin; expires=Thu, 01 Jan 2026 00:00:00 GMT
```

### Cookie — Tarayıcıdan Sunucuya

Tarayıcı sonraki isteklerde cookie'yi gönderir:

```
GET /dashboard.php HTTP/1.1
Host: example.com
Cookie: isloggedin=1; username=admin
```

Birden fazla cookie noktalı virgülle ayrılır.

---

## Cookie Alanları ve Flag'ler

```
Set-Cookie: name=value; Domain=example.com; Path=/; Expires=...; Secure; HttpOnly; SameSite=Lax
```

| Alan | Açıklama |
|------|----------|
| `name=value` | Cookie adı ve değeri |
| `Domain` | Hangi domain'e gönderilsin |
| `Path` | Hangi URL yolları için geçerli |
| `Expires` / `Max-Age` | Ne zaman silinsin |
| `Secure` | Sadece HTTPS üzerinden gönder |
| `HttpOnly` | JavaScript ile okunamaz (XSS koruması) |
| `SameSite` | Cross-site isteklerde gönderilmesin (CSRF koruması) |

### Güvenlik Açısından Flag'ler

`HttpOnly` → JavaScript'in `document.cookie` ile cookie'yi okumasını engeller. Ama **tarayıcı DevTools'dan veya Burp Suite'ten hâlâ okunabilir ve değiştirilebilir**.

`Secure` → Cookie sadece HTTPS bağlantılarda gönderilir. HTTP'de gönderilmez.

`SameSite` → Cookie sadece aynı siteden yapılan isteklerde gönderilir. Farklı sitelerden yapılan CSRF saldırılarını engeller.

> ⚠️ **Kritik:** `HttpOnly` ve `Secure` flag'leri olsa bile, cookie değerinin kendisi güvensizse (örneğin basit bir boolean veya tahmin edilebilir bir değer), saldırgan bunu Burp Suite ile değiştirebilir.

---

## Cookie Güvenlik Açıkları

### 1. Güvensiz Değer (Natas 5)

Cookie değeri sunucu tarafında doğrulanmıyor, sadece "1 mi 0 mı" diye bakıyor:

```
Cookie: isloggedin=0  →  erişim reddedildi
Cookie: isloggedin=1  →  erişim verildi   ← basitçe değiştir
```

**Sorun:** Sunucu cookie'nin nereden geldiğini doğrulamıyor. İmzasız ve şifresiz.

### 2. Hassas Veri İçeren Cookie (Natas 6 tarzı)

Cookie içinde uygulama mantığını etkileyen veri var:

```
Cookie: showpassword=no  →  şifreyi gösterme
Cookie: showpassword=yes →  şifreyi göster  ← değiştir
```

### 3. Tahmin Edilebilir Session ID

```
Cookie: PHPSESSID=1
Cookie: PHPSESSID=2
Cookie: PHPSESSID=3
```

Session ID'ler sıralıysa brute-force ile diğer kullanıcıların oturumları ele geçirilebilir.

### 4. Şifresiz / İmzasız Veri

```
Cookie: data=eyJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6InVzZXIifQ==
```

Bu Base64 — decode et:

```json
{"username":"admin","role":"user"}
```

`role` değerini `admin` yap, tekrar Base64 encode et, cookie'yi değiştir → admin erişimi.

---

## Cookie'leri Görüntüleme ve Değiştirme

### Yöntem 1: Browser DevTools

`F12` → **Application** sekmesi → **Storage** → **Cookies**

- Cookie adını, değerini, flag'lerini görürsün
- Değere çift tıklayarak düzenleyebilirsin
- Yeni cookie ekleyebilirsin

### Yöntem 2: Browser Console (JavaScript)

```javascript
// Tüm cookie'leri gör (HttpOnly olmayanları)
document.cookie

// Cookie ata
document.cookie = "isloggedin=1"

// Cookie'yi değiştir (aynı isimle yeniden ata)
document.cookie = "showpassword=yes"
```

> Not: `HttpOnly` flag'i olan cookie'ler `document.cookie` ile görünmez. Bunlar için DevTools veya Burp kullanılmalı.

### Yöntem 3: curl ile Cookie Gönderme

```bash
# -b ile cookie gönder
curl -u natas5:[şifre] \
     -b "isloggedin=1" \
     http://natas5.natas.labs.overthewire.org/

# -H ile header olarak gönder
curl -u natas5:[şifre] \
     -H "Cookie: isloggedin=1" \
     http://natas5.natas.labs.overthewire.org/

# Birden fazla cookie
curl -b "isloggedin=1; username=admin" http://example.com
```

### Yöntem 4: Burp Suite ile

1. Burp Suite'i aç, Proxy → Intercept açık
2. Tarayıcıyı Burp proxy'sine yönlendir
3. İsteği yakala
4. Cookie değerini doğrudan düzenle
5. Forward et

Bu yöntem `HttpOnly` flag'i olan cookie'leri de değiştirmenizi sağlar.

---

## Natas'ta Kullanım

### Natas 5 — Boolean Cookie

**Senaryo:** "Access disallowed. You are not logged in" yazıyor.

```bash
# Adım 1: mevcut cookie'yi gör
curl -v -u natas5:[şifre] http://natas5.natas.labs.overthewire.org/ 2>&1 | grep -i cookie
# Set-Cookie: isloggedin=0

# Adım 2: cookie'yi değiştirerek tekrar gönder
curl -u natas5:[şifre] \
     -b "isloggedin=1" \
     http://natas5.natas.labs.overthewire.org/
# "Access granted. The password for natas6 is..."
```

**Öğrenilen:** Sunucu cookie'ye körü körüne güveniyor. İmzasız cookie'ler doğrulama için güvenilmezdir.

---

### Natas 6 — PHP Include & Gizli Cookie Değeri

**Senaryo:** Sayfada bir secret soruluyor ve kaynak kodunda PHP `include` var.

```php
// Kaynak kodda:
include "includes/secret.inc";
if(array_key_exists("submit", $_POST)) {
    if($secret == $_POST['secret']) {
        // şifreyi göster
    }
}
```

`includes/secret.inc` dosyasını doğrudan ziyaret et:

```bash
curl -u natas6:[şifre] \
     http://natas6.natas.labs.overthewire.org/includes/secret.inc
# <?php $secret = "XXXXXXXXXXX"; ?>
```

Secret'i buldun. Formu bu değerle doldur.

**Öğrenilen:** `include` edilen dosyalar doğrudan URL ile erişilebilir olabilir. PHP dosyaları bile bazı sunucu yapılandırmalarında kaynak olarak görüntülenebilir.

---

### Cookie Güvenliği — Doğru Yaklaşım

```
Güvensiz ✗                    Güvenli ✓
─────────────────────         ──────────────────────────
isloggedin=1                  İmzalı session token
role=admin                    Sunucuda saklanan session
showpassword=yes              HMAC ile doğrulanmış cookie
username=admin                Opaque (anlamsız) session ID
```

Güvenli cookie yönetimi:
- Cookie içinde uygulama mantığı taşıma
- Session ID'yi sunucu tarafında sakla, cookie'de sadece rastgele bir token tut
- Token'ı kriptografik olarak imzala (HMAC)
- `HttpOnly`, `Secure`, `SameSite` flag'lerini kullan

---

## 🔗 Kaynaklar

- [MDN — HTTP Cookie'leri](https://developer.mozilla.org/tr/docs/Web/HTTP/Cookies)
- [PortSwigger — Cookie Manipülasyonu](https://portswigger.net/web-security/authentication/multi-factor/lab-mfa-bypass-using-a-brute-force-attack)
- [OWASP — Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---

**Önceki konu:** [03_robots_ve_dizin_kesfi.md](./03_robots_ve_dizin_kesfi.md)
**Sonraki konu:** [05_php_kaynak_kodu.md](./05_php_kaynak_kodu.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
