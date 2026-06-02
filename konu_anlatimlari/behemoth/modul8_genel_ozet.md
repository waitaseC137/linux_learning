# Modül 8 — Genel Özet: Privilege Escalation ve Sonraki Adımlar

> **İlgili Seviye:** Tüm Behemoth  
> **Anahtar Kavramlar:** SUID, privilege escalation, exploit geliştirme metodolojisi  
> **Kazanım:** Behemoth'ta öğrenilen teknikleri bütünleştirmek ve bir sonraki seviyeye hazırlanmak

---

## 🧠 1. Büyük Resim (Konsept Nedir?)

Behemoth'u tamamladın. Şimdi geri adım at ve büyük resme bak: her seviyede ne yaptın?

Farklı teknikler kullandın ama hepsinde **aynı hedefe** ulaştın: başkasına ait bir dosyayı okumak. Bu dosya `/etc/behemoth_pass/behemothX` idi ve normalde sana kapalıydı. Bunu başarabilmek için bir SUID binary'nin yetkisini ele geçirdin.

Bu tam olarak **privilege escalation** (yetki yükseltme) dir: düşük yetkili bir kullanıcı olarak yüksek yetkili işlemler yapabilmek.

Gerçek dünya sızma testlerinde de aynı döngü tekrar eder:

```
Erişim elde et → Yetkiyi yükselt → Daha fazla erişim → Tekrar et
```

---

## 🔍 2. Zafiyetin Anatomisi — SUID Mekanizması

### SUID nedir?

Linux'ta her dosyanın bir sahibi ve izin bitleri vardır. `setuid` (SUID) biti özel bir izindir: bu bit set edilmiş bir binary çalıştırıldığında, **çalıştıran kullanıcının değil, dosya sahibinin yetkisiyle** çalışır.

```bash
# SUID binary'yi tanı — 's' biti
ls -la /behemoth/behemoth0
-r-sr-x--- 1 behemoth1 behemoth0 ... behemoth0
#    ↑
#    s = setuid bit (normalde x olurdu)
#    Dosya sahibi: behemoth1 → bu yetkiyle çalışır
```

```bash
# Sistemdeki tüm SUID binary'leri bul
find / -perm -4000 2>/dev/null
```

### SUID nasıl çalışır?

```
Normal çalışma:
  kullanici (behemoth0) → ./program → uid=behemoth0

SUID çalışma:
  kullanici (behemoth0) → ./suid_program → uid=behemoth1
                                              ↑
                                    Dosya sahibinin yetkisi
```

Behemoth0'ı çalıştıran `behemoth0` kullanıcısısın, ama binary `behemoth1` yetkisiyle çalışıyor. Bu yetki `/etc/behemoth_pass/behemoth1` dosyasını okumak için yeterli.

### `setreuid()` neden gerekli?

Binary exploit edildiğinde shell açılır, ama shell'in yetkisi düşebilir. `setreuid(geteuid(), geteuid())` çağrısı gerçek UID'yi efektif UID'ye eşitler — yani yüksek yetkiyi kalıcı hale getirir:

```c
setreuid(geteuid(), geteuid());
system("/bin/sh");
// Artık shell behemoth1 yetkisinde
```

Shell açıldığında her zaman `id` ile kontrol et:

```bash
$ id
uid=13001(behemoth1) gid=13000(behemoth0) ...
# uid behemoth1 ise yetki yükseltme başarılı
```

---

## 🛠️ 3. Behemoth Teknikler Haritası

Behemoth'ta öğrendiğin tekniklerin tam haritası:

```
GİRDİ ANALİZİ
─────────────────────────────────────────────────────
ltrace → library çağrıları    strings → gömülü metin
strace → syscall'lar          gdb → assembly/register
─────────────────────────────────────────────────────

ZAFİYET TÜRLERİ          SEVİYE    ANAHTAR ARAÇ
─────────────────────────────────────────────────────
Hardcoded parola          beh0      ltrace (strcmp)
Stack BOF (stdin)         beh1      gdb, shellcode
Race condition            beh2      ln -sf, timing
Format string             beh3      %x, %s, %n
PID tahmini               beh4      /proc, symlink
UDP sniffing              beh5      nc -lu, tcpdump
Shellcode filtresi        beh6      0x0b bypass
argv BOF + env SC         beh7      strcpy, getenv
─────────────────────────────────────────────────────

SHELLCODE YERLEŞİMİ
─────────────────────────────────────────────────────
Stack (NX disabled)  → NOP sled + shellcode + EIP
Environment variable → büyük NOP sled, yüksek adres
Dosya               → ham byte, binary okur/çalıştırır
─────────────────────────────────────────────────────
```

### Exploit geliştirme metodolojisi

