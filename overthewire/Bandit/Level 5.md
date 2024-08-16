# Level 5

Giriş
SSH: ssh [bandit5@bandit.labs.overthewire.org](mailto:bandit5@bandit.labs.overthewire.org) -p 2220

Şifre: koReBOKuIDDepwhWk7jZC0RTdopnAYKh

Görev
Bir sonraki seviyenin parolası `inhere` dizini altında bir yerde bir dosyada saklanır ve aşağıdaki özelliklerin tümüne sahiptir:

- insan tarafından okunabilir
1033 bayt boyutunda
çalıştırılamaz

Daha önce file komutuna ve Seviye 5'te insan tarafından okunabilir dosyaları tespit etmek için nasıl kullandığıma dair bir giriş yapmıştım. `file` komutu tek başına az sayıda dosya için iyi çalıştı. Ancak, daha fazla dosya söz konusu olduğunda, genel bakışı kaybetmek kolaydır.

`grep` komutu, kullanıcı tarafından tanımlanan belirli bir kalıbı içeren satırları arar. Bunun tersini yapmak için de kullanılabilir, yani `-v` bayrağı kullanıldığında, tanımlanmış bir kalıba sahip bir satır yazdırılmayacaktır.

Bu komutu başka bir komutun (örneğin `file` komutu) çıktısında kullanmak için pipe `|` kullanırız. İlk komutun çıktısını alır ve ikinci komuta girdi olarak borular. Sözdizimi aşağıdaki gibi görünebilir: `<command1> | grep <pattern>`.

Dosya boyutunu almak için du komutunu kullanırız. Özellikle, boyutu bayt cinsinden almak için `-b` bayrağını da kullanırız. Gizli olanlar da dahil olmak üzere tüm dosyalara bakmak için `-a` bayrağı önerilir.

Ekleme: `ls -l` komutu ayrıca beşinci sütunda dosyaların boyutunu da gösterir.

Çalıştırılamayan dosyaları bulmak için `find` komutu kullanılabilir. Çalıştırılabilir dosyaları arayan ve olumsuzlama için '!' gibi operatörlere izin veren `-executable` bayrağına sahiptir.

`find` için bazı ek ilginç bayraklar:

Dosya boyutuna bayt cinsinden bakmak için bir bayrağı vardır `-size <bytes>`.
Ayrıca sadece dosyalara bakma seçeneği de vardır `-type f` (dizinler/çalıştırılamayanlar yok).
Bir `-readable` bayrağı vardır, ancak bu dosyaları okuma izniniz olduğu anlamına gelir, insan tarafından okunabilir oldukları anlamına gelmez.
Bunun yerine, yol olarak '`{}`' ile `-exec <komut>` bayrağını kullanabiliriz, bu da seçilen komutun tüm dosyalar üzerinde çalıştırılacağı anlamına gelir. Bu, file gibi başka bir komutu çalıştırmak için kullanılabilir.

Çözüm
Hızlı ve özlü bir çözüm görmek istiyorsanız, sondaki alternatif Tek Komut çözümüne göz atın.

Ayırma

Tekrar '`inhere`' dizinine girerek ve içinde ne olduğuna dair genel bir bakış elde ederek başlıyoruz.

```bash
bandit5@bandit:~$ ls
inhere
bandit5@bandit:~$ cd inhere
bandit5@bandit:~/inhere$ ls -la
total 88
drwxr-x--- 22 root bandit5 4096 May  7  2020 .
drwxr-xr-x  3 root root    4096 May  7  2020 ..
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere00
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere01
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere02
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere03
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere04
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere05
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere06
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere07
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere08
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere09
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere10
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere11
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere12
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere13
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere14
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere15
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere16
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere17
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere18
drwxr-x---  2 root bandit5 4096 May  7  2020 maybehere19

bandit5@bandit:~/inhere$ ls -la maybehere00
total 72
drwxr-x---  2 root bandit5 4096 May  7  2020 .
drwxr-x--- 22 root bandit5 4096 May  7  2020 ..
-rwxr-x---  1 root bandit5 1039 May  7  2020 -file1
-rwxr-x---  1 root bandit5  551 May  7  2020 .file1
-rw-r-----  1 root bandit5 9388 May  7  2020 -file2
-rw-r-----  1 root bandit5 7836 May  7  2020 .file2
-rwxr-x---  1 root bandit5 7378 May  7  2020 -file3
-rwxr-x---  1 root bandit5 4802 May  7  2020 .file3
-rwxr-x---  1 root bandit5 6118 May  7  2020 spaces file1
-rw-r-----  1 root bandit5 6850 May  7  2020 spaces file2
-rwxr-x---  1 root bandit5 1915 May  7  2020 spaces file3
```

