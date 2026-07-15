# ⚡ Şalterden Bilgisayara — Akım, Şalter ve İlk Kapı: NAND

> Bilgisayarın alfabesinde iki harf vardır: **var** ve **yok.**
> Bu derste o iki harfin fiziksel olarak ne olduğunu göreceksin, elektriğin kendi
> kendini yönetmesini sağlayan parçayla (röle) tanışacaksın ve serinin adını taşıyan
> ilk kapıyı — NAND'ı — kendi ellerinle kuracaksın.

> **Bu ders serinin temelidir.** Buradaki tek fikir ("elektrik elektriği yönetebilir")
> oturursa, serinin geri kalanı o fikrin tekrarıdır. Acele etme.

---

## 📋 İçindekiler

- [1 ve 0 Aslında Nedir?](#1-ve-0-aslında-nedir)
- [Şalter: Akıma Karar Veren Parça](#şalter-akıma-karar-veren-parça)
- [Röle: Kendi Kolunu Elektrik İten Şalter](#röle-kendi-kolunu-elektrik-iten-şalter)
- [Rölenin İki Huyu: Normalde Geçiren, Normalde Kesen](#rölenin-iki-huyu-normalde-geçiren-normalde-kesen)
- [Transistör: Rölenin Torunu](#transistör-rölenin-torunu)
- [İlk Görev: NAND Kapısı](#ilk-görev-nand-kapısı)
- [Neden İlk Kapı NAND?](#neden-ilk-kapı-nand)
- [🎮 Şimdi Sen Kur](#-şimdi-sen-kur)

---

## 1 ve 0 Aslında Nedir?

Bilgisayar anlatımlarının hepsi "birler ve sıfırlar" der ama çoğu, bunların **ne
olduğunu** söylemez. Söyleyelim:

> **1 = telde akım var. 0 = telde akım yok.** Hepsi bu.

Duvardaki lamba düğmesini düşün. Düğme açık → telde akım var → lamba yanıyor. Bu
durumun adına "1" diyoruz. Düğme kapalı → akım yok → "0". Bilgisayarın içindeki
milyarlarca telin her birinde, her an, bu ikisinden biri geçerlidir: ya akım vardır,
ya yoktur.

Burada durup önemli bir şeyin altını çizelim:

> 🔑 **Tel, "1" taşıdığını bilmez.** Telde sadece elektrik vardır ya da yoktur. "Bu
> akım 1 demek", "şu üç tel bir sayı demek", "şu sayı A harfi demek" — bunların hepsi
> **bizim biçtiğimiz anlamlardır.** Kum (silisyum) toplama yapmayı bilmez; desene
> anlamı biz veririz. Bu seride yaptığımız şey tam olarak bu: anlamsız akımlara,
> katman katman anlam giydirmek.

---

## Şalter: Akıma Karar Veren Parça

Akımı açıp kesen en basit parça, şalterdir — lamba düğmesinin ta kendisi:

```
   Akım kaynağı ───o   o─── lamba        (kol açık:  akım YOK → 0)

   Akım kaynağı ───o───o─── lamba        (kol kapalı: akım VAR → 1)
```

Şalterin tek marifeti var: bir telin yolunu **açmak ya da kapamak.** Ama bir sorunu
var: kolu **parmakla** itiliyor. Parmakla itilen bir şeyden bilgisayar kuramazsın —
saniyede milyarlarca kez düğmeye basacak parmak yok.

Peki kolu parmak yerine... **elektrik** itse?

---

## Röle: Kendi Kolunu Elektrik İten Şalter

**Röle**, kolu bir elektromıknatısla itilen şalterdir. İçinde iki bağımsız yol vardır:

- **Bobin (kontrol girişi):** buraya akım verirsen, içerideki mıknatıs çalışır ve
  şalterin kolunu çeker.
- **Kontak (asıl yol):** kolun açıp kapadığı, asıl akımın geçtiği yol.

```
        kontrol akımı (bobine)
              │
              ▼
         ┌─────────┐
   in ───┤ ⚡ kol  ├─── out        bobin doluysa kol çekilir,
         └─────────┘               in→out yolu açılır ya da kesilir
```

Sıradan bir parça gibi görünüyor. Değil. Burada, bu serinin — ve aslında bütün
bilgisayar tarihinin — en önemli fikri saklı:

> 💡 **Elektrik, elektriği yönetiyor.** Bir teldeki akım (bobin), başka bir teldeki
> akımın kaderine (kontak) karar veriyor. Bunun anlamı şu: bir rölenin **çıkışını**,
> başka bir rölenin **kontrol girişine** bağlayabilirsin. Kararlar zincirlenebilir.
> Karar zincirlenebiliyorsa — hesap kurulabilir. Parmak gerekmez.

---

## Rölenin İki Huyu: Normalde Geçiren, Normalde Kesen

Röle iki farklı huyla üretilir; ikisi de NandGame'in kutusunda seni bekliyor:

| NandGame adı | Huyu | Bobin **boşken** (c=0) | Bobin **doluyken** (c=1) |
|---|---|---|---|
| **relay (default on)** | normalde geçiren | `in`'i çıkışa **geçirir** | yolu **keser** |
| **relay (default off)** | normalde kesen | çıkış **boş** (0) | `in`'i çıkışa **geçirir** |

İki bekçi gibi düşün: biri kapıyı normalde **açık** tutar, emir gelince kapar;
öbürü normalde **kapalı** tutar, emir gelince açar.

> 💡 **Elektrik panosu görmüş biriysen:** bunlar NC (normally closed) ve NO (normally
> open) kontakların ta kendisidir — "default on" = NC, "default off" = NO. Kumanda
> devresi kurduysan, birazdan bilgisayarın da aynı parçalardan doğduğunu göreceksin.
> Hiç görmediysen de dert değil: "normalde geçiren / normalde kesen" demek yeterli.

---

## Transistör: Rölenin Torunu

Gerçek çiplerde röle yoktur — çünkü rölenin kolu **fiziksel olarak hareket eder** ve
hareket eden şey hem yavaştır hem aşınır. Modern çözüm **transistördür**: aynı işi
(bir akımın başka bir akımı açıp kesmesini) **hiçbir hareketli parça olmadan** yapan,
gözle görülmeyecek kadar küçük bir parça.

Boyut farkının yarattığı sonucu hissetmek için: bu satırları okuduğun cihazın
işlemcisinde **milyarlarca** transistör var ve her biri saniyede milyarlarca kez
açılıp kapanabiliyor.

> 🔑 Ama fikir değişmedi: **transistör = kolu elektrik itilen şalter.** Röleyle
> kurabildiğin her devre, transistörle de kurulur — sadece küçük ve hızlı olur. Bu
> yüzden bu seride gönül rahatlığıyla röleyle başlıyoruz: röleyi anlayan, transistörü
> anlamıştır.

---

## İlk Görev: NAND Kapısı

Artık ilk **kapımızı** kurabiliriz. Kapı (*gate*), birkaç şalterin birleşip tek bir
**karar** vermesidir: girişlere bakar, tek bir çıkış üretir.

İlk kapımızın adı **NAND** (İngilizce *Not AND* — "VE-değil"). Kuralı tek cümle:

> **İki giriş de 1 ise çıkış 0; diğer her durumda çıkış 1.**

Tablosu (oyunda da aynen bu tabloyu göreceksin):

| a | b | çıkış |
|---|---|:---:|
| 0 | 0 | **1** |
| 0 | 1 | **1** |
| 1 | 0 | **1** |
| 1 | 1 | **0** |

Huysuz bir bekçi gibi: kapıyı hep açık tutar, ama *"ikiniz birden geldiyseniz
giremezsiniz."*

---

## Neden İlk Kapı NAND?

Çünkü NAND **evrenseldir**: yalnızca NAND kullanarak DEĞİL, VE, VEYA, XOR — yani
**bütün öteki kapılar** kurulabilir. Kapılardan toplayıcılar, toplayıcılardan hesap
birimi, oradan hafıza ve işlemci... Yani:

> 🔑 **Tek çeşit tuğla yeter.** Milyarlarca transistörlü çip, "bir sürü farklı şey"
> değil — büyük ölçüde **aynı fikrin milyarlarca tekrarıdır.** Oyunun adının NandGame
> olması bundandır: bundan sonraki her şeyi, bu ilk kapından türeteceksin.

Bunu bir sonraki derste bizzat yapacaksın. Önce eldeki işi bitirelim.

---

## 🎮 Şimdi Sen Kur

**Görev:** [nandgame.com](https://nandgame.com) → ilk seviye: **Nand.**

Oyun sana iki çeşit röle verir (default on / default off) ve bir de **V** girişi —
"daima 1", yani sürekli akım veren bir kaynak (prize takılı tel gibi düşün).
Hedef: yukarıdaki NAND tablosunu sağlayan devreyi kurmak.

Denemeden önce iki yönlendirme:

1. Girişlerin **1 1** olduğu tek satır özel: sadece orada çıkış 0. "İkisi de geldi
   mi?" sorusunu hangi huylu röle, girişleri nasıl bağlayınca sorar?
2. Sonucun **tersine** ihtiyacın olursa: hangi huylu röle, bobinine 1 gelince yolu
   *keser*?

<details>
<summary>🔒 Çözümün mantığı — önce kendin dene, sonra aç</summary>

İki röle, iki iş:

1. **"İkisi de geldi mi?" sorusu — default off röle.** Bobinine `a`'yı, girişine
   (`in`) `b`'yi bağla. Bu röle ancak bobin doluyken geçirdiğine göre, çıkışında akım
   olması için **hem a=1 (bobin) hem b=1 (geçen akım)** gerekir. Yani bu rölenin
   çıkışı = "a VE b".
2. **Tersleme — default on röle.** Bobinine az önceki rölenin çıkışını, girişine
   `V`'yi (daima 1) bağla. Bobin boşken V'yi geçirir (çıkış 1); "a VE b" gerçekleşip
   bobin dolunca yolu keser (çıkış 0).

Sonuç: çıkış = "a VE b **değil**" = NAND. İki paslı röleyle, bilgisayarın evrensel
tuğlasını kurdun.

</details>

Seviyeyi geçtiğinde dur ve şunu hisset: az önce **elektriğe bir karar verdirdin.**
Parmak yok, insan yok — akım, akımı yönetti. Geri kalan her şey, bunun tekrarı.

---

## Özet — Aklında Tut

```
☐ 1 = akım var, 0 = akım yok. Başka bir şey değil.
☐ Tel anlam bilmez; 1/0'a, sayıya, harfe anlamı BİZ biçeriz.
☐ Şalter akımı açıp keser — ama kolu parmak ister.
☐ Röle = kolu ELEKTRİK itilen şalter → elektrik elektriği yönetir → kararlar zincirlenir.
☐ İki huy: default on = normalde geçirir (NC), default off = normalde keser (NO).
☐ Transistör = rölenin hareketsiz, minicik, milyarlarca kez hızlı torunu. Fikir aynı.
☐ NAND: yalnız "1 1"de 0, gerisi 1. Evrensel tuğla — her şey ondan türeyecek.
```

---

## 🔗 İlgili Konular

- [00_buradan_basla.md](./00_buradan_basla.md) — Serinin yol haritası
- [02_nanddan_kapilar.md](./02_nanddan_kapilar.md) — Bu tuğladan bütün kapıları türetmek

---

**Önceki konu:** [00_buradan_basla.md](./00_buradan_basla.md)
**Sonraki konu:** [02_nanddan_kapilar.md](./02_nanddan_kapilar.md)

*Bu ders, "Şalterden Bilgisayara" serisinin bir parçasıdır. Seri, [nandgame.com](https://nandgame.com) eşliğinde ilerler.*