Behemoth'ta her seviyede aynı adımları izledin:

```
1. KEŞİF
   file ./binary          → mimari, strip durumu
   strings ./binary       → gömülü metin, ipuçları
   checksec ./binary      → koruma mekanizmaları
   ltrace ./binary        → runtime davranış
   strace ./binary        → syscall'lar

2. ZAFİYET TESPİTİ
   Binary ne alıyor? (argv / stdin / dosya / env / ağ)
   Sınır kontrolü var mı? (gets, strcpy, scanf)
   Dış kaynaktan kontrol edilebilir dosya/pid/socket var mı?

3. EXPLOIT GELİŞTİRME
   gdb ile offset bul
   Shellcode seç / yaz
   Adresi hesapla (NOP sled ile)
   Payload'u oluştur

4. DOĞRULAMA
   whoami / id ile yetki kontrol et
   cat /etc/behemoth_pass/behemothX
```

---

## 🚨 4. Yeni Başlayanların Düştüğü Tuzaklar

### Tuzak 1 — Shell açıldığında yetki kontrolü yapmamak

Shell açılmış görünse bile yetki yükselmemiş olabilir. Her zaman `id` ile kontrol et:

```bash
$ id
uid=13000(behemoth0) ...  # ← yetki yükselmedi, exploit başarısız
uid=13001(behemoth1) ...  # ← başarılı
```

### Tuzak 2 — `/tmp` dizinini temizlememek

Farklı seviyelerde `/tmp` altında bırakılan dosyalar birbirini etkileyebilir:

```bash
# Her seviye öncesi temizle
rm -rf /tmp/behemoth*
```

### Tuzak 3 — ASLR'yi unutmak

Behemoth'ta ASLR kapalı, bu yüzden adresler sabit. Gerçek sistemlerde:

```bash
cat /proc/sys/kernel/randomize_va_space
# 0 → ASLR kapalı (Behemoth)
# 2 → ASLR açık (gerçek sistemler)
```

ASLR açık sistemlerde aynı teknikler çalışmaz — ret2libc, ROP chains gibi ileri yöntemler gerekir.

### Tuzak 4 — Modülleri sırayla okumamak

Her modül bir öncekinin üzerine inşa edilir:

```
Modül 1 (ltrace) → Modül 4 (BOF) → Modül 7 (argv BOF)
Modül 2 (race)   → Modül 2 (PID) 
Modül 3 (UDP)    → bağımsız
Modül 5 (format) → Modül 5 (ileri: %hn)
Modül 6 (filter) → Modül 7 (env SC)
```

---

## Sonraki Adımlar

Behemoth bitti. Kazandıkların:

- Binary analiz refleksi (`ltrace → strings → gdb`)
- Stack overflow temeli
- Race condition ve zamanlama saldırıları
- Format string read/write
- Shellcode yazma ve filtreleme bypass
- Privilege escalation döngüsü

### Sıradaki wargame önerileri

| Wargame | Ne öğretir? | Zorluk |
|---------|-------------|--------|
| **Narnia** | Daha derin BOF, heap overflow | 3/10 |
| **Leviathan** | Sembolik link, SUID tekrar | 1/10 |
| **Protostar** | BOF, format string, heap — daha derin | 4/10 |
| **Exploit.Education** | Modern exploit teknikleri | 5-8/10 |

### Öğrenmeye devam

```
Behemoth (şu an) → Narnia → Protostar → Modern Binary Exploitation
     ↓
  ltrace, BOF     heap     ROP chains    ASLR+NX bypass
  race cond.      UAF      ret2libc      kernel exploits
  format str.     fmt adv. PIE bypass    CTF seviyesi
```

---

## Özet: Behemoth Tamamlandı

```
Behemoth = "Kaynak kodu olmadan binary güvenliğini anlama"
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
        Dinamik         Bellek          Sistem
        Analiz          Güvenliği       Güvenliği
            │              │              │
        ltrace          BOF + SC       Race cond.
        strace          fmt string     UDP sniff
        gdb             env exploit    PID predict
            │              │              │
            └──────────────┼──────────────┘
                           ▼
                   Privilege Escalation
                   SUID → başkasının yetkisi
                   /etc/behemoth_pass/behemothX
```

---

## Kaynaklar

- [OverTheWire Behemoth](https://overthewire.org/wargames/behemoth/)
- [Linux SUID — man chmod](https://man7.org/linux/man-pages/man1/chmod.1.html)
- [Exploit Education — Protostar](https://exploit.education/protostar/)
- [pwntools](https://docs.pwntools.com/) — ileri exploit geliştirme
- [CTF-wiki Binary Exploitation](https://ctf-wiki.org/pwn/linux/user-mode/stackoverflow/x86/stackoverflow-basic/)
