# 🔢 x86 Assembly — Sayılar: Makinenin Saydığı Gibi

> Makine sayıları senin yazdığın gibi yazmaz. İçeride yalnızca **açık** ve **kapalı** vardır —
> yani sadece iki rakam: 1 ve 0. Bu da uzun, okunması yorucu sayılar doğurur; o yüzden insanlar
> bunları **onaltılık** denen kısa bir gösterimle yazar. Bu dersin tek amacı, makinenin sayılarını
> *okuyabilmen*. Hesap yapmayı değil — okumayı. GDB'de karşına `0xff` çıktığında "bu da neyin nesi?"
> demeyesin diye.

> **Bu derste kod yok, matematik ödevi hiç yok.** İkilik ve onaltılığı sadece *tanıyacak* kadar
> öğreneceğiz. Elde dört işlem yok, ezber yok. Söz: korktuğun şey değil bu.

---

## 📋 İçindekiler

- [Korkma: Bu Matematik Değil, Okuma-Yazma](#korkma-bu-matematik-de%C4%9Fil-okuma-yazma)
- [Neden İkilik? Çünkü İçeride Sadece Açık/Kapalı Var](#neden-ikilik-%C3%A7%C3%BCnk%C3%BC-i%C3%A7eride-sadece-a%C3%A7%C4%B1kkapal%C4%B1-var)
- [Onluk Sistemi Zaten Biliyorsun](#onluk-sistemi-zaten-biliyorsun)
- [İkilik: Aynı Fikir, Sadece İki Rakam](#ikilik-ayn%C4%B1-fikir-sadece-iki-rakam)
- [Bir Byte Neden 0–255? (01'in Cevabı)](#bir-byte-neden-0255-01in-cevab%C4%B1)
- [Onaltılık: İnsanlar İçin Kısaltma](#onalt%C4%B1l%C4%B1k-insanlar-i%C3%A7in-k%C4%B1saltma)
- [Hex'i "Okumak" (Hesaplamak Değil)](#hexi-okumak-hesaplamak-de%C4%9Fil)
- [Bunu Nerede Göreceğim?](#bunu-nerede-g%C3%B6rece%C4%9Fim)
- [Ek: Byte Neden 8 Bit? (Tarihçe ve Sebepler)](#ek-byte-neden-8-bit-tarih%C3%A7e-ve-sebepler)

---

## Korkma: Bu Matematik Değil, Okuma-Yazma

Çoğu insan "ikilik sayı sistemi" lafını duyunca okuldaki kâbus matematiğini hatırlar. Burada öyle bir şey yok.

Düşün ki yabancı bir alfabe öğreniyorsun. Amacın o dilde şiir yazmak değil; sadece tabelaları **okuyabilmek.** Bizim derdimiz de bu: makine sayıları kendi alfabesiyle (1'ler ve 0'lar, ya da kısaltması olan hex) yazıyor, biz de o tabelaları okumayı öğreneceğiz. Elde toplama-çıkarma yapmana hiç gerek yok — onu zaten bilgisayar yapıyor.

> 🔑 Bu dersin tek hedefi: `1011` ya da `0xff` gibi bir şey gördüğünde "bu bir sayı, şu büyüklükte" diyebilmek. Akıcı çevirmen olmana gerek yok; *okur-yazar* olman yeter.

---

## Neden İkilik? Çünkü İçeride Sadece Açık/Kapalı Var

Bir önceki derste bilgisayarı "numaralı kutular + işçi" diye düşünmüştük. Peki o kutuların içindeki sayı *fiziksel olarak* nasıl duruyor?

Bilgisayarın içi, milyarlarca minik **anahtardan** ibarettir. Her anahtar ya **açıktır** ya **kapalı** — ışık düğmesi gibi, ortası yok. İşte makinenin elindeki tüm "rakamlar" bunlar:

```
 açık   →  1
 kapalı →  0
```

Sadece iki sembol. Bu yüzden makine her sayıyı bu iki rakamla yazmak zorunda — buna **ikilik** (binary) denir. Gördüğün her şey (sayılar, harfler, resimler, müzik) en dipte bu açık/kapalı anahtar dizilerine iner.

Tek bir anahtara (tek bir açık/kapalı'ya) **bit** denir. Bit, bilgisayardaki en küçük bilgi parçasıdır: ya 0 ya 1.

> 💡 "Neden 10 değil de 2 rakam?" Çünkü bir anahtarın güvenle ayırt edebileceği iki durum var: var/yok, açık/kapalı. "Tam olarak %63 açık" diye bir şeyi makine güvenilir biçimde tutamaz. İki durum sağlam ve nettir — makine de bu yüzden ikilik sayar.

---

## Onluk Sistemi Zaten Biliyorsun

Aslında "basamak değeri" fikrini hayatın boyunca kullandın, sadece adını koymadın. Şu sayıya bak: **347**

```
   3      4      7
   ↓      ↓      ↓
  3×100  4×10   7×1     →  300 + 40 + 7 = 347
```

Yani her basamağın bir **değeri** var: en sağ birler, sonra onlar, sonra yüzler... Bu değerler 1, 10, 100, 1000 diye gider — yani **10'un katları.** Neden 10? Çünkü elimizde **10 rakam** var (0–9).

İşte sırrın tamamı şu: **ikilik de tıpatıp aynı sistemdir, sadece 10 yerine 2 rakam olduğu için basamak değerleri 2'nin katlarıdır.** Yeni bir şey öğrenmiyorsun; bildiğin şeyi farklı sayıda rakamla yapıyorsun.

---

## İkilik: Aynı Fikir, Sadece İki Rakam

Onlukta basamaklar 1, 10, 100… diye büyüyordu. İkilikte 1, 2, 4, 8, 16… diye büyür (her adımda iki katına çıkar):

```
 ... 128   64   32   16    8    4    2    1     ← basamak değerleri (2'nin katları)
```

Bir ikilik sayıyı okumak için, **1 olan** basamakların değerlerini toplarsın. Örnek — `1011`:

```
 basamak değeri:   8   4   2   1
 bit:              1   0   1   1
                   ↓   ↓   ↓   ↓
                   8 + 0 + 2 + 1   =  11
```

Yani ikilik `1011`, bizim bildiğimiz **11** sayısıdır. Bir örnek daha — `110`:

```
 basamak değeri:   4   2   1
 bit:              1   1   0    →  4 + 2 + 0 = 6
```

Hepsi bu. "1 olanların değerlerini topla." Bunu eline kâğıt alıp pratik etmene bile gerek yok; mantığını gördüğün yeter.

---

## Bir Byte Neden 0–255? (01'in Cevabı)

Hatırlarsan ilk derste "her kutuya 0–255 arası bir sayı sığar, neden 255 olduğunu sonra göreceğiz" demiştim. İşte cevabı.

Bilgisayar bitleri tek tek değil, **gruplar hâlinde** kullanır. 8 bitlik gruba **byte** denir — yani yan yana 8 anahtar. Belleğin o "kutuları" işte birer byte'tır.

8 anahtarla en küçük ve en büyük sayı ne olur?

```
 En küçük:  0 0 0 0 0 0 0 0   →  hepsi kapalı  =  0

 En büyük:  1 1 1 1 1 1 1 1   →  hepsi açık
 değerler: 128 64 32 16 8 4 2 1
         = 128+64+32+16+8+4+2+1 = 255
```

> 🔑 Yani 8 bit, **0'dan 255'e kadar** toplam **256** farklı değer tutabilir. "Neden 255?" sorusunun cevabı bu: bir byte'ın 8 anahtarının hepsi açık olduğunda ulaşılan en büyük sayı 255'tir. Daha büyük sayılar için makine birden fazla byte'ı yan yana kullanır (ileride göreceğiz).

> 💡 **Aklınıza takılabilir:** *"Bir kutuya en fazla 255 sığıyorsa, oyundaki 5000 puanım ya da bankadaki param nerede duruyor?"* Tek kutuya sığmaz — makine büyük sayıyı **ardışık birkaç kutuya** yayar (yukarıda değindik). Bu kutuların nasıl tek bir büyük sayı sayıldığını, ve "işçi onların 4 ayrı küçük sayı değil de tek sayı olduğunu nereden biliyor?" sorusunu [04_bellek_ve_registerlar](./04_bellek_ve_registerlar.md)'da tam olarak açıyoruz.

> 💡 **Peki neden tam 8 anahtar — neden 7 ya da 9 değil?** Ve neden bu yüzden en fazla 255? Bu aslında bir matematik kuralı değil, tarihsel bir **tercih.** Hem nedenini hem de hikâyesini dersin en sonundaki [Ek: Byte Neden 8 Bit?](#ek-byte-neden-8-bit-tarih%C3%A7e-ve-sebepler) bölümünde detaylıca anlattık. Şimdilik "8'lik gruplar bir gelenektir, sebebini sonda açıyoruz" demen yeter.

---

## Onaltılık: İnsanlar İçin Kısaltma

İkilik makine için harika ama insan için yorucu: `11111111` yazmak da okumak da göz yorar, hata yapması kolaydır. Çözüm **onaltılık** (hexadecimal, kısaca *hex*).

Hex'in tek bir güzel numarası var: **4 bit, tam olarak tek bir hex rakamına denk gelir.** (Çünkü 4 bit ile 16 farklı değer yazılır, hex'in de 16 rakamı vardır.) 16 rakam 0–9'la bitmediği için, 10'dan 15'e kadar olanlar harflerle yazılır:

```
 ikilik  hex          ikilik  hex
 0000  =  0           1000  =  8
 0001  =  1           1001  =  9
 0010  =  2           1010  =  A   (10)
 0011  =  3           1011  =  B   (11)
 0100  =  4           1100  =  C   (12)
 0101  =  5           1101  =  D   (13)
 0110  =  6           1110  =  E   (14)
 0111  =  7           1111  =  F   (15)
```

Bir byte 8 bittir; 8 bit = iki tane 4'lük grup = **tam tam 2 hex rakamı.** İşte o yorucu byte'ın kısa hâli:

```
 ikilik:   1111 1111
 hex:        F    F     →  yazılışı:  0xFF
 onluk:    255
```

Baştaki `0x` "dikkat, bu bir hex sayısı" demek için konur — yoksa `FF`'yi sayı mı yoksa harf mi diye karıştırırız. `0xFF` gördüğünde "tek bir byte, hepsi açık, yani 255" diye okursun.

> 💡 Hex'in tüm varlık sebebi budur: ikiliğin birebir, sadık ama **kısa** yazılışı. Bu yüzden düşük seviyede (assembly, GDB, bellek dökümleri) sayılar neredeyse hep hex yazılır. İkiliği gizlemez — sadece toparlar.

---

## Hex'i "Okumak" (Hesaplamak Değil)

Şimdi en rahatlatıcı kısım: **hex'i kafadan onluğa çevirmek zorunda değilsin.** İşin sırrı tanımakta:

- Başında `0x` görürsen → "bu ham bir makine sayısı / adres."
- `0xFF` → bir byte, tüm bitleri açık (255).
- `0x080484b6` gibi uzun bir şey → korkutucu değil; sadece bir **kutu numarası** (adres), kısa yazılmış hâli. Bir önceki dersteki depodaki kutuların numaraları işte böyle görünür.

Kesin sayıya ihtiyacın olduğunda **çevirmeyi bilgisayara yaptır.** Örneğin terminalde (02. dersten hatırla) `python3` yazıp şunları deneyebilirsin:

```
>>> 0xff
255
>>> 0b1011
11
```

Yani `0x...` yazınca sana onluk karşılığını söyler, `0b...` (ikilik) için de aynısı. Elle uğraşmana gerek yok; amaç bu gösterimleri *tanımak.*

> 🔑 Okur-yazarlık çıtası şu kadar: (1) `0x` = hex, `0b` = ikilik; (2) bir byte = 2 hex rakamı; (3) gördüğünde paniklemeyip "bu bir sayı/adres" diyebilmek. Zamanla göz aşinalığı kendiliğinden gelir.

---

## Bunu Nerede Göreceğim?

Bu ders soyut göründüyse, karşılığını çok yakında somut göreceksin. İleride GDB ile programları izlerken (07. ders) ekran şöyle şeylerle dolu olacak:

```
 eax = 0x5
 ebx = 0xffffd6a4
 adres 0x08048000 ...
```

Bugünden sonra bunlar artık anlamsız tılsımlar değil: `eax = 0x5` → "EAX kutusunda 5 var"; `0xffffd6a4` → "bir adres, yani bir kutu numarası." Sayıların makine dilini okumayı öğrendin; gerisi pratikte oturacak.

---

## Özet — Aklında Tut

```
☐ Amaç: makine sayılarını OKUMAK (hesaplamak değil). Matematik ödevi değil, okur-yazarlık.
☐ İçeride sadece açık(1)/kapalı(0) var → makine İKİLİK sayar. Tek anahtar = 1 bit.
☐ İkilik, onluğun aynısıdır; basamak değerleri 10'un değil 2'nin katları: 1,2,4,8,16,32,64,128...
    - Okumak = 1 olan basamakların değerlerini topla.  (1011 = 8+2+1 = 11)
☐ 1 byte = 8 bit → en büyük 11111111 = 255. Yani byte 0–255 (256 değer). [01'in cevabı]
☐ "8" bir doğa yasası değil, tarihsel bir tercih (harf sığsın + 2 BCD rakamı + 2'nin katı). Detay: sondaki Ek bölüm.
☐ HEX = ikiliğin kısa yazılışı. 4 bit = 1 hex rakamı; 1 byte = 2 hex rakamı.
    - Rakamlar: 0–9, sonra A,B,C,D,E,F (10–15). Başına 0x konur. Örn: 11111111 = 0xFF = 255.
☐ Çevirmeyi elle yapma: python3'te 0xff → 255, 0b1011 → 11. Sen sadece TANI.
☐ Çıta: 0x=hex, 0b=ikilik; byte=2 hex rakamı; gördüğünde "bu bir sayı/adres" de.
```

---

## Ek: Byte Neden 8 Bit? (Tarihçe ve Sebepler)

> Bu bölüm meraklısına. Atlasan dersin gerisini anlamana engel olmaz — ama yukarıda "byte neden tam 8?" diye sorduysan, cevabı (ve hikâyesi) burada. Hikâye de aslında güzel.

### Önce en önemli gerçek: 8 bir kural değil, bir tercih

Matematikte ya da fizikte "byte 8 bit olmalı" diye bir yasa **yoktur.** Bitleri istediğin sayıda gruplayabilirsin; mesele sadece "kaçarlı gruplayalım?" sorusudur. Nitekim ilk bilgisayarlar bu konuda tam bir kaostu — her makine kendi boyutunu seçiyordu. "8", sonradan belli sebeplerle kazanan bir gelenektir.

### "Byte" kelimesi nereden geliyor?

Terim 1956'da, IBM mühendisi **Werner Buchholz** tarafından, IBM'in ilk transistörlü süper bilgisayarı "Stretch" (IBM 7030) tasarlanırken ortaya atıldı. Buchholz, "bit" ile karışmasın diye İngilizce *bite* (lokma) kelimesini bilerek *byte* diye yazdı — yani bir byte, kabaca "makinenin tek seferde ısırıp işlediği bir lokma bit" demekti.

İlginç olan şu: Stretch'te byte'ın boyutu **sabit değildi.** Makine tek tek bitleri adresleyebiliyordu ve byte'ın kaç bit olacağı komutun içinde belirtiliyordu (değişken uzunluk). Yani başlangıçta "byte" henüz "8 bit" anlamına gelmiyordu; sadece "bir grup bit" demekti.

### Standart öncesi: bit boyutları kaosu

8 standartlaşmadan önce makineler her yola başvurdu:

```
 4 bit  → BCD: tek bir ondalık rakam (0–9) yazmak için
 5 bit  → Baudot: eski teleks/telgraf kodu
 6 bit  → BCDIC, askeri Fieldata: harf+rakam+sembol (küçük/büyük harf ayrımı zayıf)
 ...    → kelime boyutları da 12, 36, 60 bit gibi çok çeşitliydi
```

36-bitlik makineler (örneğin PDP-10) 1970'lere kadar yaygındı. O dönemde sayılar çoğu zaman **sekizlik** (octal) yazılırdı, çünkü kelime boyutları 3'ün katıydı. Yani "her şey hex" dünyası henüz yoktu.

### 8'in standartlaşması: IBM System/360 (1964)

Dönüm noktası **IBM System/360** oldu (1964'te duyuruldu). Bu makine byte'ı **8 bite sabitledi**, belleği byte byte adreslenir hâle getirdi ve 8-bitlik **EBCDIC** adlı karakter kodlamasını getirdi. System/360 ticari olarak devasa bir başarı kazandığı için, 8-bit byte fiilen tüm dünyanın standardı oldu. Ardından Intel'in 8008/8080 mikroişlemcileri bu 8-bit geleneğini kişisel bilgisayar çağına taşıdı; bugün elindeki her şey bunun üstüne kurulu.

System/360'ın baş mimarlarından Fred Brooks, sonradan "kariyerimdeki en önemli teknik karar, 360 için 8-bit byte'ı seçmekti" demiştir — bahsi, ileride **metin/karakter işlemenin** salt ondalık hesaptan daha önemli olacağıydı. Doğru çıktı.

### Peki neden tam 8? (üç sebep bir araya geldi)

1. **Bir harf tam sığsın diye (karakter kodlama).** 6 bit yalnızca 64 olasılık verir — büyük harf + küçük harf + rakam + noktalamaya yetmez. 8 bit ise 256 olasılık: koca bir karakter setine, üstüne aksanlı/ek karakterlere bile yer kalır. (7-bit ASCII İngilizce için yetiyordu; 8'e çıkmak hem ek karakterlere hem de hata kontrolü/parity'ye alan bıraktı.) Kısacası "1 byte = 1 karakter" rahatça oturdu.

2. **Ondalık (BCD) hesap için pratik.** O dönemin iş/finans makineleri ondalık sayılarla çalışıyordu ve bir ondalık rakam 4 bitle yazılıyordu (BCD). İki tane 4-bitlik rakam, tam tamına bir 8-bit byte'a sığar. Yani 8, ondalık dünyaya da temiz oturuyordu.

3. **2'nin katı / donanım dostu.** 8 = 2³. İkili adresleme, bellek düzeni ve veri yolları 2'nin katlarıyla temiz çalışır. Üstelik 8, iki tane 4-bitlik gruba — yani az önce öğrendiğin **iki hex rakamına** — bölünür. Bir byte'ın tam tamına 2 hex rakamı olmasının sebebi işte budur. 9 bit olsaydı ne hex'e temiz otururdu ne de bu hizalama olurdu.

### Bir de "octet" var

Bazı yerlerde (özellikle ağ/iletişim standartlarında, RFC'lerde) byte yerine **octet** kelimesini görürsün. Sebebi tam da bu tarihçe: "byte" geçmişte her zaman 8 bit olmadığı için, "kesinlikle 8 bit" demek isteyenler ikircik bırakmayan "octet" terimini kullanır. Yani octet gördüğünde "tam olarak 8 bit" diye oku.

### Ve "neden 255?" sorusunun özü

Artık 255'in neden 255 olduğu nettir: byte 8 bite sabitlendiği için, 8 bit `2⁸ = 256` farklı değer tutar, yani **0–255.** Gelenek 7 bit olsaydı en büyük sayı 127, 9 bit olsaydı 511 olurdu. Yani 255 sihirli bir sayı değil; yukarıdaki sebeplerle seçilen **8-bit geleneğinin doğrudan aritmetik sonucu.** Önce (o nedenlerle) 8 geldi, 255 ondan düştü.

> 🔑 Özet: "byte = 8 bit" bir doğa yasası değil, tarihsel bir uzlaşıdır. Bir harf sığsın (256 karakter), iki ondalık rakam paketlensin (2×4 bit) ve makineye "yuvarlak" gelsin (2'nin katı, iki hex rakamı) diye 8'de karar kılındı; IBM System/360 bunu standart yaptı. 255 de bu 8'in tabii sonucudur.

---

## 🔗 İlgili Konular

- [01_bilgisayar_nedir.md](./01_bilgisayar_nedir.md) — Kutular, byte ve "neden 0–255" sorusu
- [04_bellek_ve_registerlar.md](./04_bellek_ve_registerlar.md) — Adreslerin (kutu numaralarının) hex yazıldığı yer
- [07_gdb_tek_adim.md](./07_gdb_tek_adim.md) — Register ve adresleri hex olarak canlı göreceğin ders

---

**Önceki konu:** [02_terminal_ile_tanisma.md](./02_terminal_ile_tanisma.md)
**Sonraki konu:** [04_bellek_ve_registerlar.md](./04_bellek_ve_registerlar.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
