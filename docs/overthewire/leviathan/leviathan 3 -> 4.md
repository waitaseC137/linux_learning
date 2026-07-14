# Leviathan 3 → 4

> **Bağlantı:** `ssh leviathan3@leviathan.labs.overthewire.org -p 2223`
> **Hedef:** setuid `level3` programının gizli parolasını `ltrace` ile bulup `leviathan4` parolasını oku.

---

## 1. Keşif (Recon)

```bash
leviathan3@gibson:~$ ls -la
-r-sr-x---  1 leviathan4 leviathan3 18100 level3

leviathan3@gibson:~$ file level3
level3: setuid ELF 32-bit ... with debug_info, not stripped
```

setuid `level3` (sahibi leviathan4). Çalıştırınca parola istiyor:

```bash
leviathan3@gibson:~$ ./level3
Enter the password> test
bzzzzzzzzap. WRONG
```

## 2. Analiz — `ltrace`

```bash
leviathan3@gibson:~$ echo wrongpw | ltrace ./level3
strcmp("h0no33", "kakaka")            = -1     # iç kontrol, önemsiz
printf("Enter the password> ")        = 20
fgets("wrongpw\n", 256, ...)          = ...
strcmp("wrongpw\n", "snlprintf\n")    = 1      # <-- ASIL karşılaştırma
puts("bzzzzzzzzap. WRONG")
```

İki `strcmp` var:
- İlki (`"h0no33"` vs `"kakaka"`) programın akışıyla ilgili bir tuzak/iç kontrol — bizi ilgilendirmez.
- İkincisi girdimizi **`"snlprintf"`** ile karşılaştırıyor. İşte parola bu.

## 3. Sömürü (Exploit)

Doğru parolayı verince program leviathan4 shell'i açıyor:

```bash
leviathan3@gibson:~$ ./level3
Enter the password> snlprintf
[You've got shell]!
$ id
uid=12004(leviathan4) gid=12003(leviathan3) ...
$ cat /etc/leviathan_pass/leviathan4
**********
```

> Betikle çözerken (Leviathan 1'deki gibi) açılan shell'in stdio tamponuna takılmamak için `ssh -tt` ile pty tahsis edip `snlprintf` ardından komutu satır satır beslemek gerekir.

## 4. Çözüm Özeti

```bash
echo x | ltrace ./level3     # parola: snlprintf
./level3                     # "snlprintf" → leviathan4 shell
cat /etc/leviathan_pass/leviathan4
```

→ `leviathan4` parolası: `**********`

| Adım | Bulgu |
|------|-------|
| Recon | setuid `level3`, parola istiyor |
| ltrace | 2 strcmp; gerçek olan `strcmp(girdi, "snlprintf\n")` |
| Parola | `snlprintf` |
| Sonuç | "[You've got shell]!" → leviathan4 shell |

**Alınan ders:** Leviathan 1 ile aynı sınıf hata. Birden fazla `strcmp` görürsen, *girdinle* (fgets/getchar sonucuyla) yapılanı seç; gerisi gürültü olabilir. `ltrace` sabit string parolalarını anında ifşa eder.
