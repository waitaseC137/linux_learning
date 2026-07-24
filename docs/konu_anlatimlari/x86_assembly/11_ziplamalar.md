# 🔀 x86 Assembly — Zıplamalar: İşçiye Karar Verdirmek

> 10'da bayrakları kurduk ama dürüstçe itiraf ettik: **hiçbir şey olmadı.** `cmp` bayrağı açtı, program yine düz düz aşağı aktı. "Bayrak ham maddedir; onu okuyup karar veren komutlar 11'de" demiştik.
> İşte o komutlar: **zıplamalar.** Bu derste, ilk kez, programın yukarıdan-aşağı düz yolunu kıracağız — "eğer şu bayrak açıksa şuraya git, değilse buradan devam et." Bir bilgisayarın "karar vermesi" dediğimiz şey, tam olarak budur.

> **Bu derste kod var ve hepsini çalıştırıyoruz.** Aşağıdaki her program, her çıkış kodu ve her GDB çıktısı gerçek: kendi makinemde derleyip koşturdum.

---

## 📋 İçindekiler

- [Düz Yolu Kırmak: `jmp`](#d%C3%BCz-yolu-k%C4%B1rmak-jmp)
- [Koşullu Zıplama: `jz` ve `jnz`](#ko%C5%9Fullu-z%C4%B1plama-jz-ve-jnz)
- [Sıralamaya Göre Zıpla: `jl` ve `jg`](#s%C4%B1ralamaya-g%C3%B6re-z%C4%B1pla-jl-ve-jg)
- [Bir Araya: Çift mi, Tek mi?](#bir-araya-%C3%A7ift-mi-tek-mi)

---

## Düz Yolu Kırmak: `jmp`

Şimdiye kadar işçi hep aynı şeyi yaptı: en üstteki komuttan başla, **satır satır aşağı** in, en sonda çık. Tek yol, tek yön. İlk kırdığımız kural bu olacak.

En basit zıplama komutu `jmp` (İngilizce *jump*): **"buradan devam etme, şu noktaya git."** Peki "şu nokta"yı nasıl gösteririz? Bir **etiket** ile. Etiketi zaten tanıyorsun: `_start:` bir etiketti — sonundaki iki nokta üst üste (`:`) onu "belleğin bu noktasına bir isim" yapar. Kendi etiketimizi de aynen böyle koyabiliriz.

`atla.asm` — `jmp` ile bir komutun **üstünden atlıyoruz**:

```nasm
section .text
    global _start

_start:
    mov ebx, 1
    jmp bitir          ; düz yolu kır → aşağıyı atla
    mov ebx, 99        ; ATLANIR — bu satıra hiç uğranmaz
bitir:
    mov eax, 1
    int 0x80
```

Mantık şu: `ebx`'e 1 koyuyoruz, sonra `jmp bitir` diyoruz. İşçi doğruca `bitir:` etiketine sıçrar — arada duran `mov ebx, 99` **hiç çalışmaz.** Yani çıkış kodu 99 değil, 1 olmalı. Çevir, çalıştır:

```
nasm -f elf32 atla.asm -o atla.o
ld -m elf_i386 atla.o -o atla
./atla
echo $?
```

```
1
```

**99 gitti, 1 geldi.** `mov ebx, 99` orada, gözünün önünde duruyor — ama çalışmadı, çünkü `jmp` onun üstünden atladı. İlk kez bir komut, programın *hangi komutun sırada olduğunu* değiştirdi.

Bunu 07'deki gibi GDB'de gözünle görelim. İşçinin "şu an neredeyim" göstergesi `eip`'ti (04.5/07); adım adım ona bakalım:

```
gdb ./atla
(gdb) set disassembly-flavor intel
(gdb) starti
(gdb) x/i $eip      # şu an hangi komut?
(gdb) si
(gdb) x/i $eip
(gdb) si
(gdb) x/i $eip
```

Gerçek çıktı:

```
=> 0x8049000 <_start>:      mov    ebx,0x1
=> 0x8049005 <_start+5>:    jmp    0x804900c <bitir>
=> 0x804900c <bitir>:       mov    eax,0x1
```

Adreslere dikkat et. `jmp` `0x8049005`'te. Bir sonraki adımda `eip` `0x804900c`'ye (`bitir`) atladı. Peki aradaki `0x8049007`'de ne vardı? Tam da `mov ebx, 99` (`0x63` = 99). **`eip` oraya hiç uğramadı** — 0x8049005'ten doğrudan 0x804900c'ye. İşte "üstünden atlamak" bu: işçinin adım göstergesi o adresi hiç görmedi.

> 🔑 `jmp etiket` = "sıradaki komutu değiştir: `etiket`'ten devam et." İşçinin "neredeyim" göstergesini (`eip`) zorla o noktaya taşır; arada kalan komutlar **atlanır**, hiç çalışmaz. Etiket = belleğin bir noktasına verdiğin isim (`_start:` gibi).

> ⚠️ `jmp` **koşulsuzdur** — bir bayrağa filan bakmaz, *her zaman* atlar. Tek başına pek işe yaramaz (hatta dikkatsiz kullanılırsa sonsuz döngü yapar). Asıl gücü, birazdan göreceğin **koşullu** kardeşleriyle birlikte gelir: "şartı sağlarsan atla, sağlamazsan düz devam et."

---

## Koşullu Zıplama: `jz` ve `jnz`

`jmp` her zaman atlıyordu. Asıl istediğimiz ise **şarta bağlı** atlamak: "eğer bir önceki sonuç sıfırsa şuraya git." İşte 10'da kurduğumuz bayraklar tam burada devreye giriyor.

İlk koşullu zıplama çifti, doğrudan **ZF**'yi (sıfır bayrağı) okur:

- `jz etiket` → **jump if zero:** ZF açıksa (sonuç sıfırdıysa) atla; değilse düz devam et.
- `jnz etiket` → **jump if not zero:** ZF kapalıysa (sonuç sıfır değildiyse) atla.

Zinciri hatırla — 10'un köprüsü: **`cmp`/`test` kurar → `jz`/`jnz` okur.** Şimdi ikisini yan yana koyup ilk gerçek "karar veren" programı yazalım. `sifirmi.asm` — bir sayının sıfır olup olmadığına göre **farklı** çıkış kodu:

```nasm
section .text
    global _start

_start:
    mov eax, 0
    test eax, eax      ; eax sıfır mı? (10'dan: sıfırsa ZF=1)
    jz  sifir          ; ZF açıksa → 'sifir' etiketine atla
    mov ebx, 200       ; buraya sadece sıfır DEĞİLse gelinir
    jmp bitir
sifir:
    mov ebx, 100       ; buraya sadece SIFIRsa gelinir
bitir:
    mov eax, 1
    int 0x80
```

Yolu takip et: `test eax, eax` bayrağı kurar. Sonra `jz sifir` — eğer ZF açıksa `sifir:`'e atlar (`ebx = 100`); açık değilse atlamaz, düz devam eder (`ebx = 200`, sonra `jmp bitir` ile aşağıdaki `sifir` bloğunu atlar). İki ayrı yol, ikisi `bitir`'de birleşir.

`mov eax, 0` ile (sıfır) çalıştıralım:

```
100
```

Şimdi tek satırı değiştir — `mov eax, 5` (sıfır değil) — yeniden çevir, çalıştır:

```
200
```

**İşte ilk kararın.** Aynı program, tek bir sayı değişince **farklı** davrandı: sıfırsa 100, değilse 200. Programın akışı artık düz bir çizgi değil — girdiye göre **çatallandı**. `test` bayrağı kurdu, `jz` onu okuyup yolu seçti.

> 🔑 `jz` (ZF açıksa atla) ve `jnz` (ZF kapalıysa atla), 10'daki ZF'yi okuyan koşullu zıplamalardır. Kalıp hep aynı: **önce `cmp`/`test` ile bayrağı kur, hemen ardından koşullu zıpla.** Bu ikili, "eğer ... ise" (if) demenin makine dilindeki karşılığıdır.

> 💡 **Aklınıza takılabilir:** *"Eşitlik için `jz` biraz tuhaf isim — 'sıfırsa atla' neden 'eşitse' demek?"* Çünkü `cmp a, b` içeride `a - b` yapıyordu (10); `a == b` ise fark **sıfır**, yani ZF açılır. Demek ki "eşit mi" sorusu aslında "fark sıfır mı" sorusudur. Bu yüzden `jz`'nin bir de **`je`** (*jump if equal*) adı vardır — ikisi **birebir aynı komuttur**, sadece iki farklı okunuşu. Aynı şekilde `jnz` = **`jne`** (*jump if not equal*). `cmp`'ten sonra `je`/`jne`, `test`'ten sonra `jz`/`jnz` yazmak sadece okunurluk tercihidir.

> 💡 **Nerede işine yarar:** bir programın şifre/lisans kontrolünü kırmanın klasik yolu, disassembly'de tam bu `cmp`/`test` + `jz` çiftini bulmaktır — sonra ya `jz`'yi `jnz`'ye çevirir ya da zıplamayı `nop`'larsın; böylece "yanlış şifre" dalı "doğru"ymuş gibi davranır. Yani bugün elle *yazdığın* kalıbı, tersine mühendislik *söker.* Bir "kararı" kırmak = onun dayandığı koşullu zıplamayı değiştirmek. 20'de döneceğimiz binary exploitation'ın da ilk tuğlası bu.

---

## Sıralamaya Göre Zıpla: `jl` ve `jg`

ZF bize yalnız "eşit mi, değil mi" dedirtiyor. Ama çoğu zaman **hangisi büyük** diye sormak isteriz. 10'da bunun için ipucu SF'deydi, ama dürüst bir uyarı bırakmıştık: "hangisi büyük" kuralının, çok büyük sayılardaki bir inceliği var ve onu **elle çözmen gerekmeyecek**, çünkü zıplama komutları doğru bayrak kombinasyonunu kendileri bilir. İşte o komutlar:

- `jl etiket` → **jump if less:** `cmp a, b`'den sonra, `a < b` ise atla.
- `jg etiket` → **jump if greater:** `a > b` ise atla.

(Yanlarında `jle` = "küçük ya da eşit", `jge` = "büyük ya da eşit" de vardır; aynı aile.) Sen sadece `cmp a, b` yazıp `jl`/`jg` dersin; hangi bayrağa nasıl bakılacağı komutun kendi işi.

İki sayının **büyüğünü** bulan bir program yazalım — `enbuyuk.asm`:

```nasm
section .text
    global _start

_start:
    mov eax, 12        ; birinci sayı
    mov ecx, 30        ; ikinci sayı
    cmp eax, ecx       ; eax - ecx  → bayrakları kur
    jg  eax_buyuk      ; eax > ecx ise atla
    mov ebx, ecx       ; buraya gelindiyse büyük olan ecx
    jmp bitir
eax_buyuk:
    mov ebx, eax       ; eax büyükmüş
bitir:
    mov eax, 1
    int 0x80           ; çıkış kodu = büyük olan sayı
```

`cmp eax, ecx` iki sayıyı karşılaştırır (değerlerini bozmadan — 10). `jg` eğer eax büyükse `eax_buyuk`'e atlar (`ebx = eax`); değilse atlamaz, `ebx = ecx` olur. Her iki yol da büyük sayıyı `ebx`'e koyar. `12` ve `30` ile:

```
30
```

Sayıları `mov eax, 40` / `mov ecx, 30` yapıp yeniden çalıştır:

```
40
```

Program her seferinde **büyük olanı** seçti — sen `if (a > b)` mantığını, işçinin diliyle kurdun.

> 🔑 `cmp a, b` + `jl`/`jg` = "a, b'den küçük/büyük mü?" kararı. 10'da bahsi geçen "işaretli karşılaştırma inceliğinin" bir adı var: **taşma (overflow)** — ve `jl`/`jg` doğru bayrak kombinasyonunu senin yerine bilir, sen elle uğraşmazsın. Bu taşmanın tam mekanizması, işaretli aritmetiğin daha derin bir konusu — bu başlangıç serisinin kapsamı dışında kalıyor; sana burada gereken tek şey ismini bilmek, gerisini `jl`/`jg` senin yerine hallediyor. Sen sadece doğru olanı seç: sıralama için `jl`/`jg`/`jle`/`jge`, eşitlik için `je`/`jne`. Kalıp yine aynı: **`cmp` kur, koşullu zıpla.**

---

## Bir Araya: Çift mi, Tek mi?

Şimdi öğrendiklerini tek bir küçük ama gerçek programda birleştirelim: verilen sayı **çift mi tek mi**, çıkış koduna yaz (çift → 0, tek → 1).

Bir sayının çift/tek olduğunu nereden anlarız? 03'ten (ikilik sayılar) bir gerçeği hatırla: bir sayının **en sağdaki (en küçük) biti**, onun tek mi çift mi olduğunu söyler — bit `0` ise çift, `1` ise tek. (Onluk sistemde son rakama bakıp "0,2,4,6,8 çift" dememiz gibi; ikilikte son *bit*e bakarız.)

O son bite bakmanın yolu, 10'daki `test`'in bir başka kullanımı: `test eax, 1`. Bu, "eax'in en düşük biti 1 mi?" diye sorar — bit 1 ise (tek) ZF kapalı, bit 0 ise (çift) ZF açık kalır.

```nasm
section .text
    global _start

_start:
    mov eax, 7         ; sınayacağımız sayı
    test eax, 1        ; en düşük bit 1 mi? (yani: tek mi?)
    jz  cift           ; ZF açık → düşük bit 0 → ÇİFT
    mov ebx, 1         ; buraya gelindiyse → TEK
    jmp bitir
cift:
    mov ebx, 0         ; ÇİFT
bitir:
    mov eax, 1
    int 0x80
```

`7` (tek) ile:

```
1
```

`mov eax, 8` (çift) yapıp yeniden çalıştır:

```
0
```

**İşte tamamı.** Üç dersin bilgisi tek programda buluştu: 03'ten "son bit çift/tekliği söyler", 10'dan "`test` bayrağı kurar", 11'den "`jz` bayrağı okuyup yolu seçer". Bu, gerçek bir program iskeletidir — girdiye bakar, karar verir, sonuca göre farklı davranır.

> 💡 **Aklınıza takılabilir:** *"`test eax, 1` neden 'en düşük bit'e bakıyor? İçeride ne dönüyor?"* `test`'in çalışma mekanizması bir **bit işlemi** (`and`) ve onu henüz görmedik — 10'da söz verdiğim gibi **kapalı kutu**, tam açıklaması 13. derste (`and`/`or`/`xor`). Burada sana lazım olan tek şey işlevi: `test eax, 1` → "eax tek mi?" sorusunu ZF'ye yazar. Mekanizmayı 13'te söktüğümüzde bu tıkır tıkır oturacak.

---

## Özet — Aklında Tut

```
☐ jmp etiket = KOŞULSUZ zıplama: her zaman 'etiket'e git; aradaki komutlar ATLANIR (hiç çalışmaz).
    Etiket = belleğin bir noktasına verilen isim (_start: gibi). eip zorla oraya taşınır.
☐ KOŞULLU zıplamalar bayrağı (10) okur. Kalıp HEP aynı: önce cmp/test (kur), hemen sonra koşullu zıpla (oku).
    - jz / je   → ZF açıksa atla   ("sıfır / eşit ise")
    - jnz / jne → ZF kapalıysa atla ("sıfır değil / eşit değil ise")
    - jl / jg   → cmp a,b sonrası a<b / a>b ise atla  (işaretli sıralama inceliğini komut halleder)
    - jle / jge → küçük-eşit / büyük-eşit
☐ Bu, makine dilinde "EĞER ... İSE" (if) demektir: akış artık düz değil, girdiye göre ÇATALLANIR.
☐ Doğrulanan programlar:
    - atla:     jmp mov ebx,99'u atladı → çıkış 1 (99 değil). gdb'de eip 0x...05 → 0x...0c, arası atlandı.
    - sifirmi:  eax=0 → 100 ;  eax=5 → 200   (test+jz ile ilk çatal)
    - enbuyuk:  (12,30) → 30 ;  (40,30) → 40 (cmp+jg ile büyüğü seç)
    - ciftek:   7 → 1(tek) ;    8 → 0(çift)  (03 son-bit + test eax,1 + jz)
☐ Sırada: aynı yere GERİ zıplayınca "döngü" doğar → 12. ders.
```

---

## 🔗 İlgili Konular

- [10_bayraklar_ve_cmp.md](./10_bayraklar_ve_cmp.md) — Zıplamaların okuduğu bayrakları (ZF/SF) ve `cmp`/`test`'i kurduğumuz yer; "kurar → okur" köprüsünün karşı yakası
- [03_sayilar_ikilik_onaltilik.md](./03_sayilar_ikilik_onaltilik.md) — "En sağdaki bit çift/tekliği söyler" gerçeği; çift-tek programının dayanağı
- [07_gdb_tek_adim.md](./07_gdb_tek_adim.md) — `eip`'i (işçinin "neredeyim" göstergesi) `si` ile izlemek; `jmp`'in atlayışını orada gördük
- [04.5_registerin_ici.md](./04.5_registerin_ici.md) — `eip`'in ne olduğu; zıplama aslında "eip'i değiştirmektir"

---

**Önceki konu:** [10_bayraklar_ve_cmp.md](./10_bayraklar_ve_cmp.md)
**Sonraki konu:** [12_donguler.md](./12_donguler.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
