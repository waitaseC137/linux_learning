# 🔍 Linux Komutları — Metin İşleme

> Linux'ta her şey metin. Log dosyaları, config dosyaları, komut çıktıları...  
> Bu komutları iyi bilirsen, binlerce satır arasından istediğini saniyeler içinde bulursun.

---

## 📋 İçindekiler

- [grep](#grep)
- [sort](#sort)
- [uniq](#uniq)
- [strings](#strings)
- [cut](#cut)
- [tr](#tr)
- [diff](#diff)
- [echo](#echo)
- [md5sum](#md5sum)
- [wc](#wc)
- [head & tail](#head--tail)
- [sed](#sed)

---

## grep

**Global Regular Expression Print** — Dosya veya çıktı içinde pattern arar, eşleşen satırları gösterir.

### Temel Kullanım
```bash
grep "kelime" dosya.txt           # dosyada ara
grep "kelime" *.txt               # birden fazla dosyada ara
grep "kelime" dosya1 dosya2       # belirli dosyalarda ara
cat dosya.txt | grep "kelime"     # pipe ile kullan
```

### Önemli Bayraklar

| Bayrak | Açıklama | Örnek |
|---|---|---|
| `-i` | Büyük/küçük harf duyarsız | `grep -i "linux"` |
| `-v` | Eşleşmeyenleri göster | `grep -v "error"` |
| `-n` | Satır numarasını göster | `grep -n "hata"` |
| `-c` | Eşleşen satır sayısını göster | `grep -c "warning"` |
| `-r` | Alt dizinlerde de ara (recursive) | `grep -r "TODO" .` |
| `-l` | Sadece dosya adlarını göster | `grep -rl "TODO" .` |
| `-w` | Tam kelime eşleşmesi | `grep -w "cat"` |
| `-A N` | Eşleşmeden sonra N satır göster | `grep -A 3 "hata"` |
| `-B N` | Eşleşmeden önce N satır göster | `grep -B 3 "hata"` |
| `-C N` | Eşleşme etrafında N satır göster | `grep -C 3 "hata"` |
| `-E` | Genişletilmiş regex kullan | `grep -E "cat\|dog"` |
| `-o` | Sadece eşleşen kısmı göster | `grep -o "[0-9]*"` |

### Regex Temelleri

```bash
grep "^hata" dosya    # 'hata' ile başlayan satırlar
grep "hata$" dosya    # 'hata' ile biten satırlar
grep "h.ta" dosya     # h ile başlayıp ta ile biten, ortada herhangi bir karakter
grep "ha*ta" dosya    # ha, hata, haata, haaa...ta
grep "[0-9]" dosya    # rakam içeren satırlar
grep "[a-z]" dosya    # küçük harf içeren satırlar
grep "^$" dosya       # boş satırlar
```

### Pipe ile Zincirleme

```bash
# find çıktısını filtrele
find . -type f | grep ".txt"

# komut çıktısından hata satırlarını gizle
ls /etc 2>&1 | grep -v "Permission"

# birden fazla grep ile daralt
cat log.txt | grep "ERROR" | grep "2024"
```

### Bandit'te Kullanım
```bash
# Level 7: millionth kelimesini içeren satırı bul
grep "millionth" data.txt

# Level 5: ASCII text olan dosyayı bul
find . -exec file {} \; | grep "ASCII"

# Level 6: Permission denied hatalarını gizle
find / -user bandit7 2>/dev/null

# Level 24: brute force sonucundan doğru satırı bul
grep -v "Wrong" result.txt
```

---

## sort

**Sort** — Satırları sıralar.

### Temel Kullanım
```bash
sort dosya.txt              # alfabetik sırala
sort dosya.txt > sirali.txt # sıralayıp kaydet
cat dosya.txt | sort        # pipe ile kullan
```

### Önemli Bayraklar

| Bayrak | Açıklama | Örnek |
|---|---|---|
| `-r` | Ters sırada (Z→A, 9→0) | `sort -r` |
| `-n` | Sayısal sıralama | `sort -n` |
| `-u` | Tekrarları kaldır (unique) | `sort -u` |
| `-k N` | N. sütuna göre sırala | `sort -k 2` |
| `-t ':'` | Alan ayırıcı belirt | `sort -t ':' -k 3 -n` |
| `-h` | Okunabilir boyutları sırala (1K, 2M) | `sort -h` |
| `-R` | Rastgele sırala | `sort -R` |
| `-f` | Büyük/küçük harf duyarsız | `sort -f` |

### Örnekler

```bash
# Sayısal sıralama
echo -e "10\n2\n1\n20" | sort -n
# Çıktı: 1, 2, 10, 20

# Alfabetik sıralama (varsayılan) farklı sonuç verir
echo -e "10\n2\n1\n20" | sort
# Çıktı: 1, 10, 2, 20  ← sayısal değil!

# İkinci sütuna göre sırala
sort -k 2 dosya.txt

# /etc/passwd dosyasını UID'ye (3. alan) göre sırala
sort -t ':' -k 3 -n /etc/passwd
```

### uniq ile Birlikte Kullanım

`uniq` sadece yan yana aynı satırları işler. Bu yüzden önce `sort` gerekir:

```bash
sort dosya.txt | uniq       # tekrarları kaldır
sort dosya.txt | uniq -c    # her satırın kaç kez geçtiğini say
sort dosya.txt | uniq -d    # sadece tekrarlananları göster
sort dosya.txt | uniq -u    # sadece bir kez geçenleri göster
```

### Bandit'te Kullanım
```bash
# Level 8: tekil satırı bulmak için önce sırala
sort data.txt | uniq -u
```

---

## uniq

**Unique** — Tekrar eden satırları filtreler. **Dikkat:** Sadece yan yana aynı satırları işler, bu yüzden genellikle `sort` ile birlikte kullanılır.

### Temel Kullanım
```bash
uniq dosya.txt              # tekrar eden ardışık satırları kaldır
sort dosya.txt | uniq       # sıralayıp tekrarları kaldır
```

### Önemli Bayraklar

| Bayrak | Açıklama | Örnek |
|---|---|---|
| `-u` | Sadece bir kez geçen satırlar | `uniq -u` |
| `-d` | Sadece tekrar eden satırlar | `uniq -d` |
| `-c` | Her satırın kaç kez geçtiğini say | `uniq -c` |
| `-i` | Büyük/küçük harf duyarsız | `uniq -i` |

### Örnekler

```bash
$ echo -e "elma\nelma\narmut\nelmA\narmut" | sort | uniq -c
      1 armut
      1 armut     # büyük/küçük harf farklı → farklı sayıldı
      2 elma
      1 elmA

$ echo -e "elma\nelma\narmut\narmut" | sort | uniq -u
# Çıktı: (boş — hepsi en az 2 kez var)

$ echo -e "elma\nelma\narmut" | sort | uniq -u
armut             # sadece 1 kez geçiyor
```

### Bandit'te Kullanım
```bash
# Level 8: sadece bir kez geçen satırı bul
sort data.txt | uniq -u
# Çıktı: şifre (tek satır)
```

---

## strings

**Strings** — Binary dosyalardaki yazdırılabilir karakter dizilerini çıkarır.

### Temel Kullanım
```bash
strings binary_dosya            # tüm stringleri listele
strings -n 8 binary_dosya       # minimum 8 karakter uzunluğundakileri göster
strings dosya | grep "password"  # pipe ile filtrele
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `-n N` | Minimum N karakter uzunluğundaki stringleri göster (varsayılan: 4) |
| `-a` | Tüm bölümleri tara (sadece metin bölümleri değil) |
| `-t x` | String'in offset'ini hex olarak göster |
| `-t d` | String'in offset'ini decimal olarak göster |

### Ne Zaman Kullanılır?

```bash
# Binary dosyada saklı metin var mı?
strings /bin/ls | head -20

# Program hangi kütüphaneleri kullanıyor?
strings program | grep "\.so"

# Hardcoded şifre veya URL var mı?
strings program | grep -i "password\|http\|secret"

# data.txt binary ama metin parçaları içeriyor
strings data.txt | grep "==="
```

### Bandit'te Kullanım
```bash
# Level 9: binary dosyada = işaretli satırı bul
strings data.txt | grep "==="

# Leviathan Level 1: binary'de gizli string var mı?
strings /narnia/narnia1
```

---

## cut

**Cut** — Satırlardan belirli alanları veya karakterleri keser.

### Temel Kullanım
```bash
cut -d ':' -f 1 /etc/passwd     # : ile böl, 1. alanı al
cut -c 1-10 dosya.txt           # her satırın ilk 10 karakterini al
cut -d ' ' -f 2- dosya.txt      # 2. alandan sona kadar al
```

### Önemli Bayraklar

| Bayrak | Açıklama | Örnek |
|---|---|---|
| `-d 'ayirici'` | Alan ayırıcı belirt (varsayılan: tab) | `-d ':'` |
| `-f N` | N. alanı al | `-f 1` |
| `-f N-M` | N'den M'ye kadar alanları al | `-f 1-3` |
| `-f N-` | N'den sona kadar | `-f 2-` |
| `-c N` | N. karakteri al | `-c 1` |
| `-c N-M` | N'den M'ye karakterler | `-c 1-10` |

### Örnekler

```bash
# /etc/passwd'den kullanıcı adlarını al
cut -d ':' -f 1 /etc/passwd

# md5sum çıktısından sadece hash'i al
echo "test" | md5sum
# d8e8fca2dc0f896fd7cb4cb0031ba249  -
echo "test" | md5sum | cut -d ' ' -f 1
# d8e8fca2dc0f896fd7cb4cb0031ba249

# CSV'den belirli sütunları al
cut -d ',' -f 1,3 veri.csv
```

### Bandit'te Kullanım
```bash
# Level 22: md5sum çıktısından sadece hash'i al
echo I am user bandit23 | md5sum | cut -d ' ' -f 1
# 8ca319486bfbbc3663ea0fbe81326349
```

---

## tr

**Translate** — Karakter dönüşümü yapar. Karakter değiştirme, silme veya sıkıştırma için kullanılır.

### Temel Kullanım
```bash
echo "merhaba" | tr 'a-z' 'A-Z'       # küçük → büyük harf
echo "merhaba" | tr -d 'a'            # 'a' harflerini sil
echo "merhaba" | tr -s 'a'            # ardışık 'a'ları teke indir
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `-d 'karakterler'` | Belirtilen karakterleri sil |
| `-s 'karakterler'` | Ardışık tekrarları teke indir |
| `-c 'karakterler'` | Belirtilenlerin dışındakilere uygula (complement) |

### Karakter Aralıkları

```bash
tr 'a-z' 'A-Z'          # tüm küçük harfleri büyük yap
tr 'A-Za-z' 'a-zA-Z'    # büyük/küçük harf değiştir
tr '0-9' '9-0'           # rakamları ters çevir
tr -d '0-9'              # tüm rakamları sil
tr -d '\n'               # satır sonlarını sil
tr -s ' '                # birden fazla boşluğu teke indir
```

### ROT13

ROT13 her harfi 13 pozisyon kaydırır. 26 harfli alfabede 13+13=26 olduğundan şifreleme ve çözme aynı işlemdir:

```bash
# ROT13 şifrele/çöz
echo "Hello World" | tr 'A-Za-z' 'N-ZA-Mn-za-m'
# Çıktı: Uryyb Jbeyq

# Tekrar uygulayınca orijinal gelir
echo "Uryyb Jbeyq" | tr 'A-Za-z' 'N-ZA-Mn-za-m'
# Çıktı: Hello World
```

### Alias ile Kısayol

```bash
alias rot13="tr 'A-Za-z' 'N-ZA-Mn-za-m'"
echo "Gur cnffjbeq" | rot13
```

### Bandit'te Kullanım
```bash
# Level 11: ROT13 şifresini çöz
cat data.txt | tr 'A-Za-z' 'N-ZA-Mn-za-m'
```

---

## diff

**Difference** — İki dosya arasındaki farkları gösterir.

### Temel Kullanım
```bash
diff dosya1 dosya2          # iki dosyayı karşılaştır
diff -u dosya1 dosya2       # unified format (daha okunabilir)
diff -r klasor1 klasor2     # iki dizini karşılaştır
```

### Çıktıyı Okumak

```bash
$ diff passwords.old passwords.new
42c42
< eski_sifre_satiri
---
> yeni_sifre_satiri
```

| Sembol | Anlamı |
|---|---|
| `<` | Birinci dosyaya ait satır |
| `>` | İkinci dosyaya ait satır |
| `---` | İki dosya arasındaki ayırıcı |
| `42c42` | 42. satırda değişiklik (c=change, a=add, d=delete) |
| `1,5c1,5` | 1-5. satırlar değişmiş |

### Unified Format (-u)

```bash
$ diff -u dosya1 dosya2
--- dosya1  2024-01-01
+++ dosya2  2024-01-02
@@ -42,3 +42,3 @@
 değişmeyen satır
-eski satır       ← birinci dosyada var
+yeni satır       ← ikinci dosyada var
 değişmeyen satır
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `-u` | Unified format (patch için kullanılır) |
| `-i` | Büyük/küçük harf duyarsız |
| `-w` | Boşluk farklarını yoksay |
| `-r` | Dizinleri karşılaştır |
| `-q` | Sadece farklı mı değil mi söyle |

### Bandit'te Kullanım
```bash
# Level 17: iki şifre dosyası arasındaki tek farkı bul
diff passwords.old passwords.new
# > ile gösterilen satır → yeni şifre
```

---

## echo

**Echo** — Metni terminale veya dosyaya yazar.

### Temel Kullanım
```bash
echo "Merhaba"              # ekrana yaz
echo "Merhaba" > dosya.txt  # dosyaya yaz (üzerine yazar)
echo "Merhaba" >> dosya.txt # dosyaya ekle (sonuna yazar)
echo $HOME                  # değişken değerini göster
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `-n` | Satır sonu ekleme |
| `-e` | Kaçış karakterlerini yorumla (`\n`, `\t` vb.) |

### Kaçış Karakterleri (-e ile)

```bash
echo -e "satir1\nsatir2"    # \n = yeni satır
echo -e "sütun1\tsütun2"    # \t = tab
echo -e "\a"                # zil sesi
```

### Yönlendirme Operatörleri

```bash
echo "metin" > dosya.txt    # dosyaya yaz (var olanı siler)
echo "metin" >> dosya.txt   # dosyaya ekle (var olana ekler)
echo "metin" | komut        # pipe ile başka komuta aktar
```

### Değişkenlerle Kullanım

```bash
isim="Robin"
echo "Merhaba $isim"         # Merhaba Robin
echo "Merhaba ${isim}!"      # Merhaba Robin! (süslü parantez ile)
echo 'Merhaba $isim'         # Merhaba $isim (tek tırnak değişken işlemez)
```

### Bandit'te Kullanım
```bash
# Level 20: şifreyi pipe ile netcat'e gönder
echo -n 'şifre' | nc -l -p 1234 &

# Level 22: hash hesapla
echo I am user bandit23 | md5sum | cut -d ' ' -f 1

# Level 24: brute force listesi oluştur
for i in {0000..9999}; do
    echo "şifre $i" >> liste.txt
done
```

---

## md5sum

**MD5 Checksum** — Dosya veya string'in MD5 hash'ini üretir.

### Temel Kullanım
```bash
md5sum dosya.txt            # dosyanın MD5 hash'i
echo "metin" | md5sum       # string'in MD5 hash'i
md5sum dosya1 dosya2        # birden fazla dosya
```

### Çıktı Formatı

```bash
$ echo "test" | md5sum
d8e8fca2dc0f896fd7cb4cb0031ba249  -
#                                  ^ - = stdin anlamında
```

Hash + iki boşluk + kaynak ismi döner. Sadece hash'i almak için:
```bash
echo "test" | md5sum | cut -d ' ' -f 1
# d8e8fca2dc0f896fd7cb4cb0031ba249
```

### Hash Doğrulama

```bash
# Dosyadan hash oluştur
md5sum dosya.txt > dosya.md5

# Sonradan doğrula
md5sum -c dosya.md5
# dosya.txt: OK
```

### MD5 Hakkında Önemli Not

MD5 kriptografik amaçlar için artık **güvenli değildir** — çakışma saldırılarına karşı savunmasız. Sadece veri bütünlüğü kontrolü için kullanılmalı. Şifre depolamak için `bcrypt`, `argon2` gibi algoritmalar tercih edilmeli.

### Bandit'te Kullanım
```bash
# Level 22: dosya adını hesapla
echo I am user bandit23 | md5sum | cut -d ' ' -f 1
# 8ca319486bfbbc3663ea0fbe81326349

cat /tmp/8ca319486bfbbc3663ea0fbe81326349
```

---

## wc

**Word Count** — Satır, kelime ve karakter sayar.

### Temel Kullanım
```bash
wc dosya.txt            # satır, kelime, byte sayısı
wc -l dosya.txt         # sadece satır sayısı
wc -w dosya.txt         # sadece kelime sayısı
wc -c dosya.txt         # sadece byte sayısı
cat dosya.txt | wc -l   # pipe ile
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `-l` | Satır sayısı |
| `-w` | Kelime sayısı |
| `-c` | Byte sayısı |
| `-m` | Karakter sayısı |

### Kullanım Örnekleri

```bash
# Kaç satır var?
wc -l /etc/passwd

# Kaç dosya var?
ls | wc -l

# Grep'in kaç eşleşme bulduğunu say
grep "error" log.txt | wc -l
```

### Bandit'te Kullanım
```bash
# Krypton Level 3: harf frekansı analizi için
for i in {A..Z}; do
    cat found1 found2 found3 | tr -cd $i | wc -c | tr -d '\n'
    printf " $i\n"
done | sort -nr
```

---

## head & tail

**Head** — Dosyanın başından, **Tail** — Dosyanın sonundan satır gösterir.

### Temel Kullanım
```bash
head dosya.txt          # ilk 10 satır (varsayılan)
head -n 20 dosya.txt    # ilk 20 satır
head -c 100 dosya.txt   # ilk 100 byte

tail dosya.txt          # son 10 satır
tail -n 20 dosya.txt    # son 20 satır
tail -f log.txt         # canlı takip (log izleme için)
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `-n N` | N satır göster |
| `-c N` | N byte göster |
| `-f` | Dosya büyüdükçe güncelle (tail için) |
| `-q` | Dosya adını gösterme |

### Birlikte Kullanım

```bash
# 11-20. satırları göster
head -n 20 dosya.txt | tail -n 10

# hexdump'ın sadece ilk satırını kontrol et
xxd dosya | head -n 1
```

### Bandit'te Kullanım
```bash
# Level 12: magic number'ı kontrol et
xxd compressed_data | head -n 1
# 00000000: 1f8b 0808 ...  ← 1f8b = gzip!
```

---

## sed

**Stream Editor** — Metin akışı üzerinde dönüşümler yapar. Değiştirme, silme, ekleme işlemleri için kullanılır.

### Temel Kullanım
```bash
sed 's/eski/yeni/' dosya.txt        # ilk eşleşmeyi değiştir
sed 's/eski/yeni/g' dosya.txt       # tüm eşleşmeleri değiştir
sed 's/eski/yeni/gi' dosya.txt      # büyük/küçük harf duyarsız
sed -i 's/eski/yeni/g' dosya.txt    # dosyayı yerinde değiştir
```

### Önemli Kullanımlar

```bash
# Satır sil
sed '3d' dosya.txt              # 3. satırı sil
sed '/pattern/d' dosya.txt      # pattern içeren satırları sil

# Satır yazdır
sed -n '5p' dosya.txt           # sadece 5. satırı göster
sed -n '5,10p' dosya.txt        # 5-10. satırları göster

# Boş satırları sil
sed '/^$/d' dosya.txt

# Başındaki/sonundaki boşlukları temizle
sed 's/^[[:space:]]*//' dosya.txt   # baştaki boşluklar
sed 's/[[:space:]]*$//' dosya.txt   # sondaki boşluklar
```

### Bandit'te Kullanım
```bash
# Krypton: büyük harf olmayan karakterleri kaldır
cat krypton3 | sed 's/[^A-Z]//g'
```

---

## 📚 Hızlı Referans Tablosu

| Komut | Temel Kullanım | Ne Yapar |
|---|---|---|
| `grep` | `grep "pattern" dosya` | Pattern içeren satırları bul |
| `grep -v` | `grep -v "pattern" dosya` | Pattern içermeyenleri göster |
| `sort` | `sort dosya` | Satırları sırala |
| `sort -n` | `sort -n dosya` | Sayısal sırala |
| `uniq -u` | `sort dosya \| uniq -u` | Tekil satırları göster |
| `uniq -c` | `sort dosya \| uniq -c` | Her satırın kaç kez geçtiğini say |
| `strings` | `strings binary` | Binary'den metin çıkar |
| `cut -d: -f1` | `cut -d: -f1 /etc/passwd` | Alana göre kes |
| `tr` | `echo "abc" \| tr 'a-z' 'A-Z'` | Karakter dönüştür |
| `tr -d` | `echo "a1b2" \| tr -d '0-9'` | Karakter sil |
| `diff` | `diff dosya1 dosya2` | İki dosya arasındaki fark |
| `echo` | `echo "metin"` | Metin yaz |
| `echo -n` | `echo -n "metin"` | Satır sonu olmadan yaz |
| `md5sum` | `echo "metin" \| md5sum` | MD5 hash üret |
| `wc -l` | `wc -l dosya` | Satır say |
| `head` | `head -n 5 dosya` | İlk N satır |
| `tail` | `tail -n 5 dosya` | Son N satır |
| `sed` | `sed 's/eski/yeni/g' dosya` | Metin değiştir |

---

## 🔗 Daha Fazla Bilgi

- `man grep` — regex için `man 7 regex`
- [Regex101](https://regex101.com/) — regex'leri interaktif test et
- [Explain Shell](https://explainshell.com/)

---

**Önceki bölüm:** [dosya_sistemi.md](./dosya_sistemi.md)  
**Sonraki bölüm:** [sikistirma_encoding.md](./sikistirma_encoding.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
