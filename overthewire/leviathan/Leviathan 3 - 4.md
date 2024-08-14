# Leviathan 3 - 4

Teori:

Aslında level 2 gibi

Çözüm:

Her zaman olduğu gibi ana dizine bakarak başlıyoruz. Şifre isteyen 'level3' adında bir SUID ikili programı buluyoruz.

```bash
1 leviathan3@leviathan:~$ ls -la
2 total 32
3 drwxr-xr-x  2 root       root        4096 Aug 26  2019 .
4 drwxr-xr-x 10 root       root        4096 Aug 26  2019 ..
5 -rw-r--r--  1 root       root         220 May 15  2017 .bash_logout
6 -rw-r--r--  1 root       root        3526 May 15  2017 .bashrc
7 -r-sr-x---  1 leviathan4 leviathan3 10288 Aug 26  2019 level3
8 -rw-r--r--  1 root       root         675 May 15  2017 .profile
9 leviathan3@leviathan:~$ ./level3
10 Enter the password> Ahdiemoo1j
11 bzzzzzzzzap. WRONG
```

---

Önceki seviyelerde yaptığımız gibi ikiliyi analiz etmeye başlayabiliriz.
O halde tekrar deneyelim ltrace:

```bash
1leviathan3@leviathan:~$ ltrace ./level3
2__libc_start_main(0x8048618, 1, 0xffffd784, 0x80486d0 <unfinished ...>
3strcmp("h0no33", "kakaka")                                             = -1
4printf("Enter the password> ")                                         = 20
5fgets(Enter the password> test
6"test\n", 256, 0xf7fc55a0)                                       = 0xffffd590
7strcmp("test\n", "snlprintf\n")                                        = 1
8puts("bzzzzzzzzap. WRONG"bzzzzzzzzap. WRONG
9)                                             = 19
10+++ exited (status 0) +++
11leviathan3@leviathan:~$ ./level3
12Enter the password> snlprintf
13[You've got shell]!
14$ whoami
15leviathan4
```

---

Önceki Düzeyde olduğu gibi ikilinin, girdimizi doğru parolayla karşılaştırmak için bir kütüphane işlevi olan 'strcmp'yi kullandığını görebiliriz.
İkili dosyayı 'snlprintf' şifresiyle çalıştırmak bize 'leviathan4' adında bir kabuk verir.
Şimdi sadece şifre dosyasını okumamız gerekiyor.

```bash
1 $ cat /etc/leviathan_pass/leviathan4
2 vuH0coox6m
```

---
