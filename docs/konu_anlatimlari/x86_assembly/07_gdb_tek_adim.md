# 🔬 x86 Assembly — GDB ile Tek Adım: Kutuların İçini Canlı Görmek

> 06'nın sonunda bir söz vermiştik: `echo $?` sana yalnızca **tek pencereyi** (`ebx`, çıkış kodu yoluyla) gösteriyordu.
> Bütün kutuların (`eax`, `ecx`, `edx`…) içini **istediğin an** görmek için bir alete ihtiyacın vardı.
> İşte o alet **`gdb`** — ve bu derste onu ilk kez açıyoruz.

> gdb, işçiyi **istediğin komutta duraklatıp** her kutunun içine tek tek bakmanı sağlar. Bir komut çalıştırırsın, durur, "ne değişti?" diye bakarsın — sonra bir komut daha.
> Kursun en güçlü öğrenme anı burada başlıyor: **komut yaz → ne değişti gör.** Artık makine senin için bir kutu değil; içini izleyebiliyorsun.

---

## 📋 İçindekiler

- [gdb Ne İşe Yarar?](#gdb-ne-i%CC%87%C5%9Fe-yarar)
- [Programı gdb'ye Sokmak ve Durdurmak](#program%C4%B1-gdbye-sokmak-ve-durdurmak)
- [İlk Bakış: Kutular Henüz Boş](#i%CC%87lk-bak%C4%B1%C5%9F-kutular-hen%C3%BCz-bo%C5%9F)
- [İlk Adım: `si` ve "İşte Değişti!"](#i%CC%87lk-ad%C4%B1m-si-ve-i%CC%87%C5%9Fte-de%C4%9Fi%C5%9Fti)
- [eip: İşçi Şu An Nerede?](#eip-i%CC%87%C5%9F%C3%A7i-%C5%9Fu-an-nerede)
- [2. Tur: Kopyayı Canlı Görmek](#2-tur-kopyay%C4%B1-canl%C4%B1-g%C3%B6rmek)
- [Çıkış ve gdb'nin Gerisi](#%C3%A7%C4%B1k%C4%B1%C5%9F-ve-gdbnin-gerisi)

---

## gdb Ne İşe Yarar?

Şimdiye kadar programını yazdın, çalıştırdın, `echo $?` ile tek bir sonucu gördün. Ama arada ne olduğunu — hangi komutun hangi kutuyu nasıl değiştirdiğini — göremedin. Program bir kutuydu: içeri girdi, çıktı verdi, gerisi karanlık.

**`gdb` (*GNU Debugger*)** işte o karanlığı aydınlatır. İki şey yapar, ve bu derste ikisi de lazım:

1. **Duraklatır.** Programı istediğin komutta dondurabilirsin — işçi ortada, elinde emir, sen "dur" demişsin.
2. **İçini gösterir.** Durduğu an her kutunun (register'ın) o anki değerini okuyabilirsin.

Bu ikisi birleşince şu olur: bir komut çalıştır → dur → kutulara bak → bir komut daha → tekrar bak. Komutların *tek tek* ne yaptığını gözünle görürsün. Buna **tek adımlama** (*single-step*) denir.

> 🔑 gdb = işçiyi **duraklatıp** her kutunun içine bakma aleti. Tek adımlama: bir komut çalıştır, dur, ne değiştiğine bak, tekrarla.

gdb'yi 05'te zaten kurmuştuk ([05_kurulum_ve_ilk_program](./05_kurulum_ve_ilk_program.md)). Elinde de 06'dan kalma bir program var: `cikis.asm`. Onunla başlıyoruz.

---

## Programı gdb'ye Sokmak ve Durdurmak

Önce 06'daki programın hâlâ derli-toplu durduğundan emin ol. `cikis.asm` şuydu:

```nasm
section .text
    global _start

_start:
    mov ebx, 8
    mov eax, 1
    int 0x80
```

Derleyip birleştir (06'daki aynı zincir):

```
nasm -f elf32 cikis.asm -o cikis.o
ld -m elf_i386 cikis.o -o cikis
```

Şimdi `./cikis` demek yerine, programı **gdb'nin içinde** açıyoruz:

```
gdb ./cikis
```

Karşına `(gdb)` yazan bir istem (prompt) gelir — artık komutları buraya yazacaksın. İlk iki komutumuz kurulum:

```
(gdb) set disassembly-flavor intel
(gdb) starti
```

- **`set disassembly-flavor intel`** → gdb'ye "komutları **bizim yazdığımız sırayla** göster" demek. (*disassembly* = makine kodunu tekrar okunur asm komutlarına çevirmek; *flavor* = hangi yazım tarzıyla göstereceği.) gdb varsayılan olarak farklı, ters bir sıra kullanır — biz bu kursta hep intel'i, yani senin yazdığın sırayı tercih ediyoruz.
- **`starti`** → "programı başlat, ama **ilk komutta** hemen durdur." İşçi henüz *hiçbir şey yapmadan* elini kaldırmış, seni bekliyor.

Ekranda şunu görürsün (gerçekten çalıştırdım):

```
Program stopped.
0x08049000 in _start ()
```

İşte bu — işçi durdu. `0x08049000`, işçinin şu an durduğu **komutun adresi** (hangi komut sırada); ona birazdan geleceğiz. Önemli olan: program başladı ama **daha tek komut çalışmadı.** Tam bakmak için ideal an.

> 💡 **Aklınıza takılabilir:** *"Neden `starti`? `run` desem olmaz mı?"* `run` programı **sonuna kadar** çalıştırır — bizim program da hemen çıktığı için hiçbir şey izleyemeden biterdi. `starti` ("start-instruction") ise **ilk komutta durdurur**; izlemek için tam istediğimiz şey bu.

---

## İlk Bakış: Kutular Henüz Boş

İşçi ilk komutta dururken kutulara bakalım. Komut: **`info registers`** (kısası `i r`). İstersen sadece ilgilendiğin kutuları ver:

```
(gdb) info registers eax ebx
```

Gerçek çıktı:

```
eax            0x0                 0
ebx            0x0                 0
```

Her satır bir kutu: solda adı, ortada değeri onaltılık (`0x0`), sağda onluk (`0`). Yani **şu an eax de ebx de 0.** Mantıklı — daha `mov ebx, 8` çalışmadı; işçi henüz o komutun *önünde* bekliyor.

> 💡 Değer iki kez yazılı çünkü aynı sayının iki gösterimi: `0x0` (onaltılık) ve `0` (onluk) — 03'te ([03_sayilar_ikilik_onaltilik](./03_sayilar_ikilik_onaltilik.md)) ikisinin aynı sayı olduğunu görmüştük. gdb ikisini de gösterir ki hangisini istersen oku.

---

## İlk Adım: `si` ve "İşte Değişti!"

Şimdi işçiye **tek bir komut** çalıştırt. Komut: **`si`** (*step-instruction* — "bir komut ilerle"):

```
(gdb) si
(gdb) info registers eax ebx
```

Gerçek çıktı:

```
eax            0x0                 0
ebx            0x8                 8
```

**İşte o an.** `ebx` az önce `0`'dı, şimdi `8`. Sen `si` dedin, işçi `mov ebx, 8`'i çalıştırdı, ve **kutunun değiştiğini gözünle gördün.** 06'da `mov ebx, 8`'in ebx'e 8 koyduğunu *biliyorduk*; şimdi **izledik.** Fark bu: bilmek ile görmek arası.

`eax` hâlâ `0` — çünkü onu değiştiren komut (`mov eax, 1`) daha çalışmadı, sırada.

Bir `si` daha at, `mov eax, 1` çalışsın:

```
(gdb) si
(gdb) info registers eax ebx
```

```
eax            0x1                 1
ebx            0x8                 8
```

Şimdi `eax` de `1` oldu, `ebx` hâlâ `8`. Her komut **yalnızca kendi kutusuna** dokundu, ötekini rahat bıraktı. İşçinin "getir-yap-ilerle" döngüsünü artık kare kare izliyorsun.

> 🔑 `si` = bir komut çalıştır, dur. Arasında `info registers eax ebx` ile bak → hangi kutunun değiştiğini görürsün. Kursun "komut yaz → ne değişti gör" vaadi tam olarak bu.

---

## eip: İşçi Şu An Nerede?

Kutuların değerini gördük. Peki işçinin **listenin neresinde** olduğunu — yani "sıradaki komut hangisi"yi — nasıl görürüz?

Bunu tutan da bir kutu: **`eip`** (*instruction pointer* — "komut göstergesi"). İçinde sıradaki komutun **adresi** durur. Hani 01'de işçinin döngüsü "getir-yap-**ilerle**"ydi ya — işte `eip` o "nerede"nin kutusu. Her komuttan sonra işçi eip'i bir sonraki komuta ilerletir.

Sıradaki komutu görmek için: **`x/i $eip`** ("eip'in gösterdiği adresteki komutu, komut olarak yaz"):

> 💡 **Baştaki `$` ne?** gdb'de bir register'ı **bir ifadenin içinde, değeri lazım olduğu için** kullanırken adının başına `$` koyarsın: `$eip` = "eip'in *içindeki* adres". Yukarıdaki `info registers eax`'te ise `$` yoktu — çünkü orada register'ı bir hesaba katmıyor, sadece **adıyla listeliyorduk**. Kısaca: değerini kullanıyorsan `$eip`, sadece adını söylüyorsan `eax`.

```
(gdb) x/i $eip
```

Programın en başında (starti'den hemen sonra) çıktı şuydu:

```
=> 0x8049000 <_start>:	mov    ebx,0x8
```

`=>` "işçi şu an burada" demek — ve o adres, `0x8049000`, yukarıdaki `starti` çıktısında gördüğün `0x08049000` ile **aynı adrestir**; baştaki fazladan sıfır sadece sıfır dolgusu, değeri değiştirmez. Ve gördüğün komut: `mov ebx,0x8` — **tam senin yazdığın `mov ebx, 8`.** (`0x8`, 8'in onaltılığı; `disassembly-flavor intel` sayesinde sıra da senin yazdığın gibi: önce hedef `ebx`, sonra kaynak.) Bir `si` atınca `=>` bir sonraki komuta kayar (`mov eax,0x1`), bir daha atınca `int 0x80`'e. **İşçi listede ilerliyor, sen adım adım arkasından bakıyorsun.**

> 💡 **Aklınıza takılabilir:** *"Adresler neden `0x8049000`, `0x8049005` diye 5'er 5'er atlıyor?"* Çünkü her komut bellekte **birkaç byte** yer kaplar; `mov ebx, 8` gibi bir komut 5 byte. İşçi bir komutu bitirince eip'i **o komutun boyu kadar** ilerletir — yani sıradaki komutun başına. Komutların byte olarak nasıl kodlandığı ayrı ve derin bir konu; şimdilik bilmen gereken tek şey: **eip = sıradaki komutun adresi, her adımda ilerler.**

> 🔑 `eip` = sıradaki komutun adresini tutan kutu (işçinin "nerede"si). `x/i $eip` ile sıradaki komutu okursun; `=>` işaretçisi işçinin yerini gösterir.

---

## 2. Tur: Kopyayı Canlı Görmek

06'da bir iddia vardı: `mov ebx, eax` "kopyalar" — `eax`'teki değeri `ebx`'e koyar ama **`eax` boşalmaz.** O zaman söz vermiştim, "bunu denedim" demiştim. Şimdi **sen de gdb'de gözünle göreceksin.**

`kopya.asm` adında yeni bir dosya yap:

```nasm
section .text
    global _start

_start:
    mov eax, 7
    mov ebx, eax        ; eax'teki 7'yi ebx'e KOPYALA
    mov eax, 1
    int 0x80
```

Derle, birleştir, gdb'de aç, kutuları izle:

```
nasm -f elf32 kopya.asm -o kopya.o
ld -m elf_i386 kopya.o -o kopya
gdb ./kopya
(gdb) set disassembly-flavor intel
(gdb) starti
```

Önce `mov eax, 7`'yi çalıştır:

```
(gdb) si
(gdb) info registers eax ebx
```

```
eax            0x7                 7
ebx            0x0                 0
```

`eax` artık `7`, `ebx` hâlâ `0`. Şimdi asıl olay — `mov ebx, eax` (kopya):

```
(gdb) si
(gdb) info registers eax ebx
```

```
eax            0x7                 7
ebx            0x7                 7
```

**İşte kanıt.** `ebx` `7` oldu (kopya geldi) — **ama `eax` hâlâ `7`.** Kaynak boşalmadı. 06'daki "move aslında kopyala" cümlesini artık *biliyor* değil, **görüyorsun.** (İstersen programı bitir: son `si`'ler `mov eax, 1` ve `int 0x80`'i çalıştırır; `echo $?` — fish: `echo $status` — **7** der, çünkü çıkışta `ebx`'teki 7 okunur.)

---

## Çıkış ve gdb'nin Gerisi

gdb'den çıkmak için:

```
(gdb) quit
```

(Program hâlâ ortasındaysa "öldüreyim mi?" diye sorabilir; `y` de, sadece o oturumu kapatır.)

Bu derste gdb'nin **tek bir işini** öğrendin: tek adımla register izlemek. Ama gdb bundan çok daha fazlasını yapar — belleğe bakmak, belirli bir yerde durdurmak (breakpoint), değerleri değiştirmek… Bunlar şimdilik **kapalı kutu**; ihtiyaç duydukça, o an açacağız. Şu an elindeki `si` + `info registers` ikilisi, bir komutun ne yaptığını anlamadığında başvuracağın **birincil aletin.**

> 🔑 Bir komut ne yapıyor anlamadın mı? Kuralın: gdb'de aç, `starti`, sonra `si` + `info registers` ile **gözünle izle.** Bu kursta bir daha "acaba bu ne yaptı?" diye takıldığında cevabın burada.

---

## Özet — Aklında Tut

```
☐ gdb = işçiyi DURAKLATIP her kutunun içine bakma aleti (05'te kurduk).
☐ Programı gdb'de aç:  gdb ./cikis
    (gdb) set disassembly-flavor intel   → komutları bizim sırayla göster
    (gdb) starti                         → ilk komutta durdur (run DEĞİL: run sonuna koşardı)
☐ Kutulara bak:  info registers eax ebx   (kısası: i r eax ebx)
    - solda ad, ortada 0x.. (onaltılık), sağda onluk — aynı sayı.
☐ Tek adım:  si   → bir komut çalıştır, dur. Sonra tekrar bak → NE DEĞİŞTİ gör.
    - mov ebx, 8 sonrası ebx: 0 → 8.  mov eax, 1 sonrası eax: 0 → 1.
☐ eip = sıradaki komutun adresini tutan kutu (işçinin "nerede"si).
    - x/i $eip  → sıradaki komutu göster.  => işaretçisi işçinin yerini gösterir.
☐ Kopya kanıtı (kopya.asm): mov ebx, eax sonrası ebx=7 AMA eax hâlâ 7 → kaynak boşalmaz.
☐ Kural: bir komut anlaşılmadıysa → gdb'de starti + si + info registers ile izle.
```

---

## 🔗 İlgili Konular

- [06_ilk_gercek_program.md](./06_ilk_gercek_program.md) — İzlediğimiz `cikis.asm`'in ve `mov`'un geldiği yer
- [04_bellek_ve_registerlar.md](./04_bellek_ve_registerlar.md) — İçlerine baktığımız kutuların (register'ların) ne olduğu
- [01_bilgisayar_nedir.md](./01_bilgisayar_nedir.md) — İşçinin "getir-yap-ilerle" döngüsü; eip işte o "ilerle"nin kutusu

---

**Önceki konu:** [06_ilk_gercek_program.md](./06_ilk_gercek_program.md)
**Sonraki konu:** 08_mov_ve_bellek.md 🚧 *(yazılıyor)*

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
