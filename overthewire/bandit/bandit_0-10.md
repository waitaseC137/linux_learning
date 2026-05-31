# 🏴 OverTheWire: Bandit — Level 0'dan Level 10'a Türkçe Rehber

> **Bandit**, Linux terminal becerilerini oyun oynayarak geliştirmenin en iyi yollarından biri.  
> Bu rehberde ilk 10 seviyeyi adım adım, **neden böyle yaptığımızı açıklayarak** çözeceğiz.  
> Şifreler zaman zaman değiştiğinden burada **yöntem** paylaşılıyor, şifreler değil.

**Referans:** [mayadevbe.me](https://mayadevbe.me/posts/overthewire/bandit/overview/) · [overthewire.org](https://overthewire.org/wargames/bandit/)

---

## 📋 Genel Bilgi

| Bilgi | Değer |
|---|---|
| **Sunucu** | `bandit.labs.overthewire.org` |
| **Port** | `2220` |
| **Başlangıç kullanıcısı** | `bandit0` |
| **Başlangıç şifresi** | `bandit0` |

> 💡 Her level'da bulduğun şifreyi bir yere not et. Şifreler otomatik kaydedilmez!

---

## Level 0 — SSH ile Bağlan

### 🎯 Görev
Sunucuya SSH ile bağlan.

### 📖 Teori: SSH Nedir?
**SSH (Secure Shell Protocol)**, uzak bir sunucuya şifreli bağlantı kurmanı sağlar. İki bilgisayar arasındaki tüm iletişimi şifreler, bu yüzden güvenlidir.

Temel komut yapısı:
```
ssh <kullanici>@<sunucu> -p <port>
```

- `kullanici@sunucu` → kimin, nereye bağlandığını belirtir
- `-p 2220` → varsayılan SSH portu 22'dir; biz farklı bir port kullanıyoruz
- Herhangi bir komut hakkında daha fazla bilgi için: `man ssh`

Windows kullanıcıları için [PuTTY](https://www.putty.org/) ile de bağlanabilirsin.

### 🔧 Çözüm
```bash
ssh bandit0@bandit.labs.overthewire.org -p 2220
# Şifre sorduğunda: bandit0
```

Bağlantı kurulunca `bandit0@bandit:~$` promptunu görürsün — başardın!

---

## Level 0 → Level 1 — Temel Dosya Komutları

### 🔐 Bağlantı
```bash
ssh bandit0@bandit.labs.overthewire.org -p 2220
# Şifre: bandit0
```

### 🎯 Görev
Home dizinindeki `readme` dosyasını oku, içindeki şifreyi bul.

### 📖 Teori: pwd, ls, cat

SSH ile bağlandığında **home dizinine** düşersin. Prompttaki `~` sembolü bunu gösterir:
```
bandit0@bandit:~$
```

Temel komutlar:
- `pwd` → hangi dizinde olduğunu gösterir *(print working directory)*
- `ls` → bulunduğun dizindeki dosyaları listeler. `-l` ile detaylı, `-a` ile gizliler dahil gösterir
- `cat <dosya>` → dosyanın içeriğini terminale basar

### 🔧 Çözüm
```bash
bandit0@bandit:~$ ls
readme

bandit0@bandit:~$ cat readme
# Çıktı: sonraki level'ın şifresi
```

---

## Level 1 → Level 2 — Özel İsimli Dosya: `-`

### 🔐 Bağlantı
```bash
ssh bandit1@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
`-` adlı dosyayı oku.

### 📖 Teori: Tire (`-`) Karakteri

`-` Linux'ta **standart opsiyon karakteridir** — komutlara bayrak eklemek için kullanılır (`-p`, `-a` gibi). Bu yüzden dosya adı olarak kullanmak sorun çıkarır:

```bash
bandit1@bandit:~$ cat -
# Terminal bekler, hiçbir şey döndürmez — çünkü stdin'i okumaya çalışır
```

Çözüm: dosyayı **tam yoluyla** belirtmek. `./` "şu an bulunduğum dizin" anlamına gelir, böylece `-` özel karakter değil gerçek bir dosya adı olarak yorumlanır.

### 🔧 Çözüm
```bash
bandit1@bandit:~$ ls
-

bandit1@bandit:~$ cat ./-
# Çıktı: sonraki level'ın şifresi
```

---

## Level 2 → Level 3 — İsimde Boşluk Olan Dosya

### 🔐 Bağlantı
```bash
ssh bandit2@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
`spaces in this filename` adlı dosyayı oku.

### 📖 Teori: Boşluk ve Tırnak İşareti

Linux terminali **boşluğu argüman ayırıcı** olarak kullanır. Bu yüzden:
```bash
bandit2@bandit:~$ cat spaces in this filename
cat: spaces: No such file or directory
cat: in: No such file or directory
cat: this: No such file or directory
cat: filename: No such file or directory
```
4 ayrı dosya aradı, hiçbirini bulamadı.

**İki çözüm yolu:**

**Yöntem 1 — Tırnak içine al:**  
Tüm string'i tek bir argüman sayar.

**Yöntem 2 — Backslash ile escape et:**  
`\` bir sonraki karakteri özel anlam taşımayan düz karakter yapar.

> 💡 **İpucu:** Dosya adının başını yazıp **Tab** tuşuna bassanın otomatik tamamlama boşlukları otomatik escape'ler!

### 🔧 Çözüm
```bash
bandit2@bandit:~$ cat "spaces in this filename"
# ya da
bandit2@bandit:~$ cat spaces\ in\ this\ filename
# Çıktı: sonraki level'ın şifresi
```

---

## Level 3 → Level 4 — Gizli Dosyalar

### 🔐 Bağlantı
```bash
ssh bandit3@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
`inhere` klasöründeki gizli dosyayı bul ve oku.

### 📖 Teori: Gizli Dosyalar ve cd

Linux'ta adı **`.` ile başlayan dosyalar gizlidir** — `ls` bunları varsayılan olarak göstermez. `.bashrc`, `.gitignore` gibi yapılandırma dosyaları bu yüzden gizlidir.

```bash
ls      # sadece normal dosyaları gösterir
ls -a   # tüm dosyaları gösterir (gizliler dahil)
ls -la  # tüm dosyaları, detaylı liste formatında gösterir
```

`-a` çıktısında ilk iki gizli girdi özeldir:
- `.` → mevcut dizin
- `..` → üst dizin

**Dizin gezmek için `cd` komutu:**
- `cd inhere` → inhere klasörüne gir
- `cd ..` → bir üst dizine çık
- `cd ~` → home dizinine dön
- `cd /` → kök dizinine git

### 🔧 Çözüm — Dizin Gezinerek
```bash
bandit3@bandit:~$ cd inhere
bandit3@bandit:~/inhere$ ls -a
.  ..  .hidden

bandit3@bandit:~/inhere$ cat .hidden
# Çıktı: sonraki level'ın şifresi
```

### 🔧 Alternatif — Dizine Girmeden
```bash
bandit3@bandit:~$ ls -a inhere/
bandit3@bandit:~$ cat inhere/.hidden
```

---

## Level 4 → Level 5 — İnsan Okunabilir Dosya

### 🔐 Bağlantı
```bash
ssh bandit4@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
`inhere` klasöründeki 10 dosyadan sadece **insan okunabilir** olanı bul.

### 📖 Teori: file Komutu ve Wildcard

`file <dosya>` komutu dosyanın **veri tipini** söyler: `ASCII text`, `data`, `ELF`, `Perl script` vb.

Binary (ikili) dosyayı `cat` ile okumaya çalışırsan terminale anlamsız karakterler dolar. **İnsan okunabilir** demek ASCII veya Unicode kodlamalı metin demektir.

**Wildcard (`*`):** Birden fazla dosya için pattern matching sağlar. `file ./*` komutu, mevcut dizindeki tüm dosyaların tipini tek seferde gösterir.

Dosya adları `-` ile başladığından yine `./` prefixi gerekli (Level 1'deki sebep).

### 🔧 Çözüm
```bash
bandit4@bandit:~$ cd inhere
bandit4@bandit:~/inhere$ file ./*
./-file00: data
./-file01: data
./-file02: data
./-file03: data
./-file04: data
./-file05: data
./-file06: data
./-file07: ASCII text   ← bu!
./-file08: data
./-file09: data

bandit4@bandit:~/inhere$ cat ./-file07
# Çıktı: sonraki level'ın şifresi
```

---

## Level 5 → Level 6 — `find` ile Çok Kriterli Arama

### 🔐 Bağlantı
```bash
ssh bandit5@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
`inhere` altındaki klasörlerde şu özelliklere sahip dosyayı bul:
- İnsan okunabilir (ASCII)
- Boyutu **1033 byte**
- Çalıştırılamaz (non-executable)

### 📖 Teori: find ve grep

`find` komutu dosyaları birden fazla kritere göre arar:
```
find [nereden] [kriter1] [kriter2] ...
```

Önemli bayraklar:
- `-type f` → sadece dosyalar (dizinler hariç)
- `-size 1033c` → tam olarak 1033 byte (`c` = byte)
- `! -executable` → çalıştırılamaz olanlar
- `-exec <komut> '{}' \;` → bulunan her dosyaya komut uygular

`grep` ile `|` (pipe) kombinasyonu: bir komutun çıktısını diğerine giriş olarak verir.
- `grep "ASCII"` → ASCII içeren satırları filtreler
- `grep -v "pattern"` → o pattern'i **içermeyen** satırları gösterir

### 🔧 Çözüm — Tek Komut
```bash
bandit5@bandit:~/inhere$ find . -type f -size 1033c ! -executable -exec file '{}' \; | grep ASCII
./maybehere07/.file2: ASCII text, with very long lines

bandit5@bandit:~/inhere$ cat ./maybehere07/.file2
# Çıktı: sonraki level'ın şifresi
```

### 🔧 Alternatif — Boyuta Göre
```bash
bandit5@bandit:~/inhere$ du -b -a | grep 1033
1033    ./maybehere07/.file2
```
`du -b -a` her dosyanın byte cinsinden boyutunu verir; `grep 1033` ile filtreleriz.

---

## Level 6 → Level 7 — Tüm Sunucuda Arama

### 🔐 Bağlantı
```bash
ssh bandit6@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
Şifre **sunucunun herhangi bir yerinde** saklanmış. Özellikleri:
- Sahibi (user): `bandit7`
- Grubu (group): `bandit6`
- Boyutu: **33 byte**

### 📖 Teori: Dosya Sahipliği ve 2>/dev/null

Linux'ta her dosyanın bir **kullanıcısı** ve bir **grubu** vardır. `ls -l` ile görürsün:
```
-rw-r----- 1 bandit7 bandit6 33 May 7 2020 bandit7.password
             ^user    ^group
```

`find` ile sahiplik bazlı arama:
- `-user bandit7` → sahibi bandit7 olan dosyalar
- `-group bandit6` → grubu bandit6 olan dosyalar

**`2>/dev/null` nedir?**  
`/` kök dizinden tarama yaparken erişim iznin olmayan yüzlerce klasör için `Permission denied` hatası alırsın. `2>` **standart hata çıktısını** yönlendirir; `/dev/null` ise Linux'taki "çöp kutusu" — oraya gönderilen her şey kaybolur.

### 🔧 Çözüm
```bash
bandit6@bandit:~$ find / -type f -user bandit7 -group bandit6 -size 33c 2>/dev/null
/var/lib/dpkg/info/bandit7.password

bandit6@bandit:~$ cat /var/lib/dpkg/info/bandit7.password
# Çıktı: sonraki level'ın şifresi
```

---

## Level 7 → Level 8 — `grep` ile Metin İçi Arama

### 🔐 Bağlantı
```bash
ssh bandit7@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
`data.txt` dosyasında `millionth` kelimesinin yanındaki şifreyi bul.

### 📖 Teori: grep ve pipe

`data.txt` yaklaşık 4 MB büyüklüğünde — binlerce satır içerir, elle aramak imkânsız:
```bash
bandit7@bandit:~$ du -b data.txt
4184396 data.txt
```

`grep <pattern> <dosya>` komutu, dosya içinde pattern ile eşleşen satırları bulur. Gerçek dünyada log analizi ve hata ayıklamada çok kritiktir.

**Pipe (`|`):** Bir komutun çıktısını doğrudan bir sonraki komuta giriş olarak verir:
```bash
cat data.txt | grep millionth
# cat çıktısı → grep'e giriş olur
```

### 🔧 Çözüm
```bash
bandit7@bandit:~$ cat data.txt | grep millionth
millionth       <şifre buraya gelir>

# Ya da daha kısa:
bandit7@bandit:~$ grep millionth data.txt
```

---

## Level 8 → Level 9 — Tekil Satırı Bul

### 🔐 Bağlantı
```bash
ssh bandit8@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
`data.txt` içinde **sadece bir kez geçen** satırı bul.

### 📖 Teori: sort ve uniq

**`sort`:** Satırları alfabetik sıraya dizer. `-r` ile ters sıralar, `-n` ile sayısal sıralar.

**`uniq`:** Aynı satırların tekrar eden kopyalarını filtreler. Ama dikkat: `uniq` yalnızca **yan yana aynı olan** satırları yakalar. Bu yüzden önce `sort` gereklidir.

```
uniq bayrakları:
  -u  → sadece unique (tekil, yalnızca 1 kez geçen) satırlar
  -d  → sadece duplicate (tekrar eden) satırlar
  -c  → her satırın kaç kez geçtiğini sayar
```

**Pipe zinciri:** `sort data.txt | uniq -u`  
→ sort çıktısı → uniq'e giriş → tekil satır ekrana gelir

### 🔧 Çözüm
```bash
bandit8@bandit:~$ sort data.txt | uniq -u
# Çıktı: sonraki level'ın şifresi (tek satır)
```

---

## Level 9 → Level 10 — Binary Dosyada String Arama

### 🔐 Bağlantı
```bash
ssh bandit9@bandit.labs.overthewire.org -p 2220
```

### 🎯 Görev
`data.txt` binary bir dosya. İçindeki **okunabilir string**lerden, birkaç `=` işaretiyle başlayan birini bul.

### 📖 Teori: strings Komutu

Binary dosyayı `cat` ile açarsan ekrana anlamsız karakterler dolar — çünkü dosya binary formatta. `strings` komutu binary dosyalardaki **yazdırılabilir karakter dizilerini** (minimum 4 karakter) çıkarır. Özellikle binary/executable analiz için kullanılır.

Ardından `grep "==="` ile `=` içeren satırları filtreleyebiliriz.

**Pipe zinciri:** `strings data.txt | grep "==="`  
→ strings çıktısı → grep filtreler → şifre görünür

### 🔧 Çözüm
```bash
bandit9@bandit:~$ strings data.txt | grep ===
========== the
========== password
========== is
========== <şifre buraya gelir>
```

> Kaç `=` koyduğun pek fark etmez; 1 ile 10 arası aynı sonucu verir.

---

## 📚 Öğrenilen Komutlar Özeti

| Komut | Ne yapar |
|---|---|
| `ssh user@host -p port` | Uzak sunucuya güvenli bağlan |
| `pwd` | Mevcut dizini göster |
| `ls` / `ls -la` | Dosyaları listele (gizliler dahil) |
| `cat dosya` | Dosya içeriğini göster |
| `cat ./-` | Özel karakterli (`-`) dosyaları oku |
| `cat "ad li dosya"` | İsimde boşluk olan dosyaları oku |
| `cd klasör` | Klasöre gir |
| `file ./*` | Tüm dosyaların türünü göster |
| `find / -user X -group Y -size 33c` | Kritere göre dosya ara |
| `grep "pattern" dosya` | Dosya içinde metin ara |
| `sort dosya` | Satırları sırala |
| `uniq -u` | Tekil satırları göster |
| `strings dosya` | Binary'den okunabilir metin çıkar |
| `du -b dosya` | Dosya boyutunu byte cinsinden göster |
| `2>/dev/null` | Hata mesajlarını sustur |
| `\|` (pipe) | Komutları zincir gibi bağla |

---

## 🔗 Faydalı Kaynaklar

- [OverTheWire Bandit](https://overthewire.org/wargames/bandit/)
- [MayADevBe Full Walkthrough](https://mayadevbe.me/posts/overthewire/bandit/overview/)
- [Linux Man Pages](https://manpages.ubuntu.com/)
- [Explain Shell](https://explainshell.com/) — Komutları görsel olarak açıklar
- [Linux Komutlarına Giriş](https://manpages.ubuntu.com/manpages/noble/man1/intro.1.html)

---

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
