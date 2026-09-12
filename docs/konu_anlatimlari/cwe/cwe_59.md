# 👾 CWE-59 — Improper Link Resolution Before File Access ('Link Following')

> **Bağ takibi.** Program bir dosyayı **adıyla** açar. Ama ad, dosyanın kendisi
> değildir — başka bir yeri gösteren bir tabela olabilir. Program tabelayı okur ve
> gittiği yeri sorgulamaz.

| | |
|---|---|
| **Resmî ad** | Improper Link Resolution Before File Access ('Link Following') |
| **Üst sınıf** | CWE-706 — Use of Incorrectly-Resolved Name or Reference |
| **Alt türleri** | CWE-61 (UNIX sembolik bağ) · CWE-62 (sabit bağ) · CWE-64/65 (Windows kısayol ve sabit bağ) · CWE-1386 (Windows junction) |
| **Nerede karşına çıkar** | [Leviathan · Ders 5](../leviathan_komutlari/leviathan_ne_ogretiyor.md#ders-5--sembolik-link-saldırısı--güvensiz-tmp) · [binary_exploitation/07](../binary_exploitation/07_sembolik_link.md) |

---

## Ad, Kimlik Değildir

Bir yol (`/tmp/kayit.log`) bir dosyaya işaret etmez — bir **isme** işaret eder.
İsimle dosya arasındaki bağı işletim sistemi kurar, ve o bağ araya girilebilir bir
yerdir.

```
program açar:   /tmp/kayit.log
                      │
                      ▼
             ┌─────────────────┐
             │ sembolik bağ    │ ────►  /etc/parolalar
             └─────────────────┘
                      │
program yazar:  aslında BURAYA
```

Program hiçbir kural çiğnemedi. Açtığı adı doğru açtı; o adın nereye gittiğine
karar veren kendisi değildi.

> 🔑 Zayıflığın kalbi tek cümle: **programın güvendiği şey ad, ama adın işaret
> ettiği yeri başkası belirleyebiliyor.** Dosya izinleri burada seni kurtarmaz —
> program zaten yetkili, ve yetkisiyle gittiği yere gidiyor.

Leviathan 5'te gördüğün hâli bunun en saf biçimiydi: yetkili program `/tmp`'de
**öngörülebilir** bir ad kullanıyordu ve o adın ne olduğunu **hiç kontrol
etmiyordu.**

---

## 59 · 367 · 363 — Üçünü Karıştırma

Burada ince bir ayrım var ve MITRE bunu kendi ilişki tablosunda açıkça yapıyor:

```
CWE-59   →  kontrol HİÇ YOK.        Program bağı sorgusuz takip eder.
CWE-367  →  kontrol VAR, ama yarış kaybedilir (TOCTOU).
CWE-363  →  ikisinin birleşimi: yarışı kazanıp araya BAĞ koymak.
```

> ⚠️ **CWE-59 ile [CWE-367](./cwe_367.md) doğrudan akraba değildir.** İkisini
> bağlayan ayrı bir numara var: **CWE-363 — Race Condition Enabling Link
> Following**, MITRE'de 59'un *CanFollow* ilişkisinde duruyor.
>
> Pratikte ayrım şu: bağ zaten oradaysa ve program hiç bakmıyorsa **59**. Program
> bakıyor ama baktıktan sonra bağ konuyorsa **363**, ve altındaki yarış mekanizması
> **367**.

---

## MITRE'nin Kayıtlı Örnekleri

Bu zayıflığın yaşı kadar kapsamı da dikkat çekici — 1999'dan bugüne, tek başına
makineden konteynere:

| CVE | Ne olmuş |
|---|---|
| **CVE-1999-1386** | Perl'in bir seçeneği sembolik bağı takip ediyor, dosya üzerine yazılabiliyor |
| **CVE-2004-0217** | Antivirüs güncellemesi, günlük dosyası üzerinden bağ saldırısına açık |
| **CVE-2000-1178** | Metin düzenleyici, kurtarma kopyası oluştururken bağları takip ediyor |
| **CVE-2015-3629** | Konteyner imajındaki bağ saldırısıyla **konteynerden kaçış** |
| **CVE-2021-21272** | "Zip Slip" — imaj kayıt defterinde hedeflenen dizinin **dışına** yazma |

> 💡 Son iki satıra dikkat. 2015'teki vaka, izolasyonun kendisini deliyor:
> konteyner bir sınır sanılıyordu, bağ o sınırın altından geçti. Ve kalıp yirmi
> yılda hiç değişmedi — değişen sadece "dosya"nın ne olduğu: önce günlük dosyası,
> sonra konteyner katmanı, sonra arşiv içeriği.

---

## Nasıl Önlenir

Savunmanın tamamı tek fikre dayanıyor: **adı açmadan önce değil, açtıktan sonra
doğrula** — ya da hiç izin verme.

- **`O_NOFOLLOW`.** Açma çağrısına bu bayrağı ver; yol son adımda bir sembolik bağsa
  açma başarısız olur. Sorgu yerine yasak.
- **Öngörülemez ad.** `mkstemp()` gibi çağrılar dosyayı **atomik olarak** ve tahmin
  edilemez bir adla oluşturur. Saldırgan önceden oraya bağ koyamaz, çünkü adı
  bilemez.
- **Paylaşılan dizin kullanma.** `/tmp` herkese açıktır. Kullanıcıya özel, izinleri
  dar bir dizin bu sınıfın büyük kısmını kapatır.
- **İşten önce yetkiyi düşür.** Program kök yetkisiyle yazmıyorsa, bağ nereyi
  gösterirse göstersin oraya yazamaz ([19. ders](../binary_exploitation/19_setuid_yetki_dususu_ve_p_bayragi.md)).
- **Ayrıcalığı bölmek.** MITRE'nin vurguladığı tasarım ilkesi: en az yetki + korunan
  bölgeler. Programın yazabildiği yer ile hassas dosyaların durduğu yer aynı
  havuzda olmasın.

---

## Özet — Aklında Tut

```
☐ Ad, kimlik değildir. Yol bir dosyayı değil, bir ismi gösterir.
☐ Program kural çiğnemiyor; açtığı adı doğru açıyor, adın nereye gittiğini bilmiyor.
☐ Dosya izinleri kurtarmaz — program zaten yetkili, yetkisiyle gittiği yere gidiyor.
☐ Leviathan 5 en saf hâliydi: öngörülebilir ad + hiç kontrol yok.
☐ 59 = kontrol hiç yok · 367 = kontrol var yarış kaybedildi · 363 = ikisi birden.
☐ MITRE'de 59 ile 367 doğrudan akraba DEĞİL; bağlayan numara 363.
☐ Alt türleri var: sembolik bağ, sabit bağ, Windows kısayolu, junction.
☐ Kalıp 1999'dan 2021'e aynı; değişen sadece "dosya"nın ne olduğu (konteyner, arşiv).
☐ Savunma: O_NOFOLLOW · mkstemp ile öngörülemez ad · paylaşılan dizinden kaçın.
☐ Ve en sağlamı: işten önce yetkiyi düşür — yazamayan program yanlış yere de yazamaz.
```

---

## 🔗 İlgili Konular

- [CWE-367](./cwe_367.md) — Kontrol var ama yarış kaybediliyor: TOCTOU
- [CWE-78](./cwe_78.md) — Aynı derste komşu zayıflık: komut enjeksiyonu
- [Leviathan · Ders 5](../leviathan_komutlari/leviathan_ne_ogretiyor.md#ders-5--sembolik-link-saldırısı--güvensiz-tmp) — İlk karşılaşma
- [binary_exploitation/07 · Sembolik Link](../binary_exploitation/07_sembolik_link.md) — Mekanizmanın ayrıntılı anlatımı
- [binary_exploitation/19 · setuid](../binary_exploitation/19_setuid_yetki_dususu_ve_p_bayragi.md) — Yetki düşürmenin nasıl yapıldığı
- [👾 CWE Haritası](./README.md) — Bütün CWE'lerin dizini

---

*Numaralar ve resmî adlar MITRE'nin CWE listesinden alınmıştır: [cwe.mitre.org](https://cwe.mitre.org).*
