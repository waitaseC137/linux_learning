# OverTheWire — Utumno Level 0 Çözümü (utumno0 → utumno1)

> Hedef: `utumno0` kullanıcısından `utumno1` kullanıcısının şifresini elde etmek.

---

## 1. Bağlantı

```bash
ssh utumno0@utumno.labs.overthewire.org -p 2227
# şifre: utumno0
```

Sunucu bilgisi (giriş banner'ından):
- 64-bit makine, **ASLR kapalı**
- Level dosyaları `/utumno/` dizininde
- Şifreler `/etc/utumno_pass/` altında (her dosyayı sadece ilgili kullanıcı okuyabilir)
- Çalışma için `/tmp` altında `mktemp -d` ile gizli bir dizin açılması öneriliyor

---

## 2. Keşif (Recon)

### Level dosyaları
```bash
ls -la /utumno/
```
```
---x--x---  1 utumno1 utumno0 12212 utumno0          <-- bizim seviye (non-suid)
---s--x---  1 utumno1 utumno0 12212 utumno0_hard     <-- aynı binary, SUID utumno1
-r-sr-x---  1 utumno2 utumno1 13608 utumno1
...
```

**Kritik gözlem:** `/utumno/utumno0` izinleri `---x--x---` →
- Sahip (utumno1): sadece `--x`
- Grup (utumno0 = biz): sadece `--x`
- Yani dosyayı **çalıştırabiliyoruz ama OKUYAMIYORUZ.**

### Şifre dizini
```bash
ls -la /etc/utumno_pass/
```
```
-r-------- 1 utumno0 utumno0  8 utumno0
-r-------- 1 utumno1 utumno1 11 utumno1   <-- hedef (11 byte = 10 karakter + \n)
```

### Binary'i çalıştırınca
```bash
/utumno/utumno0
# Çıktı: Read me! :P
```

Girdi denemeleri — **hepsi yok sayılıyor**, her zaman aynı çıktı:
```bash
python3 -c "print('A'*100)" | /utumno/utumno0     # Read me! :P
/utumno/utumno0 AAAAAAAAAAAAAAAA                    # Read me! :P
```

İpucu (`Read me! :P`) literal: **"Beni oku."** Yani exploit girdi üzerinden değil; binary'nin kendisini okumamız gerekiyor.

---

## 3. Binary Ne Yapıyor? — strace

```bash
strace -f /utumno/utumno0
```
Önemli satırlar:
```
[ Process PID=22 runs in 32 bit mode. ]     <-- 32-bit binary
...
getrandom(...)                              <-- stack canary / rng
write(1, 0x804c1a0, 12Read me! :P) = 12     <-- sadece 12 byte yazıyor
exit_group(0)
```

Sonuç: Binary **hiçbir girdi okumuyor**, hiçbir ekstra dosya açmıyor (sadece libc), sadece
`Read me! :P` yazıp çıkıyor. Demek ki çözüm = execute-only dosyanın içeriğini okumak.

---

## 4. Problem: Dosyayı Nasıl Okuruz?

Normal yöntemlerin hepsi başarısız, çünkü hepsi dosyayı **açmaya (read)** çalışıyor:
```bash
cat /utumno/utumno0           # Permission denied
strings /utumno/utumno0       # Permission denied
objdump -d /utumno/utumno0    # Permission denied
gdb /utumno/utumno0           # "/utumno/utumno0: Permission denied."
```

### Anahtar Fikir 💡
Binary **çalıştırıldığında**, çekirdek onu belleğe `PROT_READ` (okunabilir) segmentler
olarak `mmap`'ler. `utumno0` *non-suid* olduğu için çalıştırınca **bizim kendi
process'imiz** olur → process'in belleğini okumamıza izin var.

`LD_PRELOAD` ile bu process'e kendi shared library'mizi enjekte edip, `main`
çalışmadan önce (constructor) `/proc/self/maps` üzerinden binary'nin bellek
bölgelerini diske dökebiliriz.

> Not: `LD_PRELOAD` sadece **non-suid** binary'lerde çalışır (suid'de güvenlik
> nedeniyle yok sayılır). Bizim için `utumno0` non-suid olduğundan ideal.

---

## 5. Exploit — LD_PRELOAD Memory Dumper

### Çalışma dizini
```bash
W=$(mktemp -d); cd $W
```

### Dumper kaynağı (`d.c`)
```c
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

__attribute__((constructor)) void go(void){
  FILE *m = fopen("/proc/self/maps","r");
  if(!m){ perror("maps"); _exit(1); }
  char line[1024];
  int i = 0;
  while(fgets(line, sizeof line, m)){
    if(strstr(line, "utumno0")){            // binary'ye ait bölgeler
      unsigned long s=0, e=0; char perms[8]={0};
      sscanf(line, "%lx-%lx %7s", &s, &e, perms);
      char fn[128];
      snprintf(fn, sizeof fn, "reg_%02d_%lx_%s", i++, s, perms);
      FILE *o = fopen(fn, "wb");
      if(o){ fwrite((void*)s, 1, e-s, o); fclose(o); }
    }
  }
  fclose(m);
  _exit(0);
}
```

### Derle (32-bit — hedef binary 32-bit olduğu için şart)
```bash
gcc -m32 -shared -fPIC -o d.so d.c
```

### Enjekte ederek çalıştır
```bash
LD_PRELOAD=$W/d.so /utumno/utumno0
```
Dökülen bölgeler:
```
reg_00_8048000_r--p   (ELF header / .rodata başı)
reg_01_8049000_r-xp   (.text  — kod)
reg_02_804a000_r--p   (.rodata)
reg_03_804b000_rw-p   (.data / .got / .bss)
```

---

## 6. Şifreyi Çıkar

```bash
strings -n 4 reg_*
```
Gömülü stringler arasında:
```
puts
password: .......          <-- ŞİFRE BURADA
Read me! :P
...
/root/otw-games/game-utumno/levels/utumno0
utumno0.c
puts@GLIBC_2.0
```

Binary'nin `.rodata`'sında `password: ytvWa6DzmL` string'i gömülü. Program normal
çalışınca bu satırı yazdırmıyor (bir koşulun arkasında), ama biz binary'i bellekten
okuyarak doğrudan görebildik.

---

## Özet / Alınan Dersler

| Konu | Not |
|------|-----|
| **Dosya izinleri** | `--x` = çalıştır ama okuma; statik analiz araçları (cat/strings/gdb) dosyayı açmaya çalıştığı için patlar |
| **execute-only dosya okuma** | Binary çalışınca segmentleri belleğe okunabilir map'lenir; process belleğinden dump alınabilir |
| **LD_PRELOAD** | Non-suid bir process'e kod enjekte etmenin temiz yolu; suid'de çalışmaz |
| **`/proc/self/maps`** | Process'in kendi bellek haritası; segment adreslerini buradan alıp `fwrite` ile döktük |
| **`-m32`** | LD_PRELOAD kütüphanesinin mimarisi hedef binary ile eşleşmeli (32-bit) |

