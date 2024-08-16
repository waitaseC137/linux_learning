# Level 6

Giriş
SSH: ssh [bandit6@bandit.labs.overthewire.org](mailto:bandit6@bandit.labs.overthewire.org) -p 2220

Şifre DXjZPULLxYr17uwoI01bNLQbtFemEgo7

Görev
Sunucu üzerinde bir yerde bir dosya bulun. Özellikler:

- bandit7 kullanıcısına ait
grup bandit6'ya aittir
33 bayt boyutunda

Bu seviyede, Linux Dosya İzinleri gibi büyük bir konuya giriş yapıyoruz. Özellikle, sahiplik alanına. Her dosya bir kullanıcı ve bir grup tarafından sahiplenilir. Bir dosyanın hangi kullanıcı ve gruba ait olduğunu `ls` komutu ve `-l` etiketi ile görebilirsiniz.

Örnek:

```bash
bandit6@bandit:/var/lib/dpkg/info$ ls -l bandit7.password 
-rw-r----- 1 bandit7 bandit6 33 May  7  2020 bandit7.password
```

Üçüncü sütun kullanıcıyı, dördüncü sütun ise dosyanın sahibi olan grubu gösterir.

Daha önceki bir seviyede belirtildiği gibi, find komutu sunucu üzerindeki dosyaları bulmak için kullanılabilir. Belirli bir kullanıcıya (`-user <kullanıcı adı>`) ve belirli bir gruba (`-group <grupadı>`) ait dosyaları aramak için bayraklar sunar.

Çözüm
find komutunu aşağıdaki seçeneklerle kullanırız:

- type f, çünkü bir dosya arıyoruz
-user bandit7, 'bandit7' kullanıcısının sahip olduğu dosyaları bulmak için
-group bandit6, 'bandit6' grubunun sahip olduğu dosyaları bulmak için
33 bayt boyutundaki dosyaları bulmak için -size 33c
Tüm sistemi aramak için komutu kök dizinden çalıştırmamız gerekir. Ancak find / -type f -user bandit7 -group bandit6 -size 33c komutunu çalıştırmak, iznimiz olmayan dosyalar için Permission denied hatası verecektir. Tüm hata mesajlarını 'gizleyecek' 2>/dev/null ekleyebiliriz.

Ve dosyayı aldık ve bir sonraki şifreyi okuyabiliriz.

```bash
bandit6@bandit:~$ find / -type f -user bandit7 -group bandit6 -size 33c 2>/dev/null
/var/lib/dpkg/info/bandit7.password

bandit6@bandit:~$ cat /var/lib/dpkg/info/bandit7.password
XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
