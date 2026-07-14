# Utumno'ya Başlamadan Önce Okuyunuz — Ön Hazırlık & Konu Rehberi

> Bu doküman, OverTheWire **Utumno** wargame'ine başlamadan önce hangi konulara hâkim
> olman gerektiğini anlatır. Utumno bir **32-bit Linux x86 binary exploitation** (ikili
> sömürü) labıdır; "şifre bul" değil, **çalışan programı kandırıp kabuk (shell) alma**
> oyunudur. Aşağıdaki başlıklar, 0→8 seviyelerinde fiilen ihtiyaç duyulan bilgilerdir.

---

## 0. Utumno nedir, ne bekler?

- 8 ikili (utumno0 → utumno7); her biri bir sonraki kullanıcının yetkisiyle çalışan
  **setuid** programdır. Birini sömürüp shell alırsan, o kullanıcının şifresini okursun.
- Hepsi ortak özellikte:
  - **32-bit** (i386) ELF
  - **`-fno-stack-protector`** → stack canary YOK
  - **`GNU_STACK = RWE`** → stack ÇALIŞTIRILABİLİR (shellcode stack'te koşar)
  - **ASLR kapalı** → adresler sabit/öngörülebilir
- Yani modern korumalar büyük ölçüde kapalı; klasik tekniklerin "ders kitabı" hali.

**Önkoşul wargame'ler (önce bunları bitir):**
`Bandit` (Linux/shell temeli) → `Leviathan`/`Narnia` (giriş seviyesi exploit) →
`Behemoth` (Utumno'nun bir alt zorluğu). Utumno zorluk: 4/10.

---

## 1. Linux & Kabuk (Shell) Temelleri

| Konu | Neden gerekli |
|------|---------------|
| SSH ile bağlanma (`ssh user@host -p 2227`) | Laba erişim |
| Dosya izinleri `rwx`, **setuid bit (`s`)** | `-r-sr-x---` ne demek, neden o kullanıcı olarak çalışır |
| Kullanıcı/grup, `id`, `whoami` | Hangi yetkideyim, hedef kim |
| `/tmp`, `mktemp -d`, geçici çalışma alanı | Exploit dosyalarını derleyip çalıştırmak |
| Giriş/çıkış yönlendirme `< > \|`, pipe, `/dev/null` | Programa girdi vermek, çıktı yakalamak |
| Ortam değişkenleri (`export`, `env`, `environ`) | Shellcode'u env'e koymak (çok kullanılır) |
| `argc`/`argv` (komut satırı argümanları) | Çoğu seviye girdiyi argv'den alır |

**Anahtar kavram — setuid:** `-r-sr-x--- utumno8 utumno7 utumno7` dosyası utumno7
grubu tarafından çalıştırılır ama **utumno8 yetkisiyle** koşar. Açığı sömürüp shell
alırsan o shell utumno8 olur → `/etc/utumno_pass/utumno8` okunur.

---

## 2. C Dili — Zafiyetlerin Kaynağı

Seviyeler küçük C programlarıdır. Şunları okuyabilmen/anlaman gerekir:

- **Pointer'lar**, dizi-pointer ilişkisi, `&`, `*`
- **Tehlikeli fonksiyonlar:** `strcpy`, `strcat`, `gets`, `sprintf` (boy kontrolü yok)
  vs. `strncpy`, `memcpy`, `snprintf` (boy var ama tuzaklı)
- **Tamsayı tipleri ve işaret (signedness):** `int` vs `unsigned`, `short`, `char`;
  **truncation** (32-bit → 16-bit) ve **signed/unsigned karşılaştırma** hataları
- `setjmp`/`longjmp` (kontrol akışı kaydet/atla) — ileri seviye
- `malloc`, `atoi`, `strtoul`, `strlen`, `getchar` davranışları

> Utumno'da gördüğümüz tipik bug'lar: sınırsız `strcpy`, `(short)` truncation ile
> atlatılan boy kontrolü, **signed** sınır kontrolü, dizi indeksinin negatif/dev olması.

---

## 3. x86 (32-bit) Assembly Temelleri

Statik analizde `objdump` çıktısını okuman ve stack'i kafanda canlandırman şart.

- **Registerlar:** `eax ebx ecx edx esi edi`, **`esp`** (stack pointer), **`ebp`**
  (base/frame pointer), **`eip`** (instruction pointer)
- **Stack mantığı:** aşağı doğru büyür (yüksek→düşük adres); `push`/`pop`
- **Fonksiyon prologue/epilogue:**
  ```
  push ebp ; mov ebp,esp ; sub esp,N     ; çerçeve kur
  leave (= mov esp,ebp ; pop ebp) ; ret  ; çerçeveyi yık, dön
  ```
- **Stack çerçevesi (frame):**
  ```
  [ebp-N] ... yerel değişkenler (buffer'lar)
  [ebp+0] = kaydedilmiş ebp
  [ebp+4] = DÖNÜŞ ADRESİ (return address)   <-- exploit hedefi
  [ebp+8] = 1. argüman ...
  ```
- **cdecl çağrı kuralı:** argümanlar stack'e sağdan sola `push`, dönüş `eax`
- **`call`/`ret`** dönüş adresini nasıl push/pop eder
- **`mov [ebp+eax*4-0x30], edx`** gibi adresleme (taban+indeks*ölçek+offset)
- **Syscall (int 0x80):** `eax`=numara, `ebx,ecx,edx`=argümanlar (shellcode için)

**Neden kritik:** "Buffer'dan dönüş adresine kaç bayt var?" sorusunun cevabı hep
bu çerçeve düzeninden çıkar (örn. `buf=ebp-0xc` → dönüş adresine `0xc+4=16` bayt).

---

## 4. Bellek Düzeni (Process Memory Layout)

- Bir process'in haritası: **text (kod)**, **data/bss**, **heap** (malloc), **stack**,
  **paylaşılan kütüphaneler (libc)**, **env/argv** (stack'in tepesinde)
- **Stack'in tepesi:** önce env string'leri, altında argv string'leri, sonra
  pointer dizileri, en altta `argc`. (Bu yüzden **dev argv bile env adresini kaydırmaz** —
  env hep tepede.)
- **ASLR (Address Space Layout Randomization):** açıkken adresler her çalıştırmada
  değişir; Utumno'da **KAPALI** → adresler sabit, exploit'e yazılabilir.
- `/proc/self/maps` ile kendi bellek haritanı okuma (dump tekniklerinde işe yarar)

---

## 5. Araçlar (Tooling) — Statik & Dinamik Analiz

| Araç | Ne işe yarar |
|------|--------------|
| `file` | 32/64-bit, dynamically linked, stripped mi |
| `strings` | Binary içindeki metinler, ipuçları, derleme bayrakları |
| `readelf -l ... \| grep GNU_STACK` | Stack çalıştırılabilir mi (RWE) |
| `objdump -d -M intel` | **Disassembly** (asıl analiz aracı) |
| `objdump -s -j .rodata` | Sabit veriler (string'ler, tablolar) |
| `gdb` (+ pwndbg/gef) | Dinamik analiz, breakpoint, register/stack inceleme |
| `strace` | Yapılan **syscall**'ları izleme (girdi okuyor mu, nereye yazıyor, segfault adresi) |
| `ltrace` | libc çağrılarını izleme |
| `gcc -m32` | 32-bit yardımcı program/launcher derleme |
| `objdump -D -b binary -m i386` | Ham bayt dökümünü disassemble etme |

> İpucu: Okuma izni olmayan ama çalıştırılabilen bir binary'i bile, çalışırken
> belleğe map'lendiği için `LD_PRELOAD`/`/proc/self/maps` veya bir debugger ile
> "okumak" mümkün (utumno0'ın özü buydu).

---

## 6. Güvenlik Korumaları (Mitigations) ve Kontrolü

Her seviyede ÖNCE bunları kontrol et — saldırı yöntemini bunlar belirler:

| Koruma | Ne yapar | Nasıl kontrol edilir | Utumno'da |
|--------|----------|----------------------|-----------|
| **Stack canary** | Overflow'u dönüşte yakalar | `strings`/derleme bayrağı `-fstack-protector` | KAPALI |
| **NX / DEP** | Stack'te kod çalıştırmayı yasaklar | `readelf -l` GNU_STACK `RWE` mi `RW` mi | KAPALI (RWE) |
| **ASLR** | Adresleri rastgeleler | banner / davranış | KAPALI |
| **RELRO** | GOT'u korur | `readelf -l` | konu dışı |
| **PTR_MANGLE** | `setjmp/longjmp`'taki `esp/eip`'i maskeler (`ror/xor guard`) | glibc içsel | AÇIK (utumno7) — guard her exec rastgele |

---

## 7. Zafiyet Sınıfları (Bu Labda Görülenler)

Aşağıdakileri kavramsal olarak anlamış olmak, hangi seviyenin "ne tür bir bug"
olduğunu hızlı görmeni sağlar:

1. **Klasik stack buffer overflow** — `strcpy`/`memcpy` ile dönüş adresini ezme
2. **Off-by / null-terminator farkı** — `strcpy` (null ekler) vs `strncpy` (eklemez)
3. **Integer truncation** — boy kontrolü 16-bit, kopya 32-bit
4. **Signed/unsigned karşılaştırma hatası** — negatif görünen dev değerle kontrol atlama
5. **Out-of-bounds / keyfi yazma (write-what-where)** — `dizi[indeks]=değer`
6. **`getchar` döngüsüyle bayt-bayt keyfi yazma**
7. **`jmp_buf` overflow + PTR_MANGLE bypass** (ileri seviye, ebp-pivot)
8. **Execute-only dosyayı okuma** (izin/recon problemi)

---

## 8. Shellcode (Kabuk Kodu)

- **Shellcode nedir:** doğrudan çalıştırılan makine kodu; tipik amacı
  `execve("/bin/sh", ...)` ile kabuk açmak.
- **setuid koruma:** kabuk almadan önce `setreuid(geteuid(), geteuid())` ile
  yetkiyi sabitle (yoksa kabuk yetki düşürebilir).
- **Bad characters (yasak baytlar):** verinin kopyalanma yöntemine göre bazı baytlar
  kullanılamaz:
  - `strcpy`/`strlen` ortamı → **null bayt (`0x00`) yasak**
  - Dosya adı içine gömme → **`/` (0x2f) ve `0x00` yasak**
  - Bu yüzden string'leri **runtime'da kur** (XOR/stack push ile) — "null-free,
    slash-free shellcode" kavramı.
- **NOP sled (`0x90`...):** dönüş adresini tam tutturmak zor olduğunda, geniş bir
  NOP dizisinin ortasına atlarsın; akış kayarak shellcode'a varır.
- **Shellcode'u nereye koyarız:** çoğu zaman bir **ortam değişkenine** (env) NOP
  sled + shellcode koyup, adresini sabit (ASLR yok) olarak hesaplarız.

---

## 9. Sömürü Teknikleri (Exploitation)

- **Return address overwrite:** dönüş adresini shellcode'a yönlendirme
- **ret2stack:** stack çalıştırılabilirse shellcode'u stack'te koşturma
- **env-shellcode + NOP sled:** sled'i env'e koy, ortasına atla
- **Adres bulma (ASLR yokken):** birebir aynı koşulda (aynı argv/env/path uzunluğu)
  bir "printer" çalıştırıp `environ[0]` adresini öğrenme — deterministik
- **Argümanı veremediğinde:** `execve()` ile **özel `argv`/`envp`** kurup hedefi
  başlatan bir **launcher** yazma (örn. `argc==0` gereken seviyeler)
- **ebp/stack pivot:** dönüş adresini doğrudan ezmek yerine `ebp`'yi kontrol edip
  `leave; ret` ile akışı yönlendirme (PTR_MANGLE'ı bypass etmek için)

---

## 10. Pratik İş Akışı (Her Seviyede)

```
1. ls -la /utumno/   → izinleri, hangi binary, kim suid
2. file / strings / readelf → mimari, korumalar, ipuçları, fonksiyon isimleri
3. objdump -d -M intel → main + yardımcı fonksiyonları oku, ZAFİYETİ bul
4. Buffer→ret offset'ini ve girdi yolunu (argv? stdin? env?) çıkar
5. Badchar'ları belirle → uygun shellcode seç/yaz
6. Shellcode'u env'e koy, adresini deterministik bul
7. Payload'ı kur (offset kadar dolgu + adres), çalıştır
8. strace ile hata ayıkla (segfault adresi, syscall'lar)
9. Shell alınca: cat /etc/utumno_pass/<sonraki>
```

> **Hata ayıklama altın kuralı:** `strace` setuid'i düşürür (senin yetkinle çalışır)
> ama ASLR kapalı olduğundan **adresler aynı kalır** → mantığı/segfault'u görmek için
> mükemmel. `rc=0` (temiz dönüş) ≠ `rc=139` (segfault); bu fark çok şey söyler.

---

## 11. Çalışmadan Önce "Hazır mıyım?" Kontrol Listesi

- [ ] SSH ile bağlanıp dosya izinlerini ve setuid'i yorumlayabiliyorum
- [ ] 32-bit stack çerçevesini çizip "buffer→ret kaç bayt" hesaplayabiliyorum
- [ ] `objdump` disassembly'sini okuyup C sözde-koduna çevirebiliyorum
- [ ] `int`/`unsigned`/`short` ve signed karşılaştırma tuzaklarını biliyorum
- [ ] `strcpy` vs `strncpy`, truncation, OOB write farklarını anlıyorum
- [ ] Basit bir `execve("/bin/sh")` shellcode'unu açıklayabiliyorum
- [ ] NOP sled, badchar, env-shellcode kavramlarını biliyorum
- [ ] `gcc -m32`, `strace`, `gdb` kullanmaktan çekinmiyorum
- [ ] ASLR/NX/canary'nin ne olduğunu ve nasıl kontrol edileceğini biliyorum

Bu maddelerin çoğuna "evet" diyorsan Utumno'ya hazırsın. "Hayır"ların varsa önce
**Bandit + Narnia/Behemoth** ile pekiştir.

---

## 12. Önerilen Kaynaklar

- **Bandit / Leviathan / Narnia / Behemoth** (OverTheWire) — sıralı önkoşul
- "Smashing The Stack For Fun And Profit" (Aleph One) — klasik temel
- *Hacking: The Art of Exploitation* (Jon Erickson) — shellcode/env adres teknikleri
- Linux man sayfaları: `execve(2)`, `setjmp(3)`, `strcpy(3)`, `dlopen/ld.so(8)`
- x86 assembly referansı + `pwntools` dokümantasyonu (shellcraft, asm)

> Bu rehber yalnızca **konu/önbilgi** listesidir, çözüm içermez.
