# 🔐 OverTheWire: Krypton — Level 0'dan Level 6'ya Türkçe Rehber

> Krypton tamamen **kriptografi** üzerine kurulu. Klasik şifreleme yöntemlerini öğrenip  
> nasıl kırılacaklarını görüyorsun — Base64'ten stream cipher'a kadar.  
> Programlama bilgisi gerekmiyor, ama şifrelemeyi kavramak gerekiyor.

**Platform:** `krypton.labs.overthewire.org` | **Port:** `2231`  
**Dosyalar:** `/krypton/krypton<N>/` klasörlerinde  
**Referans:** [mayadevbe.me](https://mayadevbe.me/tags/krypton/) · [learnhacking.io](https://learnhacking.io/overthewire-krypton-levels-0-9/) · [overthewire.org](https://overthewire.org/wargames/krypton/)

---

## 🗺️ Genel Bakış — Kryptografiye Giriş

Krypton'da her level daha karmaşık bir şifreleme yöntemi kullanıyor:

| Level | Şifreleme | Zorluk |
|---|---|---|
| 0 → 1 | Base64 | ⭐ |
| 1 → 2 | ROT13 | ⭐ |
| 2 → 3 | Caesar Cipher | ⭐⭐ |
| 3 → 4 | Frekans Analizi | ⭐⭐⭐ |
| 4 → 5 | Vigenère (bilinen key uzunluğu) | ⭐⭐⭐ |
| 5 → 6 | Vigenère (bilinmeyen key uzunluğu) | ⭐⭐⭐⭐ |
| 6 → 7 | Stream Cipher (XOR) | ⭐⭐⭐⭐⭐ |

Faydalı online araçlar:
- [CyberChef](https://gchq.github.io/CyberChef/) — Her türlü encoding/decoding
- [dCode.fr](https://www.dcode.fr/) — Şifre analiz araçları
- [Cryptii](https://cryptii.com/) — Klasik şifreler

---

## Level 0 → Level 1 — Base64

### 🎯 Görev
SSH gerekmeden, verilen Base64 string'i çöz.

### 📖 Teori: Base64

**Base64:** Binary veriyi metin formatına çeviren kodlama şeması. Genellikle sonunda `=` işaretleriyle tanınır. E-posta ekleri, JWT token'ları ve URL'lerde sıkça kullanılır. Şifreleme değil — sadece kodlama!

```bash
base64 -d   # decode
base64      # encode
```

### 🔧 Çözüm

```bash
$ echo "S1JZUFRPTklTR1JFQVQ=" | base64 -d
KRYPTONISGREAT
```

`KRYPTONISGREAT` → Level 1'in şifresi.

---

## Level 1 → Level 2 — ROT13

### 🔐 Bağlantı
```bash
ssh krypton1@krypton.labs.overthewire.org -p 2231
# Şifre: KRYPTONISGREAT
```

### 🎯 Görev
`/krypton/krypton1/krypton2` dosyası ROT13 ile şifrelenmiş. Çöz.

### 📖 Teori: ROT13 ve Caesar Cipher

**Caesar Cipher (Sezar Şifresi):** Alfabedeki her harfi belirli bir sayı kadar kaydırır. Örneğin k=3 ile A→D, B→E, Z→C olur.

**ROT13:** Caesar'ın özel hali — 13 pozisyon kaydırır. 26 harflik Latin alfabesinde 13+13=26 olduğundan şifreleme ve çözme fonksiyonu **aynıdır**.

```bash
tr 'A-Za-z' 'N-ZA-Mn-za-m'   # ROT13
```

### 🔧 Çözüm

```bash
krypton1@krypton:~$ cd /krypton/krypton1
krypton1@krypton:/krypton/krypton1$ cat krypton2
YRIRY GJB CNFFJBEQ EBGGRA

krypton1@krypton:/krypton/krypton1$ cat krypton2 | tr 'A-Za-z' 'N-ZA-Mn-za-m'
LEVEL TWO PASSWORD ROTTEN
```

Şifre: `ROTTEN`

> 💡 **Alias tanımla:** `alias rot13="tr 'A-Za-z' 'N-ZA-Mn-za-m'"` ile sadece `cat krypton2 | rot13` yazabilirsin.

---

## Level 2 → Level 3 — Caesar Cipher (Anahtarı Bul)

### 🔐 Bağlantı
```bash
ssh krypton2@krypton.labs.overthewire.org -p 2231
# Şifre: ROTTEN
```

### 🎯 Görev
`encrypt` binary'si Caesar ile şifreli. Anahtarı bul, şifreyi çöz.

### 📖 Teori: Anahtarı Hesaplamak

Caesar'ı kırmak için tek bir harf çiftini bilmek yeterli:
- Şifreli harfin alfabedeki sırası - düz harfin sırası = şifreleme anahtarı
- Çözme anahtarı = 26 - şifreleme anahtarı

Eğer `A` → `M` ise: M=13. sıra, anahtar = 13-1 = **12**.  
Çözme anahtarı = 26-12 = **14**.

**SUID binary olan `encrypt`'i kullanarak kendi seçtiğimiz metni şifreleyip anahtarı çıkarabiliriz.**

### 🔧 Çözüm

```bash
krypton2@krypton:~$ cd /krypton/krypton2

# Geçici çalışma klasörü kur
krypton2@krypton:/krypton/krypton2$ mktemp -d
/tmp/tmp.1RfnWl0zk4
krypton2@krypton:/krypton/krypton2$ cd /tmp/tmp.1RfnWl0zk4

# Keyfile'a sembolik link oluştur (binary keyfile'ı burda arar)
krypton2@krypton:/tmp/tmp.1RfnWl0zk4$ ln -s /krypton/krypton2/keyfile.dat
krypton2@krypton:/tmp/tmp.1RfnWl0zk4$ chmod 777 .

# AAAAA şifrele — A'nın nereye gittiğini gör
krypton2@krypton:/tmp/tmp.1RfnWl0zk4$ echo "AAAAA" > test.txt
krypton2@krypton:/tmp/tmp.1RfnWl0zk4$ /krypton/krypton2/encrypt test.txt
krypton2@krypton:/tmp/tmp.1RfnWl0zk4$ cat ciphertext
MMMMM    # A→M, yani 12 pozisyon kaydırılmış
```

Şifreleme anahtarı = 12, çözme anahtarı = 26-12 = **14**.

`tr` ile 14 pozisyon geri kaydır (O'dan başla → `O-ZA-N`):

```bash
krypton2@krypton:/krypton/krypton2$ cat krypton3 | tr 'A-Za-z' 'O-ZA-No-za-n'
CAESARISEASY
```

Şifre: `CAESARISEASY`

---

## Level 3 → Level 4 — Frekans Analizi

### 🔐 Bağlantı
```bash
ssh krypton3@krypton.labs.overthewire.org -p 2231
# Şifre: CAESARISEASY
```

### 🎯 Görev
`found1`, `found2`, `found3` dosyaları aynı anahtarla şifrelenmiş İngilizce metinler. Frekans analizi yap, `krypton4`'ü çöz.

### 📖 Teori: Frekans Analizi ve Entropi

**Monoalfabetik ikame şifresi:** Her harf başka bir harfle değiştirilir ama bu eşleşme sabittir. Sorun: İngilizce'de bazı harfler çok daha sık kullanılır.

İngilizce harf sıklığı (en sıktan en seyreğe):
```
E T A O I N S R H D L U C M F Y W G P B V K X Q J Z
```

Mantık: Şifreli metinde en sık geçen harf büyük ihtimalle `E`'dir. İkinci sık geçen `T`'dir, vs.

```bash
# Her harfin kaç kez geçtiğini say
for i in {A..Z}; do
    printf $i
    cat found1 found2 found3 | tr -cd $i | wc -c
done
```

### 🔧 Çözüm

```bash
krypton3@krypton:~$ cd /krypton/krypton3

# Harfleri frekansa göre sırala
krypton3@krypton:/krypton/krypton3$ for i in {A..Z}; do
    cat found1 found2 found3 | tr -cd $i | wc -c | tr -d '\n'
    printf " $i\n"
done | sort -nr

456 S     # en sık → büyük ihtimalle E
340 Q     # ikinci → büyük ihtimalle T
301 J     # ...
257 U
246 B
...
```

Şifreli sıralama: `SQJUBNGCDZVWMYTXKELAFIORHP`  
İngilizce sıralama (teorik referans): `ETAOINSRHDLUCMFYWGPBVKXQJZ`

> ⚠️ Aşağıdaki `tr` **hedef** dizisi (`EATSORNIHC...`) bu ham ETAOIN sırası DEĞİL — küçük metinde frekans tam tutmadığı için deneme-yanılmayla düzeltilmiş **son ikame anahtarıdır** (ilk ~9 harf yine E,T,A,O,I,N,S,R,H kümesidir, yalnızca okunur çıktı için yeniden dizilmiş).

```bash
krypton3@krypton:/krypton/krypton3$ cat krypton4 | tr 'SQJUBNGCDZVWMYTXKELAFIORHP' 'EATSORNIHCLDUPYFWGMBKVXQJZ'
WELLD ONETH ELEVE LFOUR PASSW ORDIS BRUTE
```

Şifre: `BRUTE`

> 💡 **Not:** Frekans analizi mükemmel değil — küçük metinlerde sıra tam tutmayabilir. Biraz deneme-yanılma gerekebilir. [dCode.fr](https://www.dcode.fr/frequency-analysis) ile görsel analiz yapabilirsin.

---

## Level 4 → Level 5 — Vigenère Cipher (Bilinen Key Uzunluğu)

### 🔐 Bağlantı
```bash
ssh krypton4@krypton.labs.overthewire.org -p 2231
# Şifre: BRUTE
```

### 🎯 Görev
Vigenère şifresi kullanılmış. Key uzunluğu **6**. `found1` ve `found2` metinlerinden anahtarı bul, `krypton5`'i çöz.

### 📖 Teori: Vigenère Cipher

**Vigenère:** Caesar'ın gelişmiş versiyonu. Tek bir kaydırma değeri yerine bir **anahtar kelime** kullanır. Her harf, anahtardaki karşılık gelen harfin sırasına göre farklı miktarda kaydırılır.

Örnek: Anahtar `KEY` (K=10, E=4, Y=24), metin `ABC`:
```
A + K(10) = K
B + E(4)  = F
C + Y(24) = A
D + K(10) = N  (anahtar tekrar başa döner)
...
```

**Key uzunluğunu bilmek avantajdır:** Her 6. karakterin aynı kaydırmayla şifrelendiğini biliyorsun → 6 ayrı Caesar analizi yapabilirsin.

### 🔧 Çözüm

**Online araç ile (önerilen):**

1. [dCode.fr Vigenère](https://www.dcode.fr/vigenere-cipher) sitesine git
2. `found1` içeriğini yapıştır
3. Decryption method: "KNOWING THE KEY-LENGTH" → 6 gir
4. Decrypt → Anahtar: `FREKEY`
5. `krypton5` içeriğini yapıştır, key olarak `FREKEY` gir → Decrypt

Şifre: `CLEARTEXT`

> 💡 **Alternatif — Elle hesaplama:** `YYI → THE` gibi bilinen kelime başlangıçlarını tahmin ederek kısmi anahtarı çıkarabilirsin. `C - P = K` (cipher - plaintext = key).

---

## Level 5 → Level 6 — Vigenère (Bilinmeyen Key Uzunluğu)

### 🔐 Bağlantı
```bash
ssh krypton5@krypton.labs.overthewire.org -p 2231
# Şifre: CLEARTEXT
```

### 🎯 Görev
Bu sefer key uzunluğu da bilinmiyor. Önce uzunluğu tahmin et, sonra şifreyi çöz.

### 📖 Teori: Kasiski Sınaması

**Kasiski Sınaması:** Şifreli metinde tekrar eden dizileri ve aralarındaki mesafeleri bulur. Bu mesafelerin EBOB'u (En Büyük Ortak Bölen) büyük ihtimalle key uzunluğudur.

Örnek: `XYZ` dizisi 30 ve 60. karakterlerde tekrar ediyorsa → EBOB(30, 60) = 30 → key uzunluğu 30'un bölenlerinden biri (1, 2, 3, 5, 6, 10, 15, 30).

### 🔧 Çözüm

**Online araç ile:**

1. [dCode.fr Vigenère](https://www.dcode.fr/vigenere-cipher) sitesine git
2. `found1` içeriğini yapıştır
3. Decryption method: "Automatic Decryption" seç
4. Decrypt → Kasiski sonucu: key uzunluğu 3, 6 veya 9 (birbirinin katları)
5. Key uzunluğu **9** doğru çıkıyor, anahtar: `KEYLENGTH`
6. `krypton6` içeriğini `KEYLENGTH` ile çöz

Şifre: `RANDOM`

> 💡 dCode'un "Automatic Decryption" özelliği hem key uzunluğunu hem anahtarı tek seferde buluyor.

---

## Level 6 → Level 7 — Stream Cipher (mod-26 kaydırma, LFSR keystream)

### 🔐 Bağlantı
```bash
ssh krypton6@krypton.labs.overthewire.org -p 2231
# Şifre: RANDOM
```

### 🎯 Görev
Bu seviye bir **stream cipher** kullanıyor. Keyfile okunabilir değil, ama `encrypt6` binary'sini kullanarak kendi metinlerini şifreleyebilirsin. Zayıf rastgele sayı üretecini exploit et.

### 📖 Teori: Stream Cipher (mod-26 kaydırma)

**Dikkat — bu XOR değil, mod-26 toplama.** "Stream cipher" deyince akla genelde XOR gelir, ama Krypton 6 keystream'i bir **kaydırma miktarı** (0–25) olarak kullanır (Vigenère tarzı). Kanıt: `encrypt6` çıktısı tümüyle A–Z aralığındadır (bitwise XOR olsaydı basılamayan baytlar çıkardı) ve flag `LFSRISNOTRANDOM`.

```
şifreli_harf   = (düz_metin_harf + kaydırma) mod 26
düz_metin_harf = (şifreli_harf   − kaydırma) mod 26
```

**Önemli zafiyet:** Keystream tekrar ediyorsa (zayıf LFSR), aynı pozisyondaki her harf aynı kaydırma ile şifrelenir. Bu durumda:

1. Bilinen düz metin (`AAAA...`) ile `encrypt6`'yı çalıştır → çıktı, keystream'in kaydırmalarını doğrudan verir.
2. Kaydırmayı çıkar: `kaydırma[i] = ord(cipher[i]) − ord('A')`  (düz metin 'A' iken).
3. Hedefi çöz: her harf için `düz_metin = cipher − kaydırma` (sonuç 'A'nın altına düşerse `+26`).

### 🔧 Çözüm

```bash
krypton6@krypton:~$ cd /krypton/krypton6
krypton6@krypton:/krypton/krypton6$ ls
encrypt6  keyfile.dat  krypton7  onetime  HINT1  HINT2  README

# /tmp'ye geç, keyfile'a link ver
krypton6@krypton:/krypton/krypton6$ cd /tmp
krypton6@krypton:/tmp$ mkdir mywork && cd mywork
krypton6@krypton:/tmp/mywork$ ln -s /krypton/krypton6/keyfile.dat

# 50 adet A şifrele
krypton6@krypton:/tmp/mywork$ python3 -c "print('A'*50, end='')" > test.txt
krypton6@krypton:/tmp/mywork$ /krypton/krypton6/encrypt6 test.txt output.txt
krypton6@krypton:/tmp/mywork$ cat output.txt
EICTDGYIYZKTHNSIRFXYCPFUEOCKRNEICTDGYIYZKTHNSIRFXY
```

Çıktı 30 karakterde tekrar ediyor → keystream uzunluğu 30!

```bash
# Şifreli metni oku
krypton6@krypton:/tmp/mywork$ cat /krypton/krypton6/krypton7
PNUKLYLWRQKGKBE
```

Her pozisyon için shift miktarını hesapla:
- Pozisyon 0: A(65) → E(69), shift = 4
- Pozisyon 1: A(65) → I(73), shift = 8
- ...

```python
# Python ile otomatik çöz
cipher_flag = "PNUKLYLWRQKGKBE"
known_plain = "AAAAAAAAAAAAAAA"
known_cipher = "EICTDGYIYZKTHNS"  # ilk 15 karakter (keystream'in ilk 15'i)

shifts = [ord(known_cipher[i]) - ord(known_plain[i]) for i in range(len(cipher_flag))]
# shifts = [4, 8, 2, 19, 3, 6, 24, 8, 24, 25, 10, 19, 7, 13, 18]

flag = ""
for i in range(len(cipher_flag)):
    result = ord(cipher_flag[i]) - shifts[i]
    if result < ord('A'):
        result += 26
    flag += chr(result)

print(flag)  # LFSRISNOTRANDOM
```

```bash
krypton6@krypton:/tmp/mywork$ python3 decode.py
LFSRISNOTRANDOM
```

Şifre: `LFSRISNOTRANDOM`

---

## 🏁 Tebrikler — Krypton Tamamlandı!

```bash
ssh krypton7@krypton.labs.overthewire.org -p 2231
# Şifre: LFSRISNOTRANDOM
```

---

## 📚 Öğrenilen Şifreleme Kavramları

| Kavram | Açıklama | Nasıl Kırılır? |
|---|---|---|
| **Base64** | Binary→metin dönüşümü | Direkt decode |
| **ROT13** | 13 pozisyon kaydırma | `tr` komutu |
| **Caesar Cipher** | Sabit pozisyon kaydırma | Bilinen metin saldırısı veya brute force |
| **Frekans Analizi** | Harf sıklığını kullanarak kırma | İngilizce frekans tablosuyla eşleştirme |
| **Vigenère** | Anahtar kelime bazlı kaydırma | Kasiski sınaması + frekans analizi |
| **Stream Cipher** | XOR tabanlı byte-byte şifreleme | Tekrar eden keystream tespiti |

## 📚 Kullanılan Araçlar

| Araç | Ne için |
|---|---|
| `base64 -d` | Base64 çözme |
| `tr 'A-Za-z' 'N-ZA-Mn-za-m'` | ROT13 |
| `for i in {A..Z}; do ... done` | Harf sayma döngüsü |
| `sort -nr` | Sayısal ters sıralama |
| `wc -c` | Karakter sayma |
| `tr -cd $i` | Sadece belirli karakteri bırak |
| [CyberChef](https://gchq.github.io/CyberChef/) | Genel encode/decode |
| [dCode.fr](https://www.dcode.fr/) | Vigenère kırma, frekans analizi |
| [Cryptii](https://cryptii.com/) | Klasik şifreler |

---

## 🔗 Faydalı Kaynaklar

- [OverTheWire Krypton](https://overthewire.org/wargames/krypton/)
- [MayADevBe Krypton Walkthrough](https://mayadevbe.me/tags/krypton/) (Level 0-5)
- [LearnHacking.io Krypton](https://learnhacking.io/overthewire-krypton-levels-0-9/) (Level 6 dahil)
- [Frequency Analysis — Wikipedia](https://en.wikipedia.org/wiki/Frequency_analysis)
- [Vigenère Cipher — Wikipedia](https://en.wikipedia.org/wiki/Vigen%C3%A8re_cipher)
- [Kasiski Sınaması — Wikipedia](https://en.wikipedia.org/wiki/Kasiski_examination)
- [CyberChef](https://gchq.github.io/CyberChef/) — Her şeyi yapan online araç

---

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
