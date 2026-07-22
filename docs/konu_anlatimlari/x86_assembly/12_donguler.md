# 🔁 x86 Assembly — Döngüler: Aynı İşi Tekrar Tekrar

> 11'de programın düz yolunu kırdık: `jmp` ile **ileri** atladık, komut atladık, çatallandık. Sonunda küçük bir kapı araladık: *"aynı yere **geri** zıplayınca 'döngü' doğar."*
> İşte o kapıdan giriyoruz. Şimdiye kadar hep ileri gittik; bu derste ilk kez **geriye** atlayacağız — ve işçiyi aynı işi, biz "dur" diyene kadar, tekrar tekrar yaptıracağız. Bilgisayarın "akıl almaz hız"ının (01) asıl kaynağı budur: yorulmadan tekrar.

> **Bu derste kod var ve hepsini çalıştırıyoruz.** Aşağıdaki her program, her çıkış kodu ve her GDB çıktısı gerçek: kendi makinemde derleyip koşturdum.

---

## 📋 İçindekiler

- [Geriye Zıpla: Döngü Böyle Doğar](#geriye-z%C4%B1pla-d%C3%B6ng%C3%BC-b%C3%B6yle-do%C4%9Far)
- [Sonsuz Döngü Tehlikesi: Sayaç Şart](#sonsuz-d%C3%B6ng%C3%BC-tehlikesi-saya%C3%A7-%C5%9Fart)
- [İlk Döngü: 1'den N'e Topla](#i%CC%87lk-d%C3%B6ng%C3%BC-1den-ne-topla)
- [Döngü, Yüksek İşlemlerin Tuğlasıdır: Çarpma](#d%C3%B6ng%C3%BC-y%C3%BCksek-i%CC%87%C5%9Flemlerin-tu%C4%9Flas%C4%B1d%C4%B1r-%C3%A7arpma)

---

## Geriye Zıpla: Döngü Böyle Doğar

11'de `jmp bitir` dedik ve **aşağıdaki** bir etikete atladık. Ama etiketin nerede olması gerektiğine dair hiçbir kural yok — `jmp`, belleğin **herhangi** bir noktasına atlayabilir; ileri de, **geri** de.

Ya bir etiketi `jmp`'in **üstüne** koyup oraya atlarsak? O zaman işçi geri döner, aradaki komutları **yeniden** çalıştırır, sonra yine geri döner... İşte bir **döngü** (loop) budur: belleğin bir noktasına isim ver, işi yap, sonra `jmp` ile o isme **geri** dön.

```nasm
tekrar:                ; ← etiket, jmp'in ÜSTÜNDE
    ; ... yapılacak iş ...
    jmp tekrar         ; geri dön → iş baştan
```

Bu iskelet çalışır — ama bir sorunu var, ve o sorun bu dersin asıl dersi.

> 🔑 Döngü = bir etikete **geri** zıplamak. İleri `jmp` komut atlar; geri `jmp` komutları **tekrarlatır.** Yeni bir komut öğrenmiyoruz — 11'in `jmp`'ini sadece geriye çeviriyoruz. Tekrarın tamamı bu basit fikirden çıkar.

---

## Sonsuz Döngü Tehlikesi: Sayaç Şart

Yukarıdaki `jmp tekrar` **koşulsuzdu** (11): her seferinde, şartsız, geri döner. Yani işçi `tekrar`'a döner, işi yapar, yine döner, yine yapar... **sonsuza kadar.** Program asla bitmez, `int 0x80`'e (çıkış) hiç ulaşamaz. Buna **sonsuz döngü** denir ve genellikle istemediğin bir hatadır — makine tek bir noktada, hızla, boşuna dönüp durur.

Demek ki bir döngünün iki parçası olmalı:
1. **İş:** her turda yapılacak şey.
2. **Çıkış şartı:** "artık yeter, döngüden çık" diyen bir kontrol — yoksa sonsuza dek döner.

Çıkış şartını nasıl kurarız? Elimizdeki malzemeyle: 11'in **koşullu** zıplaması. Fikir şu — bir **sayaç** tut (kaç tur kaldığını sayan bir register), her turda onu bir azalt (`dec`, 09), ve **sıfıra inince** dur. "Sıfıra indi mi?" sorusunu zaten cevaplayabiliyoruz: `dec` sonucu sıfırsa **ZF** açılır (10), ve `jnz` (11) "sıfır değilse atla" der.

Kalıp şöyle oturur:

```nasm
    mov ecx, 5         ; sayaç = 5 tur
tekrar:
    ; ... iş ...
    dec ecx            ; sayaç--   (ve ZF'yi kurar: sıfıra inince ZF=1)
    jnz tekrar         ; sayaç 0 DEĞİLse geri dön; 0 ise düş, döngüden çık
```

Gördün mü? Üç dersin parçası birleşti: sayacı **azalt** (09 `dec`), sonuç **sıfır mı** bak (10 `ZF`), sıfır değilse **geri zıpla** (11 `jnz`). `jnz`, sayaç sıfırlanınca artık atlamaz — işçi döngünün altına "düşer" ve devam eder. Sonsuz döngü, bir sayaçla evcilleşti.

> 🔑 Sağlam bir döngü = **iş + çıkış şartı.** En yaygın şart: bir **sayaç** register'ını her turda `dec` et, `jnz` ile "sıfır değilse tekrar" de. Sayaç sıfıra inince ZF açılır, `jnz` atlamaz, döngü biter. Sayacı unutursan → sonsuz döngü.

> ⚠️ Bu kalıp, sayacın **1 veya daha büyük** başladığını varsayar. `mov ecx, 0` ile başlarsan `dec` sayacı sıfırın **altına** düşürür (0 değil, 0xFFFFFFFF — dev bir sayı), `jnz` durmaz ve döngü tam da az önce korktuğumuz sonsuz döngüye kayar. Sayacın 0 olma ihtimali varsa, döngüye girmeden önce kontrol et (ör. baştan bir `jz` ile döngüyü tümden atla).

---

## İlk Döngü: 1'den N'e Topla

Kalıbı gerçek bir işe koşalım: **1'den N'e kadar olan sayıları topla** (yani 1 + 2 + ... + N). Sayacı hem "kaç tur kaldı" için hem de "bu turda eklenecek sayı" için kullanacağız — akıllıca: ecx `3, 2, 1` diye inerken tam da toplamak istediğimiz sayılar bunlar. `toplam.asm` (N = 3):

```nasm
section .text
    global _start

_start:
    mov eax, 0         ; toplam = 0 (biriktireceğimiz yer)
    mov ecx, 3         ; sayaç = N = 3
dongu:
    add eax, ecx       ; toplam += sayaç   (İŞLE: 09'un biriktirmesi)
    dec ecx            ; sayaç--           (+ ZF'yi kur)
    jnz dongu          ; sayaç 0 değilse başa dön
    mov ebx, eax       ; sonucu çıkış koduna
    mov eax, 1
    int 0x80
```

Turları kafanda çevir: ecx=3 → eax 0+3=3; ecx=2 → eax 3+2=5; ecx=1 → eax 5+1=6; ecx=0 → `jnz` durur. Sonuç 6 (=1+2+3). Çalıştır:

```
nasm -f elf32 toplam.asm -o toplam.o
ld -m elf_i386 toplam.o -o toplam
./toplam
echo $?
```

```
6
```

Şimdi döngünün gerçekten döndüğünü **gözünle** görelim. `dongu` etiketine bir **durak** (breakpoint) koyalım — işçi oraya her uğradığında GDB duracak — ve her seferinde sayaca bakalım:

```
gdb ./toplam
(gdb) break dongu       # 'dongu' etiketine durak koy
(gdb) run
(gdb) print $ecx        # 1. tur
(gdb) continue          # bir sonraki 'dongu' uğrağına kadar devam
(gdb) print $ecx        # 2. tur
(gdb) continue
(gdb) print $ecx        # 3. tur
(gdb) continue
```

Gerçek çıktı (ekranda tam olarak şunu görürsün):

```
Breakpoint 1 at 0x804900a
Breakpoint 1, 0x0804900a in dongu ()
$1 = 3
Breakpoint 1, 0x0804900a in dongu ()
$2 = 2
Breakpoint 1, 0x0804900a in dongu ()
$3 = 1
```

Satırları okuyalım: aynı adres `0x804900a` (yani `dongu`) **üç kez** çıkıyor — GDB her turda oraya gelince durdu. Ve `$1 = 3`, `$2 = 2`, `$3 = 1`, yani `print $ecx`'in üç cevabı: sayaç her turda bir azaldı, `3 → 2 → 1`. Üçüncü `continue`'dan sonra `dec` ecx'i sıfırladı, `jnz` artık atlamadı; işçi döngünün altına düştü ve program çıktı — breakpoint'e bir daha uğranmadı.

**İşte döngü.** İşçi aynı adrese (`0x804900a`, `dongu`) **üç kez** uğradı — çünkü her turda `jnz` onu oraya geri gönderdi. Ve sayaç her uğrakta bir azaldı: `3 → 2 → 1`. Dördüncü kez `dec` ecx'i sıfırladı, `jnz` atlamadı, işçi döngünün altına düşüp çıktı. Tek bir programı bir kez yazdın, işçi onu üç kez çalıştırdı — istediğin sayıda tekrar, tek bir sayaçla.

> 💡 **Aklınıza takılabilir:** *"`break dongu` ne yaptı?"* GDB'de **durak (breakpoint)**, "işçi şu noktaya gelince beni durdur" demektir. 07'de `si` ile *her* komutta duruyorduk; burada sadece `dongu`'ya her gelişte durduk. Döngüler için birebir: her turu tek tek `si`'lemek yerine, "her turun başında durdur, sayaca bak" dedik. `continue` (kısaca `c`) ise "bir sonraki durağa kadar serbest bırak" demek.

---

## Döngü, Yüksek İşlemlerin Tuğlasıdır: Çarpma

09'da güzel bir sır görmüştük: makinenin ayrı bir çıkarma devresi **yok** — çıkarma, "eksisini toplamak"tı. Aynı ruh burada da var. Makinenin temel hesabı toplama; peki ya **çarpma**? `3 × 4` aslında ne demek? **"3'ü, 4 kere topla"** demek: 3 + 3 + 3 + 3. Ve "bir şeyi N kere yapmak" artık elimizde — döngü!

`carp.asm` — `3 × 4`'ü, hiç çarpma komutu kullanmadan, tekrarlı toplamayla:

```nasm
section .text
    global _start

_start:
    mov eax, 0         ; sonuç = 0
    mov ecx, 4         ; kaç kere ekleyeceğiz (çarpan)
carp:
    add eax, 3         ; her turda 'çarpılan'ı (3) ekle
    dec ecx            ; sayaç--
    jnz carp           ; 4 kere: 3+3+3+3
    mov ebx, eax
    mov eax, 1
    int 0x80
```

Çalıştır, `echo $?`:

```
12
```

`3 + 3 + 3 + 3 = 12 = 3 × 4`. İçindeki 3'ü 7, sayacı 6 yaparsan (`7 × 6`) sonuç:

```
42
```

**İşte döngünün gücü.** Toplama gibi ilkel bir işlemden, onu tekrarlayarak, **çarpma** gibi daha büyük bir işlem inşa ettin. 09'un teması burada zirveye çıkıyor: makine gerçekten çok az şey bilir (topla, çıkar, karşılaştır, atla) — ama bunları **tekrarlayıp birleştirerek** her şeyi kurar. Az sayıda basit tuğla + döngü = koca binalar.

> 🔑 Döngü sadece "tekrar" değil, bir **inşa aracıdır:** `3 × 4` = "3'ü 4 kere topla". İlkel işlemleri (add) tekrarlayarak daha yükseklerini (çarpma) kurarsın. Bir işlemci "çarpabiliyorsa", en dipte çoğu zaman bunun gibi tekrarlar vardır. (Modern x86'da `mul` diye hazır bir komut da vardır — ama fikir hep aynı: tekrarlı toplama.)

---

## Özet — Aklında Tut

```
☐ DÖNGÜ = bir etikete GERİ zıplamak. İleri jmp atlar; geri jmp tekrarlatır. (Yeni komut yok, 11'in jmp'i geriye.)
☐ Koşulsuz geri jmp → SONSUZ DÖNGÜ (program hiç bitmez). Bu genelde HATADIR.
☐ Sağlam döngü = İŞ + ÇIKIŞ ŞARTI. En yaygın kalıp — SAYAÇ:
      mov ecx, N
    tekrar:
      ; ... iş ...
      dec ecx        ; 09: azalt + 10: ZF'yi kur
      jnz tekrar     ; 11: sıfır değilse geri dön; sıfırsa düş → çık
    (dec+ZF+jnz üçlüsü = 09+10+11 tek yerde.)
☐ Doğrulanan programlar:
    - toplam (1..N):  N=3 → 6 ;  N=5 → 15 ;  N=10 → 55.
      gdb break dongu: aynı adrese 3 kez uğrandı, ecx 3→2→1, sonra çıktı.
    - carp (tekrarlı toplama):  3×4 → 12 ;  7×6 → 42.  ("N'yi M kere topla")
☐ BÜYÜK FİKİR: az sayıda ilkel işlem (add/sub/cmp/jmp) + döngü = her şey. Çarpma bile toplamanın tekrarı.
☐ Sırada: 'iş' kısmında sık lazım olan bit hileleri (xor eax,eax neden 'sıfırla'dır) → 13. ders.
```

---

## 🔗 İlgili Konular

- [11_ziplamalar.md](./11_ziplamalar.md) — Döngünün tek malzemesi olan `jmp`/`jnz`; "geri zıplama = döngü" kapısı burada aralandı
- [10_bayraklar_ve_cmp.md](./10_bayraklar_ve_cmp.md) — Sayacın "sıfıra indi mi" kararı: `dec` sonrası ZF; döngüyü bitiren bayrak
- [09_aritmetik.md](./09_aritmetik.md) — `add` (biriktirme) ve `dec`; ve "ilkel işlemden büyüğünü kur" fikri (sub = eksisini topla)
- [07_gdb_tek_adim.md](./07_gdb_tek_adim.md) — GDB ile izleme; burada `break`/`continue` ekledik (her turda değil, her turun başında dur)

---

**Önceki konu:** [11_ziplamalar.md](./11_ziplamalar.md)
**Sonraki konu:** [13_bit_islemleri.md](./13_bit_islemleri.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
