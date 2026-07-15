# 🔗 Şalterden Bilgisayara — Full Adder: Elde Zinciri

> Geçen ders bir kutu kurdun ama "yarım" damgası yedi: elde üretiyor, elde kabul
> edemiyordu. Bu derste eksik ağzı tamamlayacaksın. Kurduğun kutunun adı **full adder**
> olacak — ve abartısız, modern işlemcideki aritmetiğin **tuğlası** budur: bundan 64
> tanesini yan yana dizen, 64-bitlik sayıları toplayan donanımı kurmuş olur.

> Bu ders serinin bugüne kadarki en zorlu kurulumudur. Zorluk parçalarda değil —
> hepsi tanıdık — **düşünme biçiminde.** Yanlış yol da dahil, yolu birlikte yürüyeceğiz.

---

## 📋 İçindekiler

- [Neden Üç Giriş?](#neden-üç-giriş)
- [Kutunun Bütün Mantığı Tek Cümle](#kutunun-bütün-mantığı-tek-cümle)
- [Sekiz Satır Değil, Dört Durum](#sekiz-satır-değil-dört-durum)
- [Yanlış Yol: "Bütün Çiftleri Toplayayım"](#yanlış-yol-bütün-çiftleri-toplayayım)
- [Doğru Yol: Kâğıttaki Gibi, Sırayla](#doğru-yol-kâğıttaki-gibi-sırayla)
- [Son Tel: İki Elde, Tek Çıkış](#son-tel-iki-elde-tek-çıkış)
- [🎮 Şimdi Sen Kur](#-şimdi-sen-kur)
- [Kapanış: 64'lü Zincir](#kapanış-64lü-zincir)

---

## Neden Üç Giriş?

Kâğıtta 27 + 35'i topla ve elinin ne yaptığını izle:

```
      ¹        ← elde
      2 7
```
```
    + 3 5
    ─────
      6 2
```

- Sağ basamak: 7+5=12 → "2 yaz, **1 elde**". Burada **iki** şey topladın.
- Orta basamak: 2+3+**1** → 6. Burada **üç** şey topladın: iki rakam + gelen elde.

Zincirin ortasındaki her basamak üç girdilidir. İşte full adder, o orta basamağın
makinesidir:

> **Full adder = a + b + c'yi toplayan kutu** — `c`, sağ komşudan gelen **elde**
> (carry). Çıkışı yine iki tel: `l` (yaz) ve `h` (yeni elde, sol komşuya gidecek).

---

## Kutunun Bütün Mantığı Tek Cümle

Üç tek-bitlik sayıyı toplamak, aslında saymaktır:

> 🔑 **Üç girişte kaç tane 1 var, SAY. Çıkan sayıyı ikilik yaz: h l.** Hepsi bu.

Sayım 0, 1, 2 ya da 3 çıkabilir (üç girişten fazlası yok). Dördünün de ikilik
yazılışını 04. dersten biliyorsun: `00`, `01`, `10`, `11`.

---

## Sekiz Satır Değil, Dört Durum

Oyunda seni sekiz satırlık bir tablo karşılayacak. Korkutmasın — satırları "kaç
tane 1 var?" sorusuyla grupla, sekiz satır dörde iner:

| Kaç tane 1? | Hangi satırlar | h l | Jeton diliyle |
|:---:|---|:---:|---|
| 0 | 000 | `0 0` | jeton yok |
| 1 | 001, 010, 100 | `0 1` | bir 1'lik |
| 2 | 011, 101, 110 | `1 0` | bir 2'lik |
| 3 | 111 | `1 1` | 2'lik + 1'lik |

İki gözlem yap:

- 1 tane 1 olan **üç satırın üçü de** aynı cevabı veriyor; 2 tane olanlar da öyle.
  Hangi girişin 1 olduğu **hiç önemli değil** — sadece **sayısı** önemli. (7+5 ile
  5+7'nin aynı olması gibi.)
- Half adder'ın tablosunda `1 1` çıkışı yoktu — iki girişle en fazla 2 sayılır.
  Üçüncü girişin getirdiği tek yenilik şu son satır: 3 = `11`.

> 💡 Tabloyu bir de **katlara ayırarak** oku: c=0 olan dört satırı ayır ve h,l'ye
> bak — **half adder'ın tablosunun birebir aynısı** çıkar. Mantıklı: üçüncü sepet
> boşsa, üç sepetlik kutu iki sepetlik kutu gibi davranmak zorundadır. Bu gözlem,
> birazdan kuracağın devrenin ruhudur: full adder'ın içinde half adder **yaşıyor.**

---

## Yanlış Yol: "Bütün Çiftleri Toplayayım"

Bu seviyede akla ilk gelen fikir çoğu zaman şudur (ve denemeye değer — yanlış yol
da öğretir): *"Elimde iki şey toplayan kutu var; o zaman bütün çiftleri toplarım:
a+b, a+c, b+c... sonra bunları birleştiririm."*

Üç-dört tane half adder yerleştirir, tellersin ve... elinde bir yığın çıkış, hiçbir
"toplam" olmadığını görürsün. Her kutu "şu ikisinde kaç 1 var" diye ayrı rapor verir;
raporlar birbirinin tekrarıdır ve kimse **genel toplamı** söylemez. Parça sayısı
arttıkça çözüme değil, tel kalabalığına yaklaşırsın.

> ⚠️ Buradaki ders devre dersi değil, düşünme dersi: **parça eklemek ilerleme
> değildir.** Devren büyüyor ama netliğin azalıyorsa, masaya dön ve işlemin
> *kendisine* bak: sen bu işi elle nasıl yapıyordun?

---

## Doğru Yol: Kâğıttaki Gibi, Sırayla

2 + 3 + 4'ü kafandan topla ve **ne yaptığına** dikkat et: "2+3 = 5... 5+4 = 9."
Bütün çiftleri aynı anda toplamadın; **ikisini topladın, çıkan sonucun üstüne
üçüncüyü eklettin.** Toplama sıralıdır — bir toplamanın **cevabı**, sonrakinin
**girişi** olur.

Bu cümleyi 03.5'ten tanıyorsun: *bir katın cevabı, üst katın sinyalidir.* O halde:

1. **Birinci half adder:** `a + b`yi toplasın.
2. **İkinci half adder:** birincinin sonucuna `c`'yi eklesin.

Bir incelik kaldı: birinci kutunun sonucu **iki tel** (h ve l). İkinci kutuya
hangisini verirsin? Jeton diliyle düşün: `c` **1'lik cinsinden** bir değer (0 ya
da 1 elma). Onunla aynı teraziye konacak tel de 1'lik cinsinden olmalı: **`l`.**
(h ise 2'lik cinsindendir — o başka bir terazinin malı, kenarda bekleyecek.)

```
   a ──► [ add ] h₁ ─────────────────────┐  (2'lik — bekliyor)
   b ──► [  1  ] l₁ ──► [ add ] h₂ ──────┤  (2'lik — bekliyor)
                  c ──► [  2  ] l₂ ──────►│──► l  ✓ (birler hanesi bitti)
                                          ▼
                                    son tel: h = ?
```

---

## Son Tel: İki Elde, Tek Çıkış

Elinde iki tane h teli var (h₁, h₂) ama kutunun tek `h` çıkışı var. Her iki tel de
aynı cümleyi bağırıyor: *"ben bir çift buldum!"* — birincisi a+b'de, ikincisi
kalan+c'de. Senin `h` çıkışının sorusu ise: "**içeride bir çift var mı?**" Çifti
kimin bulduğu umurunda değil.

"En az biri bağırıyorsa h=1" — bu cümleyi tanıyorsun: **OR.**

Ama titiz davranalım; OR'un tablosunda bir de `(1,1) → 1` satırı var. Ya ikisi
birden bağırırsa? İki çift = 4 elma gerekir; üç girişten en fazla 3 çıkar. Yine de
kanıtla, kâğıtta: h₁=1 olması için a=b=1 gerekir → o zaman l₁ = 0 olur → ikinci
kutuya 0 ve c girer → ikinci kutu **asla** çift bulamaz. **İki bağırış aynı anda
imkânsız.** OR'un tek şüpheli satırı hiç ziyaret edilmeyecek — güvenle kullan.

> 💡 İnce bir bonus: madem (1,1) durumu hiç yaşanmıyor, OR ile yalnızca o satırda
> ayrışan **XOR da** aynı işi görürdü. İkisi de geçer. Bir devrede iki farklı
> kapının aynı görevi yapabilmesi ilk başta tuhaf gelir — sırrı, farklarının hiç
> test edilmediği bir dünyada yaşıyor olmalarıdır.

---

## 🎮 Şimdi Sen Kur

**Görev:** NandGame → **Full Adder** seviyesi.

Yol tarifin: iki `add` (oyun, half adder'ını bu adla kutuna koydu — 03.5 iş başında),
bir OR. Kur, sekiz kombinasyondan birkaçını elle dene: her seferinde "kaç elma →
hangi jetonlar" diye içinden oku.

<details>
<summary>🔒 Çözüm şeması — önce kendin dene, sonra aç</summary>

1. `add₁`: girişleri **a, b**.
2. `add₂`: girişleri **add₁'in l'si** ve **c**.
3. **OR**: girişleri **add₁'in h'si** ve **add₂'nin h'si** → çıkışı kutunun **h**'sine.
4. **add₂'nin l'si** → kutunun **l**'sine.

Özetin özeti: *full adder = iki half adder + bir OR.* Ama bu cümleyi artık ezber
olarak değil, her telinin "neden"ini bilerek söylüyorsun — fark budur.

</details>

---

## Kapanış: 64'lü Zincir

Kurduğun kutuya son bir kez bak: `c` diye bir elde **girişi**, `h` diye bir elde
**çıkışı** var. Yani bu kutular... **birbirine takılabilir.** Birinin h'si,
solundakinin c'si olur:

```
        ...  ◄─h─ [FA₂] ◄─h─ [FA₁] ◄─h─ [FA₀] ◄── (ilk elde: 0)
              b₂ a₂ │     b₁ a₁ │     b₀ a₀ │
                    l₂          l₁          l₀
```

Her kutu bir basamak; elde, kâğıttaki gibi sağdan sola akar. 8 tanesini dizersen
8-bitlik, 64 tanesini dizersen 64-bitlik sayıları toplayan donanımı kurdun demektir.
Bilgisayarında şu an bir programın `add` komutu çalıştıysa, işte tam bu zincirden
geçti — **senin bugün kurduğun kutunun** 64 kopyasından.

Bu zinciri bizzat kurmak, bir sonraki dersin (ve NandGame'de sıradaki seviyenin) işi:
**Multi-bit Adder.** Orada görüşürüz.

---

## Özet — Aklında Tut

```
☐ Full adder = a + b + carry-in. Kâğıttaki ORTA basamağın makinesi (üç girdi!).
☐ Bütün mantık: 1'leri SAY, sayıyı ikilik yaz (h l). 8 satır = 4 durum.
☐ Kim 1 önemsiz, KAÇ tane 1 önemli. c=0 katı = half adder'ın ta kendisi.
☐ Yanlış yol dersi: parça eklemek ilerleme değil. Elle nasıl yapıyorsan öyle kur.
☐ Toplama SIRALIDIR: topla → sonucun üstüne ekle. (Katın cevabı, üst katın sinyali.)
☐ c ile toplanacak tel l'dir (ikisi de 1'lik cinsinden); h'ler 2'lik, kenarda bekler.
☐ İki h asla aynı anda 1 olamaz (kâğıt ispatı) → birleştirmeye OR yeter (XOR da geçerdi).
☐ h çıkışı komşunun c girişine takılır → 64'lü zincir = işlemcideki `add`in donanımı.
```

---

## 🔗 İlgili Konular

- [05_half_adder.md](./05_half_adder.md) — Bu devrenin içinde iki kez yaşayan kutu
- [04_teller_sayi_olunca.md](./04_teller_sayi_olunca.md) — "Say ve ikilik yaz"ın temeli
- [03.5_soyutlama_merdiveni.md](./03.5_soyutlama_merdiveni.md) — "Cevap, üst katın sinyalidir"

---

**Önceki konu:** [05_half_adder.md](./05_half_adder.md)
**Sonraki konu:** *(yolda — Multi-bit Adder: 64'lü zincirin kuruluşu)*

*Bu ders, "Şalterden Bilgisayara" serisinin bir parçasıdır. Seri, [nandgame.com](https://nandgame.com) eşliğinde ilerler.*
