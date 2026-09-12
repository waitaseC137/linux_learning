# capa-denetle.mjs

Depodaki bütün `.md` dosyalarının **iç bağlantılarını** denetler: hedef dosya var
mı, ve `#çapa` kısmı gerçekten bir başlığa denk geliyor mu.

```sh
node scripts/capa-denetle.mjs            # depo kökü (docs/ aynası atlanır)
node scripts/capa-denetle.mjs docs/eng   # sadece İngilizce taraf
node scripts/capa-denetle.mjs docs       # ayna + İngilizce, hepsi birden
```

Çıktı: kırık her bağlantı için `dosya:satır` ve sebep, sonunda toplam sayı.

> **İş bitince üçünü de çalıştır.** Argümansız çağrı `docs/` klasörünü atlar;
> İngilizce taraf orada yaşadığı için aylarca denetim dışında kaldı ve 13 kırık
> bağlantı birikti (2026-09-12'de kapatıldı).

## Neden gerekli

Site, başlıkları `docs/assets/konular.js` içindeki `slug()` ile çapaya çeviriyor.
Bu betik **o fonksiyonu dosyadan okuyup aynen kullanıyor** — yani kendi kuralını
uydurmuyor, sitenin kuralını ödünç alıyor. GitHub da aynı davranışı sergiliyor
(github-slugger).

Dikkat edilen incelikler:
- Kod bloğu (``` ile) içindeki `#` satırları başlık sayılmaz
- Başlıktaki `` ` `` ve `*` işaretleri soyulur, `_` **soyulmaz**
- Aynı slug tekrarlarsa `-1`, `-2` eklenir (GitHub böyle yapıyor)
- Bağlantılar `decodeURIComponent` ile çözülür (`%C4%B1` → `ı`)

## Çapayı elle yazma — üç tuzak

Üçü de aynı sebepten: `toLowerCase()` Türkçe bilmiyor, Unicode kuralı uyguluyor.
Bu yüzden **çapa tahmin edilmez, hesaplatılır.**

**1. `İ` küçülünce iki karakter olur.** `İ` → `i` + birleşen nokta (U+0307).
`## Burada İki Kutu Var` başlığının çapası `#burada-i̇ki-kutu-var`'dır — gözle
bakınca `#burada-iki-kutu-var` ile aynı görünür ama değildir.

**2. Büyük `I` küçülünce NOKTALI olur.** Bir öncekinin aynası: `I` → `i`.
`## Neden "YARIM" Toplayıcı?` başlığının çapası `#neden-yarim-toplayıcı` —
*yarim*, `yarım` değil. Başlıkta büyük harfle yazılmış Türkçe kelime varsa şüphelen.

**3. Emojinin görünmez kuyruğu var.** `🕳️` aslında iki karakter: delik (U+1F573)
ve U+FE0F "bunu emoji olarak çiz" işareti. `slug()` birleşen işaretleri koruduğu
için emoji silinir ama **kuyruk çapada kalır**. `🏴` `👾` `🌀` gibi kuyruksuz
emojilerde sorun yok; `🕳️` `🗺️` `🛠️` gibi kuyruklularda çapa bozulur.
Çözüm: başlıktan U+FE0F'i çıkar.

## Slug'ı hesaplatmanın kısa yolu

```sh
node -e 'const s=process.argv[1].toLowerCase().trim().replace(/[^\p{L}\p{N}\p{M}_\s-]/gu,"").replace(/\s/g,"-");console.log("#"+s)' "Başlık Metni"
```

Başlıktaki `` ` `` ve `*` işaretlerini metinden çıkarıp ver (betik de öyle yapıyor).

## Yeri

`sync-docs.sh` ile aynı rafta duruyor — ikisi de depo bakım aracı.
