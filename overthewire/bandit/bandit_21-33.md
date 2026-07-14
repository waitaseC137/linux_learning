# 🏴 OverTheWire: Bandit — Level 21'den Level 33'e Türkçe Rehber

> Son bölüm! Cron job'lar, bash scripting, brute-force, kısıtlı ortamdan kaçış ve Git konularını kapsıyor.  
> Bu bölümde artık sadece komut çalıştırmıyorsun — düşünüp script yazıyorsun.

**Önceki bölüm:** [bandit_11-20.md](./bandit_11-20.md) | **Referans:** [mayadevbe.me](https://mayadevbe.me/posts/overthewire/bandit/overview/)

---

## Level 20 → Level 21 — SUID Binary + Netcat + Arka Plan Süreci

### 🔐 Bağlantı
```bash
ssh bandit20@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
Home dizininde bir SUID binary var (`suconnect`). Belirttiğin porta bağlanıyor, bandit20'nin şifresini bekliyor; doğruysa bandit21'in şifresini gönderiyor. Bunun için hem bir netcat sunucusu hem de binary'yi aynı anda çalıştırman gerekiyor.

### 📖 Teori: Arka Plan Süreci (`&`)

Normalde bir komut çalıştırınca terminal o komut bitene kadar bekler. `&` ile komutu **arka plana** gönderebilirsin — terminal serbest kalır, başka komut çalıştırabilirsin.

```bash
komut &       # arka planda çalıştır
jobs          # arka plandaki süreçleri listele
fg            # arka plan sürecini öne al
```

`echo -n` → satır sonu karakteri (`\n`) eklemeden yazar. Netcat protokollerinde kritik — fazladan `\n` bazen bağlantıyı bozar.

### 🔧 Çözüm

```bash
# 1. Netcat sunucusunu arka planda başlat — şifreyi pipe ile gönder
bandit20@bandit:~$ echo -n '<bandit20 şifresi>' | nc -l -p 1234 &
[1] 24661

# 2. SUID binary'yi aynı porta yönlendir
bandit20@bandit:~$ ./suconnect 1234
Read: <bandit20 şifresi>
Password matches, sending next password
<sonraki level'ın şifresi>
[1]+  Done
```

> 💡 Port numarasını kendin seç — 1234 yerine başka bir şey de yazabilirsin. Sadece her iki komutta aynı olsun.

---

## Level 21 → Level 22 — Cron Job Okuma

### 🔐 Bağlantı
```bash
ssh bandit21@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
Bir program düzenli aralıklarla otomatik çalışıyor. `/etc/cron.d/` içine bak, ne çalıştırıldığını bul.

### 📖 Teori: Cron Job Nedir?

**Cron**, Linux'ta belirli zaman aralıklarında otomatik komut/script çalıştıran zamanlayıcıdır. `/etc/cron.d/` gibi klasörlerdeki dosyalarda tanımlanır.

Cron satırının formatı:
```
* * * * * kullanici /komut/yolu
│ │ │ │ │
│ │ │ │ └── Haftanın günü (0-7)
│ │ │ └──── Ay (1-12)
│ │ └────── Ayın günü (1-31)
│ └──────── Saat (0-23)
└────────── Dakika (0-59)

* * * * * → her dakika çalış
@reboot   → sistem başlangıcında çalış
```

### 🔧 Çözüm

```bash
bandit21@bandit:~$ ls /etc/cron.d/
cronjob_bandit22  cronjob_bandit23  cronjob_bandit24  ...

bandit21@bandit:~$ cat /etc/cron.d/cronjob_bandit22
* * * * * bandit22 /usr/bin/cronjob_bandit22.sh &> /dev/null

bandit21@bandit:~$ cat /usr/bin/cronjob_bandit22.sh
#!/bin/bash
chmod 644 /tmp/t7O6lds9S0RqQh9aMcz6ShpAoZKF7fgv
cat /etc/bandit_pass/bandit22 > /tmp/t7O6lds9S0RqQh9aMcz6ShpAoZKF7fgv

# Script her dakika bandit22'nin şifresini o dosyaya yazıyor!
bandit21@bandit:~$ cat /tmp/t7O6lds9S0RqQh9aMcz6ShpAoZKF7fgv
<şifre buraya gelir>
```

---

## Level 22 → Level 23 — Bash Script Analizi ve md5sum

### 🔐 Bağlantı
```bash
ssh bandit22@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
Yine bir cron job var. Bu sefer script değişkenler ve `md5sum` kullanıyor — dosya adını kendin hesaplaman gerekiyor.

### 📖 Teori: Bash Değişkenleri ve md5sum

Bash'te değişken tanımlama:
```bash
isim="deger"                 # sabit değer
isim=$(komut)                # komut çıktısını sakla
echo $isim                   # değişkeni kullan
```

**`md5sum`:** Bir string veya dosyanın MD5 hash'ini üretir — sabit uzunlukta benzersiz bir parmak izi. Aynı giriş her zaman aynı çıktıyı verir.

**`cut -d ' ' -f 1`:** Boşlukla (`-d ' '`) ayırarak 1. alanı (`-f 1`) alır. `md5sum` çıktısı `hash  dosya` şeklinde gelir, biz sadece hash'i istiyoruz.

### 🔧 Çözüm

```bash
bandit22@bandit:~$ cat /etc/cron.d/cronjob_bandit23
* * * * * bandit23 /usr/bin/cronjob_bandit23.sh

bandit22@bandit:~$ cat /usr/bin/cronjob_bandit23.sh
#!/bin/bash
myname=$(whoami)
mytarget=$(echo I am user $myname | md5sum | cut -d ' ' -f 1)
cat /etc/bandit_pass/$myname > /tmp/$mytarget
```

Script bandit23 olarak çalışıyor. `$myname` = `bandit23`. Dosya adını biz de hesaplayabiliriz:

```bash
bandit22@bandit:~$ echo I am user bandit23 | md5sum | cut -d ' ' -f 1
8ca319486bfbbc3663ea0fbe81326349

bandit22@bandit:~$ cat /tmp/8ca319486bfbbc3663ea0fbe81326349
<şifre buraya gelir>
```

---

## Level 23 → Level 24 — Kendi Script'ini Yaz (Cron ile Çalıştır)

### 🔐 Bağlantı
```bash
ssh bandit23@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
Cron job, `/var/spool/bandit24/` klasöründeki script'leri **bandit24 olarak** çalıştırıp siliyor — ama yalnızca sahibi `bandit23` olanları. Bunu kullanarak bandit24'ün şifresini çalan bir script yaz.

### 📖 Teori: Bash Script Yazımı

Bir bash script'in ilk satırı **shebang** olmalı — hangi interpreter kullanılacağını söyler:
```bash
#!/bin/bash
```

Dosyayı çalıştırılabilir yapmak için:
```bash
chmod +x script.sh    # çalıştırma izni ver
chmod +rx script.sh   # okuma + çalıştırma
chmod 777 klasor      # herkese tam yetki (dikkatli kullan)
```

### 🔧 Çözüm

```bash
# Geçici çalışma klasörü oluştur
bandit23@bandit:~$ mktemp -d
/tmp/tmp.ljEyl6kv1M
bandit23@bandit:~$ cd /tmp/tmp.ljEyl6kv1M

# Script'i yaz
bandit23@bandit:/tmp/tmp.ljEyl6kv1M$ nano bandit24_pass.sh
```

Script içeriği:
```bash
#!/bin/bash
cat /etc/bandit_pass/bandit24 > /tmp/tmp.ljEyl6kv1M/password
```

```bash
# İzinleri ayarla
bandit23@bandit:/tmp/tmp.ljEyl6kv1M$ chmod +rx bandit24_pass.sh
bandit23@bandit:/tmp/tmp.ljEyl6kv1M$ chmod 777 /tmp/tmp.ljEyl6kv1M
bandit23@bandit:/tmp/tmp.ljEyl6kv1M$ touch password
bandit23@bandit:/tmp/tmp.ljEyl6kv1M$ chmod 777 password

# Script'i cron klasörüne kopyala
bandit23@bandit:/tmp/tmp.ljEyl6kv1M$ cp bandit24_pass.sh /var/spool/bandit24/

# ~1 dakika bekle, sonra oku
bandit23@bandit:/tmp/tmp.ljEyl6kv1M$ cat password
<şifre buraya gelir>
```

> ⚠️ Dosya boşsa: Script'in ve klasörün izinlerini kontrol et. Cron job script'i çalıştıramazsa dosyaya yazmaz.

---

## Level 24 → Level 25 — Brute Force (Bash Script + Netcat)

### 🔐 Bağlantı
```bash
ssh bandit24@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
Port 30002'deki daemon, bandit24'ün şifresini + 4 haneli PIN kodunu bekliyor. PIN'i bilmiyorsun; tüm 10.000 kombinasyonu dene.

### 📖 Teori: For Loop ve Brute Force

Bash'te for döngüsü:
```bash
for i in {0000..9999}
do
    echo "değer: $i"
done
```

`{0000..9999}` → 0000'dan 9999'a kadar, başındaki sıfırları koruyarak sayar.

`>>` operatörü dosyaya **ekleyerek** yazar (üzerine yazmaz).

**Brute force:** Tüm olası kombinasyonları sistematik olarak deneme yöntemi. Gerçek dünyada güçlü şifreler ve rate limiting bunu engeller.

### 🔧 Çözüm

```bash
bandit24@bandit:~$ mktemp -d
/tmp/tmp.3YQNHtW1Uu
bandit24@bandit:~$ cd /tmp/tmp.3YQNHtW1Uu
bandit24@bandit:/tmp/tmp.3YQNHtW1Uu$ nano brute.sh
```

Script içeriği:
```bash
#!/bin/bash
for i in {0000..9999}
do
    echo <bandit24 şifresi> $i >> possibilities.txt
done
cat possibilities.txt | nc localhost 30002 > result.txt
```

```bash
bandit24@bandit:/tmp/tmp.3YQNHtW1Uu$ chmod +x brute.sh
bandit24@bandit:/tmp/tmp.3YQNHtW1Uu$ ./brute.sh

# "Wrong!" içermeyen satırları filtrele → doğru PIN satırı kalır
bandit24@bandit:/tmp/tmp.3YQNHtW1Uu$ grep -v "Wrong" result.txt
Correct!
The password of user bandit25 is <şifre buraya gelir>
```

---

## Level 25 → Level 26 — Kısıtlı Shell'den Kaçış (more + vim)

### 🔐 Bağlantı
```bash
ssh bandit25@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
bandit26'nın shell'i `/bin/bash` değil — başka bir şey. Ne olduğunu bul ve ondan kaç.

### 📖 Teori: Kullanıcı Shell'i, more ve vim

Her kullanıcının varsayılan shell'i `/etc/passwd`'de yazılıdır:
```
bandit26:x:11026:11026:...:/home/bandit26:/usr/bin/showtext
                                                   ↑ bu bash değil!
```

**`more`:** Büyük dosyaları sayfa sayfa gösterir. Ama dosya küçükse (tüm içerik ekrana sığıyorsa) interaktif moda **girmez** — direkt çıkar. Terminal penceresini küçültürsen `more` interaktif moda girmek zorunda kalır.

**`more` interaktif modunda `v`** → dosyayı `vim`'de açar.

**vim'den shell spawn etmek:**
```
:set shell=/bin/bash    → varsayılan shell'i bash yap
:shell                  → o shell'i aç
```
Ya da dosya okumak için:
```
:e /etc/bandit_pass/bandit26
```

### 🔧 Çözüm

```bash
# bandit25 olarak: hangi shell kullanıyor?
bandit25@bandit:~$ cat /etc/passwd | grep bandit26
bandit26:x:11026:11026:bandit level 26:/home/bandit26:/usr/bin/showtext

bandit25@bandit:~$ cat /usr/bin/showtext
#!/bin/sh
export TERM=linux
more ~/text.txt
exit 0

# SSH key var, onu kullanarak bağlan
bandit25@bandit:~$ ls
bandit26.sshkey

# Kendi makinene kopyala, izin ver
$ chmod 600 bandit26.sshkey
$ ssh -i bandit26.sshkey bandit26@bandit.labs.overthewire.org -p 2220
```

Bağlanınca `more` başlar ama terminal büyükse direkt kapanır. **Terminal penceresini çok küçük yap**, ardından tekrar bağlan. `more` interaktif modda kalacak:

```
# more interaktif modunda:
v          → vim açılır

# vim içinde:
:set shell=/bin/bash
:shell

# Artık bash shell'i var!
bandit26@bandit:~$ cat /etc/bandit_pass/bandit26
<şifre buraya gelir>
```

---

## Level 26 → Level 27 — SUID Binary (Tekrar)

### 🔐 Bağlantı
Önceki level'daki yöntemle bandit26 shell'ini elde et.

### 🎯 Görev
Home dizinindeki `bandit27-do` binary'sini kullanarak bandit27'nin şifresini al.

### 🔧 Çözüm

```bash
# Level 26'dan elde ettiğin shell'de:
bandit26@bandit:~$ ls
bandit27-do  text.txt

bandit26@bandit:~$ ./bandit27-do cat /etc/bandit_pass/bandit27
<şifre buraya gelir>
```

Level 19-20'deki SUID binary mantığının aynısı — binary bandit27 yetkileriyle çalışıyor.

---

## Level 27 → Level 28 — Git Clone

### 🔐 Bağlantı
```bash
ssh bandit27@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
`ssh://bandit27-git@localhost/home/bandit27-git/repo` adresindeki Git reposunu klonla, şifreyi bul.

### 📖 Teori: Git Nedir?

**Git**, kodun tarihçesini ve değişikliklerini takip eden dağıtık versiyon kontrol sistemidir. GitHub ve GitLab gibi platformlar Git üzerine kurulu.

Temel komutlar:
- `git clone <url>` → repoyu indir
- `git log` → commit geçmişini göster
- `git branch -a` → tüm branch'leri listele
- `git checkout <branch>` → branch değiştir

`.git/` klasörü → tüm versiyon bilgisi burada saklanır.

### 🔧 Çözüm

```bash
bandit27@bandit:~$ mktemp -d
/tmp/tmp.pUEZdMrFfV
bandit27@bandit:~$ cd /tmp/tmp.pUEZdMrFfV

bandit27@bandit:/tmp/tmp.pUEZdMrFfV$ git clone ssh://bandit27-git@localhost:2220/home/bandit27-git/repo
# Şifre: bandit27'nin şifresi

bandit27@bandit:/tmp/tmp.pUEZdMrFfV$ cd repo
bandit27@bandit:/tmp/tmp.pUEZdMrFfV/repo$ cat README
The password to the next level is: <şifre buraya gelir>
```

---

## Level 28 → Level 29 — Git Geçmişi (git log + git show)

### 🔐 Bağlantı
```bash
ssh bandit28@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
Repo'daki README'de şifre `xxxxxxxxxx` ile gizlenmiş. Eski commit'lere bak.

### 📖 Teori: git log ve git show

```bash
git log              # commit geçmişini göster
git show <commit_id> # o commit'te ne değişti?
```

> ⚠️ **Önemli ders:** Git geçmişi her şeyi saklar. Hassas veriyi (şifre, API key) commit'lesen, sonradan silsen bile geçmişte kalır!

### 🔧 Çözüm

```bash
bandit28@bandit:/tmp/...$ git clone ssh://bandit28-git@localhost:2220/home/bandit28-git/repo
bandit28@bandit:/tmp/.../repo$ cat README.md
- password: xxxxxxxxxx   # gizlenmiş

bandit28@bandit:/tmp/.../repo$ git log
commit edd935d...   fix info leak    ← şüpheli!
commit c086d11...   add missing data
commit de2ebe2...   initial commit

bandit28@bandit:/tmp/.../repo$ git show edd935d60906b33f0619605abd1689808ccdd5ee
-  password: <eski şifre — sonraki level'ın şifresi>
+  password: xxxxxxxxxx
```

---

## Level 29 → Level 30 — Git Branch'leri

### 🔐 Bağlantı
```bash
ssh bandit29@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
README'de "no passwords in production!" yazıyor. Başka branch'lere bak.

### 📖 Teori: Git Branching

Branch'ler paralel geliştirme hatlarıdır. Genellikle:
- `master` / `main` → production (canlı) kodu
- `dev` → geliştirme kodu
- `feature/...` → yeni özellik

```bash
git branch -a          # tüm branch'leri listele (remote dahil)
git checkout <branch>  # branch'e geç
```

### 🔧 Çözüm

```bash
bandit29@bandit:/tmp/.../repo$ git clone ssh://bandit29-git@localhost:2220/home/bandit29-git/repo
bandit29@bandit:/tmp/.../repo$ cat README.md
- password: <no passwords in production!>

bandit29@bandit:/tmp/.../repo$ git branch -a
* master
  remotes/origin/dev          ← ilginç!
  remotes/origin/master
  remotes/origin/sploits-dev

bandit29@bandit:/tmp/.../repo$ git checkout dev
bandit29@bandit:/tmp/.../repo$ cat README.md
- password: <şifre buraya gelir>   ✓
```

---

## Level 30 → Level 31 — Git Tag

### 🔐 Bağlantı
```bash
ssh bandit30@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
README boş. Ne log ne branch — başka ne olabilir?

### 📖 Teori: Git Tag

**Tag**, repo tarihinde önemli noktaları işaretler (örn. `v1.0.0` release). Log'da ve branch'lerde görünmeyebilir.

```bash
git tag              # tag'leri listele
git show <tag_adı>   # tag detayını göster
```

### 🔧 Çözüm

```bash
bandit30@bandit:/tmp/.../repo$ git clone ssh://bandit30-git@localhost:2220/home/bandit30-git/repo
bandit30@bandit:/tmp/.../repo$ cat README.md
just an empty file... muahaha

bandit30@bandit:/tmp/.../repo$ git log    # tek commit, bilgi yok
bandit30@bandit:/tmp/.../repo$ git branch -a  # sadece master

bandit30@bandit:/tmp/.../repo$ git tag
secret                  ← bu ne?

bandit30@bandit:/tmp/.../repo$ git show secret
<şifre buraya gelir>
```

---

## Level 31 → Level 32 — Git Push + .gitignore Bypass

### 🔐 Bağlantı
```bash
ssh bandit31@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
README'de görev açık: `key.txt` dosyasını "May I come in?" içeriğiyle remote'a push et. Ama `.gitignore` tüm `.txt` dosyalarını engelliyor.

### 📖 Teori: git add, commit, push ve .gitignore

**`.gitignore`:** Git'in takip etmemesi gereken dosyaları listeler. `*.txt` → tüm txt dosyaları yok sayılır.

**`git add -f`:** `-f` (force) bayrağı `.gitignore`'u atlayarak dosyayı zorla ekler.

```bash
git add -f dosya.txt         # gitignore'a rağmen ekle
git commit -m "mesaj"        # değişiklikleri kaydet
git push -u origin master    # remote'a gönder
```

### 🔧 Çözüm

```bash
bandit31@bandit:/tmp/.../repo$ git clone ssh://bandit31-git@localhost:2220/home/bandit31-git/repo
bandit31@bandit:/tmp/.../repo$ cat README.md
# Dosya adı: key.txt, İçerik: 'May I come in?', Branch: master

bandit31@bandit:/tmp/.../repo$ cat .gitignore
*.txt    # tüm txt dosyaları engelli!

# Dosyayı oluştur
bandit31@bandit:/tmp/.../repo$ echo 'May I come in?' > key.txt

# Zorla ekle, commit'le, push'la
bandit31@bandit:/tmp/.../repo$ git add -f key.txt
bandit31@bandit:/tmp/.../repo$ git commit -m "add key"
bandit31@bandit:/tmp/.../repo$ git push -u origin master

remote: Well done! Here is the password for the next level:
remote: <şifre buraya gelir>
```

---

## Level 32 → Level 33 — Uppercase Shell'den Kaçış ($0)

### 🔐 Bağlantı
```bash
ssh bandit32@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
Giriş yapınca garip bir shell karşılıyor: yazdığın her şey büyük harfe çevriliyor. Komutlar çalışmıyor. Kaç!

### 📖 Teori: Linux Değişkenleri ve $0

Linux'ta değişkenler büyük harfle yazılır:
```bash
$HOME   → home dizini
$PATH   → komut arama yolları
$SHELL  → mevcut shell
$0      → çalışan script/shell'in adı (örn. /bin/bash)
```

Shell'de `$0` yazdığında mevcut shell'i tekrar başlatır — bu bir **shell escape** tekniğidir.

Uppercase shell her şeyi büyük harfe çeviriyor. `ls` → `LS: not found`. Ama `$0` değişken referansı — harf değil, sembol — büyük harfe çevrilmiyor!

### 🔧 Çözüm

```bash
WELCOME TO THE UPPERCASE SHELL
>> ls
sh: 1: LS: not found

>> $0          # shell değişkeni → kaçış!
$              # normal shell prompt!

$ whoami
bandit33       # SUID sayesinde bandit33 olarak çalışıyoruz

$ cat /etc/bandit_pass/bandit33
<şifre buraya gelir>

$ cat README.txt
Congratulations on solving the last level of this game!
```

**Tebrikler — Bandit tamamlandı! 🎉**

---

## 📚 Öğrenilen Komutlar Özeti (Level 21-33)

| Komut | Ne yapar |
|---|---|
| `komut &` | Komutu arka planda çalıştırır |
| `jobs` | Arka plan süreçlerini listeler |
| `echo -n` | Satır sonu olmadan yazar |
| `cat /etc/cron.d/` | Cron job tanımlarını gösterir |
| `$(komut)` | Komut çıktısını değişkene atar |
| `md5sum` | MD5 hash üretir |
| `cut -d ' ' -f 1` | Alanlara göre metni keser |
| `for i in {0000..9999}` | Bash for döngüsü |
| `chmod +x` | Çalıştırma izni verir |
| `grep -v "pattern"` | Pattern içermeyen satırları gösterir |
| `cat /etc/passwd` | Kullanıcı ve shell bilgilerini gösterir |
| `git clone <url>` | Repo'yu indirir |
| `git log` | Commit geçmişini gösterir |
| `git show <id/tag>` | Commit veya tag detayını gösterir |
| `git branch -a` | Tüm branch'leri listeler |
| `git checkout <branch>` | Branch değiştirir |
| `git tag` | Tag'leri listeler |
| `git add -f` | gitignore'ı atlayarak dosya ekler |
| `git commit -m "msg"` | Değişiklikleri kaydeder |
| `git push` | Remote'a gönderir |
| `$0` | Mevcut shell'i yeniden başlatır |
| `printenv` | Tüm environment değişkenlerini listeler |

---

## 🏁 Bandit Tamamlandı!

33 level boyunca öğrendiklerin:

**Bölüm 1 (0-10):** SSH, dosya sistemi gezinme, metin işleme temelleri  
**Bölüm 2 (11-20):** Encoding, sıkıştırma, ağ iletişimi, SSH ileri özellikleri, dosya izinleri  
**Bölüm 3 (21-33):** Cron, bash scripting, brute force, kısıtlı ortamdan kaçış, Git

**Sıradaki OverTheWire oyunları:**
- **Leviathan** → basit tersine mühendislik
- **Natas** → web güvenliği temelleri
- **Krypton** → kriptografi

---

**Önceki bölümler:** [bandit_0-10.md](./bandit_0-10.md) · [bandit_11-20.md](./bandit_11-20.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
