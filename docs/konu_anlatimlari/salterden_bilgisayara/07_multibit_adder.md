# 🔗 Şalterden Bilgisayara — Multi-bit Adder: Aynı Telin İki Adı

> Geçen dersin sonunda kutuların birbirine takılabileceğini gördün: birinin `h`'si,
> solundakinin `c`'si oluyordu. Bu derste o zinciri gerçekten kuracaksın — ve
> kurduğun anda tek basamaklık bir oyuncaktan **gerçek sayılarla çalışan** bir
> makineye geçmiş olacaksın.

> Ama asıl ders kablolamada değil. İki kutu arasına çektiğin o tek telin **iki
> ayrı adı** var ve insanların çoğu tam orada kilitleniyor. Bu dersin omurgası o tel.

---

## 📋 İçindekiler

- [Tek Basamaktan Sayıya](#tek-basamaktan-sayıya)
- [Aynı Telin İki Adı](#aynı-telin-i̇ki-adı)
- [Bir de Üçüncü Sözlük: sum / carry](#bir-de-üçüncü-sözlük-sum--carry)
- [Yanlış Yol: Soldan Başlamak](#yanlış-yol-soldan-başlamak)
- [Analiz Yönü ≠ Hesap Yönü](#analiz-yönü--hesap-yönü)
- [Gidecek Yeri Olmayan Elde](#gidecek-yeri-olmayan-elde)
- [🎮 Şimdi Sen Kur](#-şimdi-sen-kur)
- [Kapanış: Zincirin Bedeli](#kapanış-zincirin-bedeli)

---

## Tek Basamaktan Sayıya

Full adder **bir basamağın** makinesiydi. Ama sayıların bir basamağı yok — `27`'nin
iki, `1453`'ün dört basamağı var. O halde basamak başına bir kutu.

İki basamaklı iki sayıyı ve gelen bir eldeyi toplayalım. Kâğıda tam olarak şöyle
yazarsın:

```
         a1    a0
       + b1    b0
                c      ← sağdan gelen elde
    ──────────────
     c    s1    s0
```

Her dikey kolon bir **sütun**, her sütun bir **full adder**. Hepsi bu.

> 🔑 Zincirlemek yeni bir fikir değil — 03.5'teki merdivenin aynısı. Bir kutunun
> **cevabı**, komşu kutunun **girişi** oluyor. Sen sadece merdiveni bu sefer
> yukarı değil, **yana** kuruyorsun.

---

## Aynı Telin İki Adı

Şimdi dersin kalbi. Sağdaki sütunun kutusunu kurdun, bir `h` çıkışı verdi. Soldaki
sütunun kutusu bir `c` girişi istiyor. Aralarına **bir tel** çekiyorsun.

O tele iki taraftan bakalım:

```
   ┌──────────────┐            ┌──────────────┐
   │  SOL SÜTUN   │            │  SAĞ SÜTUN   │
   │   (a1,b1)    │            │   (a0,b0)    │
   └──────┬───────┘            └──────┬───────┘
          │  c  ◄────── TEK TEL ──────┤  h
          │                           │
    "bana elde GELDİ"           "benim eldem ÇIKTI"
       carry IN                   carry OUT
```

Sağdaki kutuya göre bu telin adı **carry out**. Soldaki kutuya göre aynı telin adı
**carry in**.

> 🔑 **Carry-in ile carry-out iki farklı şey değildir — aynı telin iki ucudur.**
> İsim, telin kendisiyle ilgili değil; **hangi kutunun içinden baktığınla** ilgili.

Bu ayrımı öğrenmenin neden bu kadar zor olduğunu fark ettin mi: ortada **ayırt
edilecek iki şey yok ki.** Beynin iki isim duyunca iki nesne arıyor, bulamıyor,
kilitleniyor. Nesne bir tane; bakış açısı iki tane.

> 💡 Aynı hikâye kâğıtta da var. `7+5=12` deyip 1'i yukarı yazdığında o 1 senin
> için "elde **çıktı**"dır; bir sonraki sütuna geçip `2+3+1` derken aynı 1 artık
> "elde **geldi**"dir. Aynı rakam, aynı kâğıt, iki cümle.

---

## Bir de Üçüncü Sözlük: sum / carry

Oyun bu seviyede çıkışlara `s1` ve `s0` diyor. O `s` boşuna değil: **sum** = toplam.

Yani şu ana kadar aynı iki tele üç ayrı isim gördün:

| NandGame | klasik isim | ne demek |
|---|---|---|
| `l` (low bit) | **sum** | o sütuna **yazdığın** rakam |
| `h` (high bit) | **carry** | sola **taşıdığın** rakam |

> ⚠️ Bu dört kelime (`h`, `l`, `sum`, `carry`) **iki** kavramdır, dört değil.
> Bir metinde "sum" görürsen kafanda `l` de; "carry" görürsen `h` de. Ders
> kitapları ikinci sütunu, oyun birinci sütunu kullanıyor — devre aynı devre.

---

## Yanlış Yol: Soldan Başlamak

Zinciri kurarken şu soru geliyor: hangi sütundan başlamalı? Denemesi bedava — kâğıtta
`17 + 25`'i **soldan** yapmayı dene:

```
   17          Sol sütun:  1 + 2 = 3    →  "3" yazdın
 + 25          Sağ sütun:  7 + 5 = 12   →  "2" yaz, 1 elde
 ────
                O elde nereye gidecek? SOL sütuna.
                Ama sol sütunu zaten yazdın.
                → geri dön, 3'ü sil, 4 yap.
```

Cevap `42`, senin yazdığın `32`'ydi ve düzeltmek için **geri dönmek** zorunda kaldın.

Sebebi tek cümle:

> 🔑 **Elde sadece sola gider. Hiçbir zaman sağa gitmez.** Yani bilgi tek yönlü
> akıyor. Bir sütunu doğru hesaplayabilmen için **sağındaki sütunun bitmiş olması**
> gerekiyor.

Soldan başlarsan, henüz var olmayan bir bilgiyi kullanmış oluyorsun. Devrede "geri
dönüp silmek" diye bir şey yok — o yüzden zincir baştan doğru yönde kurulmalı.

---

## Analiz Yönü ≠ Hesap Yönü

Burada çok kolay yapılan bir çıkarım hatası var, peşinen kapatalım:

> ⚠️ "Elde soldan sağa gitmiyor" demek, "**sen** soldan sağa düşünemezsin" demek
> **değildir.**

İki ayrı şeyden bahsediyoruz:

| | yön | serbest mi? |
|---|---|:-:|
| **Analiz yönü** — devreye *bakarken* | istediğin uçtan | ✅ serbest |
| **Hesap yönü** — devre *çalışırken* | sağdan sola | ⛔ zorunlu |

İstediğin sonucu alıp "buraya varmak için girişte ne olmalıydı?" diye geriye doğru
yürümek tamamen geçerli bir yöntemdir — tersine mühendisliğin tamamı budur ve bu
seride birçok tabloyu öyle çözdük.

Zorunlu olan, **elektrik** akarken sıranın elde tarafından belirlenmesi. Sen
belirlemiyorsun.

---

## Gidecek Yeri Olmayan Elde

Zincirin en solundaki kutuya geldin. O da bir `h` üretiyor. Peki nereye gidecek?

Solunda sütun yok.

```
     c    s1    s0        ← çıkışlar
    ×4    ×2    ×1        ← hane değerleri
```

> 🔑 **Gidecek yeri olmayan elde, sonucun en yüksek hanesi olur.**

Yani çıkıştaki `c` iki şeyi birden yapıyor: hem "son sütunun eldesi", hem "cevabın
4'ler hanesi". İki ayrı iş değil — elde, taşınacak yer bitince **rakama dönüşür.**

Seviyenin kendi örneğiyle: `2 + 2 + 1 = 5`

```
  c   s1   s0
  1    0    1
 ×4   ×2   ×1
 ───────────────
  4 +  0 +  1  =  5  ✓
```

İki basamaklık iki sayıyı topladın ve **üç** basamaklı bir cevap çıktı. Bu, 04.
dersteki jeton mantığının doğrudan sonucu: her yeni hane bir öncekinin iki katı,
ve toplam taşınca yeni hane açılıyor.

---

## 🎮 Şimdi Sen Kur

**Görev:** NandGame → **Multi-bit Adder** seviyesi.

Elinde artık `add` diye üç girişli bir kutu var — geçen ders kurduğun full adder,
oyun onu sana hazır parça olarak geri verdi (03.5, yine iş başında).

İki tane yerleştir. Sonra tek soruyu cevapla: **sağdaki kutunun `h`'si nereye gidecek?**

> ⚠️ Kutunun bacaklarında `A`, `B`, `c` yazıyor. Bunlar **o kutunun yerel bacak
> isimleri** — devrendeki `a1`, `b1` sinyalleriyle aynı harfi taşımaları tesadüf.
> Kutu sana "bana `a` diye bir sinyal getir" demiyor, "bana iki tel getir, ben
> içeride onlara `A` ve `B` diyeceğim" diyor. Hangi teli hangi bacağa taktığın
> serbest — toplayıcı iki girişine göre simetriktir (05. ders).

<details>
<summary>🔒 Çözüm şeması — önce kendin dene, sonra aç</summary>

1. **Sağ sütun:** `add₀` → girişleri `a0`, `b0` ve gelen elde `c`.
2. `add₀`'ın **`l`**'si → çıkış **`s0`**.
3. **Sol sütun:** `add₁` → girişleri `a1`, `b1` ve **`add₀`'ın `h`'si**. ← zincirin teli
4. `add₁`'in **`l`**'si → çıkış **`s1`**.
5. `add₁`'in **`h`**'si → çıkış **`c`**. (Gidecek yeri yok, rakam oldu.)

Üç numaralı adım dersin tamamı: bir kutunun carry-**out**'unu, komşusunun
carry-**in**'ine taktın.

</details>

---

## Kapanış: Zincirin Bedeli

Kurduğun şeye son bir kez bak ve şunu fark et: **sol sütun, sağ sütun bitmeden
hesaplanamıyor.** Girişlerinden biri doğrudan sağ sütunun çıkışı.

Bunu 2 bitte kurdun. 16 bitte 16 kutu olur ve en soldaki kutu, **altındaki on beşinin
hepsi bitmeden** doğru cevabı üretemez. Elde, zincir boyunca sırayla ilerler —
tıpkı bir domino sırası gibi.

Bu düzenin adı **ripple-carry adder** (dalgalanan-eldeli toplayıcı) ve bedeli var:
sayı ne kadar genişse, sonuç o kadar geç hazır olur. Gerçek işlemcilerde bu gecikme
doğrudan **saat hızını** sınırlar — o yüzden mühendisler eldeyi tahmin eden
(carry-lookahead) daha karmaşık devreler kurar.

Sen şu an en dürüst, en anlaşılır olanı kurdun. Hızlısını anlamak için önce bunu
kurman gerekiyordu.

Bir sonraki derste sayılar 16 bite çıkıyor — ve 16 tel çizmek yerine oyun sana yeni
bir gösterim öğretiyor. Ayrıca kurduğun toplayıcıya çok basit görünen bir iş
vereceğiz: **1 eklemek.** Basit görünen o iş, bilgisayar güvenliğindeki en verimli
zafiyet sınıflarından birinin kapısını açacak.

---

## Özet — Aklında Tut

```
☐ Sayının her basamağı için bir full adder. Zincir = kâğıttaki sütunlar.
☐ carry-out ile carry-in AYNI TELDİR; isim, hangi kutudan baktığına göre değişir.
☐ h/l ile sum/carry aynı iki telin iki sözlüğü. Dört kelime, iki kavram.
☐ Elde sadece SOLA gider → hesap sağdan sola olmak ZORUNDA.
☐ Soldan hesaplarsan geri dönüp yazdığını silmek zorunda kalırsın (17+25).
☐ Analiz yönü serbest (sondan başa bakabilirsin); HESAP yönü zorunlu.
☐ Gidecek yeri olmayan elde, sonucun en yüksek hanesi olur.
☐ Kutunun bacak isimleri YERELDİR; devrenin sinyalleriyle karıştırma.
☐ Ripple-carry: en üst basamak, altındaki hepsini bekler → gecikme = saat hızı sınırı.
```

---

## 🔗 İlgili Konular

- [06_full_adder.md](./06_full_adder.md) — Zincire dizilen kutunun kendisi
- [04_teller_sayi_olunca.md](./04_teller_sayi_olunca.md) — Hane değerleri, jeton mantığı
- [03.5_soyutlama_merdiveni.md](./03.5_soyutlama_merdiveni.md) — "Cevap, komşunun sinyalidir"

---

**Önceki konu:** [06_full_adder.md](./06_full_adder.md)
**Sonraki konu:** [08_increment.md](./08_increment.md) — Kimsenin bakmadığı tel

*Bu ders, "Şalterden Bilgisayara" serisinin bir parçasıdır. Seri, [nandgame.com](https://nandgame.com) eşliğinde ilerler.*
