# Level 10

Giriş
SSH: `ssh bandit9@bandit.labs.overthewire.org -p 2220`

Şifre: `UsvVyFSfZZWbi6wgC7dAFyFuR6jQQUhR`

Görev
Bir sonraki seviyeye ait şifre, data.txt dosyasında, başında birkaç `‘=’` karakteri bulunan, insan tarafından okunabilir birkaç dizeden birinde saklanmaktadır.

Biraz Teori
`strings` komutu, dosyalarda insan tarafından okunabilir dizeleri bulur. Spesifik olarak, yazdırılabilir karakter dizilerini yazdırır. Ana kullanım alanı, hex dökümleri veya yürütülebilir dosyalar gibi yazdırılamayan dosyalardır.

Çözüm
İlk olarak, ‘data.txt’ dosyasındaki insan tarafından okunabilir dizeleri ayırt etmemiz gerekiyor. Bunun için `strings` komutunu kullanıyoruz.
Ardından, birden fazla eşittir işareti içeren satırlara bakarak bu çıktıyı filtrelemek istiyoruz. - Eşittir işaretlerinin ve şifrenin aynı satırda olduğunu varsayarsak, `grep`'i tekrar kullanabiliriz (6. Seviyedeki gibi). Görev, eşittir işaretlerinin sayısı konusunda spesifik değildi, bu yüzden 3 kullandım. Ancak, şifrenin yanında eşittir işareti içeren çok fazla satır yok, bu yüzden 1 ile 10 arasındaki herhangi bir sayı işe yarayacaktır (ancak, 2 ile 10 arası aynı sonucu verecektir).

```
bandit9@bandit:~$ strings data.txt | grep ===
========== the*2i"4
========== password
Z)========== is
&========== truKLdjsbJ5g7yyJ2X2R0o3a5HQJFuLk
```
