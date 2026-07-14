# 🧭 x86 Assembly — Buradan Başla (Gerçekten Sıfırdan)

> Bilgisayar sihir değildir. İçinde, çok basit şeyleri **akıl almaz bir hızla** yapan,
> ama tek bir gram hayal gücü olmayan bir işçi vardır.
> Bu işçi yalnızca bir avuç emir anlar: *"şu kutuya bu sayıyı koy", "şu ikisini topla", "şuraya atla."*
> Assembly, o işçiye anladığı **tek dilde** yapılacaklar listesi yazma sanatıdır.

> **Bu kurs kimin için?** Bilgisayarı açmayı bilen herkes. Terminal görmemiş olman,
> daha önce hiç kod yazmamış olman, "register ne demek" bilmemen tamamen normal —
> hepsini buradan, sıfırdan kuracağız. Tek ön koşul: sabır ve merak.

> 🚧 **Bu kurs YAZIM AŞAMASINDA — devam ediyor.** Şu an yazılı: **Ünite 0** (makine modeli, 00–04.5) + **Ünite 1'in başı** (05, 05.5, 06 — ilk `mov` programı — ve **07** — gdb ile tek adım). Yol haritasındaki **08'den sonrası planlı ama henüz yazılmadı** (aşağıda `🚧` işaretli, linksiz). Kurs ilerledikçe eklenecek.

---

## 📋 İçindekiler

