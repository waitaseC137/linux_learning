# 🚪 Şalterden Bilgisayara — XOR: İki Fedai Hikâyesi

> Şimdiye kadarki kapılar tek cümlelik karakterlerdi: "ikisi de", "en az biri",
> "tersi". Bu derste ilk kez **iki cümle birden** isteyen bir kapı kuracaksın: XOR,
> farklılık dedektörü. Yolda iki şey öğreneceksin: kapıların **takım** kurması ne
> demek — ve bir sonraki ünitenin kapısını açacak olan şu tuhaf gerçek: XOR, aslında
> gizli bir **toplayıcıdır.**

> XOR, serinin "beynim yandı" durağıdır: ilk çok-kapılı yapı. Yanma normaldir ve
> geçicidir — bu ders tam o duvar için yazıldı.

---

## 📋 İçindekiler

- [Görev: Farklılık Dedektörü](#görev-farklılık-dedektörü)
- [Neden Tek Kapı Yetmiyor?](#neden-tek-kapı-yetmiyor)
- [İki Fedai, Bir Onay Masası](#iki-fedai-bir-onay-masası)
- [Tabloyu Fedailerle Doğrula](#tabloyu-fedailerle-doğrula)
- [XOR'un Gizli Kimliği (Önümüzdeki Ünitenin Fragmanı)](#xorun-gizli-kimliği-önümüzdeki-ünitenin-fragmanı)
- [🎮 Şimdi Sen Kur](#-şimdi-sen-kur)

---

## Görev: Farklılık Dedektörü

**XOR** (İngilizce *exclusive or* — "dışlayıcı veya"), iki girişine bakıp tek bir soru
sorar: **"siz ikiniz farklı mısınız?"**

| a | b | XOR | okunuşu |
|---|---|:---:|---|
| 0 | 0 | **0** | aynılar → 0 |
| 0 | 1 | **1** | farklılar → 1 |
| 1 | 0 | **1** | farklılar → 1 |
| 1 | 1 | **0** | aynılar → 0 |

Aynı tabloyu ikinci bir gözlükle de okuyabilirsin: çıkış, yalnızca **tam olarak bir
tane 1** varken 1. İki okuma da doğru; ikincisini cebine koy, bu derste işe yarayacak.

---

## Neden Tek Kapı Yetmiyor?

Elindeki kapıları tek tek dene — hangisi bu tabloyu tutturuyor?

- **OR** dene: "en az biri." İlk üç satırda XOR ile aynı... ama son satırda çuvallar:
  OR(1,1)=1, XOR istiyor ki 0 olsun. ✗
- **NAND** dene: "ikisi birden olmasın." Son satırı tutturur (1,1→0)... ama ilk
  satırda çuvallar: NAND(0,0)=1, XOR istiyor ki 0 olsun. ✗
- **AND**, **NOT** — dene, hiçbiri dört satırın dördünü tutturamaz.

Sebebi şu: XOR'un istediği şey **tek şart değil, iki şartın kesişimi:**

1. "En az biriniz 1 olun" *(0,0'ı eler)*
2. "Ama ikiniz birden 1 olmayın" *(1,1'i eler)*

Tek kapı tek cümle söyler. İki cümlelik iş, **takım** ister.

> 🔑 Bu, serideki ilk büyük tasarım dersi: karmaşık bir istek, **basit isteklerin
> kesişimine** parçalanır. Her basit isteğe bir kapı, kesişime de bir kapı — ve iş
> biter. Bundan sonraki her devreyi böyle kuracaksın: önce cümlelere böl, sonra
> cümlelere kapı dağıt.

---

## İki Fedai, Bir Onay Masası

Şimdi hikâyeyi kur. Bir kulüp kapısı düşün; içeri girme kuralı "ikinizden tam biri" olsun.
Kapıda iki fedai duruyor ve her biri **tek bir kuralı** uyguluyor:

- **OR fedaisi:** *"En az biriniz gelmiş olmalı."* — Boş gelene (0,0) onay vermez.
- **NAND fedaisi:** *"Ama ikiniz birden giremezsiniz."* — Çift gelene (1,1) onay vermez.

İçerideki **onay masası (AND)** ise sadece şunu yapar: **iki fedai de "olur" derse**
kapıyı açar.

```
   a ──┬──────────► [ OR  fedaisi ] ──┐
       │                              ├──► [ AND onay masası ] ──► XOR çıkışı
   b ──┴──────────► [ NAND fedaisi ] ─┘
```

(a ve b, iki fedaiye de **aynı anda** görünür — teller çatallanır, sıra beklenmez.)

---

## Tabloyu Fedailerle Doğrula

Dört ihtimali tek tek kapıdan geçir:

| Gelenler (a,b) | OR fedaisi | NAND fedaisi | Onay masası (AND) |
|---|:---:|:---:|:---:|
| 0, 0 — kimse yok | ✗ "kimse gelmemiş" (0) | ✓ (1) | **0** — girilemez |
| 0, 1 — tek kişi | ✓ (1) | ✓ (1) | **1** — buyurun |
| 1, 0 — tek kişi | ✓ (1) | ✓ (1) | **1** — buyurun |
| 1, 1 — çift | ✓ (1) | ✗ "ikiniz birden olmaz" (0) | **0** — girilemez |

Dört satır, dört isabet. XOR = **AND( OR(a,b), NAND(a,b) )** — ama bu formülü
ezberleme; hikâyeyi hatırla, formül kendini yeniden yazar.

> 💡 Fark ettiysen: takımdaki üç kapının üçü de geçen dersten — OR, NAND, AND. XOR
> "yeni bir icat" değil, **eski tanıdıkların iş bölümü.** Yeni parça sayısı: sıfır.

---

## XOR'un Gizli Kimliği (Önümüzdeki Ünitenin Fragmanı)

Cebine koyduğun ikinci okumayı çıkar: XOR = "tam olarak bir tane 1 varsa 1."

Şimdi şu soruya cevap ver: **0 ile 1'i toplarsan kaç eder?** 1. Peki 1 ile 1'i? 2 —
ve ikilik dünyada 2'nin yazılışında birler hanesi **0**'dır (nedenini Ünite 1'de
adım adım kuracağız). Şimdi XOR'un tablosuna bir daha bak:

| a | b | a+b | toplamın birler hanesi | XOR |
|---|---|:---:|:---:|:---:|
| 0 | 0 | 0 | 0 | 0 |
| 0 | 1 | 1 | 1 | 1 |
| 1 | 0 | 1 | 1 | 1 |
| 1 | 1 | 2 | **0** | **0** |

Birebir aynı sütun. **XOR, iki bitlik toplamanın birler hanesidir.** Kulüp kapısında
fedailik yapan bu kapı, iki ders sonra bilgisayarın toplama yapmasını sağlayan
devrenin kalbi olacak.

---

## 🎮 Şimdi Sen Kur

**Görev:** NandGame → **Xor** seviyesi.

Hikâye elinde: iki fedai + onay masası. Kutundaki hazır parçalara bak (or, nand, and
— hepsini sen kurdun), tellerini çek. Kurduktan sonra dört giriş kombinasyonunu
**elle** dene ve her seferinde hangi fedainin "hayır" dediğini izle — devre o zaman
hikâyeye dönüşür.

<details>
<summary>🔒 Çözümün mantığı — önce kendin dene, sonra aç</summary>

`a` ve `b`'yi çatallayıp **hem OR'a hem NAND'a** sok. İki kapının çıkışını **AND**'e
ver; AND'in çıkışı XOR'dur.

Ekstra gözlem: devren çalışırken (1,1) ver ve NAND'ın çıkışındaki 0'ın AND'i nasıl
kilitlediğini izle; sonra (0,0) verip aynı kilidi OR tarafında gör. İki fedai, iki
ayrı satırı öldürüyor — tablo dört satırsa, iki "hayır" + iki "evet" tam hesap.

</details>

---

## Özet — Aklında Tut

```
☐ XOR = farklılık dedektörü: farklıysa 1, aynıysa 0.
☐ İkinci okuma: "TAM BİR tane 1 varsa 1" — bunu unutma, toplamada geri gelecek.
☐ Tek kapı yetmez, çünkü istek İKİ cümle: "en az biri" + "ikisi birden değil".
☐ Çözüm takımı: OR fedaisi (0,0'ı eler) + NAND fedaisi (1,1'i eler) + AND onay masası.
☐ Tasarım yöntemi: karmaşık isteği cümlelere böl, cümlelere kapı dağıt.
☐ XOR'un gizli kimliği: iki bitlik toplamanın BİRLER HANESİ.
```

---

## 🔗 İlgili Konular

- [02_nanddan_kapilar.md](./02_nanddan_kapilar.md) — Takımdaki üç kapının kuruluşu
- [03.5_soyutlama_merdiveni.md](./03.5_soyutlama_merdiveni.md) — Katları kutulamak: bu serinin ana fikri
- [05_half_adder.md](./05_half_adder.md) — XOR'un gizli kimliğinin açığa çıktığı yer

---

**Önceki konu:** [02_nanddan_kapilar.md](./02_nanddan_kapilar.md)
**Sonraki konu:** [03.5_soyutlama_merdiveni.md](./03.5_soyutlama_merdiveni.md)

*Bu ders, "Şalterden Bilgisayara" serisinin bir parçasıdır. Seri, [nandgame.com](https://nandgame.com) eşliğinde ilerler.*
