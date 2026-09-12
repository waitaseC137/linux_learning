# 🔗 Şalterden Bilgisayara — Subtraction: Eksi İşareti Olmayan Dünya

> Seviye senden `A − B` istiyor. Toolbox'a bakıyorsun ve **"subtract" diye bir kutu
> yok.** Elinde sadece toplayan bir alet var.
>
> Bu bir eksiklik değil, dersin kendisi. Çünkü gerçek işlemcilerde de ayrı bir
> çıkarma donanımı yoktur.

> Ama önce şu soruyu cevaplaman lazım, felsefi duruyor ama tamamen mühendislik:
> **bir telde eksi sayı neye benzer?** Telde ya gerilim vardır ya yoktur — eksi
> işareti diye bir hâli yok.

---

## 📋 İçindekiler

- [Çıkarmayı Toplamaya Çevirmek](#çıkarmayı-toplamaya-çevirmek)
- [Tellerde Eksi İşareti Yok](#tellerde-eksi-i̇şareti-yok)
- [Sayacı Geriye Çevir](#sayacı-geriye-çevir)
- [İspat: Gerçekten −1 Gibi Davranıyor mu?](#i̇spat-gerçekten-1-gibi-davranıyor-mu)
- [−B'yi Üretmek: Ters Çevir, 1 Ekle](#byi-üretmek-ters-çevir-1-ekle)
- [Neden Her Zaman Çalışıyor](#neden-her-zaman-çalışıyor)
- [Aynı Teller, İki Anlam](#aynı-teller-i̇ki-anlam)
- [🔒 Güvenlik Köprüsü](#-güvenlik-köprüsü)
- [🎮 Şimdi Sen Kur](#-şimdi-sen-kur)
- [Kapanış: Bayrakların Doğuşu](#kapanış-bayrakların-doğuşu)

---

## Çıkarmayı Toplamaya Çevirmek

Elinde toplayan bir alet varsa, işi toplama diline çevirmek zorundasın. Ortaokul
cebiri yeter:

```
A − B  =  A + (−B)
```

*(Buradaki parantez sadece "eksi B tek parça" demek için — işaretle ilgisi yok.)*

Sol taraf çıkarma, sağ taraf **toplama.** Aynı sonuç. Ve sağ tarafı `add 16` zaten
yapabiliyor.

Yani bütün seviye tek bir soruya indi:

> **`B`'yi alıp `−B`'yi nasıl üretirim?**

Bunu çözersen gerisini toplayıcı hallediyor.

---

## Tellerde Eksi İşareti Yok

Şimdi zor kısım. `−B` diye bir tel yok, olamaz da.

16 telin var, her biri 0 ya da 1. Toplam **65536** farklı desen. Eksi bir sayı
göstereceksen, o desenlerden **birini** seçip *"bu artık eksi bir demek"* diye
karar vermek zorundasın.

> 🔑 Eksi sayılar makinede **saklanmaz, temsil edilir.** Ortada eksi diye bir şey
> yok — sadece hangi desenin ne anlama geldiği konusunda bir anlaşma var.

Peki hangi deseni seçelim? Rastgele seçemeyiz — seçtiğimiz desen, toplayıcıda
**gerçekten eksi bir gibi davranmalı.**

---

## Sayacı Geriye Çevir

Kilometre sayacını hatırla (08. ders): 999999'dan sonra 000000 gelir. Peki
**geriye** çevirirsen? 000000'dan bir tık geri gidersen 999999'a düşersin.

16 bitlik sayacını 0'dan bir tık geri çevir:

```
   0000000000000010  =  2
   0000000000000001  =  1
   0000000000000000  =  0
   1111111111111111  =  ?     ← bir tık geri: buraya düşüyor
```

Sıfırın **bir altındaki** desen `1111111111111111`. Ve "sıfırın bir altı" demek,
tanım gereği **eksi bir** demek.

> 💡 Bu sarmayı sen zaten kurdun. 08. derste `65535 + 1 = 0` oluyordu — yani ileri
> yönde. Şimdi aynı çemberi ters yönde okuyorsun. Yeni bir mekanizma yok, aynı
> mekanizmanın öbür ucu.

---

## İspat: Gerçekten −1 Gibi Davranıyor mu?

"Öyle karar verdik" yetmez. Kanıtla.

−1'in tanımı tek cümle: **üstüne 1 eklersen 0 eder.** Test edelim:

```
   1111111111111111        (65535)
 + 0000000000000001        (1)
 ──────────────────────
  10000000000000000        17. bit sığmıyor, düşüyor
   0000000000000000  =  0  ✓
```

Geçti. Peki `1111111111111110` gerçekten −2 mi? Üstüne 2 ekle:

```
   65534 + 2 = 65536  →  16 bite sığmaz  →  0  ✓
```

O da geçti.

| desen | unsigned okunuşu | signed okunuşu |
|---|---:|---:|
| `0000000000000000` | 0 | 0 |
| `0000000000000001` | 1 | +1 |
| `1111111111111101` | 65533 | **−3** |
| `1111111111111110` | 65534 | **−2** |
| `1111111111111111` | 65535 | **−1** |

Seviyenin kendi cümlesi de bunun formülü: *"If the result is less than zero it is
represented as **65536 plus the result**."* Yani `−1` → `65536 + (−1)` = `65535`.

> 🔑 Bu gösterimin adı **ikinin tümleyeni** (two's complement). Kimse masaya oturup
> "eksi sayıları böyle yazalım" demedi — **sarmadan kendiliğinden çıktı.** Toplayıcı
> zaten böyle davranıyordu; biz sadece ona bir isim verdik.

---

## −B'yi Üretmek: Ters Çevir, 1 Ekle

Şimdi kurala gelelim. `B = 1` alalım ve `−1`'e ulaşmaya çalışalım:

```
B          =  0000000000000001     (1)
inv16(B)   =  1111111111111110     (65534 = −2)   ← ters çevirdik
hedef −1   =  1111111111111111
```

Ters çevirdik ve **−2**'ye düştük. Hedef **−1**. Aradaki fark: **1.**

```
inc16( inv16(B) )  =  1111111111111111  =  −1  ✓
```

> 🔑 **`−B = inc16( inv16(B) )`** — bütün bitleri ters çevir, sonra 1 ekle.

Toolbox'ta neden tam olarak `inv 16` ve `inc 16` durduğu şimdi anlaşıldı. Oyun sana
malzemeyi vermiş, tarifi vermemiş.

---

## Neden Her Zaman Çalışıyor

Tek örnek ispat değildir. Kâğıtta kanıtlayalım.

Bir sayı ile onun tersini topla — her hane için biri 0 biri 1 olacağı için sonuç
**her zaman** hepsi-1 çıkar:

```
    0000000000000011      B = 3
  + 1111111111111100      inv16(B)
  ──────────────────
    1111111111111111      65535    (her zaman)
```

Demek ki:

```
B + inv16(B) = 65535        →        inv16(B) = 65535 − B
```

Üstüne 1 ekle:

```
inc16( inv16(B) ) = 65536 − B
```

Ve seviyenin kuralı `−B`'yi `65536 − B` olarak tanımlıyordu.

**Aynı ifade.** Tesadüf değil, cebir.

> 💡 **Gerçek işlemciler bir adım daha kısaltıyor.** Ayrı bir `inc` bloğu koymazlar;
> `inv(B)`'yi toplayıcıya verip **carry-in'i 1'e sabitlerler.** Yani `A + ~B + 1`
> tek geçişte olur. 08. derste "carry-in, devreye 1 sokmanın en ucuz yeridir"
> demiştik — bir ALU'nun çıkarma yapma biçimi tam olarak budur.

---

## Aynı Teller, İki Anlam

Şuna iyi bak:

```
   1111111111111111
```

Bu desen **65535** mi, **−1** mi?

**İkisi de. Ve teller sana hangisi olduğunu söylemiyor.**

> ⚠️ Bir sayının işaretli mi işaretsiz mi olduğu **verinin içinde yazmaz.** Onu
> okuyan program karar verir. Aynı 16 tel, aynı gerilimler — iki farklı gerçeklik.

Bu, 04. dersteki fikrin en keskin hâli: *sayı devrede yoktur, telleri okuma biçiminde
vardır.*

---

## 🔒 Güvenlik Köprüsü

Bu belirsizliğin bedeli var ve adı **signed/unsigned confusion.**

Bir uzunluk değeri düşün. Ağdan `65535` geliyor. Program onu **işaretli** bir
değişkene koyuyor — artık değeri **−1**.

```c
if (len > MAX)          //  −1 > MAX  →  YANLIŞ  →  kontrol geçiyor
    return HATA;
memcpy(buf, src, len);  //  burada len UNSIGNED kullanılıyor → 65535 bayt
```

Kontrol `−1` gördü ve "küçük, sorun yok" dedi. Kopyalama `65535` gördü.

> ⚠️ 08. dersteki kalıbın kardeşi: **kontrol var, ama kontrolün baktığı sayı ile
> kullanılan sayı aynı değil.** Orada taşma deviriyordu, burada işaret yorumu.

İkisinin ortak kökü aynı cümle: **desen aynı, anlam okuyanın kararı.**

---

## 🎮 Şimdi Sen Kur

**Görev:** NandGame → **Subtraction** seviyesi.

Elindekiler: `add 16`, `inv 16`, `inc 16`, `or`, `inv`, `0`, `nand`.

<details>
<summary>🔒 Çözüm şeması — önce kendin dene, sonra aç</summary>

```
B  →  inv 16  →  inc 16  ──┐
                           ├──►  add 16  ──►  S  →  ÇIKIŞ
A  ────────────────────────┘
```

1. `B`'yi **`inv 16`**'dan geçir.
2. Çıkanı **`inc 16`**'ya ver. Elindeki artık **`−B`**.
3. `add 16`: bir bacağa **`A`**, diğerine **`−B`**.
4. **`S`** → çıkışa.

⚠️ `add 16`'nın **carry-in bacağını boş bırak.** 1 eklemeyi `inc 16` zaten yaptı;
oraya bir de 1 verirsen `A − B + 1` hesaplarsın.

</details>

---

## Kapanış: Bayrakların Doğuşu

Şu ana kadar kurduğun her şey **hesaplıyordu**: topla, artır, çıkar. Hepsi sayı
üretip veriyor.

Sıradaki iki seviye farklı bir şey yapacak: **soru soracak.**

- *"Bu sayı sıfır mı?"*
- *"Bu sayı negatif mi?"*

Cevapları tek bit: evet ya da hayır. Ve bu iki soruyu bu derste kurduğun çıkarıcıyla
birleştirince ortaya şu çıkıyor:

```
a == b   →   a − b yap, sonuç SIFIR mı?
a <  b   →   a − b yap, sonuç NEGATİF mi?
```

Karşılaştırma diye ayrı bir devre yok. **Çıkar, sonuca bak.** İşlemcinin "eğer"
diyebilmesi buradan başlıyor.

---

## Özet — Aklında Tut

```
☐ Çıkarma donanımı yoktur; A − B = A + (−B) diye toplamaya çevrilir.
☐ Tellerde eksi işareti yok. Eksi sayı SAKLANMAZ, bir desenle TEMSİL EDİLİR.
☐ 0'ın bir altındaki desen 1111111111111111 → o yüzden −1.
☐ İspat: 65535 + 1 = 0. −1'in tanımı zaten budur.
☐ Bu gösterimin adı ikinin tümleyeni; kimse tasarlamadı, SARMADAN çıktı.
☐ −B = inc16(inv16(B)) — ters çevir, 1 ekle.
☐ İspatı: inv16(B) = 65535 − B, +1 → 65536 − B = seviyenin kendi kuralı.
☐ Gerçek ALU inc kullanmaz: A + ~B ve carry-in = 1. Aynı sonuç, tek geçiş.
☐ Aynı 16 tel hem 65535 hem −1'dir. Anlamı VERİ değil, PROGRAM belirler.
☐ signed/unsigned confusion: kontrolün gördüğü sayı ile kullanılan sayı ayrışır.
```

---

## 🔗 İlgili Konular

- 👾 **Meraklısına:** Güvenlik Köprüsü'ndeki örneğin üç CWE'si — [CWE-196](../cwe/cwe_196.md) (dönüşüm) → [CWE-839](../cwe/cwe_839.md) (yarım kontrol) → [CWE-195](../cwe/cwe_195.md) (geri dönüşüm)
- [08_increment.md](./08_increment.md) — Sarma ve carry-in'in ucuzluğu
- [08.5_sayac_basa_donunce.md](./08.5_sayac_basa_donunce.md) — Sarmanın matematiği: `ℤ/2ⁿℤ`
- [04_teller_sayi_olunca.md](./04_teller_sayi_olunca.md) — "Sayı, okuma biçimindedir"
- [07_multibit_adder.md](./07_multibit_adder.md) — Toplayıcının kendisi

---

**Önceki konu:** [08.5_sayac_basa_donunce.md](./08.5_sayac_basa_donunce.md)
**Sonraki konu:** [10_bayraklar.md](./10_bayraklar.md) — Makinenin "eğer" demesi

*Bu ders, "Şalterden Bilgisayara" serisinin bir parçasıdır. Seri, [nandgame.com](https://nandgame.com) eşliğinde ilerler.*
