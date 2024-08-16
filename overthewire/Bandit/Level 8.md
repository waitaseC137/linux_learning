# Level 8

Giriş
SSH: `ssh [bandit7@bandit.labs.overthewire.org](mailto:bandit7@bandit.labs.overthewire.org) -p 2220`

Şifre: HKBPTKQnIay4Fw76bEy8PVxKEDQRKTzs

Görev
Bir dosyadan, **millionth** sözcüğünün yanındaki parolayı alın

Biraz Teori
Seviye 6'da `grep`'e küçük bir giriş yapmıştım. `grep`, follow `grep <pattern>` gibi belirli bir kalıp içeren satırları aramak için kullanılabilir.

Pipe (`|`) ile, bir metin dosyasına bakmak için `cat` çıktısını `grep`'e girdi olarak aktarabiliriz.

Çözüm
data.txt dosyasının boyutunu kontrol ettiğimizde çok büyük olduğunu görebiliriz:

```nasm
bandit7@bandit:~$ du -b data.txt
4184396 data.txt
```

Bu yüzden sadece dosyaya bakmak çok uzun sürecek ve çok fazla çaba gerektirecektir.

Bunun yerine, şifre 'millionth' kelimesiyle aynı satırda olduğu için `grep` kullanmayı deneyebiliriz

```nasm
bandit7@bandit:~$ cat data.txt | grep millionth
millionth XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