- [Bu Kurs Ne DEĞİLDİR](#bu-kurs-ne-de%C4%9Fildir)
- [Önce Korkuyu Kıralım](#%C3%B6nce-korkuyu-k%C4%B1ral%C4%B1m)
- [Sonunda Ne Yapabileceksin?](#sonunda-ne-yapabileceksin)
- [Büyük Resim: Assembly Neden Var?](#b%C3%BCy%C3%BCk-resim-assembly-neden-var)
- [Yol Haritası — Ünite Ünite](#yol-haritas%C4%B1--%C3%BCnite-%C3%BCnite)
- [Nasıl Çalışmalısın?](#nas%C4%B1l-%C3%A7al%C4%B1%C5%9Fmal%C4%B1s%C4%B1n)
- [Bir Şey Bozulursa](#bir-%C5%9Fey-bozulursa)

---

## Bu Kurs Ne DEĞİLDİR

- **Hızlı bir kurs değil.** Acele etmeyeceğiz. Her kavram, bir öncekinin üstüne oturacak. Atladığın bir taş, ileride seni düşürür.
- **Ezber kursu değil.** Komut listesi ezberletmeyeceğim. Her komutu, ona *ihtiyaç duyduğun an* tanıtacağım — böylece "bu niye var?" sorusu hiç doğmayacak.
- **Program yazma maratonu değil** (ama yazacağız). Amaç önce **anlamak**: makine içeride aslında ne yapıyor? Onu anladığında kod kendiliğinden gelir.
- **C / Python / "gerçek" programlama bilmeni beklemiyor.** Hiçbir dil bilmesen de buradan başlayabilirsin.

---

## Önce Korkuyu Kıralım

Çoğu kaynak seni doğrudan `EAX`, `0xdeadbeef`, `mov dword ptr [ebp-0x4]` gibi şeylerle karşılar ve insan haklı olarak "bu benlik değil" der.

Sana bir sır vereyim: **assembly'nin zor kısmı komutlar değil.** `mov`, `add`, `jmp` gibi komutlar şaşırtıcı derecede basittir — birazdan göreceksin. Asıl mesele **makinenin nasıl düşündüğünü** (daha doğrusu *düşünmediğini*) kafanda canlandırmak.

Bunu bir kez oturttuğunda, gerisi su gibi akar. İlk ünitenin tamamı buna ayrıldı — orada **tek satır kod yazmayacağız.** Sadece resmi kuracağız.

> 💡 Takılmak, kafanın karışması, "ben mi aptalım" hissi — hepsi normal ve **herkes** bu kapıdan geçer. Yavaşlamak burada zaaf değil, yöntemdir. Bir bölümü iki kez okumak ayıp değil; tavsiye.

---

## Sonunda Ne Yapabileceksin?

Bu kursu bitirdiğinde:

- Bir bilgisayarın "çalışmak" derken aslında ne yaptığını **somut olarak** anlatabileceksin.
- İkilik (binary) ve onaltılık (hex) sayıları rahatça okuyacaksın.
- Kendi 32-bit assembly programlarını **yazıp çalıştırabileceksin** (ekrana yazı basan, hesap yapan, karar veren, döngü kuran).
- Bir programı GDB ile **tek tek adım** atarak izleyip "şu an ne oldu?" sorusunu cevaplayabileceksin.
- Bir C programını derleyip onun assembly'sine bakınca, **tanıdığın kalıpları** görebileceksin.

Yani: "bilgisayar bir kutu" olmaktan çıkıp, içini görebilen birine döneceksin.

---

## Büyük Resim: Assembly Neden Var?

İnsanların okuduğu diller (Python, C...) bilgisayarın **doğrudan anladığı** diller değildir. Bilgisayarın anladığı tek şey, devasa bir **sayı dizisidir** — buna *makine kodu* denir. Mesela işlemciye "EAX kutusuna 5 koy" demek için aslında ona şu sayıyı gönderirsin: `B8 05 00 00 00`.

Bu sayıları elle yazmak imkânsıza yakındır. **Assembly**, bu sayılara takılan **insan-okunur etiketlerdir**:

```
Makine kodu (işlemcinin gördüğü):   B8 05 00 00 00
Assembly (senin yazdığın):          mov eax, 5        ← "EAX'a 5 koy"
```

İkisi **birebir aynı şeydir.** Assembly, makine koduna en yakın insan dilidir — araya sihir, gizli iş, görünmeyen kurallar girmez. Bu yüzden assembly öğrenmek = makinenin gerçekte ne yaptığını öğrenmektir. Daha üst diller (C, Python) bu makinenin üstüne kurulu **kolaylık katmanlarıdır.**

> 🔑 Akılda kalsın: **Sen assembly yazarsın → `nasm` adlı bir program onu makine koduna (sayılara) çevirir → işlemci o sayıları okuyup yapar.** Çevirmenin adı *assembler*'dır; bizimki `nasm`.

---

## Yol Haritası — Ünite Ünite

Dosyaları bu sırayla oku. Her ünite bir öncekine yaslanır.

### 🧩 Ünite 0 — Daha Hiç Kod Yok: Makineyle Tanışma

> Burada **tek satır kod yazmayacağız.** Sadece makinenin zihin modelini kuracağız. Bu ünite kursun temelidir; sağlam atılmazsa üstü tutmaz.

| # | Dosya | Ne öğretir | Kazanım |
|:---:|---|---|---|
| 1 | [01_bilgisayar_nedir](./01_bilgisayar_nedir.md) | Bilgisayar = numaralı kutular + işçi; "çalışmak" ne demek | Zihin modeli |
| 1.5 | [01.5_sayi_ve_anlam](./01.5_sayi_ve_anlam.md) | "Her şey sayı" ise kedi videosu nasıl oluyor; anlamı kod verir | Sayı ≠ anlam |
| 2 | [02_terminal_ile_tanisma](./02_terminal_ile_tanisma.md) | Terminal nedir, nasıl açılır, komut yazıp çıktı okumak | İlk "ben yaptım" anı |
| 3 | [03_sayilar_ikilik_onaltilik](./03_sayilar_ikilik_onaltilik.md) | İkilik/onaltılık — makinenin saydığı gibi saymak | Adres ve değer okuma |
| 4 | [04_bellek_ve_registerlar](./04_bellek_ve_registerlar.md) | Bellek (kutular) ve register (işçinin elleri) | Asm'nin oynadığı saha |
| 4.5 | [04.5_registerin_ici](./04.5_registerin_ici.md) | Register'ın içi: AL/AH/AX/EAX, "aynı bitler, farklı pencere" | Register anatomisi |

> 💡 Numarası `.5` ile biten dosyalar (`1.5`, `4.5`, `5.5`…) birer kısa **ara ders**tir: ana yola eklenmiş ama daha hafif. Acelen varsa atlayabilirsin; ama "kedi videosu nasıl sayı oluyor?", "register'ın içinde ne var?", "o komutlar perde arkasında ne yaptı?" gibi çok sorulan noktaları orada netleştiriyoruz.

### ⚙️ Ünite 1 — İlk Komutlar: İşçiye Emir Vermek

| # | Dosya | Ne öğretir | İlk çalışan şey |
|:---:|---|---|---|
| 5 | [05_kurulum_ve_ilk_program](./05_kurulum_ve_ilk_program.md) | `nasm`/`ld`/`gdb` kurulumu, "yaz → çevir → çalıştır" zinciri | Hiçbir şey yapmayıp çıkan program |
| 5.5 | [05.5_perde_arkasi](./05.5_perde_arkasi.md) | Perde arkası: `./` ve PATH, `nasm` vs `ld`, `_start` aslında ne | (kod yok) |
| 6 | [06_ilk_gercek_program](./06_ilk_gercek_program.md) | `mov` ile register'a değer, çıkış kodu, `echo $?` | Ekranda bir sayı: "8!" |
| 7 | [07_gdb_tek_adim](./07_gdb_tek_adim.md) | GDB'de tek adım at, register'ları izle | "Komut yaz → ne değişti gör" |
| 8 | 08_mov_ve_bellek 🚧 *(yazılıyor)* | `mov` çeşitleri, `[...]` = kutudaki adresin gösterdiği yer | İlk pointer sezgisi |
| 9 | 09_aritmetik 🚧 *(yazılıyor)* | `add`, `sub`, `inc`, `dec` | Minik bir hesap makinesi |

### 🔀 Ünite 2 — Akış: İşçiye Karar Verdirmek

| # | Dosya | Ne öğretir | İlk çalışan şey |
|:---:|---|---|---|
| 10 | 10_bayraklar_ve_cmp 🚧 *(yazılıyor)* | Bayraklar (ZF/SF...), `cmp`/`test` | "İşçi karşılaştırmayı nasıl hatırlar" |
| 11 | 11_ziplamalar 🚧 *(yazılıyor)* | `jmp`, `jz`, `jnz`, `jl`, `jg` | "Çift mi tek mi" programı |
| 12 | 12_donguler 🚧 *(yazılıyor)* | Sayaç + koşullu zıplama ile döngü | 10'dan geriye sayım, 1..N toplamı |
| 13 | 13_bit_islemleri 🚧 *(yazılıyor)* | `and`, `or`, `xor`, `shl`, `shr` | `xor eax, eax` neden "sıfırla"dır |

### 🧱 Ünite 3 — Parçalar ve İşletim Sistemi

| # | Dosya | Ne öğretir | İlk çalışan şey |
|:---:|---|---|---|
| 14 | 14_stack 🚧 *(yazılıyor)* | `push`/`pop`, stack neden ters büyür | İşçinin "not defteri" |
| 15 | 15_call_ve_ret 🚧 *(yazılıyor)* | Fonksiyonlar, dönüş adresi, `call`/`ret` ikilisi | Tekrar kullanılabilir parça |
| 16 | 16_calling_convention 🚧 *(yazılıyor)* | cdecl: parçaya veri verme, dönüş değeri, prologue/epilogue | "Topla(3,5)" çağırmak |
| 17 | 17_sistem_cagrilari 🚧 *(yazılıyor)* | `int 0x80`, syscall numaraları, ekrana yazı/girdi | Gerçek "Merhaba Dünya" |
| 18 | 18_ilk_etkilesimli_program 🚧 *(yazılıyor)* | Her şeyi birleştir | İsim soran, selamlayan asm programı |

### 🌉 Ünite 4 — Köprü

| # | Dosya | Ne öğretir |
|:---:|---|---|
| 19 | 19_c_ile_assembly_koprusu 🚧 *(yazılıyor)* | Minik bir C programını derle, asm'sine bak, tanıdık kalıpları gör |
| 20 | 20_buradan_nereye 🚧 *(yazılıyor)* | 64-bit'e geçiş, tersine mühendislik, exploitation ve ileri kaynaklar |

---

## Nasıl Çalışmalısın?

1. **Sırayı bozma.** Ünite 0 sıkıcı gelse de atlama — üstündeki her şey ona dayanıyor.
2. **Her komutu kendin çalıştır.** Okumak yetmez; assembly *parmak ucuyla* öğrenilir. Bir programı yazıp çalıştırmadan o dersi bitmiş sayma.
3. **GDB'de izle.** Bir komut ne yapıyor anlamadıysan, GDB'de tek adım atıp register/belleğin nasıl değiştiğini **gözünle gör.** (Ünite 1'de kuracağız.) Bu, tüm kursun en güçlü öğrenme aracı.
4. **Takılınca geri dön.** Anlamadığın bir terim, neredeyse her zaman *bir önceki* derste açıklanmıştır. Geri gitmek normal.
5. **Yavaş = hızlı.** Acele edip yarım anlamak, ileride iki katı zaman kaybettirir.

---

## Bir Şey Bozulursa

Bu kurs boyunca hata almak **işin parçasıdır** — programcılık zaten "hata al, düzelt" döngüsüdür. Bir komut çalışmadığında panikleme; çoğu zaman bir harf/sayı hatası ya da atlanmış bir adımdır. Ünite 1'de "hata mesajını okumayı" da öğreneceğiz.

---

## 🔗 Sonraki Adım

- [01_bilgisayar_nedir.md](./01_bilgisayar_nedir.md) — buradan devam et. Önce makinenin ne olduğunu anlayacağız; tek satır kod yok, sadece resmi kuruyoruz.

> 🎯 **Kursu bitirince nereye?** Bu asm temeli, aynı repodaki **[Binary Exploitation serisi](../binary_exploitation/00_buradan_basla.md)**'nin (programların akışını *bükme*) ve OverTheWire wargame'lerinin doğrudan ön hazırlığıdır — önce *"işçiye emir vermeyi"* öğren, sonra *"emri bük."*

---

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
