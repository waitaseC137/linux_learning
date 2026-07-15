# 🧱 Şalterden Bilgisayara — Tek Tuğladan Bütün Kapılar

> Geçen ders "NAND evrenseldir, her şey ondan türer" dedik. Bu tür iddiaların lafta
> kalmaması gerekir. Bu derste iddiayı **sen** kanıtlayacaksın: yalnızca NAND
> kullanarak DEĞİL, VE ve VEYA kapılarını kuracaksın. Ders bittiğinde elinde dört
> kelimelik bir dil olacak — ve rölelere bir daha hiç dönmeyeceğiz.

> **Bu dersten itibaren NAND senin için kapalı bir kutudur.** İçindeki rölelerle işimiz
> bitti; artık NAND'ın sadece **tablosu** var. Bu unutuş kasıtlı — sebebini 03.5'te
> tam olarak konuşacağız.

---

## 📋 İçindekiler

- [Elimizde Ne Var: Kapalı Kutu NAND](#elimizde-ne-var-kapalı-kutu-nand)
- [DEĞİL (NOT / invert): Aynaya Bağlamak](#değil-not--invert-aynaya-bağlamak)
- [VE (AND): Tersin Tersi](#ve-and-tersin-tersi)
- [VEYA (OR): Ters Kapıdan Girmek](#veya-or-ters-kapıdan-girmek)
- [Dört Kelimelik Dil](#dört-kelimelik-dil)
- [🎮 Şimdi Sen Kur](#-şimdi-sen-kur)

---

## Elimizde Ne Var: Kapalı Kutu NAND

Bundan böyle NAND'ı böyle çizeceğiz — içi yok, sadece davranışı var:

```
          ┌────────┐
   a ─────┤        │
          │  NAND  ├───── çıkış        yalnız a=b=1 iken 0, gerisi 1
   b ─────┤        │
          └────────┘
```

NandGame de aynısını yapar: Nand seviyesini geçtiğin an, sonraki seviyelerin
kutusunda **nand** adında hazır bir parça belirir. O parça, senin kurduğun devredir —
kutulanmış hali.

Görevimiz: sadece bu kutuyu kullanarak üç kapı türetmek. Hile yok, başka parça yok.

---

## DEĞİL (NOT / invert): Aynaya Bağlamak

En basit kapı **DEĞİL**'dir: tek girişi vardır, onu tersler.

| x | çıkış |
|---|:---:|
| 0 | **1** |
| 1 | **0** |

Elimizde ise iki girişli bir NAND var. Tek girişli bir şeyi iki girişli bir parçadan
nasıl yaparsın?

NAND'ın tablosuna bak ve sadece **iki girişin aynı olduğu** satırları oku:

| a | b | NAND |
|---|---|:---:|
| **0** | **0** | 1 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| **1** | **1** | 0 |

`0,0 → 1` ve `1,1 → 0`. Yani girişler hep aynıysa, NAND düpedüz **tersleyici** gibi
davranıyor. O halde çözüm: **aynı teli NAND'ın iki girişine birden bağla.**

```
          ┌────────┐
   x ──┬──┤        │
       │  │  NAND  ├───── x'in tersi
       └──┤        │
          └────────┘
```

> 💡 Bu küçük numara, serideki ilk "türetme"dir ve yöntemi güzel özetler: yeni kapı
> icat etmedik — eldeki parçayı, tablosunun işimize yarayan satırlarına **mecbur
> bıraktık.** Devre tasarımı çoğu zaman budur.

---

## VE (AND): Tersin Tersi

**VE** kapısı, adı üstünde: iki giriş de 1 ise 1, yoksa 0.

| a | b | AND |
|---|---|:---:|
| 0 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | **1** |

Şimdi bu tabloyu NAND'ınkiyle yan yana koy... fark ettin mi? **Satır satır tam
tersi.** NAND zaten "VE-değil" demekti; o halde:

> **AND = NAND'ın çıkışını tersle.** Ve tersleyiciyi az önce kurduk.

NAND + (NAND'dan yapılma) NOT = AND. İki kutu, bitti.

---

## VEYA (OR): Ters Kapıdan Girmek

**VEYA**: girişlerden **en az biri** 1 ise 1.

| a | b | OR |
|---|---|:---:|
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 1 |

Bu sefer iş ilk bakışta zor: NAND'ın tablosu OR'a pek benzemiyor. Ama bekçi diliyle
düşününce yol açılıyor. İki cümleyi karşılaştır:

- VEYA: *"en az biri **gelmiş** olsun."*
- NAND: *"ikisi birden **olmasın**."*

Şimdi VEYA cümlesini tersinden kur: "en az biri gelmiş olsun" = **"ikisi birden
GELMEMİŞ olmasın."** İçindeki çifte olumsuzu görüyor musun? "Gelmemiş" (girişlerin
tersi) + "olmasın" (NAND). Yani:

> **OR = girişlerin İKİSİNİ DE tersle, sonra NAND'a sok.**

Doğrula (a=0, b=1 için): tersleri 1 ve 0 → NAND(1,0) = 1 ✓. (a=0, b=0): tersleri
1,1 → NAND = 0 ✓. Dört satırın dördü de tutar — kur ve gör.

> 💡 Az önce kendi elinle, mantık tarihinin ünlü bir kuralını keşfettin: **De Morgan
> kuralı** — "VEYA, terslerin VE'sinin tersidir." Kitaplar bunu formülle verir; sen
> bekçi cümlesiyle buldun. İkisi aynı şey, ama seninki senin.

---

## Dört Kelimelik Dil

Envanterine bak — dün sıfırdı, bugün dört kapın var:

| Kapı | Cümlesi | Kuruluşu (hepsi NAND'dan) |
|---|---|---|
| **NAND** | "ikisi birden olmasın" | 2 röle *(01. ders)* |
| **NOT** | "tersi" | girişleri birleştirilmiş NAND |
| **AND** | "ikisi de" | NAND + NOT |
| **OR** | "en az biri" | girişleri terslenmiş NAND |

> 🔑 Dikkat et: tabloda röle sütunu yok, çünkü artık gerek yok. **Her şey NAND
> cinsinden** — ve NAND'ın içinde ne olduğu (röle mi, transistör mü, bambaşka bir
> teknoloji mi) bu tablonun umurunda değil. Alt katman değişse bile bu dört kelime
> geçerli kalır. İşte "katman" kavramının gücü bu.

---

## 🎮 Şimdi Sen Kur

**Görev:** NandGame'de sıradaki üç seviye: **Invert → And → Or.**

Ders zaten yol gösterdi; yine de kurarken tablonu kendin doğrula: her seviyede giriş
düğmelerini elle değiştirip çıkışı izle. "Check solution"ın onayı ile senin gözünle
görmen ayrı şeylerdir — ikincisi öğretir.

<details>
<summary>🔒 Üçünün de kuruluşu tek bakışta — önce kendin dene, sonra aç</summary>

- **Invert:** `x`'i NAND'ın **iki girişine birden** bağla.
- **And:** `a,b`'yi NAND'a sok; NAND'ın çıkışını bir **invert**'ten geçir.
- **Or:** `a`'yı bir invert'ten, `b`'yi ayrı bir invert'ten geçir; iki tersi
  **NAND**'a sok.

(Oyun, önceki seviyede kurduğun parçayı sonraki seviyenin kutusuna koyar — invert'i
And ve Or'da hazır parça olarak kullanabilirsin.)

</details>

---

## Özet — Aklında Tut

```
☐ NAND artık kapalı kutu: içi yok, tablosu var. Rölelerle işimiz bitti.
☐ NOT  = NAND'ın iki girişine aynı teli vermek ("aynaya bağlamak").
☐ AND  = NAND + ters (NAND zaten "VE-değil"di).
☐ OR   = girişleri tersle, NAND'la ("ikisi birden gelmemiş OLMASIN").
☐ Bu yol boyunca De Morgan kuralını kendin keşfettin.
☐ Yöntemin adı türetme: yeni parça icat etme, eldekini tablosuna mecbur bırak.
```

---

## 🔗 İlgili Konular

- [01_akim_salter_role.md](./01_akim_salter_role.md) — NAND'ın içinde ne vardı: röleler
- [03_xor_iki_fedai.md](./03_xor_iki_fedai.md) — Sıradaki kapı: farklılık dedektörü XOR
- [03.5_soyutlama_merdiveni.md](./03.5_soyutlama_merdiveni.md) — "Kapalı kutu" fikri neden bu kadar önemli

---

**Önceki konu:** [01_akim_salter_role.md](./01_akim_salter_role.md)
**Sonraki konu:** [03_xor_iki_fedai.md](./03_xor_iki_fedai.md)

*Bu ders, "Şalterden Bilgisayara" serisinin bir parçasıdır. Seri, [nandgame.com](https://nandgame.com) eşliğinde ilerler.*
