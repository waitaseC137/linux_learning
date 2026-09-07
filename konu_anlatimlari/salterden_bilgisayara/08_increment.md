# 🔗 Şalterden Bilgisayara — Increment: Kimsenin Bakmadığı Tel

> Zinciri kurdun. Şimdi oyun sayıları 16 bite çıkarıyor ve sana gülünç derecede
> küçük bir görev veriyor: **1 ekle.** Bu kadar.
>
> Ama o küçük görevin içinde, bilgisayar güvenliğinin en verimli zafiyet
> sınıflarından birinin doğum anı saklı.

> Bu derste bilerek **hiçbir yere bağlamayacağın** bir tel olacak. Dersin bütün
> mesajı o boşta kalan telde.

---

## 📋 İçindekiler

- [16 Tel, Tek Çizgi](#16-tel-tek-çizgi)
- [Aynı Kutu, Geniş Hâli](#aynı-kutu-geniş-hâli)
- [+1'i Nereye Koyarsın?](#1i-nereye-koyarsın)
- [Yoktan 1 Üretmek](#yoktan-1-üretmek)
- [Taşma: 65535 + 1 = 0](#taşma-65535--1--0)
- [Kimsenin Bakmadığı Tel](#kimsenin-bakmadığı-tel)
- [🔒 Güvenlik Köprüsü](#-güvenlik-köprüsü)
- [🎮 Şimdi Sen Kur](#-şimdi-sen-kur)
- [Kapanış: Toplayıcıya Çıkarma Yaptırmak](#kapanış-toplayıcıya-çıkarma-yaptırmak)

---

## 16 Tel, Tek Çizgi

Oyunu açtığında paniğe kapılma sırası: her şey değişmiş gibi görünüyor. Değişen tek
şey **çizim.**

16 telin her birini ayrı çizsek şema okunmaz hale gelirdi. Onun yerine oyun 16 teli
tek bir çizgide topluyor ve üstüne küçük bir **`16`** yazıyor.

```
   ayrı ayrı (okunmaz)              demet (aynı şey)

   ──────────────                        16
   ──────────────                   ═══════════
   ──────────────  × 16
   ──────────────
```

Kalın kablo gibi düşün: içinde 16 tel var, hepsi senin bildiğin teller. **Kavramsal
olarak sıfır yenilik.**

> 💡 Bu tam olarak 03.5'teki soyutlama merdiveni. Bir kat yukarı çıkınca alt kattaki
> ayrıntı görünmez olur — ama yok olmaz. Kablo demeti, "tel"in bir üst katı.

---

## Aynı Kutu, Geniş Hâli

Toolbox'ta `add 16` diye bir kutu var. Yeni bir şey öğrenmene gerek yok, çünkü o
kutu **senin geçen ders kurduğun devre:**

| 2 bitlik (07. ders) | `add 16` | ne |
|---|---|---|
| `a1 a0` | `A` | birinci sayı |
| `b1 b0` | `B` | ikinci sayı |
| `c` (altta) | `c` (altta) | **carry in** |
| `s1 s0` | `S` | **toplam** |
| `c` (üstte) | `c` (üstte) | **carry out** |

> ⚠️ Aynı kutunun **altında ve üstünde** birer `c` var ve bunlar zıt şeyler:
> alttaki **giren**, üstteki **çıkan** elde. 07. dersteki "aynı telin iki adı"
> meselesi burada tek bileşenin üstünde gözle görülüyor.

Oyun senin kurduğun zinciri alıp 16 basamağa uzattı ve tek bir kutuya sığdırdı.
Kurduğun şeyi geri veriyor — merdivenin bir üst basamağı.

---

## +1'i Nereye Koyarsın?

Elindeki alet şunu hesaplıyor:

```
S = A + B + c
```

Senin istediğin ise:

```
S = giriş + 1
```

`A`'ya girişi bağlarsın, orası açık. Peki `1` nereden girecek? İki aday var:

| aday | maliyeti | ne gerekir |
|---|---|---|
| `B` | **16 tel** | `0000000000000001` deseni üretmek |
| `c` | **1 tel** | tek bir `1` |

İkisi de matematiksel olarak doğru sonucu verir. Ama biri 16 telle uğraşmayı, diğeri
tek telle işi bitirmeyi gerektiriyor.

> 🔑 **Elde girişi, bir devreye "1" sokmanın en ucuz yeridir.** Zaten oradadır,
> zaten tek bittir, zaten toplama işlemine dahildir. Donanım tasarımında bu tür
> "bedava kapı"ları görmek, iyi devre ile şişkin devre arasındaki farktır.

`c`'ye 1 verirsen `B` 0 olmalı — çünkü `giriş + 0 + 1 = giriş + 1`.

---

## Yoktan 1 Üretmek

Küçük bir problem: toolbox'ta `0` diye bir sabit var ama **`1` diye bir sabit yok.**

Girişi olmayan, çıkışı hep 0 olan bir kutu duruyor elinde. Bir de `inv`.

> 🔑 `inv(0) = 1`. Sabit sıfırı ters çevirerek sabit bir yapıyorsun.

Yoktan var etmedin — elindeki tek sabiti çevirdin. Bu küçük numara, ihtiyacın olan
her sabit deseni `0` ve `inv` ile kurabileceğin anlamına gelir.

---

## Taşma: 65535 + 1 = 0

16 bitin tutabildiği en büyük sayı:

```
   1111111111111111  =  65535
```

Buna 1 eklersen 65536 olur. Ve 65536, ikilikte **17 hane** ister:

```
   1111111111111111        (65535)
 + 0000000000000001        (1)
 ──────────────────────
  10000000000000000        ← 17 bit
  ↑
  bu bit sığmıyor

   0000000000000000  =  0
```

**Sonuç 0.** Sayı başa sardı.

> 🎮 Oyunda dene: giriş kutusuna decimal `65535` yaz. Çıkışın `0`'a düştüğünü,
> üstteki `c`'nin `1` olduğunu göreceksin.

Bu, arabaların kilometre sayacının 999999'dan 000000'a dönmesiyle **birebir aynı
olay.** Hane bitti, sayaç başa döndü.

---

## Kimsenin Bakmadığı Tel

Seviye sana açıkça şunu söylüyor: *"Ignore the carry if the result is larger than
16 bits."* Sen de `add 16`'nın üstteki `c` bacağını hiçbir yere bağlamıyorsun.

Şimdi dikkatli düşün: **o elde hesaplandı mı?**

Evet. Devre onu üretti, bacakta duruyor, değeri 1. Sadece sen bağlamadın.

> 🔑 **Bilgi kaybolmuyor — kimse bakmıyor.**

Gerçek işlemcide de tam olarak böyle olur. Toplama yapılır, taşma bir bayrağa
yazılır — adı **carry flag (CF)** — ve orada bekler. Program o bayrağa bakmazsa
(x86'da `jc` / `jnc` komutlarıyla) taşma **hiç olmamış** sayılır.

Donanım sana söylüyor. Yazılım dinlemiyor.

---

## 🔒 Güvenlik Köprüsü

Şimdi bu telin neden önemli olduğuna gelelim.

Önce bir ayrım, çünkü sık karıştırılır:

| | ne demek |
|---|---|
| **integer overflow** | sayı bitlere sığmayıp başa sarıyor (senin kurduğun şey) |
| **buffer overflow** | ayrılan bellek alanının dışına yazmak |

**Bunlar aynı şey değil.** Ama biri diğerini doğuruyor ve klasik yolu tam olarak bu
derste kurduğun `+1` devresinden geçiyor:

```c
n   = 65535;
buf = malloc(n + 1);        // n+1 SARIYOR → malloc(0), sıfır bayt ayrıldı
for (i = 0; i <= n; i++)
    buf[i] = ...;           // 65536 kez yazıyor → buffer overflow
```

> ⚠️ Buradaki incelik şu: **sınır kontrolü yok değil, VAR.** Programcı `n + 1`
> kadar yer ayırdı, doğru düşündü. Ama *kontrolün kendisi* taştığı için küçük bir
> sayı görüp geçti. Taşma, kontrolü **devirdi.**

Bu zincirin resmî adı var: **CWE-190** (integer overflow) → **CWE-787**
(out-of-bounds write). Yıllardır en verimli zafiyet sınıflarından biri.

Ve kökü, senin bilerek boşta bıraktığın o tek telde:

> 🔑 **Zafiyet sarmada değil, sarmayı görmezden gelmede.**

---

## 🎮 Şimdi Sen Kur

**Görev:** NandGame → **Increment** seviyesi.

Elindekiler: `add 16`, `inv`, sabit `0`, `nand`, `xor`.

Üç soruyu sırayla cevapla: girişi hangi bacağa? `1` nereye ve nereden? Elde çıkışı
nereye?

<details>
<summary>🔒 Çözüm şeması — önce kendin dene, sonra aç</summary>

1. `add 16`'nın **`A`** bacağına 16-bitlik girişi bağla.
2. **`B`** bacağı 0 kalmalı. (Bağlamazsan NandGame onu zaten 0 okur — ama bunu
   bilerek yap, tesadüf sanma.)
3. Sabit **`0`** → **`inv`** → çıkan **`1`**'i `add 16`'nın alttaki **`c`** bacağına.
4. **`S`** → çıkışa.
5. Üstteki **`c`** → **hiçbir yere.** Bu, dersin kendisi.

</details>

---

## Kapanış: Toplayıcıya Çıkarma Yaptırmak

Bir sonraki seviye sana `A − B` isteyecek. Toolbox'a bakacaksın ve şunu göreceksin:

**"subtract 16" diye bir kutu yok.**

Elinde sadece toplayan bir alet var. Peki çıkarmayı nasıl yapacaksın?

İşte bu sorunun cevabı, bilgisayarların eksi sayıları nasıl tuttuğunu — ve neden
`1111111111111111` deseninin bazen 65535, bazen −1 anlamına geldiğini açıklıyor.

Bu derste bir tel bilerek boşta kaldı. Ama önce kısa bir ara vereceğiz: o telin
üstünde duran matematiği ve neden yıllardır bir güvenlik açığı sınıfını beslediğini
konuşacağız. Ardından aynı sarma davranışı, **eksi sayıların kendisini** üretecek.

---

## Özet — Aklında Tut

```
☐ 16'lık demet yeni bir kavram değil — 16 telin tek çizgiyle çizilmesi.
☐ add 16 = senin kurduğun zincirin 16 basamaklı hâli. Aynı bacaklar, geniş hâli.
☐ Aynı kutuda iki c var: ALTTAKİ giren, ÜSTTEKİ çıkan elde.
☐ Bir devreye "1" sokmanın en ucuz yeri carry-in bacağıdır (16 tel yerine 1 tel).
☐ Sabit 1 yoktur ama inv(0) = 1. Sıfır + inv ile her sabiti kurabilirsin.
☐ 65535 + 1 = 0. 17. bit sığmaz, sayaç başa sarar.
☐ Elde HESAPLANIR ve bacakta durur. Kaybolmaz — kimse bakmaz. (CPU'da: carry flag)
☐ integer overflow ≠ buffer overflow, ama birincisi ikincisini doğurur (CWE-190→787).
☐ Sınır kontrolü var olabilir; taşan şey kontrolün KENDİSİ olduğunda kontrol devrilir.
☐ Zafiyet sarmada değil, sarmayı görmezden gelmede.
```

---

## 🔗 İlgili Konular

- [07_multibit_adder.md](./07_multibit_adder.md) — `add 16`'nın içindeki zincir
- [03.5_soyutlama_merdiveni.md](./03.5_soyutlama_merdiveni.md) — Demet = telin üst katı
- [04_teller_sayi_olunca.md](./04_teller_sayi_olunca.md) — Hane bitince ne olur

---

**Önceki konu:** [07_multibit_adder.md](./07_multibit_adder.md)
**Sonraki konu:** [08.5_sayac_basa_donunce.md](./08.5_sayac_basa_donunce.md) — Ara ders: sarma ve CWE-190

*Bu ders, "Şalterden Bilgisayara" serisinin bir parçasıdır. Seri, [nandgame.com](https://nandgame.com) eşliğinde ilerler.*
