# GDB — GNU Debugger

Binary'leri adım adım çalıştırıp iç durumlarını incelemeye yarayan hata ayıklama aracı. Kaynak koda gerek yok — derlenmiş binary'yi doğrudan analiz eder.

---

## Başlatma

```bash
gdb ./binary                     # binary'yi yükle
gdb --args ./binary argüman      # argümanla başlat
gdb -q ./binary                  # "quiet" mod — banner gösterme
```

GDB açılınca `(gdb)` promptu gelir. Buradan komut girilir.

---

## Temel Komutlar

### disassemble — Assembly Kodunu Gösterme

```bash
(gdb) disassemble main           # main fonksiyonunun assembly'si
(gdb) disassemble fonksiyon_adı
```

```
(gdb) disassemble main
Dump of assembler code for function main:
   0x080491d0 <+0>:  push   %ebp
   0x080491d1 <+1>:  mov    %esp,%ebp
   ...
   0x080491ea <+20>: movl   $0x1bd3,-0xc(%ebp)   ← sabit değer yükleniyor!
   ...
   0x08049222 <+76>: call   0x8049090 <atoi@plt>  ← girişi integer'a çevir
   0x0804922a <+84>: cmp    %eax,-0xc(%ebp)        ← karşılaştır
   0x0804922d <+87>: jne    0x804923f              ← eşit değilse atla
```

**Kritik instruction'lar:**

| Instruction | Anlamı |
|---|---|
| `movl $0x1bd3, -0xc(%ebp)` | Sabit değeri belleğe yaz — PIN/şifre burada olabilir |
| `cmp %eax, -0xc(%ebp)` | İki değeri karşılaştır |
| `jne adres` | Eşit değilse atla (jump if not equal) |
| `call atoi` | String'i integer'a çevir — kullanıcı girişi işleniyor |
| `call strcmp` | String karşılaştırma — ltrace ile de yakalanır |

---

### break — Breakpoint Koyma

```bash
(gdb) break main               # main fonksiyonunun başında dur
(gdb) break *0x0804922a        # belirli adreste dur
(gdb) break *main+84           # main+84 offset'inde dur
(gdb) info breakpoints         # tüm breakpoint'leri listele
(gdb) delete 1                 # 1 numaralı breakpoint'i sil
```

---

### run — Programı Çalıştırma

```bash
(gdb) run                      # programı başlat
(gdb) run argüman              # argümanla çalıştır
(gdb) run 0000                 # "0000" argümanıyla
(gdb) continue                 # breakpoint'ten sonra devam et
(gdb) next                     # bir sonraki satırı çalıştır
(gdb) step                     # fonksiyon içine gir
```

---

### Bellek ve Register İnceleme

```bash
(gdb) info registers           # tüm register değerleri
(gdb) info registers eax       # sadece eax
(gdb) print $eax               # eax'ı göster
(gdb) print $ebp-0xc           # adres hesapla
```

**x — bellek okuma:**
```bash
(gdb) x 0xffffd4cc             # o adresteki değeri göster
(gdb) x/4x $esp                # ESP'den itibaren 4 word, hex formatında
(gdb) x/s 0xffffd4cc           # string olarak oku
(gdb) x/d 0xffffd4cc           # decimal olarak oku
```

**print — değer gösterme:**
```bash
(gdb) print/d 0x1bd3           # hex'i decimal'e çevir → 7123
(gdb) print/x 7123             # decimal'i hex'e çevir → 0x1bd3
(gdb) print/t 0x41             # binary'ye çevir
(gdb) print (int)'A'           # karakter → sayı
```

---

## Tam Örnek: PIN Bulma (Leviathan Level 6)

```bash
$ gdb --args leviathan6 0000
(gdb) disassemble main
# ...
0x080491ea <+20>: movl $0x1bd3,-0xc(%ebp)   ← şüpheli sabit değer
# ...
0x0804922a <+84>: call atoi                  ← girişimiz işleniyor
0x0804922a <+84>: cmp  %eax,-0xc(%ebp)       ← karşılaştırma burada

# cmp'den ÖNCE breakpoint koy
(gdb) break *0x0804922a
(gdb) run

Breakpoint 1, 0x0804922a in main ()

# Sabit değerin saklandığı adresi bul
(gdb) print $ebp-0xc
$1 = (void *) 0xffffd4cc

# O adresteki değeri oku
(gdb) x 0xffffd4cc
0xffffd4cc:  0x00001bd3

# Hex'i decimal'e çevir → PIN bu!
(gdb) print/d 0x00001bd3
$2 = 7123
```

---

## Çıkış

```bash
(gdb) quit
(gdb) q
```

---

## Özet

| Komut | Ne yapar |
|---|---|
| `gdb --args prog arg` | GDB'yi argümanla başlat |
| `disassemble main` | Assembly kodunu göster |
| `break *0xADRES` | Belirli adreste breakpoint koy |
| `run` | Programı çalıştır |
| `info registers` | Register değerlerini göster |
| `print $ebp-0xc` | Adres hesapla |
| `x 0xADRES` | O adresteki değeri göster |
| `print/d 0xHEX` | Hex'i decimal'e çevir |
| `continue` | Breakpoint'ten devam et |
