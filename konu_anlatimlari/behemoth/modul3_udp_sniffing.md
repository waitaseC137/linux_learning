# Modül 3 — Ağ Seviyesinde Sızma: UDP Protokolü ve Sniffing

> **İlgili Seviye:** Behemoth5  
> **Anahtar Araçlar:** `nc -lu`, `tcpdump`, `wireshark`  
> **Kazanım:** Şifresiz ağ trafiğini yakalamak ve güvenli iletişim tasarımını anlamak

---

## 🧠 1. Büyük Resim (Konsept Nedir?)

Bir posta kutusunun önünden geçen postacıyı düşün. Zarflar kapalıysa (şifreli — TLS, HTTPS) içeriği okuyamazsın. Ama zarflar açıksa (şifresiz — HTTP, UDP plaintext) postacı ya da yolda duran biri kolayca okuyabilir.

Ağ trafiği de aynı mantıkla çalışır. İki program birbiriyle iletişim kurduğunda, o veri fiziksel ya da sanal bir ağ üzerinden geçer. Bu yolda olan herkes — doğru araçla — o veriyi yakalayabilir. Buna **sniffing** (koklama) denir.

Behemoth5'te binary, şifreyi bir UDP paketiyle `localhost`'a gönderir. Şifreleme yok, doğrulama yok — paket düz metin uçuyor. Tek yapman gereken dinlemek.

---

## 🔍 2. Zafiyetin Anatomisi (Neden Kaynaklanıyor?)

### TCP vs UDP — temel fark

```
TCP (Transmission Control Protocol)
────────────────────────────────────
Gönderen          Alıcı
   │                │
   │─── SYN ───────►│    1. Bağlantı isteği
   │◄── SYN-ACK ────│    2. Onay
   │─── ACK ───────►│    3. Bağlantı kuruldu
   │                │
   │─── Veri ──────►│    4. Veri gönder
   │◄── ACK ────────│    5. Alındı onayı
   │                │
   Güvenilir, sıralı, bağlantı tabanlı

UDP (User Datagram Protocol)
────────────────────────────
Gönderen          Alıcı
   │                │
   │─── Veri ──────►│    Gönder ve unut
                         El sıkışma yok
                         Onay yok
                         Sıralama yok
   Hızlı, hafif, bağlantısız
```

UDP'nin avantajı hızdır — bu yüzden DNS sorguları, video streaming, online oyunlar UDP kullanır. Dezavantajı: güvenilirlik ve güvenlik garantisi yoktur.

### Behemoth5'te ne oluyor?

Binary şuna benzer bir şey yapıyor:

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

int main() {
    // Şifreyi oku
    FILE *f = fopen("/etc/behemoth_pass/behemoth6", "r");
    char password[64];
    fgets(password, sizeof(password), f);
    fclose(f);

    // UDP socket aç
    int sock = socket(AF_INET, SOCK_DGRAM, 0);

    // Localhost:1234'e gönder
    struct sockaddr_in dest;
    dest.sin_family = AF_INET;
    dest.sin_port = htons(1234);
    inet_pton(AF_INET, "127.0.0.1", &dest.sin_addr);

    // Şifreyi şifresiz UDP paketiyle gönder
    sendto(sock, password, strlen(password), 0,
           (struct sockaddr*)&dest, sizeof(dest));
    close(sock);
    return 0;
}
```

`ltrace` ile çalıştırdığında:

```
socket(AF_INET, SOCK_DGRAM, 0)           = 3
sendto(3, "tioywopk\n", 9, 0, ...)      = 9
```

Şifre doğrudan `sendto` argümanında görünüyor — paket içeriği bile analiz etmene gerek kalmadı.

### `nc -lu` ne anlama gelir?

```bash
nc -lu 1234
# nc    → netcat: ağ bağlantıları için İsviçre çakısı
# -l    → listen mode: gelen bağlantıları dinle
# -u    → UDP modu (varsayılan TCP'dir)
# 1234  → hangi portu dinleyeceği
```

Binary'nin göndereceği porta önceden netcat yerleştirirsin:

```bash
# Terminal 1: dinle
nc -lu 1234

# Terminal 2: binary'yi çalıştır
/behemoth/behemoth5
```

Binary paketi gönderdi, netcat ekrana yazdı.

### `tcpdump` ile gerçek paket yakalama

```bash
# Loopback (lo) arayüzündeki UDP trafiğini yakala, içeriği ASCII göster
tcpdump -i lo -A udp port 1234

