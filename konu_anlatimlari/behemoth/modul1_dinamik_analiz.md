# Modül 1 — Kaynak Kod Yoksa Ne Yapılır? Dinamik Analiz ve `ltrace`/`strace`

> **İlgili Seviye:** Behemoth0  
> **Anahtar Araçlar:** `ltrace`, `strace`, `gdb`  
> **Kazanım:** Kaynak kodu olmadan bir binary'nin ne yaptığını anlayabilmek

---

## 🧠 1. Büyük Resim (Konsept Nedir?)

Gerçek dünyada saldırdığın ya da savunduğun yazılımların büyük çoğunluğunun kaynak koduna erişimin olmaz. Elinde sadece çalıştırılabilir bir binary dosyası vardır. Peki kaynak kodu okuyamıyorsan programın ne yaptığını nasıl anlarsın?

İki yol var:

**Statik analiz** — programı çalıştırmadan incelersin. Binary'i hex editör veya `objdump`, `Ghidra`, `IDA Pro` gibi araçlarla disassemble edersin. Sabırlı, derinlemesine bir yöntemdir ama özellikle büyük binary'lerde zaman alır.

**Dinamik analiz** — programı çalıştırırsın ve ne yaptığını gerçek zamanlı izlersin. Tıpkı bir dedektifin şüpheliyi saatlerce takip etmesi gibi; programın attığı her adımı, açtığı her dosyayı, okuduğu her veriyi gözlemlersin. `ltrace` ve `strace` tam da bu iş için vardır.

Behemoth0'da statik analiz yapabilirsin ama `ltrace` tek komutla seni doğrudan cevaba götürür. Bu modülün odağı: **dinamik analizi anlamak ve doğru araca doğru anda ulaşmak.**

---

## 🔍 2. Zafiyetin Anatomisi (Neden Kaynaklanıyor?)

### `ltrace` ve `strace` arasındaki fark

Linux'ta her uygulama iki katmanda "dışarıya açılır":

```
Uygulama Kodu
      │
      ▼
Shared Libraries (glibc: strcmp, printf, malloc...)   ← ltrace buraya bakar
      │
      ▼
Linux Kernel (open, read, write, execve...)           ← strace buraya bakar
      │
      ▼
Donanım
```

| Araç | Ne izler? | Tipik kullanım |
|------|-----------|----------------|
| `ltrace` | Shared library çağrıları (`strcmp`, `fopen`, `malloc`) | Parola karşılaştırması, dosya açma mantığı |
| `strace` | Sistem çağrıları (`open`, `read`, `write`, `execve`) | Hangi dosyaları açıyor, hangi network bağlantısı kuruyor |

### Behemoth0'da ne oluyor?

Binary şuna benzer bir şey yapıyor:

```c
#include <stdio.h>
#include <string.h>

int main() {
    char input[64];
    printf("Password: ");
    scanf("%s", input);

    if (strcmp(input, "eatmyshorts") == 0) {
        printf("Access granted.\n");
        setreuid(geteuid(), geteuid());
        system("/bin/sh");
    } else {
        printf("Access denied.\n");
    }
    return 0;
}
```

`strcmp(a, b)` fonksiyonu iki string'i karakter karakter karşılaştırır. Kaynak kodu görmesen de `ltrace` bunu çalışırken yakalar:

```
$ ltrace /behemoth/behemoth0
__libc_start_main(...)                           = 1
printf("Password: ")                             = 10
__isoc99_scanf(0x80487a4, 0xffffd580, ...)       = 1
strcmp("AAAA", "eatmyshorts")                    = -1
puts("Access denied...")
```

İki argüman yan yana duruyor: biri senin girdiğin `"AAAA"`, diğeri hardcoded parola `"eatmyshorts"`. Kör uçuştan anlık görmüş oldun.

### Neden bu bir güvenlik açığıdır?

Problem `ltrace` değil, **düz metin karşılaştırma** kullanan programın kendisidir. Parola bellekte açık metin (plaintext) olarak yer aldığında:

- `ltrace` ile anında okunabilir
- `strings /behemoth/behemoth0` komutuyla statik olarak bile bulunabilir
- Bellekten dump alınarak elde edilebilir (`/proc/<pid>/mem`)

