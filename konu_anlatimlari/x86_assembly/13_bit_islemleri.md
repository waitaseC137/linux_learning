# 🎛️ x86 Assembly — Bit İşlemleri: `and`, `or`, `xor` ve Kaydırma

> 10 ve 11'de sana bir söz borcum kaldı. `test eax, eax` ("sıfır mı?") ve `test eax, 1` ("tek mi?") komutlarını kullandık ama içlerinde ne döndüğünü *"kapalı kutu, 13'te açacağız"* diye erteledim. İşte 13'teyiz — o kutuyu açıyoruz.
> Ama önce şunu anlamak gerek: şimdiye kadarki komutlar (`add`, `sub`) sayılara **bir bütün** gibi davrandı. Bu derste ilk kez sayının **tek tek bitlerine** dokunacağız — 03'te tanıştığın o 1'ler ve 0'lar, artık teker teker elimizde.

> **Bu derste kod var ve hepsini çalıştırıyoruz.** Aşağıdaki her program ve her çıkış kodu gerçek: kendi makinemde derleyip koşturdum.

---

## 📋 İçindekiler

- [Bit Bit Çalışmak: Toplamadan Farkı](#bit-bit-%C3%A7al%C4%B1%C5%9Fmak-toplamadan-fark%C4%B1)
- [`and`: Maske ile Bit Süzmek](#and-maske-ile-bit-s%C3%BCzmek)
- [`or` ve `xor`: Bit Kurmak ve Çevirmek](#or-ve-xor-bit-kurmak-ve-%C3%A7evirmek)
- [`xor eax, eax`: En Sık Görülen 'Sıfırla'](#xor-eax-eax-en-s%C4%B1k-g%C3%B6r%C3%BClen-s%C4%B1f%C4%B1rla)
- [Kaydırma: `shl` / `shr` = Hızlı ×2 ve ÷2](#kayd%C4%B1rma-shl--shr--h%C4%B1zl%C4%B1-2-ve-2)
- [Borcu Öde: `test` Aslında `and`'di](#borcu-%C3%B6de-test-asl%C4%B1nda-anddi)

---

## Bit Bit Çalışmak: Toplamadan Farkı

`add eax, 1` yaptığında bir şey olur: sayı taşarsa **elde** bir sonraki basamağa geçer (09'daki `9 + 1 = 10` gibi, ama ikilikte). Yani toplama, basamaklar arası **konuşur** — bir bit diğerini etkiler.

Bit işlemleri **öyle değil.** Her bit, karşısındaki bitle **kendi başına** işlenir; komşusuna hiç bakmaz, elde diye bir şey yoktur. İki sayıyı alt alta yaz, her sütunu ayrı ayrı işle — bitmiştir. Bu yüzden bit işlemleri hem çok basit hem çok hızlıdır.

Üç temel bit işlemi var, ve her biri tek bir soruya cevap verir. İki bit (a ve b) için kuralları — **doğruluk tablosu** — şöyle:

```
   a b │ and │ or  │ xor
   ────┼─────┼─────┼─────
   0 0 │  0  │  0  │  0
   0 1 │  0  │  1  │  1
   1 0 │  0  │  1  │  1
   1 1 │  1  │  1  │  0
```

Sözle:
- **`and`** ("ve"): **ikisi de 1** ise 1. (İnatçı: birazcık 0 varsa 0.)
- **`or`** ("veya"): **en az biri 1** ise 1. (Cömert: birazcık 1 varsa 1.)
- **`xor`** ("özel veya"): **tam olarak biri 1** ise 1; ikisi aynıysa (0-0 ya da 1-1) 0. (Farkçı: "farklılar mı?" diye sorar.)

> 🔑 Bit işlemleri sayıyı **bit bit**, elde olmadan işler (toplamanın aksine, basamaklar birbirine karışmaz). `and` = ikisi de 1 mi, `or` = en az biri 1 mi, `xor` = biri diğerinden farklı mı. Kuralları yukarıdaki doğruluk tablosu.

---

## `and`: Maske ile Bit Süzmek

`and`'in en sık işi **maske**dir: bir sayının sadece **istediğin bitlerine** bakıp gerisini sıfırlamak. Mantık, tablodan çıkıyor: bir biti `1` ile `and`'lersen **aynen kalır** (`1 and 1 = 1`, `0 and 1 = 0`); `0` ile `and`'lersen **silinir** (`x and 0 = 0`). Yani `1` koyduğun yerler "geçsin", `0` koyduğun yerler "kapansın" — tıpkı bir şablon gibi.

`vebit.asm` — `13 and 6`:

```nasm
section .text
    global _start

_start:
    mov eax, 13         ; 1101
    and eax, 6          ; 0110
    mov ebx, eax
    mov eax, 1
    int 0x80
```

Sütun sütun (03'ten hatırla, sağdan sola bitler):

```
   1101   (13)
   0110   (6)   ← maske
   ────  and  (her sütun: ikisi de 1 mi?)
   0100   (4)
```

Çalıştır, `echo $?`:

```
4
```

Maskenin `1` olduğu yerlerde (ortadaki iki bit) 13'ün bitleri süzülüp geçti; `0` olduğu yerlerde silindi. Sonuç `4`.

Bunun **çok** tanıdık bir kullanımı var: 11'deki çift-tek testi. Bir sayıyı `1` (yani `0001`) ile `and`'lersen, **sadece en düşük bit** hayatta kalır — o da sayının tek/çift olduğunu söyler (03). `vetek.asm`, `mov eax, 7` + `and eax, 1`:

```
1
```

`7 and 1 = 1` → en düşük bit 1 → tek. İşte 11'de `test eax, 1`'in aslında yaptığı buydu (birazdan tam bağlayacağız).

> 🔑 `and` bir **maske**dir: maskede `1` olan bitler geçer, `0` olan bitler silinir. "Şu sayının sadece şu bitlerini istiyorum" demenin yolu. `and eax, 1` → sadece en düşük bit kalır (tek/çift testi).

---

## `or` ve `xor`: Bit Kurmak ve Çevirmek

`or`'un tipik işi `and`'in tersidir: bit **kurmak** (1 yapmak). Bir biti `1` ile `or`'larsan garanti 1 olur (`x or 1 = 1`); `0` ile `or`'larsan aynen kalır. Yani "şu bitleri kesin 1 yap, gerisine dokunma" demenin yolu. `veyabit.asm`, `12 or 3`:

```
   1100   (12)
   0011   (3)
   ────  or  (her sütun: en az biri 1 mi?)
   1111   (15)
```

```
15
```

`xor` ise **çevirir** (flip). Bir biti `1` ile `xor`'larsan tersine döner (`0→1`, `1→0`); `0` ile `xor`'larsan aynen kalır. Yani "şu bitleri ters çevir" demek. Ama `xor`'un asıl ünlü olduğu yer, bir sonraki bölümdeki küçük sihir — pardon, küçük **numara.**

> 🔑 `or` bit **kurar** (maskede 1 olanları kesin 1 yapar); `xor` bit **çevirir** (maskede 1 olanları tersine döndürür). `and` süzer/siler, `or` kurar, `xor` çevirir — üç şablon işlemi.

---

## `xor eax, eax`: En Sık Görülen 'Sıfırla'

Assembly kodlarına baktığında, neredeyse her yerde şunu göreceksin:

```nasm
xor eax, eax
```

İlk görüşte tuhaf: "eax'i eax ile xor'la"? Doğruluk tablosuna bak — `xor`, "iki bit **farklı** mı?" diye soruyordu. Ama bir sayıyı **kendisiyle** xor'larsan, her bit kendisiyle karşılaşır: `0 xor 0 = 0`, `1 xor 1 = 0`. Her sütun aynı olduğu için **hepsi 0 çıkar.** Yani `xor eax, eax`, eax'in içinde ne olursa olsun onu **sıfırlar.**

`xorsifir.asm`:

```nasm
section .text
    global _start

_start:
    mov eax, 123        ; içi dolu
    xor eax, eax        ; kendisiyle xor → 0
    mov ebx, eax
    mov eax, 1
    int 0x80
```

GDB'de tam anını yakalayalım:

```
(gdb) starti
(gdb) si                    # mov eax, 123
(gdb) info registers eax
eax            0x7b                123
(gdb) si                    # xor eax, eax
(gdb) info registers eax
eax            0x0                 0
```

`123` (`0x7b`) bir anda `0` oldu. `echo $?` de `0` verir.

Peki neden `mov eax, 0` yerine bu? İkisi de eax'i sıfırlar — ama `xor eax, eax` makine kodunda **daha kısa** yer kaplar (ve işlemci onu çok sever). Bu yüzden "sıfırla" demenin *deyimsel* (idiomatic) yolu budur; başkalarının kodunda `mov eax, 0`'dan çok daha sık `xor eax, eax` görürsün. Artık gördüğünde ne olduğunu bileceksin: "bu sadece eax = 0 demek."

> 🔑 `xor eax, eax` = **eax'i sıfırla.** Bir sayı kendisiyle xor'lanınca her bit `1 xor 1 = 0` / `0 xor 0 = 0` olur → hepsi 0. `mov eax, 0` ile aynı sonuç ama daha kısa kodlanır; bu yüzden "sıfırla"nın standart deyimidir. Gördüğünde tökezleme.

---

## Kaydırma: `shl` / `shr` = Hızlı ×2 ve ÷2

Son iki bit komutu, bitleri **yana kaydırır**:

- `shl hedef, n` → **shift left:** bütün bitleri `n` basamak **sola** it, sağdan sıfır doldur.
- `shr hedef, n` → **shift right:** bütün bitleri `n` basamak **sağa** it.

Bunların sihirli tarafı 03'ten çıkar. Onluk sayıda bir rakamı sola itip sağa 0 koymak (`5` → `50`) sayıyı **×10** yapar. İkilikte taban 2 olduğu için, sola bir kaydırma **×2**'dir:

```
    5  =  0000 0101
  5<<1 =  0000 1010  = 10   (×2)
  5<<3 =  0010 1000  = 40   (×2×2×2 = ×8)
```

`kaydir.asm`, `mov eax, 5` + `shl eax, 3`:

```
40
```

`5 << 3 = 5 × 2³ = 5 × 8 = 40`. Aynı mantık ters yönde: `shr` her adımda **÷2**. `kaydir2.asm`, `mov eax, 20` + `shr eax, 2`:

```
5
```

`20 >> 2 = 20 ÷ 2² = 20 ÷ 4 = 5`. İşlemciler bunu çok sever: bir kaydırma, tam bir çarpma/bölmeden **çok daha hızlıdır.** Bu yüzden 2'nin katıyla çarpma/bölme gerektiğinde derleyiciler sık sık `shl`/`shr` kullanır — ileride bir C programının assembly'sine baktığında (19. ders) `× 8` yerine `shl ..., 3` görürsen şaşırma.

> 🔑 `shl x, n` = bitleri sola kaydır = **× 2ⁿ**;  `shr x, n` = sağa kaydır = **÷ 2ⁿ**. İkilikte "sola it, sıfır ekle" tıpkı onlukta "×10" gibi, ama ×2. Çarp/böl'ün hızlı yolu; 2'nin kuvvetleri için bedava gelir. (Küçük çekince: `shr`'nin "÷2"si yalnız işaretsiz sayılarda geçerli — negatif bir sayıyı bölmek için `sar` gerekir; `shl` ise iki durumda da sorunsuz ×2.)

---

## Borcu Öde: `test` Aslında `and`'di

Şimdi 10 ve 11'de bıraktığım kapalı kutuyu açabiliriz. `test`, bu derste öğrendiğin bir işlemin **"sonucu atılmış"** hâlidir — tıpkı `cmp`'in `sub`'ın sonucu-atılmış hâli olması gibi (10):

```
   cmp  = sub  ama sonucu atar, yalnız bayrak kurar
   test = and  ama sonucu atar, yalnız bayrak kurar
```

Yani `test eax, eax` içeride `eax and eax` yapar (sonucu bir yere yazmaz), sadece bayraklara bakar. `x and x = x` olduğu için sonuç eax'in kendisidir; eax **sıfırsa** sonuç sıfır → **ZF açılır.** İşte 10'daki "eax sıfır mı?" tam olarak buydu.

Ve `test eax, 1`? Artık apaçık: `eax and 1` = **sadece en düşük bit**. En düşük bit 1 ise (tek sayı) sonuç sıfır değil → ZF kapalı; 0 ise (çift) sonuç sıfır → ZF açık. 11'deki çift-tek testinin bütün mekanizması buydu — bu bölümdeki `vetek.asm`'in (`7 and 1 = 1`) bayrak versiyonu.

> 🔑 `test a, b` = `and a, b` ama sonucu atar, yalnız bayrak kurar (`cmp`'in `sub`'a olan ilişkisinin aynısı). `test eax, eax` → "eax sıfır mı" (ZF); `test eax, 1` → "eax tek mi" (en düşük bit). 10-11'deki kapalı kutu buydu; artık gördün.

---

## Özet — Aklında Tut

```
☐ Bit işlemleri sayıyı BİT BİT işler (elde YOK, basamaklar karışmaz). Doğruluk tablosu:
    and = ikisi de 1 mi   |  or = en az biri 1 mi  |  xor = farklılar mı (biri 1 biri 0)
☐ and = MASKE/SÜZ: maskede 1 olan geçer, 0 olan silinir.   13 and 6 = 4 ;  x and 1 = en düşük bit (tek/çift).
☐ or  = bit KUR (kesin 1 yap):    12 or 3 = 15.
☐ xor = bit ÇEVİR (ters).  ÖZEL: xor eax, eax = eax'i SIFIRLA (kendisiyle xor → hep 0). mov eax,0'ın kısa/deyimsel hâli.
☐ shl x, n = sola kaydır = × 2ⁿ   (5 << 3 = 40).
   shr x, n = sağa kaydır = ÷ 2ⁿ   (20 >> 2 = 5).   Çarp/böl'ün hızlı yolu (2'nin kuvvetleri).
   Not: shr'nin ÷2'si yalnız işaretsiz sayılarda; negatifi bölmek için sar gerekir.
☐ BORÇ ÖDENDİ:  test = and ama sonucu atar (cmp = sub ama sonucu atar, ile aynı fikir).
    test eax,eax → "sıfır mı" (ZF) ;  test eax,1 → "tek mi".  10-11'deki kapalı kutu buydu.
☐ Doğrulanan: 13&6=4, 12|3=15, xor eax,eax→0 (gdb 123→0), 7&1=1, 5<<3=40, 20>>2=5.
```

---

## 🔗 İlgili Konular

- [03_sayilar_ikilik_onaltilik.md](./03_sayilar_ikilik_onaltilik.md) — Bitler, ikilik basamaklar ve "sola kaydırma = ×taban" sezgisinin kökü
- [10_bayraklar_ve_cmp.md](./10_bayraklar_ve_cmp.md) — `test`'in "sonucu atıp bayrak kuran" kardeşi olduğu fikir; `cmp = sub`'ın buradaki eşi
- [11_ziplamalar.md](./11_ziplamalar.md) — `test eax, 1` ile çift-tek kararı; mekanizması (`and`) işte bu derste açıldı
- [09_aritmetik.md](./09_aritmetik.md) — Toplamanın "eldeli" doğası; bit işlemlerinin "eldesiz" doğasıyla karşıtlığı

---

**Önceki konu:** [12_donguler.md](./12_donguler.md)
**Sonraki konu:** [14_stack.md](./14_stack.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
