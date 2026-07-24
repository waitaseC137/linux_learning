# OverTheWire — Vortex Level 0 → 1

> Goal: `vortex1` password via the `vortex0` network task. Result: **`**********`** (hidden)
> Technique: Read 4×uint32 from a TCP socket (**host byte order = little-endian**), sum them, send it back.
> Environment: 32-bit x86 (little-endian). Entry is **not** SSH — the game starts with the **port 5842** network service.

---

## 1. Connection
There is no SSH on vortex0; the game starts with a network task. A plain `nc` won't do (binary arithmetic is required), but to see the service:
```bash
nc vortex.labs.overthewire.org 5842   # sends 16 bytes (4×uint32), expects a 4-byte result
```
All subsequent levels: `ssh vortex1@vortex.labs.overthewire.org -p 2228`

## 2. The Task
Official: *"connect to port 5842, read 4 unsigned ints in **host byte order**, sum them, send it back → vortex1 credentials."*
Critical nuance: **host byte order** = the machine's native order. The server is 32-bit x86 → **little-endian** (**not** network/big-endian). The sum wraps to 32 bits (mod 2³²), and the result is sent as 4 raw bytes.

## 3. Recon — look at the raw bytes first
Before writing blind code, without sending anything, read the 16 bytes and see both interpretations:
```python
import socket, struct
s = socket.create_connection(("vortex.labs.overthewire.org", 5842)); s.settimeout(10)
d = b""
while len(d) < 16: d += s.recv(16 - len(d))     # recv may return less → fill up to 16
print("hex:", d.hex(" "))
print("little <4I:", struct.unpack("<4I", d))
print("big     >4I:", struct.unpack(">4I", d))
```
```
hex: 9a 08 52 24 53 68 5f 19 9c a8 51 6a 4a 1d fc 42
little <4I: (609355930, 425683027, 1783736476, 1123818826)  total=3942594259
big     >4I: (2584236580, 1399349017, 2628276586, 1243479106) total=3560373993
```
Observation: exactly **16 bytes**; the two interpretations give **different sums** → byte order is vital. Also, every connection brings **new numbers** → read+sum+send must happen **in a single connection**.

## 4. The Trap — trying big-endian (came up in the live solve)
The first reflex is "network = network byte order (big-endian)". Tried:
```
$ python3 solve.py ">"
sent: bd 2f b4 9d
--- server ---  bzzzt, wrong
```
> ⚠️ **byte-order trap:** In network programming, the network byte order (big-endian) habit is **wrong** here. The spec clearly says *"host byte order"*; x86 = little-endian. The diagnosis = seeing the error message and **re-reading the spec**, not random trial-and-error. The fix: `>` → `<`.

## 5. Exploit (little-endian = host byte order)
```python
import socket, struct
s = socket.create_connection(("vortex.labs.overthewire.org", 5842)); s.settimeout(10)
d = b""
while len(d) < 16: d += s.recv(16 - len(d))
total = sum(struct.unpack("<4I", d)) & 0xFFFFFFFF   # <4I = little-endian; & mask = mod 2^32
s.send(struct.pack("<I", total))                    # 4 raw bytes (not text)
print(s.recv(4096).decode())
```
```
$ python3 solve.py
sent: 7d d1 7d 32
--- server ---  Username: vortex1  Password: **********   ← [password hidden]
```
Log in with the credentials: `ssh vortex1@vortex.labs.overthewire.org -p 2228` → confirm 32-bit x86 with `uname -m`.

## Lessons
| Topic | Note |
|------|------|
| host vs network byte order | "host" = the machine's order (x86 → little-endian); "network" = big-endian. `htonl`/`ntohl` convert between these two — **not used** here |
| Little-endian | the on-the-wire form of `0x12345678 → 78 56 34 12` from lesson `08.5`; in `struct` `<`=little, `>`/`!`=big |
| 32-bit overflow | the sum of 4 numbers exceeds 32 bits → wrap it with `& 0xFFFFFFFF` (mod 2³²) |
| `recv` may return partial data | guarantee all 16 bytes with a `while len<16` loop |
| Single connection | each connection means new numbers → read+sum+send on the same socket |
| Methodology | observe first (raw bytes), read the error message seriously, don't try a new fix before finding the root cause |
