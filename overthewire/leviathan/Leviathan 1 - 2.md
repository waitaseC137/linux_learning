# Leviathan 1 - 2

Biraz Teori

[ltrace] ikili yürütme sırasında hangi kitaplık çağrılarının yapıldığını görmek için kullanılır.
Kitaplık çağrıları, bir programın birden fazla program tarafından paylaşılan bir dosyadan bir işlevi çağırmasıdır.
Yani örneğin girişin doğru şifre olup olmadığını kontrol etmek bir kütüphane fonksiyonuyla yapılabilir.
İşlevi ve giriş parametrelerini gösterecektir; bunlar daha sonra parolayı da içerecektir.
Dizeleri karşılaştırmak için böyle bir işlev [strcmp]'dir.

Revizyon: 

[stringler] Bandit Seviye 10'da açıklandı 

[SUID] Bandit Seviye 20'de açıklandı

Çözüm:

Allahın emri bir ls -la atalım:

```bash
|--------------------------------------------------------------------------------------------------
|1 leviathan1@leviathan:~$ ls -la
|2 total 28
|3 drwxr-xr-x  2 root       root       4096 Aug 26  2019 .
|4 drwxr-xr-x 10 root       root       4096 Aug 26  2019 ..
|5 -rw-r--r--  1 root       root        220 May 15  2017 .bash_logout
|6 -rw-r--r--  1 root       root       3526 May 15  2017 .bashrc
|7 -r-sr-x---  1 leviathan2 leviathan1 7452 Aug 26  2019 check
8 -rw-r--r--  1 root       root        675 May 15  2017 .profile
```

Bu kez yürütülebilir bir dosya olan 'check' dosyası, leviathan2 kullanıcısına ait olması nedeniyle umut verici görünüyor.
Ayrıca 'okuma' ve 'yürütme' izinlerimiz var ve SUID bit seti var. Öyleyse ne yaptığını görelim.

```bash
|--------------------------------------------------------------------------------------------------
|1 leviathan1@leviathan:~$ ./check
|2 password: test
3 Wrong password, Good Bye ...
```

Yani leviathan2 kullanıcısı için doğru şifreyi yazıp yazmadığımızı kontrol ediyor gibi görünüyor.
Şimdi, parolanın nasıl kontrol edildiğine bağlı olarak parolayı ikili dosyada bir dize olarak bulabiliriz.
O halde bu komutu kullanalım:

```bash
1 leviathan1@leviathan:~$ strings check
```

---

Bu, ikili dosyadaki tüm dizeleri geri verir.
Bazı şüpheli görünen dizeler var, ancak deneyeceğim somut bir şey yok.
Bunun yerine ltrace'i deneyebiliriz.

```bash
1  leviathan1@leviathan:~$ ltrace ./check
2  __libc_start_main(0x804853b, 1, 0xffffd794, 0x8048610 <unfinished ...>
3  printf("password: ")                                                    = 10
4  getchar(1, 0, 0x65766f6c, 0x646f6700password: test_password
5  )                                   = 116
6  getchar(1, 0, 0x65766f6c, 0x646f6700)                                   = 101
7  getchar(1, 0, 0x65766f6c, 0x646f6700)                                   = 115
8  strcmp("tes", "sex")                                                    = 1
9  puts("Wrong password, Good Bye ..."Wrong password, Good Bye ...
10 )                                    = 29
11 +++ exited (status 0) +++
```

---

Bu yüzden rastgele bir şifre seçtim ve 'strcmp'nin aslında çağrıldığı anlaşılıyor:
strcmp("tes", "sex"), ilk üç harf şifreyle karşılaştırıldı. Yani şifre seks gibi görünüyor.
İkili dosyayı tekrar çalıştırarak bunun doğru olup olmadığını kontrol edelim.

```bash
1 leviathan1@leviathan:~$ ./check
2 password: sex
3 $
```

---

Bu işe yarıyor ve bize 'leviathan2' kullanıcısı olduğumuz bir kabuk veriyor çünkü bu bir SUID ikili programıydı.

```bash
1 $ whoami
2 leviathan2
```

---

Bu, artık 'leviathan2' kullanıcısının gerçek şifresini arayabileceğimiz anlamına geliyor.
Web sitesindeki açıklamaya göre tüm şifreler 'etc/leviathan_pass' altında saklanmaktadır.

```bash
1 $ cat /etc/leviathan_pass/leviathan2
2 XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---
