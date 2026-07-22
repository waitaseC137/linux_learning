# 🗣️ x86 Assembly — İlk Etkileşimli Program: İsim Sor, Selamla

> 17'de büyük eşiği geçtik: program ilk kez **konuştu** (`sys_write` ile ekrana "Merhaba Dünya"). Ama konuşma tek yönlüydü — program söyledi, sen dinledin. Gerçek bir etkileşim için ikinci yarı lazım: programın **seni dinlemesi.**
> Bu ders bir kilometre taşı. Burada yeni çok az şey var; asıl iş, kursun başından beri topladığın parçaları — bellek, register, `mov`, sistem çağrısı — **tek bir gerçek programda** birleştirmek. Sonunda elinde, sana bir soru sorup cevabına göre karşılık veren, sıfırdan senin yazdığın bir program olacak.

> **Bu derste kod var ve hepsini çalıştırıyoruz.** Aşağıdaki program ve çıktısı gerçek: kendi makinemde derleyip koşturdum (girdiyi klavyeden verdim).

---

## 📋 İçindekiler

- [Eksik Parça: Girdi Okumak — `sys_read`](#eksik-par%C3%A7a-girdi-okumak--sys_read)
- [Girdinin Yeri: `section .bss`](#girdinin-yeri-section-bss)
- [Hepsini Birleştir: İsim Soran Program](#hepsini-birle%C5%9Ftir-i%CC%87sim-soran-program)
- [Ne Kadar Okundu? `eax`'in Dönüşü](#ne-kadar-okundu-eaxin-d%C3%B6n%C3%BC%C5%9F%C3%BC)

---

## Eksik Parça: Girdi Okumak — `sys_read`

17'de sistem çağrısı tablosunda üç numara görmüştük: `1` çık, `4` yaz, ve henüz kullanmadığımız `3` — **`sys_read`** (oku). Ekrana yazmayı öğrendin; şimdi tersi: klavyeden **okumak.**

`sys_read`, `sys_write`'ın **ayna görüntüsüdür.** Aynı üç argüman, ama yön ters:

| | `sys_write` (yaz) | `sys_read` (oku) |
|---|---|---|
| `eax` | 4 | **3** |
| `ebx` (nereye/nereden) | 1 = ekran (stdout) | **0 = klavye (stdin)** |
| `ecx` | yazılacak verinin adresi | **okunanın konacağı adres** |
| `edx` | kaç byte yazılacak | **en fazla kaç byte okunacak** |

Yani `sys_read`: "`0` numaralı yerden (klavye), en fazla `edx` byte oku, `ecx`'in gösterdiği yere koy." Kullanıcı bir şey yazıp Enter'a basınca, o yazı senin belirttiğin bellek bölgesine dolar.

> 🔑 `sys_read` (eax=**3**) = klavyeden okumak; `sys_write`'ın aynası. `ebx=0` (klavye/stdin), `ecx` = okunanın **konacağı** adres, `edx` = en fazla kaç byte. Kullanıcının yazdığı, `ecx`'teki belleğe dolar.

---

## Girdinin Yeri: `section .bss`

Küçük bir sorun: `sys_read` okuduğunu bir yere koyacak — ama nereye? Bize **boş**, önceden ayrılmış bir bellek bölgesi lazım (bir "tampon", buffer). 08'deki `section .data`'yı kullanabilirdik ama o, **baştan değeri belli** veriler içindir (`db "Merhaba"` gibi). Girdi tamponunun ise başlangıç değeri yok — sadece "bana 32 byte'lık boş yer ayır" demek istiyoruz.

Bunun için ayrı bir bölüm var: **`section .bss`** — başlangıç değeri olmayan, sadece **yer ayrılan** bellek. İçine `resb` ("reserve bytes") ile boşluk istersin:

```nasm
section .bss
    isim:    resb 32        ; 'isim' diye 32 byte'lık boş tampon ayır
```

`resb 32`, "32 byte boş yer, adı `isim`" demektir. `db` gibi içine bir şey yazmaz — `sys_read` gelip dolduracağı boş bir defter sayfası açar sadece.

> 🔑 Başlangıç değeri belli veri → `section .data` (`db`, 08). Boş, doldurulacak tampon (girdi için) → `section .bss` (`resb N` = N byte boş yer ayır). Girdi tamponu `.bss`'e gider çünkü baştan içi boştur.

---

## Hepsini Birleştir: İsim Soran Program

Şimdi parçaları birleştirelim. Programın planı düz Türkçe:

1. Ekrana **"Adın ne? "** yaz. (`sys_write`, 17)
2. Klavyeden ismi **oku**, tampona koy. (`sys_read`)
3. Ekrana **"Merhaba, "** yaz.
4. Okunan **ismi** geri yaz.
5. Çık. (`sys_exit`, 17)

`selam.asm`:

```nasm
section .data
    soru:    db "Adın ne? "
    soru_uz  equ $ - soru
    selam:   db "Merhaba, "
    selam_uz equ $ - selam

section .bss
    isim:    resb 32            ; girdi için boş tampon

section .text
    global _start
_start:
    ; 1) soruyu yaz
    mov eax, 4
    mov ebx, 1
    mov ecx, soru
    mov edx, soru_uz
    int 0x80

    ; 2) ismi oku
    mov eax, 3              ; sys_read
    mov ebx, 0              ; klavye
    mov ecx, isim           ; tampona koy
    mov edx, 32             ; en fazla 32 byte
    int 0x80
    mov esi, eax            ; okunan byte sayısını sakla (aşağıda açıklanıyor)

    ; 3) "Merhaba, " yaz
    mov eax, 4
    mov ebx, 1
    mov ecx, selam
    mov edx, selam_uz
    int 0x80

    ; 4) ismi geri yaz (tam okunan kadar)
    mov eax, 4
    mov ebx, 1
    mov ecx, isim
    mov edx, esi            ; okunan byte sayısı
    int 0x80

    ; 5) çık
    mov eax, 1
    mov ebx, 0
    int 0x80
```

Yeni tek satır `mov esi, eax` (birazdan). Gerisi tanıdık: dört sistem çağrısı, aralarına serpiştirilmiş `mov`'lar. Çevir, çalıştır ve **sana soru sorunca ismini yaz:**

```
nasm -f elf32 selam.asm -o selam.o
ld -m elf_i386 selam.o -o selam
./selam
```

```
Adın ne? Ada
Merhaba, Ada
```

(Yukarıda `Ada` senin yazdığın; program onu okuyup selamladı.) **İşte bu.** Kursun başında "bilgisayar bir kutu" idi; şimdi o kutuya sıfırdan, tek tek komutlarla, sana soru sorup cevabına göre karşılık veren bir program yazdın. Sana bir şey soran, dinleyen, cevaplayan — küçük ama **tam** bir etkileşim.

---

## Ne Kadar Okundu? `eax`'in Dönüşü

O açıklamadığım `mov esi, eax` satırına dönelim, çünkü küçük ama önemli bir inceliği çözüyor. İsimler farklı uzunlukta: "Ada" 3 harf, "Rüzgar" daha uzun. İsmi geri yazarken `edx`'e (kaç byte) ne koyacağız? Sabit bir sayı yazarsak ya ismi keser ya da fazlasını (tampondaki çöpü) basarız.

İşte hüner: **sistem çağrıları bir sonuç döndürür, ve o sonuç `eax`'e gelir** (16'daki "dönüş değeri eax'te" kuralını hatırla — burada da öyle). `sys_read` bittiğinde `eax`, **kaç byte okuduğunu** söyler. Biz de onu hemen `esi`'ye saklıyoruz (`mov esi, eax`), sonra ismi yazarken `edx = esi` diyoruz — böylece **tam kullanıcının yazdığı kadar**, ne eksik ne fazla. `esi` de `eax`, `ebx` gibi genel amaçlı bir register — 04.5'te tanıştığın o avucun bir üyesi, ilk kez burada işimize yaradı. Peki neden tam `esi`? Çünkü hemen ardından gelen `sys_write` `mov eax, 4` yapıp o değeri **ezecek** — okuma sonucu `eax`'te kalsaydı kaybolurdu. `esi`'ye ise iki çağrı arasında hiç dokunmuyoruz, sayı orada güvende bekliyor. Dokunmadığın başka bir register de olurdu; mesele `eax`'ten çıkıp sağlam bir yere koymak.

```nasm
    int 0x80            ; sys_read
    mov esi, eax        ; eax = okunan byte sayısı → sakla
    ...
    mov edx, esi        ; geri yazarken: tam o kadar byte
```

Bu yüzden çıktıda isimden sonra alt satıra da geçtik: kullanıcı Enter'a basınca o satır-sonu (`10`) da okunan byte'lara dâhil oldu (17'deki `10`), `sys_read` onu da saydı, biz de geri yazınca imleç alt satıra indi. Yani davranış "tesadüf" değil — `eax`'in döndürdüğü sayıyı dürüstçe kullanmanın sonucu.

> 🔑 Sistem çağrısı da bir **dönüş değeri** verir, `eax`'te (16'nın kuralı). `sys_read` için bu = **kaç byte okundu.** Onu saklayıp (`mov esi, eax`) geri yazarken uzunluk olarak kullanınca, girdi ne uzunlukta olursa olsun tam onu basarsın. (Kullanıcının Enter'ı = son byte, o da sayılır.)

> 💡 **Aklınıza takılabilir:** *"Bu program 'gerçek' mi, yoksa hâlâ oyuncak mı?"* Küçük ama gerçek. İçinde profesyonel bir programın bütün iskeleti var: kullanıcıdan girdi al, belleğe koy, işle, sonucu bas. Eksik olan tek şey **ölçek** — hata kontrolü, daha çok özellik, daha büyük yapı. Ama temel döngü (gir→işle→çık) tam olarak bu. Buradan sonrası "daha fazlası", "farklı" değil.

---

## Özet — Aklında Tut

```
☐ sys_read (eax=3) = klavyeden oku; sys_write'ın aynası. ebx=0 (klavye), ecx=nereye konacak, edx=en fazla kaç byte.
☐ Boş girdi tamponu → section .bss:  isim: resb 32  (32 byte boş yer). (Dolu veri .data/db; boş tampon .bss/resb.)
☐ Etkileşim iskeleti: yaz(soru) → oku(cevap) → yaz(karşılık) → çık. Dört syscall, aralarında mov'lar.
☐ Sistem çağrısı DÖNÜŞ değeri eax'te (16). sys_read → okunan byte sayısı. Sakla (mov esi,eax), geri yazarken edx=esi.
    → Girdi hangi uzunlukta olursa olsun tam onu basarsın (Enter'ın newline'ı da sayılır → alt satıra geçer).
☐ Doğrulanan: "Adın ne? " → kullanıcı "Ada" yazar → "Merhaba, Ada". Değişken uzunlukta isimlerle çalışır.
☐ KİLOMETRE TAŞI: sıfırdan, tek tek komutlarla, sana soru sorup cevaplayan tam bir etkileşimli program yazdın.
```

---

## 🔗 İlgili Konular

- [17_sistem_cagrilari.md](./17_sistem_cagrilari.md) — `sys_write`, `int 0x80` ve syscall tablosu; bu ders onun `sys_read` yarısını ekleyip ikisini birleştirir
- [16_calling_convention.md](./16_calling_convention.md) — "Dönüş değeri eax'te" kuralı; `sys_read`'in okunan-byte sayısını eax'te döndürmesi bunun ta kendisi
- [08_mov_ve_bellek.md](./08_mov_ve_bellek.md) — `section .data`, etiket ve adres; `.bss`/`resb` onun "boş yer ayır" kardeşi
- [06_ilk_gercek_program.md](./06_ilk_gercek_program.md) — İlk "hiçbir şey yapmayan" programdan buraya: artık program soruyor, dinliyor, cevaplıyor

---

**Önceki konu:** [17_sistem_cagrilari.md](./17_sistem_cagrilari.md)
**Sonraki konu:** [19_c_ile_assembly_koprusu.md](./19_c_ile_assembly_koprusu.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
