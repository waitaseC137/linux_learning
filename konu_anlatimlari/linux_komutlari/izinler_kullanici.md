# 🔐 Linux Komutları — İzinler & Kullanıcı

> Linux çok kullanıcılı bir sistemdir. Her dosyanın bir sahibi, bir grubu  
> ve izinleri vardır. Bu sistemi anlamak hem güvenlik hem de  
> sistem yönetimi için kritiktir — Bandit'in pek çok level'ı bu konuya dayanır.

---

## 📋 İçindekiler

- [chmod](#chmod)
- [chown](#chown)
- [whoami & id](#whoami--id)
- [su & sudo](#su--sudo)
- [passwd](#passwd)
- [groups](#groups)
- [SUID / SGID / Sticky Bit](#suid--sgid--sticky-bit)

---

## Linux İzin Sistemi

Her dosya ve dizinin izinleri üç grup için tanımlanır:

```
-rwxr-xr--  1 bandit7 bandit6 33 May 7 dosya
 ^^^         sahip   grup
 |||
 ||+-- execute (çalıştırma): x = var, - = yok
 |+--- write (yazma): w = var, - = yok
 +---- read (okuma): r = var, - = yok

İlk karakter:
  - = normal dosya
  d = dizin
  l = sembolik link
  s = socket
  p = pipe
```

**Üç grup:**
```
-rwxr-xr--
  ^^^       → sahip (owner) izinleri: rwx
     ^^^    → grup (group) izinleri: r-x
        ^^^ → diğerleri (others) izinleri: r--
```

### Sayısal (Octal) Gösterim

| Sayı | İzinler | Açıklama |
|---|---|---|
| 7 | rwx | Okuma + yazma + çalıştırma |
| 6 | rw- | Okuma + yazma |
| 5 | r-x | Okuma + çalıştırma |
| 4 | r-- | Sadece okuma |
| 0 | --- | Hiç izin yok |

```
chmod 755 dosya
       ^^^
       ||+-- diğerleri: 5 = r-x
       |+--- grup: 5 = r-x
       +---- sahip: 7 = rwx
```

---

## chmod

**Change Mode** — Dosya izinlerini değiştirir.

### Temel Kullanım
```bash
chmod 755 dosya         # sayısal: rwxr-xr-x
chmod +x dosya          # sembolik: çalıştırma izni ekle
chmod -w dosya          # sembolik: yazma iznini kaldır
chmod u+x dosya         # sadece sahibe çalıştırma ekle
chmod go-w dosya        # grup ve diğerlerinden yazma kaldır
chmod -R 755 klasor/    # recursive (alt dizinlere de uygula)
```

### Sembolik Gösterim

```
chmod [kime][işlem][izin] dosya

Kime:
  u = user (sahip)
  g = group (grup)
  o = others (diğerleri)
  a = all (hepsi)

İşlem:
  + = izin ekle
  - = izin kaldır
  = = izni tam olarak ayarla

İzin:
  r = okuma
  w = yazma
  x = çalıştırma
  s = SUID/SGID
  t = sticky bit
```

```bash
chmod u+x dosya          # sahibe execute ekle
chmod g-w dosya          # gruptan write kaldır
chmod o=r dosya          # diğerlerine sadece read
chmod a+r dosya          # herkese read ekle
chmod ug+rw dosya        # sahip ve gruba read+write
chmod u=rwx,g=rx,o= dosya  # tam kontrol
```

### Yaygın İzin Kombinasyonları

| Sayı | Sembol | Kullanım |
|---|---|---|
| `755` | `rwxr-xr-x` | Çalıştırılabilir dosyalar, dizinler |
| `644` | `rw-r--r--` | Normal dosyalar |
| `600` | `rw-------` | SSH private key, gizli dosyalar |
| `777` | `rwxrwxrwx` | Herkese tam yetki (dikkatli kullan!) |
| `700` | `rwx------` | Sadece sahip erişebilir |
| `400` | `r--------` | Salt okunur, sadece sahip |

### Bandit'te Kullanım
```bash
# Level 13: SSH key için doğru izin (700 veya 600 olmalı)
chmod 600 sshkey.private
# Yoksa: "Permissions 0644 are too open" hatası alırsın

# Level 23: cron script'i çalıştırılabilir yap
chmod +rx bandit24_pass.sh

# Level 23: tmp klasörüne herkes yazabilsin
chmod 777 /tmp/mywork
```

---

## chown

**Change Owner** — Dosyanın sahibini veya grubunu değiştirir. Root yetkisi gerektirir.

### Temel Kullanım
```bash
chown kullanici dosya           # sahip değiştir
chown kullanici:grup dosya      # sahip ve grup değiştir
chown :grup dosya               # sadece grup değiştir
chown -R kullanici:grup klasor/ # recursive
```

### Örnekler

```bash
chown robin dosya.txt           # sahibi robin yap
chown robin:developers dosya.txt # sahip robin, grup developers
chown :www-data /var/www/       # grubunu www-data yap
sudo chown root:root /etc/hosts # root:root yap
```

> 💡 Kendi dosyanı başkasına verebilirsin ama başkasının dosyasını almak için root yetkisi gerekir.

---

## whoami & id

**Whoami** — Şu an hangi kullanıcı olduğunu gösterir.  
**Id** — Kullanıcı ID'si, grup ID'si ve üye olunan grupları gösterir.

### Temel Kullanım
```bash
whoami              # kullanıcı adını göster
id                  # uid, gid ve grupları göster
id kullanici        # başka bir kullanıcının bilgilerini göster
```

### Örnek Çıktılar

```bash
$ whoami
bandit7

$ id
uid=11007(bandit7) gid=11007(bandit7) groups=11007(bandit7)
#    ^                ^                  ^
#    |                |                  üye olunan gruplar
#    |                grup ID (gid)
#    kullanıcı ID (uid)

$ id root
uid=0(root) gid=0(root) groups=0(root)
```

### Bandit'te Kullanım
```bash
# SUID binary çalıştırıldıktan sonra
./bandit20-do whoami
# bandit20 → SUID sayesinde bandit20 olduk
```

---

## su & sudo

**Su (Switch User)** — Başka bir kullanıcıya geçer.  
**Sudo (Superuser Do)** — Root yetkisiyle komut çalıştırır.

### su Kullanımı
```bash
su kullanici            # o kullanıcıya geç (şifre gerekir)
su -                    # root'a geç
su - kullanici          # o kullanıcının ortamıyla geç
```

### sudo Kullanımı
```bash
sudo komut              # root olarak çalıştır
sudo -u kullanici komut # belirli kullanıcı olarak çalıştır
sudo -l                 # hangi komutları çalıştırabileceğini listele
sudo su -               # root shell'i aç
```

### /etc/passwd ve /etc/shadow

```bash
# Kullanıcı bilgileri
cat /etc/passwd
# kullanici:x:uid:gid:açıklama:home:shell
# bandit26:x:11026:11026:bandit level 26:/home/bandit26:/usr/bin/showtext
#                                                                ^ shell!

# Şifreler (root gerekir)
sudo cat /etc/shadow
```

### Bandit'te Kullanım
```bash
# Level 25-26: hangi shell kullanıyor?
cat /etc/passwd | grep bandit26
# /usr/bin/showtext → bash değil!
```

---

## passwd

**Password** — Kullanıcı şifresini değiştirir.

### Temel Kullanım
```bash
passwd                  # kendi şifreni değiştir
sudo passwd kullanici   # başka kullanıcının şifresini değiştir
sudo passwd -l kullanici  # hesabı kilitle
sudo passwd -u kullanici  # hesabın kilidini aç
```

---

## groups

**Groups** — Kullanıcının üye olduğu grupları listeler.

### Temel Kullanım
```bash
groups                  # kendi gruplarını göster
groups kullanici        # başka kullanıcının grupları
```

```bash
$ groups
bandit5 bandit6         # birden fazla gruba üye olunabilir
```

---

## SUID / SGID / Sticky Bit

Bandit'in en kritik konularından biri. Özel izin bitleri.

### SUID (Set User ID)

`ls -l` çıktısında sahibin execute yerine `s` görürsün:

```
-rwsr-xr-x  1 root root 12345 dosya
    ^
    s = SUID biti aktif
```

**Normal çalışma:** Programı kim çalıştırırsa o kişinin yetkisiyle çalışır.  
**SUID aktifken:** Program, çalıştıran değil, **dosyanın sahibinin** yetkisiyle çalışır.

```bash
# Örnek: passwd komutu
ls -la /usr/bin/passwd
-rwsr-xr-x 1 root root ... /usr/bin/passwd
# Herkes çalıştırabilir ama root yetkisiyle çalışır
# Bu sayede herkes kendi şifresini değiştirebilir
```

### SGID (Set Group ID)

`ls -l` çıktısında grubun execute yerine `s` görürsün:

```
-rwxr-sr-x  1 kullanici grup 12345 dosya
       ^
       s = SGID biti aktif
```

Dosya için: Programın sahibi değil, **dosyanın grubunun** yetkisiyle çalışır.  
Dizin için: O dizinde oluşturulan dosyalar, dizinin grubunu miras alır.

### Sticky Bit

`ls -l` çıktısında others'ın execute yerine `t` görürsün:

```
drwxrwxrwt  root root ... /tmp
         ^
         t = sticky bit
```

Dizinlerde: Herkes dosya oluşturabilir ama sadece **dosyanın sahibi** silebilir. `/tmp` dizininde kullanılır.

### SUID Bitleri Arama

```bash
# Sistemdeki tüm SUID dosyalar
find / -perm -4000 2>/dev/null

# SUID + SGID
find / -perm /6000 2>/dev/null

# SUID binary'leri listele
find / -perm -u=s -type f 2>/dev/null
```

### Sayısal Gösterim

```bash
chmod 4755 dosya    # SUID + 755
chmod 2755 dosya    # SGID + 755
chmod 1755 klasor   # Sticky bit + 755

# SUID = 4000
# SGID = 2000
# Sticky = 1000
```

### Bandit'te Kullanım
```bash
# Level 19: SUID binary
ls -la
# -rwsr-x---  1 bandit20 bandit19 7296 bandit20-do
# rws = SUID → bandit20 yetkisiyle çalışır

./bandit20-do cat /etc/bandit_pass/bandit20

# Leviathan Level 1-6: her level'da SUID binary var
ls -la /leviathan/
# -r-sr-x--- 1 leviathan2 leviathan1 ... check
```

---

## 📚 Hızlı Referans Tablosu

| Komut | Temel Kullanım | Ne Yapar |
|---|---|---|
| `chmod 755` | `chmod 755 dosya` | İzinleri sayısal olarak ayarla |
| `chmod +x` | `chmod +x dosya` | Çalıştırma izni ekle |
| `chmod 600` | `chmod 600 ssh.key` | Sadece sahip okuyabilir |
| `chown` | `chown user:grup dosya` | Sahip/grup değiştir |
| `whoami` | `whoami` | Mevcut kullanıcıyı göster |
| `id` | `id` | UID, GID ve grupları göster |
| `su` | `su kullanici` | Kullanıcı değiştir |
| `sudo` | `sudo komut` | Root olarak çalıştır |
| `groups` | `groups` | Üye olunan gruplar |
| `find -perm -4000` | `find / -perm -4000 2>/dev/null` | SUID dosyaları bul |

---

## 📊 İzin Referans Tablosu

| Octal | Sembolik | Tipik Kullanım |
|---|---|---|
| `777` | `rwxrwxrwx` | Geçici/test (güvensiz) |
| `755` | `rwxr-xr-x` | Programlar, dizinler |
| `700` | `rwx------` | Kişisel dizinler |
| `664` | `rw-rw-r--` | Grup yazabilir dosyalar |
| `644` | `rw-r--r--` | Normal dosyalar |
| `600` | `rw-------` | Gizli dosyalar (SSH key) |
| `444` | `r--r--r--` | Salt okunur |
| `400` | `r--------` | Sadece sahip okuyabilir |

---

## 🔗 Daha Fazla Bilgi

- `man chmod` · `man chown` · `man sudo`
- [Linux File Permissions](https://www.linux.com/training-tutorials/understanding-linux-file-permissions/)
- [SUID/SGID/Sticky Bit](https://www.redhat.com/sysadmin/suid-sgid-sticky-bit)

---

**Önceki bölüm:** [ag.md](./ag.md)  
**Sonraki bölüm:** [surec_shell.md](./surec_shell.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
