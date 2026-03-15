Giriş
SSH: `ssh bandit8@bandit.labs.overthewire.org -p 2220`

Şifre: cvX2JJa4CFALtqS87jk27qwqGhBM9plV

Görev
Bir sonraki seviyeye geçiş şifresi data.txt dosyasında saklanmaktadır ve dosyada yalnızca bir kez geçen tek metin satırıdır.

Biraz Teori
uniq, girişi filtreleyen ve çıktıya yazan bir komuttur. Spesifik olarak, aynı satırlara göre filtreleme yapar. `-u` bayrağı, benzersiz satırları (sadece bir kez geçen satırları) filtreler. Bir başka ilginç işlevi ise, örneğin, sayma (`c`) yapabilmesi veya sadece yinelenen satırları (-d) döndürebilmesidir.

Bu komut genellikle sort ile birlikte kullanılır. uniq'in benzersiz satırları filtreleyebilmesi için satırların sıralanması gerekir. sort, bir metin dosyasının satırlarını sıralar. Ayrıca, ters sıralama (`-r`) ve sayısal sıralama (`-n`) için bayrakları vardır.

Çözüm
Dosyada yalnızca bir kez geçen satırı bulmak için, önce satırları sıralıyoruz, ardından benzersiz olanı filtreliyoruz.

```nasm
bandit8@bandit:~$ sort data.txt | uniq -u
UsvVyFSfZZWbi6wgC7dAFyFuR6jQQUhR
```
Translated with DeepL.com (free version)
