# Leviathan 6 → 7  (son seviye)

> **Bağlantı:** `ssh leviathan6@leviathan.labs.overthewire.org -p 2223`
> **Hedef:** setuid `leviathan6`'nın istediği 4 haneli kodu bulup `leviathan7` parolasını oku.

---

## 1. Keşif (Recon)

```bash
leviathan6@gibson:~$ ls -la
-r-sr-x---  1 leviathan7 leviathan6 15040 leviathan6

leviathan6@gibson:~$ ./leviathan6
usage: ./leviathan6 <4 digit code>

leviathan6@gibson:~$ ./leviathan6 1111
Wrong
```

setuid `leviathan6` (sahibi leviathan7) argüman olarak **4 haneli bir kod** istiyor.

## 2. Analiz — `ltrace` + `objdump`

```bash
leviathan6@gibson:~$ ltrace ./leviathan6 1111
atoi("1111")            = 1111
puts("Wrong")
```

`atoi(argv[1])` ile kodu sayıya çevirip bir değerle karşılaştırıyor. Brute-force (0000–9999) çalışır ama kodu **statik analizle** anında bulabiliriz:

```bash
leviathan6@gibson:~$ objdump -d -M intel ./leviathan6 | sed -n '/<main>:/,/ret/p'
...
80491da: c7 45 f4 d3 1b 00 00   mov  DWORD PTR [ebp-0xc], 0x1bd3   # gizli kod ebp-0xc'ye
8049212: e8 89 fe ff ff         call atoi@plt                       # eax = atoi(argv[1])
804921a: 39 45 f4               cmp  DWORD PTR [ebp-0xc], eax        # kod == 0x1bd3 ?
```

Karşılaştırılan sabit: `0x1bd3` = **7123** (ondalık).

```
0x1bd3 = 1*4096 + 11*256 + 13*16 + 3 = 7123
```

## 3. Sömürü (Exploit)

```bash
leviathan6@gibson:~$ ./leviathan6 7123
$ id
uid=12007(leviathan7) gid=12006(leviathan6) ...
$ cat /etc/leviathan_pass/leviathan7
**********
```

> **Brute-force alternatifi** (objdump yoksa):
> ```bash
> for i in $(seq -w 0 9999); do ./leviathan6 $i 2>/dev/null | grep -qv Wrong && echo $i; done
> ```

## 4. Çözüm Özeti

```bash
objdump -d -M intel ./leviathan6   # cmp [ebp-0xc], eax ; sabit 0x1bd3 = 7123
./leviathan6 7123                  # → leviathan7 shell
cat /etc/leviathan_pass/leviathan7
```

→ `leviathan7` parolası: `**********`

| Adım | Bulgu |
|------|-------|
| Recon | setuid `leviathan6 <4 haneli kod>` |
| ltrace | `atoi(argv[1])` + sabit karşılaştırma |
| objdump | `mov [ebp-0xc], 0x1bd3` → kod `7123` |
| Exploit | `./leviathan6 7123` → leviathan7 shell |

---

## 5. leviathan7 — Oyun Tamamlandı 🎉

leviathan7'ye giriş yapınca:

```bash
leviathan7@gibson:~$ cat CONGRATULATIONS
Well Done, you seem to have used a *nix system before, now try something
more serious.
(Please don't post writeups, solutions or spoilers about the games on the web. Thank you!)
```

**Leviathan wargame bitti** (leviathan0 → leviathan7).

**Alınan ders:** Kısa sayısal sırlar hem brute-force ile (yalnızca 10.000 olasılık) hem de statik analizle (`objdump`/`gdb`'de `cmp` sabiti) anında düşer. Bir sırrı binary içinde sabit (immediate) olarak tutmak koruma sağlamaz.

> ⚠️ OTW kuralları gereği parolalar bu notlarda `**********` ile gizlendi; yazıyı herkese açık paylaşma.
