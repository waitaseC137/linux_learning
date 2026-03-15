# Level 11

Giriş
SSH: `ssh bandit10@bandit.labs.overthewire.org -p 2220`

Şifre: truKLdjsbJ5g7yyJ2X2R0o3a5HQJFuLk

Görev
Bir sonraki seviyeye ait şifre, Base64 ile kodlanmış veriler içeren data.txt dosyasında saklanmaktadır.

Biraz Teori
Base64, ikili verileri metne dönüştüren bir kodlama şemasıdır. Genellikle verilerin sonundaki eşittir işaretlerinden tanınabilir. Ancak, her zaman böyle değildir. Linux'ta Base64 ile kodlama ve kod çözme işlemlerini gerçekleştiren base64 adlı bir komut vardır. Kod çözme için -d bayrağını kullanmamız gerekir.

Çözüm
base64 komutu dosya girişini desteklediğinden, komutu dosya üzerinde kullanmamız yeterlidir.
```
bandit10@bandit:~$ cat data.txt
VGhlIHBhc3N3b3JkIGlzIElGdWt3S0dzRlc4TU9xM0lSRnFyeEUxaHhUTkViVVBSCg==
bandit10@bandit:~$ base64 -d data.txt
Şifre IFukwKGsFW8MOq3IRFqrxE1hxTNEbUPR'dir.
```
