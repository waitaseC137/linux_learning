# 🔐 Krypton — Kullanılan Komutlar ve Kriptografi Kavramları

> Bu dosya Krypton serisinde kullanılan araçları ve kriptografi kavramlarını açıklar.  
> `base64`, `tr` (ROT13), `ln -s`, `mktemp -d`, `chmod` gibi komutlar  
> **Bandit** ve **Leviathan** konu anlatımlarında ele alındığından burada tekrar edilmez.

---

## 📋 İçindekiler

1. [Linux Komutları](#linux-komutlari)
   - [wc -c](#wc--c--karakter-sayma)
   - [sort -nr](#sort--nr--sayisal-ters-siralama)
   - [tr -cd](#tr--cd--karakter-filtreleme)
   - [for i in {A..Z}](#for-döngüsü-ile-harf-tarama)
   - [python3 -c](#python3--c--tek-satir-python)
2. [Kriptografi Kavramları](#kriptografi-kavrami)
   - [Caesar Cipher](#caesar-cipher)
   - [Frekans Analizi](#frekans-analizi)
   - [Vigenère Cipher](#vigenère-cipher)
   - [Kasiski Sınaması](#kasiski-sinamasi)
   - [Stream Cipher ve XOR](#stream-cipher-ve-xor)
3. [Online Araçlar](#online-araçlar)

---

## Linux Komutları

### `wc -c` — Karakter Sayma

`wc` (*word count*) komutunun temel kullanımları:

```
wc [seçenek] dosya
```

| Bayrak | Ne yapar |
|---|---|
| `-l` | Satır sayısını gösterir |
| `-w` | Kelime sayısını gösterir |
| `-c` | **Byte (karakter) sayısını gösterir** |

Krypton'da frekans analizi yaparken her harfin kaç kez geçtiğini saymak için kullanıyoruz:

```bash
# "S" harfinin found1 found2 found3 dosyalarında toplam kaç kez geçtiğini say
cat found1 found2 found3 | tr -cd 'S' | wc -c
# Çıktı: 456
```

> 💡 `wc -c` aslında byte sayar, ASCII metinlerde byte = karakter. UTF-8 çok baytlı karakterlerde fark çıkabilir.

---

### `sort -nr` — Sayısal Ters Sıralama

Bandit konu anlatımında `sort` ele alındı (alfabetik sıralama). Krypton'da ek bayraklar kullanıyoruz:

```
sort [bayraklar] dosya
```

| Bayrak | Ne yapar |
|---|---|
| `-n` | Sayısal sıralar (alfabetik değil: 9 < 10 < 100) |
| `-r` | Ters sıralar (büyükten küçüğe) |
| `-nr` | Sayısal + ters — **en büyük sayı önce gelir** |

Frekans analizinde harf sayılarını büyükten küçüğe sıralamak için kullanıyoruz:

```bash
# Her harfin sayısını üret, büyükten küçüğe sırala
for i in {A..Z}; do
    cat found1 found2 found3 | tr -cd $i | wc -c | tr -d '\n'
    printf " $i\n"
done | sort -nr

# Çıktı örneği:
# 456 S
# 340 Q
# 301 J
# ...
```

---

### `tr -cd` — Karakter Filtreleme

`tr` (*translate*) komutunu Bandit konu anlatımında gördük (ROT13 için). Krypton'da farklı bir kullanımı var:

```
tr [seçenekler] 'kaynak' 'hedef'
```

| Bayrak | Ne yapar |
|---|---|
| `-d 'karakterler'` | Belirtilen karakterleri **siler** |
| `-c 'karakterler'` | Belirtilen karakterlerin **tamamlayıcısını** alır (diğer her şey) |
| `-cd 'karakter'` | Belirtilen karakter **dışındaki her şeyi siler** |

```bash
# Sadece "A" harflerini bırak, geri kalanı sil
echo "ABCAADE" | tr -cd 'A'
# Çıktı: AAA

# Frekans analizinde kullanımı — S harfini say:
cat found1 | tr -cd 'S' | wc -c
```

Mantığı: `-c` tamamlayıcıyı alır (S hariç her şey), `-d` siler → sonuçta sadece S'ler kalır → `wc -c` ile sayılır.

---

### `for` Döngüsü ile Harf Tarama

Bash'te A'dan Z'ye kadar tüm harfleri gezmek için brace expansion kullanılır:

```bash
for i in {A..Z}; do
    # $i değişkeni her iterasyonda A, B, C, ..., Z değerini alır
    echo $i
done
```

Krypton 3. levelde bu yapıyı frekans analizi için şöyle kullandık:

```bash
for i in {A..Z}; do
    cat found1 found2 found3 | tr -cd $i | wc -c | tr -d '\n'
    printf " $i\n"
done | sort -nr
```

Satır satır açıklaması:
1. `tr -cd $i` → o harfin dışındakileri sil
2. `wc -c` → kaç tane kaldığını say (harfin frekansı)
3. `tr -d '\n'` → `wc` çıktısının sonundaki satır sonu karakterini kaldır (düzgün hizalama için)
4. `printf " $i\n"` → harfin adını ve satır sonunu ekle
5. `sort -nr` → frekansa göre büyükten küçüğe sırala

---

### `python3 -c` — Tek Satır Python

Terminalde kısa Python kodlarını dosya açmadan çalıştırmak için kullanılır:

```bash
python3 -c "print('merhaba')"

# 50 tane A üret (stream cipher level'ında)
python3 -c "print('A'*50, end='')" > test.txt
```

`end=''` parametresi `print`'in normalde eklediği `\n` (satır sonu) karakterini kaldırır — şifreleme binary'lerine saf metin göndermek için kritik.

Krypton 6. levelde XOR keystream'ini çözmek için de kullandık:

```python
cipher_flag = "PNUKLYLWRQKGKBE"
known_plain = "AAAAAAAAAAAAAAA"
known_cipher = "EICTDGYIYZKTHNS"

shifts = [ord(known_cipher[i]) - ord(known_plain[i]) for i in range(len(cipher_flag))]

flag = ""
for i in range(len(cipher_flag)):
    result = ord(cipher_flag[i]) - shifts[i]
    if result < ord('A'):
        result += 26
    flag += chr(result)

print(flag)  # LFSRISNOTRANDOM
```

---

## Kriptografi Kavramları

### Caesar Cipher

**Sezar Şifresi:** Alfabedeki her harfi sabit bir sayı kadar kaydırır. "Kaydırma miktarı" anahtardır.

```
Anahtar = 3:  A→D, B→E, C→F, ..., Z→C
Anahtar = 13: A→N, B→O, ... (ROT13)
```

**Kırma yöntemi — Bilinen Metin Saldırısı:**

Eğer şifreleme binary'sine erişilebiliyorsa, bilinen bir giriş (`AAAA`) şifrelenip çıktı gözlemlenerek anahtar hesaplanır:

```
A → M  →  M'nin sırası (13) - A'nın sırası (1) = 12  →  anahtar = 12
Çözme anahtarı = 26 - 12 = 14
```

`tr` ile uygulama — 14 pozisyon geri kaydır:
```bash
cat krypton3 | tr 'A-Za-z' 'O-ZA-No-za-n'
```

Formül: `tr 'A-Za-z' '<14.harf>-ZA-<13.harf><küçük_hali>-za-<küçük_13.harf>'`

> 💡 Caesar şifresi 26 olası anahtar içerir — brute force ile de kırılabilir.

---

### Frekans Analizi

**Prensip:** Doğal dillerde harfler eşit sıklıkta kullanılmaz. İngilizce'de:

```
En sık: E  T  A  O  I  N  S  R  H  D  L  U  C  M  F  Y  W  G  P  B  V  K  X  Q  J  Z
```

**Monoalfabetik ikame şifreleri** (her harfin tek bir harfle değiştirildiği şifreler) bu yüzden kırılabilir: şifreli metinde hangi harf en sık geçiyorsa o büyük ihtimalle `E`'dir.

**Uygulama:**

```bash
# Frekans tablosu çıkar
for i in {A..Z}; do
    cat found1 found2 found3 | tr -cd $i | wc -c | tr -d '\n'
    printf " $i\n"
done | sort -nr
```

Sonra şifreli frekans sırası ile İngilizce frekans sırası eşleştirilir:

```bash
# Şifreli: SQJUBNGCD... → İngilizce: EATSORNIHC...
cat krypton4 | tr 'SQJUBNGCDZVWMYTXKELAFIORHP' 'EATSORNIHCLDUPYFWGMBKVXQJZ'
```

> ⚠️ Frekans analizi küçük metinlerde mükemmel çalışmaz — biraz deneme-yanılma gerekebilir. [dCode.fr](https://www.dcode.fr/frequency-analysis) görsel analiz sunar.

---

### Vigenère Cipher

**Prensip:** Caesar şifresinin gelişmiş versiyonu. Tek sabit anahtar yerine bir **anahtar kelime** kullanır — her harf anahtardaki karşılık gelen harfin sırasına göre kaydırılır.

```
Metin:   A  B  C  D  E  F
Anahtar: K  E  Y  K  E  Y   (KEY tekrar eder)
          ↓  ↓  ↓  ↓  ↓  ↓
K=10   E=4  Y=24 K=10 E=4  Y=24
Şifreli: K  F  A  N  I  D
```

**Neden daha güçlü?**  
Frekans analizi doğrudan işe yaramaz — aynı harf her pozisyonda farklı şekilde şifreleniyor.

**Kırma yöntemi — Bilinen Key Uzunluğu:**

Key uzunluğu bilinirse (örneğin 6), her 6. pozisyon aynı Caesar kaydırmasıyla şifrelenmiştir. Bu durumda 6 ayrı Caesar analizi yapılır.

[dCode.fr Vigenère](https://www.dcode.fr/vigenere-cipher) → "Knowing the Key-Length" seçeneği ile otomatik çözülür.

---

### Kasiski Sınaması

**Problem:** Key uzunluğu bilinmiyorsa ne yapılır?

**Kasiski Sınaması:** Şifreli metinde tekrar eden 3+ karakterlik dizileri ve aralarındaki mesafeleri bulur.

```
Tekrar eden dizi "XYZ":
  - 1. kez: 30. pozisyon
  - 2. kez: 60. pozisyon
  - 3. kez: 90. pozisyon

Mesafeler: 30, 30 → EBOB = 30
Key uzunluğu 30'un bir böleni: 1, 2, 3, 5, 6, 10, 15, 30
```

**Neden işe yarıyor?**  
Bir dizi aynı key pozisyonuna denk geldiğinde aynı şekilde şifrelenir → aynı şifreli dizi oluşur. Mesafeler key uzunluğunun katlarıdır.

[dCode.fr](https://www.dcode.fr/vigenere-cipher) → "Automatic Decryption" seçeneği hem key uzunluğunu hem de anahtarı bulur.

---

### Stream Cipher ve XOR

**Stream Cipher (Akış Şifresi):** Her byte'ı ayrı ayrı, "sözde rastgele" bir **keystream** ile XOR'lar.

```
şifreli_byte  = düz_metin_byte  XOR keystream_byte
düz_metin_byte = şifreli_byte   XOR keystream_byte
```

**XOR'un temel özelliği:**
```
A XOR B = C
C XOR B = A   ← aynı değerle tekrar XOR'larsan orijinale dönersin
```

**Zafiyet — Tekrar Eden Keystream:**

Zayıf rastgele sayı üreteci (RNG) kullanan implementasyonlarda keystream belirli uzunlukta tekrar eder. Bu durumda:

1. Bilinen düz metin (`AAAA...`) ile binary'yi şifrele
2. Her pozisyon için: `keystream[i] = ord(known_cipher[i]) - ord('A')`
3. Hedef şifreli metni: `düz_metin[i] = (ord(cipher[i]) - keystream[i]) % 26 + ord('A')`

```bash
# Keystream'i keşfet: 50 A şifrele
python3 -c "print('A'*50, end='')" > test.txt
/krypton/krypton6/encrypt6 test.txt output.txt
cat output.txt
# EICTDGYIYZKTHNSIRFXYCPFUEOCKRNEICTDGYIYZKTHNSIRFXY
#              ^30 karakterde tekrar ediyor → keystream uzunluğu 30
```

> 💡 Güvenli stream cipher'lar (AES-CTR, ChaCha20) kriptografik açıdan güvenli RNG kullanır — keystream asla tekrar etmez.

---

## Online Araçlar

Krypton serisinde komut satırının yanı sıra online araçlar da kullanılıyor:

| Araç | URL | Ne için |
|---|---|---|
| **CyberChef** | [gchq.github.io/CyberChef](https://gchq.github.io/CyberChef/) | Her türlü encoding/decoding, şifreleme, dönüştürme |
| **dCode.fr** | [dcode.fr](https://www.dcode.fr/) | Vigenère kırma, Kasiski analizi, frekans analizi |
| **Cryptii** | [cryptii.com](https://cryptii.com/) | Klasik şifreler (Caesar, Vigenère, vs.) |

### CyberChef

"The Cyber Swiss Army Knife" — 300+ işlem sunar. Zincirleme yapılabiliyor (bir işlemin çıktısı diğerine giriyor):

- Base64 Decode → Gunzip → Hex Decode gibi zincirleme çözümler
- Sol tarafta "Operations", ortada "Recipe" (ne yapılacak), sağda "Output"
- Dosya yükleyerek veya metin yapıştırarak çalışır

### dCode.fr

Kriptanaliz için güçlü bir platform. Krypton'da en çok kullandığımız özellikler:

- **Vigenère Cipher** → "Knowing the Key-Length" veya "Automatic Decryption"
- **Frequency Analysis** → Görsel harf frekansı karşılaştırması
- Sonuç: hem anahtar hem çözülmüş metin gösterilir

---

## 📊 Özet Tablosu

| Komut / Araç | Kullanıldığı Level | Ne için |
|---|---|---|
| `wc -c` | Level 3 | Harf frekansı sayma |
| `sort -nr` | Level 3 | Frekans sıralaması (büyükten küçüğe) |
| `tr -cd 'X'` | Level 3 | Belirli harf dışındakileri silme |
| `for i in {A..Z}` | Level 3 | A'dan Z'ye harf tarama döngüsü |
| `python3 -c "..."` | Level 6 | Inline Python, XOR çözme |
| **Caesar Cipher** | Level 2 | Sabit kaydırmalı şifre |
| **Frekans Analizi** | Level 3 | Harf sıklığıyla monoalfabetik şifre kırma |
| **Vigenère Cipher** | Level 4-5 | Anahtar kelimeli polialfabetik şifre |
| **Kasiski Sınaması** | Level 5 | Vigenère key uzunluğunu bulma |
| **Stream Cipher/XOR** | Level 6 | Byte-byte XOR tabanlı şifreleme |
| CyberChef | Level 0+ | Genel encode/decode |
| dCode.fr | Level 4-5 | Vigenère otomatik kırma |

---

## 🔗 Faydalı Kaynaklar

- [Frequency Analysis — Wikipedia](https://en.wikipedia.org/wiki/Frequency_analysis)
- [Vigenère Cipher — Wikipedia](https://en.wikipedia.org/wiki/Vigen%C3%A8re_cipher)
- [Kasiski Sınaması — Wikipedia](https://en.wikipedia.org/wiki/Kasiski_examination)
- [XOR Cipher — Wikipedia](https://en.wikipedia.org/wiki/XOR_cipher)
- [CyberChef](https://gchq.github.io/CyberChef/)
- [dCode.fr](https://www.dcode.fr/)

---

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
