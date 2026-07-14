# 🧠 x86 Assembly — Bilgisayar Aslında Nedir?

> Bir bilgisayarın içinde sihir yoktur. Devasa bir depo (bellek), işçinin cebindeki birkaç kutu (register)
> ve bu kutuların üstünde çalışan, çok hızlı ama çok aptal bir işçi (işlemci) vardır.
> Bu işçi tek bir şey yapar: listedeki sıradaki emri oku, **harfiyen** uygula, bir sonrakine geç.
> Bütün bilgisayar — telefonun, oyun konsolun, bu dosyayı açtığın makine — işte bu üç parçanın hikâyesidir.

> **Bu derste tek satır kod yok.** Sadece makinenin kafasında nasıl bir resim olduğunu kuracağız.
> Bu resim, kursun geri kalanının üstüne oturduğu zemindir. Acele etme; gerekirse iki kez oku.

---

## 📋 İçindekiler

- [Bilgisayar Sihir Değil](#bilgisayar-sihir-de%C4%9Fil)
- [Parça 1 — Bellek: Numaralı Kutular Deposu](#par%C3%A7a-1--bellek-numaral%C4%B1-kutular-deposu)
- [Parça 2 — Register: İşçinin Cebindeki Kutular](#par%C3%A7a-2--register-i%C5%9F%C3%A7inin-cebindeki-kutular)
- [Parça 3 — İşlemci: Çok Hızlı, Çok Aptal İşçi](#par%C3%A7a-3--i%C5%9Flemci-%C3%A7ok-h%C4%B1zl%C4%B1-%C3%A7ok-aptal-i%C5%9F%C3%A7i)
- [İşçinin Tek Yaptığı Şey: Getir → Yap → İlerle](#i%C5%9F%C3%A7inin-tek-yapt%C4%B1%C4%9F%C4%B1-%C5%9Fey-getir--yap--ilerle)
- [Program Nedir?](#program-nedir)
- ["Programı Çalıştırmak" Ne Demek?](#program%C4%B1-%C3%A7al%C4%B1%C5%9Ft%C4%B1rmak-ne-demek)
- [İşçi Hangi Emirleri Anlar? (Küçük Önizleme)](#i%C5%9F%C3%A7i-hangi-emirleri-anlar-k%C3%BC%C3%A7%C3%BCk-%C3%B6nizleme)
- [Bu Kadar Aptal Bir İşçi Neden İşe Yarıyor?](#bu-kadar-aptal-bir-i%C5%9F%C3%A7i-neden-i%C5%9Fe-yar%C4%B1yor)

---

## Bilgisayar Sihir Değil

Çoğu insan için bilgisayar, içinde ne döndüğü bilinmeyen bir kutudur. Tıklarsın, bir şeyler olur; yazarsın, ekranda harfler belirir. Nasıl? Belirsiz.

Gerçek şu: bilgisayar **çok basit şeyleri akıl almaz bir hızla** yapan bir makinedir. İçindeki işçi "Türkçe anlamaz", "ne istediğini düşünmez", "akıllı değildir". Sadece bir avuç çok ilkel işi yapar — ama saniyede **milyarlarca kez.** İşte tüm büyü, bu hızdan ve bu basitliğin üst üste binmesinden çıkar.

Bu dersin amacı, o kutunun kapağını açıp içindeki üç parçayı sana tanıtmak. Bunları gördüğünde, "bilgisayar nasıl çalışıyor?" sorusu gizemli olmaktan çıkacak.

---

## Parça 1 — Bellek: Numaralı Kutular Deposu

Hayal et: ucu bucağı görünmeyen dev bir depo. İçinde, sıra sıra dizilmiş **küçük kutular** var. Her kutunun:

- bir **numarası** var (0, 1, 2, 3, … diye gider),
- ve içinde tek bir **küçük sayı** durur.

```
 Numara:    0      1      2      3      4      5     ...
          ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
 İçerik:  │ 72 │ │ 13 │ │  0 │ │255 │ │ 42 │ │  7 │ ...
          └────┘ └────┘ └────┘ └────┘ └────┘ └────┘
```

İşte bu depo, bilgisayarın **belleğidir** (İngilizce *memory*, ya da halk arasında RAM). Programın çalışırken kullandığı bütün veriler — yazdığın harfler, açtığın resmin pikselleri, bir oyundaki canın — hepsi bu kutuların içindeki sayılardır.

İki kelimeyi şimdiden ayır, çünkü her yerde lazım olacak:

- Bir kutunun **numarası** = onun **adresidir** (*address*). "3 numaralı kutu" demek, "3 adresindeki kutu" demektir.
- Bir kutunun **içindeki sayı** = onun **değeridir / içeriğidir**.

> 🔑 Adres ile değer **farklı şeylerdir.** "3 numaralı kutu" (adres = 3) ile "içinde 255 yazan kutu" (değer = 255) karıştırılmamalı. Bu ayrım, ileride en sık takılınan noktadır — şimdiden net olsun: **adres = kutunun yeri, değer = kutunun içi.**

Her kutuya bir **byte** denir; içine 0 ile 255 arası bir sayı sığar. (Neden tam 255? Onu [03_sayilar_ikilik_onaltilik](./03_sayilar_ikilik_onaltilik.md)'da göreceğiz — şimdilik "küçük bir sayı" demek yeter.)

---

## Parça 2 — Register: İşçinin Cebindeki Kutular

Depo kocaman ama bir sorunu var: **uzak.** İşçinin her seferinde rafa yürüyüp doğru kutuyu bulması zaman alır.

Bu yüzden işçinin, önlüğünün ceplerinde **birkaç tane özel kutu** vardır. Bunlar:

- **çok az sayıdadır** (bir elin parmaklarını biraz aşar),
- ama **anında** erişilebilir — uzanır, alır; rafa yürümek yok.

```
        İŞÇİ
   ┌───────────────┐
   │  cep kutuları │   ← register'lar: az, ama ışık hızında
   │  [ EAX: 5 ]   │
   │  [ EBX: 0 ]   │
   │  [ ECX: 99 ]  │
   │  [ ...  ]     │
   └───────────────┘
          ⇕  (yavaş gidiş-geliş)
   ┌─────────────────────────────────┐
   │  DEPO (bellek): milyonlarca kutu │
   └─────────────────────────────────┘
```

Bu cep kutularına **register** denir. İşçi gerçek işini neredeyse hep bu cep kutularıyla yapar: bir sayıyı depodan alıp cebine koyar, cebinde onunla oynar (toplar, karşılaştırır), sonra gerekirse sonucu depoya geri kaldırır.

x86 işlemcisinde bu cep kutularının her birinin bir adı vardır: `EAX`, `EBX`, `ECX`, `EDX` ve birkaç tane daha. İsimleri şimdilik korkutucu görünebilir; sonraki ünitelerde her birini tek tek, ihtiyaç doğdukça tanıyacağız. Şimdilik tek bilmen gereken: **register = işçinin anında uzanabildiği, sayıca az kutular.**

> 💡 Neden hem depo hem cep var? Çünkü hız ile yer arasında bir takas vardır: cep kutuları çok hızlı ama çok az; depo çok geniş ama yavaş. İşçi ikisini birlikte kullanır — büyük veriyi depoda tutar, üstünde çalışacağını cebe çeker.

---

## Parça 3 — İşlemci: Çok Hızlı, Çok Aptal İşçi

Şimdi baş kahramana geldik: **işlemci** (İngilizce *CPU*, ya da *processor*). Yukarıda "işçi" dediğimiz şey budur.

Bu işçinin iki temel özelliği var, ve ikisi de aynı anda doğru:

1. **İnanılmaz hızlıdır.** Saniyede milyarlarca minik adım atar. Senin gözünü kırpman onun için bir ömür gibidir.
2. **İnanılmaz aptaldır.** Hiçbir şeyi "anlamaz". Ne yapmaya çalıştığını bilmez, inisiyatif almaz, "şunu kastetmişsindir" demez. Yalnızca önündeki **şu anki emri** birebir uygular.

İşte assembly'nin tüm felsefesi bu cümlede saklı:

> 🔑 İşçi akıllı değildir; **harfiyen itaatkârdır.** Ona ne dersen tam onu yapar — fazlasını değil, eksiğini değil, "iyi niyetli" yorumunu değil. Bu yüzden program yazmak = bu işçiye, anlayacağı dilde, **adım adım** ne yapacağını söylemektir.

Bir aşçıyı düşün ama tarifi *kelimesi kelimesine* uygulayan, hiç sağduyusu olmayan bir aşçı. Tarifte "yumurtaları kır" yazıyorsa kabuğuyla kâseye atar — çünkü "kabuğunu ayıkla" yazmamışsın. Bilgisayar tam böyle bir aşçıdır. Sinir bozucu gibi görünür, ama aslında bir **süpergüçtür**: tam olarak ne olacağını önceden bilebilirsin, çünkü işçi asla "kendince" davranmaz.

---

## İşçinin Tek Yaptığı Şey: Getir → Yap → İlerle

Peki bu işçi tam olarak ne yapıyor? Tek bir döngüyü, durmadan, milyarlarca kez tekrarlıyor:

```
   ┌──────────────────────────────────────────┐
   │                                            │
   │   1) GETİR:  Sıradaki emri oku             │
   │   2) YAP:    O emri harfiyen uygula        │
   │   3) İLERLE: Bir sonraki emre geç          │
   │                                            │
   └──────────────┐              ▲──────────────┘
                  └──────────────┘
                   (baştan tekrar)
```

Hepsi bu. İşçi listedeki emri okur, yapar, bir sonrakine geçer; sonra tekrar okur, yapar, geçer… Buna **getir-yap-ilerle döngüsü** denir (İngilizce *fetch–execute cycle*). Bilgisayarın yaptığı *her şey* — film oynatmak, oyun, bu metni göstermek — bu basit döngünün milyarlarca kez, müthiş bir hızla tekrarıdır.

> 💡 İşçinin elinde bir de "şu an listenin kaçıncı satırındayım" bilgisi vardır — sanki parmağını okuduğu satırın üstünde tutar gibi. Normalde her emirden sonra parmağı bir alt satıra kayar. Ama bazı emirler "parmağını şu satıra koy" diyebilir — kararlar ve döngüler işte böyle olur. (Bu "parmağın durduğu satır" fikri, ileride çok önemli olacak.)

---

## Program Nedir?

İşçinin okuduğu o **emir listesi** neyse, işte ona **program** denir.

Bir program, baştan sona sırayla yazılmış talimatlardan oluşan bir **yapılacaklar listesidir:**

```
  Satır 1:  EAX kutusuna 5 koy
  Satır 2:  EBX kutusuna 3 koy
  Satır 3:  EAX'a EBX'i ekle      (artık EAX = 8)
  Satır 4:  İşletim sistemine "bittim, sonucum EAX'ta" de
```

İşçi bu listeyi yukarıdan aşağı okur, her satırı harfiyen yapar. Yukarıdaki dört satır da gerçek bir programdır — sadece henüz Türkçe yazdık. Sonraki ünitelerde bunu işçinin gerçekten anladığı dile (assembly'ye) çevirmeyi öğreneceğiz. Şu an önemli olan fikir: **program = işçiye verilen, sırayla uygulanan emir listesi.**

> ⚠️ "Sırayla" kelimesinin altını çiz. İşçi satırları **tek tek, sırasıyla** işler. Üçüncü satır çalışırken birinci ve ikinci çoktan bitmiştir. Bu sıralılık, programlamanın belkemiğidir — "önce şu olur, sonra bu" diye düşünmeye alış.

> 💡 **Aklınıza takılabilir:** *"İşçi her şeyi sırayla yapıyorsa, ben nasıl aynı anda hem müzik dinleyip hem internette geziyorum?"* İki şey birden doğru: (1) işçi o kadar hızlıdır ki, bir **yönetici** (işletim sistemi) onu saniyede binlerce kez programlar arasında gezdirir — "biraz Spotify, biraz fare, biraz tarayıcı…" — ve bu hız yüzünden sana her şey aynı andaymış gibi gelir. (2) Modern makinelerde aslında tek değil, **birkaç işçi** (çekirdek/*core*) vardır; bazı işler gerçekten aynı anda olur. Biz kod yazarken yine tek işçi + tek liste üstünden düşüneceğiz, çünkü önemli olan o tek akış; çoklu görev "üstte", yönetici tarafından halledilir.

---

## "Programı Çalıştırmak" Ne Demek?

"Programı çalıştırmak" havalı bir laf gibi gelebilir ama anlamı çok basit:

> Emir listeni belleğe (depoya) koyarsın, işçiye "şu satırdan başla" dersin, ve işçi getir-yap-ilerle döngüsüyle listeni baştan sona uygulamaya başlar.

Yani çalışan bir program = **işçinin senin listeni okuyup yapıyor olması.** Program bittiğinde (ya da "ben bittim" dediğinde) işçi durur ve kontrolü işletim sistemine geri verir.

Bir ek terim: belleğe yüklenip **çalışmakta olan** bir programa **process** (süreç) denir. Yani "program" diskte duran tariftir; "process" o tarifin şu an mutfakta pişiriliyor olan hâlidir. Bu ayrımı [02_terminal_ile_tanisma](./02_terminal_ile_tanisma.md)'da elinle yaşayacaksın.

---

## İşçi Hangi Emirleri Anlar? (Küçük Önizleme)

İşçi sadece bir **avuç** emir tanır — ve şaşırtıcı olan, bütün yazılımların bu avuç emrin kombinasyonundan kurulmuş olmasıdır. Henüz syntax öğrenmiyoruz; sadece *çeşitlerine* bir göz atalım ki nereye gittiğimizi bilelim:

| Emir çeşidi | Türkçesi | Hangi derste |
|---|---|---|
| **Taşı** | "Şu kutuya bu sayıyı koy", "şu kutudakini buraya al" | [08_mov_ve_bellek](./08_mov_ve_bellek.md) |
| **Hesapla** | "Şu ikisini topla / çıkar" | [09_aritmetik](./09_aritmetik.md) |
| **Karşılaştır** | "Bu iki sayı eşit mi? büyük mü?" | [10_bayraklar_ve_cmp](./10_bayraklar_ve_cmp.md) |
| **Atla** | "Listenin şu satırına geç" (kararlar, döngüler) | [11_ziplamalar](./11_ziplamalar.md) |
| **Parça çağır** | "Listenin şu bölümünü çalıştır, sonra buraya dön" | [15_call_ve_ret](./15_call_ve_ret.md) |
| **OS'a seslen** | "İşletim sistemi, şunu ekrana yaz / şunu oku" | [17_sistem_cagrilari](./17_sistem_cagrilari.md) |

Gördüğün gibi liste kısa. Bir insanın hayatı boyunca kullandığı bütün programlar — işte bu bir avuç ilkel emrin, milyarlarca kez, doğru sırayla dizilmesinden ibaret. İşin güzelliği de burada: az sayıda basit parçadan, sınırsız karmaşıklık.

Sırf merakını gidermek için, "EAX kutusuna 5 koy" emrinin gerçek assembly'de nasıl göründüğüne bir bakış (henüz ezberleme, sadece gör):

```
mov eax, 5
```

Bu kadar. "EAX'a 5 koy" demenin makineye söyleniş biçimi. Sonraki ünitelerde bunu yazıp **çalıştıracağız**, ve `echo $?` ile o 5'i ekranda göreceğiz.

---

## Bu Kadar Aptal Bir İşçi Neden İşe Yarıyor?

Baştan beri "aptal işçi" diyoruz; bu kulağa bir kusur gibi geliyor. Aslında iki büyük **avantaj** sağlar:

1. **Öngörülebilirlik.** İşçi asla doğaçlama yapmadığı için, bir programın ne yapacağını **kesin olarak** bilebilirsin. "Acaba şunu mu kastetti?" yoktur; ne yazdıysan o olur. Bu, hata aramayı (ve ileride güvenlik açıklarını anlamayı) mümkün kılar.
2. **Hız.** İşçi "düşünmediği", sadece basit emirleri uyguladığı için inanılmaz hızlı olabilir. Zekâ yavaştır; ahmak ama hızlı uygulama, üst üste binince her şeyi yapar.

> 🔑 Özetle: bilgisayarın gücü zekâsından değil, **basit işleri hatasız ve baş döndürücü bir hızla** tekrarlamasından gelir. Sen ona doğru listeyi verirsin; o, listeyi kusursuz bir sadakatle uygular. Programlama, işte o listeyi yazma zanaatıdır.

---

## Özet — Aklında Tut

```
☐ Bilgisayar sihir değil: depo + cep kutuları + bir işçi.
☐ Bellek (depo) = numaralı kutular; her kutu bir sayı tutar.
    - Kutunun NUMARASI = adres.   Kutunun İÇİ = değer.   (İkisi farklı!)
☐ Register (cep kutuları) = işçinin anında eriştiği, AZ sayıda kutu (EAX, EBX...).
☐ İşlemci (işçi) = çok hızlı + çok aptal; sadece getir → yap → ilerle yapar.
☐ Program = sırayla uygulanan emir listesi (yapılacaklar listesi).
☐ Çalıştırmak = listeyi belleğe koyup işçiye "başla" demek. Çalışan program = process.
☐ İşçi bir avuç emir anlar: taşı, hesapla, karşılaştır, atla, parça çağır, OS'a seslen.
☐ Aptallık kusur değil: öngörülebilirlik + hız demek.
```

---

## 🔗 İlgili Konular

- [00_buradan_basla.md](./00_buradan_basla.md) — Kursun yol haritası ve nasıl çalışılacağı
- [01.5_sayi_ve_anlam.md](./01.5_sayi_ve_anlam.md) — "Her şey sayı" ise kedi videosu nasıl oluyor? Anlamı koddan gelir
- [02_terminal_ile_tanisma.md](./02_terminal_ile_tanisma.md) — Bu işçiye nereden konuşacağız: terminal
- [04_bellek_ve_registerlar.md](./04_bellek_ve_registerlar.md) — Depo ve cep kutularına daha yakından bakış

---

**Önceki konu:** [00_buradan_basla.md](./00_buradan_basla.md)
**Sonraki konu:** [01.5_sayi_ve_anlam.md](./01.5_sayi_ve_anlam.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
