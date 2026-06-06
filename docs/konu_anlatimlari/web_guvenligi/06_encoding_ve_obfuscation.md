# 🌐 Web Güvenliği — Encoding & Obfuscation

> Encoding, veriyi farklı bir formata dönüştürmektir — şifreleme değil.
> Encode edilmiş veri her zaman geri döndürülebilir, anahtar gerekmez.

---

## 📋 İçindekiler

- [Encoding vs Şifreleme vs Hashing](#encoding-vs-şifreleme-vs-hashing)
- [Base64](#base64)
- [Hex (Hexadecimal)](#hex-hexadecimal)
- [URL Encoding](#url-encoding)
- [HTML Encoding](#html-encoding)
- [Zincirleme Encoding](#zincirleme-encoding)
- [CyberChef Kullanımı](#cyberchef-kullanımı)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## Encoding vs Şifreleme vs Hashing

Üç kavram sıkça karıştırılır:

| Özellik | Encoding | Şifreleme | Hashing |
|---------|----------|-----------|---------|
| Amaç | Format dönüşümü | Gizlilik | Bütünlük doğrulama |
| Geri alınabilir mi? | ✓ Evet (anahtar gerekmez) | ✓ Evet (anahtar gerekir) | ✗ Hayır (tek yön) |
| Örnek | Base64, Hex, URL | AES, RSA, XOR | MD5, SHA1, SHA256 |
| Güvenlik sağlar mı? | ✗ Hayır | ✓ Evet (doğru kullanılırsa) | ✓ Evet (doğru kullanılırsa) |

> ⚠️ **Kritik:** Base64 **şifreleme değildir**. Encode edilmiş her şey kolayca decode edilir. "Base64 ile şifreledim" ifadesi yanlıştır.

---

## Base64

Binary veriyi, sadece ASCII karakterlerden oluşan bir formata dönüştürür. 64 karakterlik alfabe kullanır: `A-Z`, `a-z`, `0-9`, `+`, `/` ve `=` (padding).

### Neden Kullanılır?

- Binary veriyi metin tabanlı protokollerle (HTTP, email) taşımak için
- Cookie veya URL'de binary veri göndermek için
- **Güvenlik için değil** — sadece format uyumluluğu için

### Tanıma

```
eyJ1c2VybmFtZSI6ImFkbWluIn0=
^                            ^
Base64 karakterler           = veya == padding (uzunluğa göre)
```

Base64 değerler genellikle `=` ile biter (0, 1 veya 2 adet). Uzunluğu her zaman 4'ün katıdır.

### Encode / Decode

**Terminal:**

```bash
# Encode
echo -n "natas" | base64
# bmF0YXM=

# Decode
echo "bmF0YXM=" | base64 -d
# natas

# Dosyadan decode
base64 -d encoded.txt
```

**Python:**

```python
import base64

# Encode
encoded = base64.b64encode(b"natas").decode()
print(encoded)  # bmF0YXM=

# Decode
decoded = base64.b64decode("bmF0YXM=").decode()
print(decoded)  # natas
```

**JavaScript (Tarayıcı Console):**

```javascript
// Encode
btoa("natas")           // "bmF0YXM="

// Decode
atob("bmF0YXM=")        // "natas"

// Cookie değerini hızlıca decode et
atob(document.cookie.split("data=")[1])
```

---

## Hex (Hexadecimal)

Her byte'ı 2 hex karakterle temsil eder. `0-9` ve `a-f` karakterlerini kullanır.

### Tanıma

```
6e617461 73          ← sadece 0-9 ve a-f karakterleri
        ^
        her 2 karakter = 1 byte
```

### Encode / Decode

**Terminal:**

```bash
# String → Hex
echo -n "natas" | xxd -p
# 6e61746173

# Hex → String
echo "6e61746173" | xxd -r -p
# natas

# Hex dump (byte byte göster)
echo -n "natas" | xxd
# 00000000: 6e61 7461 73                             natas
```

**Python:**

```python
# String → Hex
"natas".encode().hex()           # "6e61746173"

# Hex → String
bytes.fromhex("6e61746173").decode()   # "natas"
```

---

## URL Encoding

URL'de özel anlam taşıyan karakterleri `%XX` formatında kodlar. XX, karakterin hex değeridir.

### Neden Önemli?

URL'de `?`, `&`, `=`, `/`, boşluk gibi karakterler özel anlam taşır. Bu karakterleri parametre değeri olarak göndermek istersen encode etmen gerekir.

```
Boşluk  →  %20  veya  +
/       →  %2F
&       →  %26
=       →  %3D
?       →  %3F
#       →  %23
<       →  %3C
>       →  %3E
'       →  %27
"       →  %22
```

### Güvenlik Önemi

URL encoding, filtre bypass için kullanılabilir:

```bash
# / karakteri filtreleniyorsa
/etc/passwd      →   %2Fetc%2Fpasswd

# Çift encoding (bazı filtreleri atlatmak için)
%2F  →  %252F    (% → %25 olarak encode edilir)
```

**Terminal:**

```bash
# Python ile URL encode
python3 -c "import urllib.parse; print(urllib.parse.quote('/etc/passwd'))"
# %2Fetc%2Fpasswd

# curl otomatik encode eder
curl "http://example.com/page?param=özel karakter"
```

---

## HTML Encoding

HTML'de özel anlam taşıyan karakterleri entity formatında kodlar.

```
<   →   &lt;
>   →   &gt;
&   →   &amp;
"   →   &quot;
'   →   &#x27;
```

### Güvenlik Önemi

HTML encoding, XSS (Cross-Site Scripting) saldırılarına karşı kullanılır. Kullanıcı girdisi `<script>` içeriyorsa, encode edildikten sonra tarayıcı bunu kod olarak değil metin olarak gösterir.

```
Girdi:   <script>alert(1)</script>
Encode:  &lt;script&gt;alert(1)&lt;/script&gt;
Tarayıcı: Kodu çalıştırmaz, düz metin gösterir
```

---

## Zincirleme Encoding

Natas'ta sık karşılaşılan durum: birden fazla encoding birleştirilmiş. Tersini almak için **ters sırayla** uygula.

```
Orijinal → [base64] → [strrev] → [hex] → Sonuç

Tersine:
Sonuç → [hex decode] → [strrev] → [base64 decode] → Orijinal
```

### Adım Adım Çözme

```
Elimizdeki: "3d3d516343746d4d6d6c315669563362"

1. hex decode  → "==QcCtmMml1ViV3b"  (hex karakterleri → binary)
2. strrev      → "b3ViV1lmMmtCcQ=="  (string tersine)
3. base64 dec  → oubWYf2kBq          (sonuç)
```

**Python ile:**

```python
import base64

encoded = "3d3d516343746d4d6d6c315669563362"

step1 = bytes.fromhex(encoded)          # hex → bytes
step2 = step1[::-1]                     # strrev (ters çevir)
step3 = base64.b64decode(step2)         # base64 decode
print(step3.decode())                   # oubWYf2kBq
```

### CyberChef ile

1. `From Hex` — hex'ten binary'e
2. `Reverse` — string tersine
3. `From Base64` — base64 decode

---

## CyberChef Kullanımı

[CyberChef](https://gchq.github.io/CyberChef/) encoding/decoding için en kullanışlı web aracıdır.

### Temel Kullanım

1. Sol panelden işlemleri sürükle
2. Input kutusuna encode edilmiş veriyi yapıştır
3. Output'ta sonucu gör

### Natas için Sık Kullanılan Operasyonlar

```
From Base64         → Base64 decode
To Base64           → Base64 encode
From Hex            → Hex decode
To Hex              → Hex encode
URL Decode          → URL encoding decode
Reverse             → String tersine çevir
XOR                 → XOR işlemi (Natas 11 için)
Magic               → Otomatik format algıla ve decode et
```

### Magic İşlemi

Ne tür encoding yapıldığını bilmiyorsan, **Magic** operasyonunu kullan. CyberChef veriyi analiz edip olası encoding'leri dener ve en mantıklı sonucu gösterir.

---

## Natas'ta Kullanım

### Natas 8 — Tersine Encoding

**Senaryo:** PHP kodu şu şekilde encode ediyor:

```php
function encodeSecret($secret) {
    return bin2hex(strrev(base64_encode($secret)));
}
// Hedef değer: "3d3d516343746d4d6d6c315669563362"
```

**Tersine al:**

```python
import base64

target = "3d3d516343746d4d6d6c315669563362"
step1 = bytes.fromhex(target)    # bin2hex'in tersi
step2 = step1[::-1]              # strrev'in tersi
step3 = base64.b64decode(step2)  # base64_encode'un tersi
print(step3.decode())            # oubWYf2kBq
```

**CyberChef ile:** `From Hex` → `Reverse` → `From Base64`

---

### Encoding Tespit Rehberi

```
Değeri görünce sor:

Sadece 0-9 ve a-f?
  ↓
  Hex olabilir → From Hex dene

= ile bitiyor veya A-Z/a-z/0-9/+/ içeriyor?
  ↓
  Base64 olabilir → From Base64 dene

%XX formatı var mı?
  ↓
  URL Encoding → URL Decode dene

&lt; &gt; &amp; gibi entity'ler?
  ↓
  HTML Encoding → HTML Entity Decode dene

Hiçbiri değil ama anlamsız görünüyor?
  ↓
  CyberChef → Magic dene
```

---

## 🔗 Kaynaklar

- [CyberChef](https://gchq.github.io/CyberChef/) — encoding/decoding İsviçre çakısı
- [Base64 — Wikipedia](https://en.wikipedia.org/wiki/Base64)
- [MDN — URL Encoding](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding)
- [dCode.fr](https://www.dcode.fr/) — alternatif encoding aracı

---

**Önceki konu:** [05_php_kaynak_kodu.md](./05_php_kaynak_kodu.md)
**Sonraki konu:** [07_command_injection.md](./07_command_injection.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
