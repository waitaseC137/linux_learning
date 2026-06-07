# Başlamadan Önce — Leviathan Ön Bilgileri

> Leviathan laboratuvarına oturmadan önce bilmen gereken her şey: oyunun mantığı, nasıl bağlanılır, hangi temellere ihtiyacın var ve ilk açtığın kabukta nasıl bir keşif refleksi kurmalısın.

---

## Leviathan nedir?

Leviathan, [OverTheWire](https://overthewire.org/wargames/leviathan/) sitesindeki **giriş seviyesi** bir wargame'dir. Narnia/Behemoth gibi exploit yazmayı değil; **temel Linux becerilerini, dosya izinlerini, SUID mantığını ve basit tersine mühendisliği** öğretir. 8 seviye vardır (leviathan0 → leviathan7) ve çoğu seviye 5–15 dakikada çözülür.

İpucu/teori yoktur — her seviye sana sadece bir kullanıcı ve bir dizin verir; geri kalanını keşfederek bulursun.

---

## Oyunun çalışma mantığı

Tüm OverTheWire oyunlarında ortak kural şudur:

```
Her seviye, BİR SONRAKİ seviyenin parolasını ele geçirmektir.
```

- `leviathan0` olarak giriş yaparsın, amacın `leviathan1` parolasını bulmaktır.
- Parola her zaman şurada durur:

```bash
/etc/leviathan_pass/leviathan<N>
```

- Bu dosyayı yalnızca `leviathanN` kullanıcısı okuyabilir. Sen `leviathan(N-1)`'sin → doğrudan `cat` edemezsin.
- O yüzden, ev dizinindeki **SUID'li bir program** ya da bir yapılandırma hatasını kullanarak `leviathanN` yetkisine yükselir, sonra parolayı okursun.

---

## Nasıl bağlanılır? (SSH)

```bash
ssh leviathan0@leviathan.labs.overthewire.org -p 2223
```

| Parça | Değer |
|---|---|
| Kullanıcı | `leviathan0` (ilk seviye) |
| Sunucu | `leviathan.labs.overthewire.org` |
| Port | `2223` |
| Başlangıç parolası | `leviathan0` |

Bir seviyeyi çözüp bir sonraki parolayı bulunca, çıkıp (`exit`) bir üst kullanıcıyla tekrar bağlanırsın:

```bash
ssh leviathan1@leviathan.labs.overthewire.org -p 2223   # bulduğun parolayla
```

> **Not:** Parolayı yazarken ekranda görünmez (normaldir). Kopyala-yapıştır yaparken baştaki/sondaki boşluğa dikkat et.

---

## Hangi temellere ihtiyacın var?

Aşağıdaki konuları bilmen yeterli. Her biri için bu klasörde ayrı bir konu anlatımı var:

| İhtiyaç | Neden gerekli | Konu dosyası |
|---|---|---|
| **Terminalde gezinme** (`ls -la`, `cd`, `cat`, `pwd`) | Dizin keşfi, gizli dosyaları görmek | [linux_komutlari/dosya_sistemi.md](../linux_komutlari/dosya_sistemi.md) |
| **Metin arama** (`grep`, `strings`) | Dosya içinde sızdırılmış parolayı bulmak | [linux_komutlari/metin_isleme.md](../linux_komutlari/metin_isleme.md) |
| **Dosya izinleri & SUID** | Oyunun tüm mantığı buna dayanır | [dosya_izinleri_suid.md](./dosya_izinleri_suid.md) |
| **Binary tanıma** (`file`, `xxd`, binary→ASCII) | Programın 32/64-bit oluşunu ve çıktısını çözmek | [binary_analizi.md](./binary_analizi.md) |
| **Dinamik analiz** (`ltrace`, `strace`) | Programın hangi parola ile karşılaştırdığını görmek | [ltrace_strace.md](./ltrace_strace.md) |
| **Statik analiz** (`gdb`, `objdump`) | Gömülü sabitleri/kodları okumak | [gdb.md](./gdb.md) |
| **Sembolik linkler** (`ln -s`) | Programın okuduğu dosyayı yönlendirmek | [sembolik_linkler.md](./sembolik_linkler.md) |
| **Bash döngü & brute force** | Kısa kodları/PIN'leri denemek | [brute_force_bash.md](./brute_force_bash.md) |

> Bu araçların hepsi **sunucuda zaten kurulu** (`ltrace`, `strace`, `gdb`, `objdump`, `strings`, `file` mevcut). Kendi makinene bir şey kurman gerekmez; sadece SSH istemcisi yeter.

---

## İlk açtığın kabukta keşif refleksi

Her yeni seviyeye girdiğinde, düşünmeden şu adımları uygula:

```bash
# 1) Neredeyim, kimim?
pwd; id; whoami

# 2) Ev dizininde NE VAR? (gizli dosyalar dahil — en kritik komut)
ls -la

# 3) İlginç bir dosya/binary varsa türünü öğren
file <dosya>

# 4) Binary ise: çalıştır, ne istediğini gör; sonra ltrace ile izle
./<binary>
ltrace ./<binary>

# 5) Metin/yedek dosyası varsa içinde sır ara
grep -i -E 'pass|key|secret' <dosya>
```

`ls -la`'daki **gizli dosyalar** (`.backup`, `.trash` gibi) ve **SUID biti** (`-r-s...`) neredeyse her zaman çözümün anahtarıdır.

---

## Güvenli çalışma alışkanlıkları

- Geçici dosyaları kendi alanında oluştur: `cd /tmp && mktemp -d` ile özel bir dizin aç.
- Oluşturduğun symlink/dosyaları iş bitince temizle (`rm`), bir sonraki denemeyi bozmasın.
- Parolayı bulunca **bir yere not et** (ama OTW kuralı gereği herkese açık paylaşma).

---

## Özet

| Soru | Cevap |
|---|---|
| Amaç ne? | Her seviyede bir sonraki kullanıcının parolasını bul |
| Parola nerede? | `/etc/leviathan_pass/leviathan<N>` |
| Nasıl okurum? | SUID binary / yanlış yapılandırma ile yetki yükselt |
| Nasıl bağlanırım? | `ssh leviathanN@leviathan.labs.overthewire.org -p 2223` |
| İlk ne yaparım? | `ls -la` → gizli dosya & SUID ara, `file`/`ltrace` ile incele |

---

## İlgili Konular

- 👉 **Leviathan'ın öğrettikleri:** [leviathan_ne_ogretiyor.md](./leviathan_ne_ogretiyor.md)
- Çözümler: [../../overthewire/leviathan/](../../overthewire/leviathan/) (`leviathan N -> M` dosyaları)
- Tüm konu indeksi: [../KONU_ANLATIMLARI.md](../KONU_ANLATIMLARI.md)
