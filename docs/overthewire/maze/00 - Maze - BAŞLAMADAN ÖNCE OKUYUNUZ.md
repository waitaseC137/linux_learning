# Maze'e Başlamadan Önce Okuyunuz — Ön Hazırlık & Konu Rehberi

> Bu doküman, OverTheWire **Maze** wargame'ine başlamadan önce hangi konulara hâkim
> olman gerektiğini anlatır. Maze, **32-bit Linux x86 binary exploitation + reverse
> engineering** karışımı bir labdır (9 seviye: maze0 → maze8, her biri bir sonraki
> kullanıcının parolasını verir). Behemoth/Utumno'dan farkı: tek bir kalıbı değil,
> **her seviyede bambaşka bir zafiyet sınıfını** işler. Aşağıdakiler fiilen gereken
> bilgilerdir. (Çözüm içermez.)

---

## 0. Maze nedir, ne bekler?

- Sunucu: `maze.labs.overthewire.org:2225`, başlangıç `maze0 / maze0`.
- 9 setuid program (`/maze/maze0..maze8`), her biri `-r-sr-x---` (setuid bir sonraki kullanıcı).
- Korumalar seviyeye göre **değişir** (her seviyede `checksec` çalıştır):
  - Bazıları NX **kapalı** (stack'te shellcode), bazıları NX **açık** (ROP/GOT/FSOP).
  - Canary kimi seviyede var kiminde yok; PIE hep kapalı; **RELRO yok** (GOT yazılabilir).
  - **ASLR sistemde KAPALI** → adresler deterministik.
- Hepsi **debug_info** ile derli (`not stripped`) → `objdump`/`gdb` ile semboller mevcut.

**Önkoşul wargame'ler:** `Bandit` → `Narnia` → `Behemoth` → `Utumno` (sonra Maze).
Maze zorluk: ~5/10 ama **konu çeşitliliği** yüksek.

---

## 1. Maze'de Görülen Zafiyet Sınıfları (genel harita)

Maze'in özü: her seviye **farklı bir teknik**. Şu başlıkları tanımak şart:

| # | Tema | Anahtar kavram |
|---|------|----------------|
| 0 | **TOCTOU yarış koşulu** | `access()` vs `open()`, symlink takası, confused deputy |
| 1 | **Library hijacking** | göreli `DT_NEEDED` (`./libc.so.4`), CWD'den `.so`, constructor |
| 2 | **Çalıştırılabilir stack** | fonksiyon işaretçisi olarak buffer çağırma, env shellcode + NOP sled |
| 3 | **Self-modifying code** | `mprotect` RWX, XOR ile runtime decrypt, gizli "sihirli sabit" |
| 4 | **Zayıf dosya doğrulama** | `execv(argv[1])`, setuid script + `#!/bin/sh -p` |
| 5 | **Keygen RE + anti-debug** | algoritma tersine, `ptrace(TRACEME)`, stdio buffering |
| 6 | **FILE yapısı sömürüsü (FSOP)** | `fp` overwrite, sahte `_IO_FILE`, vtable doğrulaması, GOT write |
| 7 | **Parser overflow** | güvenilmeyen `e_shentsize` ile ELF başlığı okurken stack overflow |
| 8 | **Format string** | `snprintf(buf,n,user)`, `%n` arbitrary write, GOT→`system` |

---

## 2. Linux & Kabuk Temelleri (gerekli)

| Konu | Neden |
|------|-------|
| SSH (`ssh maze0@maze.labs.overthewire.org -p 2225`) | erişim |
| **setuid bit**, `-r-sr-x---`, real vs **effective uid** | seviye 0 ve genel mantık |
| `access(2)` real-uid ile, `open(2)` euid ile çalışır | TOCTOU'nun kalbi |
| symlink, `ln -sf`, `/tmp` sticky | yarış koşulu kurmak |
| Ortam değişkenleri (`environ`), `argv` düzeni | env shellcode adresleme |
| `setresuid`/`setreuid`, neden `#!/bin/sh -p` | setuid'de yetki düşmesini engelleme |
| `/etc/maze_pass/mazeN` izinleri | hedef parola dosyaları |

---

## 3. Dinamik Yükleyici (ld.so) Bilgisi

- `readelf -d` → `DT_NEEDED`, `RPATH/RUNPATH`. **Göreli yol** (`./lib`) tehlikesi.
- Setuid + **AT_SECURE**: `LD_PRELOAD`/`LD_LIBRARY_PATH` yok sayılır; ama binary'ye
  **gömülü** göreli `NEEDED` uygulanır → CWD'den `.so` yükleme.
- Lazy binding: çağrılmamış sembol yükleme anında hata vermez (constructor'da exit edersen yeter).
- **Library constructor**: `__attribute__((constructor))` `main`'den önce çalışır.
- İzin tuzağı: setuid kurban hedef dizine **euid** ile girer → dizin `o+x` olmalı.

---

## 4. x86 (32-bit) Assembly & Bellek

- Register'lar, **stack frame** (`ebp-N` yerel, `[ebp+4]` dönüş adresi), `leave; ret`.
- `objdump -d -M intel` okuma; `gdb` ile breakpoint/stack/register.
- **Syscall (`int 0x80`):** `eax`=no, `ebx/ecx/edx`=arg (shellcode için).
- **Self-modifying:** `mprotect(addr&~0xfff, len, 7)` ile sayfayı RWX yapıp kendini yazma.
- Stack düzeni: env/argv tepede; ASLR kapalıyken adresler **sabit** → printer ile öğrenilir.

---

## 5. Shellcode

- `execve("/bin/sh")` shellcode (32-bit), **null-free** olmalı (string'e gömülüyorsa).
- Genelde önce `setresuid(geteuid x3)` → kabuk yetki düşürmesin.
- **NOP sled + env shellcode**: ASLR yokken env adresi deterministik; geniş sled adres hatasını affeder.
- `MAX_ARG_STRLEN = 128KB`: tek bir argv/env string'i bu sınırı aşamaz.
- Küçük buffer'a sığan **stub** (`mov eax,addr; jmp eax`) ile büyük shellcode'a sıçrama.

---

## 6. ELF Formatı (seviye 7 için)

- ELF32 başlık alanları ve offset'leri: `e_shoff(0x20)`, `e_shentsize(0x2e)`,
  `e_shnum(0x30)`, `e_shstrndx(0x32)`; `Elf32_Shdr` (40 bayt) alanları.
- "Güvenilmeyen boyut alanı + sabit buffer'a `read`" = parser overflow.

---

## 7. glibc FILE Yapısı (seviye 6 — ileri)

- `_IO_FILE` (32-bit) alan offset'leri: `_flags(0x00)`, `_IO_write_ptr(0x14)`,
  `_IO_write_end(0x18)`, `_vtable_offset(0x46)`, `_mode(0x68)`, vtable(0x94).
- `fwrite/fprintf` → `_IO_file_xsputn` → `_IO_write_ptr`'a `memcpy`.
- **vtable doğrulaması** (`_IO_vtable_check`): sahte vtable yasak → **gerçek** `_IO_file_jumps` kullan.
- `fopen("a")` + overflow ile `fp` ezip **arbitrary write** primitive.

---

## 8. Format String (seviye 8)

- `printf(user)` / `snprintf(buf,n,user)` → `%p` leak, **`%n` arbitrary write**.
- Direct param access `%k$`, `%hn`/`%hhn` ile parça parça adres kurma.
- `snprintf` kesse bile `%n` **tam** sayacı sayar.
- GOT overwrite → bir fonksiyonu `system`'e çevir; argümanı kontrol et.

---

## 9. Güvenlik Korumaları — Her Seviyede ÖNCE Kontrol Et

| Koruma | Kontrol | Etkisi |
|--------|---------|--------|
| NX/DEP | `checksec` / `readelf -l` GNU_STACK | kapalı → shellcode; açık → GOT/FSOP/ROP |
| Canary | `checksec` | overflow stratejisi |
| RELRO | `checksec` | **No RELRO** → GOT yazılabilir |
| ASLR | `/proc/sys/kernel/randomize_va_space` | Maze'de **0** (kapalı) → deterministik |
| PIE | `checksec` | kapalı → sabit kod/GOT adresleri |

---

## 10. Anti-Debug & Servis Detayları

- `ptrace(PTRACE_TRACEME)`: -1 ⇒ debugger var. Bypass: **pre-trace etme**; bunun yerine
  durduğunda otomatik `PTRACE_CONT` yapan bir **ebeveyn-tracer** kullan. `setsid` ile
  job-control durmalarını engelle.
- `fork` eden TCP servisleri: açık **çocukta** (`setreuid` sonrası) tetiklenir.
- **stdio buffering**: `scanf`/`fread` ileri okur → spawn edilen kabuğa girdi vermek
  için **zamanlama** (önce kimlik, kısa bekle, sonra komut) gerekir.

---

## 11. Araçlar

`ssh`, `objdump -d -M intel`, `readelf -d/-l/-S`, `nm`, `strings`, `file`,
`checksec`, `gdb`, `strace`, `ltrace`, `gcc -m32`, `python3` (soket/exploit),
`base64` (binary aktarımı).

---

## 12. "Hazır mıyım?" Kontrol Listesi

- [ ] setuid + real/effective uid farkını ve TOCTOU'yu anlıyorum
- [ ] `readelf -d` ile `DT_NEEDED`/göreli yol tehlikesini görüyorum
- [ ] 32-bit stack frame + `objdump` disasm okuyabiliyorum
- [ ] null-free `execve` shellcode + env/NOP-sled adreslemesini biliyorum
- [ ] `mprotect`/self-modifying ve XOR decrypt kavramları net
- [ ] ELF başlık alanlarını ve parser overflow mantığını biliyorum
- [ ] format string `%n`/`%hn` ve GOT overwrite'ı uygulayabiliyorum
- [ ] glibc FILE/FSOP temelini (vtable check) duydum (seviye 6 ileri)
- [ ] `ptrace` anti-debug ve fork-servis exploitasyonunu biliyorum

Çoğuna "evet" diyorsan Maze'e hazırsın. "Hayır"ların varsa önce
**Behemoth + Utumno**'yu pekiştir.

---

> Bu rehber yalnızca **konu/önbilgi** listesidir, çözüm içermez. OverTheWire,
> çözümlerin web'de yayınlanmamasını rica eder — bu notlar kişisel çalışman içindir.
