# 📜 x86 Assembly — Calling Convention: Fonksiyona Veri Vermek

> 15'te `ekle5` diye bir fonksiyon yazdık ama küçük bir hile yaptık: fonksiyon veriyi doğrudan `eax`'ten aldı, sonucu yine `eax`'e bıraktı — "herkes eax kullansın" dedik geçtik. Gerçek fonksiyonlar öyle çalışmaz.
> Çünkü gerçek bir fonksiyona **"şu iki sayıyı topla"** demen gerekir: sayıları ona nasıl *vereceksin*? Sonucu nereden *alacaksın*? Ve 15'in sonunda uyardığım o "stack dengesi" işi kimin sorumluluğu? İşte bu dersin konusu, herkesin uyduğu ortak bir **sözleşme**.

> **Bu derste kod var ve hepsini çalıştırıyoruz.** Aşağıdaki her program, her çıkış kodu ve her GDB çıktısı gerçek: kendi makinemde derleyip koşturdum.

---

## 📋 İçindekiler

- [Bir Sözleşme Lazım: cdecl](#bir-s%C3%B6zle%C5%9Fme-laz%C4%B1m-cdecl)
- [Argümanları Stack'le Geç, Sonucu `eax`'te Al](#arg%C3%BCmanlar%C4%B1-stackle-ge%C3%A7-sonucu-eaxte-al)
- [`ebp` Çıpası: Prologue ve `[ebp+8]`](#ebp-%C3%A7%C4%B1pas%C4%B1-prologue-ve-ebp8)
- [Hepsi Bir Arada: `Topla(3, 5)`](#hepsi-bir-arada-topla3-5)

---

## Bir Sözleşme Lazım: cdecl

Bir fonksiyona veri vermenin "doğal" bir yolu yoktur — birinin **kural koyması** gerekir. Çağıran ile çağrılan iki ayrı kod parçası; aralarında anlaşmazlarsa kaos olur. Mesela:

- Çağıran, sayıları `eax`/`ebx`'e mi koysun, stack'e mi?
- Fonksiyon sonucu nereye bıraksın ki çağıran onu bulabilsin?
- Fonksiyon çalışırken `ecx`'i bozarsa, çağıranın `ecx`'i mahvolur mu?
- Stack'e itilen argümanları sonra kim temizleyecek?

Bu soruların cevabını herkesin baştan bildiği bir **anlaşmaya** ihtiyaç var. İşte bu anlaşmaya **calling convention** (çağırma sözleşmesi) denir. Tek bir "doğru" yoktur — farklı sistemlerin farklı sözleşmeleri vardır. **32-bit Linux**'ta en yaygın olanı **cdecl**'dir; biz de onu öğreneceğiz.

cdecl'in üç temel kuralı (gerisi ayrıntı):

1. **Argümanlar stack'e itilir** — üstelik **sağdan sola** (son argüman ilk).
2. **Dönüş değeri `eax`'te** döner.
3. **Argümanları çağıran temizler** (fonksiyon değil).

(Yukarıda sorduğumuz *"`ecx` bozulursa çağıranın `ecx`'i mahvolur mu?"*nun cevabı da bu sözleşmenin parçasıdır: hangi register'ı kimin koruyacağı belli kurala bağlıdır. Ama o bir ayrıntı — şimdilik bu üç kural `Topla`'yı yazmaya yetiyor, o inceliğe girmiyoruz.)

Şimdi bunları tek tek, çalışan kodla görelim.

> 🔑 **Calling convention** = çağıran ile fonksiyon arasındaki, "veriyi nereye koyacağız, sonucu nereden alacağız, kim temizleyecek" anlaşması. Tek doğru yok; 32-bit Linux'ta standart **cdecl**: argümanlar stack'e (sağdan sola), sonuç `eax`'te, temizlik çağıranda.

---

## Argümanları Stack'le Geç, Sonucu `eax`'te Al

15'te fonksiyona veri vermenin bir yolunu aradık ve dönüş adresini stack'e koyduğumuzu gördük. Argümanlar da aynı yere gider: **çağırmadan önce stack'e `push`'larsın.** cdecl bunları **sağdan sola** ister — yani `Topla(3, 5)` için önce `5`'i, sonra `3`'ü itersin:

```nasm
    push dword 5        ; 2. argüman önce (sağdan sola)
    push dword 3        ; 1. argüman sonra
    call topla
```

Neden ters? Böylece **`call`'dan hemen önce** 1. argüman stack'in tepesinde olur; `call` dönüş adresini onun üstüne `push`'layınca (15) tepe yine **dönüş adresi** olur, 1. argüman da onun hemen **altında** (dönüş adresine en yakın) kalır — fonksiyon "ilk argümanım nerede?" derken tutarlı bir yere bakar. Az sonra tam adresini göreceğiz.

Sonuç ise `eax`'te döner (kural 2) — zaten 15'teki `ekle5` de sonucu eax'e bırakıyordu, cdecl bunu resmî kural yapıyor. Fonksiyondan çıkınca çağıran `eax`'e bakar, sonucu orada bulur.

> 🔑 Argümanlar `call`'dan **önce** stack'e `push`'lanır, cdecl'de **sağdan sola** (son argüman ilk itilir → ilk argüman tepede kalır). Dönüş değeri **`eax`**'te gelir. Veri gidiş: stack; sonuç dönüş: eax.

---

## `ebp` Çıpası: Prologue ve `[ebp+8]`

Fonksiyon argümanlara nasıl ulaşacak? İlk fikir: "stack tepesindeler, `[esp+...]` ile okurum." Ama bir tuzak var: fonksiyon içinde her `push`/`pop`, `call` derken **`esp` sürekli oynar** (14). Argümanı bazen `[esp+4]`, biraz sonra `[esp+12]`'de ararsın — kayan bir zemin. Sabit bir referans lazım.

Çözüm, bir register'ı **sabit çıpa** yapmak: **`ebp`** (*base pointer*). Fonksiyonun başında `esp`'nin o anki değerini `ebp`'ye kopyalarsın; sonra `esp` istediği kadar oynasın, `ebp` **kıpırdamaz** ve argümanları hep ona göre okursun. Bu iki hazırlık satırına **prologue** denir:

```nasm
topla:
    push ebp            ; çağıranın ebp'sini sakla (ona lazım, bozmayalım)
    mov ebp, esp        ; ebp = şu anki tepe → sabit çıpa
```

(Bu ilk örnekte çağıran `_start`; `ebp`'ye anlamlı bir şey yazmamıştı, yani sakladığımız değerin **içeriği** önemsiz. Ama **satırın kendisi** önemli: çoğu çağıranın korunması gereken gerçek bir `ebp`'si olur — 19'da C fonksiyonlarında göreceksin — o yüzden kalıp, çağıran kim olursa olsun onun `ebp`'sini saklar. Burada sadece o "boş"u koruyor.)

Bu iki satırdan sonra stack şöyle dizilidir (14'ten: yukarı = büyük adres). `ebp` artık sabit; ona göre argümanlar:

```
   [ebp + 12] → 2. argüman   (5)
   [ebp + 8]  → 1. argüman   (3)
   [ebp + 4]  → dönüş adresi  (call'ın koyduğu, 15)
   [ebp + 0]  → saklanan eski ebp   ← ebp burayı gösterir
```

Yani **1. argüman hep `[ebp+8]`**, 2. argüman `[ebp+12]` — `esp` ne yaparsa yapsın değişmez. (Neden 8? `[ebp]`'de eski ebp, `[ebp+4]`'te dönüş adresi var; argümanlar onların üstünde, +8'den başlar.) İş bitince çıpayı ve stack'i eski hâline döndürürsün — buna **epilogue** denir:

```nasm
    pop ebp             ; çağıranın ebp'sini geri ver
    ret                 ; dönüş adresine git (15)
```

> 🔑 `esp` sürekli oynadığı için argümanları ona göre okumak kırılgan; bunun yerine **`ebp`'yi sabit çıpa** yaparsın. **Prologue** (`push ebp` / `mov ebp, esp`) çıpayı kurar; artık **1. argüman `[ebp+8]`**, 2. `[ebp+12]`. **Epilogue** (`pop ebp` / `ret`) eski hâle döndürür. Neredeyse her fonksiyon bu kalıpla başlar ve biter.

---

## Hepsi Bir Arada: `Topla(3, 5)`

Üç kuralı da tek programda toplayalım. `topla_fn.asm` — gerçek bir `Topla(3, 5)` çağrısı:

```nasm
section .text
    global _start

_start:
    push dword 5        ; 2. argüman (sağdan sola)
    push dword 3        ; 1. argüman
    call topla          ; Topla(3, 5)
    add esp, 8          ; ÇAĞIRAN temizler: 2 argüman × 4 byte = 8
    mov ebx, eax        ; dönüş değeri eax'te → çıkışa
    mov eax, 1
    int 0x80

topla:
    push ebp            ; --- prologue ---
    mov ebp, esp
    mov eax, [ebp+8]    ; 1. argüman  (3)
    add eax, [ebp+12]   ; + 2. argüman (5)   → eax = 8  (dönüş değeri)
    pop ebp             ; --- epilogue ---
    ret
```

Bir tek yeni parça var: `call`'dan sonraki `add esp, 8`. Bu, **kural 3** — çağıran, stack'e ittiği 2 argümanı (2 × 4 = 8 byte) geri temizliyor. Neden `sub` değil de **`add`**? Stack aşağı (küçük adrese) doğru büyür (14); argümanları `push`'larken `esp` 8 **azalmıştı**, temizlik de onu 8 geri **artırır** — "silmek" burada `esp`'yi ittiğimiz yerin üstüne, eski tepeye taşımaktır. (15'in uyarısını hatırla: stack dengede kalmazsa işler bozulur. Argümanları iten çağıran olduğu için, temizleyen de o.) Çalıştır:

```
nasm -f elf32 topla_fn.asm -o topla_fn.o
ld -m elf_i386 topla_fn.o -o topla_fn
./topla_fn
echo $?
```

```
8
```

`Topla(3, 5) = 8`. Argümanları iki farklı sayıyla değiştir (`push 20` / `push 10`, yani `Topla(10, 20)`):

```
30
```

Aynı fonksiyon, farklı argümanlarla, doğru sonuç. Fonksiyonun argümanları gerçekten `[ebp+8]`/`[ebp+12]`'den okuduğunu GDB'de doğrulayalım — prologue'dan sonra:

```
gdb ./topla_fn
(gdb) break topla
(gdb) run
(gdb) si                    # push ebp
(gdb) si                    # mov ebp, esp   (çıpa kuruldu)
(gdb) x/1dw $ebp+8          # 1. argüman
(gdb) x/1dw $ebp+12         # 2. argüman
(gdb) x/1xw $ebp+4          # dönüş adresi
```

Gerçek çıktı:

```
[ebp+8]  (1.arg)        = 3
[ebp+12] (2.arg)        = 5
[ebp+4]  (dönüş adresi) = 0x08049009
```

**İşte sözleşme, işler hâlde.** `3` ve `5` tam beklenen yerlerde (`[ebp+8]`, `[ebp+12]`), dönüş adresi de aralarında (`[ebp+4]`), 15'te öğrendiğimiz gibi. Fonksiyon bunları okudu, topladı, `eax`'te (8) döndürdü; çağıran sonucu eax'te buldu ve stack'i temizledi. Kimse kimsenin ayağına basmadı — çünkü ikisi de aynı sözleşmeye uydu.

> 💡 **Aklınıza takılabilir:** *"Bu kadar kural, üç sayı toplamak için fazla değil mi?"* Küçük örnekte öyle görünür. Ama fikir şu: bu sözleşmeye uyan **her** fonksiyon, başka **herhangi** biriyle konuşabilir — senin yazdığın da, derleyicinin ürettiği de, işletim sisteminin kütüphaneleri de. Birazdan (19) bir C programının assembly'sine baktığında tam bu kalıbı — `push ebp` / `mov ebp, esp` / `[ebp+8]` — göreceksin. cdecl, "herkesin konuştuğu ortak dil"dir; zahmeti, evrenselliğinin bedeli.

---

## Özet — Aklında Tut

```
☐ CALLING CONVENTION = çağıran↔fonksiyon anlaşması (veri nereye, sonuç nereden, kim temizler). 32-bit Linux = cdecl.
☐ cdecl 3 kural:
    1) Argümanlar stack'e push'lanır, SAĞDAN SOLA (son arg ilk → 1. arg tepede).
    2) Dönüş değeri EAX'te.
    3) Argümanları ÇAĞIRAN temizler (call sonrası: add esp, <arg_sayısı × 4>).
☐ ebp = SABİT ÇIPA (esp sürekli oynar, ona güvenilmez):
    - PROLOGUE:  push ebp ; mov ebp, esp
    - Argümanlar:  1. = [ebp+8] ,  2. = [ebp+12]   ([ebp]=eski ebp, [ebp+4]=dönüş adresi, üstü argümanlar)
    - EPILOGUE:  pop ebp ; ret
☐ Doğrulanan: Topla(3,5)=8 ; Topla(10,20)=30. gdb: [ebp+8]=3, [ebp+12]=5, [ebp+4]=dönüş adresi.
☐ Niye önemli: C derleyicisi de tam bu kalıbı üretir (19'da göreceksin). cdecl = herkesin ortak dili.
```

---

## 🔗 İlgili Konular

- [15_call_ve_ret.md](./15_call_ve_ret.md) — `call`/`ret` ve stack'teki dönüş adresi (`[ebp+4]`); bu ders onun üstüne "veri geçme" katmanını koyar
- [14_stack.md](./14_stack.md) — Argümanların ve `ebp`'nin yaşadığı yer; `push`/`pop` ve `esp`'nin oynaması. Prologue/epilogue saf stack işidir
- [08_mov_ve_bellek.md](./08_mov_ve_bellek.md) — `[ebp+8]` = "ebp+8 adresindeki kutu"; argüman okuma tam bir pointer takibi
- [09_aritmetik.md](./09_aritmetik.md) — Fonksiyonun içindeki `add`; sözleşme sadece onu paketliyor

---

**Önceki konu:** [15_call_ve_ret.md](./15_call_ve_ret.md)
**Sonraki konu:** [17_sistem_cagrilari.md](./17_sistem_cagrilari.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
