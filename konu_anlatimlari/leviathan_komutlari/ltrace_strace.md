# ltrace ve strace

Binary'lerin çalışma anındaki davranışını izlemeye yarayan araçlar. Kaynak koda gerek kalmadan binary'nin ne yaptığını anlayabilirsin.

---

## ltrace — Kütüphane Çağrısı İzleyici

```bash
ltrace ./binary
ltrace ./binary argüman
ltrace -e strcmp ./binary     # sadece strcmp çağrılarını göster
```

Binary çalışırken yaptığı **C kütüphane fonksiyon çağrılarını** (libc) gerçek zamanlı gösterir.

```bash
$ ltrace ./check
printf("password: ")
getchar()          → 's'
getchar()          → 'e'
getchar()          → 'x'
strcmp("sex", "sex")   = 0   ← eşleşti!
system("/bin/sh")              ← shell açıldı
```

**Neden bu kadar güçlü?**  
Şifre kontrolü sıklıkla `strcmp(girilen, gerçek_şifre)` şeklinde yapılır. `ltrace` her iki argümanı da gösterir — gerçek şifre doğrudan görünür.

**Dikkat — Yanıltıcı çağrılar:**
```bash
$ ltrace ./level3
strcmp("h0no33", "kakaka")     ← BU GERÇEK DEĞİL (bizi şaşırtmak için)
printf("Enter the password> ")
fgets("test\n", 256, ...)
strcmp("test\n", "snlprintf\n") ← GERÇEK KARŞILAŞTIRMA
```

Binary içinde birden fazla `strcmp` olabilir. Hangisinin asıl kontrol olduğunu anlamak için sıralamaya ve bağlama dikkat et.

---

## İzlenen Yaygın Fonksiyonlar

### strcmp — String Karşılaştırma

```c
strcmp(s1, s2)
// Dönüş: 0 → eşit, <0 → s1 < s2, >0 → s1 > s2
```

Şifre kontrollerinde en sık kullanılan fonksiyon. `ltrace` çıktısında:
```
strcmp("girilen_şifre", "gerçek_şifre") = -1
```

### fgets — Girdi Okuma

```c
fgets(buffer, boyut, stdin)
```

Kullanıcıdan satır okur. `ltrace` çıktısında hangi buffer'a ne yazıldığını görebilirsin.

### fopen — Dosya Açma

```c
fopen("/tmp/file.log", "r")
// Dönüş: 0 → dosya bulunamadı, diğer → başarılı
```

Binary'nin hangi dosyayı açmaya çalıştığını görürsün:
```bash
$ ltrace ./leviathan5
fopen("/tmp/file.log", "r") = 0   ← dosya yok
puts("Cannot find /tmp/file.log")
```

Bu bilgiyle `/tmp/file.log`'u şifre dosyasına link edebilirsin.

### access — Erişim Kontrolü

```c
access("/path/to/file", 4)   // 4 = okuma izni
// Dönüş: 0 → erişim var, -1 → yok
```

`access()` ardından `open()`/`system()` görüyorsan dikkat: ikisi arasındaki **fark** exploit edilebilir. İki yol vardır — (1) string'i farklı ayrıştırarak (Leviathan 2'deki boşlukla argüman bölme), (2) aradaki zaman penceresinde dosyayı değiştirerek (gerçek **TOCTOU** yarışı).

### system — Komut Çalıştırma

```c
system("/bin/cat /path/to/file")
```

Binary'nin çalıştırdığı shell komutlarını gösterir:
```bash
$ ltrace ./printfile .bashrc
access(".bashrc", 4)                     = 0
snprintf("/bin/cat .bashrc", 511, ...)   = 16
system("/bin/cat .bashrc")               ← komut bu!
```

---

## strace — Sistem Çağrısı İzleyici

```bash
strace ./binary
strace -e open,read ./binary    # sadece open ve read çağrıları
strace -p <PID>                 # çalışan sürece bağlan
```

`ltrace`'ten daha düşük seviye — kütüphane fonksiyonları değil, **kernel sistem çağrılarını** (syscall) gösterir.

```bash
$ strace ./check
execve("./check", ["./check"], ...)
open("/etc/ld.so.cache", O_RDONLY)
read(3, "\177ELF"..., 512)
write(1, "password: ", 10)
read(0, "test\n", 1024)
...
```

**ltrace vs strace:**

| | ltrace | strace |
|---|---|---|
| Gösterdiği | Kütüphane fonksiyonları (strcmp, printf...) | Kernel çağrıları (read, write, open...) |
| Seviye | Yüksek (anlaşılır) | Düşük (ayrıntılı) |
| Şifre bulmak için | ✅ Daha iyi | ❌ Daha zor |
| Dosya erişimi görmek için | ✅ fopen ile | ✅ open syscall ile |

Leviathan'da genellikle `ltrace` yeterlidir. `strace` daha çok dosya sistemi erişimlerini araştırmak için kullanılır.
