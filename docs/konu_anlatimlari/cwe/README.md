# 👾 CWE Haritası

> Bir dersteki **👾 Meraklısına** bağlantısından geldiysen doğru yerdesin.
> Bu sayfa önce CWE ile CVE'nin ne olduğunu kısaca anlatıyor, sonra derslerde
> karşına çıkan zayıflıkları tek yerde listeliyor.
>
> Burası bir **dizin**. Her zayıflığın kendi sayfası var: ne olduğu, hangi devrede
> doğduğu, gerçek hayatta ne yaptığı ve nasıl önlendiği orada anlatılıyor.
> Dersler ise sadece devreyi ve matematiği anlatır.

---

## 📋 İçindekiler

- [CWE Nedir?](#cwe-nedir)
- [CVE Nedir?](#cve-nedir)
- [CWE ile CVE Farkı](#cwe-ile-cve-farkı)
- [Zincirler: Hatalar Arasındaki Tel](#zincirler-hatalar-arasındaki-tel)
- [Şalterden Bilgisayara](#şalterden-bilgisayara)
- [Binary Analizi & RE (Leviathan)](#binary-analizi--re-leviathan)
- [Henüz Eşlenmeyenler](#henüz-eşlenmeyenler)

---

## CWE Nedir?

**CWE** (*Common Weakness Enumeration*), yazılımda ve donanımda tekrar tekrar ortaya
çıkan **hata türlerinin** kataloğudur. MITRE tarafından tutulur ve her türün bir
numarası vardır.

Örnek: **CWE-190 — Integer Overflow or Wraparound.** 08. derste 16 bitlik
toplayıcının 17. bitinin gidecek yeri olmadığını gördün. O hatanın türünün adı bu.

> 🔑 CWE bir **zayıflıktır**, kendi başına açık değildir. Bir sayaç sarabilir ve
> hiçbir şey olmaz. Taşan sayı bir bellek boyutuna, bir sınır kontrolüne ya da bir
> dizi indeksine gittiğinde tehlikeli hâle gelir.

---

## CVE Nedir?

**CVE** (*Common Vulnerabilities and Exposures*), **belirli bir üründe** bulunmuş
**tek bir açığa** verilen kimlik numarasıdır. Biçimi `CVE-yıl-sıra` şeklindedir.

Örnek: **CVE-2018-10299.** BEC Token akıllı sözleşmesinde gönderilecek toplam
`alıcı sayısı × miktar` diye hesaplanıyordu. Saldırgan bu çarpımı 256 bitte sardırdı
(`2 × 2²⁵⁵ = 2²⁵⁶` → `0`); bakiye kontrolü sıfır gördü ve geçti. Bu açığın türü:
**CWE-190.**

---

## CWE ile CVE Farkı

| | CWE | CVE |
|---|---|---|
| **Neyi adlandırır?** | Hatanın **türünü** | Tek bir **vakayı** |
| **Örnek** | CWE-190: tam sayı taşması | CVE-2018-10299: BEC Token'daki taşma |
| **Cevapladığı soru** | "Bu ne tür bir hata?" | "Hangi üründe, hangi sürümde?" |
| **Ne işe yarar?** | Kodu denetlerken **neyi arayacağını** bilmek | **Neyi güncelleyeceğini** bilmek |

> 🔑 Bir CWE'nin altında çok sayıda CVE toplanabilir. CVE'ler olmuş olanı kaydeder;
> CWE'yi tanımak ise bir sonraki hatayı daha CVE olmadan bulmanı sağlar.

---

## Zincirler: Hatalar Arasındaki Tel

Bazı CWE numaraları tek bir hatayı değil, bir hatanın diğerini nasıl doğurduğunu
adlandırır. MITRE bunlara **zincir** (*chain*) der.

```
   CWE-190                                      CWE-787
  sayı taşar   ─────────  CWE-680  ─────────►  sınır dışına yazma
                       (bu telin adı)
```

`CWE-680` üçüncü bir olay değil, iki olayın arasındaki telin adıdır: taşan sayının
bellek boyutu olarak kullanıldığı an. İki kutu modeliyle ayrıntısı →
[CWE-680](./cwe_680.md#burada-i̇ki-kutu-var)

---

## Şalterden Bilgisayara

Her derste bir CWE yok. Devreyle gerçek bir bağ yoksa o ders burada listelenmez.

📄 kendi sayfası var · 📖 derste anlatılıyor · 👾 kısa anlatımı bu sayfada · 🔜 yolda

### Ünite 0 — Tuğlalar: Şalterden Kapılara

NandGame kapıları **mükemmel** varsayar: enerji harcamazlar, gecikmezler, hata
yapmazlar. Bu seviyedeki CWE'ler tam da o varsayımın bozulduğu yerde durur.

| Ders | CWE | Resmî adı | |
|---|---|---|---|
| [01 · Akım, Şalter, Röle](../salterden_bilgisayara/01_akim_salter_role.md) | [**CWE-1300**](./cwe_1300.md) | Improper Protection of Physical Side Channels | 📄 |
| [02 · NAND'dan Kapılar](../salterden_bilgisayara/02_nanddan_kapilar.md) | [**CWE-1247**](./cwe_1247.md) | Improper Protection Against Voltage and Clock Glitches | 📄 |

**📄 CWE-1300 — Fiziksel yan kanal.** Bir kapı durum değiştirirken enerji harcar; çekilen akım, yayılan dalga ve çıkan ses işlenen veriyle ilişkilidir. Kod kusursuz olsa bile sızıntı fizikten gelir → [sayfası](./cwe_1300.md)

**📄 CWE-1247 — Voltaj ve saat sıçraması.** Bir kapının doğru çalışması beslemesine ve saatine bağlıdır. Biri bir anlığına bozulursa devre yanlış bir sonuç üretir — ve o sonuç bir güvenlik kararıysa "hayır" "evet"e döner → [sayfası](./cwe_1247.md)

### Ünite 1 — Saymak ve Toplamak

| Ders | CWE | Resmî adı | |
|---|---|---|---|
| [04 · Teller Sayı Olunca](../salterden_bilgisayara/04_teller_sayi_olunca.md) | [**CWE-1261**](./cwe_1261.md) | Improper Handling of Single Event Upsets | 📄 |

**📄 CWE-1261 — Tek olay bozulması.** Yüklü bir parçacık bir bellek hücresindeki değeri devirebilir. 04'teki `n tel → 2ⁿ desen` kuralı bunun izini sürmeni sağlar: bir sayıya tam olarak 2'nin bir kuvveti eklenmişse tek bir bit dönmüştür → [sayfası](./cwe_1261.md)

### Ünite 2 — Sayının Sınırı ve Eksi Sayılar

| CWE | Resmî adı | Nerede doğdu | |
|---|---|---|---|
| [**CWE-190**](./cwe_190.md) | Integer Overflow or Wraparound | [08 · Increment](../salterden_bilgisayara/08_increment.md) · [08.5](../salterden_bilgisayara/08.5_sayac_basa_donunce.md) | 📄 |
| [**CWE-191**](./cwe_191.md) | Integer Underflow (Wrap or Wraparound) | [09 · Subtraction](../salterden_bilgisayara/09_subtraction.md) · [08.5](../salterden_bilgisayara/08.5_sayac_basa_donunce.md) | 📄 |
| [**CWE-680**](./cwe_680.md) | Integer Overflow to Buffer Overflow | [08 · Increment](../salterden_bilgisayara/08_increment.md#-güvenlik-köprüsü) | 📄 |
| [**CWE-787**](./cwe_787.md) | Out-of-bounds Write | [08 · Increment](../salterden_bilgisayara/08_increment.md#-güvenlik-köprüsü) | 📄 |
| [**CWE-681**](./cwe_681.md) | Incorrect Conversion between Numeric Types | [04 · Teller Sayı Olunca](../salterden_bilgisayara/04_teller_sayi_olunca.md) | 📄 |
| [**CWE-196**](./cwe_196.md) | Unsigned to Signed Conversion Error | [09 · Subtraction](../salterden_bilgisayara/09_subtraction.md#-güvenlik-köprüsü) | 📄 |
| [**CWE-839**](./cwe_839.md) | Numeric Range Comparison Without Minimum Check | [09 · Subtraction](../salterden_bilgisayara/09_subtraction.md#-güvenlik-köprüsü) | 📄 |
| [**CWE-195**](./cwe_195.md) | Signed to Unsigned Conversion Error | [09 · Subtraction](../salterden_bilgisayara/09_subtraction.md#-güvenlik-köprüsü) | 📄 |

**Üçü bir zincir.** 09'un Güvenlik Köprüsü'ndeki örnekte aynı sayı üç kez farklı
sözleşmeyle okunuyor: değişkene girerken [196](./cwe_196.md), kontrolde
[839](./cwe_839.md), kullanımda [195](./cwe_195.md). Her birinin kendi sayfasında
mekanizması, gerçek vakaları ve nasıl önlendiği var.

**🔗 Exploit tarafı:** Aynı ailenin gerçek seviyelerde nasıl istismar edildiği →
[binary_exploitation/11 · Integer Bug'ları](../binary_exploitation/11_integer_bug_truncation_signedness.md)
(truncation, signed/unsigned bypass, `×4` wraparound · Utumno 4/6, Maze 7)

### Ünite 3 — Karar Vermek ve Yönlendirmek

10 ve 11'de henüz doğrudan bir CWE yok. 10'da söz verilen taşma bayrağı (OF)
Condition seviyesinde gelecek; karşılaştırma hataları da onunla birlikte.

### Yolda — ALU Ünitesi ve Sonrası

🔜 Bunlar plan. Dersler yazıldıkça kesinleşecek, gerekirse değişecek.

| Nerede | CWE | Resmî adı | Neden orada |
|---|---|---|---|
| Logic Unit | **CWE-480** | Use of Incorrect Operator | Bit maskesi yerine mantık işlemi: `&` yerine `&&` |
| Arithmetic Unit | **CWE-193** | Off-by-one Error | Bir artırma/azaltma ve sınırlar: `<` mi, `<=` mi |
| ALU | **CWE-1242** | Inclusion of Undocumented Features or Chicken Bits | Kimsenin tanımlamadığı kontrol biti kombinasyonları |
| Condition | **CWE-697** | Incorrect Comparison | Karşılaştırma = çıkarma + işarete bakma; taşma işareti yanıltır |
| Bellek ünitesinden sonra | **CWE-416** | Use After Free | Geri verilmiş belleği kullanmaya devam etmek |
| Saat (clock) | **CWE-1298** | Hardware Logic Contains Race Conditions | Sinyallerin farklı hızda ilerlemesi |

---

## Binary Analizi & RE (Leviathan)

| Ders | CWE | Resmî adı | |
|---|---|---|---|
| [Leviathan'ın Dersleri · Ders 3](../leviathan_komutlari/leviathan_ne_ogretiyor.md#ders-3--komut--argüman-enjeksiyonu-system) | **CWE-78** | Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection') | 📖 leviathan2 |
| [Leviathan'ın Dersleri · Ders 5](../leviathan_komutlari/leviathan_ne_ogretiyor.md#ders-5--sembolik-link-saldırısı--güvensiz-tmp) | **CWE-59** | Improper Link Resolution Before File Access ('Link Following') | 📖 leviathan5 |
| Aynı ders + [binary_exploitation/07](../binary_exploitation/07_sembolik_link.md#toctou-açığı-nedir) | **CWE-367** | Time-of-check Time-of-use (TOCTOU) Race Condition | 📖 Leviathan'da kısaca, 07'de ayrıntılı *(07'de numarası geçmiyor)* |

---

## Henüz Eşlenmeyenler

**Web Güvenliği** ve **Binary Exploitation** serilerindeki dersler de doğrudan
CWE'lere karşılık geliyor: command injection, SQL injection, format string, path
traversal gibi. Bu derslerin eşlemesi henüz yapılmadı; yapıldıkça bu sayfaya
eklenecek.

---

## 🔗 İlgili Konular

- [08.5_sayac_basa_donunce.md](../salterden_bilgisayara/08.5_sayac_basa_donunce.md) — Taşmanın matematiği: `ℤ/2ⁿℤ`, hata kümesi, doğru kontrolün türetilmesi
- [CWE-680](./cwe_680.md#burada-i̇ki-kutu-var) — 680'in neden bir olay değil tel olduğu: iki kutu modeli
- [KONU_ANLATIMLARI.md](../KONU_ANLATIMLARI.md) — Tüm konu indeksi

---

*Numaralar ve resmî adlar MITRE'nin CWE listesinden alınmıştır: [cwe.mitre.org](https://cwe.mitre.org).*
