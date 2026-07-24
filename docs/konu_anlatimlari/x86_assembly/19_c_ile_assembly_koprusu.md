# 🌉 x86 Assembly — C ile Assembly Köprüsü

> Bu kurs boyunca assembly'yi **elle** yazdık — her `mov`'u, her `push`'u sen düşünüp koydun. Ama gerçek dünyada kimse koca programları böyle yazmaz; C, C++, Rust gibi **üst diller**le yazar, sonra bir **derleyici** onları assembly'ye çevirir.
> Peki o derleyici ne üretiyor? İşte bu dersin sürprizi (ve bütün kursun ödülü): derleyicinin ürettiği şey, **senin bu kursta elle yazdığın kalıpların ta kendisi.** Bir C programının assembly'sine bakacağız ve orada — `push ebp`, `[ebp+8]`, `add`, `ret` — hep tanıdıklarını göreceksin. O an, "derlenmiş kodu okuyabilen" birine döneceksin.

> **Bu derste kod var ve hepsini çalıştırıyoruz.** Aşağıdaki C kaynağı ve ürettiği assembly gerçek: kendi makinemde `gcc` ile derleyip çıktısını aldım.

---

## 📋 İçindekiler

- [Elle Değil, Derleyiciyle: C Nereden Geliyor?](#elle-de%C4%9Fil-derleyiciyle-c-nereden-geliyor)
- [Minik Bir C Fonksiyonunu Derle](#minik-bir-c-fonksiyonunu-derle)
- [Tanıdık Kalıplar: Senin Elle Yazdığın](#tan%C4%B1d%C4%B1k-kal%C4%B1plar-senin-elle-yazd%C4%B1%C4%9F%C4%B1n)
- [Optimizasyon: `× 8` Neden `shl` Oldu?](#optimizasyon--8-neden-shl-oldu)

---

## Elle Değil, Derleyiciyle: C Nereden Geliyor?

00'da şunu söylemiştik: sen assembly yazarsın → `nasm` (bir *assembler*) onu makine koduna çevirir. Assembler'ın işi kolaydı, çünkü assembly zaten makine koduna birebir yakındı — sadece etiketleri sayılara çeviriyordu.

Üst diller (C gibi) bir katman daha yukarıdadır. `a + b` yazarsın; ama işlemci "a + b" diye bir şey bilmez — `mov`, `add`, register'lar bilir. Aradaki çeviriyi yapan programa **derleyici** (*compiler*) denir. Bizim kullanacağımız `gcc`, C kaynağını alıp **assembly üretir** — yani tam da bu kursta senin kafandan yaptığın işi, otomatik yapar.

Ve işin güzeli: `gcc`'ye "çevir ama assembly'de dur, makine koduna kadar gitme" diyebiliriz. Böylece derleyicinin **hangi assembly'yi** ürettiğini gözümüzle görürüz. Komut: `gcc -S` (`-S` = "assembly'de dur").

> 🔑 Üst diller (C...) işlemcinin doğrudan anlamadığı dillerdir; onları assembly'ye çeviren programa **derleyici** denir (`gcc`). `nasm` senin asm'ini makine koduna çevirir; `gcc` ise C'yi **asm'ye** çevirir — yani senin bu kursta elle yaptığın işi. `gcc -S` ile o ürettiği asm'yi görebiliriz.

---

## Minik Bir C Fonksiyonunu Derle

Tanıdık bir örnek seçelim — 16'da elle yazdığımız toplama fonksiyonunun C hâli. `topla.c`:

```c
int topla(int a, int b) {
    return a + b;
}
```

Türkçesi: "iki sayı (`a`, `b`) al, toplamlarını döndür." 16'daki `topla` fonksiyonunun aynısı, ama üç satır okunur C kodu. Şimdi `gcc`'ye bunu 32-bit assembly'ye çevirmesini söyleyelim:

```
gcc -m32 -S -masm=intel -O0 -fno-pie -fno-pic topla.c -o topla.s
```

Bayrakları tanıyalım: `-m32` (bizim öğrendiğimiz 32-bit), `-S` (assembly'de dur), `-masm=intel` (bu kurstaki Intel yazımı — `nasm`'a benzesin diye), `-O0` (optimizasyon yapma, düz çevir). Son ikisi, `-fno-pie -fno-pic`, şimdilik kapalı bir kutu: derleyiciyi eski-tarz, basit çıktı üretmeye zorlarlar. Olmasalar modern gcc araya fazladan adres-hesabı kodu katardı ve çıktı bulanırdı — biz de tertemiz iskeleti göremezdik. Detayı bu kursun konusu değil, korkma. Ürettiği `topla.s` dosyasının çekirdeği:

```nasm
topla:
    push  ebp
    mov   ebp, esp
    mov   edx, DWORD PTR [ebp+8]
    mov   eax, DWORD PTR [ebp+12]
    add   eax, edx
    pop   ebp
    ret
```

Bu çıktıya bir dakika bak. Tek bir yabancı satır var mı?

> 💡 **Aklınıza takılabilir:** *"`DWORD PTR [ebp+8]` de ne? Biz `[ebp+8]` yazıyorduk."* Aynı şey. `gcc`'nin yazımında `DWORD PTR [ebp+8]` = "`[ebp+8]` adresindeki **4 byte'lık (dword)** değer" demek — `nasm`'da çoğu zaman boyut bağlamdan anlaşıldığı için biz kısaca `[ebp+8]` yazıyorduk. İki assembler'ın küçük yazım farkları olur (tıpkı iki lehçe gibi); ama **anlattıkları makine komutu birebir aynı.**

---

## Tanıdık Kalıplar: Senin Elle Yazdığın

Şimdi o çıktıyı satır satır **etiketleyelim** — ve her satırın hangi dersten tanıdığın olduğunu gör:

```nasm
topla:
    push  ebp                    ; ┐ PROLOGUE          → 16. ders
    mov   ebp, esp               ; ┘ (çıpayı kur)
    mov   edx, DWORD PTR [ebp+8]  ; 1. argüman (a)      → 16. ders ([ebp+8])
    mov   eax, DWORD PTR [ebp+12] ; 2. argüman (b)      → 16. ders ([ebp+12])
    add   eax, edx               ; a + b               → 09. ders (add)
    pop   ebp                    ; ┐ EPILOGUE          → 16. ders
    ret                          ; ┘ (çağırana dön)    → 15. ders (ret)
```

**İşte kursun bütün ödülü bu tabloda.** Derleyici, `a + b` gibi masum bir C satırını, tam da senin 16'da **elle kurduğun** iskelete çevirdi: prologue ile `ebp` çıpasını kur, argümanları `[ebp+8]` ve `[ebp+12]`'den oku (16'daki sözleşme!), `add` ile topla (09) — **sonuç `eax`'te kalır, ki cdecl'de dönüş değerinin durduğu yer orasıdır (16); C'deki `return a + b;`'nin "döndür" kısmı işte bu, ayrı bir komut değil** — epilogue ile temizle ve `ret`'le dön (15). Sen kurstan önce baksan bu bir gizemdi; şimdi **okuyabiliyorsun.**

(Küçük bir fark: derleyici toplamı hesaplarken `edx`'i geçici olarak kullandı, biz elle yazarken doğrudan `eax`'i kullanmıştık. Bu normal — hangi register'ı geçici olarak seçeceği derleyicinin tercihidir; ikisi de aynı sözleşmeye uyduğu sürece sonuç değişmez.)

> 🔑 Bir C programını `gcc -S` ile çevirdiğinde, karşına bu kursta öğrendiğin **kalıplar** çıkar: prologue/epilogue (16), `[ebp+8]` argümanlar (16), `add`/`sub` (09), `call`/`ret` (15). C "sihir" değil — bu kalıplara derlenir. Assembly'yi öğrenmek = **derlenmiş her programı okuyabilmek.** Tersine mühendisliğin kapısı burada açılır.

---

## Optimizasyon: `× 8` Neden `shl` Oldu?

Yukarıda `-O0` dedik: "optimizasyon yapma, düz çevir." Ama derleyiciye "**hızlandır**" (`-O1`) dersen, çok daha zeki davranır — ve 13'te sana verdiğim bir sözü burada göreceksin. 13'te "`shl` = ×2ⁿ, derleyiciler 2'nin katıyla çarpmayı `shl`'e çevirir, 19'da göreceksin" demiştim. Kanıtlayalım. `carp8.c`:

```c
int carp8(int x) {
    return x * 8;
}
```

`gcc -m32 -S -masm=intel -O1 -fno-pie -fno-pic carp8.c -o carp8.s` ile çevir (aynı bayraklar, tek fark `-O0` yerine `-O1`). Ürettiği:

```nasm
carp8:
    mov   eax, DWORD PTR [esp+4]   ; x'i al
    sal   eax, 3                   ; x << 3  = x × 8   ← ÇARPMA DEĞİL, KAYDIRMA!
    ret
```

**İşte 13'ün sözü.** 13'te sana `shl` demiştim; gcc burada `sal` yazdı — şaşırma, beklediğin komut bu: **sola kaydırmada `sal` ile `shl` birebir aynı komuttur** (aynı makine kodu, aynı opcode), sadece iki farklı isim. C'de `x * 8` yazdın, ama derleyici bir çarpma komutu (`mul`) koymadı — onun yerine `sal eax, 3` (sola 3 kaydır = ×2³ = ×8) koydu, çünkü kaydırma çok daha hızlı (13). C'de "çarpma" gördün; makinede bir **bit kaydırma** var. İkisi aynı sonucu verir ama derleyici hızlısını seçti.

Küçük bir ek gözlem: `-O1` açıkken `push ebp`/`mov ebp, esp` prologue'u **bile yok** — derleyici, bu minik fonksiyonun `ebp` çıpasına ihtiyaç duymadığını görüp atlamış, argümanı doğrudan `[esp+4]`'ten okumuş.

Neden az önceki gibi `[ebp+8]` değil de `[esp+4]`? Üç adımda:

- Fonksiyona girildiği an stack'in tepesinde (`[esp]`) **dönüş adresi** durur; 1. argüman onun hemen üstünde: **`[esp+4]`**.
- Prologue **olsaydı**, `push ebp` `esp`'yi 4 byte aşağı iter, `mov ebp, esp` çıpayı oraya sabitlerdi — o yüzden `ebp`'ye göre argüman 4 byte daha uzakta kalırdı: **`[ebp+8]`**.
- Bu fonksiyonda prologue **yok**, o itiş hiç olmadı; ölçüyü doğrudan `esp`'den yapıyoruz: **`[esp+4]`**.

("Hani `esp` sürekli oynuyordu, ona güvenmek tehlikeliydi (16)?" — evet; ama bu minik fonksiyon stack'e hiç dokunmuyor (`push`/`pop`/`call` yok), o yüzden `esp` baştan sona **kıpırdamıyor** ve burada ona güvenmek güvenli.)

(16'da "prologue bir *kolaylık*, mecburiyet değil" demiştik; işte kanıtı.) Optimize edilmiş kod, elle yazdığından daha "kurnaz" görünür — ama altında hep bildiğin komutlar vardır.

> 🔑 `-O1`/`-O2` (optimizasyon) açıkken derleyici zekileşir: `× 8` → `shl/sal` (13), gereksiz prologue'u atar, register'ları kurnazca kullanır. Bu yüzden optimize edilmiş kod ilk bakışta yabancı görünebilir — ama tuğlaları hep bu kursun tuğlalarıdır. Tersine mühendislikte işin çoğu, bu "kurnaz ama tanıdık" kalıpları sökmektir.

---

## Özet — Aklında Tut

```
☐ Üst dil (C) → DERLEYİCİ (gcc) → assembly.  (nasm: senin asm'ini makine koduna; gcc: C'yi asm'ye.)
    gcc -m32 -S -masm=intel  → derleyicinin ürettiği asm'yi GÖR (-S = asm'de dur).
☐ int topla(int a,int b){return a+b;}  →  DERLEYİCİ ŞUNU ÜRETTİ:
    push ebp / mov ebp,esp        (PROLOGUE, 16)
    mov ..., [ebp+8] / [ebp+12]   (argümanlar, 16)
    add                            (09)
    pop ebp / ret                  (EPILOGUE 16 + ret 15)
    → yani senin ELLE yazdığının aynısı. C sihir değil; bu kalıplara derlenir.
☐ Optimizasyon (-O1): x*8 → sal eax,3 (13'ün ×2ⁿ'i, çarpma değil kaydırma); gereksiz prologue atılır.
    Optimize kod "kurnaz" görünür ama tuğlaları hep bu kursunki.
☐ BÜYÜK KAZANIM: assembly bilmek = DERLENMİŞ HER PROGRAMI OKUYABİLMEK. Tersine mühendisliğin kapısı bu.
☐ DWORD PTR [ebp+8] (gcc) = [ebp+8] (nasm): aynı komut, farklı lehçe.
```

---

## 🔗 İlgili Konular

- [16_calling_convention.md](./16_calling_convention.md) — Derleyicinin ürettiği prologue/epilogue ve `[ebp+8]` argümanları; bu ders onun "gerçekte de böyle" kanıtı
- [13_bit_islemleri.md](./13_bit_islemleri.md) — "`shl` = ×2ⁿ, derleyiciler çarpmayı kaydırmaya çevirir" sözü; işte `x*8 → sal eax,3`
- [09_aritmetik.md](./09_aritmetik.md) — `add`; C'nin `a + b`'si aynı komuta iniyor
- [00_buradan_basla.md](./00_buradan_basla.md) — "Bir C programını derleyip asm'sine bakınca tanıdık kalıpları göreceksin" vaadi; işte tuttu

---

**Önceki konu:** [18_ilk_etkilesimli_program.md](./18_ilk_etkilesimli_program.md)
**Sonraki konu:** [20_buradan_nereye.md](./20_buradan_nereye.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
