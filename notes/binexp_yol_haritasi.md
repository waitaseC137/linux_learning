# Binary Exploitation Konu Anlatımları — Yol Haritası

*Hedef: assembly bilmeyen birinin de takip edebileceği, tutarlı bir docs sitesi.*
*Kapsam: `konu_anlatimlari/binary_exploitation/` (21 dosya). Web/kripto sonra.*

---

## Genel Değerlendirme

İyi haber: içerik **çok iyi durumda**. Bu bir **cilalama** işi, yeniden yazma değil.

- 21 dosyanın **19'u** aynı, başarılı şablonu izliyor: sezgisel açılış epigrafı → "hangi seviyede lazım" → "X nedir?" yumuşak girişi → bol diyagram → satır içi + düz yazı açıklama → "gerçek vs örnek" uyarıları → çapraz linkler → özet kontrol listesi.
- Temel dosyalar (00, 00b, 01, 02) sıfırdan register/stack/`mov`/`push` anlatımı yapıyor; "assembly bilmeyen" okuyucu için sağlam bir zemin var.

Sorun "kod açıklanmamış" değil; gerçek boşluklar daha dar ve nokta atışı (aşağıda).

---

## Tespit Edilen Ortak Boşluklar

1. **Navigasyon kopukluğu (en öncelikli, en ucuz).** `binary_exploitation/` klasörü `KONU_ANLATIMLARI.md` ana indeksinde **hiç geçmiyor**, klasörde de giriş/sıralama sayfası yok. Siteye gelen biri bu 21 dosyayı bulamaz/sıralayamaz.

2. **İki dosya şablon dışı (08, 09).** Diğer 19'u "🎯 Binary Exploitation — Başlık + epigraf" formatındayken, `08_pointer_manipulation` ve `09_got_plt_overwrite` "Modül —" başlığı + emoji-numaralı bölümler + metadata bloğuyla açılıyor, epigraf yok. Site içinde göze batar.

3. **Just-in-time komut sözlüğü yok.** Tüm assembly bilgisi 00/00b'ye yığılmış. Sonraki dosyalar `mov ebx, esp ; ...` gibi satır içi yorumlar kullanıyor ve okuyucunun 00'ı ezberlediğini varsayıyor. Sitede dosyalar arası zıplanır → ortadan giren okuyucu takılır.

4. **Asm-yoğun bloklarda "amaç katmanı" eksik.** Açıklama var ama assembly'nin kendi dilinde. Yoğun blokların üstüne sıfır-assembly "ne yapıyoruz/niye" katmanı gerekiyor (özellikle 04 shellcode).

5. **Yapısal: `docs/` üçlü kopya.** TR içerik hem `konu_anlatimlari/` hem `docs/`'ta birebir aynı + `docs/eng/` çeviri. Her düzeltme 3 yerde → tek kaynak kararı şart (ayrı roadmap maddesi).

---

## Uygulanacak Standart Şablon (her dosyaya)

### A. Amaç katmanı (yoğun kod/asm bloğunun ÜSTÜNE)
Sıfır assembly gerektiren, "bu blok ne yapıyor ve niye" anlatan 3–6 satır. Asm/byte detayı altta "detay isteyenler için" kalır.

### B. Komut kutusu (dosyanın başına, o dosyada geçenleri seç)
Aşağıdaki ana sözlükten, ilgili dosyada geçen komutları kesip koy:

```
# Bu dosyada geçen assembly komutları (ilk görüşte bu kadarı yeter):
#  — Veri —
#   mov A, B     → B'yi A'ya kopyala ("A = B")
#   lea A, [..]  → adresi HESAPLA, A'ya yaz (belleğe DOKUNMAZ)
#   movsx/movzx  → küçük değeri büyük register'a (işaret / sıfır uzatarak) taşı
#  — Stack —
#   push X       → X'i stack'e koy (ESP 4 azalır)
#   pop  X       → stack tepesini X'e al (ESP 4 artar)
#   leave        → epilog: mov esp,ebp; pop ebp (frame'i kapat)
#  — Aritmetik / mantık —
#   add/sub      → topla / çıkar
#   inc/dec      → 1 artır / 1 azalt
#   xor A, A     → A'yı sıfırla (kendisiyle XOR = 0)
#   and/or/not   → bit düzeyi ve / veya / değil
#   shl/shr      → bit sola/sağa kaydır (2'yle çarp/böl)
#  — Karşılaştırma / akış —
#   cmp A, B     → A-B yap, SONUCU ATMA, sadece bayrakları güncelle
#   test A, A    → A AND A → A sıfırsa "eşit" bayrağı
#   jmp          → koşulsuz atla
#   jz/je        → sıfır/eşitse atla    |  jnz/jne → değilse atla
#   jl/jg        → küçük/büyükse (signed) | jb/ja → (unsigned)
#   call F       → F'yi çağır (dönüş adresini stack'e koyar)
#   ret          → stack tepesindeki adrese dön
#  — String / sistem —
#   rep movsd / rep stosb / repne scasb → ECX kez tekrarlı kopya/doldur/tara
#   int 0x80     → "işletim sistemi devral!" (32-bit sistem çağrısı tetikler)
#   nop (\x90)   → hiçbir şey yapma, bir sonrakine geç (NOP sled'in yapı taşı)
```

---

## Yapısal İşler (içerik geçişinden ÖNCE)

