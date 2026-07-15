# OverTheWire — Vortex Level 0 → 1

> Hedef: `vortex0` ağ göreviyle `vortex1` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: TCP soketten 4×uint32 oku (**host byte order = little-endian**), topla, geri gönder.
> Ortam: 32-bit x86 (little-endian). Giriş SSH **değil** — oyun **port 5842** ağ servisiyle başlar.

---

## 1. Bağlantı
vortex0'da SSH yok; oyun bir ağ göreviyle başlar. Düz `nc` yetmez (ikili aritmetik gerekir), ama servisi görmek için:
```bash
nc vortex.labs.overthewire.org 5842   # 16 byte (4×uint32) gönderir, 4 byte sonuç bekler
```
Sonraki tüm seviyeler: `ssh vortex1@vortex.labs.overthewire.org -p 2228`

## 2. Görev
Resmî: *"port 5842'ye bağlan, 4 unsigned int'i **host byte order** oku, topla, geri gönder → vortex1 kimliği."*
Kritik nüans: **host byte order** = makinenin doğal sırası. Sunucu 32-bit x86 → **little-endian** (network/big-endian **değil**). Toplam 32-bit'e sarılır (mod 2³²), sonuç 4 ham byte gönderilir.

## 3. Keşif — önce ham byte'a bak
Kör kod yazmadan, hiçbir şey göndermeden 16 byte'ı oku, iki yorumu da gör:
```python
import socket, struct
s = socket.create_connection(("vortex.labs.overthewire.org", 5842)); s.settimeout(10)
d = b""
while len(d) < 16: d += s.recv(16 - len(d))     # recv az dönebilir → 16'ya tamamla
print("hex:", d.hex(" "))
print("little <4I:", struct.unpack("<4I", d))
print("big     >4I:", struct.unpack(">4I", d))
```
```
hex: 9a 08 52 24 53 68 5f 19 9c a8 51 6a 4a 1d fc 42
little <4I: (609355930, 425683027, 1783736476, 1123818826)  toplam=3942594259
big     >4I: (2584236580, 1399349017, 2628276586, 1243479106) toplam=3560373993
```
Gözlem: tam **16 byte**; iki yorum **farklı toplam** veriyor → byte sırası hayati. Ayrıca her bağlantı **yeni sayı** getirir → oku+topla+gönder **tek bağlantıda** olmalı.

## 4. Tuzak — big-endian denemesi (canlı çözümde çıktı)
İlk refleks "ağ = network byte order (big-endian)". Denendi:
```
$ python3 solve.py ">"
gonderilen: bd 2f b4 9d
--- sunucu ---  bzzzt, wrong
```
> ⚠️ **byte-order tuzağı:** Ağ programlamada network byte order (big-endian) alışkanlığı burada **yanlış**. Spec açıkça *"host byte order"* diyor; x86 = little-endian. Teşhis = hata mesajını görüp **spec'i tekrar okumak**, rastgele deneme değil. Düzeltme: `>` → `<`.

## 5. Exploit (little-endian = host byte order)
```python
import socket, struct
s = socket.create_connection(("vortex.labs.overthewire.org", 5842)); s.settimeout(10)
d = b""
while len(d) < 16: d += s.recv(16 - len(d))
total = sum(struct.unpack("<4I", d)) & 0xFFFFFFFF   # <4I = little-endian; & mask = mod 2^32
s.send(struct.pack("<I", total))                    # 4 ham byte (metin değil)
print(s.recv(4096).decode())
```
```
$ python3 solve.py
gonderilen: 7d d1 7d 32
--- sunucu ---  Username: vortex1  Password: **********   ← [şifre gizlendi]
```
Kimlikle giriş: `ssh vortex1@vortex.labs.overthewire.org -p 2228` → `uname -m` ile 32-bit x86'yı teyit et.

## Dersler
| Konu | Not |
|------|-----|
| host vs network byte order | "host" = makinenin sırası (x86 → little-endian); "network" = big-endian. `htonl`/`ntohl` bu ikisi arasını çevirir — burada **kullanılmaz** |
| Little-endian | `08.5` dersindeki `0x12345678 → 78 56 34 12`'nin ağ üzerindeki hali; `struct` `<`=little, `>`/`!`=big |
| 32-bit taşma | 4 sayının toplamı 32-bit'i aşar → `& 0xFFFFFFFF` (mod 2³²) ile sar |
| `recv` parça dönebilir | 16 byte'ı `while len<16` döngüsüyle garanti et |
| Tek bağlantı | Her bağlantı yeni sayı → oku+topla+gönder aynı sokette |
| Metodoloji | Önce gözlem (ham byte), hata mesajını cidden oku, kök nedeni bulmadan yeni fix deneme |
