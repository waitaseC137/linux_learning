# 🧭 Yol Haritası — İşlemciden Kuantuma

> `nand2shell` öğrenme rotasının iskeleti. Aşağıdan yukarı: fizikten (voltaj)
> çekirdeğe, oradan gizli katmanlara, farklı işlemci felsefelerine ve en sonda
> bambaşka bir makineye — kuantuma.
>
> ✅ **Durum işaretleri artık güncel tutuluyor** (2026-09-12'de açıldı; önceden
> bilinçli olarak hepsi boştu). Anlamları:
>
> | | |
> |---|---|
> | `[x]` | oturdu |
> | `[ ]` 🚧 | başlandı, yarım |
> | `[ ]` | henüz başlanmadı |
>
> Bir üst madde ancak **altındaki bütün maddeler** kapandığında `[x]` olur; biri
> açıksa üst madde 🚧 kalır. Böylece "neredeyse bitti" ile "bitti" karışmaz.
>
> **"Bitti"yi Claude değil Poyraz söyler.** Bir konu anlatıldığı için değil,
> "oturdu" dendiği için kapanır — bu kural yukarıdaki *Yöntem* bölümünde de var.

> 🗺️ **Bu dosya HARİTA, ders defteri değil.** Adım adım "şunu yap / şu komut"
> detayı burada TUTULMAZ — o basamağa gelince, tek konu, o oturumda üretilir
> (istenirse sonra `konu_anlatimlari/`'ya kanonikleşir). Böylece harita hep bir
> bakışta okunur; derinlik yalnızca üstünde olunan tek konu için gelir. Ne sen
> ne Claude Code bu dosyayı adım adım detayla şişirmez.

---

## Yöntem — İkili Beyin

İki tür basamak var; her bölümde hangisinin baskın olduğu italikle belirtilir:

- **Çöz-yarış** — Claude Code ve ben ayrı ayrı çözer, sonra beyin fırtınası
  yaparız (organik + yapay beyin). Örn: OverTheWire lab'ları, NandGame seviyeleri.
- **Sök-anla** — kendi çipimi (GR16 / Ryzen 9 8940HX) birlikte kurcalayıp
  davranışını çıktısından okuruz. Örn: mimari ölçümler, microcode söküm.

**"Bitti" kuralı:** bir konu, Claude anlatınca değil, ben "oturdu" deyince kapanır.

**Referans donanım:** AMD Ryzen 9 8940HX (GR16) — Zen 4, 16C/32T, 2 CCD,
2×32 MB L3, AVX-512. Her iddia kendi çipimden kanıtla.

---

## Bölüm 0 — Pusula

- [x] Felsefe: "bu duvar fizik mi, politika mı?"
- [x] Felsefe: "bana sunulanın dışına çıkarsam ne olur?"
- [x] AI = yeni işlemci; düşünceyi devretmeden kullan (araç, otorite değil)
- [x] İkili amaç — net bölünme: anla (her durak zemin verir) + üret
      (seçili duraklar somut bir çıktı bırakır; gerisi anla-yeter)
- [x] Çalışma düzeni: 3 şerit (mimari durak → elle kurma → x86 kursu → başa dön)

---

## Bölüm 1 — İşlemci GERÇEKTEN Nedir: Bütünleşik Merdiven

> *Tek sürekli hikâye. Mod: sök-anla + NandGame çöz-yarış.*
>
> *Hangi kavramın hangi NandGame seviyelerine denk geldiği maddelerin yanında
> yazıyor — dördü birlikte oyunun 30 seviyesinin tamamını kaplar. Ders ↔ seviye
> eşlemesinin tam tablosu
> [00_buradan_basla](./konu_anlatimlari/salterden_bilgisayara/00_buradan_basla.md)'da.*

### 1A — Temel yarı (voltaj → x86 komutu)

- [x] Voltaj: 1/0 = yüksek/alçak tel (sayı değil, fiziksel gerilim)
    - [x] eşik + gürültü payı: aradaki "gri bölge" neden yok sayılır
    - [x] neden 2 seviye? çok-seviyeli (ternary) fiziksel mümkün, neden kazanmadı
- [x] Transistör = parmağı tel olan anahtar (elektrik elektriği kontrol eder)
    - [x] MOSFET sezgisi: kapı gerilimi kanalı açar/kapatır
    - [x] CMOS: neden çift (n+p), statik güç ~0 — o hâlde ısı nereden çıkar
- [x] Mantık kapıları (NAND'dan türetme; anlamı biz koyarız, fizik aptal) — *NandGame: Logic Gates, 5 seviye*
    - [x] NAND'dan NOT / AND / OR
    - [x] XOR + evrensellik: tek kapı tipinden her şey neden çıkar
- [x] Sayı doğar: konumsal ikili + ikinin tümleyeni (bit sayı DEĞİLDİ; "bu -5" kararını biz veririz — çıkarma = negatifi toplama)
    - [x] konumsal ikili + hex kısaltması
    - [x] ikinin tümleyeni: çıkarma neden ayrı devre değil, toplamanın kendisi
    - [x] taşma (overflow) vs elde (carry): işaretli / işaretsiz ayrımı
- [ ] 🚧 Aritmetik: kapılardan toplayıcı → ALU (hesabın doğuşu; komutun asıl işi) — *NandGame: Arithmetics + Switching + ALU, 13 seviye*
    - [x] yarım toplayıcı → tam toplayıcı → dalgalı elde (ripple-carry)
    - [ ] 🚧 ALU: toplama + mantık + kaydırma tek blokta
    - [x] bayraklar (zero / carry / sign / overflow) — dallanmanın yakıtı
- [ ] Kendini-tutan latch → hafızanın doğuşu — *NandGame: Memory, 6 seviye*
    - [ ] SR latch: geri besleme = kendini hatırlayan devre
    - [ ] D latch → D flip-flop (saat kenarıyla örnekle)
    - [ ] register = n flip-flop yan yana
- [ ] Latch'in karşı kutbu: elektrik kesilince hatırlayan hafıza (floating gate)
    - [ ] latch neden uçucu (volatile): geri besleme akım ister, akım kesilince unutur
    - [ ] floating gate transistör: yalıtılmış kapıya hapsedilen elektron = kalıcı hatırlama
    - [ ] Fowler-Nordheim tünelleme: klasik fizikte imkansız bir geçişin kuantum mekanikle mümkün olması (yazma/silme mekanizması)
    - [ ] veri tutma (retention) ve sıcaklığa bağlı sızıntı (charge leakage) — "kalıcı" olmanın sınırı
    - [ ] pratik köprü: TRIM / wear-leveling / write amplification — "silinen veri neden hemen yok olmaz" (güvenli silme dersine taban)
- [ ] Saat (clock) — metronom, GHz'in gerçek anlamı
    - [ ] kenar (edge) neden senkronizasyonun kalbi
    - [ ] kritik yol: en yavaş kapı zinciri saat tavanını nasıl belirler
- [ ] Kontrol birimi + fetch-decode-execute — *NandGame: Processor, 6 seviye*
    - [ ] program sayacı (PC) → getir → çöz → çalıştır döngüsü
    - [ ] kontrol sinyalleri: bir komut nasıl "tel"lere dönüşür
- [x] Mikro-op: komutun altındaki komut (x86 = arayüz, çipin dili değil)
    - [x] tek x86 komutu → birden çok mikro-op
    - [x] neden: karmaşık ISA'yı basit iç çekirdeğe ayırmak
- [ ] Pratik: Logisim / Digital Logic Sim sandbox
    - [ ] elle kurduğun ALU'yu görsel simülatörde doğrula
- [x] Pratik: x86 assembly kursu (`konu_anlatimlari/x86_assembly`)
    - [x] register / bellek / komut temeli (`nasm` + `ld`)
    - [x] mikro-op durağına köprü: yazdığın komutun altında ne oluyor

### 1B — Modern yarı (x86 komutundan yukarı)

- [ ] Pipeline + dallanma tahmini + out-of-order (Spectre'nin de kökü)
    - [ ] pipeline: getir/çöz/çalıştır/bellek/geri-yaz üst üste binmesi
    - [ ] hazard'lar (veri / kontrol) + forwarding + stall
    - [ ] dallanma tahmini + yanlış tahmin cezası (kendi çipinde ölç)
    - [ ] OoO: sıra-dışı çalıştır, sırayla emekli et (ROB)
- [x] Önbellek piramidi — L1/L2/L3/RAM (canlı gecikme merdiveni)
    - [x] neden hiyerarşi: hız ↔ boyut takası
    - [x] hit/miss, satır (line), yerellik (temporal / spatial)
    - [x] kendi çipinde L1/L2/L3/RAM gecikme basamakları
- [x] SMT — çekirdek vs thread
    - [x] fiziksel çekirdek 2 thread'i nasıl "dokur"
    - [x] ne zaman kazanç, ne zaman yük (kendi 16C/32T'de ölç)
- [x] Chiplet / CCD — yonga içi vs yongalar arası gecikme
    - [x] 8940HX: 2 CCD + Infinity Fabric köprüsü
    - [x] CCD-içi vs CCD-aşırı çekirdek gecikme farkı
- [ ] 🚧 Önbellek tutarlılığı (MOESI) + çekirdekler-arası gecikme — 2 CCD'de CCD-aşımı cezası ölçülebilir; false sharing (ölçüm aracına bağ)
    - [ ] MOESI durumları: paylaşılan satır nasıl senkron tutulur
    - [ ] false sharing: aynı satırı döven 2 çekirdek = sahte yavaşlama
    - [x] CCD-aşımı cezasını ölç
- [ ] SIMD / AVX-512 (RPCS3 → Bölüm 3 bağlantısı)
    - [ ] tek komut, çok veri: 512-bit yazmaçlar
    - [ ] frekans düşüşü (downclock) takası var mı — kendi çipinde bak
- [ ] Güç zinciri: PPT / TDC / EDC + termal
    - [ ] üç sınır ne demek, hangisi önce vurur
    - [ ] termal throttle vs güç limiti: kim frenliyor (ölç)
- [ ] 🚧 Bellek: kanal / gecikme / bant genişliği (+ memory training)
    - [ ] kanal / rank sayısı bant genişliğini nasıl belirler
    - [ ] CL / tCAS gecikmesi vs bant genişliği takası
    - [x] memory training: boot'ta ne oluyor (Bölüm 4B'ye bağ)
- [ ] Sanal bellek: MMU / TLB — adres çevirisi (DRAM'in üstündeki katman; Bölüm 2 + 4.5'e taban)
    - [ ] sanal → fiziksel: sayfa tablosu yürüyüşü (page walk)
    - [ ] TLB: çeviri önbelleği + miss cezası
- [ ] Zamanlayıcı (scheduler)
    - [ ] çekirdeğe iş dağıtımı: CCD / SMT farkındalığı
    - [ ] CachyOS BORE / sched-ext = Bölüm 4B çekirdek durağına bağ
- [ ] 🚧 ⚒ Ölçüm aracı: kendi çipinde cache-gecikme merdiveni + SMT ölçeklenmesi + bant genişliği (1B'nin iddialarını kanıtlar)
    - [x] pointer-chasing ile gecikme merdiveni
    - [x] thread sayısına karşı ölçekleme eğrisi
    - [ ] 1B'nin tüm iddialarını tek çıktı grafiğinde topla

---

## Bölüm 2 — Sunulanın Dışına Çıkmak: Güvenlik & Gizli Katmanlar

> *Kolaydan zora, yazılımdan donanıma. Mod: binexp çöz-yarış; alt katmanlar sök-anla.*

- [ ] 🚧 Yazılıma saldırı: binary exploitation — OverTheWire
- [ ] Yan-kanal ilkeli: Flush+Reload / Prime+Probe — önbellek zamanlamasıyla sızıntı (Spectre'nin gizli kanalı BUDUR; 1B ölçüm aracının silahlanmış hâli)
- [ ] 🚧 Köprü: ayrıcalık modeli + mikromimari saldırılar (ring, MMU, SMEP/SMAP, Spectre/Meltdown, TEE)
- [ ] Gizli ringler: SMM (ring -2, OS'un altında saklı mod) + hypervisor (ring -1, VT/AMD-V) — "gizli katman"ın tam da kendisi; PSP'ye (ring -3 sayılır) inişin ara basamakları
- [ ] 🚧 Komutun **altı**: microcode & EntrySign (imza duvarı) → repoya kanonik modül
- [ ] Komutun **yanı**: PSP / güven kökü (ASP, boot root-of-trust, psptool, flashrom dökümü)

---

## Bölüm 3 — Farklı İşlemci Felsefeleri: Heterojen Mimariler

> *Bir galeri: her durak x86'nın bir varsayımını kırar. Sıra en yakından (hâlâ
> komut çalıştıran çekirdekler) en radikale (komut/sayaç yok) tırmanır ve düz
> Bölüm 5'e bağlanır. Mod: emülatörde sök-anla + küçük çöz-yarış demolar.*

### 3A — Belleği Elinle Taşı (PS2 Emotion Engine + PS3 Cell)

*Kırdığı varsayım: "önbellek belleği senin için otomatik yönetir."*

- [ ] Başla → local store neden var: ana çekirdek + yardımcı çekirdekler ayrımını emülatörde gözle (PCSX2 / RPCS3)
- [ ] Devam → elle DMA döngüsü (taşı → işle → geri yaz); VU0/VU1 ya da SPE; RPCS3'ün AVX-512 sevgisi = 1B'ye bağ

### 3B — Gecikmeyi Sayıyla Boğ (GPU / SIMT)

*Kırdığı varsayım: "tek iş akışını hızlandır, gecikmeyi kısalt."*

- [ ] Başla → kendi GPU-bound sezgin (DXVK / shader): neden binlerce thread, gecikme neden "gizlenir"
- [ ] Devam → warp / wavefront, occupancy, bellek coalescing; küçük bir compute shader
- [ ] ⚒ Ölçüm aracı: kendi NVIDIA kartında occupancy / bellek coalescing etkisini ölç (1B ölçüm aracının GPU kardeşi; "gecikme sayıyla gizlenir" iddiasını kanıtlar)

### 3C — Sırayı Derleyici Kursun (VLIW / EPIC)

*Kırdığı varsayım: "donanım sırayı bozup paralelliği kendi bulur (OoO)."*

- [ ] Başla → 1B'deki OoO'yu tersine çevir: donanım aptal-geniş, paketleri derleyici dizer
- [ ] Devam → Itanium neden battı / DSP'de neden yaşıyor; bir VLIW komut paketini oku

### 3D — Zamanı Garanti Et (PLC / mikrodenetleyici, RTOS)

*Kırdığı varsayım: "hız = ortalama; zamanlama en-iyi-çaba." (farklı eksen: paralellik değil, zaman)*

- [ ] Başla → scan cycle (oku → çalıştır → yaz) + en-kötü-durum zamanlaması neden kutsal
- [ ] Devam → ladder (IEC 61131-3) röle notuna bağlanır; fiziksel I/O + safety; Stuxnet = Bölüm 2 köprüsü

### 3E — Hesabı Uzaya Yay (FPGA)

*Kırdığı varsayım: "hesap zamanda, sabit bir donanımda olur."*

- [ ] Başla → NandGame / Logisim'de elle kurduğun devre → gerçek yeniden-programlanabilir silikon (aynı iş; zamanda değil uzaya serili — dokunmuş mantık, açılışta yeniden yüklenen config)
- [ ] Devam → LUT / BRAM / DSP blokları; bir datapath sentezle (ör. paralel toplayıcı ağı); HDL'e ilk adım

### 3F — Program Sayacını At (dataflow / sistolik dizi / TPU)

*Kırdığı varsayım: "von Neumann tek yol — komutlar bir sayaçtan sırayla çekilir."*

- [ ] Başla → "von Neumann yarığı = en derin kırılma" tespitinin cisimleşmiş hâli
- [ ] Devam → sistolik matris çarpımı: veri dokudan akar, sayaç yok; TPU neden tam matris için — matris-ağırlıklı = Bölüm 5'e (üniter matrisler) köprü

---

## Bölüm 4 — Bütün Sistemi Kurmak: Linux From Scratch

> *Reponun adının hakkı — ama asıl ders build sırası değil, iki "aha": sistem
> kendini nasıl doğurur, ve "dağıtım" sihir değil bir seçim. Mod: sök-anla
> (kaynaktan kur). Adım adım build = LFS kitabının işi, harita seviyesi değil.*

### 4A — Sistem Kendini Nasıl Doğurur (bootstrap / self-hosting)

*Kırdığı varsayım: "derleyiciyi ne derledi? İlk binary nereden geldi?"*

- [ ] Başla → tavuk-yumurta: gcc'yi derlemek için gcc lazım; host'un parmak izinden kaçmak için cross-toolchain + "pass 1 / pass 2" neden var
- [ ] Devam → binutils (`as` + `ld` — x86 dersindeki `nasm` / `ld` ayrımının ta kendisi) → gcc → glibc; kıyısında "Trusting Trust" (kendini derleyen derleyiciye güven)

### 4B — Çıplak Userland'i Dik ve Boot Et

*Kırdığı varsayım: "dağıtım (Ubuntu / Arch) tek parça, sihirli bir şeydir."*

- [ ] Başla → çekirdek ≠ sistem: kernel bir yanda, userland (glibc, coreutils, bash) elle üstüne; "dağıtım = seçilmiş paketler + config" demistifikasyonu
- [ ] Devam → boot zinciri: firmware → GRUB → kernel → init → userland; kendi çipinde ayağa kaldır (1B'deki boot / memory-training bilgisiyle birleşir)
- [ ] Kendi çekirdeğini derle → vanilla kaynağı kendi donanımına (Zen4 / NVMe / NVIDIA) göre `.config`le; `.config` = fizik/politika ayrımının cisimleşmiş hâli (hangi sürücü şart, hangi seçenek sadece dağıtım geleneği); CachyOS sched-ext / BORE = 1B zamanlayıcı durağı bağı
- [ ] Dağıtım = seçim'in en keskin örneği: init sistemi (systemd vs SysV / runit / OpenRC) — "fizik değil politika"nın kanonik hâli; glibc vs musl, apt vs pacman ikincil örnekler

---

## Bölüm 4.5 — İşletim Sistemini Yaz (bare-metal kernel)

> *Bölüm 1'in tepesi (donanım / komut) ile Bölüm 4'ün tabanı (userland) arasındaki
> eksik katman: komutları "sistem" yapan yazılım. Bölüm 2'deki ring / MMU dersinin
> İNŞA hâli — ring 0'da, altında OS yok. Mod: sök-anla (kendin kur). Adım adım = o
> basamağa gelince o oturumda.*

### 4.5A — Çıplak Metale İn (bootloader → çekirdek girişi)

*Kırdığı varsayım: "bir program hep bir işletim sisteminin üstünde çalışır."*

- [ ] Başla → firmware / bootloader seni nasıl çağırır; long mode'a geç; ekrana ilk karakter (VGA / seri) — altında hiçbir şey yokken
- [ ] Devam → GDT + IDT: kesmeler (interrupt) — donanım çekirdeğe nasıl "seslenir"; ring 0'da ilk kesme işleyicin (not: 64-bit'te GDT büyük ölçüde artık-organ — segmentasyon kapalı, geriye 64-bit kod descriptor'ı + TSS kalır; FS/GS base'leri diri. x86 mirası, fizik değil)

### 4.5B — Kendi Dünyanı Kur (bellek + zamanlama)

*Kırdığı varsayım: "sanal bellek ve 'aynı anda çalışan' işler donanımın hediyesidir."*

- [ ] Başla → sayfalama (paging): MMU'yu elle kur → kendi sanal belleğin; Bölüm 2'deki "anla"nın "kur" hâli
- [ ] Devam → basit zamanlayıcı: iki "task" arası geçiş — 1B zamanlayıcı durağının çıplak-metal kardeşi; kancalar: OSDev wiki, "Writing an OS in Rust", xv6
- [ ] "Görev"i gerçek sürece çevir: ring 3'e in (ayrıcalıksız + kendi adres uzayı) + syscall/sysret ile geri dön — paging & scheduler burada birleşir; Bölüm 2'deki SMEP/SMAP sınırının "kur" hâli

---

## Bölüm 5 — Bambaşka Bir Makine: Kuantum

> *Kapak taşı. Burada duvar GERÇEKTEN fizik — politika değil. "Sıfırdan"
> başlanacak; matematik zemini önce.*

- [ ] QPU nedir (klasik CPU'dan farkı)
- [ ] Gerekli matematik: kompleks lineer cebir, üniter / Hermitian, olasılık
- [ ] Qubit & süperpozisyon
- [ ] Kapılar = üniter matrisler
- [ ] Ölçüm (Born kuralı)
- [ ] Kuantum kodlama (Qiskit)
- [ ] Yan-dal: kuantum tavlama / tünelleme *(opsiyonel; kapı-modeli için ön koşul değil)*

---

## Tasarım Notları (sonra tartışılacak)

- Merdiven (Bölüm 1) tek hikâye ama 1A / 1B diye ikiye ayrıldı (temel / modern) —
  istenirse tek akışa geri döndürülür.
- LFS, kuantumdan önce ve "zirve" olarak değil, konsolidasyon olarak konumlandı.
- Binexp, güvenlik bölümünün başında (microcode'dan kolay, doğal ısınma).
- Bölüm 3 bir galeriye dönüştü (3A–3F); her durak x86'nın bir varsayımını kırar,
  en yakından en radikale sıralı, Bölüm 5'e rampa. Önerilen çekirdek: **3A + 3E +
  3F** (elle bellek → elle-kurma zirvesi → von Neumann ödülü + kuantum köprüsü);
  3B hızlı geçiş; 3C / 3D tada göre opsiyonel. Alınmayan başlıklar boş `[ ]` durur.
- Çekirdek **derleme** (kendi Linux'unu derle) = Bölüm 4B içinde tek madde. Çekirdek
  **yazma** (sıfırdan OS) = ayrı **Bölüm 4.5**, çünkü tek mimari kırmıyor, bütün bir
  katman ekliyor: Bölüm 1 (donanım) ile Bölüm 4 (userland) arasındaki boşluk, ve
  Bölüm 2'deki ring / MMU dersinin "kur" hâli.
- Detaylar (alt maddeler, ölçüm hedefleri, araçlar, kaynaklar) bu iskelet
  onaylanınca doldurulacak.
- Floating gate / Fowler-Nordheim tünelleme (kalıcı bellek fiziği) ayrı bir
  bölüm (ör. "1.5") olarak DEĞİL, 1A'daki latch maddesinin hemen ardına madde
  olarak eklendi — latch = uçucu hafıza, floating gate = onun karşı kutbu
  (kalıcı hafıza); aynı soru("nasıl hatırlarız?")nın iki cevabı, tek hikâye
  bozulmadan yan yana durur. TRIM/wear-leveling köprüsü ileride güvenli silme
  (shred / crypto-shred) dersine bağlanacak — henüz o ders roadmap'te ayrı
  madde değil, eklenmesi düşünülebilir (muhtemelen Bölüm 2'nin güvenlik
  bağlamına ya da 1A'nın bu maddesine ek alt-madde olarak).
