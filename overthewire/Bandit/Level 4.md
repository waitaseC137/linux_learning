# Level 4

Giriş
SSH: ssh [bandit4@bandit.labs.overthewire.org](mailto:bandit4@bandit.labs.overthewire.org) -p 2220

Şifre: pIwrPrtPN36QITSp3EQaw936yaFoFgAB

Görev

- Bir sonraki seviyenin şifresi inhere dizinindeki insan tarafından okunabilen tek dosyada saklanır.

`file` komutu bize dosyanın veri türünü verir. Bazı örnekler şunlar olabilir: 'ELF', 'Perl script', 'ASCII text', 'data' ve daha fazlası.

Bu görev için, özellikle insan tarafından okunabilir dosyalar arıyoruz. Bu, verilerin bilgileri okuyabileceğimiz şekilde sunulduğu anlamına gelir. Örneğin bir ELF dosyası insan tarafından okunabilir değildir. İçeriğini yazdırmaya çalışırsanız (`head <elf_file_name>`), sonuç aşağıdaki gibi görünecektir: �������$��$,0�%���0�'��0<u����8�w���9�t�.

İnsan tarafından okunabilen en yaygın veri kodlamaları ASCII ve Unicode'dur.

Bir komutu geçerli dizindeki tüm dosyalara uygulamak/kullanmak istiyorsak, komutu tekrarlamak veya tüm dosya adlarını yazmak sıkıcıdır. Komutu çok fazla yazmadan dizindeki tüm dosyalarda kullanmak için, 'joker karakter sembolü' olarak adlandırılan '*’ *kullanabiliriz.* Herhangi bir sayıda karakteri temsil edebilir. Örneğin file*, 'file00', 'file', 'fileAA' gibi 'file' ile başlayan her şeyle eşleşir. Komuttaki dosya adı/yol seçeneğinin yerini alır.

Çözüm
Yine 'inhere' dizinine giriyoruz ve sistemdeki dosyaların çıktısını alıyoruz:

```bash
bandit4@bandit:~$ cd inhere
bandit4@bandit:~/inhere$ ls -la
total 48
drwxr-xr-x 2 root    root    4096 May  7  2020 .
drwxr-xr-x 3 root    root    4096 May  7  2020 ..
-rw-r----- 1 bandit5 bandit4   33 May  7  2020 -file00
-rw-r----- 1 bandit5 bandit4   33 May  7  2020 -file01
-rw-r----- 1 bandit5 bandit4   33 May  7  2020 -file02
-rw-r----- 1 bandit5 bandit4   33 May  7  2020 -file03
-rw-r----- 1 bandit5 bandit4   33 May  7  2020 -file04
-rw-r----- 1 bandit5 bandit4   33 May  7  2020 -file05
-rw-r----- 1 bandit5 bandit4   33 May  7  2020 -file06
-rw-r----- 1 bandit5 bandit4   33 May  7  2020 -file07
-rw-r----- 1 bandit5 bandit4   33 May  7  2020 -file08
-rw-r----- 1 bandit5 bandit4   33 May  7  2020 -file09
```

On adet dosya olduğunu görebiliriz.

İnsan tarafından okunabilen dosyayı ve dolayısıyla şifreyi bulmak için farklı yöntemler kullanabiliriz.

Sadece her dosyanın içeriğini yazdırabiliriz (`cat`). Ancak bu, daha fazla dosya ile uğraştığımızda çok verimli değildir.
Komut yapısı `file <dosya adı>` şeklindedir. Bir dosya adı kullanmak yerine, tüm dosyaların türünü almak için bir joker karakter kullanırız. Ek olarak, dosya adlarına baktığımızda, özellikle de adların '-' ile başlaması bize sorun çıkarıyor. Bu nedenle Seviye 2'deki yöntemin aynısını kullanıyoruz.

```bash
bandit4@bandit:~/inhere$ file ./*
./-file00: data
./-file01: data
./-file02: data
./-file03: data
./-file04: data
./-file05: data
./-file06: data
./-file07: ASCII text
./-file08: data
./-file09: data
```

Sadece '-file07' dosyasının insanların okuyabileceği kodlamalardan biri olan 'ASCII text' türünde olduğunu görebiliriz. (Aynı zamanda önceki seviyelerdeki dosyalarla aynı dosya türüdür.) Şimdi sadece dosyayı yazdırmamız gerekiyor:

```bash
bandit4@bandit:~/inhere$ cat ./-file07
XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
