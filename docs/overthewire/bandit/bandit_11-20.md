# 🏴 OverTheWire: Bandit — Level 11'den Level 20'ye Türkçe Rehber

> Bu bölümde encoding, sıkıştırma, ağ iletişimi, dosya izinleri ve SSH'ın ileri özellikleri öğreniliyor.  
> Konular giderek derinleşiyor — sabırla oku, her level bir öncekinin üstüne inşa ediliyor.

**Önceki bölüm:** [bandit_0-10.md](./bandit_0-10.md) | **Referans:** [mayadevbe.me](https://mayadevbe.me/posts/overthewire/bandit/overview/)

---

## Level 10 → Level 11 — Base64 Encoding

### 🔐 Bağlantı
```bash
ssh bandit10@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
`data.txt` Base64 ile kodlanmış. Şifreyi çöz.

### 📖 Teori: Base64 Nedir?

**Base64**, binary veriyi metin formatına çeviren bir kodlama şemasıdır. Görsel olarak genellikle sonda `==` işaretleriyle biter ama her zaman değil. E-posta ekleri, JWT token'ları gibi yerlerde sıkça kullanılır.

Linux'ta `base64` komutu hem kodlar hem de çözer:
- `base64 dosya` → kodlar
- `base64 -d dosya` → çözer (`--decode` de aynı şey)

### 🔧 Çözüm
```bash
bandit10@bandit:~$ cat data.txt
VGhlIHBhc3N3b3JkIGlzIElGdWt3S0dzRlc4TU9xM0lSRnFyeEUxaHhUTkViVVBSCg==

bandit10@bandit:~$ base64 -d data.txt
The password is <şifre buraya gelir>
```

---

## Level 11 → Level 12 — ROT13 Şifrelemesi

### 🔐 Bağlantı
```bash
ssh bandit11@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
`data.txt` içindeki tüm harfler 13 pozisyon kaydırılmış (ROT13). Geri çevir.

### 📖 Teori: ROT13 ve tr Komutu

**Substitution cipher (yer değiştirme şifresi):** Her harfi başka bir harfle değiştirir. En eskilerden biri Sezar şifresidir. **ROT13**, Latin alfabesinin 26 harfi olduğundan şifreleme ve çözme algoritması aynıdır (13+13=26).

```
A → N, B → O, C → P, ..., Z → M
```

Linux'ta `tr` (*translate*) komutu karakter dönüşümü yapar:
```
tr 'eski_karakterler' 'yeni_karakterler'
```

### 🔧 Çözüm
```bash
bandit11@bandit:~$ cat data.txt
Gur cnffjbeq vf 5Gr8L4qetPEsPk8htqjhRK8XSP6x2RHh

bandit11@bandit:~$ cat data.txt | tr 'A-Za-z' 'N-ZA-Mn-za-m'
The password is <şifre buraya gelir>
```

### 💡 Bonus — Alias Tanımlamak
Sık kullanılan `tr` komutunu kısaltmak için alias tanımlayabilirsin:
```bash
alias rot13="tr 'A-Za-z' 'N-ZA-Mn-za-m'"
alias rot5="tr '0-9' '5-90-4'"
```
Artık `cat data.txt | rot13` yazman yeterli.

---

## Level 12 → Level 13 — Hexdump ve Tekrarlı Sıkıştırma

### 🔐 Bağlantı
```bash
ssh bandit12@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
`data.txt` bir hexdump. Dosyayı geri döndür, ardından defalarca sıkıştırılmış katmanları aç.

### 📖 Teori: Hexdump, Sıkıştırma ve Magic Number

**Hexdump:** Binary veriyi hex formatında gösterir. Üç sütunu vardır: adres | hex değerleri | string karşılığı. `xxd` komutu hexdump oluşturur/geri döndürür:
- `xxd dosya` → hexdump oluşturur
- `xxd -r hexdump çıktıdosya` → geri döndürür

**Magic Number / Dosya imzası:** Her dosya tipi başında özel byte'lar taşır. `file` komutu bunu kullanır. Başlıcaları:
- `1f 8b` → gzip
- `42 5a 68` (BZh) → bzip2
- `75 73 74 61 72` → tar arşivi

**Sıkıştırma komutları:**
- `gzip -d dosya.gz` → gzip açar
- `bzip2 -d dosya.bz2` → bzip2 açar
- `tar -xf dosya.tar` → tar arşivini çıkarır

**Diğer yardımcılar:**
- `mkdir <yol>` → klasör oluşturur
- `cp <kaynak> <hedef>` → kopyalar
- `mv <kaynak> <hedef>` → taşır / yeniden adlandırır
- `mktemp -d` → /tmp içinde rastgele isimli geçici klasör oluşturur

### 🔧 Çözüm

**Adım 1 — Geçici çalışma klasörü oluştur:**
```bash
bandit12@bandit:~$ cd /tmp
bandit12@bandit:/tmp$ mktemp -d
/tmp/tmp.W5t1vua6G9
bandit12@bandit:/tmp$ cd /tmp/tmp.W5t1vua6G9
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ cp ~/data.txt .
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ mv data.txt hexdump_data
```

**Adım 2 — Hexdump'ı geri döndür:**
```bash
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ xxd -r hexdump_data compressed_data
```

**Adım 3 — Magic number'a bakarak sıkıştırma tipini tespit et ve aç:**
```bash
# İlk satırda 1f8b görüyorsun → gzip
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ mv compressed_data compressed_data.gz
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ gzip -d compressed_data.gz

# Sonra 42 5a 68 (BZh) görüyorsun → bzip2
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ mv compressed_data compressed_data.bz2
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ bzip2 -d compressed_data.bz2

# Sonra 1f8b yine → gzip
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ mv compressed_data compressed_data.gz
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ gzip -d compressed_data.gz

# İçinde "data5.bin" dosya adı görüyorsun → tar arşivi
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ mv compressed_data compressed_data.tar
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ tar -xf compressed_data.tar  # → data5.bin çıkar
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ tar -xf data5.bin             # → data6.bin çıkar

# data6.bin → bzip2
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ bzip2 -d data6.bin            # → data6.bin.out çıkar
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ tar -xf data6.bin.out         # → data8.bin çıkar

# data8.bin → gzip
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ mv data8.bin data8.gz
bandit12@bandit:/tmp/tmp.W5t1vua6G9$ gzip -d data8.gz

bandit12@bandit:/tmp/tmp.W5t1vua6G9$ cat data8
The password is <şifre buraya gelir>
```

> 💡 **İpucu:** Her adımda `xxd dosya | head` yazarak ilk birkaç byte'ı kontrol et. Magic number sana hangi komutu kullanacağını söyler.

---

## Level 13 → Level 14 — SSH Key ile Giriş ve Dosya Transferi

### 🔐 Bağlantı
```bash
ssh bandit13@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
Şifre yok — bunun yerine bir private SSH key var. Bunu kullanarak bandit14 olarak giriş yap. Şifre `/etc/bandit_pass/bandit14` dosyasında, sadece bandit14 okuyabilir.

### 📖 Teori: SSH Key ile Kimlik Doğrulama

SSH'a şifreyle giriş yerine **public-key cryptography** ile de giriş yapılabilir. Uzak sunucuya public key konur, sen private key'i kullanırsın. `-i` bayrağı private key dosyasını belirtir.

**`scp`** — SSH üzerinden dosya kopyalar:
```
scp -P <port> <kullanici>@<host>:<uzak_yol> <yerel_yol>
```

**`chmod`** — Dosya izinlerini değiştirir. SSH key dosyaları çok açık izinlere sahipse SSH bağlantıyı reddeder:
```bash
chmod 600 sshkey.private   # sadece sahibi okuyabilir/yazabilir
```

### 🔧 Çözüm

```bash
# Önce bandit13 olarak bağlan, key'i gör
bandit13@bandit:~$ ls
sshkey.private
bandit13@bandit:~$ exit

# Kendi makinende: key'i indir
$ scp -P 2220 bandit13@bandit.labs.overthewire.org:sshkey.private .

# İzinleri düzelt (yoksa "Permissions too open" hatası alırsın)
$ chmod 600 sshkey.private

# Key ile bandit14 olarak giriş yap
$ ssh -i sshkey.private bandit14@bandit.labs.overthewire.org -p 2220

# Şifreyi oku
bandit14@bandit:~$ cat /etc/bandit_pass/bandit14
```

### 🔧 Alternatif — Sunucu İçinden Geç
Kendi makinene indirmeden, doğrudan sunucu üzerinden de geçiş yapabilirsin:
```bash
bandit13@bandit:~$ ssh -i sshkey.private bandit14@localhost -p 2220
```

---

## Level 14 → Level 15 — Netcat ile Port İletişimi

### 🔐 Bağlantı
```bash
ssh -i sshkey.private bandit14@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
Bu level'ın şifresini `localhost:30000` portuna gönder, karşılığında bir sonraki level'ın şifresini al.

### 📖 Teori: Localhost ve Netcat

**Localhost:** Aynı makinenin kendisini ifade eden hostname. IP adresi `127.0.0.1`. Ağ servisleri test etmek için kullanılır.

**`nc` (netcat):** Ağ üzerinden veri okuyup yazan çok yönlü bir araç. TCP ve UDP destekler:
- `nc <host> <port>` → bir servise istemci olarak bağlan
- `nc -l <port>` → dinleyen sunucu başlat

### 🔧 Çözüm
```bash
# Önce bu level'ın şifresini bul
bandit14@bandit:~$ cat /etc/bandit_pass/bandit14
<mevcut şifre>

# Şifreyi port 30000'e gönder
bandit14@bandit:~$ nc localhost 30000
<mevcut şifre>
Correct!
<sonraki level'ın şifresi>
```

---

## Level 15 → Level 16 — OpenSSL ile Şifreli İletişim

### 🔐 Bağlantı
```bash
ssh bandit15@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
Bu level'ın şifresini `localhost:30001`'e **SSL şifrelemesiyle** gönder.

### 📖 Teori: SSL/TLS ve OpenSSL

**SSL/TLS:** Ağ trafiğini şifreleyen protokoller. HTTPS'nin altındaki teknolojidir. Düz `nc` ile SSL konuşan bir sunucuya bağlanamazsın — SSL el sıkışmasını anlayamaz.

**`openssl s_client`:** SSL/TLS kullanan sunuculara bağlanan basit bir istemci.

### 🔧 Çözüm
```bash
bandit15@bandit:~$ openssl s_client -connect localhost:30001
# (Bağlantı bilgileri çıkar, bekler)
<mevcut şifre>
Correct!
<sonraki level'ın şifresi>
```

> 💡 `HEARTBEATING` veya `Read R BLOCK` gibi mesajlar görürsen `R` tuşuna bas ya da `openssl s_client -connect localhost:30001 -ign_eof` kullan.

---

## Level 16 → Level 17 — Port Tarama (Nmap)

### 🔐 Bağlantı
```bash
ssh bandit16@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
31000-32000 arasındaki portlardan hangisi SSL konuşuyor ve doğru servisi barındırıyor? Şifreyi o porta gönder.

### 📖 Teori: Port Tarama ve Nmap

**Port:** Bir bilgisayardaki ağ servisinin adresi. 0-65535 arası numaralanır. HTTP=80, SSH=22 gibi standart portlar vardır.

**`nmap`:** Ağ tarayıcısı. Açık portları, çalışan servisleri tespit eder:
- `-p 31000-32000` → belirli port aralığını tara
- `-sV` → servis/versiyon tespiti yap

### 🔧 Çözüm
```bash
bandit16@bandit:~$ nmap -sV localhost -p 31000-32000
PORT      STATE SERVICE  VERSION
31046/tcp open  echo
31518/tcp open  ssl/echo
31691/tcp open  echo
31790/tcp open  ssl/unknown   ← bu!
31960/tcp open  echo
```

SSL kullanan iki port var: 31518 ve 31790. 31518 sadece echo yapıyor (gönderdiğini geri yansıtıyor). 31790 bilinmeyen — doğru hedef bu.

```bash
bandit16@bandit:~$ openssl s_client -connect localhost:31790
<mevcut şifre>
Correct!
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
```

Çıkan private key'i kaydet ve izinlerini düzenle:
```bash
bandit16@bandit:~$ nano /tmp/sshkey17.private   # key'i yapıştır
bandit16@bandit:~$ chmod 600 /tmp/sshkey17.private
bandit16@bandit:~$ ssh -i /tmp/sshkey17.private bandit17@localhost -p 2220
```

---

## Level 17 → Level 18 — İki Dosya Arasındaki Fark (diff)

### 🔐 Bağlantı
```bash
ssh -i sshkey17.private bandit17@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
`passwords.old` ve `passwords.new` arasında sadece bir satır değişmiş. O satırı bul.

### 📖 Teori: diff Komutu

`diff dosya1 dosya2` iki dosya arasındaki farkları gösterir:
- `<` → ilk dosyaya ait satır
- `>` → ikinci dosyaya ait satır
- `42c42` → 42. satırda değişiklik var

### 🔧 Çözüm
```bash
bandit17@bandit:~$ diff passwords.old passwords.new
42c42
< eski_şifre_satiri
---
> <yeni şifre — bu sonraki level'ın şifresi>
```

İkinci dosyayı (`passwords.new`) ikinci argüman olarak verdiğimizden `>` ile gösterilen satır yeni şifre.

### 🔧 Alternatif — sort + uniq
```bash
bandit17@bandit:~$ sort passwords.old passwords.new | uniq -u
# İki satır çıkar; hangisinin passwords.new'de olduğunu grep ile doğrula:
bandit17@bandit:~$ grep "<satir>" passwords.new
```

---

## Level 18 → Level 19 — SSH ile Uzaktan Komut Çalıştırma

### 🔐 Bağlantı
```bash
ssh bandit18@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
`readme` dosyası home dizininde. Ama `.bashrc` değiştirilmiş — girişte seni hemen atıyor!

### 📖 Teori: .bashrc ve SSH Remote Command

**`.bashrc`:** Her terminal açıldığında (SSH girişi dahil) çalışan script dosyası. Birisi buraya `exit` koymuş.

**SSH remote command:** SSH sadece terminal açmaz; bağlandığında doğrudan bir komut da çalıştırabilir:
```
ssh user@host -p port <komut>
```
Bu durumda `.bashrc` tam yüklenmeden komut çalışır ve shell açılmadan kapanır.

### 🔧 Çözüm
```bash
# Önce dosyayı listele
$ ssh bandit18@bandit.labs.overthewire.org -p 2220 ls
readme

# Direkt oku
$ ssh bandit18@bandit.labs.overthewire.org -p 2220 cat readme
<şifre buraya gelir>
```

### 🔧 Alternatif — Shell Spawn Etmek
Birden fazla komut çalıştırmak istersen shell spawn edebilirsin:
```bash
# Bash shell aç
ssh bandit18@bandit.labs.overthewire.org -p 2220 /bin/bash

# Ya da pseudo-terminal ile sh aç
ssh bandit18@bandit.labs.overthewire.org -p 2220 -t /bin/sh
```

---

## Level 19 → Level 20 — SUID Binary ve Linux İzinleri

### 🔐 Bağlantı
```bash
ssh bandit19@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
Home dizininde özel bir binary var. Onu kullanarak `/etc/bandit_pass/bandit20` dosyasını oku.

### 📖 Teori: Linux İzinleri ve SUID

`ls -l` çıktısındaki izin sütununu anlayalım:
```
-rwsr-x---  1 bandit20 bandit19 7296 bandit20-do
 ^^^
 rws → s burada SUID biti!
```

**SUID (Set User ID):** Normalde bir programı kim çalıştırırsa o kişinin yetkileriyle çalışır. SUID biti `x` yerine `s` olduğunda program, **çalıştıran kişi değil, dosyanın sahibi** olarak çalışır.

Yani:
- Binary'nin sahibi: `bandit20`
- Grubu: `bandit19` (sen bu grubun üyesisin)
- SUID biti: aktif → binary çalıştırıldığında `bandit20` yetkileriyle çalışır

Bu sayede `bandit20`'nin okuyabileceği `/etc/bandit_pass/bandit20` dosyasına erişebilirsin.

### 🔧 Çözüm
```bash
bandit19@bandit:~$ ls -la
-rwsr-x---  1 bandit20 bandit19 7296 May  7  2020 bandit20-do

# Binary ne yapıyor?
bandit19@bandit:~$ ./bandit20-do
Run a command as another user.
  Example: ./bandit20-do id

# Şifreyi oku
bandit19@bandit:~$ ./bandit20-do cat /etc/bandit_pass/bandit20
<şifre buraya gelir>
```

---

## 📚 Öğrenilen Komutlar Özeti (Level 11-20)

| Komut | Ne yapar |
|---|---|
| `base64 -d dosya` | Base64 kodlu dosyayı çözer |
| `tr 'A-Za-z' 'N-ZA-Mn-za-m'` | ROT13 uygular |
| `xxd dosya` | Hexdump oluşturur |
| `xxd -r hexdump çıktı` | Hexdump'ı geri döndürür |
| `gzip -d dosya.gz` | gzip sıkıştırmasını açar |
| `bzip2 -d dosya.bz2` | bzip2 sıkıştırmasını açar |
| `tar -xf dosya.tar` | Tar arşivini çıkarır |
| `mktemp -d` | /tmp'de geçici klasör oluşturur |
| `scp -P port user@host:uzak yerel` | SSH ile dosya kopyalar |
| `chmod 600 dosya` | Dosya izinlerini düzenler |
| `ssh -i key user@host -p port` | SSH key ile giriş yapar |
| `nc host port` | Bir porta TCP bağlantısı kurar |
| `openssl s_client -connect host:port` | SSL/TLS bağlantısı kurar |
| `nmap -sV host -p aralık` | Açık portları ve servisleri tarar |
| `diff dosya1 dosya2` | İki dosya arasındaki farkı gösterir |
| `ssh user@host komut` | SSH ile uzaktan komut çalıştırır |
| `./binary-do komut` | SUID binary ile farklı kullanıcı olarak çalıştırır |

---

**Sonraki bölüm:** [bandit_21-33.md](./bandit_21-33.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
