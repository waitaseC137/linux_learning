# 🗂️ x86 Assembly — Stack: İşçinin Not Defteri

> Ünite 2'yi bitirdin: işçi artık hesap yapıyor (09), karar veriyor (10-11), döngü kuruyor (12), bit oynuyor (13). Ama bir sıkıntısı var ve gittikçe büyüyecek: **elleri az.** 04.5'te gördük — bir avuç register (eax, ebx, ecx...), hepsi o kadar. Peki ya elindekinden fazla sayıyı bir süre bir kenarda tutman gerekirse?
> İşte bu ünitenin konusu: işçiye bir **not defteri** vermek. Adı **stack** (yığın), ve birazdan göreceğin gibi, bu defter bir sonraki iki dersin — fonksiyonların — de temelidir.

> **Bu derste kod var ve hepsini çalıştırıyoruz.** Aşağıdaki her program, her çıkış kodu ve her GDB çıktısı gerçek: kendi makinemde derleyip koşturdum.

---

## 📋 İçindekiler

- [İşçinin Not Defteri: Stack Nedir?](#i%CC%87%C5%9F%C3%A7inin-not-defteri-stack-nedir)
- [`push` / `pop`: Tepeye Koy, Tepeden Al](#push--pop-tepeye-koy-tepeden-al)
- [LIFO: Son Giren İlk Çıkar](#lifo-son-giren-i%CC%87lk-%C3%A7%C4%B1kar)
- [`esp` ve 'Stack Neden Aşağı Büyür?'](#esp-ve-stack-neden-a%C5%9Fa%C4%9F%C4%B1-b%C3%BCy%C3%BCr)

---

## İşçinin Not Defteri: Stack Nedir?

Register'lar hızlıdır ama **azdır** (04.5). Bir hesabın ortasında elindeki bir değeri kaybetmeden yeni bir iş yapman gerektiğinde, onu geçici olarak bir yere **bırakman** lazım. Belleğe (`section .data`, 08) adlandırılmış bir kutu açabilirsin — ama her geçici değer için isim uydurmak zahmetli. Daha pratik bir şey lazım: hızlıca "şunu bir kenara koy", sonra "geri al."

İşte **stack** (yığın) bunun için var: belleğin, işçinin geçici notlar için kullandığı özel bir bölgesi. Adı çok yerinde — bir **tabak yığını** gibi düşün:

- Yeni tabağı **en üste** koyarsın (`push`).
- Tabak alırken yine **en üstten** alırsın (`pop`).
- Ortadan ya da alttan çekemezsin — hep tepeden.

Bu "hep tepeden" kuralı basit görünür ama çok güçlüdür; birazdan ismini de koyacağız (LIFO). Şimdilik zihin resmi: stack = işçinin, üstüne not ekleyip üstten not aldığı bir defter.

> 🔑 **Stack** = belleğin, geçici değerleri bırakıp geri almak için kullanılan bölgesi; işçinin "not defteri". Register az olduğu için var. Kural: tabak yığını gibi, hep **tepeden** iş görülür — üste koy, üstten al.

---

## `push` / `pop`: Tepeye Koy, Tepeden Al

Stack'le iki komutla konuşursun:

- `push kaynak` → `kaynak`'ı stack'in **tepesine koy.**
- `pop hedef` → stack'in **tepesindeki** değeri al, `hedef`'e koy (ve tepeden kaldır).

Peki işçi "tepe"nin nerede olduğunu nereden bilir? Özel bir register bunu takip eder: **`esp`** (*stack pointer* — yığın göstergesi). `esp` her zaman **stack'in tepesindeki** değerin adresini tutar; yani `[esp]` (08'deki köşeli parantez!) = tepedeki değer.

- `push` yaptığında: `esp` yeni bir yeri gösterir ve değer oraya yazılır — tepe yükselir.
- `pop` yaptığında: `[esp]`'deki değer okunur ve `esp` bir eski yeri gösterir — tepe alçalır.

`esp`'nin bu hareketi, stack'in en kafa karıştırıcı ama en zarif detayını barındırıyor (son bölüm). Önce komutları bir işte görelim.

> 🔑 `push x` = x'i stack tepesine koy; `pop r` = tepedeki değeri r'ye al (ve kaldır). **`esp`** register'ı hep tepeyi gösterir; `[esp]` = tepedeki değer. `push` tepeyi büyütür, `pop` küçültür.

---

## LIFO: Son Giren İlk Çıkar

Tabak yığınının o "hep tepeden" kuralının bir sonucu var: en son koyduğun tabağı en önce alırsın. Bunun adı **LIFO** — *Last In, First Out* ("son giren, ilk çıkar"). Bunu bir programla kanıtlayalım. `stack.asm` — üç sayıyı sırayla koyup sırayla alalım:

```nasm
section .text
    global _start

_start:
    push dword 10       ; koy: 10
    push dword 20       ; koy: 20  (10'un üstüne)
    push dword 30       ; koy: 30  (en tepede)
    pop eax             ; al: tepedeki → 30
    pop ebx             ; al: sıradaki → 20
    pop ecx             ; al: sıradaki → 10
    mov ebx, eax        ; çıkışa ilk aldığımızı (30) koy
    mov eax, 1
    int 0x80
```

Küçük bir ayrıntı: `push dword 10`'daki o `dword` neden orada? `10` çıplak bir sayı; assembler onu stack'e kaç byte olarak itsin bilemez, sen `dword` (= 4 byte) diyerek söylersin. `pop eax`'te ise `eax` bir register, boyutu zaten belli (32-bit) — orada `dword` yazmana gerek yok.

Sırayı takip et: `10, 20, 30` diye koyduk (en son 30 en tepede). Alırken tepeden başladık: ilk `pop` **30**'u aldı (en son koyduğumuz), sonra 20, sonra 10. Yani **ters** sırada geri geldiler. Çalıştır:

```
nasm -f elf32 stack.asm -o stack.o
ld -m elf_i386 stack.o -o stack
./stack
echo $?
```

```
30
```

İlk `pop`, en son koyduğumuz `30`'u getirdi — çıkış kodu bunu doğruluyor. **Son giren, ilk çıktı.** Koyma sırası `10→20→30`, alma sırası `30→20→10`. Stack'in bütün karakteri bu tek kelimede: LIFO.

> 🔑 Stack **LIFO**'dur (Last In, First Out — son giren ilk çıkar). `push 10,20,30` sonra `pop,pop,pop` → `30,20,10` (ters). Her zaman en son koyduğunu en önce alırsın; ortaya/alta uzanamazsın.

---

## `esp` ve 'Stack Neden Aşağı Büyür?'

Şimdi en güzel detay. Sezgin muhtemelen "stack büyüdükçe adresler **artar**" der — üst üste koyuyoruz ya. Ama gerçek tam tersi: **stack büyüdükçe `esp` KÜÇÜLÜR.** Stack, belleğin yüksek adreslerinden **aşağıya**, küçük adreslere doğru büyür. GDB'de `esp`'yi her `push`'ta izleyelim:

```
gdb ./stack
(gdb) starti
(gdb) print/x $esp        # başlangıç
(gdb) si                  # push 10
(gdb) print/x $esp
(gdb) x/1dw $esp          # tepedeki değer
... (her push'tan sonra tekrar)
```

Gerçek çıktı:

```
başlangıç esp = 0xffffc570
push 10 sonrası esp = 0xffffc56c   tepe = 10
push 20 sonrası esp = 0xffffc568   tepe = 20
push 30 sonrası esp = 0xffffc564   tepe = 30
pop eax sonrası esp = 0xffffc568   eax = 30
```

Peki bu ilk `esp` değerini (`0xffffc570`) daha sen tek bir `push` bile yapmadan kim koydu? Sen değil: programı başlatırken işletim sistemi stack bölgesini hazırlar ve tepe adresini `esp`'ye yazar — defter açılmış, kalem elinde hazır gelir. (Belleğe ve donanıma OS hükmeder; şimdilik kapalı kutu, 17'de açacağız.)

Adreslere bak: her `push`'ta `esp` tam **4 azaldı** (`c570 → c56c → c568 → c564`). Her seferinde 4, çünkü bir dword 4 byte (03/08). Değer o yeni (daha küçük) adrese yazıldı — `[esp]` hep tepeyi gösteriyor. Ve `pop eax` yapınca `esp` geri **4 arttı** (`c564 → c568`), değeri (30) aldı. Yani:

- **`push`** = `esp`'yi 4 azalt, değeri oraya yaz. (tepe aşağı iner)
- **`pop`** = `[esp]`'deki değeri al, `esp`'yi 4 artır. (tepe yukarı çıkar)

Peki neden aşağı? Mantığı şu: belleği bir cadde gibi düşün. Programın **kendisi** (kod ve veriler) caddenin **alt** ucuna (küçük adreslere) yerleşir — 11'de gördüğün `0x8049000` gibi. Stack ise caddenin **üst** ucuna (büyük adreslere) konur ve **aşağıya doğru** büyür. Böylece ikisi caddenin iki ucundan başlayıp **birbirine doğru** büyür; ortadaki boşluğu ikisi de kullanabilir, alan boşa gitmez. İkisini de aynı yönde büyütseydin biri diğerine daha çabuk çarpardı.

> 🔑 Stack **aşağı** büyür: `push` → `esp` **4 azalır** (tepe küçük adrese iner), `pop` → `esp` **4 artar**. Sebep: program bellekte aşağıdan (küçük adres), stack yukarıdan (büyük adres) başlar; ters yönde büyüyünce çarpışmadan aynı boşluğu paylaşırlar. Sezgiye ters ama tutarlı.

> 💡 **Aklınıza takılabilir:** *"Bu LIFO / not defteri ne işe yarayacak? Üç sayıyı koyup almak biraz oyuncak."* Haklısın — asıl gücü tek başına değil. Stack'in gerçek hayatı bir sonraki iki derste başlıyor: **fonksiyonlar.** Bir işçi başka bir işe "gidip geri döneceği" zaman, "nereye döneceğini" ve elindeki değerleri bu deftere yazar (15), sonra döndüğünde geri okur. `push`/`pop`'u şimdi öğrendin ki 15'te fonksiyonlar sihir gibi değil, sadece "stack'e not bırakmak" gibi görünsün.

---

## Özet — Aklında Tut

```
☐ STACK = belleğin geçici-değer bölgesi; işçinin "not defteri" (register az olduğu için). Tabak yığını gibi: hep tepeden.
☐ push x = x'i tepeye koy ;  pop r = tepedeki değeri r'ye al (ve kaldır).
☐ esp register'ı HEP tepeyi gösterir; [esp] = tepedeki değer.
☐ LIFO (Last In First Out): push 10,20,30 → pop,pop,pop = 30,20,10 (ters sıra). En son koyduğun ilk çıkar.
☐ Stack AŞAĞI büyür (sezgiye ters):
    - push → esp 4 AZALIR (dword=4 byte), değer oraya yazılır.
    - pop  → değer okunur, esp 4 ARTAR.
    - gdb kanıtı: esp c570→c56c→c568→c564 (her push -4), pop'ta geri +4.
    - Neden: program bellekte aşağıdan, stack yukarıdan; ters yönde büyüyüp çarpışmadan boşluğu paylaşırlar.
☐ Niye önemli: fonksiyonların (15) temeli bu. "Nereye döneceğim" + geçici değerler stack'e yazılır.
```

---

## 🔗 İlgili Konular

- [04.5_registerin_ici.md](./04.5_registerin_ici.md) — Register'ların "az" olduğu gerçeği; stack tam da bu darlığın çözümü. `esp` de bir register
- [08_mov_ve_bellek.md](./08_mov_ve_bellek.md) — `[...]` = "adresteki kutu"; `[esp]` = tepedeki değer. Stack sonuçta bellektir
- [08.5_little_endian.md](./08.5_little_endian.md) — Stack'e yazılan dword'ler de bellekte byte byte durur; aynı diziliş kuralı
- [03_sayilar_ikilik_onaltilik.md](./03_sayilar_ikilik_onaltilik.md) — "Neden 4?" — bir dword 4 byte; `esp`'nin 4'er 4'er hareketinin sebebi

---

**Önceki konu:** [13_bit_islemleri.md](./13_bit_islemleri.md)
**Sonraki konu:** [15_call_ve_ret.md](./15_call_ve_ret.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
