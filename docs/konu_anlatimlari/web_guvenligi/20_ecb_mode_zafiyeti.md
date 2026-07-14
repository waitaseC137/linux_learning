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

### Natas 28 — ECB Oracle ile Şifre Sızıntısı

**Senaryo:** Uygulama arama sorgusunu AES-ECB ile şifreleyip URL'de taşıyor.

**Kaynak kod özeti:**

```php
function encrypt($text) {
    $key = "<gizli_anahtar>";
    // PKCS#7 padding + AES-128-ECB şifreleme
    return base64_encode(openssl_encrypt(
        $text . $SECRET,    // ← secret sorgunun sonuna ekleniyor!
        'AES-128-ECB',
        $key,
        OPENSSL_RAW_DATA
    ));
}
```

Şifreli query: `encrypt("SELECT ... WHERE search='[kullanıcı_girdisi]'" + SECRET)`

**Exploit Yaklaşımı:**

```
Blok boyutu: 16 byte
Prefix: "SELECT * FROM ur" (16 byte) → Blok 1
        "ecords WHERE sea" (16 byte) → Blok 2
        "rch='"           (5 byte)  → Blok 3 başlangıcı

Kullanıcı girdisi Blok 3'ten devam eder.
```

Secret'ın ilk karakterini bulmak için:

1. 11 'A' gönder → prefix + 11 A + secret[0] = 16 byte → Blok 3 tamam
2. 11 'A' + chr(X) gönder → X dene, Blok 3 aynıysa → secret[0] = X

```python
import requests, base64

url      = "http://natas28.natas.labs.overthewire.org/"
username = "natas28"
password = "[natas28_şifresi]"

def encrypt(query):
    r = requests.get(
        url + "search.php",
        params={"query": query},
        auth=(username, password),
        allow_redirects=False
    )
    # Location header'dan şifreli query'yi al
    loc = r.headers.get("Location", "")
    query_param = loc.split("query=")[1]
    return base64.b64decode(requests.utils.unquote(query_param))

# Blok boyutunu bul
def find_block_size():
    base = len(encrypt("A"))
    for i in range(1, 33):
        new = len(encrypt("A" * i))
        if new > base:
            return new - base
    return None

block_size = find_block_size()  # 16
print(f"Blok boyutu: {block_size}")

# Secret'ı byte byte çıkar
secret = ""
for i in range(32):
    pad_len = block_size - (len("rch='") + len(secret)) % block_size - 1
    reference = encrypt("A" * pad_len)
    ref_blocks = len(encrypt("A" * pad_len + "A")) // block_size

    for byte in range(256):
        guess = "A" * pad_len + secret + chr(byte)
        ct = encrypt(guess)
        # Blok karşılaştırması — basitleştirilmiş
        if ct[:ref_blocks * block_size] == reference[:ref_blocks * block_size]:
            secret += chr(byte)
            print(f"[+] Secret[{i}]: {chr(byte)} | {secret}")
            break

print(f"Secret: {secret}")
```

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
