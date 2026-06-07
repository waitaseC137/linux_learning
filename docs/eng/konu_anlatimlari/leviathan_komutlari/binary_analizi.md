# Binary Analizi

Binary (ikili) dosyalar doğrudan okunabilir metin içermez — ama içlerinde gizli bilgiler olabilir. Bu araçlar binary'leri analiz etmek için kullanılır.

---

## file — Dosya Türü Tespiti

```bash
file [dosya]
```

Dosyanın gerçek türünü söyler — uzantıya değil, içeriğe (magic bytes) bakarak karar verir.

```bash
$ file check
check: ELF 32-bit LSB executable, Intel 80386, dynamically linked

$ file data.txt
data.txt: ASCII text

$ file data.bin
data.bin: gzip compressed data

$ file ./-
./-: ASCII text    ← binary mi metin mi anlamak için
```

**Yaygın çıktılar:**

| Çıktı | Anlamı |
|---|---|
| `ELF 32-bit LSB executable` | Linux çalıştırılabilir binary |
| `ASCII text` | Okunabilir metin dosyası |
| `data` | Tanınmayan binary format |
| `gzip compressed data` | Gzip ile sıkıştırılmış |
| `Bourne-Again shell script` | Bash script |

---

## strings — Binary'den Metin Çıkarma

```bash
strings [dosya]
strings -n 8 dosya     # en az 8 karakter uzunluğundaki string'ler
strings dosya | grep "password"
```

Binary dosyaların içindeki **yazdırılabilir karakter dizilerini** çıkarır. Minimum 4 karakter (değiştirilebilir).

```bash
$ strings check
/lib/ld-linux.so.2
libc.so.6
strcmp
printf
getchar
sex          ← şifre doğrudan binary'de!
/bin/sh
```

> ⚠️ Şifre her zaman `strings` ile görünmez — `ltrace` daha güvenilirdir. Ama ilk bakış olarak her zaman denenmelidir.

---

## xxd — Hex Dump

```bash
xxd [dosya]
xxd -l 32 dosya        # ilk 32 byte
xxd -s 100 dosya       # 100. byte'tan başla
xxd dosya | head -20   # ilk 20 satır
```

Dosyayı **hex + ASCII** formatında gösterir. Binary'nin tam içeriğini incelemek için kullanılır.

```bash
$ xxd data | head -5
00000000: 1f8b 0808 3445 4b62 0003 6461 7461 322e  ....4EKb..data2.
00000010: 6269 6e00 0bc9 48cd c9c9 d751 2847 28ca  bin...H....Q(G(.
```

Sol: offset (kaçıncı byte), orta: hex değerler, sağ: ASCII karşılığı (`.` = yazdırılamaz karakter).

**Hex'ten dosyaya geri çevirme:**
```bash
xxd -r dosya.hex > dosya.bin    # hex dump'ı binary'ye çevir
```

---

## od — Octal Dump

```bash
od [dosya]
od -c dosya      # karakter formatında göster
od -x dosya      # hex formatında göster
od -An -tx1 dosya  # offset olmadan, her byte hex
```

`xxd`'ye alternatif — özellikle karakter bazlı analiz için kullanılır.

```bash
$ od -c data | head -3
0000000   \t  h  e     p  a  s  s  w  o  r  d     i  s  ...
```

---

## Binary'yi ASCII'ye Çevirme

Leviathan Level 4'te binary çalıştırınca 0 ve 1'lerden oluşan bir çıktı gelir. Bunu ASCII'ye çevirmek için:

**Perl ile:**
```bash
echo "01010100 01101001 ..." | perl -lpe '$_=pack"B*",$_'
```

`pack "B*"` → binary string'i byte dizisine çevirir.

**Python ile:**
```bash
python3 -c "
bits = '0101010001101001...'
n = int(bits, 2)
text = n.to_bytes((n.bit_length() + 7) // 8, 'big').decode()
print(text)
"
```

**CyberChef ile:**  
Operations → "From Binary" → boşluk ayırıcıyla yapıştır → Output

---

## Özet

| Araç | Ne için |
|---|---|
| `file` | Dosyanın gerçek türünü öğren (ELF, metin, arşiv...) |
| `strings` | Binary içindeki okunabilir metinleri çıkar |
| `xxd` | Dosyayı hex + ASCII formatında görüntüle |
| `od` | Octal/karakter dump, karakter analizi |
| `perl -lpe 'pack"B*"'` | Binary string'i ASCII'ye çevir |
