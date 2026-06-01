# 📁 Linux Komutları — Dosya Sistemi

> Linux'ta her şey bir dosyadır. Dizinler, aygıtlar, hatta ağ soketleri bile.  
> Bu yüzden dosya sistemi komutlarını iyi bilmek, Linux'ta gezinmenin temelidir.

---

## 📋 İçindekiler

- [pwd](#pwd)
- [ls](#ls)
- [cd](#cd)
- [cat](#cat)
- [file](#file)
- [find](#find)
- [mkdir](#mkdir)
- [cp](#cp)
- [mv](#mv)
- [touch](#touch)
- [mktemp](#mktemp)
- [du](#du)

---

## pwd

**Print Working Directory** — Bulunduğun dizini gösterir.

```bash
$ pwd
/home/robin
```

Terminalin promtunda `~` sembolü home dizinini temsil eder. Tam yolu görmek için `pwd` kullanırsın.

---

## ls

**List** — Dizin içeriğini listeler.

### Temel Kullanım
```bash
ls              # mevcut dizini listele
ls /tmp         # belirli bir dizini listele
ls dosya.txt    # tek dosyayı listele
```

### Önemli Bayraklar

| Bayrak | Açıklama | Örnek |
|---|---|---|
| `-l` | Detaylı liste (izinler, sahip, boyut, tarih) | `ls -l` |
| `-a` | Gizli dosyaları da göster (`.` ile başlayanlar) | `ls -a` |
| `-la` veya `-al` | Detaylı + gizli | `ls -la` |
| `-h` | Boyutları okunabilir göster (KB, MB) | `ls -lh` |
| `-r` | Ters sırada listele | `ls -r` |
| `-t` | Tarihe göre sırala (yeniden eskiye) | `ls -lt` |
| `-R` | Alt dizinleri de listele (recursive) | `ls -R` |

### Detaylı Liste Çıktısını Okumak

```bash
$ ls -la
drwxr-x---  2 bandit1 bandit1 4096 May  7 2020 .
drwxr-xr-x 41 root    root    4096 May  7 2020 ..
-rw-r-----  1 bandit2 bandit1   33 May  7 2020 -
^            ^ ^       ^        ^               ^
|            | |       |        |               dosya adı
|            | |       |        boyut (byte)
|            | |       grup
|            | sahip (kullanıcı)
|            link sayısı
izinler
```

**İzin sütunu:** `drwxr-xr-x`
```
d → dizin (- ise dosya, l ise sembolik link)
rwx → sahip izinleri (read/write/execute)
r-x → grup izinleri
r-x → diğer kullanıcı izinleri
```

### Bandit'te Kullanım
```bash
# Level 3: gizli dosyayı bulmak için
ls -la inhere/

# Level 19: SUID biti görmek için
ls -la
# -rwsr-x--- → 'rws' kısmındaki 's' = SUID biti
```

---

## cd

**Change Directory** — Dizin değiştirir.

### Temel Kullanım
```bash
cd /tmp             # tam yol ile git
cd inhere           # göreli yol ile git
cd ..               # bir üst dizine çık
cd ~                # home dizinine dön
cd -                # önceki dizine dön
cd /                # kök dizinine git
```

### Özel Dizin Sembolleri

| Sembol | Anlamı |
|---|---|
| `.` | Mevcut dizin |
| `..` | Üst dizin |
| `~` | Home dizini (`/home/kullanici`) |
| `-` | Önceki dizin |
| `/` | Kök dizin |

### Göreli vs Tam Yol

```bash
# Tam yol (her zaman / ile başlar)
cd /home/bandit0/inhere

# Göreli yol (mevcut konumdan)
cd inhere           # mevcut dizinde 'inhere' klasörüne gir
cd ../inhere        # bir üst dizine çıkıp 'inhere'e gir
```

### Bandit'te Kullanım
```bash
# Level 3: inhere klasörüne girmek için
cd inhere
ls -la              # gizli dosyayı gör
cat .hidden
```

---

## cat

**Concatenate** — Dosya içeriğini terminale basar. Birden fazla dosyayı birleştirerek de gösterebilir.

### Temel Kullanım
```bash
cat dosya.txt               # dosyayı oku
cat dosya1.txt dosya2.txt   # iki dosyayı birleştirip göster
cat > yeni.txt              # klavyeden okuyup dosyaya yaz (Ctrl+D ile bitir)
cat dosya1.txt >> dosya2.txt # dosya1'i dosya2'nin sonuna ekle
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `-n` | Satır numarası göster |
| `-A` | Görünmez karakterleri göster (`$` = satır sonu, `^I` = tab) |
| `-s` | Ardışık boş satırları teke indir |

### Özel Durumlar

**`-` adlı dosyayı okumak:**
```bash
# YANLIŞ — stdin'i okur, dosyayı değil
cat -

# DOĞRU — ./ ile mevcut dizini belirt
cat ./-
```

**İsimde boşluk olan dosyayı okumak:**
```bash
# Tırnak içine al
cat "spaces in this filename"

# Ya da backslash ile escape et
cat spaces\ in\ this\ filename
```

> 💡 **Tab ile otomatik tamamlama:** Dosya adının başını yazıp Tab'a basarsan, boşluklar otomatik escape edilir.

### Bandit'te Kullanım
```bash
# Level 0: readme dosyasını oku
cat readme

# Level 1: - adlı dosyayı oku
cat ./-

# Level 2: boşluklu dosyayı oku
cat "spaces in this filename"

# Level 3: gizli dosyayı oku
cat .hidden
```

---

## file

**File Type** — Dosyanın türünü söyler. Uzantıya değil, dosyanın içeriğine (magic bytes) bakarak karar verir.

### Temel Kullanım
```bash
file dosya.txt      # tek dosyanın türü
file ./*            # mevcut dizindeki tüm dosyaların türü
file /bin/ls        # sistem binary'lerini de kontrol edebilirsin
```

### Örnek Çıktılar

```bash
$ file ./*
./-file00: data                          # binary / okunaksız veri
./-file01: ASCII text                    # düz metin
./-file02: ELF 64-bit LSB executable    # çalıştırılabilir program
./-file03: gzip compressed data         # sıkıştırılmış dosya
./-file04: JPEG image data              # resim
./-file05: Perl script text             # script
```

### Magic Bytes Nedir?

Her dosya türü başında özel byte'lar taşır. `file` komutu bunlara bakarak türü tespit eder:

| Dosya Türü | Magic Bytes (hex) |
|---|---|
| gzip | `1f 8b` |
| bzip2 | `42 5a 68` |
| ZIP | `50 4b 03 04` |
| JPEG | `ff d8 ff` |
| PNG | `89 50 4e 47` |
| ELF (binary) | `7f 45 4c 46` |

### Bandit'te Kullanım
```bash
# Level 4: 10 dosya arasından okunabilir olanı bul
cd inhere
file ./*
# ./-file07: ASCII text ← bu!
cat ./-file07
```

---

## find

**Find** — Dosya ve dizinleri kriterlere göre arar.

### Temel Kullanım
```bash
find .              # mevcut dizin ve altındaki her şeyi listele
find /tmp           # /tmp'de ara
find / -name "*.txt"  # tüm sistemde .txt uzantılı dosyaları bul
```

### Önemli Bayraklar

| Bayrak | Açıklama | Örnek |
|---|---|---|
| `-name "pattern"` | Dosya adına göre ara | `find . -name "*.txt"` |
| `-iname "pattern"` | Büyük/küçük harf duyarsız | `find . -iname "readme"` |
| `-type f` | Sadece dosyalar | `find . -type f` |
| `-type d` | Sadece dizinler | `find . -type d` |
| `-size N` | Boyuta göre ara | `find . -size 1033c` |
| `-user kullanici` | Sahibine göre ara | `find . -user bandit7` |
| `-group grup` | Grubuna göre ara | `find . -group bandit6` |
| `-perm 644` | İzinlere göre ara | `find . -perm 644` |
| `-executable` | Çalıştırılabilir dosyalar | `find . -executable` |
| `! -executable` | Çalıştırılamaz dosyalar | `find . ! -executable` |
| `-readable` | Okunabilir dosyalar | `find . -readable` |
| `-mtime N` | N gün önce değiştirilmiş | `find . -mtime -7` |
| `-exec cmd {} \;` | Bulunan her dosyaya komut uygula | `find . -exec cat {} \;` |

### Boyut Birimleri

| Birim | Anlamı |
|---|---|
| `c` | byte |
| `k` | kilobyte |
| `M` | megabyte |
| `G` | gigabyte |

```bash
find . -size 33c      # tam 33 byte
find . -size +1M      # 1 MB'den büyük
find . -size -10k     # 10 KB'den küçük
```

### Birden Fazla Kriter

```bash
# VE (her iki koşul da sağlanmalı — varsayılan)
find . -type f -size 33c -user bandit7

# VEYA
find . -name "*.txt" -o -name "*.md"

# DEĞİL
find . ! -executable
```

### -exec ile Kullanım

```bash
# Bulunan her dosyanın içeriğini oku
find . -type f -exec cat {} \;

# Bulunan her dosyanın türünü göster
find . -type f -exec file {} \;

# -exec yerine pipe + xargs da kullanılabilir
find . -type f | xargs cat
```

### Bandit'te Kullanım
```bash
# Level 5: boyut + çalıştırılamaz + okunabilir
find . -type f -size 1033c ! -executable -exec file '{}' \; | grep ASCII

# Level 6: tüm sistemde kullanıcı + grup + boyut
find / -type f -user bandit7 -group bandit6 -size 33c 2>/dev/null
```

---

## mkdir

**Make Directory** — Yeni dizin oluşturur.

### Temel Kullanım
```bash
mkdir yeniKlasor              # tek dizin oluştur
mkdir -p a/b/c                # iç içe dizinleri tek seferde oluştur
mkdir klasor1 klasor2         # birden fazla dizin oluştur
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `-p` | Ara dizinleri de oluştur, var olanlarda hata verme |
| `-m 755` | İzinleri belirterek oluştur |

```bash
# -p olmadan hata alırsın
mkdir a/b/c        # hata: 'a' yok

# -p ile sorunsuz çalışır
mkdir -p a/b/c     # a, a/b ve a/b/c'yi oluşturur
```

### Bandit'te Kullanım
```bash
# Level 12: geçici çalışma klasörü
mkdir /tmp/mywork
cd /tmp/mywork

# Level 3 (Narnia): exploit için
mkdir /tmp/ex3
mkdir /tmp/ex3/$(python -c 'print "A"*22')
```

---

## cp

**Copy** — Dosya veya dizin kopyalar.

### Temel Kullanım
```bash
cp kaynak hedef               # dosyayı kopyala
cp kaynak /tmp/               # dizine kopyala (aynı isimle)
cp dosya1 dosya2 /tmp/        # birden fazla dosyayı dizine kopyala
cp -r klasor /tmp/            # dizini içeriğiyle kopyala
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `-r` veya `-R` | Dizini içeriğiyle kopyala (recursive) |
| `-p` | İzin, sahip ve tarihi koru |
| `-i` | Üzerine yazmadan önce sor |
| `-v` | Ne yapıldığını göster (verbose) |
| `-u` | Sadece daha yeni olanı kopyala |

### Bandit'te Kullanım
```bash
# Level 12: veriyi geçici klasöre kopyala
cp ~/data.txt /tmp/mywork/
```

---

## mv

**Move** — Dosyayı taşır veya yeniden adlandırır.

### Temel Kullanım
```bash
mv eski_ad yeni_ad            # yeniden adlandır
mv dosya /tmp/                # farklı konuma taşı
mv dosya /tmp/yeni_ad         # taşı ve yeniden adlandır
mv *.txt /tmp/                # birden fazla dosyayı taşı
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `-i` | Üzerine yazmadan önce sor |
| `-v` | Ne yapıldığını göster |
| `-n` | Var olan dosyanın üzerine yazma |

### Bandit'te Kullanım
```bash
# Level 12: hexdump dosyasını doğru uzantıyla yeniden adlandır
mv compressed_data compressed_data.gz
gzip -d compressed_data.gz

mv data8.bin data8.gz
gzip -d data8.gz
```

---

## touch

**Touch** — Boş dosya oluşturur veya dosyanın erişim/değiştirilme tarihini günceller.

### Temel Kullanım
```bash
touch yeni_dosya.txt          # boş dosya oluştur
touch var_olan_dosya.txt      # tarihi güncelle
touch dosya1 dosya2 dosya3    # birden fazla dosya oluştur
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `-t YYYYMMDDHHMM` | Belirli bir tarih ata |
| `-a` | Sadece erişim tarihini güncelle |
| `-m` | Sadece değiştirilme tarihini güncelle |

### Bandit'te Kullanım
```bash
# Level 23 (Cron): cron'un yazacağı çıktı dosyasını oluştur
touch /tmp/mywork/password
chmod 777 /tmp/mywork/password
```

---

## mktemp

**Make Temporary** — `/tmp` altında benzersiz geçici dosya veya dizin oluşturur.

### Temel Kullanım
```bash
mktemp                        # geçici dosya oluştur
mktemp -d                     # geçici dizin oluştur
mktemp /tmp/myapp.XXXXXX      # özel isim kalıbıyla oluştur
```

`X` karakterleri rastgele karakterlerle değiştirilir.

### Neden mktemp Kullanılır?

`/tmp/mywork` gibi sabit isimler başka kullanıcılarla çakışabilir veya güvenlik açığı oluşturabilir. `mktemp` her seferinde benzersiz bir isim üretir.

```bash
$ mktemp -d
/tmp/tmp.K7aX92mLpQ    # rastgele isim — her seferinde farklı
```

### Bandit'te Kullanım
```bash
# Level 12: güvenli geçici çalışma alanı
TMPDIR=$(mktemp -d)
cd $TMPDIR
cp ~/data.txt .
```

---

## du

**Disk Usage** — Dosya ve dizinlerin disk kullanımını gösterir.

### Temel Kullanım
```bash
du dosya.txt                  # dosyanın boyutu
du klasor/                    # dizinin toplam boyutu
du -a                         # tüm dosyaları ayrı ayrı göster
du -sh *                      # mevcut dizindeki her şeyin boyutu
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `-b` | Byte cinsinden göster |
| `-k` | Kilobyte cinsinden göster (varsayılan) |
| `-m` | Megabyte cinsinden göster |
| `-h` | Okunabilir format (KB, MB, GB) |
| `-s` | Sadece toplam göster |
| `-a` | Tüm dosyaları ayrı ayrı listele |

### Bandit'te Kullanım
```bash
# Level 5: belirli boyuttaki dosyayı bul
du -b -a | grep 1033
# 1033    ./maybehere07/.file2

# Level 7: dosya boyutunu kontrol et
du -b data.txt
# 4184396 data.txt
```

---

## 📚 Hızlı Referans Tablosu

| Komut | Temel Kullanım | Ne Yapar |
|---|---|---|
| `pwd` | `pwd` | Mevcut dizini göster |
| `ls` | `ls -la` | Dosyaları listele (gizliler dahil, detaylı) |
| `cd` | `cd /tmp` | Dizin değiştir |
| `cat` | `cat dosya` | Dosya içeriğini göster |
| `file` | `file ./*` | Dosya türlerini göster |
| `find` | `find / -name "*.txt"` | Dosya ara |
| `mkdir` | `mkdir -p a/b/c` | Dizin oluştur |
| `cp` | `cp kaynak hedef` | Dosya kopyala |
| `mv` | `mv eski yeni` | Dosya taşı/adlandır |
| `touch` | `touch dosya` | Boş dosya oluştur |
| `mktemp` | `mktemp -d` | Geçici dizin oluştur |
| `du` | `du -b dosya` | Dosya boyutunu göster |

---

## 🔗 Daha Fazla Bilgi

- `man ls` — herhangi bir komutun detaylı kılavuzu
- [Linux Man Pages](https://manpages.ubuntu.com/)
- [Explain Shell](https://explainshell.com/) — komutları görsel açıklar

---

**Sonraki bölüm:** [metin_isleme.md](./metin_isleme.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
