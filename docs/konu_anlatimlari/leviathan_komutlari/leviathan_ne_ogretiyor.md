# Leviathan Bize Ne Öğretiyor?

> Leviathan, exploit yazmaktan çok **yerel yetki yükseltmenin (local privilege escalation) günlük dilini** öğretir: bir sistemde "düşük yetkili kullanıcı"dan "yetkili kullanıcı"ya geçmenin klasik yolları. Aşağıda her ders, geçtiği seviye ve gerçek dünyadaki karşılığı ile birlikte.

---

## Büyük resim

Leviathan'ın tamamı tek bir cümlede özetlenir:

> **Bir programın yetkisi (SUID) ile, o programa güvenilen girdiyi/dosyayı/davranışı kötüye kullanmak.**

Her seviye bu fikrin farklı bir varyasyonudur. Öğrendiğin şey komutlar değil; **bir hedefe nasıl bakılacağı** — neyin "saldırı yüzeyi" olduğunu görme refleksi.

---

## Ders 1 — Bilgi sızıntısı (Information Disclosure)
**Seviye:** leviathan0

Parola, bir yedek dosyasının (`.backup/bookmarks.html`) içine düz metin gömülüydü. Hassas veri, "sonra düzeltiriz" notuyla erişilebilir bir dosyada unutulmuştu.

- **Saldırı refleksi:** `ls -la` ile gizli dosyaları gör, `grep -i pass` ile sırları tara.
- **Gerçek dünya:** Git geçmişine düşmüş API anahtarları, log dosyalarındaki şifreler, yorum satırlarında kalan kimlik bilgileri.
- **Savunma:** Sırları koda/yedeğe gömme; secret manager kullan, izinleri sıkılaştır, geçmişi temizle.

🔗 Çözüm: [leviathan 0 -> 1](../../overthewire/leviathan/leviathan%200%20-%3E%201.md)

---

## Ders 2 — Dinamik analizle gömülü sırrı bulmak
**Seviye:** leviathan1, leviathan3

Programlar bir parola istiyordu ama parolayı binary'nin içine sabit (`strcmp(girdi, "sex")`, `strcmp(girdi, "snlprintf")`) olarak gömmüşlerdi. `ltrace` ile kütüphane çağrılarını izleyince parola anında ortaya çıktı.

- **Saldırı refleksi:** Tersine mühendisliğe girişmeden önce `ltrace`/`strace` ile gözlemle. Çoğu "gizli" karşılaştırma orada görünür.
- **Gerçek dünya:** Mobil uygulamalara/firmware'e gömülü API anahtarları, lisans kontrolleri, "gizli" kıyaslamalar.
- **Savunma:** "Security through obscurity" güvenlik değildir. Kimlik doğrulamayı sunucu tarafında, hash + sabit-zamanlı karşılaştırma ile yap.

🔗 Çözümler: [leviathan 1 -> 2](../../overthewire/leviathan/leviathan%201%20-%3E%202.md) · [leviathan 3 -> 4](../../overthewire/leviathan/leviathan%203%20-%3E%204.md)

---

## Ders 3 — Komut & argüman enjeksiyonu (`system()`)
**Seviye:** leviathan2

`printfile` programı `access()` ile erişimini kontrol ediyor, sonra `system("/bin/cat " + argv[1])` ile dosyayı basıyordu. Kabuk, dosya adını **boşluktan bölünce** ekstra argüman enjekte etmek mümkün oldu; üstelik `access` ile `cat` aynı string'i farklı yorumladı.

- **Saldırı refleksi:** Kullanıcı girdisi bir kabuk komutuna giriyorsa, boşluk / `;` / `|` / `$()` ile enjeksiyon dene.
- **Gerçek dünya:** Web'deki **OS command injection** (CWE-78) — bu sınıfın en yaygın ve tehlikeli haliyle birebir aynı mantık.
- **Savunma:** `system()`/`popen()` yerine `execv()` ile argümanları **ayrı** ver; kullanıcı girdisini asla kabuğa string olarak gömme.

🔗 Çözüm: [leviathan 2 -> 3](../../overthewire/leviathan/leviathan%202%20-%3E%203.md)

---

## Ders 4 — Kodlama (encoding) ≠ şifreleme
**Seviye:** leviathan4

`.trash/bin` parolayı ikili (binary) ASCII olarak `00110000 01100100 ...` biçiminde basıyordu. Bu bir şifreleme değil, sadece bir **gösterim (encoding)**; 8'erli bitleri ASCII'ye çevirmek yeterliydi.

- **Saldırı refleksi:** 0/1, base64, hex gibi "okunamaz" çıktıları önce decode etmeyi dene — çoğu sadece kodlamadır.
- **Gerçek dünya:** Base64 ile "gizlenmiş" tokenlar, hex dump'lar, URL-encode edilmiş veriler.
- **Savunma:** Veriyi kodlamak onu gizlemez. Gerçekten gizlilik gerekiyorsa şifreleme (ve anahtar yönetimi) gerekir.

🔗 Çözüm: [leviathan 4 -> 5](../../overthewire/leviathan/leviathan%204%20-%3E%205.md)

