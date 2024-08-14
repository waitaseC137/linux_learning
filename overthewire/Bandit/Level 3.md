# Level 3

Giriş
SSH: ssh [bandit3@bandit.labs.overthewire.org](mailto:bandit3@bandit.labs.overthewire.org) -p 2220

Şifre: UmHadQclWmgdLOKQ3YNgjWxGoRMb5luK

Görev

- Bir sonraki seviyenin şifresi `inhere` dizinindeki gizli bir dosyada saklanır.

Dizinler arasında dolaşmak için "dizin değiştir" komutu mevcuttur: `cd <path>.`

Komut için yol mutlak bir yol (kök dizin /'den gelen yol) veya göreceli bir yol (geçerli çalışma dizininden gelen yol) olabilir.

Komutun ilginç kullanımları şunlardır:

`cd ...` üst dizine gider
`cd /`kök dizine gider
`cd ~`ev dizinine gider (mevcut kullanıcının)

Linux'ta gizli bir dosya `.` ile başlar. `ls` komutu sadece gizli olmayan dosyaları gösterir. Ancak `-a` bayrağı ile tüm dosyaları, özellikle de gizli dosyaları gösterir.

Dizinlerdeki ilk iki gizli giriş, geçerli (.) ve üst (..) dizini temsil eder.

Çözüm
Önce klasöre gidiyoruz ve ardından dosya adını bulmak için tüm dosyaları yazdırıyoruz.

```bash
bandit3@bandit:~$ cd inhere
bandit3@bandit:~/inhere$ ls -a
.  ..  .hidden
```

Bu nedenle şifre içeren dosyamız `.hidden` olarak adlandırılır ve içeriğini okuyabiliriz.

```bash
bandit3@bandit:~/inhere$ cat .hidden
pIwrPrtPN36QITSp3EQaw936yaFoFgAB
```

Ve bandit4 kullanıcısının şifresini aldık.

Alternatif olarak, bu görev hem `ls` hem de `cat` komutunun yolunu ayarlayarak dizin geçişi olmadan da yapılabilir:

```bash
bandit3@bandit:~$ ls -a \inhere
.  ..  .hidden
bandit3@bandit:~$ cat inhere/.hidden
pIwrPrtPN36QITSp3EQaw936yaFoFgAB
```