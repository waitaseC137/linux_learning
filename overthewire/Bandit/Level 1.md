# Level 1

Giriş
SSH: ssh [bandit1@bandit.labs.overthewire.org](mailto:bandit1@bandit.labs.overthewire.org) -p 2220

Şifre: boJ9jbbUNNfktd78OOpsqOltutMc3MY1

Görev

- Şifreyi '-' adlı dosyadan alın.

'-' Linux'ta özel bir semboldür. Bu yüzden bir dosya adının bu sembolle başlatılması önerilmez. '-' standart seçenek karakteridir. Bunu daha önce bir komuta belirli seçenekler için sözde bayraklar eklemek için görmüştük (ssh komutu için bir port seçmek için -p bayrağı gibi). Bu nedenle, ilk karakteri bu sembol olan dosyalara diğer dosyalar gibi başvurulamaz.

Çözüm
İlk olarak, tüm dosyaları yazdırarak dosyanın klasörde olduğundan emin oluruz.

```jsx
bandit1@bandit:~$ ls
-
```

`cat -` komutunu kullanmak hiçbir şey döndürmez. Bu yüzden sadece `-` yazmak yerine `./` ekliyoruz ve `./-` yazıyoruz ve komut olması gerektiği gibi çalışıyor:

```jsx
bandit1@bandit:~$ cat ./-
CV1DtqXWVFXTvM2F0k09SHz0YwRINYA9
```

Sıradaki bölüme geçelim