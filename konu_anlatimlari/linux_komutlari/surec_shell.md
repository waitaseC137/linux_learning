# ⚙️ Linux Komutları — Süreç & Shell

> Shell sadece komut çalıştırmak için değil — değişkenler, pipe'lar, yönlendirmeler  
> ve arka plan süreçleriyle güçlü iş akışları kurabilirsin.  
> Bu kavramlar Bandit'in script ve cron level'larının temelidir.

---

## 📋 İçindekiler

- [Pipe (|)](#pipe-)
- [Yönlendirme (> >> <)](#yönlendirme---)
- [2>/dev/null](#2devnull)
- [& (Arka Plan)](#-arka-plan)
- [jobs & fg & bg](#jobs--fg--bg)
- [Değişkenler ve $()](#değişkenler-ve-)
- [Özel Değişkenler](#özel-değişkenler)
- [echo -n](#echo--n)
- [Bash For Döngüsü](#bash-for-döngüsü)
- [Bash Script Temelleri](#bash-script-temelleri)
- [alias](#alias)
- [printenv & env](#printenv--env)

---

## Pipe (|)

**Pipe** — Bir komutun çıktısını bir sonraki komutun girişine bağlar.

### Temel Kullanım
```bash
komut1 | komut2             # komut1 çıktısı → komut2 girişi
komut1 | komut2 | komut3    # zincirleme
```

### Nasıl Çalışır?

```
cat data.txt | grep "test" | sort | uniq
     ^              ^          ^       ^
     |              |          |       tekrarları kaldır
     |              |          sırala
     |              "test" içerenleri filtrele
     dosyayı oku
```

Pipe olmadan aynı işlemi yapmak için geçici dosyalar gerekir:
```bash
cat data.txt > temp1.txt
grep "test" temp1.txt > temp2.txt
sort temp2.txt > temp3.txt
uniq temp3.txt
```

Pipe ile tek satır, geçici dosya yok!

### Yaygın Pipe Kombinasyonları

```bash
ls -la | grep ".txt"            # txt dosyalarını listele
ps aux | grep "python"          # python süreçlerini bul
cat /etc/passwd | cut -d: -f1   # kullanıcı adlarını al
find . -type f | wc -l          # dosya sayısını bul
cat log.txt | grep ERROR | wc -l # hata sayısını bul
history | grep "ssh"            # ssh komut geçmişi
```

### Bandit'te Kullanım
```bash
# Level 7: metin içi arama
cat data.txt | grep millionth

# Level 8: sırala + tekil bul
sort data.txt | uniq -u

# Level 9: binary'den metin + filtrele
strings data.txt | grep "==="

# Level 22: hash hesapla
echo I am user bandit23 | md5sum | cut -d ' ' -f 1
```

---

## Yönlendirme (> >> <)

**Yönlendirme** — Komutların girdi/çıktılarını dosyalara veya başka kaynaklara yönlendirir.

### Çıktı Yönlendirme

```bash
komut > dosya       # çıktıyı dosyaya yaz (var olanı siler!)
komut >> dosya      # çıktıyı dosyaya ekle (var olana ekler)
```

```bash
echo "Merhaba" > dosya.txt      # dosya.txt içine yazar
echo "Dünya" >> dosya.txt       # sonuna ekler
ls -la > liste.txt              # ls çıktısını kaydet
```

### Girdi Yönlendirme

```bash
komut < dosya       # dosyadan oku
```

```bash
wc -l < dosya.txt   # dosya içeriğini wc'ye ver
sort < data.txt     # data.txt'i sort'a ver
```

### Hata Yönlendirme

Linux'ta iki çıktı kanalı vardır:
- **stdout (1):** Normal çıktı
- **stderr (2):** Hata çıktısı

```bash
komut 2> hata.txt           # hata çıktısını dosyaya yaz
komut 2>&1                  # hata çıktısını stdout'a yönlendir
komut > cikti.txt 2>&1      # ikisini de dosyaya yaz
komut &> dosya.txt          # kısaltma: ikisini de dosyaya yaz
komut 2>/dev/null           # hataları gizle
```

### /dev/null Nedir?

`/dev/null` Linux'taki "kara delik". Oraya gönderilen her şey yok olur. Komut çalışır ama çıktısı gösterilmez.

```bash
# Sadece başarılı çıktıyı gör, hataları gizle
find / -name "*.conf" 2>/dev/null

# Çıktıyı tamamen gizle
komut > /dev/null 2>&1
```

### Bandit'te Kullanım
```bash
# Level 6: Permission denied hatalarını gizle
find / -user bandit7 -group bandit6 -size 33c 2>/dev/null

# Level 23: cron job çıktısını /dev/null'a yönlendir
* * * * * bandit22 /usr/bin/cronjob.sh &> /dev/null
```

---

## 2>/dev/null

Özellikle `find` komutunda çok kullanılır. Detaylı açıklama:

```bash
find / -name "secret.txt"
# Onlarca "Permission denied: /proc/..." hatası alırsın
# Gerçek sonucu bulmak zorlaşır

find / -name "secret.txt" 2>/dev/null
# Sadece bulunan dosyaları gösterir
```

**`2>` ne demek?**
- `1>` veya `>` → stdout yönlendir
- `2>` → stderr yönlendir
- `2>&1` → stderr'i stdout'a yönlendir

---

## & (Arka Plan)

Komutun sonuna `&` eklemek onu **arka planda** çalıştırır. Terminal serbest kalır, başka komut girebilirsin.

### Temel Kullanım
```bash
komut &             # arka planda başlat
sleep 10 &          # 10 saniye bekle (arka planda)
```

```bash
$ sleep 10 &
[1] 12345           # [iş no] PID
$                   # terminal hemen serbest kalır
```

### Neden Kullanılır?

```bash
# Arka planda sunucu başlat, öne gelip client çalıştır
nc -l -p 1234 &
nc localhost 1234

# Uzun süren işlemi arka plana al
tar -czf yedek.tar.gz /home/ &
```

### Bandit'te Kullanım
```bash
# Level 20: netcat sunucuyu arka plana al, sonra binary çalıştır
echo -n 'şifre' | nc -l -p 1234 &
[1] 12345
./suconnect 1234
# Password matches!
[1]+ Done
```

---

## jobs & fg & bg

**jobs** — Arka plandaki süreçleri listeler.  
**fg** — Arka plan sürecini öne alır.  
**bg** — Durmuş süreci arka planda devam ettirir.

### Temel Kullanım
```bash
jobs                # arka plan süreçlerini listele
fg                  # son arka plan sürecini öne al
fg %1               # 1 numaralı işi öne al
bg %1               # 1 numaralı işi arka planda devam ettir
```

### Ctrl+Z ve Ctrl+C

| Kısayol | Etkisi |
|---|---|
| `Ctrl+C` | Süreci sonlandır |
| `Ctrl+Z` | Süreci durdur (arka plana al, çalışmıyor) |
| `Ctrl+D` | EOF gönder (stdin'i kapat) |

```bash
$ sleep 100
^Z                  # Ctrl+Z
[1]+  Stopped    sleep 100
$ bg %1             # arka planda devam ettir
[1]+ sleep 100 &
$ jobs
[1]+  Running    sleep 100 &
$ fg %1             # öne al
sleep 100
^C                  # sonlandır
```

---

## Değişkenler ve $()

### Değişken Tanımlama

```bash
isim="Robin"            # değer ata (boşluk olmamalı!)
echo $isim              # kullan
echo ${isim}            # süslü parantez ile (daha güvenli)
echo "${isim}li"        # string içinde: Robinli
```

### Komut Çıktısını Değişkene Atama

```bash
# $() sözdizimi (önerilen)
sonuc=$(whoami)
echo $sonuc

# Backtick sözdizimi (eski yöntem, aynı şey)
sonuc=`whoami`
```

### Değişken Türleri

```bash
# String
ad="Merhaba"

# Sayı (bash her şeyi string olarak saklar ama aritmetik yapılabilir)
sayi=42
sonuc=$((sayi + 8))     # 50

# Dizi
dizi=("elma" "armut" "kiraz")
echo ${dizi[0]}          # elma
echo ${dizi[@]}          # hepsi
```

### Bandit'te Kullanım
```bash
# Level 22: whoami + md5sum zinciri
myname=$(whoami)
mytarget=$(echo I am user $myname | md5sum | cut -d ' ' -f 1)
echo $mytarget

# Level 23: cron script'inde değişken kullanımı
myname=$(whoami)    # bandit23
```

---

## Özel Değişkenler

Linux shell'inde önceden tanımlanmış değişkenler:

| Değişken | Anlamı |
|---|---|
| `$0` | Script/shell adı |
| `$1`, `$2`... | Script argümanları |
| `$#` | Argüman sayısı |
| `$@` | Tüm argümanlar |
| `$?` | Son komutun çıkış kodu (0=başarı) |
| `$$` | Mevcut shell'in PID'i |
| `$!` | Son arka plan sürecinin PID'i |
| `$HOME` | Home dizini |
| `$PATH` | Komut arama yolları |
| `$USER` | Kullanıcı adı |
| `$SHELL` | Mevcut shell |
| `$PWD` | Mevcut dizin |

```bash
echo $HOME      # /home/robin
echo $PATH      # /usr/bin:/usr/local/bin:...
echo $?         # 0 (son komut başarılı)
echo $$         # 12345 (mevcut PID)
echo $0         # /bin/bash
```

### Bandit'te Kullanım
```bash
# Level 32: Uppercase shell'den kaçış
# Her şey büyük harfe çevriliyor ama $0 değişkeni değil!
>> $0
$               # normal shell açıldı!
# $0 = mevcut shell = /bin/sh → yeni shell spawn etti
```

---

## echo -n

`echo` varsayılan olarak satır sonu (`\n`) ekler. `-n` bayrağı bunu engeller.

```bash
echo "test"         # "test\n" yazar
echo -n "test"      # "test" yazar (satır sonu yok)
```

### Neden Önemli?

Netcat ve bazı protokoller satır sonuna duyarlıdır. Fazladan `\n` bağlantıyı bozabilir:

```bash
# Yanlış: "şifre\n" gönderir
echo 'şifre' | nc -l -p 1234

# Doğru: "şifre" gönderir (satır sonu yok)
echo -n 'şifre' | nc -l -p 1234
```

### Bandit'te Kullanım
```bash
# Level 20: şifreyi tam olarak gönder
echo -n 'GbKksEFF4yrVs6il55v6gwY5aVje5f0j' | nc -l -p 1234 &
```

---

## Bash For Döngüsü

### Temel Sözdizimi
```bash
for degisken in liste; do
    komutlar
done
```

### Çeşitli Kullanımlar

```bash
# Sayı aralığı
for i in {1..10}; do
    echo $i
done

# Başında sıfır olan sayılar
for i in {0000..9999}; do
    echo $i
done

# C tarzı döngü
for ((i=0; i<10; i++)); do
    echo $i
done

# Dosyalar üzerinde
for dosya in *.txt; do
    echo "İşleniyor: $dosya"
    cat $dosya
done

# Diziler üzerinde
for kullanici in bandit0 bandit1 bandit2; do
    echo $kullanici
done
```

### Bandit'te Kullanım
```bash
# Level 24: 10000 PIN kombinasyonunu dene
for i in {0000..9999}; do
    echo "UoMYTrfrBFHyQXmg6gzctqAwOmw1IohZ $i" >> liste.txt
done
cat liste.txt | nc localhost 30002 > sonuc.txt
grep -v "Wrong" sonuc.txt
```

---

## Bash Script Temelleri

### Shebang

Her script'in ilk satırı hangi yorumlayıcıyı kullanacağını belirtir:

```bash
#!/bin/bash     # bash kullan
#!/bin/sh       # POSIX sh kullan
#!/usr/bin/env python3  # python3 kullan
```

### Çalıştırma İzni

```bash
chmod +x script.sh    # çalıştırılabilir yap
./script.sh           # çalıştır
bash script.sh        # doğrudan bash ile çalıştır
```

### Basit Script Örneği

```bash
#!/bin/bash

# Değişken tanımla
HEDEF_KULLANICI="bandit24"

# Komut çalıştır
HASH=$(echo "I am user $HEDEF_KULLANICI" | md5sum | cut -d ' ' -f 1)

# Çıktı yaz
echo "Hash: $HASH"
cat /tmp/$HASH
```

### If/Else

```bash
#!/bin/bash
if [ -f "dosya.txt" ]; then
    echo "Dosya var"
else
    echo "Dosya yok"
fi

# String karşılaştırma
if [ "$degisken" = "deger" ]; then
    echo "Eşit"
fi

# Sayı karşılaştırma
if [ $sayi -gt 10 ]; then
    echo "10'dan büyük"
fi
```

### Test Koşulları

| Koşul | Anlamı |
|---|---|
| `-f dosya` | Dosya var mı? |
| `-d dizin` | Dizin var mı? |
| `-e yol` | Yol var mı? |
| `-r dosya` | Okunabilir mi? |
| `-x dosya` | Çalıştırılabilir mi? |
| `-z string` | String boş mu? |
| `-n string` | String dolu mu? |
| `str1 = str2` | Stringler eşit mi? |
| `n1 -eq n2` | Sayılar eşit mi? |
| `n1 -gt n2` | n1 > n2? |
| `n1 -lt n2` | n1 < n2? |

### Bandit'te Kullanım
```bash
# Level 23: cron için script yaz
#!/bin/bash
cat /etc/bandit_pass/bandit24 > /tmp/mywork/password

# Level 24: brute force scripti
#!/bin/bash
for i in {0000..9999}; do
    echo "ŞIFRE $i" >> liste.txt
done
cat liste.txt | nc localhost 30002 > sonuc.txt
```

---

## alias

**Alias** — Uzun komutlara kısa isimler verir.

### Temel Kullanım
```bash
alias kisa='uzun komut'         # alias tanımla
alias                           # tüm alias'ları listele
unalias kisa                    # alias sil
```

### Örnekler

```bash
alias ll='ls -la'
alias la='ls -A'
alias rot13="tr 'A-Za-z' 'N-ZA-Mn-za-m'"
alias grep='grep --color=auto'
alias ..='cd ..'
alias ...='cd ../..'
```

### Kalıcı Alias

Alias'lar terminal kapanınca kaybolur. Kalıcı yapmak için `~/.bashrc` veya `~/.bash_aliases` dosyasına ekle:

```bash
echo "alias ll='ls -la'" >> ~/.bashrc
source ~/.bashrc    # değişiklikleri yükle
```

### Bandit'te Kullanım
```bash
# ROT13 için kısa yol
alias rot13="tr 'A-Za-z' 'N-ZA-Mn-za-m'"
cat data.txt | rot13
```

---

## printenv & env

**printenv** — Ortam değişkenlerini listeler.  
**env** — Ortam değişkenlerini listeler veya özel ortamla komut çalıştırır.

### Temel Kullanım
```bash
printenv                    # tüm ortam değişkenlerini listele
printenv HOME               # belirli değişkeni göster
env                         # tüm ortam değişkenlerini listele
env VAR=deger komut         # özel değişkenle komut çalıştır
env -i komut                # boş ortamla çalıştır
```

### Ortam Değişkeni Ayarlama

```bash
export DEGISKEN="deger"     # export ile kalıcı
DEGISKEN="deger" komut      # sadece o komut için

# EGG değişkeni (Narnia)
export EGG=$(python -c 'print "\x31\xc0..."')
./narnia1                   # EGG'i okur
```

### Bandit'te Kullanım
```bash
# Level 25-26: bandit26'nın shell'ini bul
cat /etc/passwd | grep bandit26
printenv SHELL              # mevcut shell'i gör
```

---

## 📚 Hızlı Referans Tablosu

| Komut/Sözdizim | Kullanım | Ne Yapar |
|---|---|---|
| `\|` | `cmd1 \| cmd2` | cmd1 çıktısını cmd2'ye bağla |
| `>` | `cmd > dosya` | Çıktıyı dosyaya yaz |
| `>>` | `cmd >> dosya` | Çıktıyı dosyaya ekle |
| `<` | `cmd < dosya` | Dosyadan oku |
| `2>/dev/null` | `find / 2>/dev/null` | Hataları gizle |
| `&` | `cmd &` | Arka planda çalıştır |
| `jobs` | `jobs` | Arka plan süreçlerini listele |
| `fg` | `fg %1` | Arka plan sürecini öne al |
| `$()` | `x=$(whoami)` | Komut çıktısını değişkene at |
| `$0` | `echo $0` | Mevcut shell adı |
| `echo -n` | `echo -n "test"` | Satır sonu olmadan yaz |
| `for` | `for i in {1..10}` | Döngü |
| `alias` | `alias ll='ls -la'` | Kısayol tanımla |
| `export` | `export VAR=deger` | Ortam değişkeni tanımla |
| `printenv` | `printenv PATH` | Ortam değişkenini göster |

---

## 🔗 Daha Fazla Bilgi

- `man bash` — bash kılavuzu
- [Bash Guide for Beginners](https://tldp.org/LDP/Bash-Beginners-Guide/html/)
- [ShellCheck](https://www.shellcheck.net/) — script hatalarını bul

---

**Önceki bölüm:** [izinler_kullanici.md](./izinler_kullanici.md)  
**Sonraki bölüm:** [git.md](./git.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
