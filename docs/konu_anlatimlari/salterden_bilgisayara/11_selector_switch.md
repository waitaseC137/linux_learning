# 🔀 Şalterden Bilgisayara — Selector ve Switch: Devrenin İlk Kararı

> Bu seride bugüne kadar kurduğun her devre **tek bir iş** yapıyordu. Toplayıcıya
> iki sayı verirsin, toplar. Başka seçeneği yok — zaten sorulmuyor da.
>
> Bu derste kuracağın iki devre bir tel daha getiriyor: **ne yapılacağını söyleyen
> tel.** İşlemcinin programlanabilir olmasının kökü tam olarak burada.

> İki seviyeyi birlikte alıyoruz çünkü ikisi aynı fikrin iki yönü: biri
> *"hangisini alayım"*, diğeri *"nereye göndereyim"* diyor.

---

## 📋 İçindekiler

- [Veri Teli, Kontrol Teli](#veri-teli-kontrol-teli)
- [AND Bir Vanadır](#and-bir-vanadır)
- [⚠️ Vana Açık Olması, Verinin 1 Olması Demek Değil](#️-vana-açık-olması-verinin-1-olması-demek-değil)
- [Tek Telden İki Zıt Komut](#tek-telden-i̇ki-zıt-komut)
- [Birleştirme: OR Neden Güvenli](#birleştirme-or-neden-güvenli)
- [🎮 Şimdi Sen Kur — Selector](#-şimdi-sen-kur--selector)
- [Switch: Aynadaki Yansıma](#switch-aynadaki-yansıma)
- [🎮 Şimdi Sen Kur — Switch](#-şimdi-sen-kur--switch)
- [Vaviyen Anahtar — ve Benzetmenin Kırıldığı Yer](#vaviyen-anahtar--ve-benzetmenin-kırıldığı-yer)
- [Kapanış: Kararın Tele Dönüşmesi](#kapanış-kararın-tele-dönüşmesi)

---

## Veri Teli, Kontrol Teli

Selector'ın üç girişi var:

```
d0, d1   →   VERİ telleri       "üstünde çalışılacak şey"
s        →   KONTROL teli       "ne yapılacağı"
```

Fiziksel olarak aralarında **hiçbir fark yok.** Üçü de 0 ya da 1 taşıyan tel.
Voltmetreyle bakarsan ayırt edemezsin.

Fark **anlamda**: `s`'in değeri hesaba girmiyor. `s` toplanmıyor, çıkarılmıyor,
sonuca eklenmiyor. `s` sadece **hangi hesabın yapılacağını** söylüyor.

> 🔑 Bu, `04`'te yaptığının bir üst katı. Orada tellere **sayı** anlamı
> yüklemiştin. Burada bir tele **karar** anlamı yüklüyorsun. Devre değişmedi,
> senin ona yüklediğin anlam değişti — merdivende bir basamak daha
> ([03.5](./03.5_soyutlama_merdiveni.md)).

Seviyenin istediği şey basit:

```
s = 0   →   çıkış = d0
s = 1   →   çıkış = d1
```

---

## AND Bir Vanadır

Elinde `AND` var. Onu her zamanki gibi *"ikisi de 1 mi?"* diye okuma; bu sefer
**bir girişini sabitleyip** diğerinin ne yaptığına bak.

Bu hareketi daha önce yaptın — `06`'da tabloyu "katlara" ayırmıştık. Aynı numara:

```
 a  b │ AND
─────────────
 0  0 │  0     ┐
 1  0 │  0     ┘  ← b sabit 0 · a değişiyor → çıkış hiç kıpırdamadı
 
 0  1 │  0     ┐
 1  1 │  1     ┘  ← b sabit 1 · a değişiyor → çıkış a'yı takip etti
```

İki kattan iki **özdeşlik** çıkıyor:

```
x AND 1 = x        ←  x aynen geçer
x AND 0 = 0        ←  x'e hiç bakılmaz
```

> ⚠️ Bunlar **denklem değil, özdeşlik.** Denklemde bilinmeyeni bulursun
> (`x + 3 = 7` → `x = 4`). Özdeşlikte ifadeyi sadeleştirirsin: *her* `x` için ne
> ettiğini söylersin. Ve burada işin kolayı şu — `x` sonsuz değer alamıyor,
> sadece iki ihtimal var. "Her x için" demek, "iki durumu da dene" demek.

Bu iki satır birlikte okununca `AND`'in ikinci girişi bambaşka bir şeye dönüşüyor:

```
komut 1  →  vana AÇIK    ·  veri geçer
komut 0  →  vana KAPALI  ·  hiçbir şey geçmez
```

Aynı kapı, iki okuma: biri *"ikisi de 1 mi?"* diye soran **mantık kapısı**,
diğeri *"şunu geçir / geçirme"* diyen **musluk.**

### Altındaki cebir: etkisiz eleman

Bu aslında matematikten tanıdığın bir şey:

```
a + 0 = a          0, toplamanın etkisiz elemanı
a × 1 = a          1, çarpmanın  etkisiz elemanı
```

Boole cebrinde de aynısı var:

```
x AND 1 = x        1, AND'in etkisiz elemanı
x OR  0 = x        0, OR'un  etkisiz elemanı
```

> 🔑 **Bir kapıyı vana yapan şey, etkisiz elemanının olmasıdır.** Etkisiz
> elemanını verirsen geçirir, karşıtını verirsen bloke eder. Ezberlenecek değil,
> türetilecek bir şey — ve türetmek için doğruluk tablosuna bakmak yetiyor.

---

## ⚠️ Vana Açık Olması, Verinin 1 Olması Demek Değil

Bu dersin en çok tökezletilen yeri burası, ayrı başlık hak ediyor.

Musluğu açtın. **Su gelir mi?** Belli değil — boruda su varsa gelir, yoksa gelmez.
Musluğu açmak su **yaratmaz.**

```
s = 0  →  d0'ın vanası açık
       →  "artık çıkış d0'a bakacak"
       →  d0 ne ise o. d0 = 0 ise çıkış 0. d0 = 1 ise çıkış 1.
```

`s = 0`, *"d0 = 1"* demek **değil.** `s = 0`, *"söz sırası d0'da"* demek.

Devreyi kurunca bunu elle görmen lazım. Dört durumu sırayla dene:

| # | s | d0 | d1 | çıkış | ne oldu |
|:-:|:-:|:-:|:-:|:-:|---|
| 1 | 0 | 1 | 0 | **1** | d0 seçili, d0 geçti |
| 2 | 0 | 0 | 1 | **0** | ortada bir `1` var — ama **görmezden gelindi** |
| 3 | 1 | 1 | 0 | **0** | ortada bir `1` var — ama **görmezden gelindi** |
| 4 | 1 | 0 | 1 | **1** | d1 seçili, d1 geçti |

**Asıl kanıt 2 ve 3'te.** Her ikisinde de devrenin girişinde `1` duruyor, ama
vanası kapalı tarafta olduğu için çıkışa hiçbir etkisi yok.

> 🔑 `s` sayıları değiştirmiyor — **kimin konuşacağını** değiştiriyor. Seçme
> işini kanıtlayan şey, bir verinin orada olduğu hâlde çıkışa **etki
> edememesidir.**

Seviyenin cümlesi de tam bunu diyor: *"If 0, d0 is **selected**."* Buradaki
**selected** = *"sözü geçiyor"*, *"değeri 1"* değil. Seçilmiş giriş `0` da
olabilir; o zaman çıkış `0` olur ve bu yine de seçilmiş olduğu anlamına gelir.

---

## Tek Telden İki Zıt Komut

Her veri telinin önüne bir vana koyacaksın:

```
d0 ──[vana]──
d1 ──[vana]──
```

İstediğin şey belli: **her an tam olarak biri açık, diğeri kapalı.**

Ama elinde **tek bir `s`** var. `s = 1` olduğunda bir vanaya "aç", diğerine
**aynı anda** "kapa" demen lazım.

Çözüm toolbox'ta duruyor: `s`'i ikiye dağıt, birini ters çevir.

```
d0'ın vanası  ←  inv(s)
d1'in vanası  ←  s
```

Kontrol et: `s = 0` iken `inv(s) = 1` → d0'ın vanası açık, d1'inki kapalı.
Spec ne diyordu? `s = 0 → d0`. **Uyuyor.**

> 💡 Bir teli iki yere birden bağlamak (fan-out) yeni bir şey değil — `06`'da
> `add₁`'in `l` çıkışını hem bir yere hem başka bir yere göndermiştin. Tel
> tükenmez; okunması sinyali yok etmez.

---

## Birleştirme: OR Neden Güvenli

Şimdi elinde **iki çıkış** var ama seviyenin **tek** çıkışı var.

Ve şunu **biliyorsun**:

```
biri veriyi taşıyor  ·  diğeri KESİN 0
```

Kesin, çünkü bir vana açıksa diğeri kapalıdır. İkisi aynı anda dolu olamaz.

İki teli tek tele indirmek için `OR`:

```
x OR 0 = x
```

`0`, OR'un etkisiz elemanı. Yani kapalı vanadan gelen `0`, açık vanadan gelen
veriye **hiçbir şey katmıyor.** OR burada "veya" olarak değil, **birleştirici**
olarak çalışıyor.

> 🔑 Bunu daha önce yaptın. `06_full_adder`'da iki eldeyi OR ile birleştirirken
> gerekçe aynıydı: *ikisi aynı anda 1 olamaz, o yüzden OR'un şüpheli (1,1)
> satırına hiç uğranmıyor.* Aynı ispat, yeni yer. **Bir devrenin doğruluğu
> sadece kapılarına değil, hangi girişlerin mümkün olduğuna da bağlıdır.**

Devrenin tamamı:

```
d0 ──┬──[AND]──┐
     │    ↑    │
     │  inv(s) │
     │         ├──[OR]──► çıkış
 s ──┴──┐      │
        ↓      │
d1 ────[AND]───┘
```

Tek satırda:

```
çıkış = (d0 AND inv s)  OR  (d1 AND s)
```

Bu devrenin adı **multiplexer**, kısaca **mux**. Seninki 2→1 mux.

---

## 🎮 Şimdi Sen Kur — Selector

**Görev:** NandGame → **Selector** seviyesi.

Elindekiler: `nand`, `inv`, `and`, `or`, `xor`.

Kurduktan sonra yukarıdaki dört durumu **elle dene.** Özellikle 2 ve 3'ü — orada
bir `1` var ama çıkışa gelmiyor. Onu görmeden bu ders oturmaz.

<details>
<summary>🔒 Çözüm şeması — önce kendin dene, sonra aç</summary>

1. `inv`: girişi **`s`**.
2. `AND₁`: girişleri **`d0`** ve **`inv`'in çıkışı**.
3. `AND₂`: girişleri **`d1`** ve **`s`**.
4. `OR`: girişleri iki AND'in çıkışları → **çıkışa**.

</details>

---

## Switch: Aynadaki Yansıma

Sıradaki seviye aynı fikri **ters yönde** kuruyor:

| | giriş | çıkış | sorusu |
|---|---|---|---|
| **Selector** | 2 veri + s | 1 | *"hangisini alayım?"* |
| **Switch** | 1 veri + s | 2 | *"nereye göndereyim?"* |

Oyunun tablosu:

```
 s  d │ c1  c0
 0  0 │  0   0
 0  1 │  0   1     ← s=0 → d, c0'a gitti
 1  0 │  0   0
 1  1 │  1   0     ← s=1 → d, c1'e gitti
```

> ⚠️ 1. ve 3. satıra dikkat: `s` değişti ama **hiçbir şey değişmedi**, çünkü
> `d = 0`. Musluk açık, boru boş. Vana kavramı burada bir kez daha sınanıyor.

Vanalar bu sefer **girişlerin önünde değil, çıkışların önünde.** Ve tek bir `d`
her iki vanaya birden giriyor:

```
       ┌──[AND]──► c1      (komut: s)
d ──┬──┤
    │  └──[AND]──► c0      (komut: inv s)
    │
 s ─┴──► s ve inv(s)
```

```
c1 = d AND s
c0 = d AND inv(s)
```

**Birleştirme adımı yok** — çünkü çıkışların ayrı kalmasını istiyorsun. Selector'ın
formülünden `OR`'u silip iki parçayı ayrı bıraktığında Switch çıkıyor. Aynı
malzeme, farklı montaj.

---

## 🎮 Şimdi Sen Kur — Switch

**Görev:** NandGame → **Switch** seviyesi.

> ⚠️ Çıkışlar ekranda `c1` **solda**, `c0` **sağda** duruyor — okuma sırasına
> göre değil. Teli takarken **adına** bak, yerine değil. `07`'de `add` kutusunun
> bacak isimlerinde yaşadığın tuzağın aynısı.

<details>
<summary>🔒 Çözüm şeması — önce kendin dene, sonra aç</summary>

1. `inv`: girişi **`s`**.
2. `AND₁`: girişleri **`d`** ve **`s`** → çıkışı **`c1`**.
3. `AND₂`: girişleri **`d`** ve **`inv`'in çıkışı** → çıkışı **`c0`**.

`or` kullanmadın. Toolbox'ta duruyor ama bu seviyede gereksiz — her parçanın
kullanılması gerekmez.

</details>

---

## Vaviyen Anahtar — ve Benzetmenin Kırıldığı Yer

Switch'in elektrikte birebir karşılığı var: **vaviyen anahtar** (teknik adı
**SPDT** — tek kutuplu, çift yönlü). Merdiven boşluğunda ışığı iki ayrı yerden
yakıp söndüren o anahtar.

Uçları eşleştir:

```
ortak uç (C)       →  d       tek giriş
gidiş ucu 1 (L1)   →  c1
gidiş ucu 2 (L2)   →  c0
kolun konumu       →  s
```

Kol bir yerdeyken akım oraya gider, öbür uç **ölüdür.** Bizim vanaların yaptığı
şeyin aynısı.

Ve güzel kısım: **vaviyeni ters çevir.** İki gidiş ucundan besle, ortak uçtan al
— iki giriş, tek çıkış, kol hangisinin geçeceğini seçiyor. **Selector.**

```
düz  :  1 giriş → 2 çıkış     Switch
ters :  2 giriş → 1 çıkış     Selector
```

Aynı parça, iki yön. `07`'deki *"aynı telin iki adı"* meselesinin kardeşi.

### Ama benzetme bir yerde kopuyor

Mekanik anahtar **çift yönlüdür** — metal parçadır, akım iki yöne de akar. Tek
parçayı çevirip iki iş yaptırabilirsin.

Mantık kapıları **öyle değil.** `AND`'in girişi giriştir, çıkışı çıkıştır;
ters çeviremezsin. Bu yüzden Selector ve Switch'i **ayrı ayrı kurmak**
zorundasın — oyunun bunları iki seviye yapmasının sebebi tam olarak bu.

> 🔑 Benzetmenin kırıldığı yer, benzetmenin kendisi kadar öğretici:
> **elektrikte simetri var, mantıkta yön var.**

---

## Kapanış: Kararın Tele Dönüşmesi

Vaviyen benzetmesinde bir uç açıkta kalıyor: **`s` neye karşılık geliyor?**

Hiçbir tele. `s`, kolun **fiziksel konumu** — ve o konumu belirleyen şey bir **el.**

```
mekanik anahtar :  kararı  EL  verir      (devrenin DIŞINDAN)
mantık devresi  :  kararı  TEL verir      (devrenin İÇİNDEN)
```

Bütün mesele burada:

> 🔑 Karar bir tele dönüştüğü anda, o tel **başka bir devrenin çıkışı** olabilir.
> Yani makine kendi anahtarını **kendi çevirebilir.**

Vaviyende ışığı yakmak için birinin gelip kola dokunması gerekir. Devrede `s`
telini bir karşılaştırma devresinin çıkışına bağlarsan, anahtar **kendi kendine**
çevrilir. Otomasyon tam olarak bu.

Ve programlanabilirlik de: `s`'i bir **komut**tan beslersen, makineye ne yapacağını
yazıyla söylemiş olursun.

### ALU'ya köprü

Sıradaki ünitede bu doğrudan işine yarayacak:

```
toplama sonucu  ──┐
çıkarma sonucu  ──┼──[SELECTOR]──► ALU çıkışı
mantık sonucu   ──┘        ↑
                        opcode
```

ALU'nun içinde bütün devreler **aynı anda** çalışır — toplayıcı da toplar,
çıkarıcı da çıkarır, mantık birimi de kendi işini yapar. Sonra bir selector
*"bugün hangisini istiyoruz"* diye sorar ve sadece birini geçirir.

Yani bir işlemci, gereksiz hesap yapmaktan korkmaz. **Hepsini yapar, birini
seçer.** Seçmek, beklemekten ucuzdur.

> 💡 **Rafa kaldırdığımız bonus:** `AND` tek vana değil. `x OR 0 = x` ve
> `x OR 1 = 1` — yani `OR` da vanadır, sadece kapalıyken `0` değil **`1`** yayar.
> Ondan da eşdeğer bir selector çıkar; ama o zaman birleştirmeyi `OR` ile değil
> `AND` ile yaparsın (çünkü `1`, AND'in etkisiz elemanı). İki tasarım birbirinin
> aynadaki yansıması — buna **De Morgan ikiliği** denir. `XOR` ise vana olamaz:
> `x XOR 1 = inv(x)`, yani bloke etmiyor, **ters çeviriyor.**

---

## Özet — Aklında Tut

```
☐ Veri teli ≠ kontrol teli. Fizik aynı, ANLAM farklı. s hesaba girmez, hesabı SEÇER.
☐ AND bir vanadır: x AND 1 = x (açık), x AND 0 = 0 (kapalı).
☐ Bunlar denklem değil ÖZDEŞLİK — her x için ne ettiğini söyler. x'in 2 hâli var, ikisini de dene.
☐ Bir kapıyı vana yapan şey ETKİSİZ ELEMANIDIR (AND için 1, OR için 0).
☐ ⚠️ Vana açık olması, verinin 1 olması DEMEK DEĞİL. Musluk açık, boru boş olabilir.
☐ "selected" = sözü geçiyor. Seçilmiş giriş 0 da olabilir.
☐ Seçmenin kanıtı: bir 1'in orada olup çıkışa ETKİ EDEMEMESİ (2. ve 3. satır).
☐ Tek telden iki zıt komut → inv. Fan-out serbest, tel tükenmez.
☐ Kapalı vana 0 yayar; 0 OR'un etkisiz elemanı → OR birleştirici olur.
☐ İki dal aynı anda dolu olamaz → OR güvenli (06'daki ispatın aynısı).
☐ Selector: çıkış = (d0 AND inv s) OR (d1 AND s)  — 2→1 multiplexer.
☐ Switch:  c1 = d AND s · c0 = d AND inv s  — birleştirme YOK, çıkışlar ayrı.
☐ Vaviyen (SPDT) birebir aynı devre; ters çevirince Selector olur.
☐ Benzetme yönde kırılır: elektrikte simetri var, mantıkta YÖN var.
☐ Mekanikte kararı EL verir, devrede TEL verir → tel başka devrenin çıkışı olabilir.
☐ ALU: bütün devreler aynı anda çalışır, selector birini geçirir. Seçmek beklemekten ucuz.
```

---

## 🔗 İlgili Konular

- [10_bayraklar.md](./10_bayraklar.md) — Kararı **üreten** devre; buradaki `s`'i besleyecek olan
- [06_full_adder.md](./06_full_adder.md) — "İki dal aynı anda dolu olamaz → OR güvenli" ispatı
- [04_teller_sayi_olunca.md](./04_teller_sayi_olunca.md) — Tele anlam yüklemek
- [03.5_soyutlama_merdiveni.md](./03.5_soyutlama_merdiveni.md) — Merdivende bir basamak daha

---

**Önceki konu:** [10_bayraklar.md](./10_bayraklar.md)
**Sonraki konu:** *(yolda — ALU: bütün işlemler tek kutuda)*

*Bu ders, "Şalterden Bilgisayara" serisinin bir parçasıdır. Seri, [nandgame.com](https://nandgame.com) eşliğinde ilerler.*
