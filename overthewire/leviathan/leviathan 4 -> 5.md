# Leviathan 4 → 5

> **Bağlantı:** `ssh leviathan4@leviathan.labs.overthewire.org -p 2223`
> **Hedef:** `.trash/bin` programının ikili (binary) çıktısını çözüp `leviathan5` parolasını oku.

---

## 1. Keşif (Recon)

```bash
leviathan4@gibson:~$ ls -la
dr-xr-x---  2 root leviathan4 4096 .trash

leviathan4@gibson:~$ ls -la .trash
-r-sr-x--- 1 leviathan5 leviathan4 14944 bin
```

Gizli `.trash` dizininde setuid `bin` (sahibi **leviathan5**). Çalıştıralım:

```bash
leviathan4@gibson:~$ .trash/bin
00110000 01100100 01111001 01111000 01010100 00110111 01000110 00110100 01010001 01000100 00001010
```

Program leviathan5 yetkisiyle bir şeyi okuyup **ikili (binary) ASCII** olarak basıyor. 11 grup, her grup 8 bit → 11 bayt (sonuncusu satır sonu).

## 2. Analiz — İkiliden ASCII'ye

Her 8 bitlik grubu bir ASCII karakter olarak çöz:

| Binary | Hex | Char |
|--------|-----|------|
| 00110000 | 0x30 | `0` |
| 01100100 | 0x64 | `d` |
| 01111001 | 0x79 | `y` |
| 01111000 | 0x78 | `x` |
| 01010100 | 0x54 | `T` |
| 00110111 | 0x37 | `7` |
| 01000110 | 0x46 | `F` |
| 00110100 | 0x34 | `4` |
| 01010001 | 0x51 | `Q` |
| 01000100 | 0x44 | `D` |
| 00001010 | 0x0a | `\n` |

## 3. Çözüm

İstersen elle tabloyu okursun; pratikte tek satır:

```bash
# yerelde (veya sunucuda) — boşlukla ayrılmış 8'erli bit gruplarını ASCII'ye çevir:
.trash/bin | perl -ne 'print pack("B8",$_) for split/\s+/'

# alternatif:
.trash/bin | tr ' ' '\n' | perl -lne 'print chr oct "0b$_"'
```

→ `leviathan5` parolası: `**********`

## 4. Çözüm Özeti

| Adım | Bulgu |
|------|-------|
| Recon | `.trash/bin`, setuid leviathan5 |
| Çıktı | Parolanın 8-bit ikili gösterimi |
| Çözme | Her 8 bit → 1 ASCII karakter (`pack`/`tr`+`oct`) |
| Sonuç | leviathan5 parolası |

**Alınan ders:** Çıktının "ikili gibi görünen" 0/1 dizileri çoğu zaman base-2 kodlanmış ASCII'dir. 8'erli grupla, her grubu `chr(0b....)` ile çöz. Veriyi "gizlemek" (encoding) onu güvenli yapmaz; setuid program parolayı yine de senin görebileceğin bir kanala basıyor.
