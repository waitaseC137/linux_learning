# OverTheWire — Behemoth Level 0 → 1

> Hedef: `behemoth0`'dan `behemoth1` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: `ltrace` ile gömülü şifre karşılaştırmasını (`strcmp`) okuma.

---

## 1. Bağlantı
```bash
ssh behemoth0@behemoth.labs.overthewire.org -p 2221   # şifre: behemoth0
```
Binary'ler okunabilir/çalıştırılabilir (`-r-sr-x---`, grup r-x).

## 2. Davranış
```
/behemoth/behemoth0   →   "Password: " ... "Access denied.."
```

## 3. Zafiyet — ltrace
Şifre binary'de gömülü, `strcmp` ile karşılaştırılıyor:
```bash
echo "test123" | ltrace /behemoth/behemoth0
# printf("Password: ")
# strcmp("test123", "eatmyshorts")    <-- GERÇEK ŞİFRE
# puts("Access denied..")
```
Şifre = **`eatmyshorts`**. Doğru girilince `Access granted` + shell (behemoth1) açıyor.

## 4. Exploit
```bash
python3 -c '
import sys,time
sys.stdout.buffer.write(b"eatmyshorts\n"); sys.stdout.flush(); time.sleep(1.0)
sys.stdout.buffer.write(b"id; cat /etc/behemoth_pass/behemoth1\n"); sys.stdout.flush(); time.sleep(1.0)
' | /behemoth/behemoth0
```
> Şifreyi gönderip kısa bekle, sonra komutu besle (spawn olan shell'in stdin'i için — stdio buffering).
Çıktı: `Access granted..` → `uid=13001(behemoth1)` → şifre.



## Dersler
| Konu | Not |
|------|-----|
| ltrace | libc çağrılarını gösterir → `strcmp(input, gizli)` ile şifreyi ele verir |
| gömülü şifre | binary içinde sabit string olarak tutulan parolalar `strings`/`ltrace` ile bulunur |


