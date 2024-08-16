# Leviathan 4 - 5

Biraz Teori:

İkili kod, bir bilgisayar için verilerin en temel temsilidir.
Bilgisayarın dahili olarak kullandığı şey budur.
Rakam olarak yalnızca '0' ve '1'i içeren ve 'bit' olarak da adlandırılan ikili sayı sisteminden gelir.

Bilgisayar biliminde insan tarafından okunabilen metni temsil eden farklı kodlamalar vardır.
En temel ve yaygın olanı 'Bilgi Değişimi için Amerikan Standart Kodu'dur ( ASCII ).
ASCII bir karakteri temsil etmek için 7 bit kullanır.
Genel olarak, eğer ikiliyi el başına ASCII'ye dönüştürecekseniz, önce ikiliyi ondalık sistemimize dönüştürür ve karşılık gelen harfi bir ASCII tablosunda ararsınız.
Örnek: '01000001' -> '65' -> 'A'.

Çözüm:

Ana dizinde yeni ve 'leviathan4' grubuna ait '.trash' adında bir dizin buluyoruz. Bu yüzden kontrol ediyoruz.

---

```bash
1 leviathan4@leviathan:~$ ls -la
2 total 24
3 drwxr-xr-x  3 root root       4096 Aug 26  2019 .
4 drwxr-xr-x 10 root root       4096 Aug 26  2019 ..
5 -rw-r--r--  1 root root        220 May 15  2017 .bash_logout
6 -rw-r--r--  1 root root       3526 May 15  2017 .bashrc
7 -rw-r--r--  1 root root        675 May 15  2017 .profile
8 dr-xr-x---  2 root leviathan4 4096 Aug 26  2019 .trash
9 leviathan4@leviathan:~$ cd .trash/
10 leviathan4@leviathan:~/.trash$ ls -la
11 total 16
12 dr-xr-x--- 2 root       leviathan4 4096 Aug 26  2019 .
13 drwxr-xr-x 3 root       root       4096 Aug 26  2019 ..
14 -r-sr-x--- 1 leviathan5 leviathan4 7352 Aug 26  2019 bin
```

---

'Leviathan5' kullanıcısına ait bir SUID ikili dosyası var. Her zaman olduğu gibi ne işe yaradığını bulmaya çalışıyoruz.

---

```bash
leviathan4@leviathan:~/.trash$ ./bin

01010100 01101001 01110100 01101000 00110100 01100011 01101111 01101011 01100101 01101001 00001010
```

---

Sıfırlardan ve birlerden oluşan bir dizi döndürür.
Bu ikili bir durumdur. - ltrace'i kullanarak 'leviathan5' kullanıcısının şifre dosyasını açıyor ve büyük olasılıkla onu bu ikili dizgeye dönüştürüyor.
Yani amacımız ikili dosyayı ASCII formatına çevirmek ve umarım şifreyi almaktır.

Bu dönüşümü gerçekleştirmenin farklı yolları vardır.
Bunu elle, bir web sitesi kullanarak veya komut satırıyla yapabiliriz.
Python veya başka bir dilde kısa bir program yazabiliriz. Komut satırı için kısa ve kolay bir çözüm istedim.
Hızlı bir Google araması bana Perl ile şu örneği gösteriyor: [bash echo 0100000101000010 | perl -lpe '$*=pack"B*",$*']
Öyleyse deneyelim. (İpucu: Bitler arasında boşluk kalmadığından emin olun.)

---

```bash
leviathan4@leviathan:~/.trash$ echo 0101010001101001011101000110100000110100011000110110111101101011011001010110100100001010 | perl -lpe '$*=pack"B*",$*'

XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

Ve işe yaradı. Ortaya çıkan dizeyi test etmek, bunun gerçekten de bir sonraki seviye için doğru şifre olduğunu gösterir.
