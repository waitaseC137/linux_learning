# 🌐 Web Güvenliği — ECB (Electronic Code Book) Mode Zafiyeti

> ECB modunda aynı plaintext bloğu her zaman aynı ciphertext bloğunu üretir.
> Bu deterministik yapı, blokları kesip yapıştırmana izin verir.

---

## 📋 İçindekiler

- [Block Cipher Nedir?](#block-cipher-nedir)
- [ECB Mode](#ecb-mode)
- [ECB'nin Zafiyeti](#ecbnin-zafiyeti)
- [ECB Oracle Saldırısı](#ecb-oracle-saldırısı)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## Block Cipher Nedir?

Block cipher, veriyi sabit boyutlu bloklara bölerek şifreleyen bir algoritmadır. AES için blok boyutu **16 byte**'tır.

```
Plaintext:  "HELLO WORLD 1234"  (16 byte = 1 blok)
            ↓ AES şifreleme
Ciphertext: [16 byte şifreli veri]
```

16 byte'tan uzun veri birden fazla blokta işlenir. Bu blokların nasıl işleneceğini **mod** belirler.

---

## ECB Mode

**ECB (Electronic Code Book)**, her bloğu **bağımsız olarak** şifreler.

```
Plaintext Blok 1 → [AES + Key] → Ciphertext Blok 1
Plaintext Blok 2 → [AES + Key] → Ciphertext Blok 2
Plaintext Blok 3 → [AES + Key] → Ciphertext Blok 3
```

Her blok diğerlerinden bağımsız → önceki bloğun çıktısı sonrakini etkilemez.

### CBC ile Karşılaştırma

**CBC (Cipher Block Chaining)** her bloğu bir öncekiyle XOR'lar:

```
ECB: Blok1 → Şifrele → C1
     Blok2 → Şifrele → C2

CBC: Blok1 XOR IV → Şifrele → C1
     Blok2 XOR C1 → Şifrele → C2
```

CBC'de aynı plaintext bloğu farklı ciphertext üretir (önceki bloğa bağlı). ECB'de **her zaman aynı ciphertext** üretir.

---

## ECB'nin Zafiyeti

### 1. Aynı Plaintext = Aynı Ciphertext

```
"admin00000000000" → Şifrele → [BLOK_A]
"admin00000000000" → Şifrele → [BLOK_A]   ← aynı!
```

Bu, şifreli veride desenlerin görünmesine yol açar. Klasik örnek: ECB ile şifrelenmiş bir görüntünün yapısı şifreli halde bile seçilebilir.

### 2. Blok Kesme-Yapıştırma (Cut-and-Paste)

Ciphertext blokları yeniden sıralanabilir veya değiştirilebilir:

```
Blok 1: "username=admin00" → C1
Blok 2: "&role=user000000" → C2
Birleşik: C1 + C2 → "username=admin&role=user"

Manipülasyon: Farklı bir C2 hazırla:
"&role=admin00000" → C2'
C1 + C2' → "username=admin&role=admin"
```

---

## ECB Oracle Saldırısı

Bir "ECB oracle" şu anlama gelir: kullanıcı girdisini alıp ECB ile şifreleyerek döndüren bir endpoint.

### Byte-at-a-Time Decryption

Hedef: Sunucu tarafında bilinen bir secret'ı byte byte çıkarmak.

```
Sunucu: encrypt(input + secret)
```

**Fikir:**

Girdi uzunluğunu ayarlayarak secret'ın ilk byte'ını blok sınırına getir, sonra tüm olası byte değerlerini dene.

```
Blok boyutu: 16 byte
Secret: "???????????????" (bilinmiyor)

Girdi: "AAAAAAAAAAAAAAAA" (16 A)
Şifreli: [Blok1: 16xA] [Blok2: secret[0..15]]

Girdi: "AAAAAAAAAAAAAAA" (15 A)
Şifreli: [Blok1: 15xA + secret[0]] [Blok2: ...]

Şimdi kaba kuvvet:
Girdi: "AAAAAAAAAAAAAAA" + chr(X) → X=0..255 dene
Hangisi Blok1'i aynı üretirse → secret[0] = chr(X)
```

---

## Natas'ta Kullanım

### Natas 28 — ECB Blok Cut-and-Paste ile SQL Injection

> ⚠️ Bu seviye "secret'ı byte byte sızdıran bir oracle" **DEĞİLDİR.** Zafiyet, ECB'nin **blok bağımsızlığını** kullanıp şifreli metnin bloklarını yeniden dizerek (cut-and-paste) SQL injection yapmaktır; sızdırılan şey DB'deki natas29 şifresidir.

**Senaryo:** Arama kutusuna girdiğin metin `mysql_real_escape_string` ile kaçışlanır, bir SQL sorgu şablonuna gömülür, sonra **tüm sorgu** AES-128-ECB (orijinalinde mcrypt Rijndael-128) ile şifrelenip base64 olarak URL'deki `query` parametresinde taşınır.

**Kaynak kod özeti:**

```php
// kullanıcı girdisi ESCAPE edilip sorguya gömülüyor, sonra TÜM sorgu ECB ile şifreleniyor
$input      = mysql_real_escape_string($_REQUEST["query"]);
$query      = "SELECT joke FROM jokes WHERE joke LIKE '%$input%'";
$ciphertext = base64_encode( ecb_encrypt($query) );   // AES-128-ECB → URL'de ?query=...
```

Yani şifrelenen şey "girdi + SECRET" değil, **kaçışlanmış girdini içeren SQL sorgusunun tamamı.**

**Exploit Yaklaşımı — ECB blok harmanı:**

Girdi düz metinde escape edilse de, sen **ciphertext'i blok düzeyinde** kontrol edebilirsin. ECB'de aynı 16-byte plaintext bloğu hep aynı ciphertext bloğunu verir ve bloklar birbirinden bağımsızdır.

1. **Sabit önek uzunluğunu bul:** girdiye 1'er byte ekleyip ciphertext'in ne zaman bir blok (16 byte) büyüdüğünü gözle → şablonun senin girdine kadarki kısmının uzunluğunu verir.
2. **Enjeksiyonu blok sınırına hizala:** dolgu ekleyerek zararlı SQL parçanın (`' UNION SELECT password FROM users -- `) tam bir blok sınırında başlamasını sağla.
3. **Kaçışı blok düzeyinde etkisiz kıl:** `mysql_real_escape_string` tek tırnağı `\'` yapar. Girdiyi, kaçış karakteri (`\`) bir bloğun *sonunda*, işine yarayan baytlar *sonraki* blokta kalacak şekilde hizalarsın; sonra istemediğin blokları **kesip**, farklı isteklerden topladığın "temiz" blokları yerlerine **yapıştırırsın**.
4. **Blokları yeniden diz:** ihtiyacın olan ciphertext bloklarını birleştirip yeni `query` base64'ünü kurar, isteği o değerle atarsın → sunucu deşifre eder, artık kaçışsız `UNION SELECT` içeren sorguyu çalıştırır → natas29 şifresi cevapta döner.

> 💡 Anahtar fikir: ECB'de her 16-byte blok bağımsız bir **yapı taşıdır.** Anahtarı bilmesen bile, senin kontrol ettiğin plaintext'lere karşılık gelen ciphertext bloklarını harmanlayarak sunucunun deşifre edip çalıştıracağı sorguyu yeniden inşa edebilirsin. Bu yüzden bu bir **block cut-and-paste** saldırısıdır — byte-at-a-time oracle değil.

---

### ECB Zafiyeti — Kontrol Listesi

```
Tespit:
  ☐ Uygulama şifreli blob içeriyor mu? (cookie, URL param)
  ☐ Farklı uzunluklarda girdi ile şifreli çıktı boyutu değişiyor mu?
  ☐ Blok boyutu 16 byte'ın katı mı?
  ☐ Aynı girdi her zaman aynı çıktıyı mı veriyor? (ECB = deterministik)

Exploit:
  ☐ Blok boyutunu hesapla (girdi uzunluğu artırıp çıktı boyutunu gözlemle)
  ☐ ECB mi CBC mi? (aynı plaintext → aynı ciphertext = ECB)
  ☐ Byte-at-a-time oracle kur
  ☐ Her byte için 256 deneme
```

---

## 🔗 Kaynaklar

- [PortSwigger — ECB Mode](https://portswigger.net/web-security/jwt)
- [Cryptopals — ECB Detection](https://cryptopals.com/sets/1/challenges/8)
- [Wikipedia — Block Cipher Modes](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation)

---

**Önceki konu:** [19_sql_truncation.md](./19_sql_truncation.md)
**Sonraki konu:** [21_perl_rce.md](./21_perl_rce.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
