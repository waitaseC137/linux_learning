# 🗄️ x86 Assembly — Bellek ve Register'lar

> 01'de uzaktan bir resim çizdik: kocaman bir depo, işçinin birkaç cebi, bir de çok hızlı ama çok aptal işçi.
> Şimdi o resme yaklaşıyoruz. Depodaki kutular tam olarak ne kadar büyük, içlerine ne sığar; işçinin
> cepleri depodakilerden nasıl farklı; ve işçi gün boyu bu ikisi arasında nasıl bir mekik dokur?
> Ünite 0'ı kapatan ders bu — bittiğinde kafandaki resim, üstüne ilk gerçek kodu koyabileceğin kadar net olacak.

> **Bu derste hâlâ tek satır kod yok.** Sadece 01'in resmini netleştiriyoruz: belleğe ve register'lara
> yakından bakıp aralarındaki ilişkiyi kuruyoruz. Komutları ve gerçek söz dizimini bir sonraki ünitede,
> ilk programı yazıp çalıştırırken göreceğiz. Acele yok; bu zemin sağlam olursa gerisi kendiliğinden oturur.

---

## 📋 İçindekiler

- [Belleğe Yakından Bakış](#belle%C4%9Fe-yak%C4%B1ndan-bak%C4%B1%C5%9F)
- [Adres mi, Değer mi — Bir Kez Daha](#adres-mi-de%C4%9Fer-mi--bir-kez-daha)
- [Register'lara Yakından Bakış](#registerlara-yak%C4%B1ndan-bak%C4%B1%C5%9F)
- [İşçinin Asıl Dansı: Depo ile Cep Arasında](#i%CC%87%C5%9F%C3%A7inin-as%C4%B1l-dans%C4%B1-depo-ile-cep-aras%C4%B1nda)
- [Program da Bu Kutularda Durur](#program-da-bu-kutularda-durur)
- [İşçinin Parmağı da Bir Register'dır](#i%CC%87%C5%9F%C3%A7inin-parma%C4%9F%C4%B1-da-bir-registerd%C4%B1r)

---

## Belleğe Yakından Bakış

01'de belleği "numaralı kutular deposu" diye tanımıştık: her kutunun bir numarası var, içinde de bir sayı duruyor. O zaman "kutuya 0–255 arası bir sayı sığar, neden 255 olduğunu sonra göreceğiz" demiştik. 03'ten sonra artık o boşluğu doldurabiliriz.

Her kutu tam olarak bir **byte**'tır — yani yan yana 8 anahtar (8 bit). Bir byte'ın tutabileceği en küçük sayı 0 (hepsi kapalı), en büyüğü 255 (hepsi açık). İşte belleğin o sıra sıra kutuları, her biri birer byte:

```
 Adres:    0      1      2      3      4      5     ...
          ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
 İçerik:  │ 72 │ │ 13 │ │  0 │ │255 │ │ 42 │ │  7 │ ...
          └────┘ └────┘ └────┘ └────┘ └────┘ └────┘
           her kutu = 1 byte = 8 anahtar = 0..255 arası bir sayı
```

Kutuların numaraları — yani **adresleri** — 0, 1, 2, 3… diye, hiç boşluk bırakmadan, **ardışık** gider. Ve 03'te öğrendiğin gibi, bu adresler düşük seviyede genellikle hex yazılır: `0x080484b6` gibi korkutucu görünen bir şey, aslında sadece bir **kutu numarasıdır.** Uzun, ama tek bir sayı.

Peki o klasik soru: ya 255'ten büyük bir sayı tutmak istersek? 03'te bunu da askıya almıştık — "makine birden fazla byte'ı yan yana kullanır" demiştik. İşte oluş şekli bu:

```
 "1.000.000" gibi büyük bir sayı tek kutuya SIĞMAZ (kutu en fazla 255 tutar).
 Makine onu ARDIŞIK birkaç kutuya yayar:

 Adres:    100    101    102    103
          ┌────┐ ┌────┐ ┌────┐ ┌────┐
          │ .. │ │ .. │ │ .. │ │ .. │   ← 4 kutu BİRLİKTE = tek bir büyük sayı
          └────┘ └────┘ └────┘ └────┘
```

Yani büyük bir değer, "yan yana duran birkaç kutu, birlikte okunduğunda" demektir. Tek kutu küçük; ama kutular ucuz ve sıralı, istediğin kadarını birleştirebilirsin.

> 🔑 İki cümlede bellek: (1) her kutu tam 1 byte'tır, içine 0–255 sığar; (2) daha büyük bir sayı, ardışık birkaç kutunun birlikte tutulmasıdır. Kutunun **numarası = adres** (çoğu zaman hex yazılır), kutunun **içi = değer**.

> 💡 İleri-not: "Birkaç kutuyu birlikte" dedik ama bu byte'ların belleğe hangi *sırayla* dizildiğinin kendine has (ve ilk gördüğünde tuhaf gelen) bir kuralı var. Onu, GDB ile belleğe gerçekten baktığımızda göreceğiz ([07_gdb_tek_adim](./07_gdb_tek_adim.md), [08_mov_ve_bellek](./08_mov_ve_bellek.md)). Şimdilik "büyük sayı = birkaç kutu" demen yeter — sırası dert değil.

> 💡 **Aklınıza takılabilir:** *"O aptal işçi, yan yana 4 kutunun tek bir büyük sayı mı yoksa 4 ayrı küçük sayı mı olduğunu nereden biliyor? Ya ben oraya 4 bağımsız küçük değer koyduysam?"* Bilmiyor — kutuların üstünde "biz bir aradayız" diye bir etiket yok. Gruplamayı tamamen **komut** belirler: "kutu 100'den 1 byte oku" derse tek küçük sayı, "4 byte oku" derse dördü birden tek büyük sayı olur. Yani veriyi nasıl yazdıysan öyle okumak **senin** sorumluluğun; yanlış boyda okursan saçma bir sayı çıkar ve makine seni durdurmaz. (Bu tam da [01.5_sayi_ve_anlam](./01.5_sayi_ve_anlam.md)'daki "anlamı komut verir" kuralı.)

---

## Adres mi, Değer mi — Bir Kez Daha

01'de "ileride en sık takılınan nokta" dediğimiz ayrım buydu; o kadar önemli ki bir kez daha, taze bir örnekle pekiştirelim. Belleğin 5 numaralı kutusuna bakalım ve diyelim içinde 12 yazıyor:

```
        5 numaralı kutu
          ┌──────┐
 Adres 5 →│  12  │← Değer 12
          └──────┘
   "kutunun YERİ"  = 5        "kutunun İÇİ" = 12        (apayrı iki sayı)
```

Adres 5, değer 12. Birbirine hiç benzemeyen iki sayı, iki ayrı rol. Şunu bir saniye düşün: biri işçiye "12 numaralı kutuyu getir" derse, işçi içinden 12 çıkan **5. kutuyu** mu getirir? Hayır — bambaşka bir kutuya, **12. kutuya** gider. Çünkü "12" burada bir adres olarak söylendi, bir değer olarak değil.

Şimdi tuhaf ama güçlü bir fikir: bir kutunun **içindeki** sayı, pekâlâ başka bir kutunun **numarası** olabilir. 5. kutuda 12 yazıyorsa, bunu "5. kutu bana 12'yi *gösteriyor*" diye de okuyabilirsin — sanki bir kutu, başka bir kutuyu işaret ediyor.

> 🔑 Aynı sayı, bir yerde **değer**, başka bir yerde **adres** rolü oynayabilir. Onu hangi rolde okuyacağını **işçiye verdiğin emir** belirler — kutunun kendisi bilmez, umursamaz. 01'deki "harfiyen itaatkâr işçi" fikri tam burada işe yarıyor: anlamı sen verirsin, o sadece dediğini yapar.

Bunu biraz somutlaştıralım, çünkü ileride çok işine yarayacak. Diyelim 5. kutuda yine 12 yazıyor, ve 12. kutuda da 99 var. Birine "5. kutunun *gösterdiği* yere git" dersek iki adım atması gerekir:

```
   1) Önce 5. kutuya bak       → içinde 12 var
   2) O 12'yi ADRES gibi oku,
      12. kutuya git           → asıl istediğin değer orada (99)

          ┌──────┐                      ┌──────┐
   Adres 5│  12  │ ──────────────────►  │  99  │ Adres 12
          └──────┘   "12. kutuya git"   └──────┘
       (bir ADRES tutuyor)               (asıl DEĞER)
```

Yani 5. kutu, içinde asıl veriyi değil, asıl verinin **nerede olduğunu** tutuyor. İçinde başka bir kutunun adresi olan böyle bir kutuya **pointer** (işaretçi) denir: "5. kutu, 12. kutuyu gösteriyor."

Günlük hayattan oturt: bir vestiyer fişi gibi. Fişin kendisi senin palton değildir; üstündeki numara, görevliye paltonun **hangi askıda** olduğunu söyler. Ya da bir adres defteri — "Ayşe" satırı Ayşe'nin evini içermez, evinin **nerede** olduğunu içerir. Pointer da tam böyle: veriyi değil, verinin yerini taşır.

Peki ne işe yarar? Çünkü koca bir şeyi elden ele taşımak yerine sadece "şurada" demek çoğu zaman çok daha ucuzdur — birine evini posta ile göndermek yerine adresini vermek gibi. İleride göreceğin gibi, programlar büyük verileri hep böyle, adresini (pointer'ını) dolaştırarak yönetir.

> 💡 İleri-not: Bir pointer'ı gerçekten *takip etmek* — içindeki adrese gidip oradaki değeri almak — bir komut ister. Onu, gerçek söz dizimiyle [08_mov_ve_bellek](./08_mov_ve_bellek.md)'te yapacağız. Şimdilik fikir otursun yeter: **bir kutu, başka bir kutunun yerini (adresini) tutabilir.** Adres/değer ayrımını sağlam kavradıysan, pointer'ın yarısını çoktan anladın demektir.

---

## Register'lara Yakından Bakış

01'de register'ları "işçinin cebindeki, anında erişilen, sayıca az kutular" diye tanımıştık ve birkaç ismini (EAX, EBX, ECX, EDX) duymuştuk. Şimdi onlara da yaklaşalım.

**Kaç tane var?** x86'nın 32-bit dünyasında bir avuç "genel amaçlı" register var. Esas dördü `EAX`, `EBX`, `ECX`, `EDX`; bunlara `ESI` ve `EDI` eklenir; bir de iki "özel görevli" daha var, `ESP` ve `EBP` (onlarla [14_stack](./14_stack.md)'te tanışacağız). Toplamda bir elin parmaklarını biraz aşan kadar — 01'deki o söz işte bu kadar somut.

**Ne kadar büyük?** İşte 03'ün bir borcunu burada ödüyoruz. 03'te şöyle bir satır görmüştün:

```
 03'teki örnek:   ebx = 0xffffd6a4
                        └────┬────┘
                       8 hex rakamı

 1 byte = 2 hex rakamı   →   8 hex rakamı = 4 byte = 32 bit
 İşte bir register TAM bu kadar yer tutar: 32 bit = 4 byte.
```

Yani bir register, 4 byte'lık bir sayı tutar. Bu da 03'teki "2'nin katları" mantığıyla, 0'dan `2³² − 1`'e kadar (tam olarak 4.294.967.295, yani kabaca 4.3 milyar) bir aralık demek. Bir bellek kutusuyla yan yana koyalım:

```
 Bellek kutusu:  1 byte   →  0 .. 255
 Register:       4 byte   →  0 .. ~4.3 milyar   (tam olarak 2³² - 1)
```

> 💡 İleri-not: Dikkat ettiysen buraya kadar hep **0'dan yukarı** saydık — hem kutuda hem register'da. Peki ya eksi sayılar, mesela −7? Onlar da bu aynı bitlere sığar, ayrı bir kutu icat etmeye gerek yok; ama "eksi bir sayı bu anahtarlarla *nasıl* yazılır?" sorusunu, işaretli sayıları ve bayrakları gördüğümüzde açacağız ([10_bayraklar_ve_cmp](./10_bayraklar_ve_cmp.md)). Şimdilik "aralık pozitif tarafta" demen yeter.

Dikkat ettiysen bir önceki bölümle bağlanıyor: bir register tam olarak 4 bellek kutusu kadar sayı taşır. Bir register'ın içindekini depoya bıraktığında, o değer ardışık 4 kutuya yayılır — yani "büyük sayı = birkaç kutu" derken kastettiğimiz şeyin ta kendisi.

> 💡 Neden register'lar bu kadar az ama bu kadar hızlı? Çünkü fiziksel olarak **işçinin ta kendisinin içindeler** — işlemcinin üstünde. Cep, işçinin önlüğünde; depo, odanın öbür ucunda. Yakın olan hızlıdır ama yer pahalıdır (o yüzden az); uzak olan boldur ama yavaştır. Derin fiziksel sebepleri kurcalamıyoruz; "yakın = hızlı + az, uzak = yavaş + bol" sezgisi şimdilik fazlasıyla yeter.

> 💡 İleri-not: Register isimlerindeki harfler (A, B, C, D) ve baştaki o "E" rastgele değil — küçük ama hoş bir tarihçesi var. Meraklısına en sondaki [Ek](#ek--eaxteki-e-nereden-geliyor-tarih%C3%A7e-ve-sebepler) bölümünde anlattım; şimdilik isimleri sadece birer etiket gibi düşün.

---

## İşçinin Asıl Dansı: Depo ile Cep Arasında

Şimdi bu dersin kalbine geldik. İki parçayı (depo + cep) ayrı ayrı gördük; peki işçi gün boyu ne yapıyor? Cevap, bu ikisi arasındaki bir **mekik dokuma**dır.

Önemli kural şu: işçi gerçek işini — toplamayı, çıkarmayı, karşılaştırmayı — neredeyse hep **cebinde**, yani register'larda yapar. Depoda, rafta duran bir kutuyu öylece kapıp "onunla oynayamaz"; önce onu cebine çekmesi gerekir. Bu yüzden hemen her işin şu üç adımlı şekli vardır:

```
        İŞÇİ (cebinde register'lar)
        ┌───────────────────────────┐
        │   [EAX]   [EBX]   ...      │
        └───────────────────────────┘
            ▲  AL              │  BIRAK
            │  (depo → cep)    ▼  (cep → depo)
   ┌─────────────────────────────────────────┐
   │   DEPO (bellek): numaralı kutular         │
   └─────────────────────────────────────────┘

        İŞLE = cepte yap (topla / çıkar / karşılaştır)
```

- **AL:** İhtiyacın olan sayı(ları) depodan cebe getir. (bellek → register)
- **İŞLE:** Cepte yap — topla, çıkar, karşılaştır. (register'lar üstünde)
- **BIRAK:** Sonucu saklaman gerekiyorsa, cepten depoya geri koy. (register → bellek)

Somut bir örnek (henüz gerçek komut değil, sadece Türkçe taslak):

```
 Görev: 100. kutudaki sayı ile 200. kutudaki sayıyı topla,
        sonucu 300. kutuya yaz.

   AL    :  100. kutuyu  →  EAX          (depodan cebe)
   AL    :  200. kutuyu  →  EBX          (depodan cebe)
   İŞLE  :  EAX'a EBX'i ekle             (cepte; artık EAX = toplam)
   BIRAK :  EAX'ı        →  300. kutu    (cepten depoya)
```

Gördüğün gibi bütün iş, depodan cebe çekmek, cepte halletmek, gerekirse depoya bırakmaktan ibaret. Bu **al → işle → bırak** kalıbı, yazacağın programların neredeyse tamamının iskeletidir. Ünite 1'de gerçek komutları görünce bu şekli tekrar tekrar tanıyacaksın.

> ⚠️ Burada bir karışıklığı baştan önleyelim. **getir → yap → ilerle** (01) ile **al → işle → bırak** aynı şey DEĞİL:
> - **getir-yap-ilerle:** işçinin *emirleri* okuma ritmi — her komutta bir kez döner: sıradaki emri getir, uygula, bir sonraki emre ilerle.
> - **al-işle-bırak:** *veriyi* depo ile cep arasında taşıma kalıbı — çoğu programın büyük resmi. Yukarıdaki "yap" adımlarının içinde olan şey budur.
>
> Kısacası: tek tek komutlar getir-yap-ilerle ile dönerken, hep birlikte ortaya çıkardıkları desen al-işle-bırak'tır.

> 🔑 Ünite 1'de `mov` diye bir komutla tanışacaksın — işte yukarıdaki **AL** ile **BIRAK**'ı yapan komut odur ([08_mov_ve_bellek](./08_mov_ve_bellek.md)). **İŞLE** ise aritmetik komutlarıdır ([09_aritmetik](./09_aritmetik.md)). Yani bu dans, birazdan öğreneceğin gerçek komutların Türkçe taslağından başka bir şey değil.

> 💡 Dürüst küçük not: x86 bazen kestirmelere de izin verir (her zaman cebe çekmeden, doğrudan bir bellek kutusuna dokunabildiğin durumlar var). Ama kafanda tutman gereken temel kalıp al-işle-bırak'tır; istisnaları sırası geldiğinde söyleyeceğim.

---

## Program da Bu Kutularda Durur

Şimdiye kadar kutuları hep **veri** için düşündük: sayılar, harfler, bir oyundaki can. Ama 01'de geçerken "programı belleğe koyarsın" demiştik. O resmi şimdi tamamlayalım: programın **kendisi de** aynı kutularda durur.

Nasıl olur? Çünkü işçinin tanıdığı her komut, en dipte yine bir **sayıdır** — makine her emri belli bir sayıyla kodlar. Yani senin "emir listen", aslında ardışık kutulara yazılmış sayılardan ibarettir. 03'le bağlayalım: assembly'de yazacağın o komutlar, bellekte hex sayılar olarak durur.

Bu da getir-yap-ilerle'deki "**getir**" kelimesinin tam anlamını netleştirir: işçi, sıradaki emri **bellekten, bir kutudan okur.** Veri için olan depo, aynı zamanda programın da yaşadığı yerdir.

> 🔑 Bellek hem **veriyi** hem **programı** tutar — ikisi de sonuçta kutulardaki sayılardır. "Getir-yap-ilerle"nin "getir"i, işte bu kutulardan birinden sıradaki komutu çekmek demektir.

> 💡 İleri-not: "Kod da aslında veridir / bellekteki sayılardır" fikri, ileride birçok kapı açacak güçlü bir kavrayıştır. Şimdilik sadece resmi tamamlıyoruz: depo yalnızca veriyle dolu değil, programın da evidir.

---

## İşçinin Parmağı da Bir Register'dır

Son bir bağlantıyla Ünite 0'ı kapatalım. 01'de küçük bir 💡 olarak şunu söylemiştik: "işçinin elinde 'şu an listenin kaçıncı satırındayım' bilgisi vardır, sanki parmağını okuduğu satırın üstünde tutar gibi." O parmağın ne olduğunu artık söyleyebiliriz.

O parmak, özel bir cep kutusudur — yani bir **register.** Peki içinde ne tutar? Sıradaki komutun **bellekteki adresini**: yani işçinin bir sonraki emri kaçıncı kutudan okuyacağı bilgisini.

```
   Özel register ("parmak")             BELLEK (program da burada)
      ┌──────────┐                      Adres
      │  0x....  │ ──────────────────►  ...    ┌─────────┐
      └──────────┘                     şu an → │  komut  │  ← buradan oku (GETİR)
       içinde bir ADRES var                    └─────────┘
       (kaçıncı kutu),                          ...
       bir DEĞER değil
```

Bu bölümün adres/değer dersine güzel bir kapanış olduğuna dikkat et: bu register bir **değer** değil, bir **adres** tutar — "kaçıncı kutu" bilgisini taşır, o kutunun içindekini değil. İki bölüm önce ayırdığımız şey tam burada işe yarıyor.

Şimdi getir-yap-ilerle'yi bu parmak register'ıyla yeniden okuyalım:

```
   GETİR  :  parmağın gösterdiği kutudaki komutu oku
   YAP    :  komutu harfiyen uygula
   İLERLE :  parmağı bir sonraki komutun durduğu kutuya kaydır
```

Ya 01'de önizlediğimiz "**atla / zıpla**" komutları? Onlar tam olarak şudur: bu parmak register'ına **başka bir adres** koymak. Parmağı listenin istediğin satırına atlatırsın — kararlar ve döngüler işte böyle ortaya çıkar ([11_ziplamalar](./11_ziplamalar.md)).

> 💡 İleri-not: Bu özel register'ın x86'daki adı **EIP** (Instruction Pointer). Ezberlemene gerek yok; GDB ile programı tek tek adımlarken parmağın kutudan kutuya yürümesini *canlı* göreceksin ([07_gdb_tek_adim](./07_gdb_tek_adim.md)). O an "demek bu buymuş" diyeceksin.

> 🔑 Tüm Ünite 0 tek nefeste: **bellek** = veriyi ve programı tutan numaralı kutular; **register'lar** = işçinin içindeki birkaç hızlı kutu (biri "şu an neredeyiz"i tutan parmak); **işçi** = parmağın gösterdiği komutu getir-yap-ilerle ile, veriyi de al-işle-bırak dansıyla işleyen, çok hızlı ama çok aptal varlık. İşte bilgisayar bu.

---

## Özet — Aklında Tut

```
☐ Bellek kutusu = tam 1 byte = 8 anahtar = 0..255. Adresler ardışık (0,1,2,...), çoğu zaman hex.
    - Kutunun NUMARASI = adres.   Kutunun İÇİ = değer.   (Hâlâ apayrı!)
☐ Büyük sayı (255 üstü) = ardışık birkaç kutu birlikte. (Diziliş sırası: ileride, gdb'de.)
☐ Aynı sayı bir yerde DEĞER, başka yerde ADRES olabilir; rolü, işçiye verdiğin EMİR belirler.
    - "Bir kutu başka bir kutunun adresini tutabilir" → ilerideki pointer'ın tohumu (şimdi açmıyoruz).
☐ Register = işçinin içindeki hızlı cep kutusu; sayıca AZ (EAX,EBX,ECX,EDX,ESI,EDI + ESP,EBP).
☐ Bir register = 32 bit = 4 byte = 0..~4.3 milyar. (03'teki 8-haneli "ebx = 0xffffd6a4"ün cevabı.)
☐ İşçinin asıl dansı: AL (depo→cep) → İŞLE (cepte) → BIRAK (cep→depo). Programların iskeleti.
    - DİKKAT: getir-yap-ilerle = KOMUT okuma ritmi; al-işle-bırak = VERİ taşıma kalıbı. Karıştırma.
☐ Program da bellekte durur: komutlar da sayıdır. "Getir" = sıradaki komutu bir kutudan okumak.
☐ İşçinin "parmağı" = özel bir register; içinde sıradaki komutun ADRESİ var (x86'da adı EIP).
    - Atlamak/zıplamak = bu parmağa başka bir adres koymak.
☐ Ünite 0 bitti: kafanda artık tam resim var. Ünite 1'de İLK KEZ gerçek kod yazıp çalıştıracağız.
```

---

## Ek — EAX'teki "E" Nereden Geliyor? (Tarihçe ve Sebepler)

> Bu bölüm meraklısına. Atlasan dersin gerisini anlamana hiç engel olmaz — ama yukarıda "neden A, B, C, D, ve neden baştaki E?" diye sorduysan, cevabı (ve kısa hikâyesi) burada.

### Önce harfler: A, B, C, D rastgele değil

İlk x86 işlemcilerinde (8086/8088, 1978) register'ların belli rolleri vardı ve isimleri o rollerden geliyordu:

```
 AX → Accumulator : hesabın "biriktiği" yer (toplamlar, sonuçlar)
 BX → Base        : bellek adreslemede "taban" olarak kullanılırdı
 CX → Counter     : sayaç — döngülerin tekrar sayısı
 DX → Data        : ek veri / çarpma-bölmede yardımcı
```

Bugün bunların çoğu "genel amaçlı" sayılır — yani istediğini neredeyse her işe koşabilirsin. Ama isimler kaldı, ve bazı komutlar **hâlâ** belli register'ları tercih eder (mesela bazı döngü/sayaç komutları ECX'i, bazı çarpma komutları EAX/EDX'i sever). Bunları ilgili derslerde, lafı geldikçe göreceğiz. Yani "genel amaçlı" ama tam tamına eşit değiller — bu küçük dürüst notu cebinde tut.

### Sonra baştaki "E": Extended (genişletilmiş)

Eski makinelerde bu register'lar **16 bitti** — yani AX, BX, CX, DX 16 bit (2 byte) tutuyordu. 80386 işlemcisiyle (1985) register'lar **32 bite** genişledi. Genişletilmiş bu hâle "**E**xtended AX" → **EAX** dendi. Yani baştaki E, kısaca "genişletilmiş, 32-bitlik sürüm" demek.

İşin güzel yanı: eski 16-bitlik AX yok olmadı — bugün AX, EAX'in **alt 16 bitine** erişmenin adı olarak yaşıyor:

```
        EAX  (32 bit)
   ┌───────────────────────────────────┐
   │                  │       AX        │   AX = EAX'in alt 16 biti
   │                  │   (16 bit)      │
   └───────────────────────────────────┘
```

(AX'in de kendi içinde AH ve AL diye iki byte'a ayrılmasına — ve bunun neden "ayrı kutular değil, aynı bitlere farklı pencere" demek olduğuna — hemen sonraki kısa ara derste, [04.5_registerin_ici](./04.5_registerin_ici.md)'de bakıyoruz. Şimdilik "AX, EAX'in küçük hâli" demen yeter.)

### Ve sonrası: RAX (64-bit)

Hikâyeyi tamamlayalım: 64-bitlik makinelerde aynı register bir kez daha büyüdü, 64 bit oldu ve adı **RAX** oldu (buradaki R "register"dan, biraz keyfî). Yani aynı cep kutusunun büyüye büyüye gelen üç boyutu var:

```
 AX (16-bit)  →  EAX (32-bit)  →  RAX (64-bit)
```

Biz bu kursta **32-bit (EAX)** katında çalışıyoruz. Ama bir yerde AX, EAX ya da RAX görürsen artık biliyorsun: hepsi aynı register'ın farklı boyutlardaki hâlleri.

> 🔑 Özet: Harfler (A/B/C/D) eski özel rollerden geldi; baştaki **E** = Extended (16→32 bit genişleme). AX(16) → EAX(32) → RAX(64) aynı kutunun üç boyutu. Bizim dünyamız EAX.

---

## 🔗 İlgili Konular

- [01_bilgisayar_nedir.md](./01_bilgisayar_nedir.md) — Bu derste derinleştirdiğimiz kutu/register/işçi modelinin kaynağı
- [04.5_registerin_ici.md](./04.5_registerin_ici.md) — Register'ların içine bir kat daha inme: AL, AH ve "aynı bitler, farklı pencere"
- [08_mov_ve_bellek.md](./08_mov_ve_bellek.md) — "Al → bırak" dansının gerçek komutlarla yapıldığı yer
- [07_gdb_tek_adim.md](./07_gdb_tek_adim.md) — Register'ları, adresleri ve "parmağın" yürüyüşünü canlı izleyeceğin ders

---

**Önceki konu:** [03_sayilar_ikilik_onaltilik.md](./03_sayilar_ikilik_onaltilik.md)
**Sonraki konu:** [04.5_registerin_ici.md](./04.5_registerin_ici.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
