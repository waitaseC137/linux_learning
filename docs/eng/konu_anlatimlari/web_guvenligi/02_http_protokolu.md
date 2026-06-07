# 🌐 Web Güvenliği — HTTP Protokolü Temelleri

> Tarayıcı ile sunucu arasındaki her konuşma HTTP ile gerçekleşir.
> Bu konuşmayı okuyabilmek ve değiştirebilmek, web güvenliğinin temelidir.

---

## 📋 İçindekiler

- [HTTP Nedir?](#http-nedir)
- [Request (İstek) Yapısı](#request-i̇stek-yapısı)
- [Response (Cevap) Yapısı](#response-cevap-yapısı)
- [Önemli Header'lar](#önemli-headerlar)
- [HTTP Durum Kodları](#http-durum-kodları)
- [curl ile HTTP İstekleri](#curl-ile-http-i̇stekleri)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## HTTP Nedir?

**HTTP (HyperText Transfer Protocol)**, tarayıcı ile web sunucusu arasındaki iletişim protokolüdür. Her sayfa yüklemesi, her form gönderimi, her resim isteği birer HTTP mesajıdır.

```
Tarayıcı                          Sunucu
   |                                 |
   |  ----[ HTTP Request ]------->   |
   |                                 |  işler
   |  <----[ HTTP Response ]------   |
   |                                 |
```

HTTP **stateless** (durumsuz) bir protokoldür: sunucu her isteği bağımsız değerlendirir, bir önceki isteği "hatırlamaz". Cookie ve session mekanizmaları bu sorunu çözmek için geliştirilmiştir.

---

## Request (İstek) Yapısı

Tarayıcı bir sayfayı açmak istediğinde sunucuya şöyle bir mesaj gönderir:

```
GET /index.php HTTP/1.1
Host: natas4.natas.labs.overthewire.org
User-Agent: Mozilla/5.0 (X11; Linux x86_64) Firefox/120.0
Accept: text/html,application/xhtml+xml
Referer: http://natas5.natas.labs.overthewire.org/
Cookie: PHPSESSID=abc123xyz
Connection: keep-alive
```

### Yapının Parçaları

**1. Request Line (İlk satır)**

```
GET /index.php HTTP/1.1
^    ^          ^
|    |          HTTP versiyonu
|    istek yolu (path)
HTTP metodu
```

| Metod | Ne Zaman Kullanılır |
|-------|---------------------|
| `GET` | Sayfa/veri almak için — parametreler URL'de görünür |
| `POST` | Form göndermek için — parametreler body'de gizli gider |
| `PUT` | Veri güncellemek için |
| `DELETE` | Veri silmek için |

**2. Header'lar**

Her satır `Header-Adı: Değer` formatındadır.

**3. Body (Gövde)**

Sadece POST, PUT gibi metodlarda bulunur. GET isteklerinde body yoktur.

```
POST /login.php HTTP/1.1
Host: natas14.natas.labs.overthewire.org
Content-Type: application/x-www-form-urlencoded
Content-Length: 42

username=admin&password=test123
^
body (form verileri)
```

---

## Response (Cevap) Yapısı

Sunucu isteği işledikten sonra şöyle bir cevap döner:

```
HTTP/1.1 200 OK
Date: Mon, 01 Jan 2024 12:00:00 GMT
Server: Apache/2.4.41 (Ubuntu)
Content-Type: text/html; charset=UTF-8
Set-Cookie: PHPSESSID=xyz789; path=/
Content-Length: 1234

<!DOCTYPE html>
<html>
  <body>Sayfa içeriği...</body>
</html>
```

### Yapının Parçaları

**1. Status Line**

```
HTTP/1.1 200 OK
         ^   ^
         |   durum mesajı
         durum kodu
```

**2. Response Header'ları**

**3. Body**

Sayfa içeriği (HTML, JSON, binary veri vb.)

---

## Önemli Header'lar

### Request Header'ları

| Header | Açıklama | Güvenlik Önemi |
|--------|----------|----------------|
| `Host` | İstenen sunucunun domain adı | Sanal hosting'de hangi site olduğunu belirtir |
| `User-Agent` | Tarayıcı/istemci bilgisi | Sunucu buna göre davranış değiştirebilir — sahte gönderilebilir |
| `Referer` | Kullanıcının hangi sayfadan geldiği | **Natas 4'te kritik** — manipüle edilebilir |
| `Cookie` | Tarayıcının sakladığı veri | **Natas 5-6'da kritik** — session ve auth için |
| `Content-Type` | Body'nin formatı | Dosya upload'larında bypass için önemli |
| `Authorization` | HTTP Basic Auth bilgisi | `Basic base64(user:pass)` formatında |

### Response Header'ları

| Header | Açıklama | Güvenlik Önemi |
|--------|----------|----------------|
| `Set-Cookie` | Tarayıcıya cookie atar | Cookie flag'leri (HttpOnly, Secure) önemli |
| `Location` | Redirect hedefi | 302 redirect'lerde bulunur |
| `Content-Type` | Cevabın formatı | Yanlış ayarlanırsa XSS'e yol açabilir |
| `Server` | Sunucu yazılımı/versiyonu | Bilgi sızıntısı — saldırganlar bunu kullanır |

---

### Referer Header — Natas 4 İçin Kritik

`Referer` header'ı tarayıcıya şunu söyler: "Bu isteği hangi sayfadan yaptım?"

```
# natas5.natas.labs.overthewire.org sitesinden
# natas4'e gittiğinde tarayıcı şunu ekler:
Referer: http://natas5.natas.labs.overthewire.org/
```

Natas 4, "sadece natas5'ten gelen kullanıcıları kabul et" der ve `Referer` header'ını kontrol eder. Problem şu: **Referer header'ı tarayıcı tarafından gönderilir ve kolayca sahte yapılabilir.**

```bash
# curl ile Referer header'ını manuel ayarla
curl -u natas4:[şifre] \
     -H "Referer: http://natas5.natas.labs.overthewire.org/" \
     http://natas4.natas.labs.overthewire.org/
```

---

## HTTP Durum Kodları

| Kod | Anlam | Ne Zaman |
|-----|-------|----------|
| `200 OK` | Başarılı | Normal sayfa yüklemesi |
| `301 Moved Permanently` | Kalıcı yönlendirme | Domain değişikliği |
| `302 Found` | Geçici yönlendirme | Login sonrası yönlendirme |
| `401 Unauthorized` | Kimlik doğrulama gerekli | HTTP Basic Auth |
| `403 Forbidden` | Erişim yasak | Yetkisiz erişim |
| `404 Not Found` | Sayfa bulunamadı | Yanlış URL |
| `500 Internal Server Error` | Sunucu hatası | Kötü SQL injection'da görülür |

> 💡 **İpucu:** 302 redirect sırasında sunucu body'de içerik gönderebilir — tarayıcı bunu göstermez ama curl/Burp gösterir. Bu Natas 22'de kritik.

---

## curl ile HTTP İstekleri

`curl` terminal üzerinden HTTP isteği gönderen bir araçtır. Natas'ta her level için temel araçtır.

### Temel Kullanım

```bash
# Basit GET isteği
curl http://example.com

# HTTP Basic Auth ile
curl -u kullanici:sifre http://example.com

# Verbose mod — tüm header'ları göster
curl -v http://example.com

# Sadece header'ları göster
curl -I http://example.com
```

### Header Ekleme ve Değiştirme

```bash
# Tek header ekle
curl -H "Referer: http://baska-site.com" http://example.com

# Birden fazla header
curl -H "Referer: http://natas5.natas.labs.overthewire.org/" \
     -H "User-Agent: Mozilla/5.0" \
     http://natas4.natas.labs.overthewire.org/

# Cookie gönder
curl -H "Cookie: isloggedin=1" http://example.com

# Alternatif cookie sözdizimi
curl -b "isloggedin=1" http://example.com
```

### POST İsteği Gönderme

```bash
# Form verisi gönder
curl -X POST \
     -d "username=admin&password=test" \
     http://example.com/login.php

# -u ile auth + POST
curl -u natas14:[şifre] \
     -X POST \
     -d "username=admin&password=test" \
     http://natas14.natas.labs.overthewire.org/
```

### Redirect Takibi

```bash
# Redirect'leri otomatik takip et (varsayılan: etmez)
curl -L http://example.com

# Redirect'leri TAKIP ETME (302 cevabının body'sini gör)
curl --max-redirs 0 http://natas22.natas.labs.overthewire.org/
```

### Burp Suite Proxy Üzerinden

```bash
# Tüm trafiği Burp'e yönlendir (127.0.0.1:8080)
curl --proxy http://127.0.0.1:8080 \
     -u natas4:[şifre] \
     http://natas4.natas.labs.overthewire.org/
```

---

## Natas'ta Kullanım

### Natas 4 — Referer Manipülasyonu

**Senaryo:** Sayfa "sadece natas5'ten gelen kullanıcıları kabul ediyorum" diyor.

```bash
# Adım 1: Normal ziyaret — reddedilecek
curl -u natas4:[şifre] http://natas4.natas.labs.overthewire.org/
# "Access disallowed. You are visiting from..."

# Adım 2: Referer header'ını manipüle et
curl -u natas4:[şifre] \
     -H "Referer: http://natas5.natas.labs.overthewire.org/" \
     http://natas4.natas.labs.overthewire.org/
# "Access granted. The password for natas5 is..."
```

**Öğrenilen:** Sunucu-taraflı kontrol olsa bile, HTTP header'ları istemci tarafından değiştirilebilir. `Referer` güvenilir bir doğrulama mekanizması değildir.

---

### Özet: HTTP İsteği Anatomisi

```
┌─────────────────────────────────────────────────────┐
│                   HTTP REQUEST                       │
├─────────────────────────────────────────────────────┤
│  GET /index.php HTTP/1.1          ← Request Line    │
│  Host: example.com                ← Header          │
│  User-Agent: Mozilla/5.0          ← Header          │
│  Referer: http://other-site.com   ← Header (sahte!) │
│  Cookie: session=abc123           ← Header          │
│                                   ← Boş satır       │
│  (body yok — GET isteğinde)                         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   HTTP RESPONSE                      │
├─────────────────────────────────────────────────────┤
│  HTTP/1.1 200 OK                  ← Status Line     │
│  Set-Cookie: PHPSESSID=xyz        ← Header          │
│  Content-Type: text/html          ← Header          │
│                                   ← Boş satır       │
│  <!DOCTYPE html>...               ← Body (HTML)     │
└─────────────────────────────────────────────────────┘
```

---

## 🔗 Kaynaklar

- [MDN — HTTP'ye Genel Bakış](https://developer.mozilla.org/tr/docs/Web/HTTP/Overview)
- [MDN — HTTP Header'ları](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [PortSwigger — HTTP İsteklerini Manipüle Etme](https://portswigger.net/web-security/getting-started)
- [curl Man Page](https://curl.se/docs/manpage.html)

---

**Önceki konu:** [01_html_kaynak_ve_devtools.md](./01_html_kaynak_ve_devtools.md)
**Sonraki konu:** [03_robots_ve_dizin_kesfi.md](./03_robots_ve_dizin_kesfi.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
