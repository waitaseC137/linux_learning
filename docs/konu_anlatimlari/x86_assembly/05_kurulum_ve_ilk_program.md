# 🚀 x86 Assembly — Kurulum ve İlk Program

> Ünite 0 boyunca tek satır kod yazmadan makinenin kafasının içini kurduk. O sabır şimdi karşılığını veriyor.
> Bu derste ilk kez gerçek aletleri kuruyor, ilk gerçek programını yazıyor, çeviriyor ve **çalıştırıyorsun.**
> Program neredeyse hiçbir şey yapmayacak — bilerek. Çünkü buradaki kahraman program değil, o zincirin kendisi:
> klavyenden çıkan yazının, işlemcinin koşturduğu gerçek bir programa nasıl dönüştüğü.

> **Burada ilk kez kod var — ama korkma.** Yazacağın asm'yi şimdilik tam anlamana gerek yok; birkaç satırı
> **kapalı bir kutu** gibi yazıp zincirin çalıştığını görmek yeter. O satırların ne işe yaradığını sonraki derslerde tek tek açacağız.
> Bu dersin tek amacı: aletler kurulu olsun, ve sen "ben bir program çalıştırdım" diyebil.

---

## 📋 İçindekiler

- [Üç Alet: nasm, ld, gdb](#%C3%BC%C3%A7-alet-nasm-ld-gdb)
- [Aletleri Kur](#aletleri-kur)
- [İlk Programını Yaz](#i%CC%87lk-program%C4%B1n%C4%B1-yaz)
- [Yaz → Çevir → Çalıştır](#yaz--%C3%A7evir--%C3%A7al%C4%B1%C5%9Ft%C4%B1r)
- [Çalıştı mı? (Hiçbir Şey Olmadı!)](#%C3%A7al%C4%B1%C5%9Ft%C4%B1-m%C4%B1-hi%C3%A7bir-%C5%9Fey-olmad%C4%B1)
- [Adım Adım Ne Oldu?](#ad%C4%B1m-ad%C4%B1m-ne-oldu)
- [Hata Aldıysan](#hata-ald%C4%B1ysan)

---

## Üç Alet: nasm, ld, gdb

00'da şunu söylemiştik: **sen assembly yazarsın → bir program onu makine koduna çevirir → işlemci o sayıları çalıştırır.** Şimdi o "çeviren program"ı (ve birkaç arkadaşını) gerçekten kuruyoruz. Üç aletimiz var:

- **`nasm`** — *assembler* (çevirmen). Senin yazdığın `mov eax, 5` gibi satırları, işlemcinin gerçekten okuduğu sayılara (makine koduna) çevirir. Bizim asıl aletimiz bu.
- **`ld`** — *linker* (birleştirici). nasm'in ürettiği ham parçayı, işletim sisteminin belleğe yükleyip **çalıştırabileceği** gerçek bir programa dönüştürür.
- **`gdb`** — *debugger* (izleyici). Bir programı tek tek adım atarak içeride ne olduğunu izlemeni sağlar. Bu derste sadece **kuruyoruz**; onu [07_gdb_tek_adim](./07_gdb_tek_adim.md)'da kullanmaya başlayacağız.

Şimdilik akılda kalsın: **`nasm` çevirir, `ld` birleştirir, `gdb` izler.**

---

## Aletleri Kur

Hangi Linux dağıtımını kullandığına göre aşağıdaki satırlardan **birini** terminale yaz. (Hangisi olduğunu bilmiyorsan: Ubuntu/Mint kullanıyorsan birincisi, Arch tabanlı —CachyOS, Manjaro— kullanıyorsan ikincisi, Fedora kullanıyorsan üçüncüsü.)

**Debian / Ubuntu / Linux Mint:**
```
sudo apt install nasm binutils gdb
```

**Arch / Manjaro / CachyOS:**
```
sudo pacman -S nasm binutils gdb
```

**Fedora:**
```
sudo dnf install nasm binutils gdb
```

(`binutils`, `ld`'yi içeren pakettir; çoğu sistemde zaten kuruludur ama garanti olsun diye yazdık.)

Kurulum bitince doğru kurulduğunu kontrol et:

```
nasm --version
```

Buna benzer bir satır görmelisin: `NASM version 2.16.01`. Gördüysen aletin hazır.

> 💡 `sudo`, "yönetici yetkisiyle yap" demektir; bu yüzden parolanı sorabilir. Program **kurmak** sisteme dokunan bir iş olduğu için yetki ister — 02'de değindiğimiz "sistemi değiştirmek parola ister" durumu işte tam bu.

---

## İlk Programını Yaz

Şimdi ilk programını yazacağız. Bir metin editörüyle (terminalde `nano`, ya da VS Code, ne kullanıyorsan) **`ilk.asm`** adında bir dosya oluştur ve içine aynen şunu yaz:

```nasm
section .text
    global _start

_start:
    mov eax, 1          ; "programı bitir" demenin numarası (sys_exit)
    mov ebx, 0          ; çıkış kodu: 0
    int 0x80            ; çekirdeğe seslen: "dediğimi yap"
```

Korkma, satır satır deşmeyeceğiz — ama kabaca ne olduğunu bilmen yeter:

- **`section .text`** → "buradan sonrası, işçinin uygulayacağı **komutlardır**" demek. (Programın kod bölümü.)
- **`global _start`** ve **`_start:`** → işçiye "programa **buradan** başla" diyen işaret. `_start`, işçinin ilk emri okuyacağı yerdir. (01'deki "işçiye 'şu satırdan başla' dersin" cümlesini hatırla.)
- Alttaki **üç satır** → şimdilik **kapalı bir kutu.** Hepsi birlikte "programı temiz bir şekilde bitir" demenin yoludur. `mov`'un ne yaptığını [06_ilk_gercek_program](./06_ilk_gercek_program.md)'da, `int 0x80`'in (yani "çekirdeğe seslenmek") ne olduğunu [17_sistem_cagrilari](./17_sistem_cagrilari.md)'da tam olarak açacağız. Şu an ezberlemene bile gerek yok — sadece yaz.

> 💡 `nano` kullanıyorsan: `nano ilk.asm` ile aç, yukarıdakini yaz, sonra **Ctrl+O** (kaydet) → **Enter** → **Ctrl+X** (çık). `;` ile başlayan kısımlar *yorum*tur (işçi onları görmez, sadece sana not); istersen yazmayabilirsin.

---

## Yaz → Çevir → Çalıştır

Dosyan hazır. Şimdi onu, işlemcinin çalıştırabileceği bir programa dönüştürüp koşturacağız. `ilk.asm`'nin bulunduğu klasörde, sırayla üç komut:

**1) Çevir** (asm metni → makine kodu):
```
nasm -f elf32 ilk.asm -o ilk.o
```
`nasm` dosyanı okur ve makine koduna çevirir. `-f elf32` = "çıktıyı **32-bit** ELF formatında ver" demek (biz 32-bit x86 yazıyoruz). Sonuç: `ilk.o` adında bir ara dosya (*object*).

**2) Birleştir** (object → çalıştırılabilir program):
```
ld -m elf_i386 ilk.o -o ilk
```
`ld`, o ara dosyayı çalıştırılabilir gerçek bir programa dönüştürür. `-m elf_i386` = "**32-bit** (i386) olarak birleştir" demek. Sonuç: `ilk` adında, çalıştırabileceğin bir program.

**3) Çalıştır:**
```
./ilk
```
Baştaki `./` "**bu klasördeki** ilk programını çalıştır" demektir.

> 💡 **Aklınıza takılabilir:** *"32-bit derliyoruz; ekstra 32-bit kütüphane (multilib) kurmam gerekmez mi? İnternette öyle yazıyordu."* Hayır — bizim programımız hiçbir kütüphane kullanmıyor, doğrudan çekirdeğe sesleniyor (`int 0x80`). O yüzden tek başına, kendi kendine yeten (*statically linked*) bir 32-bit program çıkıyor; ekstra bir şeye ihtiyaç yok. (İleride C kütüphanesine bağlanırsak, o ayrı bir konu olur.)

---

## Çalıştı mı? (Hiçbir Şey Olmadı!)

`./ilk` yazıp Enter'a bastın ve... hiçbir şey olmadı. Ekrana yazı çıkmadı, prompt geri geldi. **Panik yok — tam beklenen şey bu.**

Programımız hiçbir şey yapmıyor; sadece "doğdum, hemen bittim" diyor. Ekrana yazı yazmayı [17_sistem_cagrilari](./17_sistem_cagrilari.md)'da öğreteceğiz. Yani çıktının olmaması bir hata değil, **tasarım.**

Peki çalıştığını nereden bileceğiz? Programın **çıkış kodunu** soralım. Şunu yaz:

```
echo $?
```

Göreceğin:

```
0
```

Bu `0`, "program **temiz bir şekilde, hatasız** bitti" demektir (0 = sorun yok). İşte zincirin baştan sona çalıştığının kanıtı budur: yazdın, çevirdi, birleşti, çalıştı, temizce çıktı.

> 💡 **Farklı kabuk kullanıyorsan:** `echo $?` bash ve zsh'te çalışır (çoğu sistemin varsayılanı bunlardır). Ama **fish** gibi bazı kabuklar bu değişkene `$status` der — fish'teysen `echo $?` sana hata verir, onun yerine `echo $status` yaz (aynı sonuç). Emin değil misin? `echo $?` bir hata veriyorsa o kabuk `$status` kullanıyor demektir; ona geç. (`echo $SHELL` de hangi kabukta olduğunu söyler.)

> 💡 `echo $?`, "**en son çalışan programın çıkış kodu neydi?**" diye sorar. Şimdilik bu 0; çünkü programımıza `mov ebx, 0` yazdık. [06_ilk_gercek_program](./06_ilk_gercek_program.md)'da bu sayıyı **sen** belirleyeceksin — `ebx`'e başka bir şey koyup `echo $?`'a onu söylettireceğiz. İlk "ekrana benim koyduğum sayı çıktı!" anın orada olacak.

---

## Adım Adım Ne Oldu?

Az önce yaptığın şey, aslında 01-04'te çizdiğimiz resmin **ilk kez gerçek olması**ydı. Geriye dönüp bağlayalım:

```
  1) Sen bir metin yazdın (ilk.asm)        → işçinin diline yakın bir emir listesi
  2) nasm onu MAKİNE KODUNA çevirdi         → sayılara (00'daki B8 05 00 00 00 gibi) → ilk.o
  3) ld onu ÇALIŞTIRILABİLİR programa çevirdi → çekirdeğin yükleyebileceği hâle → ilk
  4) ./ilk dedin:
       - çekirdek programı belleğe (depoya) koydu
       - işçiye "_start'tan başla" dedi
       - işçi getir-yap-ilerle ile komutları uyguladı
       - int 0x80'e gelince "bittim" dedi, kontrol sana (prompt'a) döndü
```

Yani "programı çalıştırmak" dediğimiz o havalı laf ([01_bilgisayar_nedir](./01_bilgisayar_nedir.md)) tam olarak buydu: emir listeni belleğe koymak, işçiye "başla" demek, ve onun listeyi uygulaması. Artık bunu **kendi ellerinle** yaptın.

---

## Hata Aldıysan

İlk denemede bir hata almak çok olası — ve [02_terminal_ile_tanisma](./02_terminal_ile_tanisma.md)'da dediğimiz gibi, hata düşman değil **ipucudur.** En sık karşılaşacakların:

- **`nasm: command not found`** (ya da `ld: command not found`) → alet kurulu değil. Yukarıdaki **kurulum** adımına dön, paketleri kur.
- **`ilk.asm:5: error: ...`** → asm dosyanda bir yazım hatası var. nasm sana **kaçıncı satırda** olduğunu söyler (örnekte 5); o satıra git, yukarıdaki kodla harf harf karşılaştır.
- **`ld: cannot find ilk.o`** → `ld` adımından önce `nasm` adımı başarılı olmamış (yani `ilk.o` hiç oluşmamış). Önce `nasm` komutunu hatasız çalıştır, sonra `ld`'yi.
- Hiçbir komut bir şey yazmadan geri döndüyse (sessizlik) → genelde **iyiye** işaret; o adım sorunsuz bitti demektir. (İşçi gereksiz konuşmaz, hatırla.)

Komutu yanlış yazmaktan korkma — en kötü ihtimalle bir hata mesajı alır, düzeltir, tekrar denersin. Olağan döngü zaten budur: yaz → hata → oku → düzelt.

---

## Özet — Aklında Tut

```
☐ Üç alet: nasm (asm→makine kodu çevirmeni), ld (birleştirici), gdb (izleyici; 07'de kullanacağız).
☐ Kurulum: apt / pacman / dnf ile  nasm binutils gdb.   Doğrula: nasm --version
☐ İlk program iskeleti:
    section .text + global _start + _start:  + (şimdilik kapalı kutu) 3 satırlık temiz çıkış
☐ Zincir (ilk.asm'nin olduğu klasörde):
    nasm -f elf32 ilk.asm -o ilk.o      (çevir:    asm → object)
    ld -m elf_i386 ilk.o -o ilk         (birleştir: object → program)
    ./ilk                               (çalıştır)
☐ Hiçbir şey çıkmaması NORMAL: program "doğdum-bittim" diyor.
    echo $?  → 0  = temiz çıkış  (fish kabuğunda: echo $status).  06'da bu sayıyı sen belirleyeceksin.
☐ 32-bit ama multilib GEREKMEZ: programımız kütüphanesiz, statically linked.
☐ Hata = ipucu: çoğu zaman ya alet kurulu değildir ya da bir yazım hatasıdır.
☐ Bütün bu zincir = Ünite 0'da çizdiğimiz "yaz → belleğe koy → işçi çalıştırsın" resminin gerçek hâli.
```

---

## 🔗 İlgili Konular

- [00_buradan_basla.md](./00_buradan_basla.md) — "Sen yazarsın → nasm çevirir → işlemci çalıştırır" zincirinin ilk anlatıldığı yer
- [05.5_perde_arkasi.md](./05.5_perde_arkasi.md) — Bu derste yazdığın komutların (`./`, `nasm`/`ld`, `_start`) perde arkası
- [06_ilk_gercek_program.md](./06_ilk_gercek_program.md) — `mov` ile register'a değer koyup çıkış kodunu `echo $?`'ta görmek
- [17_sistem_cagrilari.md](./17_sistem_cagrilari.md) — `int 0x80`'in (çekirdeğe seslenmenin) tam olarak açıldığı yer

---

**Önceki konu:** [04.5_registerin_ici.md](./04.5_registerin_ici.md)
**Sonraki konu:** [05.5_perde_arkasi.md](./05.5_perde_arkasi.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
