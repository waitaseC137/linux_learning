# 🐙 OverTheWire: Leviathan — Level 0'dan Level 7'ye Türkçe Rehber

> Leviathan, Bandit'ten sonra gelen ilk gerçek **tersine mühendislik** deneyimi.  
> Programlama bilgisi gerekmiyor — ama binary'leri analiz etmeyi, SUID'i kullanmayı  
> ve sistemin açıklarını bulmayı öğreniyorsun.

**Platform:** `leviathan.labs.overthewire.org` | **Port:** `2223`  
**Başlangıç:** kullanıcı `leviathan0`, şifre `leviathan0`  
**Referans:** [mayadevbe.me](https://mayadevbe.me/posts/overthewire/leviathan/overview/) · [overthewire.org](https://overthewire.org/wargames/leviathan/)

---

## 🗺️ Genel Bakış

Leviathan'da her level'da home dizininde bir **SUID binary** bulursun. Bu binary'leri analiz edip, şifreyi elde etmek için sistemi manipüle etmek gerekiyor. Temel araçlar:

| Araç | Ne işe yarar |
|---|---|
| `strings` | Binary içindeki okunabilir metinleri çıkarır |
| `ltrace` | Binary çalışırken yapılan kütüphane çağrılarını gösterir |
| `gdb` | Binary'yi adım adım debug etmeye yarar |
| `ln -s` | Sembolik link oluşturur |

Şifreler her zaman `/etc/leviathan_pass/leviathan<N>` konumundadır.

---

## Level 0 — Giriş

### 🔐 Bağlantı
```bash
ssh leviathan0@leviathan.labs.overthewire.org -p 2223
# Şifre: leviathan0
```

Bağlandın. Artık Level 0 → Level 1'e geç.

---

## Level 0 → Level 1 — Yedek Dosyada Gizli Şifre

### 🎯 Görev
Home dizinini araştır, gizli klasörleri bul.

### 📖 Teori: Yedekler ve Privilege Escalation

**Yedekleme (Backup)** veri güvenliğinin temel parçasıdır. Ama yanlış korunursa saldırganlar için açık kapı olur. **Privilege escalation** (yetki yükseltme), daha fazla erişim hakkı elde etme tekniğidir — bu oyunun tüm konusu bu.

### 🔧 Çözüm

```bash
leviathan0@leviathan:~$ ls -la
drwxr-x---  2 leviathan1 leviathan0  4096 .backup
...

leviathan0@leviathan:~$ cd .backup/
leviathan0@leviathan:~/.backup$ ls -la
-rw-r----- 1 leviathan1 leviathan0 133259 bookmarks.html

# Dosya çok büyük, önce yapısına bak
leviathan0@leviathan:~/.backup$ head bookmarks.html
# Firefox bookmark dosyası çıkar

# "leviathan" kelimesini ara
leviathan0@leviathan:~/.backup$ grep "leviathan" bookmarks.html
<DT><A HREF="http://leviathan.labs.overthewire.org/passwordus.html | 
This will be fixed later, the password for leviathan1 is <ŞİFRE>" ...
```

> 💡 **Ders:** Yedek dosyalar hassas bilgi içerebilir. Gerçek dünyada da böyle açıklar yaygındır — saldırganlar ilk önce yedeklere bakar.

---

## Level 1 → Level 2 — ltrace ile Binary Analizi

### 🔐 Bağlantı
```bash
ssh leviathan1@leviathan.labs.overthewire.org -p 2223
```

### 🎯 Görev
Home dizininde SUID bir binary var. Doğru şifreyi bul ve leviathan2 shell'ini ele geçir.

### 📖 Teori: ltrace ve strcmp

**`ltrace`:** Bir binary çalışırken yaptığı **kütüphane fonksiyon çağrılarını** gösterir. Şifre kontrolü gibi işlemler sıklıkla `strcmp` (string compare) kütüphane fonksiyonuyla yapılır — ve ltrace bunu açığa çıkarır.

```
strcmp("girdiğin_şifre", "gerçek_şifre") → ltrace bunu gösterir!
```

**`strings`:** Binary içindeki okunabilir metin dizilerini çıkarır. Şifre bazen doğrudan binary'de saklanmış olabilir.

### 🔧 Çözüm

```bash
leviathan1@leviathan:~$ ls -la
-r-sr-x---  1 leviathan2 leviathan1 7452 check   # SUID binary!

leviathan1@leviathan:~$ ./check
password: test
Wrong password, Good Bye ...

# strings ile dene
leviathan1@leviathan:~$ strings check
# Şüpheli şeyler var ama net değil

# ltrace ile çalıştır
leviathan1@leviathan:~$ ltrace ./check
printf("password: ")
getchar(...)          # ilk harf: t
getchar(...)          # ikinci harf: e
getchar(...)          # üçüncü harf: s
strcmp("tes", "sex")  # ← GERÇEK ŞİFRE BURADA!
puts("Wrong password, Good Bye ...")
```

Binary sadece ilk 3 karakteri karşılaştırıyor. Şifre: `sex`

```bash
leviathan1@leviathan:~$ ./check
password: sex
$                      # shell açıldı!

$ whoami
leviathan2             # SUID sayesinde leviathan2 olduk

$ cat /etc/leviathan_pass/leviathan2
<şifre buraya gelir>
```

---

## Level 2 → Level 3 — Sembolik Link + Boşluk Manipülasyonu

### 🔐 Bağlantı
```bash
ssh leviathan2@leviathan.labs.overthewire.org -p 2223
```

### 🎯 Görev
`printfile` adlı SUID binary var. Yetkin olmadığı dosyaları okumasını sağla.

### 📖 Teori: Symbolic Link ve İsim Manipülasyonu

**Symbolic Link (Sembolik Bağ):** Bir dosyaya başka bir yerden işaret eden kısayol. `ln -s hedef bağ` komutuyla oluşturulur.

Bu level'da iki kritik davranış var:
- `access()` fonksiyonu → tam dosya adıyla kontrol eder (boşluk dahil)
- `/bin/cat` → boşluğu ayırıcı olarak kullanır, sadece ilk parçayı okur

Bu farkı exploit edebiliriz:

```
"test file.txt" → access("/tmp/dir/test file.txt") = OK ✓
                → cat /tmp/dir/test file.txt       = cat /tmp/dir/test + cat file.txt
```

`test` dosyası şifre dosyasına sembolik link olursa, `cat` onu okur!

### 🔧 Çözüm

```bash
leviathan2@leviathan:~$ ls -la
-r-sr-x---  1 leviathan3 leviathan2 7436 printfile   # SUID

leviathan2@leviathan:~$ ./printfile /etc/leviathan_pass/leviathan3
You cant have that file...   # direkt erişim yok

# ltrace ile nasıl çalıştığını anlayalım
leviathan2@leviathan:~$ ltrace ./printfile .bashrc
access(".bashrc", 4)                  # önce erişim kontrolü
snprintf("/bin/cat .bashrc", ...)     # sonra cat ile oku

# PLAN:
# 1. Geçici klasör oluştur
leviathan2@leviathan:~$ mktemp -d
/tmp/tmp.BykcxJXZxD

# 2. İsimde boşluk olan boş bir dosya oluştur
leviathan2@leviathan:~$ touch "/tmp/tmp.BykcxJXZxD/test file.txt"

# 3. "test" adıyla şifre dosyasına sembolik link oluştur
leviathan2@leviathan:~$ ln -s /etc/leviathan_pass/leviathan3 /tmp/tmp.BykcxJXZxD/test

# 4. Klasöre herkes erişebilsin
leviathan2@leviathan:~$ chmod 777 /tmp/tmp.BykcxJXZxD

# 5. Binary'yi "test file.txt" ile çalıştır
leviathan2@leviathan:~$ ./printfile "/tmp/tmp.BykcxJXZxD/test file.txt"
<şifre buraya gelir>        # access() tüm adı gördü ✓
                             # cat sadece "test"i okudu → symlink → şifre!
/bin/cat: file.txt: No such file or directory   # bu hata normal
```

> 💡 **Ders:** `access()` ve `open()` arasındaki zaman farkına dayanan bu tür açıklara **TOCTOU (Time-of-check to time-of-use)** denir. Gerçek güvenlik açıklarında sık rastlanır.

---

## Level 3 → Level 4 — ltrace ile Şifre Tespiti (Tekrar)

### 🔐 Bağlantı
```bash
ssh leviathan3@leviathan.labs.overthewire.org -p 2223
```

### 🎯 Görev
`level3` adlı binary doğru şifreyi ister. `ltrace` ile bul.

### 🔧 Çözüm

```bash
leviathan3@leviathan:~$ ls -la
-r-sr-x---  1 leviathan4 leviathan3 10288 level3   # SUID

leviathan3@leviathan:~$ ./level3
Enter the password> test
bzzzzzzzzap. WRONG

# ltrace ile şifreyi yakala
leviathan3@leviathan:~$ ltrace ./level3
strcmp("h0no33", "kakaka")        # ilk sahte karşılaştırma (yanıltıcı!)
printf("Enter the password> ")
fgets("test\n", 256, ...)
strcmp("test\n", "snlprintf\n")   # ← GERÇEK KARŞILAŞTIRMA
puts("bzzzzzzzzap. WRONG")
```

Şifre: `snlprintf`

```bash
leviathan3@leviathan:~$ ./level3
Enter the password> snlprintf
[You've got shell]!

$ whoami
leviathan4

$ cat /etc/leviathan_pass/leviathan4
<şifre buraya gelir>
```

> 💡 Binary'de birden fazla `strcmp` olabilir — hangisinin gerçek kontrol olduğunu bulmak için dikkatli oku. Burada ilki sahte (yanıltıcı), ikincisi gerçek.

---

## Level 4 → Level 5 — Binary'den ASCII'ye Çevirme

### 🔐 Bağlantı
```bash
ssh leviathan4@leviathan.labs.overthewire.org -p 2223
```

### 🎯 Görev
`.trash/` klasöründeki binary çalışınca bir sürü 0 ve 1 döndürüyor. Bunları çözümle.

### 📖 Teori: Binary ve ASCII

**Binary (İkili) sayı sistemi:** Bilgisayarın temel dili — sadece 0 ve 1 vardır. Her karakter 8 bit (1 byte) ile temsil edilir.

**ASCII:** Harfleri sayılara eşleştiren standart kodlama sistemi. Örneğin:
- `01000001` → 65 → `A`
- `01101000` → 104 → `h`

Binary'yi ASCII'ye çevirmek için Perl'in `pack` fonksiyonu kullanılabilir:
```bash
echo "01000001" | perl -lpe '$_=pack"B*",$_'
# Çıktı: A
```

### 🔧 Çözüm

```bash
leviathan4@leviathan:~$ ls -la
dr-xr-x---  2 root leviathan4 4096 .trash

leviathan4@leviathan:~$ cd .trash/
leviathan4@leviathan:~/.trash$ ls -la
-r-sr-x--- 1 leviathan5 leviathan4 7352 bin   # SUID

leviathan4@leviathan:~/.trash$ ./bin
01010100 01101001 01110100 01101000 00110100 01100011 01101111 01101011 01100101 01101001 00001010
```

Boşlukları kaldırıp tek string yap, Perl ile çevir:

```bash
leviathan4@leviathan:~/.trash$ echo "0101010001101001011101000110100000110100011000110110111101101011011001010110100100001010" | perl -lpe '$_=pack"B*",$_'
<şifre buraya gelir>
```

> 💡 Binary'yi elle çevirmek yerine komut satırı araçlarını kullan. `python3 -c "print(bytes.fromhex(hex(int('01010100',2))[2:]).decode())"` gibi Python ile de yapılabilir.

---

## Level 5 → Level 6 — Symlink ile Binary Kandırma

### 🔐 Bağlantı
```bash
ssh leviathan5@leviathan.labs.overthewire.org -p 2223
```

### 🎯 Görev
`leviathan5` binary'si `/tmp/file.log` dosyasını okumaya çalışıyor. Bu dosyanın yerine şifre dosyasına sembolik link koy.

### 📖 Teori: Binary'leri Sembolik Linkle Kandırmak

Binary'ler çoğunlukla sabit bir dosya yolunu okur. Eğer o dosyayı kontrol edebiliyorsan ve binary SUID ise → binary'yi istediğin dosyayı okutabilirsin.

Mantık:
```
binary → /tmp/file.log okur
biz    → /tmp/file.log'u leviathan6 şifresine link ederiz
binary → aslında leviathan6 şifresini okur
```

### 🔧 Çözüm

```bash
leviathan5@leviathan:~$ ls -la
-r-sr-x---  1 leviathan6 leviathan5 7560 leviathan5   # SUID

leviathan5@leviathan:~$ ./leviathan5
Cannot find /tmp/file.log

# ltrace ile doğrula
leviathan5@leviathan:~$ ltrace ./leviathan5
fopen("/tmp/file.log", "r") = 0    # dosya yok, 0 döndü
puts("Cannot find /tmp/file.log")

# Symlink oluştur: /tmp/file.log → leviathan6'nın şifresi
leviathan5@leviathan:~$ ln -s /etc/leviathan_pass/leviathan6 /tmp/file.log

# Binary şimdi şifreyi okur
leviathan5@leviathan:~$ ./leviathan5
<şifre buraya gelir>
```

---

## Level 6 → Level 7 — GDB ile Tersine Mühendislik

### 🔐 Bağlantı
```bash
ssh leviathan6@leviathan.labs.overthewire.org -p 2223
```

### 🎯 Görev
`leviathan6` binary'si 4 haneli bir PIN ister. `ltrace` işe yaramıyor — PIN'i GDB ile assembly kodunu okuyarak bul.

### 📖 Teori: GDB ve Assembly

**GDB (GNU Debugger):** Binary'leri adım adım çalıştırmaya ve iç durumlarını incelemeye yarayan hata ayıklama aracı.

**Assembly:** Makine koduna en yakın programlama dili. Her satır genellikle tek bir işlem yapar.

Kritik GDB komutları:
```
gdb --args program argüman   → GDB başlat
disassemble main             → main fonksiyonunun assembly kodunu göster
break *0xADRES               → o adreste dur
run                          → programı çalıştır
info registers               → register değerlerini göster
print $ebp-0xc               → adresi hesapla
x 0xADRES                   → o adresteki değeri göster
print/d 0xHEX                → hex'i decimal'e çevir
```

**Temel assembly kavramları:**
- `cmp a, b` → a ile b'yi karşılaştır
- `jne adres` → eşit değilse o adrese atla
- `atoi` → string'i integer'a çevirir (bizim girişimiz)
- `movl $0x1bd3, -0xc(%ebp)` → sabit değeri belleğe yaz (PIN burada!)

### 🔧 Çözüm

```bash
leviathan6@leviathan:~$ ls -la
-r-sr-x---  1 leviathan7 leviathan6 7452 leviathan6   # SUID

leviathan6@leviathan:~$ ./leviathan6 0000
Wrong

# ltrace işe yaramıyor — farklı bir yöntem lazım
# GDB ile assembly'ye bakalım
leviathan6@leviathan:~$ gdb --args leviathan6 0000

(gdb) disassemble main
# ...
0x080491ea <+20>: movl $0x1bd3,-0xc(%ebp)   # ← sabit değer yükleniyor!
# ...
0x08049222 <+76>: call atoi                  # bizim girişimizi integer'a çevir
0x0804922a <+84>: cmp %eax,-0xc(%ebp)        # karşılaştır
0x0804922d <+87>: jne ...                    # eşit değilse atla (başarısız)
```

Breakpoint koy, register değerlerini oku:

```bash
(gdb) break *0x0804922a
(gdb) run

Breakpoint 1, 0x0804922a in main ()

(gdb) print $ebp-0xc
$1 = 0xffffd4cc

(gdb) x 0xffffd4cc
0xffffd4cc: 0x00001bd3

(gdb) print/d 0x00001bd3
$3 = 7123          # ← PIN bu!
```

```bash
leviathan6@leviathan:~$ ./leviathan6 7123
$                  # shell açıldı!

$ whoami
leviathan7

$ cat /etc/leviathan_pass/leviathan7
<şifre buraya gelir>
```

### 🔧 Alternatif — Brute Force
GDB'yi öğrenmek istemiyorsan kaba kuvvetle de çözülebilir:
```bash
for i in {0000..9999}; do
    result=$(./leviathan6 $i 2>/dev/null)
    if [ "$result" != "Wrong" ]; then
        echo "PIN: $i → $result"
        break
    fi
done
```

---

## 🏁 Level 7 — Tebrikler!

```bash
ssh leviathan7@leviathan.labs.overthewire.org -p 2223

leviathan7@leviathan:~$ cat CONGRATULATIONS
Well done, you seem to have used a light to see in the dark...
```

---

## 📚 Öğrenilen Komutlar ve Kavramlar

| Komut / Kavram | Ne yapar |
|---|---|
| `grep "kelime" dosya` | Dosyada kelime arar |
| `strings binary` | Binary içindeki metinleri çıkarır |
| `ltrace ./binary` | Kütüphane çağrılarını gösterir (strcmp şifresi!) |
| `ln -s hedef bağ` | Sembolik link oluşturur |
| `chmod 777 klasör` | Herkese tam yetki verir |
| `gdb --args prog arg` | GDB ile debug başlatır |
| `disassemble main` | Assembly kodunu gösterir |
| `break *0xADRES` | Breakpoint koyar |
| `info registers` | Register değerlerini gösterir |
| `print/d 0xHEX` | Hex'i decimal'e çevirir |
| `perl -lpe '$_=pack"B*",$_'` | Binary'yi ASCII'ye çevirir |
| **SUID binary** | Sahibinin yetkileriyle çalışan program |
| **Privilege Escalation** | Daha yüksek yetki elde etme |
| **TOCTOU** | Kontrol ile kullanım arasındaki açık |
| **Symbolic Link** | Dosyaya işaret eden kısayol |

---

## 🔗 Faydalı Kaynaklar

- [OverTheWire Leviathan](https://overthewire.org/wargames/leviathan/)
- [MayADevBe Leviathan Walkthrough](https://mayadevbe.me/posts/overthewire/leviathan/overview/)
- [GDB Cheat Sheet](https://darkdust.net/files/GDB%20Cheat%20Sheet.pdf)
- [ASCII Tablosu](https://www.asciitable.com/)
- [Intel vs AT&T Assembly Syntax](https://imada.sdu.dk/u/kslarsen/dm546/Material/IntelnATT.htm)

---

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
