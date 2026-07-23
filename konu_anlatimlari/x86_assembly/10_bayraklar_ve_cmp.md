# 🚩 x86 Assembly — Bayraklar ve `cmp`: İşçi Kararı Nasıl Hazırlar

> 09'un sonunda küçük bir söz vermiştik: işçi `add`/`sub` yaparken kenara notlar tutuyor — *"sonuç sıfır mı çıktı? eksi mi?"* — ve bu notlara **bayrak** deniyor; "bütün kararların temeli 10'da" demiştik. İşte 10'dayız.
> Ama dikkat: bu ders **kararı** vermez. Kararı bir sonraki ders (11, zıplamalar) verecek. Burada kararın **ham maddesini** kuruyoruz — çünkü makine, bir şeye karar vermeden önce onu bir yere *not etmek* zorunda. O not defteri, bayraklar.

> **Bu derste kod var ve hepsini çalıştırıyoruz.** Aşağıdaki her program ve her GDB çıktısı gerçek: kendi makinemde derleyip koşturdum, gördüğün `eflags` satırları uydurma değil.

---

## 📋 İçindekiler

- [Bayrak Nedir? İşçinin Kenar Notu](#bayrak-nedir-i%CC%87%C5%9F%C3%A7inin-kenar-notu)
- [`cmp`: Değeri Yok Etmeden Karşılaştır](#cmp-de%C4%9Feri-yok-etmeden-kar%C5%9F%C4%B1la%C5%9Ft%C4%B1r)
- [Üç Durum: Eşit, Büyük, Küçük](#%C3%BC%C3%A7-durum-e%C5%9Fit-b%C3%BCy%C3%BCk-k%C3%BC%C3%A7%C3%BCk)
- [Sık Görülen Kısa Yol: `test eax, eax`](#s%C4%B1k-g%C3%B6r%C3%BClen-k%C4%B1sa-yol-test-eax-eax)
- [Bayrak Tek Başına İşe Yaramaz](#bayrak-tek-ba%C5%9F%C4%B1na-i%CC%87%C5%9Fe-yaramaz)

---

## Bayrak Nedir? İşçinin Kenar Notu

09'da bir hesap yaptırdın: `add eax, 3`. İşçi bunu yaparken, sen istemesen de, kenardaki minik bir deftere birkaç işaret koydu:

- *"Bu işlemin sonucu tam **sıfır** mı oldu?"*
- *"Sonuç **eksi** mi (en üst bit 1 mi)?"*
- *"Sayı taştı mı, elde çıktı mı?"*

Bu işaretlerin her biri tek bir **bit**tir — ya açık (1) ya kapalı (0). Adları **bayrak** (İngilizce *flag*). İşçi her `add`/`sub`/`cmp` sonrası bu bayrakları **otomatik** günceller; ekstra emir vermene gerek yok, iş bittiğinde deftere kendiliğinden yazar.

Bütün bayraklar tek bir özel register'da, yan yana durur: **`eflags`**. 04.5'te register'ın "aynı bitler, farklı pencere" olduğunu görmüştük; `eflags` de bir register, ama içindeki her bitin **ayrı bir anlamı** var — biri "sıfır mı", biri "eksi mi", diye.

Şu an bizi yalnızca **ikisi** ilgilendiriyor:

| Bayrak | Kısaltma | Ne der | Ne zaman 1 olur |
|:---:|:---:|---|---|
| Sıfır bayrağı | **ZF** (*Zero Flag*) | "Sonuç sıfır mı?" | Sonuç tam **0** çıkınca |
| İşaret bayrağı | **SF** (*Sign Flag*) | "Sonuç eksi mi?" | Sonucun en üst biti **1** olunca (yani eksi) |

> 🔑 Bir **bayrak** = `eflags` register'ındaki tek bir bit; işçinin bir hesabın sonucu hakkında tuttuğu kenar notu. **ZF** = "sonuç sıfırdı", **SF** = "sonuç eksiydi". `add`/`sub`/`cmp` bunları kendiliğinden günceller.

---

## `cmp`: Değeri Yok Etmeden Karşılaştır

Karar vermenin ilk adımı **karşılaştırmaktır**: "bu iki sayı eşit mi? hangisi büyük?" Peki iki sayıyı nasıl karşılaştırırsın? Tanıdık numarayla: birini diğerinden **çıkar**, sonuca bak.

- Fark **sıfır**sa → eşitler.
- Fark **eksi**yse → ilki daha küçük.

Ama bir sorun var. `sub eax, ebx` yaparsan, eax'in **eski değeri yok olur** — üstüne sonucu yazdın. Oysa sen genellikle karşılaştırdığın sayıyı *sonra da* kullanmak istersin; sırf bakmak için onu çöpe atmak istemezsin.

İşte `cmp` (İngilizce *compare*) tam bu iş için var: **çıkarmayı yapar, ama sonucu bir yere yazmaz — sadece bayrakları kurar.**

```nasm
cmp eax, ebx        ; içeride eax - ebx hesaplar, SONUCU ATAR, yalnız ZF/SF'yi kurar
```

Yani `cmp`, `sub`'ın "değeri koruyan" kardeşidir: aynı çıkarmayı yapar, ama tek bıraktığı iz **bayraklar**. Kanıtlayalım. `esit.asm` — iki eşit sayıyı karşılaştıralım:

```nasm
section .text
    global _start

_start:
    mov eax, 7
    mov ebx, 7
    cmp eax, ebx        ; 7 - 7 = 0  → ZF açılmalı
    mov eax, 1
    mov ebx, 0
    int 0x80
```

Çevir, çalıştır (07'deki alışkanlıkla GDB'de bakacağız):

```
nasm -f elf32 esit.asm -o esit.o
ld -m elf_i386 esit.o -o esit
```

`cmp`'i çalıştırıp hem bayraklara hem de eax/ebx'e bakalım:

```
gdb ./esit
(gdb) set disassembly-flavor intel
(gdb) starti
(gdb) si            # mov eax, 7
(gdb) si            # mov ebx, 7
(gdb) si            # cmp eax, ebx
(gdb) info registers eflags
(gdb) info registers eax ebx
```

Gerçek çıktı:

```
eflags         0x246               [ PF ZF IF ]
eax            0x7                 7
ebx            0x7                 7
```

İki şeye birden dikkat et:

1. **`ZF` orada** — köşeli parantezin içinde. `7 - 7 = 0` olduğu için işçi "sonuç sıfır" notunu düştü. Bayrak açıldı.
2. **eax hâlâ 7, ebx hâlâ 7.** `cmp` sayıları karşılaştırdı ama **hiçbirini bozmadı.** Değeri yok etmeden karşılaştırdın — işte `cmp`'in bütün marifeti bu.

Karşılaştırmak için `sub eax, ebx` yazsaydın ZF yine açılırdı, **ama** eax `0` olurdu — 7'yi kaybederdin. Aynı programı `cmp` yerine `sub` ile denesen GDB'de eax'i `0` görürdün. `cmp` = "çıkar ama değere dokunma."

> 🔑 `cmp a, b`, içeride `a - b` yapar ama **sonucu hiçbir yere yazmaz** — yalnız bayrakları (ZF/SF) kurar. `sub`'ın değeri koruyan kardeşidir: karşılaştırdığın sayı yerinde kalır. Karşılaştırmanın standart yolu budur.

> 💡 **Aklınıza takılabilir:** *"eflags çıktısında `PF` ve `IF` de var — onlar ne?"* GDB `eflags`'in **bütün** açık bayraklarını gösterir; hepsi bizim değil. `IF` (interrupt flag) neredeyse hep açıktır, işletim sistemiyle ilgili, seni ilgilendirmez. `PF` (parity) da şimdilik konumuz dışı. Bu derste yalnız **ZF** ve **SF**'yi takip et; gerisini görmezden gel. (00'ın sözü hatırında: burada gizli iş yok — sadece "şimdilik lazım olmayan" var.)

---

## Üç Durum: Eşit, Büyük, Küçük

Bir karşılaştırmanın üç olası sonucu vardır: eşit, ilki büyük, ilki küçük. Üçünü de aynı `cmp` ile ayırt edeceğiz — tek fark, hangi bayrakların açıldığı. Üç programı da çalıştırıp `eflags`'e bakalım (hepsi yukarıdaki `esit.asm` iskeletinin aynısı, sadece sayılar değişik).

**Eşit** — `cmp 7, 7` (yukarıdaki `esit`):

```
eflags         0x246               [ PF ZF IF ]     → ZF açık
```

**İlki büyük** — `buyuk.asm`, `cmp 9, 4` (fark `+5`, pozitif):

```
eflags         0x206               [ PF IF ]        → ZF de SF de YOK
```

**İlki küçük** — `kucuk.asm`, `cmp 4, 9` (fark `-5`, eksi):

```
eflags         0x293               [ CF AF SF IF ]  → SF açık
```

Tabloya koyalım — karar mantığının çekirdeği bu:

| Karşılaştırma | İçerideki fark | ZF | SF | Ne anlama gelir |
|---|:---:|:---:|:---:|---|
| `cmp 7, 7` | 0 | **1** | 0 | **eşit** (fark sıfır) |
| `cmp 9, 4` | +5 | 0 | 0 | ilki **büyük** (fark pozitif) |
| `cmp 4, 9` | −5 | 0 | **1** | ilki **küçük** (fark eksi) |

Okuması çok basit:

- **ZF = 1** ise iki sayı **eşit** (çünkü fark sıfır).
- **ZF = 0, SF = 1** ise ilk sayı **küçük** (fark eksiye düştü. 09'daki `0xFFFFFFFD` gibi eksi sayılar hep en soldaki bitle başlar; iki'ye tümleyende **en üst bit = "eksi mi" işaretidir** — SF işte o biti kopyalar).
- **ZF = 0, SF = 0** ise ilk sayı **büyük** (fark pozitif, sıfır değil).

İşçi "hangisi büyük" sorusunu böyle "hatırlar": aslında hatırlamaz — sadece iki bit bırakır, sen (daha doğrusu bir sonraki komut) o iki bite bakıp kararı okur.

> 💡 **Aklınıza takılabilir:** *"`cmp 4, 9`'da `CF` ve `AF` de açılmış — onları da mı okumam lazım?"* Hayır, şimdilik değil. Ayrıca dürüst bir uyarı: "SF açıksa ilki küçüktür" kuralı burada temiz çalışıyor, ama **çok büyük** sayılarda (taşmanın karıştığı sınır durumlarda) tek başına SF yanıltabilir. İyi haber: bu inceliği senin elle çözmen **hiç gerekmeyecek** — 11. derste tanışacağın `jl` ("küçükse atla") ve `jg` ("büyükse atla") gibi komutlar doğru bayrak kombinasyonunu *kendileri* bilir. Yani "hangisi büyük" kararını sen bayrak bayrak hesaplamayacaksın; `cmp` kurar, zıplama komutu doğru okur. Şimdilik resmi görmen yeter.

---

## Sık Görülen Kısa Yol: `test eax, eax`

Çok, çok sık ihtiyacın olan bir karşılaştırma var: *"bu register sıfır mı?"* (Bir sayaç bitti mi, bir sonuç boş mu, bir bayrak değeri 0 mı...) Bunu `cmp eax, 0` ile yapabilirsin — ama assembly'de neredeyse herkes bunun yerine şunu yazar:

```nasm
test eax, eax       ; "eax sıfır mı?" → sıfırsa ZF=1
```

`test`, `cmp` gibi "sonucu atıp yalnız bayrak kuran" bir komuttur. `test eax, eax` kullanıldığında pratik sonucu tek cümle: **eax sıfırsa ZF açılır, değilse kapalı kalır.** (Yeri gelmişken: `test eax, eax` aslında SF'yi de kurar — eax eksiyse SF=1 olur — ama bu "sıfır mı" kısayolunda yalnız ZF'ye bakıyoruz.) İki programla görelim.

`testsifir.asm` (eax = 0):

```nasm
section .text
    global _start

_start:
    mov eax, 0
    test eax, eax       ; eax sıfır mı? → ZF=1
    mov eax, 1
    mov ebx, 0
    int 0x80
```

`testdolu.asm` — tek fark `mov eax, 42`. İkisinde de `test`'ten sonra `eflags`:

```
testsifir  (eax=0)   →  eflags  [ PF ZF IF ]   → ZF AÇIK   (eax sıfırdı)
testdolu   (eax=42)  →  eflags  [ IF ]          → ZF YOK    (eax doluydu)
```

İşte "sıfır mı?" testinin standart hâli: `test eax, eax` → ZF'ye bak. Döngü sayaçlarında ve "boş mu dolu mu" kontrollerinde bunu bolca göreceksin.

> 💡 **Aklınıza takılabilir:** *"`test` içeride tam olarak ne yapıyor? Neden `eax, eax`'i iki kez yazıyoruz?"* `test`'in içindeki işlem bir **bit işlemi** (`and`) ve onu daha görmedik — o yüzden mekanizmayı şimdilik kapalı kutu olarak bırakıyorum: **13. derste (`and`/`or`/`xor`) tam açacağız.** Bu derste sana lazım olan tek şey işlevi: `test eax, eax`, "eax sıfır mı" diye sorar ve cevabı ZF'ye koyar. (Neden `cmp eax, 0` yerine bu? Çünkü daha kısa/hızlı — ama sebebi 13'e ait.)

---

## Bayrak Tek Başına İşe Yaramaz

Dürüst olalım: bu dersin programları aslında **hiçbir şey yapmadı.** Karşılaştırdık, bayraklar açıldı — ama sonra? Program yine düz düz aşağı aktı, çıktı. Bir bayrağın açılması, tek başına, programın davranışını **değiştirmedi.**

Ve bu tam olarak beklenen şey. Çünkü bayrak, kararın **kendisi** değil, **ham maddesi**dir. Zinciri şöyle düşün:

```
   cmp / test   →   bayrağı KURAR   (bu ders: 10)
        ↓
   jz / jnz / jl / jg   →   bayrağı OKUR ve ona göre bir yere ATLAR   (sonraki ders: 11)
```

Şimdiye kadar işçiye hep "sırayla, satır satır ilerle" dedik — program yukarıdan aşağı tek yol. Bir sonraki derste ilk kez o düz yolu **kıracağız**: "eğer ZF açıksa şuraya atla, değilse buradan devam et." İşte o an — bayrağın açık/kapalı olmasına göre programın **farklı yollara** sapması — bir bilgisayarın "karar vermesi" dediğimiz şeyin ta kendisi. Ve bugün kurduğun bayraklar olmadan o karar imkânsız.

> 🔑 `cmp`/`test` **kurar**, zıplama komutları **okur.** Bayrak, "eşit miydi / büyük müydü" bilgisini bir komuttan sonrakine taşıyan köprüdür. Tek başına programı değiştirmez; onu 11'deki zıplamalar hayata geçirir. Bu yüzden 10 olmadan 11 olmaz.

---

## Özet — Aklında Tut

```
☐ BAYRAK = eflags register'ındaki tek bir bit; işçinin bir hesabın sonucu hakkındaki kenar notu.
    add / sub / cmp / test bunları KENDİLİĞİNDEN günceller.
☐ Bu derste iki bayrak önemli:
    - ZF (Zero Flag)  → sonuç TAM SIFIR olunca 1.  "eşit mi / sıfır mı"
    - SF (Sign Flag)  → sonuç EKSİ olunca (en üst bit 1) 1.  "eksi mi" (09'un two's complement'i)
☐ cmp a, b = içeride a - b yapar, SONUCU ATAR, yalnız bayrakları kurar.
    - sub'ın değeri koruyan kardeşi: karşılaştırdığın sayı bozulmaz (cmp 7,7 sonrası eax hâlâ 7).
☐ Üç durum (cmp a, b):
    - ZF=1            → a == b   (eşit)
    - ZF=0, SF=0      → a  > b   (ilki büyük)
    - ZF=0, SF=1      → a  < b   (ilki küçük)   [çok büyük sayılardaki incelik 11'deki jl/jg'nin işi]
☐ test eax, eax = "eax sıfır mı?" kısa yolu → sıfırsa ZF=1. (İçindeki mekanizma: and, 13'te.)
☐ GDB: info registers eflags → [ ... ZF ... SF ... ] açık bayrakları gösterir.
    IF/PF/CF/AF de görünebilir; şimdilik SADECE ZF ve SF'yi takip et.
☐ Bayrak tek başına programı değiştirmez: cmp/test KURAR → 11'deki zıplama komutları OKUR ve karar verir.
```

---

## 🔗 İlgili Konular

- [09_aritmetik.md](./09_aritmetik.md) — `add`/`sub`'ın "kenara not tuttuğu"nu (bayrak) ve two's complement'i (SF'nin "eksi" anlamı) burada söz vermiştik; işte o notlar
- [04.5_registerin_ici.md](./04.5_registerin_ici.md) — `eflags` de bir register; "aynı bitler, ayrı anlamlar" fikrinin bir başka yüzü
- [01.5_sayi_ve_anlam.md](./01.5_sayi_ve_anlam.md) — Bir bit tek başına anlamsız; ona anlamı (ZF = "sıfırdı") kullanan komut verir
- [07_gdb_tek_adim.md](./07_gdb_tek_adim.md) — `si` + `info registers` ile bir komutun bayrakları nasıl değiştirdiğini canlı izlemek

---

**Önceki konu:** [09_aritmetik.md](./09_aritmetik.md)
**Sonraki konu:** [11_ziplamalar.md](./11_ziplamalar.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
