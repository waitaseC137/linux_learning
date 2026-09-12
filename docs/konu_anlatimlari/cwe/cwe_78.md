# 👾 CWE-78 — OS Command Injection

> **İşletim sistemi komut enjeksiyonu.** Program, bir komut satırını dışarıdan
> gelen veriyle **birleştirerek** kuruyor ve kabuğa veriyor. Kabuk o satırı okurken
> veriyi veri sanmıyor — komutun bir parçası sayıyor.

| | |
|---|---|
| **Resmî ad** | Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection') |
| **Üst sınıf** | CWE-77 — Command Injection (genel, işletim sistemiyle sınırlı değil) |
| **Akrabası** | CWE-88 — Argument Injection |
| **Nerede karşına çıkar** | [Leviathan · Ders 3](../leviathan_komutlari/leviathan_ne_ogretiyor.md#ders-3--komut--argüman-enjeksiyonu-system) · [web_guvenligi/07](../web_guvenligi/07_command_injection.md) |

---

## Kök Sebep: Veri ile Komutun Aynı Kanalda Gitmesi

Bir kabuk komutu düz bir metindir. Program şöyle bir metin kuruyor:

```
"/bin/cat " + kullanıcıdan_gelen
```

Programın kafasında bu iki parça: **komut** ve **veri**. Ama kabuğa tek bir metin
olarak gidiyor, ve kabuk o metni kendi kurallarıyla ayrıştırıyor. Kabuğun
kurallarında boşluk argümanları ayırır, `;` komutları ayırır, `|` çıktıyı
yönlendirir. Kabuk, hangi karakterin "senin verinden" geldiğini bilmez.

> 🔑 Bu ailenin bütün üyeleri aynı kök cümleyi paylaşır: **veri ile komut aynı
> kanaldan gidiyor.** SQL enjeksiyonu da bu cümledir, format string de. Fark ettiğin
> an, savunmanın ne olması gerektiği de çıkar: **kanalları ayır.**

MITRE bu zayıflığın iki alt biçimini ayırıyor:

| biçim | ne olur |
|---|---|
| **Argüman enjeksiyonu** | Program hangi programı çalıştıracağını biliyor, ama argümanları temizlemiyor |
| **Tam komut denetimi** | Kullanıcı hangi programın çalışacağına karar edebiliyor |

İkincisi daha yıkıcı, birincisi daha yaygın. Leviathan 2'de karşılaştığın
birincisidir: program `cat` çalıştıracağını biliyordu, sadece argümanın nereye
kadar uzandığını bilmiyordu.

---

## Neden Filtrelemek Zayıf Bir Savunma

İlk akla gelen çözüm tehlikeli karakterleri yasaklamaktır. Kayıtlı vakalar bunun
neden kırılgan olduğunu gösteriyor — MITRE'nin tablosundan iki satır:

| CVE | Ne olmuş |
|---|---|
| **CVE-2024-44335** | Filtre kabuk karakterlerinin yalnızca **bir kısmını** denetliyor; geri kalanlar açık kalıyor |
| **CVE-2024-6091** | Yol adında `/./` dizisine izin veren **eksik yasak listesi** enjeksiyona yol açıyor |

Sorun şu: yasak listesi, **saymayı unuttuğun her şeye izin verir.** Kabuğun özel
karakter kümesi kabuktan kabuğa, sürümden sürüme değişir. Sen listeyi yazarken
kabuk büyümeye devam eder.

> ⚠️ Bu yüzden yasak liste (*denylist*) değil, **izin listesi** (*allowlist*)
> kullanılır: neyin yasak olduğunu saymak yerine neyin serbest olduğunu say.
> Listenin dışı kapalıdır — unuttuğun şey de kapalı kalır.

---

## Asıl Savunma: Kanalı Ayır

MITRE'nin tasarım önerilerinin başında şu var ve tek başına bu ailenin büyük
kısmını kapatır:

> **Tek metin alan çağrıları bırak, dizi alanları kullan.**

```c
system("/bin/cat " + ad);          //  ✗  tek metin — kabuk ayrıştırır
execv("/bin/cat", (char*[]){"cat", ad, NULL});   //  ✓  argümanlar AYRI
```

Fark şurada: `execv` kabuğu hiç çağırmaz. Argümanlar diziye yerleştirildiği için
`ad` içinde boşluk, `;` ya da `|` olması hiçbir şeyi değiştirmez — o karakterler
artık ayraç değil, sadece dosya adının harfleri.

> 💡 Bu, Leviathan Ders 3'teki savunmanın ta kendisi. Ve deseni tanı: enjeksiyon
> ailesinin her üyesinde doğru çözüm aynı biçimdedir — SQL'de hazır ifadeler
> (*prepared statements*), kabukta argüman dizisi. Hepsi **veriyi kanalın dışına
> çıkarmak** demek.

Üstüne eklenenler:

- **Harici süreç yerine kütüphane çağrısı.** Dosya kopyalamak için `cp`
  çalıştırmak yerine dosya API'sini kullan; ortada komut yoksa enjeksiyon da yok.
- **En az yetki.** Enjeksiyon olursa saldırgan, sürecin yetkisini devralır.
  Sürecin yetkisi düşükse hasar da düşüktür.
- **Hapsetme.** chroot, AppArmor, SELinux — süreç kaçsa bile hareket alanı dar.

---

## Bu Sınıf Neden Hâlâ Yaşıyor

CWE-78'in kayıtlı ilk örneği **CVE-1999-0067**: bir CGI telefon rehberi
programının boru (`|`) karakterini temizlememesi. MITRE'nin tablosundaki en yeni
örnekler ise 2024–2025 tarihli ve aralarında kablosuz erişim noktaları, ağ
yapılandırma araçları ve yapay zekâ platformları var (**CVE-2024-52803**: bir LLM
platformunda güvensiz `Popen` kullanımı).

Yirmi beş yılda değişen şey teknoloji, değişmeyen şey kalıp: **bir yerde bir metin
birleştirildi.**

> 🔑 Birkaç vakanın yanında "vahşi doğada istismar edildi" notu var
> (CVE-2020-10987, CVE-2020-9054). Bu sınıf teorik bir risk değil; ev yönlendiricisi
> seviyesindeki cihazlarda fiilen kullanılıyor.

---

## Özet — Aklında Tut

```
☐ Kök sebep: veri ile komut aynı kanaldan gidiyor. Kabuk ikisini ayırt edemez.
☐ İki biçim: argüman enjeksiyonu (yaygın) ve tam komut denetimi (yıkıcı).
☐ Leviathan 2'deki argüman enjeksiyonuydu: cat çalışacağı biliniyordu, sınırı değil.
☐ Yasak liste kırılgandır — saymayı unuttuğun her şeye izin verir.
☐ İzin listesi kullan: listenin dışı kapalı, unuttuğun da kapalı kalır.
☐ Asıl çözüm filtre değil, KANALI AYIRMAK: system() değil execv(), argümanlar dizi.
☐ execv kabuğu hiç çağırmaz; boşluk ve ; artık ayraç değil, sadece harf.
☐ Aynı desen SQL'de hazır ifadeler, format string'de sabit biçim dizesi.
☐ Ortada komut yoksa enjeksiyon da yok — mümkünse kütüphane çağrısı kullan.
☐ En az yetki hasarı sınırlar: saldırgan sürecin yetkisini devralır.
☐ 1999'dan 2025'e teknoloji değişti, kalıp değişmedi: bir yerde bir metin birleşti.
```

---

## 🔗 İlgili Konular

- [Leviathan · Ders 3](../leviathan_komutlari/leviathan_ne_ogretiyor.md#ders-3--komut--argüman-enjeksiyonu-system) — Zayıflığın ilk karşılaştığın hâli
- [web_guvenligi/07 · Command Injection](../web_guvenligi/07_command_injection.md) — Web tarafında aynı sınıf, filtre atlatma örnekleriyle
- [CWE-59](./cwe_59.md) — Aynı derste komşu zayıflık: sembolik bağ takibi
- [binary_exploitation/19](../binary_exploitation/19_setuid_yetki_dususu_ve_p_bayragi.md) — En az yetki ve `execv` ile argüman ayırma
- [👾 CWE Haritası](./README.md) — Bütün CWE'lerin dizini

---

*Numaralar ve resmî adlar MITRE'nin CWE listesinden alınmıştır: [cwe.mitre.org](https://cwe.mitre.org).*