Birden fazla klasör görebiliyoruz. İlk klasörü kontrol ettiğimizde, içinde birden fazla dosya olduğunu görebiliriz. Dolayısıyla her dosyayı tek tek kontrol etmek sıkıcı bir iş olacaktır. Yapabileceğimiz şey, görevden gelen bilgileri kullanmak ve tüm dizinlerdeki tüm dosyaları aramaktır - Seviye 5'te açıklanan joker karakter '`*`' yardımıyla.

İnsan Tarafından Okunabilir

`file */{.,} *` komutu '`inhere`' içindeki klasörlerdeki her dosyanın dosya türünü döndürür. Tüm dizinlerdeki tüm dosyaları yazdırmak için `*/*` kullanırız. Ancak, bu gizli dosyaları içermez. Bu nedenle, a ile başlayan dosyaları dahil etmek için `{.,}` kullanırız. ve , başka herhangi bir şeyle başlayan dosyaları gösterir.

Bunu biraz daha görünür hale getirmek ve sadece insan tarafından okunabilir dosyalara odaklanmak için `grep` komutunu kullanabiliriz. Bu durumda, yalnızca 'ACSII' içeren satırları yazdırmak istiyoruz, çünkü bu, önceki seviyeye göre aradığımız insan tarafından okunabilir dosya türüdür. Bu komutu kullanmak için, file komutunun çıktısında grep kullanmak için | borusunu kullanırız: `file */{.,}* | grep ASCII`. Şimdi, bu hala çok fazla çıktıdır. Özellikle ya ASCII metin, çok uzun satırlar ve sadece ASCII metin.

Bu nedenle, şifrenin uzun satırlı dosyalardan birinde olmadığını varsayarsak, 'çok uzun satırlı' veya bu kalıbın herhangi bir alt bölümü için filtreleyebiliriz:

```bash
bandit5@bandit:~/inhere$ file */{.,}* | grep "ASCII text" | grep -v ', with very long lines'
	maybehere10/.file2:       ASCII text
	maybehere15/.file2:       ASCII text
	maybehere01/-file2:       ASCII text
	maybehere08/spaces file1: ASCII text
	maybehere12/-file2:       ASCII text
	maybehere15/spaces file2: ASCII text
	maybehere18/-file2:       ASCII text
```

Şimdi sonuç o kadar büyük değil. Bu dosyaları manuel olarak kontrol edebiliriz. Ancak, hangi dosyanın şifre içerdiğini ayırt edemeyiz ve varsayımımın doğru olduğundan bile emin olmadan hepsini test etmemiz gerekir. Bunun yerine, diğer kriterlerin yardımıyla seçeneklerimizi daraltıp daraltamayacağımıza bakabiliriz.

1033 bayt
Yukarıda belirtildiği gibi du komutu yardımıyla dosya boyutunu elde ediyoruz. Daha sonra doğru boyutu ('1033') filtrelemek için tekrar `grep` kullanıyoruz:

```bash
bandit5@bandit:~/inhere$ du -b -a | grep 1033
	1033    ./maybehere07/.file2
	bandit5@bandit:~/inhere$ cat ./maybehere07/.file2
	DXjZPULLxYr17uwoI01bNLQbtFemEgo7
```

Bu bize yalnızca bir dosya döndürür, bu da önceki listemizde yer almaz; bu da önceki varsayımımın yanlış olduğu anlamına gelir çünkü:

```bash
bandit5@bandit:~/inhere$ file ./maybehere07/.file2
	./maybehere07/.file2: ASCII text, with very long lines
```

Yürütülemez
Çalıştırılamayan dosyaları bulmak için şu komutu kullanabiliriz: `find . ! -executable` komutunu kullanabiliriz. Ancak, gizli dosyalar da dahil olmak üzere çalıştırılamayan dosyaların uzun bir listesini döndürür.

Tek komut
Gereksinimleri kontrol etme görevlerini bölmek sıkıcı olabilir ve doğru boyuta sahip yalnızca bir dosya olduğu için şanslıydık.

Bu nedenle sorulması gereken soru, tüm kriterleri içeren daha etkili bir yol - potansiyel olarak tek bir komut - var mı?

En olası aday find olacaktır.

Dosya boyutu gereksinimini aramak için `-size 1033` kullanırız.
Sadece dosyalara bakmak için `-type f` kullanıyoruz.
`file` komutunu çalıştırmak ve dosya veri türünü almak için `-exec file '{}' \;` komutunu kullanırız. Bundan sonra, '`ASCII`' dosya türü için çıktıyı tekrar filtrelememiz gerekir.

```bash
bandit5@bandit:~/inhere$ find . -type f -size 1033c ! -executable -exec file '{}' \; | grep ASCII
./maybehere07/.file2: ASCII text, with very long lines

bandit5@bandit:~/inhere$ cat ./maybehere07/.file2
XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
