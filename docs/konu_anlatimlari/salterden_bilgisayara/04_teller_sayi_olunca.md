# 🔢 Şalterden Bilgisayara — Teller Sayı Olunca

> Şu ana kadar teller senin için "var/yok" taşıdı: akım, karar, fedai onayı. Bu
> derste tellere yepyeni bir anlam biçeceğiz: **sayı.** Bu, serinin en büyük zihinsel
> sıçramasıdır — ve devre içermeyen tek kavram dersidir. Burayı sağlam döşersen,
> toplayıcı dersleri su gibi akar.

> **Bu derste devre yok, oyun yok.** Sadece bir fikir var. Ama Ünite 1'in tamamı bu
> fikrin üstünde duruyor: acele etme, gerekirse iki kez oku.

---

## 📋 İçindekiler

- [Bir Telin Sınırı](#bir-telin-sınırı)
- [Çare: Tel Eklemek ve Değer Biçmek](#çare-tel-eklemek-ve-değer-biçmek)
- [Jeton Sistemi](#jeton-sistemi)
- [Bu Zaten Bildiğin Bir Numara](#bu-zaten-bildiğin-bir-numara)
- [İkilik Saymak](#ikilik-saymak)
- [Okuma Formülü](#okuma-formülü)

---

## Bir Telin Sınırı

01. dersteki temel gerçeği hatırla: **tel anlam bilmez.** Telde ya akım vardır ya
yoktur. Biz o iki duruma "1" ve "0" adını verdik — bu bizim biçtiğimiz ilk anlamdı.

Şimdi yeni bir ihtiyaç doğuyor: birazdan devrelerimiz **sayı sayacak** ("kaç tane?"
sorusuna cevap verecek). Ama tek telin söyleyebileceği en büyük şey "1". Telde
"2 birim akım" diye bir şey yok — akım ya var ya yok. Peki 2'yi, 3'ü, 500'ü bir
devre nasıl söyler?

> 🔑 Cevap telin içinde değil, **tel sayısında:** daha büyük sayılar için tel
> eklersin — ve her tele **farklı bir değer biçersin.** Sayı, tek bir telde değil,
> bir tel **grubunun** okunuşunda yaşar.

---

## Çare: Tel Eklemek ve Değer Biçmek

İki tel al. Soldakine "**2'lik tel**", sağdakine "**1'lik tel**" de. Kuralımız:

> Grubun söylediği sayı = **yanan tellerin değerlerinin toplamı.**

İki telle dört farklı durum kurulabilir — ve dördü dört ayrı sayı söyler:

| 2'lik tel | 1'lik tel | Söylenen sayı |
|:---:|:---:|:---:|
| 0 | 0 | 0 + 0 = **0** |
| 0 | 1 | 0 + 1 = **1** |
| 1 | 0 | 2 + 0 = **2** |
| 1 | 1 | 2 + 1 = **3** |

İşte bu kadar. "İkilik sayı sistemi" diye ürkütücü kitap başlıklarında gezen şeyin
tamamı bu tablodur: **tellere değer biç, yananları topla.**

---

## Jeton Sistemi

Aynı fikri elle tutulur yapmak için jetonla düşün. Elinde iki çeşit jeton var:
**2'lik** ve **1'lik.** Herhangi bir miktarı "hangi jetonları verdiğinle" söylersin:

```
   0 öde  →  jeton yok           →  teller: 0 0
   1 öde  →  bir 1'lik           →  teller: 0 1
   2 öde  →  bir 2'lik           →  teller: 1 0
   3 öde  →  bir 2'lik + 1'lik   →  teller: 1 1
```

> 💡 Dikkat: her çeşit jetondan **en fazla bir tane** kullanabilirsin — çünkü tel
> dediğin şey ya yanar ya yanmaz; "iki kere yanmak" yok. "2 öde" derken iki tane
> 1'lik verme şansın olmadığından, 2'lik jeton **mecburidir.** Değerlerin 1, 2 (ve
> birazdan 4, 8...) diye gitmesinin sebebi bu mecburiyettir: her miktar, her jetondan
> en fazla birer tane kullanılarak **tek bir şekilde** ödenebilsin.

---

## Bu Zaten Bildiğin Bir Numara

"Basamaklara değer biçmek" sana yeni gelmesin — **okuldan beri yapıyorsun.** Onluk
sistemde "347" yazdığında aslında şunu diyorsun:

```
   3       4       7
   ↓       ↓       ↓
 100'lük  10'luk  1'lik   →   3×100 + 4×10 + 7×1 = 347
```

Onluk sistemde basamak değerleri 1, 10, 100, 1000... diye gider (her biri öncekinin
**10 katı**, çünkü her basamağa 0–9 arası **on** farklı rakam yazabilirsin).

Bizim tellerimizde ise bir basamağa yazılabilecek sadece **iki** şey var: 0 ve 1.
O yüzden basamak değerleri 1, 2, 4, 8... diye gider — her biri öncekinin **2 katı.**

> 🔑 Yani "ikilik sistem" ayrı bir matematik değildir; **aynı basamak fikrinin, iki
> rakamlı hali.** Onlukta "10" nasıl "bir onluk, sıfır birlik" ise, ikilikte `10`
> "bir 2'lik, sıfır 1'lik" demektir — yani **2.** Korkulacak hiçbir şey olmadığını
> gördün mü?

---

## İkilik Saymak

Üç telle (4'lük, 2'lik, 1'lik) 0'dan 7'ye kadar sayalım — yüksek sesle, jeton diliyle:

| Sayı | 4'lük | 2'lik | 1'lik | Jeton diliyle |
|:---:|:---:|:---:|:---:|---|
| 0 | 0 | 0 | 0 | hiç jeton yok |
| 1 | 0 | 0 | 1 | 1'lik |
| 2 | 0 | 1 | 0 | 2'lik |
| 3 | 0 | 1 | 1 | 2'lik + 1'lik |
| 4 | 1 | 0 | 0 | 4'lük |
| 5 | 1 | 0 | 1 | 4'lük + 1'lik |
| 6 | 1 | 1 | 0 | 4'lük + 2'lik |
| 7 | 1 | 1 | 1 | hepsi |

Tabloda bir düzen gör: **1'lik sütun** 0-1-0-1 diye tik tak atıyor; **2'lik sütun**
ikişer ikişer; **4'lük** dörder dörder. Kilometre sayacının basamakları gibi — sağdaki
dolunca soldaki bir artar. Aynı mantık, sadece "dolmak" 9'da değil 1'de oluyor.

---

## Okuma Formülü

Her şeyi tek satıra sıkıştıralım. Üç telin adı soldan sağa `x h l` olsun
(4'lük, 2'lik, 1'lik):

> **söylenen sayı = 4·x + 2·h + 1·l**

Bu formül, önümüzdeki iki dersin anahtarıdır. Devrelerimiz sana `h l` diye iki tel
uzattığında paniklemeyeceksin; "2·h + l" diye okuyup geçeceksin.

> 💡 **Aklınıza takılabilir:** *"Peki bilgisayar neden onluk kullanmıyor? İnsanlar
> onlukla sayıyor sonuçta."* Çünkü telin doğasında iki durum var: akım var/yok.
> Onluk isteseydik, her telde on farklı akım seviyesini güvenilir biçimde ayırt
> etmemiz gerekirdi — gürültülü gerçek dünyada bu kırılgan ve pahalı. "Var/yok" ise
> kaya gibidir. Donanım ikiliği seçmedi; **ikilik, telin doğasından çıktı.**

---

## Özet — Aklında Tut

```
☐ Tek tel en fazla "1" söyler. Daha büyük sayı = TEL EKLE + her tele DEĞER BİÇ.
☐ Sayı = yanan tellerin değerleri toplamı. (Jeton benzetmesi: hangi jetonları verdin?)
☐ Her jetondan en fazla BİR tane → değerler mecburen 1, 2, 4, 8... (ikinin katları).
☐ İkilik sistem = okuldaki basamak fikri, iki rakamla. `10` (ikilik) = "bir 2'lik" = 2.
☐ Okuma formülü: sayı = 4x + 2h + 1l. İki dersin anahtarı bu satır.
☐ Bilgisayar ikiliği seçmedi; ikilik, telin var/yok doğasından çıktı.
```

---

## 🔗 İlgili Konular

- [01_akim_salter_role.md](./01_akim_salter_role.md) — "Tel anlam bilmez" ilkesinin doğduğu yer
- [05_half_adder.md](./05_half_adder.md) — Bu dersin meyvesi: sayıları TOPLAYAN devre

---

**Önceki konu:** [03.5_soyutlama_merdiveni.md](./03.5_soyutlama_merdiveni.md)
**Sonraki konu:** [05_half_adder.md](./05_half_adder.md)

*Bu ders, "Şalterden Bilgisayara" serisinin bir parçasıdır. Seri, [nandgame.com](https://nandgame.com) eşliğinde ilerler.*
