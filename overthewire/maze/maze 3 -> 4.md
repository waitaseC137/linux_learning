# OverTheWire — Maze Level 3 → 4

> Hedef: `maze3`'ten `maze4` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: **Kendini değiştiren kod (self-modifying)** + `mprotect` ile RWX + XOR çözme → gizli "sihirli bayt" parolası.

---

## 1. İlk Bakış
```bash
file /maze/maze3       # statically linked, 32-bit, NOT stripped, sadece 4728 bayt
/maze/maze3            # çıktı: "./level4 ev0lcmds!"   <-- TUZAK / yanıltma
```
Statik linkli, çok küçük, elle yazılmış assembly (`maze3.asm`). 11 sembol: `_start, fine, l1, d1, d1sz, prgmsz`.

## 2. Analiz — `_start`
```asm
pop eax ; dec eax ; jne fine     ; argc==1 mi? (yani argümansız mı)
call ...                          ; jmp/call/pop hilesiyle string adresi al
; write(1, "./level4 ev0lcmds!\n", 20) ; exit(1)   <-- argümansız çalışınca bu TUZAK basılır
```
Argüman verilirse `fine`'a gidilir — asıl iş orada.

## 3. Analiz — `fine` (self-modifying)
```asm
mov eax, 0x7d                ; __NR_mprotect (125)
mov ebx, 0x8049000 ; and ebx, 0xfffff000   ; kod sayfasını hizala
mov ecx, 0xa3 ; mov edx, 0x7 ; int 0x80     ; mprotect(page, , PROT_RWX)  -> kod yazılabilir
lea esi, [0x804906b]         ; esi = d1 (şifreli bölge)
mov edi, esi ; mov ecx, 0x38 ; mov edx, 0x12345678   ; XOR anahtarı
l1: lodsd ; xor eax, edx ; stosd ; loop l1  ; d1'i YERİNDE çöz
; ... çözülen d1'e düşülür ve çalıştırılır
```
`d1` bölgesi `0x12345678` ile XOR'lanmış. Yerinde çözülüp icra ediliyor → statik analizde görünmeyen gizli kod.

## 4. Şifrenin Kırılması
`d1`'i lokalde XOR ile çözüp disassemble ettim:
```asm
pop eax                        ; eax = argv[1]
cmp DWORD PTR [eax], 0x1337c0de ; argv[1]'in ilk 4 baytı SİHİRLİ değer olmalı
jne  exit                       ; değilse exit(1)
mov ebx, 0x3a9c                 ; 0x3a9c = 15004 = maze4 UID
push 0x46 ; pop eax             ; eax = 70 = __NR_setreuid
mov ecx, ebx ; int 0x80         ; setreuid(15004, 15004)  -> maze4'e geç
; execve("/bin//sh", ...)
exit: exit(1)
```
Yani `argv[1]` `0x1337c0de` ("1337 c0de") ile başlamalı → little-endian baytlar `\xde\xc0\x37\x13`. Doğru baytlarla program `setreuid(maze4)` + `execve("/bin/sh")` yapıyor.

## 5. Exploit
```bash
# argv[1] = \xde\xc0\x37\x13  (0x1337c0de little-endian)
printf 'cat /etc/maze_pass/maze4; id\n' | \
  python3 -c "import os; os.execve('/maze/maze3',['/maze/maze3', bytes.fromhex('dec03713')], {'PATH':'/usr/bin:/bin'})"
# uid=15004(maze4) ... <maze4 şifresi>
```

## Dersler
| Konu | Not |
|------|-----|
| Self-modifying code | Şifreli/paketlenmiş payload çalışma anında çözülür → sadece statik disasm yetmez |
| `mprotect(...,PROT_EXEC|WRITE)` | Kod sayfasını RWX yapıp kendini yazma; runtime-decrypt'in göstergesi |
| XOR çözme | Anahtar (`0x12345678`) + şifreli bölge (`d1`) elde varsa offline çöz, disasm et |
| Yanıltma (red herring) | "./level4 ev0lcmds!" sadece argümansız çalışınca basılan tuzak |
| jmp/call/pop | Konumdan-bağımsız string adresi elde etme klasik shellcode hilesi |
| Sihirli sabit | `0x1337c0de`, `0x3a9c`(=hedef uid) gibi sabitler niyeti ele verir |