---

## 🛠️ 3. Defansif Bakış Açısı (Nasıl Düzeltilir?)

### Sorunlu kod

```c
if (strcmp(input, "eatmyshorts") == 0) { ... }
```

Hardcoded parola + plaintext karşılaştırma = doğrudan `ltrace` ile okunabilir.

### Güvenli alternatif — salted hash karşılaştırması

Gerçek uygulamalarda parola asla düz metin olarak saklanmaz. Bunun yerine:

1. Kullanıcı parolası alınır
2. Kriptografik hash fonksiyonundan geçirilir (bcrypt, Argon2, SHA-256+salt)
3. Saklanan hash ile karşılaştırılır

```c
#include <crypt.h>
#include <string.h>

// Saklanan: bcrypt hash'i (kaynak kodda bile görünse tehlikesiz)
const char *stored_hash = "$2b$12$saltsaltsaltsalt...hashhash";

int check_password(const char *input) {
    // crypt() aynı salt ile tekrar hash'ler
    char *result = crypt(input, stored_hash);
    return strcmp(result, stored_hash) == 0;
}
```

Bu yöntemde `ltrace` sadece şunu görebilir:

```
strcmp("$2b$12$saltXXX...hashYYY", "$2b$12$saltsalt...hashhash") = -1
```

Orijinal parola asla bellekte düz metin olarak yer almaz.

### `strings` saldırısına karşı da savunmasız

```bash
$ strings /behemoth/behemoth0 | grep -i pass
eatmyshorts
Password:
Access granted..
Access denied..
```

Hardcoded parola `strings` ile de bulunabilir. Güvenli bir binary'de saklanan değer hash olduğundan bu çıktı anlamsız bir byte dizisi gibi görünür.

---

## 🚨 4. Yeni Başlayanların Düştüğü Tuzaklar

**`strace` ile başlamak.** Behemoth0'da `strace` çalıştırdığında sistem çağrıları (`read`, `write`, `brk`) görürsün ama `strcmp` sistem çağrısı değildir — library çağrısıdır. Parola orada çıkmaz. Doğru araç `ltrace`.

```bash
# Yanlış — strcmp görünmez
strace /behemoth/behemoth0

# Doğru — strcmp ve argümanları görünür
ltrace /behemoth/behemoth0
```

**`ltrace` çıktısını beklemeden Enter'a basmak.** `ltrace` binary'yi başlatır ve girdini bekler. Herhangi bir şey yazıp Enter'a basarsan `strcmp` çağrısını görebilirsin.

**Sadece parola arayıp geçmek.** `ltrace` çıktısı sana programın tam akışını verir: hangi sırayla hangi fonksiyonlar çağrılıyor. Bu çıktıyı okuma alışkanlığı sonraki seviyelerde çok daha karmaşık binary'leri analiz ederken temel olacak.

**Binary'nin SUID olduğunu unutmak.** Behemoth0 bir SUID binary'dir — çalıştığında dosyanın sahibinin (behemoth1) yetkiyle çalışır. Başarılı olduğunda `/bin/sh` açılacak ama kimin shell'ini aldığını `id` komutuyla kontrol et:

```bash
$ /behemoth/behemoth0
Password: eatmyshorts
Access granted..
$ id
uid=13001(behemoth1) ...   # behemoth1 yetkisinde shell açıldı
$ cat /etc/behemoth_pass/behemoth1
```

---

## Özet

```
Kaynak kodu yok
       │
       ▼
ltrace ./binary          → Library çağrıları (strcmp, fopen, malloc)
strace ./binary          → Sistem çağrıları (open, read, execve)
strings ./binary         → Binary içindeki okunabilir metin
gdb ./binary             → Düşük seviye register/stack analizi
       │
       ▼
strcmp("girdi", "eatmyshorts")  → Parola açığa çıkar
       │
       ▼
Ders: Parolalar asla plaintext karşılaştırılmamalı → salted hash kullan
```

---

## Kaynaklar

- `man ltrace` — parametreler ve filtreler için
- `man strace` — sistem çağrısı takibi
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Linux man pages: crypt(3)](https://man7.org/linux/man-pages/man3/crypt.3.html)
