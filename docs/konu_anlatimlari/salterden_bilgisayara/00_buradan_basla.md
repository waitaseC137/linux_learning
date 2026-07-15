# 🧭 Şalterden Bilgisayara — Buradan Başla (Gerçekten Sıfırdan)

> Cebindeki telefonun içinde milyarlarca transistör var. Bu sayı korkutucu görünür —
> ta ki şu sırrı öğrenene kadar: **hepsi aynı basit parçanın tekrarıdır.**
> Bu seri sana bilgisayarı anlatmayacak; **kurduracak.** Açılıp kapanan tek bir şalterden
> başlayacağız ve kapı kapı, kat kat, çalışan bir bilgisayara kadar her parçayı
> kendi ellerinle inşa edeceksin.

> **Bu seri kimin için?** Herkes için. Elektronik bilmen gerekmiyor, kod yazmış olman
> gerekmiyor, lise fiziğini hatırlaman bile gerekmiyor. Tek ön koşul şu cümleyi kabul
> etmek: *"elektrik telden akar, düğme onu açıp keser."* Gerisini birlikte kuracağız.

---

## 📋 İçindekiler

- [Bu Seri Ne DEĞİLDİR](#bu-seri-ne-değildir)
- [Önce Korkuyu Kıralım](#önce-korkuyu-kıralım)
- [Tek Araç: NandGame](#tek-araç-nandgame)
- [Sonunda Ne Yapabileceksin?](#sonunda-ne-yapabileceksin)
- [Büyük Resim: Neden Şalterden Başlıyoruz?](#büyük-resim-neden-şalterden-başlıyoruz)
- [Yol Haritası — Ders Ders](#yol-haritası--ders-ders)
- [Nasıl Çalışmalısın?](#nasıl-çalışmalısın)
- [Kardeş Seri: x86 Assembly](#kardeş-seri-x86-assembly)

---

## Bu Seri Ne DEĞİLDİR

- **Elektronik kursu değil.** Voltaj hesabı, direnç, formül — yok. Bize elektriğin tek
  huyu lazım: ya akar, ya akmaz.
- **Ezber kursu değil.** Hiçbir kapının tablosunu ezberletmeyeceğim. Her parçayı, ona
  *ihtiyaç duyduğun an*, "bu olmadan şu iş yapılamıyor" diye tanıyacaksın.
- **Seyirlik değil.** Her parçayı **sen kuracaksın.** Okuyup geçilen devre unutulur;
  elinle kurduğun devre senindir.
- **Hızlı değil.** Her ders bir öncekinin üstüne oturur. Atladığın taş, üç ders sonra
  ayağına takılır.

---

## Önce Korkuyu Kıralım

"İşlemci nasıl çalışır?" sorusunun cevabı, çoğu yerde ya iki cümlelik geçiştirmedir
("çok karmaşık, milyarlarca transistör...") ya da üniversite ders kitabıdır. İkisi de
aynı mesajı verir: *burası sana göre değil.*

Sana bir sır: **bilgisayarın en dibinde zor hiçbir şey yoktur.** En dipte, açılıp
kapanan şalterler vardır — evindeki lamba düğmesinden farksız. Zorluk tek tek
parçalarda değil, parça *sayısındadır.* Ve sayı, bir kere kurma yöntemini öğrenince
korkutucu olmaktan çıkar: aynı tuğlayı tekrar tekrar koymak, tek tuğlayı anlamaktan
daha zor değildir.

> 💡 Takılmak, "beynim yandı" hissi, aynı yere iki kez bakmak — hepsi normaldir ve
> herkes o kapıdan geçer. Bu seride yavaşlamak zaaf değil, yöntemdir.

---

## Tek Araç: NandGame

Bütün seri boyunca tek bir araç kullanacağız: **[nandgame.com](https://nandgame.com)**

- **Bedava.** Kayıt yok, kurulum yok, reklam yok. Tarayıcıda açılır, oynanır.
- **Oyun gibi ama gerçek:** her seviye sana bir görev verir ("şu tabloyu sağlayan
  devreyi kur"), sen soldaki kutulardan parçaları sürükleyip tellerle bağlarsın,
  **Check solution** dersin. Oyun bütün kombinasyonları senin yerine dener; hepsi
  geçerse seviye biter.
- **Sırası bu serinin sırasıyla aynı:** oyunun seviyeleri, gerçek bir bilgisayarın
  kuruluş katmanlarını izler. Her dersin sonunda "şimdi sen kur" bölümü, seni oyunun
  tam o seviyesine gönderir.

> 🔑 İş bölümü baştan net olsun: **ders sana kavramı verir, seviyeyi sen çözersin.**
> Her dersin sonunda çözümün mantığı da vardır — ama katlanmış (tıklayınca açılan)
> kutuların içinde, "önce kendin dene" uyarısıyla. O kutuyu erken açmak sana kalmış;
> ama bil ki bu serinin bütün keyfi, "kendim buldum" anlarındadır.

---

## Sonunda Ne Yapabileceksin?

Serinin bugüne kadar yazılmış bölümünü (Ünite 0 + 1) bitirdiğinde:

- "1 ve 0" lafının **fiziksel olarak** ne olduğunu bileceksin — mecaz değil, tel ve akım olarak.
- Tek çeşit parçadan (NAND) bütün mantık kapılarını **kendin türetmiş** olacaksın.
- Bilgisayarın nasıl **saydığını** ve nasıl **topladığını**, toplayan devreyi bizzat
  kurduğun için anlatabileceksin.
- "Milyarlarca transistör" lafı seni korkutmayacak — çünkü katların nasıl üst üste
  bindiğini görmüş olacaksın.

Seri, oyun ilerledikçe büyüyecek: sırada çok haneli toplama, çıkarma, hesap çekirdeği
(ALU), hafıza ve en sonunda **komut işleyen gerçek bir işlemci** var. Hepsi aynı
tuğlalardan.

---

## Büyük Resim: Neden Şalterden Başlıyoruz?

Bir bilgisayar, katlardan oluşur. Her kat, bir alttaki kattan yapılır — ve her kat
kurulduğu anda, altındakini **unutmana izin verir:**

```
   İŞLEMCİ            "komutları işleyen makine"
      ▲  bunlardan kurulur
   BELLEK + ALU       "hatırlayan ve hesaplayan parçalar"
      ▲  bunlardan kurulur
   TOPLAYICILAR       "sayı toplayan devreler"
      ▲  bunlardan kurulur
   KAPILAR            "VE, VEYA, DEĞİL... karar veren parçacıklar"
      ▲  bunlardan kurulur
   ŞALTER / RÖLE      "akımı açıp kapatan tek hareket"
```

Yukarıdan başlayan anlatımlar hep aynı yerde tıkanır: temeli olmayan kat, ezbere
dönüşür. Biz tersini yapacağız — **en dipten** başlayıp her katı kendimiz dökeceğiz.
Böylece hiçbir noktada "bunu böyle kabul et" demek zorunda kalmayacağım.

> 💡 Bu serinin adındaki iddia gerçektir: modern çipin içindeki transistör, birazdan
> tanışacağın rölenin milyarlarca kez küçültülmüş torunudur. Aradaki fark boyut ve
> hızdır; **fikir aynıdır.** Şalteri anlayan, transistörü anlamıştır.

---

## Yol Haritası — Ders Ders

Dosyaları bu sırayla oku. Her ders bir öncekine yaslanır.

### 🧱 Ünite 0 — Tuğlalar: Şalterden Kapılara

| # | Dosya | Ne öğretir | NandGame seviyesi |
|:---:|---|---|---|
| 1 | [01_akim_salter_role](./01_akim_salter_role.md) | 1 ve 0 gerçekte nedir; röle; ilk kapı | Nand |
| 2 | [02_nanddan_kapilar](./02_nanddan_kapilar.md) | Tek tuğladan bütün kapılar: NOT, AND, OR | Invert, And, Or |
| 3 | [03_xor_iki_fedai](./03_xor_iki_fedai.md) | Farklılık dedektörü XOR — iki fedai hikâyesi | Xor |
| 3.5 | [03.5_soyutlama_merdiveni](./03.5_soyutlama_merdiveni.md) | *(ara ders)* Katları kutulamak — bilgisayarın kuruluş sırrı | — |

### ➕ Ünite 1 — Saymak ve Toplamak

| # | Dosya | Ne öğretir | NandGame seviyesi |
|:---:|---|---|---|
| 4 | [04_teller_sayi_olunca](./04_teller_sayi_olunca.md) | Tellere sayı anlamı yüklemek; ikilik sayma | — *(kavram dersi)* |
| 5 | [05_half_adder](./05_half_adder.md) | İlk toplayıcı: 1 + 1 = 10 | Half Adder |
| 6 | [06_full_adder](./06_full_adder.md) | Elde zinciri: sınırsız büyüklükte toplamanın tuğlası | Full Adder |

### 🔜 Yolda (oyun ilerledikçe yazılacak)

Çok haneli toplayıcı (Multi-bit Adder) → çıkarma ve eksi sayılar → veri yönlendirme
(Switching) → hesap çekirdeği (ALU) → hafıza (latch, register, RAM) → **işlemci.**

> 💡 Numarası `.5` ile biten dosyalar kısa birer **ara ders**tir: ana yolun kıyısında,
> daha hafif. Ama 03.5'i atlama — serinin en önemli fikri orada.

---

## Nasıl Çalışmalısın?

1. **Sırayı bozma.** Oyun seviyeleri de dersler de birbirinin üstüne biner.
2. **Her seviyeyi kendin çöz.** Çözüm kutusunu açmadan önce en az bir kez gerçekten
   dene. Takılmak işin parçası; çözümü *görmek* ile *bulmak* arasındaki fark, bu
   serinin sana katacağı her şeydir.
3. **"Bitti"ye kendin karar ver — ama dürüstçe.** Bir konu, oyunda seviyeyi geçince
   değil, **başkasına anlatabildiğinde** bitmiştir. Kendi kendine yüksek sesle anlat;
   takıldığın cümle, geri döneceğin yerdir.
4. **Ekran görüntüsü arşivi tut.** Her çözdüğün seviyenin görüntüsünü bir klasöre at.
   Hem ilerlemeni görürsün hem de "ben bunu kurmuştum" demenin somut kanıtı olur.
5. **Yavaş = hızlı.** Aceleyle geçilen kapı, üç seviye sonra seni durdurur.

---

## Kardeş Seri: x86 Assembly

Bu serinin bir kardeşi var: **x86 Assembly** kursu. İkisi aynı makineye iki uçtan bakar:

- **Bu seri** işçiyi (işlemciyi) **parçalardan kurar** — "bu makine neyden yapılmış?"
- **x86 serisi** o işçiye **emir vermeyi** öğretir — "bu makineye nasıl iş yaptırılır?"

Birbirinden bağımsız okunabilirler; ama ikisini birden götürürsen, bir gün iki yol
birleşir: orada, `add` diye yazdığın emrin, burada kendi elinle kurduğun toplayıcıya
gittiğini göreceksin. O an, bu iki serinin var olma sebebidir.

---

## 🔗 Sonraki Adım

- [01_akim_salter_role.md](./01_akim_salter_role.md) — buradan devam et. Elektriğin
  tek huyunu öğrenip ilk kapımızı kuracağız.

---

*Bu ders, "Şalterden Bilgisayara" serisinin bir parçasıdır. Seri, [nandgame.com](https://nandgame.com) eşliğinde ilerler.*