---

## Ders 5 — Sembolik link saldırısı & güvensiz `/tmp`
**Seviye:** leviathan5

`leviathan5` programı sabit bir yolu (`/tmp/file.log`) leviathan6 yetkisiyle açıp basıyordu, ama dosyanın **ne olduğunu kontrol etmiyordu**. Bu yolu parola dosyasına symlink yapınca, program bizim için parolayı okudu.

- **Saldırı refleksi:** Yetkili bir program `/tmp`'de **öngörülebilir** bir dosya adı kullanıyorsa, onu symlink ile hedefe yönlendir.
- **Gerçek dünya:** **Symlink takibi / güvensiz geçici dosya** (CWE-59) — burada bir kontrol bile yok, doğrudan symlink takip ediliyor. (Eğer araya bir `access()` kontrolü girseydi, kontrol↔kullanım yarışı = **TOCTOU**, CWE-367 olurdu.) İkisi de birçok local privesc CVE'sinin temelidir.
- **Savunma:** `O_NOFOLLOW`, kullanıcıya özel güvenli dizinler, `mkstemp`, ve işten önce yetki düşürmek (`setresuid`).

🔗 Çözüm: [leviathan 5 -> 6](../../overthewire/leviathan/leviathan%205%20-%3E%206.md)

---

## Ders 6 — Statik analiz & zayıf sırlar
**Seviye:** leviathan6

`leviathan6` 4 haneli bir PIN istiyordu. İki yol vardı: ya 0000–9999 **brute force**, ya da `objdump` ile karşılaştırılan sabiti (`cmp [ebp-0xc], eax` öncesi `mov [ebp-0xc], 0x1bd3` = 7123) doğrudan okumak. Statik analiz saniyeler içinde sonuç verdi.

- **Saldırı refleksi:** Arama uzayı küçükse brute force; binary elindeyse `objdump`/`gdb` ile sabiti oku.
- **Gerçek dünya:** Kısa PIN'ler, tahmin edilebilir tokenlar, binary'e gömülü "magic" değerler.
- **Savunma:** Sırları binary'e immediate olarak koyma; PIN'leri rate-limit'le ve sunucuda doğrula.

🔗 Çözüm: [leviathan 6 -> 7](../../overthewire/leviathan/leviathan%206%20-%3E%207.md)

---

## Seviye → Kavram haritası

| Seviye | Zafiyet sınıfı | Anahtar araç |
|---|---|---|
| 0 → 1 | Bilgi sızıntısı | `ls -la`, `grep` |
| 1 → 2 | Gömülü sır + dinamik analiz | `ltrace` |
| 2 → 3 | Argüman/komut enjeksiyonu (`system`) | mantık + `ltrace` |
| 3 → 4 | Gömülü sır + dinamik analiz | `ltrace` |
| 4 → 5 | Encoding ≠ şifreleme | binary→ASCII |
| 5 → 6 | Symlink takibi + güvensiz `/tmp` | `ln -s` |
| 6 → 7 | Zayıf sır (brute / statik analiz) | `objdump`, `for` döngüsü |

---

## Üst düzey çıkarımlar

1. **SUID güçlü ama tehlikelidir.** Yetkiyle çalışan her program, güvendiği her girdi/dosya/davranış üzerinden istismar edilebilir. Saldırı yüzeyini daralt, yetkiyi erken düşür.
2. **Güvenlik ≠ gizleme.** Gömülü parola, encode edilmiş veri, kısa PIN — hiçbiri koruma değildir.
3. **Önce gözlemle, sonra çöz.** `ls -la` → `file` → `ltrace`/`objdump` sıralaması seviyelerin çoğunu tek başına çözer.
4. **Aynı hatalar her yerde.** Buradaki command injection, TOCTOU ve info-disclosure dersleri; web ve gerçek sistemlerdeki en yaygın güvenlik açığı sınıflarının birebir minyatürüdür.

---

## Sırada ne var?

Leviathan temelleri verdi. Bir sonraki adımlar:

- **Behemoth** — buffer overflow ve daha ciddi bellek hataları.
- **Narnia** — exploit geliştirmenin başlangıcı (shellcode, EIP kontrolü).
- Bellek istismarı temellerine geçmek istersen: [../binary_exploitation/00_x86_assembly_temelleri.md](../binary_exploitation/00_x86_assembly_temelleri.md)

---

## İlgili Konular

- 👈 **Başlamadan önce ön bilgiler:** [baslamadan_once_on_bilgiler.md](./baslamadan_once_on_bilgiler.md)
- Teknik referanslar: [dosya_izinleri_suid.md](./dosya_izinleri_suid.md) · [ltrace_strace.md](./ltrace_strace.md) · [sembolik_linkler.md](./sembolik_linkler.md) · [gdb.md](./gdb.md) · [binary_analizi.md](./binary_analizi.md) · [brute_force_bash.md](./brute_force_bash.md)
- Tüm konu indeksi: [../KONU_ANLATIMLARI.md](../KONU_ANLATIMLARI.md)
