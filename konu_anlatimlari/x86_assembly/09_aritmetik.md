# ➕ x86 Assembly — Aritmetik: `add`, `sub` ve Eksi Sayıların Sırrı

> 04'te işçinin dansını çizdik: **AL** (depodan cebe) → **İŞLE** (cepte hesapla) → **BIRAK** (cepten depoya).
> 08'de **AL** ile **BIRAK**'ı gerçek `mov` komutuyla yaptık — ama ortadaki **İŞLE** hep boş kaldı: taşıdık durduk, hiç *hesaplamadık.*
> İşte o eksik parça bu derste doluyor. `add` ve `sub` ile ilk kez makineye bir **hesap** yaptırıyorsun; sonra da 06'da bıraktığımız bir borcu — "eksi sayılar byte'a nasıl sığıyor?" — ödüyoruz.

> **Bu derste kod var ve hepsini çalıştırıyoruz.** Aşağıdaki her program ve her GDB çıktısı gerçek: kendi makinemde derleyip koşturdum, gördüğün sayılar uydurma değil.

---

## 📋 İçindekiler

- [`add`: İşçinin Toplama Emri](#add-i%CC%87%C5%9F%C3%A7inin-toplama-emri)
- [İlk Hesap Programı](#i%CC%87lk-hesap-program%C4%B1)
- [GDB'de İzle: Toplama Canlı](#gdbde-i%CC%87zle-toplama-canl%C4%B1)
- [`sub`: Çıkarma](#sub-%C3%A7%C4%B1karma)
- [`inc` / `dec`: Bir Artır, Bir Azalt](#inc--dec-bir-art%C4%B1r-bir-azalt)
- [Eksi Sayıların Sırrı: Two's Complement](#eksi-say%C4%B1lar%C4%B1n-s%C4%B1rr%C4%B1-twos-complement)
- [Dansın Tamamı: AL → İŞLE → BIRAK](#dans%C4%B1n-tamam%C4%B1-al--i%CC%87%C5%9Fle--birak)

---

## `add`: İşçinin Toplama Emri

01'de işçinin emir çeşitlerine bakarken ikinci sıraya "**hesapla**"yı koymuştuk. En temeli toplama, ve gerçek adı `add` (İngilizce *add*, "ekle").

Yazılışı `mov`'a çok benzer — iki kutu alır:

```nasm
add hedef, kaynak        ; "hedef'in içine, kaynak'ı EKLE"
```

Ama `mov`'dan bir farkı var, ve bütün mesele bu farkta:

- `mov eax, 3` → eax'in eski değeri **silinir**, yerine 3 gelir. (*koyar*)
- `add eax, 3` → eax'in eski değeri **durur**, üstüne 3 eklenir. (*ekler*)

Yani `add` hedefi sıfırlamaz; **var olanın üstüne** koyar. `eax`'te 5 varken `add eax, 3` dersen, eax artık 8 olur (5 + 3). İşte 04'ün **İŞLE** adımının en temel hâli bu.

> 🔑 `add hedef, kaynak` = "hedef = hedef + kaynak." `mov`'un aksine eskiyi silmez, üstüne ekler. `mov` koyar, `add` biriktirir.

---

## İlk Hesap Programı

Şimdi ilk kez makineye bir toplama yaptıralım. `topla.asm`:

```nasm
section .text
    global _start

_start:
    mov eax, 5          ; eax = 5
    add eax, 3          ; eax = 5 + 3 = 8
    mov ebx, eax        ; sonucu çıkış koduna
    mov eax, 1
    int 0x80
```

Artık bu satırların hepsini okuyabiliyorsun: `mov eax, 5` beşi koyar, `add eax, 3` üstüne üç ekler (eax = 8), `mov ebx, eax` sonucu çıkış koduna taşır. Tanıdık zincirle çevir, birleştir, çalıştır:

```
nasm -f elf32 topla.asm -o topla.o
ld -m elf_i386 topla.o -o topla
./topla
echo $?
```

Göreceğin (fish kabuğunda `echo $status`):

```
8
```

**İşte ilk hesabın.** Bu `8`'i sen doğrudan yazmadın — makine `5 + 3`'ü *kendisi* yaptı. 06'da makineye bir sayı *söylüyordun*; şimdi ona bir işlem *yaptırıyorsun.*

---

## GDB'de İzle: Toplama Canlı

06'daki "bilmek ile görmek arası fark"ı hatırla. `add`'in eax'i nasıl değiştirdiğini gözünle görelim (07'deki alışkanlık):

```
gdb ./topla
(gdb) set disassembly-flavor intel
(gdb) starti
```

Önce `mov eax, 5`'i çalıştır, eax'e bak:

```
(gdb) si
(gdb) info registers eax
```
```
eax            0x5                 5
```

`eax` şimdi `5`. Şimdi asıl olay — `add eax, 3`:

```
(gdb) si
(gdb) info registers eax
```
```
eax            0x8                 8
```

**İşte İŞLE.** `eax` `5`'ken `8` oldu — makine gözünün önünde topladı. `add`, eski 5'i silmedi; üstüne 3 ekledi. 04'te Türkçe taslak olarak çizdiğimiz "cepte hesapla" adımını ilk kez gerçek bir komutla yaptın.

---

## `sub`: Çıkarma

Toplamanın kardeşi çıkarma: `sub` (İngilizce *subtract*). Kuralı birebir aynı, sadece ekler yerine çıkarır:

```nasm
sub hedef, kaynak        ; "hedef = hedef − kaynak"
```

`cikar.asm`:

```nasm
section .text
    global _start

_start:
    mov eax, 10         ; eax = 10
    sub eax, 4          ; eax = 10 − 4 = 6
    mov ebx, eax
    mov eax, 1
    int 0x80
```

Çevir, birleştir, çalıştır, `echo $?`:

```
6
```

`10 − 4 = 6`. `add` ile `sub` — işçinin iki temel hesabı. İkisi de aynı kalıp: "hedefi, kaynakla güncelle." Toplama biriktirir, çıkarma eksiltir.

> 💡 `add`/`sub` yaparken işçi bir de kenara küçük notlar tutar: "sonuç sıfır mı çıktı? taştı mı?" gibi. Bu notlara **bayrak** (*flag*) denir ve şu an onları görmezden geliyoruz — ama bir sonraki derste (10) bütün *kararların* (if, döngü) temeli onlar olacak. Şimdilik "add topluyor, sub çıkarıyor" yeter.

---

## `inc` / `dec`: Bir Artır, Bir Azalt

Çok sık ihtiyacın olan iki minik komut daha — bir sayıyı **tam olarak 1** artırmak ya da azaltmak:

- `inc hedef` → hedefi 1 artır (*increment*). `inc eax` = `add eax, 1` ile aynı iş.
- `dec hedef` → hedefi 1 azalt (*decrement*). `dec eax` = `sub eax, 1`.

`incdec.asm`:

```nasm
section .text
    global _start

_start:
    mov eax, 7          ; 7
    inc eax             ; 8
    inc eax             ; 9
    dec eax             ; 8
    mov ebx, eax
    mov eax, 1
    int 0x80
```

`echo $?`:

```
8
```

`7 → 8 → 9 → 8`. Neden ayrı komut? Çünkü "birer birer sayma" o kadar sık ki (özellikle döngülerde), makine buna kısa yol koymuş. Bir sayaç ilerletirken sürekli `inc` göreceksin.

---

## Eksi Sayıların Sırrı: Two's Complement

Şimdi 06'da verdiğimiz sözü tutuyoruz. Orada `mov ebx, -5` yapınca `echo $?`'ın **251** dediğini görmüş, "nasıl olduğunu 09'da açacağız" demiştik. İşte 09'dayız.

Önce soruyu net koyalım. `sub` çıkarır — peki sonuç eksiye düşerse ne olur? Deneyelim. `eksi.asm`: `5 − 8`, yani **−3**.

```nasm
section .text
    global _start

_start:
    mov eax, 5
    sub eax, 8          ; eax = 5 − 8 = −3 ... ama byte'ta eksi nasıl durur?
    mov ebx, eax
    mov eax, 1
    int 0x80
```

`echo $?`:

```
253
```

**İşte bilmece.** `−3` beklerken `253` çıktı. GDB'ye sorunca sır biraz aralanıyor:

```
(gdb) si                    # mov eax, 5
(gdb) si                    # sub eax, 8
(gdb) info registers eax
```
```
eax            0xfffffffd          -3
```

Bak ne güzel: GDB `eax`'i hem ham hâliyle (`0xfffffffd`) hem de "bu aslında **−3**" diye gösteriyor. Yani makine `−3`'ü belleğinde `0xFFFFFFFD` olarak tutuyor. Peki bu sayı neden `−3` demek?

### Kilometre sayacı gibi düşün

Bir arabanın kilometre sayacı `000`'dayken bir **geri** gitsen ne olur? `999`'a döner. İşte makinenin eksi mantığı tam bu: **0'dan bir geri = en tepe.**

Tek bir byte (0–255) için:

```
   0 − 1  →  255   (yani 255, "−1" demek)
   0 − 2  →  254   (   "−2")
   0 − 3  →  253   (   "−3")   ← bizim sonucumuz!
```

Sayı yukarı taştığında dipten sardığı gibi (06: `300 → 44`), aşağı eksiye taştığında da **tepeden** sarar. `5 − 8`, `−3`'e denk gelen `253`'ü verir. 06'daki `−5 → 251` de tam bu: `−5` = `256 − 5` = `251`.

### Tarifi: ters çevir, 1 ekle

Bir sayının eksisini üretmenin kısa yolu var — **bütün bitleri ters çevir, sonra 1 ekle.** `3` için (byte olarak):

```
 3            =  0000 0011
 bitleri ters =  1111 1100   (0xFC)
 + 1          =  1111 1101   (0xFD = 253 = −3)
```

İşte `−3`'ün byte hâli `0xFD` (253). 32 bitte aynı numara daha uzun yazılır: `0xFFFFFFFD` — yukarıda GDB'nin gösterdiği tam bu. Bu "ters çevir + 1 ekle" numarasının adı **two's complement** (ikiye tümleyen).

### Neden bu kadar zekice? Çünkü çıkarma diye bir şey yok

İşte işin güzel yanı, ve 01'in "makine aslında çok basit" temasının doruğu: makinenin ayrı bir "çıkarma devresi" **yoktur.** Çıkarma, sadece **eksisini toplamaktır.** `5 − 3`, makinenin gözünde `5 + (−3)`'tür.

Kanıtlayalım. `−3`'ün byte hâli `253` (32-bitte `0xFFFFFFFD`) demiştik. O hâlde `5 − 3` yerine `5`'e doğrudan `0xFFFFFFFD` **eklersek** de `2` çıkmalı. `negekle.asm`:

```nasm
section .text
    global _start

_start:
    mov eax, 5
    add eax, 0xFFFFFFFD   ; 5 + (−3'ün two's complement hâli)
    mov ebx, eax
    mov eax, 1
    int 0x80
```

`echo $?`:

```
2
```

**İşte kanıt.** `sub eax, 3` yazmadık — `add` ile `−3`'ü ekledik, ve `5 − 3 = 2` çıktı. Yani `sub`, perde arkasında "eksisini `add`'le" demekten başka bir şey değil. Makine tek bir toplama devresiyle hem toplar hem çıkarır; two's complement bunu mümkün kılan hile.

> 🔑 Makine eksi sayıyı **two's complement** ile tutar: bitleri ters çevir + 1 ekle (`−3` → `0xFD`/`0xFFFFFFFD`). Aşağı taşan sayı tepeden sarar (`0−3 → 253`), tıpkı kilometre sayacı gibi — 06'daki `−5 → 251` bilmecesinin cevabı bu. Ve asıl güzelliği: çıkarma ayrı bir iş değil, sadece **eksisini toplamaktır** — makine tek bir toplama devresiyle ikisini de yapar.

> 💡 **Aklınıza takılabilir:** *"Makine `253`'ün `−3` mü yoksa gerçekten `253` mü olduğunu nereden biliyor?"* Bilmiyor — ve bu tanıdık gelmeli, çünkü [01.5_sayi_ve_anlam](./01.5_sayi_ve_anlam.md)'ın ta kendisi: aynı bit dizisi, bir komutun gözünde `253`, başkasının gözünde `−3`. Farkı, sayıyı **eksili mi eksisiz mi** okuduğunu söyleyen komut belirler (GDB yukarıda "−3" derken eksili okumayı seçti). Aynı sayı, iki anlam; anlamı yine kod verir.

---

## Dansın Tamamı: AL → İŞLE → BIRAK

Artık üç adımın üçü de elinde. 04'te tam olarak şu görevi Türkçe taslak olarak çizmiştik:

```
 Görev: 100. kutudaki sayı ile 200. kutudaki sayıyı topla, sonucu 300. kutuya yaz.
   AL   : 100. kutuyu → EAX
   İŞLE : üstüne 200. kutuyu ekle
   BIRAK: sonucu geri kutuya yaz
```

O zaman "gerçek komutları sonra göreceğiz" demiştik. İşte hepsi hazır. `dans.asm`:

```nasm
section .data
    a:     dd 100
    b:     dd 200
    sonuc: dd 0

section .text
    global _start

_start:
    mov eax, [a]        ; AL   : a'yı cebe çek        (eax = 100)
    add eax, [b]        ; İŞLE : üstüne b'yi ekle      (eax = 300)
    mov [sonuc], eax    ; BIRAK: sonucu depoya bırak
    mov eax, 1
    mov ebx, 0
    int 0x80
```

Küçük bir güzellik: `add eax, [b]`'de toplananı **doğrudan bellekten** okuduk — önce ayrı bir `mov` ile cebe çekmeden. 04'te "x86 bazen kestirmeye izin verir, doğrudan bir bellek kutusuna dokunabilirsin" diye dürüst bir not düşmüştük ya — işte o kestirme bu.

GDB'de dansı adım adım izleyelim:

```
gdb ./dans
(gdb) set disassembly-flavor intel
(gdb) starti
(gdb) si            # AL    mov eax, [a]
(gdb) si            # İŞLE  add eax, [b]
(gdb) si            # BIRAK mov [sonuc], eax
(gdb) x/1dw &sonuc
```

Gerçek çıktı, adım adım:

```
AL    → eax = 100          (a bellekten cebe geldi)
İŞLE  → eax = 300          (üstüne b eklendi: 100 + 200)
BIRAK → x/1dw &sonuc = 300 (sonuç depoya yazıldı)
```

**İşte dansın tamamı.** 04'te uzaktan çizdiğimiz o resim — depodan çek, cepte topla, depoya bırak — artık gerçek komutlarla, senin ellerinde döndü. Ünite 0'da "ileride" dediğimiz her şey buraya, tek bir çalışan programa indi.

> 🔑 `mov [a]` (AL) → `add [b]` (İŞLE) → `mov [sonuc]` (BIRAK): 04'ün al-işle-bırak dansının tamamı, gerçek komutlarla. Program çoğu zaman bu iskeletin tekrarıdır: veriyi çek, üstünde hesapla, sonucu sakla.

---

## Özet — Aklında Tut

```
☐ add hedef, kaynak  = hedef + kaynak → hedef.  (mov KOYAR, add EKLER: eskiyi silmez, üstüne biner.)
    - mov eax,5 + add eax,3 → eax = 8.  (İŞLE adımı: 04'ün eksik parçası)
☐ sub hedef, kaynak  = hedef − kaynak → hedef.  (10 − 4 = 6.)
☐ inc / dec = tam olarak 1 artır / azalt.  inc eax ≡ add eax,1 ;  dec eax ≡ sub eax,1. (sayaçlarda sık.)
☐ Eksi sayılar = TWO'S COMPLEMENT: bitleri ters çevir + 1 ekle. −3 → 0xFD (byte) / 0xFFFFFFFD (32-bit).
    - Aşağı taşma tepeden sarar: 0−3 → 253. (06'nın −5→251 cevabı.) Çıkış kodu byte olduğu için 5−8 → 253.
    - Çıkarma ayrı bir iş DEĞİL: sub = "eksisini add'le." Makine tek toplama devresiyle ikisini yapar.
      Kanıt: add eax, 0xFFFFFFFD (yani +(−3)) → 5 den 2 çıkar.
☐ add/sub kenarda "bayrak" da tutar (sıfır mı, taştı mı) → kararların temeli, 10. derste.
☐ Dansın tamamı (dans.asm): mov [a] (AL) → add [b] (İŞLE) → mov [sonuc] (BIRAK) → sonuc = 300.
    04'ün 100+200→300 örneği, artık gerçek ve çalışan. Programların iskeleti bu.
```

---

## 🔗 İlgili Konular

- [04_bellek_ve_registerlar.md](./04_bellek_ve_registerlar.md) — "AL → İŞLE → BIRAK" dansının çizildiği yer; bu ders onun **İŞLE** adımını dolduruyor
- [06_ilk_gercek_program.md](./06_ilk_gercek_program.md) — `mov` ve çıkış kodu; `−5 → 251` bilmecesinin sorulduğu (ve burada cevaplanan) yer
- [08_mov_ve_bellek.md](./08_mov_ve_bellek.md) — Dansın **AL** ve **BIRAK** adımları; `[...]` ile belleğe uzanmak
- [01.5_sayi_ve_anlam.md](./01.5_sayi_ve_anlam.md) — "Aynı sayı, farklı anlam": `253` mü `−3` mü? sorusunun kökü
- [07_gdb_tek_adim.md](./07_gdb_tek_adim.md) — `si` + `info registers` ile bir komutun ne yaptığını canlı izlemek

---

**Önceki konu:** [08.5_little_endian.md](./08.5_little_endian.md)
**Sonraki konu:** [10_bayraklar_ve_cmp.md](./10_bayraklar_ve_cmp.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