# Çıktı:
# 14:32:11.123456 IP localhost.45678 > localhost.1234: UDP, length 9
# E..%..@.@..............d......tioywopk.
#                                 ^^^^^^^^ şifre burada
```

`-A` flag'i paketin içeriğini ASCII olarak gösterir — şifreli olmayan her şey okunabilir hale gelir.

### Loopback arayüzü (`lo`) nedir?

`localhost` veya `127.0.0.1` adresi, bilgisayarın kendisini temsil eder. Bu adrese gönderilen paketler ağa çıkmaz — işletim sistemi içinde döner. Ama bu "güvenli" olduğu anlamına gelmez: aynı makinede çalışan herhangi bir süreç bu trafiği dinleyebilir.

```bash
# Ağ arayüzlerini listele
ip link show
# lo: loopback
# eth0: fiziksel/sanal ağ kartı
```

---

## 🛠️ 3. Defansif Bakış Açısı (Nasıl Düzeltilir?)

### Şifreleme: TLS/SSL

Gerçek uygulamalarda ağ üzerinden hassas veri gönderilirken şifreleme zorunludur:

```c
// Kötü: düz UDP/TCP — sniffing ile okunabilir
sendto(sock, password, len, 0, &dest, sizeof(dest));

// İyi: TLS ile şifreli kanal (OpenSSL örneği)
SSL_CTX *ctx = SSL_CTX_new(TLS_client_method());
SSL *ssl = SSL_new(ctx);
SSL_set_fd(ssl, sock);
SSL_connect(ssl);
SSL_write(ssl, password, len);  // şifreli gönderim
```

Şifreli kanalda tcpdump çalıştırdığında:

```
# TLS ile şifrelenmiş veri — okunamaz
.......x......j.....Q..kL.0..E..e..R^o...2.....
```

### Hassas veriyi ağdan geçirme

Şifre gibi kritik veriler ağ üzerinden iletilmek zorundaysa:

- **Asla plaintext UDP kullanma** — en hafif protokol olsa da güvenlik sıfır
- **TLS kullan** — minimum TLS 1.2, tercihen TLS 1.3
- **Kimlik doğrulama ekle** — kim gönderdi, veri değiştirildi mi?
- **Mümkünse hiç gönderme** — şifreyi ağa çıkarmak yerine hash'ini karşılaştır

### `localhost` bile güvenli değildir

Pek çok geliştirici "zaten localhost'a gönderiyorum, güvenli" diye düşünür. Yanlış:

```bash
# Aynı makinedeki herhangi bir kullanıcı bunu çalıştırabilir
sudo tcpdump -i lo -A
# Veya doğru yetkiyle herhangi bir port dinleyebilir
nc -lu 1234
```

Shared server ortamlarında (OverTheWire sunucuları gibi) aynı makinede onlarca kullanıcı olabilir.

---

## 🚨 4. Yeni Başlayanların Düştüğü Tuzaklar

**TCP yerine UDP dinlemek.** `nc -l 1234` (TCP) ile `nc -lu 1234` (UDP) farklı şeyler. Binary UDP paketi gönderiyorsa TCP dinleyicisi hiçbir şey görmez. `ltrace` çıktısında `SOCK_DGRAM` (UDP) mu yoksa `SOCK_STREAM` (TCP) mi kullanıldığını kontrol et.

```bash
ltrace /behemoth/behemoth5 2>&1 | grep socket
# socket(AF_INET, SOCK_DGRAM, 0) → UDP
# socket(AF_INET, SOCK_STREAM, 0) → TCP
```

**Dinleyiciyi başlatmadan binary'yi çalıştırmak.** UDP'de el sıkışma yoktur — binary paketi gönderir ve devam eder. Dinleyici hazır değilse paket kaybolur. Her zaman önce `nc -lu <port>` çalıştır, sonra binary'i başlat.

**Port numarasını yanlış bulmak.** `ltrace` çıktısında `htons(1234)` gibi bir değer görürsün. `htons()` host byte order'ı network byte order'a çevirir — değer aynı port numarasıdır. Ama `tcpdump` veya `nc`'ye doğru portu verdiğinden emin ol.

```bash
# ltrace çıktısı:
htons(1234)                   = 0xd204   # hex gösterimi, port yine 1234
```

**`tcpdump` için root yetkisi gerekmesi.** Behemoth sunucusunda `tcpdump` root gerektirebilir. Bu durumda `nc -lu` yeterlidir — paketin ham byte'larını değil, içeriğini yakalamak için uygulama katmanında dinlemek yeterli.

### ⚙️ Teknik Detay: Netcat'in UDP Kapanma Davranışı ve Kalıcı Dinleme (Persistent Listening)

Ağ trafiğini koklarken (sniffing) en sık kullandığımız "İsvçre çakısı" araçlardan biri `nc` (netcat) aracıdır. Ancak netcat'in TCP ve UDP protokollerine yaklaşımında, yeni başlayanları çılgına çeviren çok temel bir davranış farkı vardır.

#### 🛑 Netcat'in UDP Huyunu Anlamak
Netcat ile bir TCP portunu dinlediğinizde (özellikle `-k` flag'i destekleniyorsa), bir bağlantı gelip kopsa bile netcat arkada dinlemeye devam edebilir. Ancak geleneksel netcat versiyonları ile UDP modunda dinleme yaparken (`nc -lu port`):

1. Netcat belirtilen portu açar ve bekler.
2. Hedef program (örneğin Behemoth5 binary'si) ağa **tek bir UDP paketi** fırlatır.
3. Netcat bu paketi yakalar, içeriğini ekrana basar.
4. **Ve görevinin bittiğini düşünerek kendini tamamen kapatır!**

UDP "bağlantısız" (connectionless) bir protokol olduğu için, netcat gelen paketin devamı olup olmadığını veya bağlantının sürüp sürmediğini bilemez. İlk veriyi aldığı an süreci sonlandırır.

#### 💥 Yaşanan Problem Ne?
Eğer hedef binary ağa birden fazla paket gönderiyorsa, siz ilk denemede paketi kaçırdıysanız veya exploit scriptinizi test ederken binary'yi arka arkaya defalarca tetiklemeniz gerekiyorsa, netcat'in her paket sonrası kapanması süreci tam bir işkenceye dönüştürür. Siz daha terminale geçip komutu yeniden yazamadan diğer paketler uçup gider.

#### 🛠️ Çözüm: Sonsuz Bash Döngüsü ile Kalıcı Dinleme
Netcat'in UDP modunda sürekli açık kalmasını sağlamanın en pratik ve hacker-usulü çözümü, onu mini bir `while` döngüsüne sarmalamaktır. Bu sayede netcat paket aldıktan sonra kapansa bile, saliseler içinde otomatik olarak yeniden açılır:

```bash
# Netcat kapansa bile döngü sayesinde anında tekrar ayağa kalkar 
# ve siz durdurana kadar portu dinlemeyi bırakmaz:
while true; do nc -lu 4321; done
```
Eğer gelen paketlerin hangi IP/Port kaynaklı olduğunu ve tam olarak ne zaman geldiğini de görmek istersen, döngüyü biraz daha görselleştirebilirsin:
```bash
while true; do 
    echo "--- [Bekleniyor...] ---"
    nc -lu 4321
done
```

Bu ufak döngü hilesi, CTF'lerde tersine shell (reverse shell) beklerken veya stabil olmayan UDP servislerini manipüle ederken trafiği asla kaçırmamanı garantiler.

---

## Özet

```
Binary                    Ağ                    Saldırgan
  │                        │                        │
  │─── UDP plaintext ──────►│◄─────── nc -lu ────────│
  │    "tioywopk\n"         │         veya            │
  │                         │       tcpdump -A        │
  │                         │                         │
  └─── Şifresiz gönderim ───┘──────── Sniffing ───────┘

Savunma:
  UDP plaintext  →  TLS 1.3 üzerinden TCP
  localhost bile →  şifrelenmiş kanal kullan
  Hassas veri    →  ağa hiç çıkarma, hash karşılaştır
```

---

## Kaynaklar

- `man nc` veya `man netcat` — özellikle `-u`, `-l` parametreleri
- `man tcpdump` — filtre sözdizimi ve flag'ler
- [Wireshark kullanım kılavuzu](https://www.wireshark.org/docs/)
- [RFC 768 — UDP protokolü](https://www.rfc-editor.org/rfc/rfc768)
- [OWASP Transport Layer Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html)
