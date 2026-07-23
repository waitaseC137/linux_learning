# 🗂️ x86 Assembly — mov ve Bellek: `[...]` ile Kutulara Uzanmak

> 04'te işçinin **depo–cep dansını** çizmiştik: AL (bellekten cebe), İŞLE (cepte), BIRAK (cepten belleğe). Ama o zaman "gerçek komutları Ünite 1'de göreceğiz" demiştik.
> İşte o an: bu derste **AL** ile **BIRAK**'ı gerçek komutla — yine `mov` ile — yapıyoruz.

> Ve 04'te bir tohum ekmiştik: *bir kutu, başka bir kutunun adresini tutabilir* (pointer). "Onu gerçekten takip etmeyi 08'e bırakıyoruz" demiştik.
> Bugün o sözü de tutuyoruz: ilk kez bir **pointer'ı takip edip** gösterdiği yerdeki değeri alacaksın. Yeni tek şey küçük bir işaret: **`[...]`**.

---

## 📋 İçindekiler

- [`[...]`: Adresteki Kutu](#-adresteki-kutu)
- [Belleğe Bir Kutu Koymak: `section .data`](#belle%C4%9Fe-bir-kutu-koymak-section-data)
- [AL: Bellekten Register'a](#al-bellekten-registera)
- [BIRAK: Register'dan Belleğe](#birak-registerdan-belle%C4%9Fe)
- [İlk Pointer Takibi](#i%CC%87lk-pointer-takibi)

---

## `[...]`: Adresteki Kutu

Şimdiye kadar `mov`'un iki hâlini gördün (06): `mov eax, 5` (kutuya sayı) ve `mov ebx, eax` (kutudan kutuya). İkisinde de kaynak ve hedef birer **register**'dı — işçinin cebindeki kutular. Ama işin çoğu **depoda** (bellekte) durur; oraya nasıl uzanacağız?

Cevap tek bir işaret: **köşeli parantez, `[...]`.** Kuralı şu kadar basit:

- Parantezsiz bir sayı/isim → **değerin kendisi.** `mov eax, 5` = "eax'e 5 koy."
- Parantez içinde → **"o adresteki kutunun içi."** `mov eax, [5]` = "5 numaralı **kutuya git**, oradaki değeri eax'e koy."

İşte 04'teki adres/değer ayrımının gerçek komuttaki hâli bu. Parantez, işçiye "bu bir adres — oraya git, oradakini al" demenin yolu. Parantezi "→ oraya git" oku çevir gibi düşün: `[sayi]` = "sayi'nin *gösterdiği yere* git."

Bir uyarı: buradaki `[5]` sadece **fikri** gösteriyor — 5 gerçek, sana ait bir adres değil. Bunu tek başına bir programda çalıştırmayı deneme; çekirdek "orası senin değil" deyip programı durdurur. Az sonra `[sayi]` ile aynı işi *izinli* bir adres üzerinde gerçekten yapacağız.

> 🔑 `[...]` = "bu bir adres, oraya git ve oradaki değeri kullan." Parantezsiz = değerin kendisi; parantezli = o adresteki kutunun içi. 04'teki adres/değer ayrımının komuttaki karşılığı budur.

---

## Belleğe Bir Kutu Koymak: `section .data`

Bellekten okuyabilmek için önce bellekte **bir şeyimiz** olmalı. Şimdiye kadar programlarımız yalnızca `section .text` (kod bölümü) kullanıyordu. Verilerimizi koymak için ikinci bir bölüm var: **`section .data`.**

```nasm
section .data
    sayi:  dd 42
```

Satır satır:
- `section .data` → "buradan sonrası **veri**, kod değil."
- `sayi:` → belleğe koyduğumuz kutuya taktığımız **etiket** (isim). Aslında `sayi`, o kutunun **adresidir** — sen sayı olan adresi ezberleme diye ona okunur bir ad veriyoruz.
- `dd 42` → **d**efine **d**word: "4 byte'lık (bir register kadar; bkz. 04) yer aç, içine 42 koy." (`db` = 1 byte, `dw` = 2 byte, `dd` = 4 byte.)

Yani `sayi: dd 42`, belleğe **"sayi" adında, içinde 42 yazan 4 baytlık bir kutu** demektir. Artık koda `[sayi]` yazınca işçi "sayi'nin adresine git, oradaki değeri al" diye anlayacak.

> 💡 **Aklınıza takılabilir:** *"`sayi` bir adres dedin ama ben `42` yazdım — hangisi?"* İkisi ayrı, tıpkı 04'teki gibi: `sayi` kutunun **yeri** (adres), `42` kutunun **içi** (değer). Kodda `sayi` yazarsan adresi, `[sayi]` yazarsan içindeki 42'yi kastedersin. Birazdan gdb'de ikisini de göreceğiz — adres koca bir sayı, değer ise 42.

---

## AL: Bellekten Register'a

04'ün **AL** adımı: depodaki bir kutuyu cebe çek. Gerçek komutu:

```nasm
mov eax, [sayi]        ; "sayi'nin adresine git, oradaki değeri eax'e koy"
```

Tam bir programla deneyelim. `bellek.asm`:

```nasm
section .data
    sayi:  dd 42

section .text
    global _start

_start:
    mov eax, [sayi]         ; AL: bellekten oku → eax = 42
    mov dword [sayi], 99    ; BIRAK: belleğe yaz → sayi artık 99
    mov eax, [sayi]         ; tekrar oku (kanıt) → eax = 99
    mov ebx, eax            ; sonucu çıkış koduna
    mov eax, 1
    int 0x80
```

Derle ve gdb'de aç (07'deki alışkanlık):

```
nasm -f elf32 bellek.asm -o bellek.o
ld -m elf_i386 bellek.o -o bellek
gdb ./bellek
(gdb) set disassembly-flavor intel
(gdb) starti
```

Bu sefer sadece register'a değil, **belleğin kendisine** de bakacağız. Bellek kutusuna bakma komutu **`x`** (*examine*): `x/1dw &sayi` = "sayi'nin adresindeki 1 tane dword'ü onluk göster." (`&sayi` = "sayi'nin adresi"; `d` = onluk göster; `w` = **4 byte'lık dword**.)

> 💡 **Karışmasın:** buradaki `w`, `section .data`'daki `dw` ile **aynı harf ama farklı sözlük.** NASM'de `dw` = 2 byte'tı; gdb'nin `x/…w`'sinde `w` = **4 byte** (dword). Aynı harf, iki alet, iki boyut — burada 4 byte gösteriyor.

```
(gdb) info registers eax
(gdb) x/1dw &sayi
```

Gerçek çıktı — henüz tek komut çalışmadan:

```
eax            0x0                 0
0x804a000:	42
```

`eax` daha `0` (yükleme yapılmadı), ama **bellekteki `sayi`** çoktan `42` — çünkü onu `dd 42` ile biz koyduk. Soldaki `0x804a000` de sayi'nin **adresi** (o koca sayıyı birazdan pointer turunda kullanacağız).

Şimdi `mov eax, [sayi]`'yi çalıştır:

```
(gdb) si
(gdb) info registers eax
```

```
eax            0x2a                42
```

**İşte AL.** `eax` artık `42` (`0x2a`, 03'ten: 42'nin onaltılığı) — değer bellekten cebe geldi. 04'te Türkçe taslak olarak çizdiğimiz "depodan cebe çek" adımını, ilk kez gerçek bir komutla yaptın.

---

## BIRAK: Register'dan Belleğe

Şimdi ters yön — 04'ün **BIRAK** adımı: cepteki (ya da elimizdeki) bir değeri depoya koy. Hedef parantezli (bir adres), kaynak değer:

```nasm
mov dword [sayi], 99        ; "sayi'nin adresine, 99'u yaz"
```

Buradaki `dword` küçük ama gerekli bir ayrıntı: belleğe **doğrudan bir sayı** (99) yazarken işçi "kaç byte yazayım — 1 mi, 4 mü?" diye bilemez (99 hepsine sığar). `dword` ona "4 byte'lık yaz" der. (Kaynak bir register olsaydı — `mov [sayi], eax` — register zaten 4 byte olduğu için bunu yazmana gerek kalmazdı.)

gdb'de kaldığımız yerden devam — bir `si` at, sonra **belleğe** bak:

```
(gdb) si
(gdb) x/1dw &sayi
```

```
0x804a000:	99
```

**İşte BIRAK.** Az önce `42` olan bellek kutusu, şimdi `99`. Belleğin *kendisini* değiştirdiğini gözünle gördün — register değil, depodaki kutu. Kanıt olsun diye bir kez daha okuyalım (`mov eax, [sayi]`):

```
(gdb) si
(gdb) info registers eax
```

```
eax            0x63                99
```

`eax` bu kez `42` değil `99` (`0x63`) — çünkü artık bellekte 99 yazıyor. AL → BIRAK → tekrar AL: 04'ün dansını baştan sona gerçek komutlarla döndün. (Program biterse `echo $?` — fish: `echo $status` — **99** der; çünkü çıkışta `ebx`'e koyduğumuz o 99 okunur.)

> 💡 İleri-not: `x/1dw` ile belleğe "tek büyük sayı" olarak baktık ve düzgün `42`/`99` gördük. Ama o 4 byte belleğe *tek tek* nasıl diziliyor — hangi byte önce? — ilk bakışta tuhaf gelen kendine has bir kuralı var. Bu "aynen ters" sürprizini bir sonraki kısa derste ([08.5_little_endian](./08.5_little_endian.md)) belleğe byte byte bakarak açacağız. Şimdilik "`[sayi]` = oradaki değer" yeter.

---

## İlk Pointer Takibi

Şimdi 04'ün en güçlü tohumunu çiçek açtırıyoruz. Orada demiştik: bir kutu, içinde asıl veriyi değil, asıl verinin **nerede olduğunu** (adresini) tutabilir — buna **pointer** dedik (vestiyer fişi gibi: fiş palton değil, paltonun *yerini* söyler). Ve "birinin gösterdiği yere git"in iki adım olduğunu çizmiştik. Şimdi o iki adımı gerçek komutla atıyoruz.

Anahtar fikir: bir **register**, içinde bir adres tutabilir. Tutuyorsa, o register bir pointer'dır — ve `[...]` ile onu *takip edebiliriz*. `pointer.asm`:

```nasm
section .data
    sayi:  dd 42

section .text
    global _start

_start:
    mov ebx, sayi          ; ebx = sayi'nin ADRESİ (parantez YOK → değer değil, adres)
    mov eax, [ebx]         ; ebx'in gösterdiği yere git, oradakini eax'e al
    mov ebx, eax           ; sonucu çıkış koduna (ebx'in pointer görevi bitti)
    mov eax, 1
    int 0x80
```

İki komuta dikkat, çünkü tüm ders bu ikisinde:
- `mov ebx, sayi` → **parantezsiz.** Yani sayi'nin **adresini** ebx'e koy. Artık ebx bir pointer — içinde bir değer değil, bir *yer* var.
- `mov eax, [ebx]` → **parantezli.** "ebx'in içindeki adrese git, oradaki değeri al." Yani pointer'ı **takip et.**

Derle, gdb'de izle:

```
nasm -f elf32 pointer.asm -o pointer.o
ld -m elf_i386 pointer.o -o pointer
gdb ./pointer
(gdb) set disassembly-flavor intel
(gdb) starti
(gdb) si                       # mov ebx, sayi
(gdb) info registers ebx eax
```

Gerçek çıktı:

```
ebx            0x804a000           134520832
eax            0x0                 0
```

**Bak `ebx`'in içine:** `0x804a000` — koca bir sayı, ama bir **değer** değil, sayi'nin **adresi** (bellekteki yeri). `eax` hâlâ 0. ebx şu an bir pointer: 42'yi değil, 42'nin *nerede olduğunu* tutuyor. Tam 04'teki "5. kutu, 12. kutuyu gösteriyor" resmi — burada ebx, sayi'yi gösteriyor.

Şimdi pointer'ı takip et:

```
(gdb) si                       # mov eax, [ebx]
(gdb) info registers ebx eax
```

```
ebx            0x804a000           134520832
eax            0x2a                42
```

**İşte pointer takibi.** `eax` `42` oldu — ama bu 42'yi doğrudan yazmadık; ebx'in *gösterdiği adrese gidip* oradan aldık. `ebx` hâlâ adresi tutuyor (değişmedi), `eax` ise o adresteki değeri. 04'te "önce 5. kutuya bak (içinde 12), o 12'yi adres oku, 12. kutuya git (asıl değer orada)" demiştik — işte tam olarak bunu yaptın, gerçek komutlarla. (`echo $?` → **42**.)

> 🔑 Pointer = adresini tutan register. `mov ebx, sayi` (parantezsiz) ebx'e **adresi** koyar; `mov eax, [ebx]` (parantezli) o adrese gidip **değeri** alır — yani pointer'ı *takip eder*. Fark tek bir çift köşeli parantez.

> 💡 **Aklınıza takılabilir:** *"`mov eax, [sayi]` de zaten 42 veriyordu. `mov ebx, sayi` + `mov eax, [ebx]` neden lazım — iki komutla aynı sonuç?"* Bu örnekte evet, aynı. Ama fark şu: `[sayi]`'de adres **koda gömülü/sabit.** Pointer'da ise adres bir **register'da**, yani *değiştirilebilir* — ebx'e başka bir adres koyup aynı `[ebx]` komutuyla bambaşka bir kutuya uzanabilirsin. Bir diziyi gezmek, büyük veriyi elden ele adresiyle taşımak (04) hep bununla olur. Sabit `[sayi]` tek kapı; `[ebx]` ise **istediğin kapıyı açan** anahtar.

---

## Özet — Aklında Tut

```
☐ [...] = "bu bir adres, oraya git, oradaki değeri kullan." (04'ün adres/değer ayrımı, komutta.)
    - mov eax, 5      → eax'e 5 (değer)
    - mov eax, [5]    → 5 NUMARALI kutunun içini eax'e
☐ section .data + etiket = belleğe adlandırılmış kutu koymak.
    - sayi: dd 42   → "sayi" adında 4 byte'lık kutu, içinde 42. (db=1, dw=2, dd=4 byte)
    - sayi = adres (kutunun yeri) · [sayi] = değer (kutunun içi).
☐ AL  (bellek → register):  mov eax, [sayi]     → eax = bellekteki değer (42).
☐ BIRAK (register/değer → bellek):  mov dword [sayi], 99  → belleğe yaz.
    - Belleğe DOĞRUDAN sayı yazarken boyut söyle: dword (4 byte). Kaynak register ise gerekmez.
☐ gdb'de belleğe bak:  x/1dw &sayi   → o adresteki dword'ü göster. (&sayi = sayi'nin adresi)
☐ POINTER = adresini tutan register.
    - mov ebx, sayi   (parantezsiz) → ebx = ADRES (pointer).
    - mov eax, [ebx]  (parantezli)  → pointer'ı TAKİP et → eax = o adresteki değer (42).
    - Farkı: [sayi] adresi sabit; [ebx] adresi register'da → değiştirilebilir (asıl güç bu).
```

---

## 🔗 İlgili Konular

- [04_bellek_ve_registerlar.md](./04_bellek_ve_registerlar.md) — AL→BIRAK dansının ve pointer tohumunun (adres/değer) çizildiği yer; bu ders onun gerçek komutları
- [06_ilk_gercek_program.md](./06_ilk_gercek_program.md) — `mov`'un ilk (register'lar arası) hâli
- [07_gdb_tek_adim.md](./07_gdb_tek_adim.md) — Burada belleğe (`x`) ve register'lara canlı bakmak için kullandığımız alet
- 09_aritmetik.md 🚧 *(yazılıyor)* — "İŞLE" adımı: artık sadece taşımak değil, taşıdığın sayılarla hesap yapmak

---

**Önceki konu:** [07_gdb_tek_adim.md](./07_gdb_tek_adim.md)
**Sonraki konu:** [08.5_little_endian.md](./08.5_little_endian.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
