# 🌐 Web Güvenliği — robots.txt & Dizin Keşfi

> Web sunucuları bazen "bu dizini gösterme" der — ama bunu söylerken
> tam olarak hangi dizini sakladığını da söylemiş olur.

---

## 📋 İçindekiler

- [robots.txt Nedir?](#robotstxt-nedir)
- [robots.txt Formatı](#robotstxt-formatı)
- [Dizin Listeleme (Directory Listing)](#dizin-listeleme-directory-listing)
- [Gizli Dosya ve Dizin Keşfi](#gizli-dosya-ve-dizin-keşfi)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## robots.txt Nedir?

`robots.txt`, web sunucusunun kök dizininde bulunan ve **arama motorlarına** (Google, Bing vb.) hangi sayfaların indekslenmemesi gerektiğini söyleyen bir dosyadır.

```
https://example.com/robots.txt
```

Önemli nokta: `robots.txt` **bir erişim kısıtlaması değildir**. Sadece arama motorlarına yönelik bir "rica"dır. Normal kullanıcılar (ve saldırganlar) bu dosyayı okuyabilir ve içindeki gizli yolları ziyaret edebilir.

```
# Arama motoru bu dosyayı okur ve kurallara uyar
# İnsan ve saldırgan bu dosyayı okur ve gizli yolları bulur
```

---

## robots.txt Formatı

```
User-agent: *
Disallow: /admin/
Disallow: /private/
Disallow: /backup/
Disallow: /secret-config.php
Allow: /public/

User-agent: Googlebot
Disallow: /tmp/
```

### Direktifler

| Direktif | Açıklama |
|----------|----------|
| `User-agent: *` | Tüm botlar için geçerli |
| `User-agent: Googlebot` | Sadece Google botu için |
| `Disallow: /path/` | Bu yolu indeksleme |
| `Allow: /path/` | Bu yolu indeksle (Disallow geçersiz kılmak için) |
| `Sitemap: /sitemap.xml` | Site haritasının yeri |

### Saldırgan Gözüyle Okumak

```
User-agent: *
Disallow: /s3cr3t/        ← "burada bir şeyler saklıyorum"
Disallow: /old-admin/     ← "eski admin paneli"
Disallow: /backup.sql     ← "veritabanı yedeği!"
```

`Disallow` direktifindeki her yol, keşfedilmesi gereken potansiyel bir hedef demektir.

---

## Dizin Listeleme (Directory Listing)

Web sunucusu bir dizinde `index.html` veya `index.php` gibi bir ana sayfa bulamazsa, eğer yapılandırma izin veriyorsa **dizin içeriğini listeler**. Bu, dosya sisteminin bir klasörünü tarayıcıda açmak gibidir.

```
Index of /files/
[DIR]  images/          2024-01-01 12:00  -
[TXT]  users.txt        2024-01-01 12:00  1.2K   ← hassas veri!
[TXT]  config.php.bak   2024-01-01 12:00  456    ← yedek dosya!
```

Dizin listeleme görüldüğünde yapılacak şeyler:

1. Tüm dosyaları tek tek aç
2. `.bak`, `.old`, `.tmp`, `.log` uzantılı dosyalara özellikle bak
3. Alt dizinlere de gir

### Yaygın Hassas Dosya Adları

```
config.php.bak       → yedek alınmış config dosyası
database.sql         → veritabanı dökümü
users.txt            → kullanıcı listesi
passwords.txt        → şifre listesi
.htpasswd            → Apache şifre dosyası
.git/                → Git deposu (tüm kaynak kod!)
.env                 → Ortam değişkenleri (API key'ler vb.)
wp-config.php.bak    → WordPress config yedeği
```

---

## Gizli Dosya ve Dizin Keşfi

Dizin listeleme kapalıysa ve robots.txt'de de yoksa, yaygın yollar tahmin edilerek denenebilir.

### Manuel Kontrol

```bash
# Yaygın yolları tek tek dene
curl -u natas2:[şifre] http://natas2.natas.labs.overthewire.org/files/
curl -u natas2:[şifre] http://natas2.natas.labs.overthewire.org/backup/
curl -u natas2:[şifre] http://natas2.natas.labs.overthewire.org/admin/
```

### Kaynak Kodundan İpucu Toplamak

HTML kaynak kodunda resim, CSS, JavaScript gibi kaynakların yolları dizin yapısı hakkında ipucu verir:

```html
<!-- Bu satır /files/ dizininin var olduğunu söyler -->
<img src="/files/pixel.png" alt="">
```

`/files/` dizinini doğrudan ziyaret et:

```
http://natas2.natas.labs.overthewire.org/files/
```

---

## Natas'ta Kullanım

### Natas 3 — robots.txt Okumak

**Senaryo:** Kaynak kodda "Not even Google will find it this time!" yazıyor.

**Düşünce:** Google'dan saklanmak istiyorsa `robots.txt` kullanmış olabilir.

```bash
# Adım 1: robots.txt dosyasını oku
curl -u natas3:[şifre] \
     http://natas3.natas.labs.overthewire.org/robots.txt
```

```
User-agent: *
Disallow: /s3cr3t/
```

```bash
# Adım 2: gizli dizini ziyaret et
curl -u natas3:[şifre] \
     http://natas3.natas.labs.overthewire.org/s3cr3t/
```

Dizin listeleme açık — `users.txt` dosyası görünür.

```bash
# Adım 3: dosyayı oku
curl -u natas3:[şifre] \
     http://natas3.natas.labs.overthewire.org/s3cr3t/users.txt
```

**Öğrenilen:** robots.txt gizleme aracı değil, keşif aracıdır.

---

### Natas 2 — Dizin Listeleme

**Senaryo:** Sayfada sadece "There is nothing on this page" yazıyor.

```bash
# Adım 1: kaynak koda bak
curl -u natas2:[şifre] http://natas2.natas.labs.overthewire.org/ | grep -i 'src\|href'
# <img src="files/pixel.png">  ← /files/ dizini var!

# Adım 2: dizini ziyaret et
curl -u natas2:[şifre] http://natas2.natas.labs.overthewire.org/files/
# Index of /files/ → users.txt görünüyor

# Adım 3: dosyayı oku
curl -u natas2:[şifre] http://natas2.natas.labs.overthewire.org/files/users.txt
# natas3:[şifre]
```

**Öğrenilen:** Kaynak koddaki dosya yolları dizin yapısını ele verir. Dizin listeleme açıksa tüm içerik görünür.

---

### Kontrol Listesi

```
Yeni bir Natas seviyesinde:
  ☐ Sayfa kaynağını gör (Ctrl+U)
  ☐ /robots.txt adresini kontrol et
  ☐ Kaynak koddaki src/href yollarına bak
  ☐ Bulunan dizinleri doğrudan ziyaret et (dizin listeleme?)
  ☐ Dizin içindeki dosyaları tek tek aç
  ☐ .bak, .old, .txt, .sql uzantılı dosyalara özellikle bak
```

---

## 🔗 Kaynaklar

- [robots.txt — Google Dokümantasyonu](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [OWASP — Sensitive Data Exposure](https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure)
- [MDN — Directory Listings](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Apache_Configuration_htaccess)

---

**Önceki konu:** [02_http_protokolu.md](./02_http_protokolu.md)
**Sonraki konu:** [04_cookie_manipulasyonu.md](./04_cookie_manipulasyonu.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
