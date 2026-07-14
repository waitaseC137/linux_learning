# Brute Force — Bash ile Kaba Kuvvet

Bir binary'nin beklediği şifreyi veya PIN'i tüm olasılıkları deneyerek bulmak. Analiz araçları (ltrace, gdb) işe yaramadığında veya olasılık sayısı makul olduğunda kullanılır.

---

## for Döngüsü

```bash
for değişken in [liste]; do
    komut
done
```

**Sayı aralığı:**
```bash
for i in {0..9}; do echo $i; done        # 0'dan 9'a
for i in {0000..9999}; do echo $i; done  # 4 haneli PIN (0000–9999)
for i in {1..100}; do echo $i; done
```

**Brace expansion ile sıfır dolgulu sayılar:**
```bash
{0000..9999}   # 0000, 0001, 0002, ..., 9999
{00..99}       # 00, 01, ..., 99
```

Sıfır dolgu (zero-padding) önemlidir — binary `0042` ile `42`'yi farklı kabul edebilir.

---

## Koşul Kontrolü

```bash
if [ "$değişken" = "değer" ]; then
    komut
fi

# Veya tek satırda:
[ "$değişken" = "değer" ] && komut
```

**Brute force'ta çıktı kontrolü:**
```bash
result=$(./binary $i 2>/dev/null)    # komutu çalıştır, çıktıyı yakala
if [ "$result" != "Wrong" ]; then    # yanlış cevap değilse
    echo "Bulundu: $i"
    break                             # döngüyü bitir
fi
```

---

## Tam Örnek: 4 Haneli PIN (Leviathan Level 6)

```bash
for i in {0000..9999}; do
    result=$(./leviathan6 $i 2>/dev/null)
    if [ "$result" != "Wrong" ]; then
        echo "PIN: $i → $result"
        break
    fi
done
```

- `{0000..9999}` → 10.000 olasılık
- `2>/dev/null` → hata çıktılarını gizle
- `$()` → komut çıktısını değişkene ata
- `break` → eşleşme bulununca döngüyü durdur

---

## 2>/dev/null — Hata Çıktısını Gizleme

```bash
komut 2>/dev/null
```

- `2>` → standart hata çıktısını yönlendir
- `/dev/null` → Linux'taki "çöp kutusu", her şeyi yutar

Brute force'ta her yanlış deneyin hata mesajı ekrana dolmasın diye kullanılır.

```bash
./leviathan6 0000 2>/dev/null    # "Wrong" gibi hata mesajı geliyorsa gizler
```

---

## $() — Komut Çıktısını Yakalama

```bash
result=$(./binary $i)
```

Komutun çıktısını bir değişkene atar. Sonraki satırlarda `$result` ile kullanılır.

```bash
result=$(./leviathan6 1234 2>/dev/null)
echo "Çıktı: $result"
```

---

## break — Döngüden Çıkma

```bash
for i in {0..100}; do
    if [ "$i" = "42" ]; then
        echo "Bulundu: $i"
        break    # döngüyü burada bitir, sonraki değerlere gitme
    fi
done
```

Brute force'ta doğru değeri bulunca gereksiz yere devam etmemek için kullanılır.

---

## Performans Notu

10.000 PIN brute force birkaç dakika sürebilir. Daha hızlı yapmak için:

```bash
# Arka planda paralel çalıştır (dikkatli kullan)
for i in {0000..9999}; do
    (./binary $i 2>/dev/null | grep -v "Wrong" | grep . && echo $i) &
done
wait
```

Leviathan için genellikle sıralı çalışma yeterlidir — sunucuya fazla yük bindirmemek için paralel kullanma.

---

## Özet

| Yapı | Ne yapar |
|---|---|
| `for i in {0000..9999}` | 0000'dan 9999'a sıfır dolgulu sayı üretir |
| `result=$(komut)` | Komut çıktısını değişkene atar |
| `[ "$a" != "b" ]` | String karşılaştırması |
| `2>/dev/null` | Hata mesajlarını gizler |
| `break` | Döngüden çıkar |
