# 📦 Linux Komutları — Sıkıştırma & Encoding

> Dosyaları sıkıştırmak, arşivlemek ve farklı formatlara çevirmek  
> sistem yönetimi ve güvenliğin temel parçasıdır.  
> Bu komutlar Bandit'in en karmaşık level'larında (Level 12-13) yoğun olarak kullanıldı.

---

## 📋 İçindekiler

- [base64](#base64)
- [xxd](#xxd)
- [gzip](#gzip)
- [bzip2](#bzip2)
- [tar](#tar)
- [zip & unzip](#zip--unzip)

---

## base64

**Base64** — Binary veriyi ASCII metin formatına çevirir (veya tersine).

### Base64 Nedir?

Binary veri (resim, şifreli veri vb.) doğrudan metin kanallarından (e-posta, URL, JSON) geçirilemez. Base64 bu veriyi sadece 64 ASCII karakteri (`A-Z`, `a-z`, `0-9`, `+`, `/`) kullanarak temsil eder.

```
Örnek:
"Merhaba" → TW VyaGFiYQ==
```

- Her 3 byte → 4 base64 karakteri
- Sonundaki `=` karakterleri dolgu (padding)
- Veri boyutu ~%33 artar

### Temel Kullanım
```bash
base64 dosya.txt            # dosyayı encode et
base64 -d kodlu.txt         # decode et
echo "Merhaba" | base64     # string encode et
echo "TWVyaGFiYQ==" | base64 -d  # string decode et
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `-d` veya `--decode` | Decode et |
| `-w 0` | Satır kesmeden encode et (varsayılan 76 karakter) |
| `-i` | Geçersiz karakterleri yoksay |

### Örnek

```bash
$ echo "Merhaba Dünya" | base64
TWVyaGFiYSBEw7xueWEK

$ echo "TWVyaGFiYSBEw7xueWEK" | base64 -d
Merhaba Dünya
```

### Bandit'te Kullanım
```bash
# Level 10: base64 kodlu dosyayı çöz
cat data.txt
# VGhlIHBhc3N3b3JkIGlz...

base64 -d data.txt
# The password is <şifre>
```

---

## xxd

**Hex Dump** — Dosyayı hexadecimal formatında gösterir veya hex formatından geri dönüştürür.

### Temel Kullanım
```bash
xxd dosya               # hexdump göster
xxd -r hexdump.txt      # hexdump'tan binary'ye çevir
xxd dosya | head        # ilk birkaç satırı göster
```

### Çıktıyı Okumak

```bash
$ xxd /etc/hostname
00000000: 6e61 726e 6961 0a                        narnia.
^         ^                                        ^
|         |                                        ASCII karşılığı
|         hex değerleri (16 byte/satır)
offset (byte pozisyonu)
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `-r` | Hexdump'tan binary'ye çevir (reverse) |
| `-p` | Düz hex çıktı (adres ve ASCII olmadan) |
| `-l N` | Sadece N byte göster |
| `-s N` | N. byte'tan başla |
| `-c N` | Satır başına N byte göster |
| `-b` | Binary (ikili) formatında göster |

### Magic Number Tespiti

Dosya türünü belirlemek için ilk birkaç byte'a bakılır:

```bash
$ xxd data | head -n 1
00000000: 1f8b 0808 ...   → 1f 8b = gzip!

$ xxd data | head -n 1
00000000: 425a 6839 ...   → 42 5a 68 = BZh = bzip2!

$ xxd data | head -n 1
00000000: 5573 7461 ...   → "Usta" = tar arşivi içindeki dosya adı
```

### Bandit'te Kullanım
```bash
# Level 12: hexdump dosyasını binary'ye çevir
xxd -r hexdump_data compressed_data

# Her adımda dosya türünü kontrol et
xxd compressed_data | head -n 1
```

---

## gzip

**GNU Zip** — `.gz` formatında sıkıştırma/açma yapar. En yaygın Linux sıkıştırma formatı.

### Temel Kullanım
```bash
gzip dosya.txt          # sıkıştır → dosya.txt.gz oluşur, orijinal silinir
gzip -d dosya.txt.gz    # aç → dosya.txt oluşur, .gz silinir
gunzip dosya.txt.gz     # gzip -d ile aynı
gzip -k dosya.txt       # sıkıştır ama orijinali koru
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `-d` | Aç (decompress) |
| `-k` | Orijinal dosyayı koru |
| `-v` | İşlem detaylarını göster |
| `-l` | Sıkıştırma bilgilerini göster |
| `-r` | Dizini recursive sıkıştır |
| `-1` | Hızlı (düşük sıkıştırma) |
| `-9` | Yavaş (yüksek sıkıştırma) |
| `-c` | Çıktıyı stdout'a yaz |

### Pipe ile Kullanım

```bash
# Sıkıştırılmış dosyayı direkt oku (açmadan)
zcat dosya.gz
zgrep "pattern" dosya.gz

# stdout'a yaz
gzip -c dosya.txt > yedek.gz
```

### Bandit'te Kullanım
```bash
# Level 12: .gz dosyayı aç
mv compressed_data compressed_data.gz
gzip -d compressed_data.gz

# Magic number ile gzip tespiti: 1f 8b
```

---

## bzip2

**Block-sorting compressor** — `.bz2` formatında sıkıştırma/açma yapar. gzip'ten daha iyi sıkıştırır ama daha yavaştır.

### Temel Kullanım
```bash
bzip2 dosya.txt         # sıkıştır → dosya.txt.bz2
bzip2 -d dosya.txt.bz2  # aç
bunzip2 dosya.txt.bz2   # bzip2 -d ile aynı
bzip2 -k dosya.txt      # orijinali koru
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `-d` | Aç |
| `-k` | Orijinali koru |
| `-v` | Detaylı çıktı |
| `-z` | Sıkıştır (varsayılan) |
| `-t` | Dosyayı test et (bozuk mu?) |

### gzip vs bzip2 vs xz

| Format | Uzantı | Hız | Sıkıştırma |
|---|---|---|---|
| gzip | `.gz` | Hızlı | Orta |
| bzip2 | `.bz2` | Orta | İyi |
| xz | `.xz` | Yavaş | Çok iyi |

### Bandit'te Kullanım
```bash
# Level 12: .bz2 dosyayı aç
mv compressed_data compressed_data.bz2
bzip2 -d compressed_data.bz2

# Magic number ile bzip2 tespiti: 42 5a 68 (BZh)
```

---

## tar

**Tape Archive** — Dosyaları tek bir arşiv dosyasında toplar. Sıkıştırma yapmaz (ama gzip/bzip2 ile birleştirilebilir).

### Temel Kullanım
```bash
tar -cf arşiv.tar dosyalar/     # arşiv oluştur
tar -xf arşiv.tar               # arşivi çıkar
tar -tf arşiv.tar               # içeriği listele
tar -xf arşiv.tar -C /hedef/    # belirli dizine çıkar
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `-c` | Arşiv oluştur (create) |
| `-x` | Arşivi çıkar (extract) |
| `-t` | İçeriği listele |
| `-f dosya` | Arşiv dosyasını belirt |
| `-v` | Detaylı çıktı (verbose) |
| `-z` | gzip ile sıkıştır/aç |
| `-j` | bzip2 ile sıkıştır/aç |
| `-J` | xz ile sıkıştır/aç |
| `-C dizin` | Belirtilen dizine çıkar |
| `-p` | İzinleri koru |

### Arşiv Oluşturma

```bash
# Düz tar (sıkıştırmasız)
tar -cf arşiv.tar klasor/

# gzip ile sıkıştırarak
tar -czf arşiv.tar.gz klasor/

# bzip2 ile sıkıştırarak
tar -cjf arşiv.tar.bz2 klasor/

# xz ile sıkıştırarak
tar -cJf arşiv.tar.xz klasor/
```

### Arşiv Açma

```bash
# Uzantıya göre doğru bayrağı seç
tar -xf arşiv.tar
tar -xzf arşiv.tar.gz
tar -xjf arşiv.tar.bz2
tar -xJf arşiv.tar.xz

# Modern tar uzantıyı otomatik algılar
tar -xf arşiv.tar.gz    # -z gerekmeyebilir
```

### Arşiv İçeriğini Görme (Açmadan)

```bash
tar -tf arşiv.tar
tar -tvf arşiv.tar      # detaylı (izinler, boyut, tarih)
```

### Bandit'te Kullanım
```bash
# Level 12: tar arşivini çıkar
mv compressed_data compressed_data.tar
tar -xf compressed_data.tar     # data5.bin çıkar

tar -xf data5.bin               # data6.bin çıkar

# Magic number ile tar tespiti:
# İçinde dosya adı stringi → tar arşivi
xxd data | head -n 2    # offset 257'de "ustar" stringi
```

---

## zip & unzip

**Zip** — Windows ile uyumlu `.zip` formatında arşiv oluşturur/açar.

### Temel Kullanım
```bash
zip arşiv.zip dosya1 dosya2     # arşiv oluştur
zip -r arşiv.zip klasor/        # dizini arşivle
unzip arşiv.zip                 # aç
unzip arşiv.zip -d /hedef/      # belirli dizine aç
unzip -l arşiv.zip              # içeriği listele
```

### Önemli Bayraklar

| zip | Açıklama |
|---|---|
| `-r` | Dizini recursive arşivle |
| `-e` | Şifreyle arşivle |
| `-9` | Maksimum sıkıştırma |
| `-j` | Dizin yapısını koru |

| unzip | Açıklama |
|---|---|
| `-d dizin` | Belirtilen dizine çıkar |
| `-l` | Listeye çıkarmadan göster |
| `-o` | Var olanların üzerine yaz |
| `-P şifre` | Şifreyle aç |

---

## 📊 Format Karşılaştırma ve Magic Number Tablosu

| Format | Uzantı | Magic Bytes (hex) | Açma Komutu |
|---|---|---|---|
| gzip | `.gz` | `1f 8b` | `gzip -d` |
| bzip2 | `.bz2` | `42 5a 68` | `bzip2 -d` |
| xz | `.xz` | `fd 37 7a 58 5a` | `xz -d` |
| zip | `.zip` | `50 4b 03 04` | `unzip` |
| tar | `.tar` | (offset 257'de `ustar`) | `tar -xf` |
| tar.gz | `.tar.gz` | `1f 8b` | `tar -xzf` |
| tar.bz2 | `.tar.bz2` | `42 5a 68` | `tar -xjf` |

---

## 🔄 Level 12 İş Akışı

Level 12'de hexdump'tan başlayıp şifreye ulaşmak için adım adım:

```bash
# 1. Hexdump'ı binary'ye çevir
xxd -r hexdump_data binary_data

# 2. Dosya türünü tespit et
xxd binary_data | head -n 1   # magic number'a bak
# 1f8b → gzip

# 3. Uygun uzantıyı ver ve aç
mv binary_data binary_data.gz
gzip -d binary_data.gz

# 4. Yeni dosyanın türünü kontrol et
xxd binary_data | head -n 1
# BZh → bzip2

mv binary_data binary_data.bz2
bzip2 -d binary_data.bz2

# Bu süreci şifre dosyasına ulaşana kadar tekrarla
# Her adımda: xxd → mv (doğru uzantı) → aç
```

---

## 📚 Hızlı Referans Tablosu

| Komut | Temel Kullanım | Ne Yapar |
|---|---|---|
| `base64` | `base64 -d dosya` | Base64 decode et |
| `base64` | `base64 dosya` | Base64 encode et |
| `xxd` | `xxd dosya \| head` | Hexdump göster |
| `xxd -r` | `xxd -r hex.txt binary` | Hex → binary çevir |
| `gzip -d` | `gzip -d dosya.gz` | gzip aç |
| `bzip2 -d` | `bzip2 -d dosya.bz2` | bzip2 aç |
| `tar -xf` | `tar -xf arşiv.tar` | Tar arşivi çıkar |
| `tar -czf` | `tar -czf arşiv.tar.gz klasor/` | Tar + gzip oluştur |
| `unzip` | `unzip arşiv.zip` | Zip aç |

---

## 🔗 Daha Fazla Bilgi

- [Dosya İmzaları (Magic Numbers)](https://en.wikipedia.org/wiki/List_of_file_signatures)
- [Base64 — Wikipedia](https://en.wikipedia.org/wiki/Base64)
- `man gzip` · `man bzip2` · `man tar`

---

**Önceki bölüm:** [metin_isleme.md](./metin_isleme.md)  
**Sonraki bölüm:** [ag.md](./ag.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
