# 🌐 Web Güvenliği — HTML Kaynak Kodu & Developer Tools

> Bir web sayfasında gördüğün şey ile sunucunun gönderdiği şey her zaman aynı değildir.
> Kaynak kodunu okumak, web güvenliğinin en temel becerisidir.

---

## 📋 İçindekiler

- [HTML Nedir?](#html-nedir)
- [Kaynak Kodu Görüntüleme](#kaynak-kodu-görüntüleme)
- [Browser Developer Tools](#browser-developer-tools)
- [Gizli Bilgiler Nerede Saklanır?](#gizli-bilgiler-nerede-saklanır)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## HTML Nedir?

**HTML (HyperText Markup Language)**, tarayıcının sayfayı nasıl göstereceğini tarif eden bir işaretleme dilidir. Sunucu HTML metnini gönderir, tarayıcı bunu render ederek (görsel hale getirerek) kullanıcıya gösterir.

```
Sunucu                          Tarayıcı
  |  ----[ HTML metni ]---->  |
  |                           |  render eder
  |                           |  kullanıcı görseli görür
```

Önemli nokta: **render edilen görsel ≠ kaynak kod**. Tarayıcı bazı şeyleri gizleyebilir, bazı elementleri CSS ile görünmez yapabilir — ama bunlar kaynak kodda hâlâ durur.

---

## Kaynak Kodu Görüntüleme

### Yöntem 1: Klavye Kısayolu

| Tarayıcı | Kısayol |
|----------|---------|
| Chrome / Edge / Firefox | `Ctrl + U` (Windows/Linux) |
| Chrome / Edge / Firefox | `Cmd + Option + U` (Mac) |

Bu kısayol yeni bir sekme açar ve sayfanın ham HTML kodunu gösterir.

### Yöntem 2: URL'ye `view-source:` ekle

Adres çubuğuna şunu yaz:

```
view-source:http://natas0.natas.labs.overthewire.org
```

### Yöntem 3: Sağ Tık → "Sayfa Kaynağını Görüntüle"

Natas 1'de sağ tık **devre dışı bırakılmıştır** — bu yüzden yukarıdaki yöntemleri bilmek kritiktir.

### Yöntem 4: curl ile terminal üzerinden

```bash
curl -u natas0:natas0 http://natas0.natas.labs.overthewire.org
```

`-u kullanici:sifre` → HTTP Basic Authentication için kullanılır.

---

## Browser Developer Tools

**F12** veya `Ctrl + Shift + I` ile açılır. Web güvenliğinde en çok kullanacağın sekmeler:

### Elements (Inspector) Sekmesi

Sayfanın canlı DOM yapısını gösterir. HTML kaynak kodundan farkı: JavaScript tarafından sonradan değiştirilen elementleri de gösterir.

```
Kaynak Kodu  → sunucunun gönderdiği orijinal HTML
Elements     → JavaScript çalıştıktan sonraki güncel DOM
```

Gizli elementleri bulmak için: `Ctrl + F` ile arama yap.

```html
<!-- CSS ile gizlenmiş ama DOM'da var -->
<p style="display:none;">Gizli metin burada!</p>

<!-- type="hidden" input alanı — formda görünmez ama gönderilir -->
<input type="hidden" name="debug" value="true">
```

### Network Sekmesi

Her HTTP isteği ve cevabını gösterir:

- **Headers** → Request ve response header'ları (Cookie, Set-Cookie, Referer vs.)
- **Response** → Sunucunun döndürdüğü ham içerik
- **Preview** → Render edilmiş hali

Sayfayı yeniledikten sonra istekleri filtrele:

```
Filtre: Doc    → sadece HTML sayfalarını göster
Filtre: XHR    → AJAX isteklerini göster
Filtre: JS     → JavaScript dosyalarını göster
```

### Console Sekmesi

JavaScript çalıştırmak için:

```javascript
// Sayfadaki tüm hidden input'ları bul
document.querySelectorAll('input[type="hidden"]')

// Cookie'leri oku
document.cookie

// Belirli bir elementi bul
document.getElementById('secretDiv').innerText
```

### Storage Sekmesi (Application → Storage)

- **Cookies** → Cookie'leri görüntüle ve düzenle
- **Local Storage / Session Storage** → Tarayıcıda saklanan veri

---

## Gizli Bilgiler Nerede Saklanır?

Web geliştiriciler bazen hassas bilgileri yanlış yerlere koyarlar. Kaynak kodda aranacak yerler:

### 1. HTML Yorumları

```html
<!-- Şifre: abc123 -->
<!-- TODO: bu debug kodunu production'a almayı unutma -->
<!-- Yedek giriş: admin / geçici123 -->
```

Yorumlar tarayıcıda görünmez ama kaynak kodda okunabilir.

### 2. Hidden Input Alanları

```html
<form action="/login">
    <input type="text" name="username">
    <input type="password" name="password">
    <input type="hidden" name="isAdmin" value="false">   <!-- buraya dikkat -->
</form>
```

`type="hidden"` alanlar kullanıcıya gösterilmez ama form gönderildiğinde sunucuya iletilir — ve değiştirilebilir.

### 3. JavaScript Dosyaları

```html
<script src="/js/config.js"></script>
```

```javascript
// config.js içinde
const API_KEY = "sk-abc123...";
const SECRET_ENDPOINT = "/admin/debug";
const DEFAULT_PASSWORD = "changeme123";
```

### 4. CSS ile Gizlenmiş Elementler

```html
<div style="display:none; visibility:hidden; opacity:0;">
    Gizli içerik
</div>
```

CSS gizleme güvenlik önlemi değildir — kaynak kodda hâlâ görünür.

### 5. Include Edilen Dosyalar

PHP'de `include 'secret.php'` ile dahil edilen dosyanın içeriği HTML'e gömülmüş olabilir.

---

## Natas'ta Kullanım

### Natas 0 — Temel Kaynak Kodu

**Senaryo:** Sayfa "şifre bu sayfada" diyor ama görünmüyor.

```bash
# Yöntem 1: tarayıcıda Ctrl+U
# Yöntem 2: curl ile
curl -u natas0:natas0 http://natas0.natas.labs.overthewire.org
```

Kaynak kodda HTML yorumu içinde şifre gizlidir:

```html
<!--The password for natas1 is [REDACTED] -->
```

**Öğrenilen:** Yorumlar tarayıcıda gizlenir, kaynak kodda açıktır.

---

### Natas 1 — Sağ Tık Engellenmiş

**Senaryo:** JavaScript ile sağ tık devre dışı bırakılmış.

```javascript
// Kaynak kodda böyle bir şey göreceksin:
document.oncontextmenu = function() { return false; }
```

**Çözüm:** Sağ tık çalışmasa da `Ctrl + U` çalışır.

```bash
# Ya da curl:
curl -u natas1:[şifre] http://natas1.natas.labs.overthewire.org
```

**Öğrenilen:** Client-side (tarayıcı taraflı) kısıtlamalar gerçek güvenlik sağlamaz. `Ctrl + U` veya curl ile kolayca aşılır.

---

### İpuçları

```
✓ Her zaman Ctrl+U ile kaynağa bak
✓ HTML yorumlarını (<!-- -->) ara
✓ <input type="hidden"> alanlarına dikkat et
✓ Sayfaya gömülü <script> bloklarını oku
✓ Sağ tık çalışmıyorsa Ctrl+U veya curl kullan
✓ DevTools → Network sekmesinde response header'larına bak
```

---

## 🔗 Kaynaklar

- [MDN — HTML'e Giriş](https://developer.mozilla.org/tr/docs/Learn/HTML/Introduction_to_HTML)
- [MDN — Tarayıcı DevTools](https://developer.mozilla.org/en-US/docs/Tools)
- [PortSwigger — Web Güvenliğine Giriş](https://portswigger.net/web-security/getting-started)

---

**Sonraki konu:** [02_http_protokolu.md](./02_http_protokolu.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
