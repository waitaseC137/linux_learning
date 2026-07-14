# 🌐 Linux Komutları — Ağ

> Linux'ta ağ araçları hem sistem yönetimi hem de güvenlik testleri için  
> vazgeçilmezdir. SSH'tan port taramaya, netcat'ten SSL bağlantısına kadar  
> bu araçlar Bandit'in en kritik level'larında kullanıldı.

---

## 📋 İçindekiler

- [ssh](#ssh)
- [scp](#scp)
- [nc (netcat)](#nc-netcat)
- [openssl](#openssl)
- [nmap](#nmap)
- [curl](#curl)
- [wget](#wget)

---

## ssh

**Secure Shell** — Uzak sunuculara şifreli bağlantı kurar.

### SSH Nedir?

SSH iki bilgisayar arasındaki iletişimi şifreler. Telnet gibi eski protokollerin aksine, şifreler ve komutlar ağ üzerinde düz metin olarak gitmez.

```
Yerel Makine ─── Şifreli Tünel ──→ Uzak Sunucu
```

### Temel Kullanım
```bash
ssh kullanici@sunucu                   # varsayılan port 22
ssh kullanici@sunucu -p 2220           # özel port
ssh -i anahtar.pem kullanici@sunucu    # private key ile
ssh kullanici@sunucu komut             # uzaktan komut çalıştır
```

### Önemli Bayraklar

| Bayrak | Açıklama | Örnek |
|---|---|---|
| `-p PORT` | Port belirt | `-p 2220` |
| `-i DOSYA` | Private key dosyası | `-i ~/.ssh/id_rsa` |
| `-v` | Verbose (debug çıktısı) | `-v` |
| `-vv` | Daha fazla debug | `-vv` |
| `-t` | Pseudo-terminal zorla | `-t /bin/sh` |
| `-L PORT:HOST:PORT` | Local port yönlendirme | `-L 8080:localhost:80` |
| `-N` | Komut çalıştırma, sadece tünel | `-N -L 8080:...` |
| `-X` | X11 forwarding (GUI uygulamaları) | `-X` |

### SSH Key ile Giriş

Şifreli girişten daha güvenlidir. İki anahtar oluşturulur:
- **Private key** → sende kalır, kimseye verme
- **Public key** → sunucuya eklenir (`~/.ssh/authorized_keys`)

```bash
# Anahtar çifti oluştur
ssh-keygen -t ed25519 -C "mail@example.com"

# Public key'i sunucuya kopyala
ssh-copy-id kullanici@sunucu

# Artık şifre olmadan giriş yapabilirsin
ssh kullanici@sunucu
```

### SSH Config Dosyası

Sık kullandığın bağlantıları `~/.ssh/config` dosyasına kaydedebilirsin:

```
Host bandit
    HostName bandit.labs.overthewire.org
    Port 2220
    User bandit0
```

```bash
# Artık sadece şunu yazman yeterli:
ssh bandit
```

### Uzaktan Komut Çalıştırma

```bash
# Tek komut çalıştır
ssh kullanici@sunucu ls /home

# Birden fazla komut
ssh kullanici@sunucu "ls /home; whoami"

# Shell aç (.bashrc bypass)
ssh kullanici@sunucu /bin/bash
ssh kullanici@sunucu -t /bin/sh
```

### Bandit'te Kullanım
```bash
# Level 0: bağlan
ssh bandit0@bandit.labs.overthewire.org -p 2220

# Level 13-14: private key ile bağlan
chmod 600 sshkey.private
ssh -i sshkey.private bandit14@localhost -p 2220

# Level 18: .bashrc bypass
ssh bandit18@bandit.labs.overthewire.org -p 2220 cat readme
ssh bandit18@bandit.labs.overthewire.org -p 2220 -t /bin/sh
```

---

## scp

**Secure Copy** — SSH üzerinden dosya kopyalar.

### Temel Kullanım
```bash
# Uzaktan yerele kopyala
scp kullanici@sunucu:/uzak/dosya /yerel/yol

# Yerelden uzağa kopyala
scp /yerel/dosya kullanici@sunucu:/uzak/yol

# Dizin kopyala
scp -r klasor/ kullanici@sunucu:/uzak/yol
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `-P PORT` | Port belirt (büyük P — ssh'dan farklı!) |
| `-i DOSYA` | Private key kullan |
| `-r` | Dizini recursive kopyala |
| `-v` | Verbose |
| `-C` | Sıkıştırarak aktar |

### Bandit'te Kullanım
```bash
# Level 13: private key'i kendi makinene indir
scp -P 2220 bandit13@bandit.labs.overthewire.org:sshkey.private .
chmod 600 sshkey.private
```

---

## nc (netcat)

**Netcat** — Ağ üzerinden veri okuyup yazan çok yönlü araç. "Ağın İsviçre çakısı" olarak bilinir.

### Temel Kullanım
```bash
# Sunucuya bağlan
nc host port

# Dinleyen sunucu başlat
nc -l -p port

# Zaman aşımı ile bağlan
nc -w 5 host port
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `-l` | Dinleme modunda başlat (listen) |
| `-p PORT` | Port belirt |
| `-v` | Verbose |
| `-z` | Port tarama modu (veri gönderme) |
| `-w N` | N saniye zaman aşımı |
| `-u` | UDP kullan (varsayılan TCP) |
| `-e komut` | Bağlantı kurulunca komutu çalıştır (bazı versiyonlarda) |

### Kullanım Senaryoları

```bash
# Porta veri gönder
echo "merhaba" | nc localhost 30000

# Basit web sunucusu
echo -e "HTTP/1.1 200 OK\n\nMerhaba" | nc -l -p 8080

# Port tarama
nc -zv host 20-30

# Dosya transferi
# Alıcı:
nc -l -p 1234 > dosya.txt
# Gönderici:
nc alici_ip 1234 < dosya.txt

# Arka planda dinle
nc -l -p 1234 &
```

### Bandit'te Kullanım
```bash
# Level 14: porta şifre gönder
nc localhost 30000
<şifre>

# Level 20: arka planda netcat sunucu başlat
echo -n 'şifre' | nc -l -p 1234 &
./suconnect 1234
```

---

## openssl

**OpenSSL** — SSL/TLS protokollerini kullanan bağlantı ve kriptografi aracı.

### SSL/TLS Nedir?

**SSL (Secure Sockets Layer)** ve halefi **TLS (Transport Layer Security)**, ağ bağlantısını şifreler. HTTPS'nin temel teknolojisidir. Düz `nc` ile SSL kullanan bir sunucuya bağlanamazsın.

### Temel Kullanım
```bash
# SSL/TLS sunucusuna bağlan
openssl s_client -connect host:port

# Sertifika bilgilerini göster
openssl s_client -connect host:443 -showcerts

# Belirli TLS versiyonu kullan
openssl s_client -connect host:443 -tls1_2
```

### s_client Bayrakları

| Bayrak | Açıklama |
|---|---|
| `-connect host:port` | Bağlanılacak adres |
| `-showcerts` | Sertifikaları göster |
| `-ign_eof` | EOF gelince bağlantıyı kesme |
| `-quiet` | Bağlantı bilgilerini gizle |
| `-tls1_2` | TLS 1.2 kullan |
| `-tls1_3` | TLS 1.3 kullan |

### Bağlandıktan Sonra

```bash
$ openssl s_client -connect localhost:30001
# Bağlantı bilgileri çıkar (sertifika, cipher vb.)
# Bekleme başlar...
# Şifreyi yaz ve Enter'a bas
<şifre>
Correct!
<sonraki şifre>
```

> 💡 `HEARTBEATING` veya `Read R BLOCK` görürsen:
> - `R` tuşuna bas, veya
> - `-ign_eof` bayrağını ekle

### Diğer openssl Kullanımları

```bash
# Hash üret
echo "metin" | openssl md5
echo "metin" | openssl sha256

# Rastgele veri üret
openssl rand -hex 16         # 16 byte hex
openssl rand -base64 24      # 24 byte base64

# RSA anahtar oluştur
openssl genrsa -out ozel.pem 2048
openssl rsa -in ozel.pem -pubout -out acik.pem

# Dosya şifrele
openssl enc -aes-256-cbc -in dosya.txt -out sifreli.bin
openssl enc -d -aes-256-cbc -in sifreli.bin -out cozulmus.txt
```

### Bandit'te Kullanım
```bash
# Level 15: SSL ile porta şifre gönder
openssl s_client -connect localhost:30001
<şifre>

# Level 16: SSL kullanan portu bul ve şifre gönder
openssl s_client -connect localhost:31790
<şifre>
```

---

## nmap

**Network Mapper** — Ağ taraması ve servis tespiti yapar.

### Temel Kullanım
```bash
nmap hedef                      # temel tarama
nmap 192.168.1.0/24             # ağ tarama
nmap -p 80,443 hedef            # belirli portları tara
nmap -p 1-1000 hedef            # port aralığı tara
nmap -p- hedef                  # tüm portları tara (1-65535; port 0 dahil değil)
```

### Önemli Bayraklar

| Bayrak | Açıklama | Örnek |
|---|---|---|
| `-p PORT` | Port veya aralık belirt | `-p 80-443` |
| `-sV` | Servis/versiyon tespiti | `-sV` |
| `-sS` | SYN tarama (hızlı, sessiz) | `-sS` |
| `-sT` | TCP Connect tarama | `-sT` |
| `-sU` | UDP tarama | `-sU` |
| `-O` | İşletim sistemi tespiti | `-O` |
| `-A` | Agresif (OS + versiyon + script) | `-A` |
| `-v` | Verbose | `-v` |
| `-Pn` | Ping atmadan tara | `-Pn` |
| `--open` | Sadece açık portları göster | `--open` |
| `-oN dosya` | Normal çıktıyı dosyaya kaydet | `-oN sonuc.txt` |

### Port Durumları

| Durum | Anlamı |
|---|---|
| `open` | Port açık, servis dinliyor |
| `closed` | Port kapalı, bağlantı reddedildi |
| `filtered` | Firewall engelliyor |
| `open\|filtered` | Açık veya filtrelenmiş (UDP'de yaygın) |

### Servis Tespiti (-sV)

```bash
$ nmap -sV localhost -p 31000-32000
PORT      STATE SERVICE  VERSION
31046/tcp open  echo
31518/tcp open  ssl/echo
31691/tcp open  echo
31790/tcp open  ssl/unknown   ← SSL kullanan bilinmeyen servis
31960/tcp open  echo
```

### Bandit'te Kullanım
```bash
# Level 16: 31000-32000 arasında SSL kullanan portu bul
nmap -sV localhost -p 31000-32000

# ssl/echo → sadece echo yapar
# ssl/unknown → hedefimiz bu
openssl s_client -connect localhost:31790
```

---

## curl

**Client URL** — HTTP/HTTPS istekleri yapar. Web sayfalarını, API'leri test etmek için kullanılır.

### Temel Kullanım
```bash
curl https://example.com            # sayfayı getir
curl -o dosya.html https://...      # dosyaya kaydet
curl -L https://...                 # redirect'leri takip et
curl -I https://...                 # sadece header'ları göster
```

### Önemli Bayraklar

| Bayrak | Açıklama | Örnek |
|---|---|---|
| `-o DOSYA` | Çıktıyı dosyaya kaydet | `-o index.html` |
| `-O` | Uzak dosya adıyla kaydet | `-O` |
| `-L` | Redirect'leri takip et | `-L` |
| `-I` | HEAD isteği (sadece header) | `-I` |
| `-v` | Verbose (request ve response) | `-v` |
| `-s` | Silent (ilerleme çubuğu yok) | `-s` |
| `-u user:pass` | HTTP Basic Auth | `-u natas0:natas0` |
| `-H "Header: val"` | Custom header ekle | `-H "Cookie: x=1"` |
| `-d "veri"` | POST verisi gönder | `-d "user=a&pass=b"` |
| `-X METHOD` | HTTP metodu belirt | `-X POST` |
| `-b "cookie"` | Cookie gönder | `-b "loggedin=1"` |
| `-c dosya` | Cookie'leri dosyaya kaydet | `-c cookies.txt` |

### Natas'ta Kullanım
```bash
# Level 4: Referer header'ı değiştir
curl -u natas4:<şifre> \
  http://natas4.natas.labs.overthewire.org/ \
  -H "Referer: http://natas5.natas.labs.overthewire.org/"

# Level 9: komut enjeksiyonu
curl -u natas9:<şifre> \
  "http://natas9.natas.labs.overthewire.org/?needle=;cat+/etc/natas_webpass/natas10"

# POST isteği
curl -u natas15:<şifre> \
  http://natas15.natas.labs.overthewire.org/ \
  -d "username=natas16&debug="
```

---

## wget

**Web Get** — Dosya indirme aracı. curl'e benzer ama özellikle dosya indirme için tasarlanmıştır.

### Temel Kullanım
```bash
wget https://example.com/dosya.zip    # dosya indir
wget -O hedef.zip https://...         # farklı isimle indir
wget -c https://...                   # yarıda kalan indirmeyi devam ettir
wget -r https://...                   # tüm siteyi indir (recursive)
wget -q https://...                   # sessiz mod
```

### curl vs wget

| Özellik | curl | wget |
|---|---|---|
| Kullanım amacı | API testi, esneklik | Dosya indirme |
| Recursive download | ✗ | ✓ |
| HTTP metodları | ✓ (tam destek) | Sınırlı |
| Pipe ile kullanım | ✓ | ✓ |
| Resume download | ✗ | ✓ |

---

## 📚 Hızlı Referans Tablosu

| Komut | Temel Kullanım | Ne Yapar |
|---|---|---|
| `ssh` | `ssh user@host -p 22` | Uzak sunucuya bağlan |
| `ssh -i` | `ssh -i key.pem user@host` | Key ile bağlan |
| `ssh host komut` | `ssh host cat /etc/passwd` | Uzaktan komut çalıştır |
| `scp` | `scp -P 22 user@host:dosya .` | Dosya kopyala |
| `nc` | `nc localhost 30000` | Porta bağlan |
| `nc -l` | `nc -l -p 1234` | Port dinle |
| `openssl s_client` | `openssl s_client -connect host:443` | SSL bağlantısı |
| `nmap -sV` | `nmap -sV host -p 1-1000` | Port ve servis tara |
| `curl` | `curl -u user:pass https://...` | HTTP isteği |
| `curl -H` | `curl -H "Header: val" https://...` | Custom header |
| `wget` | `wget https://.../dosya` | Dosya indir |

---

## 🔗 Daha Fazla Bilgi

- `man ssh` · `man nc` · `man nmap` · `man curl`
- [SSH Man Page](https://man.openbsd.org/ssh)
- [Nmap Referans Kılavuzu](https://nmap.org/book/man.html)
- [curl Everything](https://everything.curl.dev/)

---

**Önceki bölüm:** [sikistirma_encoding.md](./sikistirma_encoding.md)  
**Sonraki bölüm:** [izinler_kullanici.md](./izinler_kullanici.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
