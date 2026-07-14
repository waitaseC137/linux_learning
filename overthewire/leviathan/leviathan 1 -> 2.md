# Leviathan 1 → 2

> **Bağlantı:** `ssh leviathan1@leviathan.labs.overthewire.org -p 2223`
> **Hedef:** setuid `check` programını kırıp `leviathan2` parolasını oku.

---

## 1. Keşif (Recon)

```bash
leviathan1@gibson:~$ ls -la
-r-sr-x---  1 leviathan2 leviathan1 15088 check
```

```bash
leviathan1@gibson:~$ file check
check: setuid ELF 32-bit LSB executable, Intel 80386, dynamically linked, not stripped
```

`check` bir **setuid** binary (`-r-s...`), sahibi `leviathan2`. Yani çalıştırınca `leviathan2` yetkisiyle koşar. Çalıştırdığımızda bir parola soruyor:

```bash
leviathan1@gibson:~$ ./check
password: test
Wrong password, Good Bye ...
```

## 2. Analiz — `ltrace`

`not stripped` ve dinamik bağlı olduğundan, kütüphane çağrılarını `ltrace` ile izlemek en hızlı yol. Doğru parolayı bilmeden de programın *neyle karşılaştırdığını* görebiliriz:

```bash
leviathan1@gibson:~$ echo 'test' | ltrace ./check
__libc_start_main(0x80490ed, 1, 0xffffdcc4, 0 <unfinished ...>
printf("password: ")              = 10
getchar()                         = 116   # 't'
getchar()                         = 101   # 'e'
getchar()                         = 115   # 's'
strcmp("tes", "sex")              = 1
puts("Wrong password, Good Bye ...")
```

Görüldüğü gibi program:
1. `getchar()` ile **sadece 3 karakter** okuyor,
2. bunları `strcmp(girdi, "sex")` ile karşılaştırıyor.

Yani parola: `sex`. Doğru girdiyle tekrar izleyelim:

```bash
leviathan1@gibson:~$ echo sex | ltrace ./check
strcmp("sex", "sex")              = 0
geteuid()                         = ...
setreuid(...)                     # gerçek+efektif uid'i leviathan2'ye sabitler
system("/bin/sh" <no return ...>  # leviathan2 olarak shell!
```

Doğru parolada program `setreuid()` ile yetkiyi kalıcı yapıp `system("/bin/sh")` çağırarak **leviathan2 shell'i** açıyor.

## 3. Sömürü (Exploit)

Programa `sex` yazınca leviathan2 shell'ine düşüyoruz. Otomasyon için bir pty üzerinden parolayı ve ardından komutu besliyoruz:

```bash
leviathan1@gibson:~$ ./check
password: sex
$ id
uid=12002(leviathan2) gid=12001(leviathan1) ...
$ cat /etc/leviathan_pass/leviathan2
**********
```

> **Not (otomasyon detayı):** Eğer parolayı `echo sex | ./check` ile boru (pipe) üzerinden verirseniz, `getchar()` arkasındaki stdio tamponu stdin'in *tamamını* (sonradan vereceğiniz komutları da) yutar ve açılan shell hemen EOF görüp kapanır. Bu yüzden interaktif çözümde gerçek terminal (pty) gerekir; betikle çözerken `ssh -tt` ile pty tahsis edip satır satır beslemek gerekir.

## 4. Çözüm Özeti

```bash
echo 'test' | ltrace ./check     # parolanın "sex" olduğunu öğren
./check                          # "sex" yaz → leviathan2 shell
cat /etc/leviathan_pass/leviathan2
```

→ `leviathan2` parolası: `**********`

| Adım | Bulgu |
|------|-------|
| Recon | setuid `check`, parola soruyor |
| ltrace | `getchar()`×3 + `strcmp(.,"sex")` |
| Parola | `sex` |
| Sonuç | `setreuid`+`system("/bin/sh")` → leviathan2 shell |

**Alınan ders:** Dinamik bağlı, strip edilmemiş setuid programlarda gömülü string karşılaştırmaları (parolalar) `ltrace` ile çoğu zaman *tersine mühendislik yapmadan* açığa çıkar. Parolaları binary'e gömmek güvenlik sağlamaz (security through obscurity).
