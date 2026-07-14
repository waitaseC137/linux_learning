# 🎯 x86 Assembly — İlk Gerçek Program: mov ve Çıkış Kodu

> 05'te yazdığımız üç satır şimdilik **kapalı bir kutuydu** — ne yaptığını tam bilmiyorduk. Şimdi o kutunun ilkini açıyoruz.
> Bu derste işçinin en temel emrini öğreniyorsun: `mov`, yani **"şu kutuya bu sayıyı koy."**
> Ve ilk kez, **senin seçtiğin bir sayının** ekranda belirmesini sağlıyorsun. Küçük bir an —
> ama ilk kez sen komuta geçiyorsun, makine de seni dinliyor.

> **Artık gerçek komut yazıyoruz, ve bu sefer ne yaptığımızı biliyoruz.** 05'teki iskeletin içinden
> `mov`'u çıkarıp aydınlatacağız; `int 0x80`'in tam içini hâlâ [17_sistem_cagrilari](./17_sistem_cagrilari.md)'ya bırakıyoruz.
> Sonunda `echo $?` sana senin koyduğun sayıyı söyleyecek — **"8!"** — ve o an "ben bu makineye bir şey yaptırdım" diyeceksin.

---

## 📋 İçindekiler

- [mov: İşçinin İlk Emri](#mov-i%C5%9F%C3%A7inin-ilk-emri)
- [Çıkış Kodu Nedir?](#%C3%A7%C4%B1k%C4%B1%C5%9F-kodu-nedir)
- [Programı Yaz ve Çalıştır](#program%C4%B1-yaz-ve-%C3%A7al%C4%B1%C5%9Ft%C4%B1r)
- [Sayıyı Değiştir: Komuta Sen Geçtin](#say%C4%B1y%C4%B1-de%C4%9Fi%C5%9Ftir-komuta-sen-ge%C3%A7tin)
- [Bir Kutunun İçini Doğrudan Görebilir miyim?](#bir-kutunun-i%C3%A7ini-do%C4%9Frudan-g%C3%B6rebilir-miyim)

---

## mov: İşçinin İlk Emri

[01_bilgisayar_nedir](./01_bilgisayar_nedir.md)'de işçinin emir çeşitlerine bakarken ilk sıraya "**taşı**" koymuştuk: *"şu kutuya bu sayıyı koy."* İşte o emrin gerçek adı **`mov`** (İngilizce *move*).

Yazılışı çok basit:

```nasm
mov hedef, kaynak        ; "kaynağı, hedef kutuya koy"
```

En sık kullanacağın hâli, bir register'a (cep kutusuna) bir sayı koymaktır:

```nasm
mov eax, 5               ; "eax kutusuna 5 koy"
mov ebx, 100             ; "ebx kutusuna 100 koy"
```

Hatırla, `eax`/`ebx` işçinin cep kutularıydı ([04_bellek_ve_registerlar](./04_bellek_ve_registerlar.md)). `mov`, işte o kutulara değer koymanın yolu — ve işçinin en çok kullandığı emirdir.

> 💡 Adı "taşı" (*move*) ama aslında yaptığı **"kopyala / koy."** Kaynak boşalmaz. Mesela bir kutudan bir kutuya kopyalayabilirsin: `mov ebx, eax` = "eax'tekini ebx'e koy" — eax yine eski değerini korur. (Bunu denedim: `eax`'e 13 koyup `mov ebx, eax` yapınca ebx de 13 oldu, eax kaybolmadı.) `mov`'un bellekle ilgili diğer hâllerini [08_mov_ve_bellek](./08_mov_ve_bellek.md)'te göreceğiz; şimdilik "kutuya sayı koy" yeter.

> 🔑 `mov hedef, kaynak` = "kaynağı hedef kutuya koy." Bu derste tek bilmen gereken komut bu.

---

## Çıkış Kodu Nedir?

Bir program bittiğinde geride küçük bir sayı bırakır: **çıkış kodu** (*exit code*). Bu, programın "işim bitti, ve işte tek sayılık özetim" deme biçimidir. Bir gelenek vardır: **0 = sorun yok / başarılı**, sıfırdan farklı bir sayı = "şöyle bir durum/hata oldu."

Bu sayıyı kim okur? Kabuk. Ve sen `echo $?` ([05_kurulum_ve_ilk_program](./05_kurulum_ve_ilk_program.md)'te tanıştık; *fish kullanıyorsan `echo $status`*) yazınca sana gösterdiği şey işte budur: en son biten programın çıkış kodu.

Peki program bu sayıyı nereye koyar? Bizim kullandığımız çıkış işleminde, çıkış kodu **`ebx` kutusundan** alınır. Yani:

```nasm
mov ebx, 8               ; çıkış kodu artık 8 olacak
```

İşte 05'teki iskeleti hatırla: orada `mov ebx, 0` yazmıştık, o yüzden `echo $?` hep 0 diyordu. Şimdi o 0'ı **kendi seçtiğimiz** bir sayıyla değiştireceğiz.

> 🔑 Çıkış kodu = programın bittiğinde geride bıraktığı tek sayı (gelenek: 0 = sorun yok). Çıkışta bu sayı `ebx` kutusundan okunur; yani `mov ebx, <sayı>` onu belirler. `echo $?` (fish: `echo $status`) ile görürsün.

---

## Programı Yaz ve Çalıştır

Bir editörle **`cikis.asm`** adında bir dosya oluştur ve şunu yaz:

```nasm
section .text
    global _start

_start:
    mov ebx, 8          ; çıkış kodu: 8  ← bizim seçtiğimiz sayı
    mov eax, 1          ; yapılacak iş: "çık" (sys_exit isteği)
    int 0x80            ; çekirdeğe seslen: yukarıdakini yap
```

Artık bu satırların çoğunu okuyabiliyorsun:

- `mov ebx, 8` → "ebx kutusuna 8 koy." Bu, çıkış kodumuz olacak.
- `mov eax, 1` → "eax kutusuna 1 koy." Buradaki 1, çekirdeğe "yapılacak iş **çıkmak**" demenin numarasıdır. (Bu numaraların nereden geldiğini [17_sistem_cagrilari](./17_sistem_cagrilari.md)'da tam açacağız.)
- `int 0x80` → "çekirdeğe seslen, yukarıda hazırladığımı yap." (Bunun içi de 17'de.)

Şimdi 05'teki **aynı zincirle** çevir, birleştir, çalıştır:

```
nasm -f elf32 cikis.asm -o cikis.o
ld -m elf_i386 cikis.o -o cikis
./cikis
echo $?
```

Göreceğin:

```
8
```

İşte o! Ekrandaki bu **8**, 05'teki gibi rastgele bir 0 değil — **senin `mov ebx, 8` ile koyduğun sayı.** İlk kez makineye bir sayı söyledin, o da onu sana geri verdi.

> 💡 *fish kabuğundaysan* son satır `echo $status` olacak (bkz. 05). Sonuç aynı: `8`.

> 💡 **Aklınıza takılabilir:** *"Ya o son satırları (`mov eax, 1` + `int 0x80`) hiç yazmazsam? İşçi `mov ebx, 42`'yi yaptıktan sonra kendi kendine durur mu?"* Hayır — ve sebebi önemli: **işçinin kendiliğinden duracağı bir yer yoktur.** Listenin bitmesi "dur" demek değildir. Çıkışı yazmazsan işçi getir-yap-ilerle'ye devam eder; senin son satırından sonraki **bellek çöplüğünü** komut sanıp okur — frensiz araba gibi, kodun bittiği uçurumdan aşağı dalar. Çok geçmeden izni olmayan bir belleğe dokunur, ve **işte o an işletim sistemi devreye girer:** seni durdurup **sadece senin programını** öldürür. Terminal `Segmentation fault` der, `echo $?` de **139** verir (yani "bir sinyalle öldürüldü"). Gerçekten denedim: çıkışsız `mov ebx, 42` → `Segmentation fault`. **Ama bilgisayar sapasağlam** — çekirdek kapıdaki fedai gibi, yaramaz process'i dışarı atar, sisteme dokundurmaz. (02'deki "bir şeyi bozar mıyım" korkusunun kanıtı: sıradan bir programla makineyi kilitleyemezsin.) Dersin özü: **işçiye "dur" demek senin görevin** — o üç satırın sonuncusu işte bu yüzden var.

---

## Sayıyı Değiştir: Komuta Sen Geçtin

Şimdi işin tadını çıkar. `cikis.asm`'i aç, `8`'i başka bir sayıyla değiştir — mesela `42` yap:

```nasm
    mov ebx, 42         ; çıkış kodu: 42
```

Tekrar çevir, birleştir, çalıştır (üç komut), sonra `echo $?`:

```
42
```

Ne koyduysan onu görüyorsun. Gerçekten denedim: `8 → 8`, `42 → 42`. **Çıktıyı artık sen belirliyorsun** — işte programlamanın özü bu. Küçük bir sayı gibi görünüyor ama burada büyük bir kapı açıldı: makine senin dediğini yapıyor.

> 💡 **Aklınıza takılabilir:** *"`ebx`'e 300 koyup denedim, ama `echo $?` 44 dedi — neden 300 değil? Bir de eksi sayı koysam ne olur?"* Çünkü çıkış kodu **tek bir byte**'tır ([03_sayilar_ikilik_onaltilik](./03_sayilar_ikilik_onaltilik.md)): sadece 0–255 tutar, ve **iki yöne de dolanır** — tıpkı arabanın kilometre sayacı gibi. Yukarı taşar: `300` sığmaz, tepeden döner → `300 − 256 = 44`. Aşağı eksi dipten sarar: `mov ebx, -5` denedim, `echo $?` **251** dedi (`-1 → 255`, `-2 → 254`, … `-5 → 251`). Eksiyi byte içinde böyle saklama numarasının adı *two's complement*; nasıl çalıştığını ileride aritmetik konusunda ([09_aritmetik](./09_aritmetik.md)) tam açacağız. Şimdilik: **çıkış kodu 0–255 arası bir byte, iki yöne de dolanır.**

---

## Bir Kutunun İçini Doğrudan Görebilir miyim?

Şöyle düşünmüş olabilirsin: "8'i `ebx`'e koydum, `echo $?` ile gördüm. Peki `eax`'e bir şey koyarsam onu da görebilir miyim?"

Şu an **göremezsin** — ve nedeni önemli: `echo $?` sadece **çıkış kodunu** gösterir, o da yalnızca `ebx`'ten gelir. Yani şu anki tek "pencere"n `ebx` (çıkış kodu yoluyla). `eax`'e 8 koysan bile `echo $?` onu göstermez; o hep `ebx`'e bakar.

Peki herhangi bir kutunun (`eax`, `ecx`, `edx`… ) içini, **istediğin an** görmek istersen? İşte bunun için bir alete ihtiyacın var: **`gdb`** (05'te kurmuştuk, hatırla). Bir sonraki ders ([07_gdb_tek_adim](./07_gdb_tek_adim.md)) tam bunun için: gdb bütün pencereleri açar — program çalışırken her kutunun değerini tek tek izlersin. "Komut yaz → ne değişti gör" anların orada başlıyor.

> 🔑 Şu an bir kutunun içini görmenin tek yolu: onu çıkış koduna (`ebx`) koyup `echo $?` demek. Bütün kutuları istediğin an görmeyi 07'de `gdb` ile açacağız.

---

## Özet — Aklında Tut

```
☐ mov hedef, kaynak  = "kaynağı hedef kutuya koy." İşçinin en temel emri.
    - mov eax, 5     → eax'e 5 koy        (kutuya sayı)
    - mov ebx, eax   → eax'tekini ebx'e kopyala  (kaynak boşalmaz; "move" aslında "kopyala")
☐ Çıkış kodu = program bitince bıraktığı tek sayı (gelenek: 0 = sorun yok).
    - Çıkışta ebx'ten okunur → mov ebx, <sayı> onu belirler.
    - echo $?  (fish: echo $status)  ile görürsün.
☐ İlk anlamlı program: mov ebx, <sayı> + mov eax, 1 + int 0x80.
    Zincir: nasm -f elf32 → ld -m elf_i386 → ./cikis → echo $?  → senin sayın!
☐ Çıkış kodu TEK BYTE'tır (03): 0..255. İki yöne de dolanır: üstü taşar (256→0, 300→44), eksi dipten sarar (-5→251). 
☐ İşçi kendiliğinden DURMAZ: çıkışı (int 0x80) yazmazsan bellek çöplüğüne koşar → Segmentation fault (139). Ama çekirdek sadece process'i öldürür, sistem sağlam.
☐ echo $? sadece ebx'i (çıkış kodunu) gösterir. Diğer kutuları görmek için → gdb (07).
```

---

## 🔗 İlgili Konular

- [01_bilgisayar_nedir.md](./01_bilgisayar_nedir.md) — "Taşı" emrinin ve "sonucu çıkış koduna koyma" fikrinin ilk önizlendiği yer
- [07_gdb_tek_adim.md](./07_gdb_tek_adim.md) — Bütün kutuların (register'ların) içini canlı görmek
- [09_aritmetik.md](./09_aritmetik.md) — `add`/`sub` ile artık sadece koymak değil, hesaplamak

---

**Önceki konu:** [05.5_perde_arkasi.md](./05.5_perde_arkasi.md)
**Sonraki konu:** [07_gdb_tek_adim.md](./07_gdb_tek_adim.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