| # | İş | Neden | Efor |
|---|----|-------|------|
| Y1 | `binary_exploitation/00_README.md` (veya `INDEX`) oluştur: sıralı liste + **"assembly bilmiyorsan şu sırayla oku"** yol haritası | 21 dosya şu an navigasyonsuz | S |
| Y2 | `KONU_ANLATIMLARI.md` ana indekse "Binary Exploitation" bölümü ekle | Klasör indekste hiç yok | S |
| Y3 | Tek kaynak kararı: `konu_anlatimlari/` kanonik, `docs/` senkron kopya (script/Action), `docs/eng/` çeviri | Üçlü kopya = 3× iş + kayma | M |

> Önerilen okuma sırası (Y1 için): **01 → 02 → 00 → 00b → 03 → 04 → 05 → 06 → (10 korumalar) → ileri konular.** (Bellek/endian önce, sonra "minimum asm", sonra teknikler.)

---

## Dosya-Dosya Tablo

**Durum:** ✅ iyi / 🟡 şablon-dışı veya orta · **Efor:** S(küçük) M(orta) L(büyük)

### Temel katman

| Dosya | Durum | Yapılacak | Efor |
|-------|:----:|-----------|:---:|
| `00_x86_assembly_temelleri` | ✅ | Çok kapsamlı **referans**; gerçek başlangıç için biraz ağır. Başa kısa "minimum asm" kutusu + "bu dosya referanstır, ilk okuyuşta X kadarı yeter" notu | S–M |
| `00b_gdb_ile_assembly_okumak` | ✅ | Güçlü. Kritik eksik yok | S |
| `01_bellek_ve_memory_layout` | ✅ | Örnek dosya kalitesinde; dokunma denecek kadar iyi | S |
| `02_little_endian` | ✅ | Aynı; çok erişilebilir | S |

### Çekirdek katman

| Dosya | Durum | Yapılacak | Efor |
|-------|:----:|-----------|:---:|
| `03_eip_register_kontrolu` | ✅ | Komut kutusu ekle (B). İçerik hazır | S |
| `04_shellcode_ve_nop_sled` | ✅ | **Amaç katmanı (A)** shellcode bloğunun üstüne + komut kutusu. *(Pilot dosya bu olsun.)* | M |
| `05_format_string` | ✅ | Komut kutusu hafif; `%hn` math'ine bir worked diyagram iyi olur | S–M |
| `06_return_to_libc` | ✅ | Komut kutusu; içerik sağlam | S |
| `07_sembolik_link` | ✅ | Çoğu shell/C; asm az → hafif dokunuş | S |
| `08_pointer_manipulation` | 🟡 | **Şablona normalize et** (epigraf + "hangi seviyede" + İçindekiler), metadata bloğunu epigrafla değiştir + komut kutusu + asm bloklarına amaç katmanı | M |
| `09_got_plt_overwrite` | 🟡 | **Şablona normalize et** (aynı) + komut kutusu. Mekanizma zaten iyi anlatılmış; iş çoğunlukla kozmetik + sözlük | M |

### İleri katman (10–19) — hepsi ✅ tutarlı şablon, iyi epigraf

| Dosya | Durum | Yapılacak | Efor |
|-------|:----:|-----------|:---:|
| `10_bellek_korumalari_ve_checksec` | ✅ | Karar ağacı + checksec çok iyi. Dokunma denecek kadar | S |
| `11_integer_bug_truncation_signedness` | ✅ | Disasm tespit bölümüne komut kutusu | S |
| `12_dinamik_linker_ve_kutuphane_hijacking` | ✅ | Kavram/shell ağırlıklı → hafif | S |
| `13_ptrace_anti_debugging` | ✅ | syscall/C odaklı → hafif | S |
| `14_self_modifying_code_ve_mprotect` | ✅ | `jmp/call/pop` bölümüne komut kutusu | S |
| `15_elf_formati_ve_parser_zafiyetleri` | ✅ | Struct/format odaklı → hafif | S |
| `16_file_yapisi_fsop` | ✅ | İleri; struct alanları açıklanmış. Hafif | S |
| `17_setjmp_longjmp_ptr_mangle` | ✅ | En ileri konu; ebp-pivot asm'ine komut kutusu | S–M |
| `18_ag_servisi_exploitasyonu` | ✅ | Socket/C odaklı → hafif | S |
| `19_setuid_yetki_dususu_ve_p_bayragi` | ✅ | Kavram odaklı → hafif | S |

---

## Önerilen Çalışma Sırası

1. **Y1 + Y2** — index/onboarding sayfası + ana indekse ekleme. *(En ucuz, en yüksek etki; 21 dosya anında erişilebilir olur.)*
2. **Pilot: 04** — amaç katmanı + komut kutusu uygula, referans örnek olsun.
3. **08 ve 09'u şablona normalize et** — tek tutarsızlık burası.
4. **Komut kutusunu** çekirdek katmana yay (03, 05, 06), sonra asm-yoğun ileri dosyalara (11, 14, 17).
5. **Y3** — tek kaynak/senkron kurulduktan sonra TR→`docs/` ve `docs/eng/` güncellemesi.

> Toplam yük: 4 dosya gerçek iş (04, 08, 09, + 00'a lite-intro), gerisi komut kutusu yapıştırma + index. Çekirdek tamamlanınca "assembly bilmeyen" deneyimi büyük ölçüde çözülür.
