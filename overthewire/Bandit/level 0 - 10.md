# level 0 - 10

# Level 0

Giriş
SSH: ssh [bandit0@bandit.labs.overthewire.org](mailto:bandit0@bandit.labs.overthewire.org) -p 2220

Şifre: bandit0

Görev 

- Bir sonraki seviyenin şifresi, ev dizininde bulunan benioku adlı bir dosyada saklanır.

SSH ile bir makineye belirli bir kullanıcı olarak giriş yaparsanız, o kullanıcının ev dizinine girersiniz.

Bir önceki seviyenin anlatımında man komutundan kısaca bahsetmiştim. Bu komut size bir komut hakkında hangi ek bilgilerin gerekli olduğu (örn. ssh giriş bilgisi) ve olası bayraklar (örn. ssh için portu belirtmek için -p) gibi daha fazla bilgi verir. Bu seviyede, dosya sistemi ile etkileşim kurmak için temel Linux komutlarını öğrenmeye başlayacaksınız.

`ls` Geçerli klasördeki dosyaları listeler (klasör belirtilmemişse). Bu komut için bilinmesi gereken iki isteğe bağlı bayrak, dosyaları uzun bir liste biçiminde yazdıran `-l`(bir dosya hakkında ek bilgi) ve gizli dosyaları da gösteren `-a`'dır.
`cat` Dosyaları sırayla okur ve standart çıktıya yazar ya da başka bir deyişle dosyaların içeriğini konsola yazdırır.

Çözüm
Yukarıdaki bilgilerle SSH üzerinden giriş yapıyoruz. `ls` ile bulunduğumuz dizini kontrol ediyoruz

Daha sonra, benioku dosyasının gerçekten klasörde olduğundan emin olabiliriz.

```jsx
bandit0@bandit:~$ ls
readme
```

Durum böyle olduğu için, bir dosyanın içeriğini aşağıdaki komut sözdizimiyle yazdırabiliriz: cat <dosya>.

```jsx
bandit0@bandit:~$ cat readme
XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Elde edilen dize 'bandit1' kullanıcısının parolasıdır.

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
XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Sıradaki bölüme geçelim


# Level 2

Giriş
SSH: ssh [bandit2@bandit.labs.overthewire.org](mailto:bandit2@bandit.labs.overthewire.org) -p 2220

Şifre: CV1DtqXWVFXTvM2F0k09SHz0YwRINYA9

Görev

- Bir sonraki seviye için şifre, ev dizininde bulunan bu dosya adındaki boşluk adlı bir dosyada saklanır.

Önceki seviyede olduğu gibi, bir dosya adına (ve bir dizin adına) boşluk eklemek alışılmadık bir durumdur ve uygulamaya aykırıdır. Bunun yerine, bir alt çizgi (_) veya bir tire (-) kullanabilirsiniz.

Bunun nedenini çözümün ilk bölümünde görebilirsiniz. Bir komutta, boşluklar komuta yeni bir ekleme yapıldığını gösterir. Örneğin (çözümde), metin çıktısı almak için birden fazla dosya adı alabilen cat komutunu kullanıyoruz. Ve bu dosya adları boşluk ile ayrılacaktır. Çözümde görülebileceği gibi, 'spaces in this filename' adlı dosyadan metin çıktısı almak yerine, 'spaces', 'in', 'this', 'filename' adlı dört dosya arar.

Boşluk içeren bir dosya veya dizinle karşılaşmanız durumunda, kelimelerin birlikte tek bir isme ait olduğunu belirtmeniz gerekir. Bu, bölümün çözümünde görüldüğü gibi tırnak işaretleriyle (tek veya çift) yapılabilir.

Çözüm
Önceki seviyeye benzer şekilde, sadece dosya adını kullanmaya çalışmak işe yaramaz:

```bash
bandit2@bandit:~$ cat spaces in this filename
cat: spaces: No such file or directory
cat: in: No such file or directory
cat: this: No such file or directory
cat: filename: No such file or directory
```

Bunun nedeni, dört dosyaya (veya dizine) baktığımızı varsaymasıdır, ancak bunlar mevcut değildir.

Bunun yerine, tümünün tek bir dosyanın adına ait olduğunu belirtmek için isimleri tırnak işaretleriyle (tek veya çift) boşluklarla çevrelememiz gerekir:

```bash
bandit2@bandit:~$ cat "spaces in this filename"
XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
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
XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

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

# Level 7

Giriş

SSH: ssh [bandit6@bandit.labs.overthewire.org](mailto:bandit6@bandit.labs.overthewire.org) -p 2220

Şifre DXjZPULLxYr17uwoI01bNLQbtFemEgo7

Görev

Sunucu üzerinde bir yerde bir dosya bulun. Özellikler:

- bandit7 kullanıcısına ait*
- grup bandit6'ya aittir*
- 33 bayt boyutunda*
- Biraz Teori

Bu seviyede, Linux Dosya İzinleri gibi büyük bir konuya giriş yapıyoruz. Özellikle, sahiplik alanına. Her dosya bir kullanıcı ve bir grup tarafından sahiplenilir. Bir dosyanın hangi kullanıcı ve gruba ait olduğunu `ls` komutu ve `-l` etiketi ile görebilirsiniz.

Örnek

```nasm
bandit6@bandit:/var/lib/dpkg/info$ ls -l bandit7.password
-rw-r----- 1 bandit7 bandit6 33 Mayıs 7 2020 bandit7.password
```

Üçüncü sütun kullanıcıyı, dördüncü sütun ise dosyanın sahibi olan grubu gösterir.

Daha önceki bir seviyede belirtildiği gibi, `find` komutu sunucu üzerindeki dosyaları bulmak için kullanılabilir. Belirli bir kullanıcıya `(-user <kullanıcı adı>)` ve belirli bir gruba `(-group <grupadı>)` ait dosyaları aramak için bayraklar sunar.

Çözüm
find komutunu aşağıdaki seçeneklerle kullanırız:

- type f, çünkü bir dosya arıyoruz*
- -user bandit7, 'bandit7' kullanıcısının sahip olduğu dosyaları bulmak için*
- -group bandit6, 'bandit6' grubunun sahip olduğu dosyaları bulmak için*
- 33 bayt boyutundaki dosyaları bulmak için -size 33c

Tüm sistemi aramak için komutu kök dizinden çalıştırmamız gerekir. Ancak `find / -type f -user bandit7 -group bandit6 -size 33c` komutunu çalıştırmak, iznimiz olmayan dosyalar için Permission denied hatası verecektir. Tüm hata mesajlarını 'gizleyecek' `2>/dev/null` ekleyebiliriz 1.

Ve dosyayı aldık ve bir sonraki şifreyi okuyabiliriz.

```nasm
bandit6@bandit:~$ find / -type f -user bandit7 -group bandit6 -size 33c 2>/dev/null
/var/lib/dpkg/info/bandit7.password

bandit6@bandit:~$ cat /var/lib/dpkg/info/bandit7.password
XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
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

# Level 9

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
