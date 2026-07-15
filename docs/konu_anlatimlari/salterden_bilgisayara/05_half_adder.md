# ➕ Şalterden Bilgisayara — Half Adder: İlk Toplayıcı

> Bir işlemcinin yaptığı işin dibini kazırsan hep aynı şeye ulaşırsın: **toplama.**
> Çıkarma, negatif sayıyla toplamadır; çarpma, tekrarlı toplamadır; bir oyundaki can,
> bir sayacın artışı, bellekte adres hesabı — hepsi toplamadır. Bu derste, o dev
> piramidin en dipteki hücresini kuracaksın: **iki biti toplayan devre.** Ve göreceksin
> ki parçaları çoktan cebinde taşıyorsun.

---

## 📋 İçindekiler

- [Görev: 1 + 1 Kaç Eder?](#görev-1--1-kaç-eder)
- [Tek Çıkış Neden Yetmez?](#tek-çıkış-neden-yetmez)
- [Tabloyu Kur, Tanıdıkları Bul](#tabloyu-kur-tanıdıkları-bul)
- [Devre: İki Eski Dost, Yan Yana](#devre-iki-eski-dost-yan-yana)
- [Neden "YARIM" Toplayıcı?](#neden-yarım-toplayıcı)
- [🎮 Şimdi Sen Kur](#-şimdi-sen-kur)

---

## Görev: 1 + 1 Kaç Eder?

Kurmak istediğimiz kutu basit görünüyor: iki giriş (`a`, `b`), her biri tek bit.
Kutu bunları **sayı olarak** toplasın.

İhtimaller topu topu dört tane:

```
   0 + 0 = 0        0 + 1 = 1        1 + 0 = 1        1 + 1 = ... 2
```

Ve ilk üçü sorunsuzken, dördüncüde işler ilginçleşiyor: **2.** Geçen dersten
biliyorsun — tek telde "2" diye bir şey yok. İkilikte 2, `10` diye yazılır: *bir
tane 2'lik, sıfır tane 1'lik.*

---

## Tek Çıkış Neden Yetmez?

İşte bu yüzden toplayıcımızın **iki çıkış teli** olmak zorunda:

- **l** (low / düşük) → **1'lik tel:** toplamın birler hanesi.
- **h** (high / yüksek) → **2'lik tel:** toplamın ikiler hanesi.

Okulda öğrendiğin dille söylersek: `l` = "**yaz**", `h` = "**elde**". 7+5=12'de
"2 yaz, 1 elde" derken yaptığın şeyin birebir aynısı — sadece bizim hanemiz 9'da
değil, 1'de doluyor: 1+1 = "0 yaz, 1 elde" = `10`.

> 🔑 Çıkışı hep 04'teki formülle oku: **toplam = 2·h + l.** İki tel, iki ayrı cevap
> değildir; **tek sayının iki basamağıdır.**

---

## Tabloyu Kur, Tanıdıkları Bul

Dört ihtimali alt alta yaz, her satırda sadece "kaç etti?" diye sor ve sonucu
`h l` olarak yaz:

| a | b | a+b | h (2'lik) | l (1'lik) |
|---|---|:---:|:---:|:---:|
| 0 | 0 | 0 | 0 | 0 |
| 0 | 1 | 1 | 0 | 1 |
| 1 | 0 | 1 | 0 | 1 |
| 1 | 1 | **2** | **1** | **0** |

Şimdi sütunlara **tek tek** bak. Bu serinin en tatlı sürprizlerinden biri seni bekliyor:

- **l sütunu:** `0, 1, 1, 0`... Bunu daha önce gördün. Farklıysa 1, aynıysa 0 —
  **bu XOR'un tablosu.** 03. dersin sonundaki "fragman" gerçek oldu: XOR'un gizli
  kimliği buymuş — *toplamanın birler hanesi.*
- **h sütunu:** `0, 0, 0, 1` — yalnız ikisi de 1 iken 1... **bu da AND.** Mantıklı:
  elde ancak *iki* 1 bir araya gelirse doğar; "ikisi de" sorusunu soran kapı zaten AND'di.

> 💡 Yeni hiçbir kapı icat etmedik. Toplama — bilgisayarın en temel yeteneği —
> meğer iki eski tanıdığın (XOR ile AND'in) **aynı soruya iki açıdan bakması**ymış:
> XOR "tekler ne diyor?" diye bakar, AND "çift oluştu mu?" diye.

---

## Devre: İki Eski Dost, Yan Yana

Tasarım kendini yazdı. `a` ve `b`'yi çatalla; bir kopyasını XOR'a, bir kopyasını
AND'e ver:

```
   a ──┬──────────► [ XOR ] ──────► l   (yaz / birler hanesi)
       │
   b ──┴──────────► [ AND ] ──────► h   (elde / ikiler hanesi)
```

İki kapı **yan yana**, aynı anda, aynı girişlere bakıyor — biri toplamın alt
basamağını, öbürü üst basamağını üretiyor. Bu kutunun adı **half adder** (yarım
toplayıcı).

---

## Neden "YARIM" Toplayıcı?

Gayet iş gören bir kutuya "yarım" demek haksızlık gibi duruyor. Değil — kutunun
gerçek bir eksiği var, ve bu eksik bir sonraki dersin varlık sebebi.

Kâğıtta çok haneli bir toplama yap: 27 + 35. Sağ basamak: 7+5=12, "2 yaz 1 elde".
Şimdi **orta basamağa** bak: 2 + 3 + **1 (elde)** — orta basamak **üç şey** topluyor!
Her basamak, sağ komşusundan gelen eldeyi de hesaba katmak zorunda.

Half adder'ın ise sadece **iki girişi** var. Gelen eldeyi alacak üçüncü bir ağzı yok.
Yani tek başına ancak **en sağ basamakta** iş görür — zincirin ilk halkası olabilir,
ortası olamaz.

> 🔑 **Half adder = elde ÜRETEBİLEN ama elde KABUL EDEMEYEN toplayıcı.** "Yarım"lığı
> budur. Eldeyi kabul edebilen "tam" versiyonu — full adder — bir sonraki derste
> kuracaksın, hem de bugün kurduğun bu kutuyu parça olarak kullanarak.

---

## 🎮 Şimdi Sen Kur

**Görev:** NandGame → **Arithmetics** bölümü → **Half Adder** seviyesi.

Bu sefer neredeyse her şeyi biliyorsun; oyunda hedef tabloyu görünce tanıyacaksın.
Kur, sonra dört kombinasyonu elle dene ve her seferinde içinden oku: *"kaç elma
saydım → hangi jetonlarla ödedim?"*

<details>
<summary>🔒 Çözümün mantığı — önce kendin dene, sonra aç</summary>

`a` ve `b`'yi çatallayıp **hem XOR'a hem AND'e** ver. XOR'un çıkışı → `l`,
AND'in çıkışı → `h`. İki kapı, dört tel — bilgisayar aritmetiğinin tohumunu ektin.

</details>

---

## Özet — Aklında Tut

```
☐ Bilgisayarın işlerinin dibinde hep toplama vardır; en küçük hücresi bu kutu.
☐ 1+1 = 2 = ikilikte `10` → tek sütun bile İKİ çıkış ister: l (yaz) + h (elde).
☐ Okuma: toplam = 2·h + l. İki tel = tek sayının iki basamağı.
☐ l sütunu = XOR (gizli kimliği: toplamanın birler hanesi).
☐ h sütunu = AND (elde ancak iki 1'den doğar).
☐ "Yarım"lığın sebebi: elde ÜRETİR ama elde KABUL EDEMEZ → sadece en sağ basamak olabilir.
```

---

## 🔗 İlgili Konular

- [04_teller_sayi_olunca.md](./04_teller_sayi_olunca.md) — `2·h + l` formülünün geldiği yer
- [03_xor_iki_fedai.md](./03_xor_iki_fedai.md) — XOR'un kuruluşu ve "gizli kimlik" fragmanı
- [06_full_adder.md](./06_full_adder.md) — Eksik ağzın tamamlanması: elde kabul eden toplayıcı

---

**Önceki konu:** [04_teller_sayi_olunca.md](./04_teller_sayi_olunca.md)
**Sonraki konu:** [06_full_adder.md](./06_full_adder.md)

*Bu ders, "Şalterden Bilgisayara" serisinin bir parçasıdır. Seri, [nandgame.com](https://nandgame.com) eşliğinde ilerler.*
