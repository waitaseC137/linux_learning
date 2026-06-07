# 🌐 Web Güvenliği — XOR Şifreleme & Known-Plaintext Attack

> XOR'un güzel bir özelliği var: A XOR B = C ise, C XOR A = B.
> Yani hem şifrelemek hem çözmek için aynı işlemi yaparsın.
> Ve eğer plaintext'i biliyorsan, anahtarı da bulabilirsin.

---

## 📋 İçindekiler

- [XOR Nedir?](#xor-nedir)
- [XOR ile Şifreleme](#xor-ile-şifreleme)
- [XOR'un Kritik Özelliği](#xorun-kritik-özelliği)
- [Known-Plaintext Attack](#known-plaintext-attack)
- [Anahtar Tekrarı Zafiyeti](#anahtar-tekrarı-zafiyeti)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## XOR Nedir?

**XOR (Exclusive OR)**, iki bit üzerinde çalışan mantıksal bir operatördür.

| A | B | A XOR B |
|---|---|---------|
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

Kural: **İkisi aynıysa 0, farklıysa 1.**

### Karakterler Üzerinde XOR

Karakterlere XOR uygulandığında, karakterlerin ASCII değerleri (sayısal karşılıkları) üzerinde bit bit işlem yapılır.

```
'A' = 65  = 01000001
'n' = 110 = 01101110
      XOR = 00101111 = 47 = '/'

Yani: 'A' XOR 'n' = '/'
```

PHP'de XOR operatörü `^` karakteridir:

```php
$a = "A";
$b = "n";
echo $a ^ $b;   // '/'

// Sayısal:
echo 65 ^ 110;  // 47
```

---

## XOR ile Şifreleme

Bir metni XOR ile "şifrelemek" için her karakteri bir anahtar karakteriyle XOR'layarsın.

```php
function xor_encrypt($text, $key) {
    $result = "";
    for ($i = 0; $i < strlen($text); $i++) {
        $result .= $text[$i] ^ $key[$i % strlen($key)];
    }
    return $result;
}
```

`$i % strlen($key)` → Anahtar metinden kısa olabilir, bu yüzden döngüsel olarak tekrarlanır.

### Örnek

```
Plaintext:  "HELLO"
Key:        "KEY"  (tekrarlanır: "KEYKE")

H XOR K = ?
E XOR E = ?
L XOR Y = ?
L XOR K = ?
O XOR E = ?
```

```python
plaintext = "HELLO"
key       = "KEY"
result    = ""

for i, c in enumerate(plaintext):
    result += chr(ord(c) ^ ord(key[i % len(key)]))

print(result)  # şifreli metin
```

---

## XOR'un Kritik Özelliği

XOR'un en önemli matematiksel özelliği:

```
A XOR B = C
C XOR A = B    ← şifreyi çözmek
C XOR B = A    ← anahtarı bulmak
```

**Yani:**

```
Plaintext  XOR Key = Ciphertext   (şifreleme)
Ciphertext XOR Key = Plaintext    (çözme)
Ciphertext XOR Plaintext = Key    (anahtar bulma!)
```

Bu özellik, **Known-Plaintext Attack**'in temelidir.

### Aynı Şey İkiden Fazla Değer İçin

```
A XOR A = 0          ← Bir şeyi kendisiyle XOR'larsan 0 çıkar
A XOR 0 = A          ← Bir şeyi 0 ile XOR'larsan kendisi çıkar
(A XOR B) XOR B = A  ← İki kez aynı şeyle XOR → orijinal
```

---

## Known-Plaintext Attack

Eğer **hem plaintext'i hem de ciphertext'i biliyorsan**, ikisini XOR'layarak anahtarı bulabilirsin.

```
Ciphertext XOR Plaintext = Key
```

### Ne Zaman Mümkün?

Web uygulamalarında bu durum şu şekilde oluşur:

1. Sunucu bir veriyi XOR ile şifreleyip cookie olarak gönderiyor
2. Şifreli cookie'yi görüyoruz (ciphertext)
3. Cookie'nin içeriğini tahmin edebiliyoruz (plaintext)

```
Cookie içeriği (plaintext tahmini):
  {"showpassword":"no","bgcolor":"#ffffff"}

Cookie değeri (ciphertext — Base64 decode edilmiş):
  [binary veri]

XOR'la → Anahtar
```

---

## Anahtar Tekrarı Zafiyeti

Kısa bir anahtar uzun bir metni şifrelemek için tekrarlandığında, kriptanaliz mümkün hale gelir.

```
Plaintext:   AAABBBCCC
Key:         KEYKEYKEYKEY  ← KEY tekrarlanıyor

Aynı anahtar bloğu farklı plaintext bloklarını şifreler
→ Desenleri analiz ederek anahtar uzunluğu ve değeri bulunabilir
```

Natas 11'de anahtar 1-4 karakter arasında — ve biz plaintext'i zaten biliyoruz.

---

## Natas'ta Kullanım

### Natas 11 — XOR Cookie Kırma

**Kaynak kod (özet):**

```php
<?php
$defaultdata = array("showpassword"=>"no", "bgcolor"=>"#ffffff");

function xor_encrypt($in) {
    $key = '<benim_gizli_anahtarim>';   // ← bunu bulmamız lazım
    $text = $in;
    $outText = '';
    $i = 0;
    do {
        $outText .= $text[$i] ^ $key[$i % strlen($key)];
        $i++;
    } while ($i < strlen($text));
    return $outText;
}

function loadData($def) {
    $mydata = $def;
    if(array_key_exists("data", $_COOKIE)) {
        $str = base64_decode(urldecode($_COOKIE['data']));
        $arr = json_decode(xor_encrypt($str), true);
        if(is_array($arr) && array_key_exists("showpassword", $arr)
           && array_key_exists("bgcolor", $arr)) {
            $mydata['showpassword'] = $arr['showpassword'];
            $mydata['bgcolor']      = $arr['bgcolor'];
        }
    }
    return $mydata;
}

function saveData($d) {
    setcookie("data", base64_encode(xor_encrypt(json_encode($d))));
}
?>
```

**Akış:**

```
Kaydetme:  PHP array → json_encode → xor_encrypt → base64_encode → cookie
Okuma:     cookie → base64_decode → xor_encrypt → json_decode → PHP array
```

`showpassword` değerini `"yes"` yapmak için anahtarı bulup yeni bir cookie üretmemiz gerekiyor.

---

### Adım 1: Plaintext ve Ciphertext'i Bul

**Ciphertext:** Sayfayı ziyaret et, tarayıcıdan `data` cookie'sini kopyala, Base64 decode et.

```python
import base64

# Sayfadan alınan cookie değeri
cookie = "HmYkBwozJw4WNyAAFyB1VUcqOE1JZjUIBis7ABdmbU1GIjEJAyIxTRg="
ciphertext = base64.b64decode(cookie)
```

**Plaintext:** Kaynak koddan biliyoruz — `$defaultdata` değeri:

```python
import json
plaintext = json.encode({"showpassword": "no", "bgcolor": "#ffffff"})
# '{"showpassword":"no","bgcolor":"#ffffff"}'
```

---

### Adım 2: Anahtarı Bul

```python
# Ciphertext XOR Plaintext = Key
key = ""
for i in range(len(plaintext)):
    key += chr(ciphertext[i] ^ ord(plaintext[i]))

print(key)
# qw8Jqw8Jqw8Jqw8Jqw8Jqw8Jqw8Jqw8Jqw8Jqw8J
# Tekrar eden desen → gerçek anahtar: "qw8J"
```

Anahtar tekrarlandığı için çıktıda desen görürsün. Tekrarlayan kısmı ayır → gerçek anahtar.

---

### Adım 3: Yeni Cookie Üret

Artık anahtarı biliyorsun. `showpassword` değerini `"yes"` yapıp yeni cookie üret:

```python
import base64, json

def xor_encrypt(text, key):
    result = ""
    for i, c in enumerate(text):
        result += chr(ord(c) ^ ord(key[i % len(key)]))
    return result

key = "qw8J"
new_data = {"showpassword": "yes", "bgcolor": "#ffffff"}
plaintext = json.dumps(new_data, separators=(',', ':'))

encrypted = xor_encrypt(plaintext, key)
new_cookie = base64.b64encode(encrypted.encode('latin-1')).decode()
print(new_cookie)
```

---

### Adım 4: Cookie'yi Değiştir ve Gönder

**curl ile:**

```bash
curl -u natas11:[şifre] \
     -b "data=[YENİ_COOKIE_DEĞERİ]" \
     http://natas11.natas.labs.overthewire.org/
```

**Tarayıcıda:** DevTools → Application → Cookies → `data` değerini değiştir → sayfayı yenile.

---

### Özet: XOR Cookie Kırma Akışı

```
1. Cookie'yi al → Base64 decode → Ciphertext
2. Plaintext'i tahmin et (kaynak koddan $defaultdata)
3. Ciphertext XOR Plaintext = Key (tekrarlayan deseni bul)
4. Yeni payload oluştur (showpassword: yes)
5. Payload → json_encode → XOR(key) → Base64 encode → Yeni cookie
6. Cookie'yi değiştir → Şifreyi al
```

---

## 🔗 Kaynaklar

- [XOR cipher — Wikipedia](https://en.wikipedia.org/wiki/XOR_cipher)
- [PortSwigger — Symmetric Encryption](https://portswigger.net/web-security/jwt/algorithm-confusion)
- [CyberChef — XOR](https://gchq.github.io/CyberChef/#recipe=XOR)

---

**Önceki konu:** [08_lfi_ve_path_traversal.md](./08_lfi_ve_path_traversal.md)
**Sonraki konu:** [10_dosya_yukleme_bypass.md](./10_dosya_yukleme_bypass.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
