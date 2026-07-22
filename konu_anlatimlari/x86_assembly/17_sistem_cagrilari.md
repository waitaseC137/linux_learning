# 🖥️ x86 Assembly — Sistem Çağrıları: Ekrana "Merhaba Dünya"

> Onca derstir programlarımız hep aynı sessizlikte çalıştı: bir hesap yaptılar, sonucu **çıkış koduna** koydular, biz de `echo $?` ile gizlice okuduk. Ekrana tek bir harf bile basmadık. Bugün o sessizliği bozuyoruz.
> Ve yol boyunca her programın sonuna kopyaladığımız o iki gizemli satır — `mov eax, 1` / `int 0x80` — nihayet açıklanacak. 06'dan beri "şimdilik böyle yaz, sonra anlatacağım" dediğim borcu bu derste ödüyorum.

> **Bu derste kod var ve hepsini çalıştırıyoruz.** Aşağıdaki her program, her çıktı ve her GDB satırı gerçek: kendi makinemde derleyip koşturdum.

---

## 📋 İçindekiler

- [Program Ekrana Neden Doğrudan Yazamaz?](#program-ekrana-neden-do%C4%9Frudan-yazamaz)
- [Sistem Çağrısı ve `int 0x80`](#sistem-%C3%A7a%C4%9Fr%C4%B1s%C4%B1-ve-int-0x80)
- [İlk Gerçek Çıktı: Merhaba Dünya](#i%CC%87lk-ger%C3%A7ek-%C3%A7%C4%B1kt%C4%B1-merhaba-d%C3%BCnya)
- [Eski Borç: `mov eax, 1` Neydi?](#eski-bor%C3%A7-mov-eax-1-neydi)

---

## Program Ekrana Neden Doğrudan Yazamaz?

Sezgin şöyle diyebilir: "ekrana yazmak için ekranın belleğine bir şeyler yazarım, olur biter." Ama modern bir bilgisayarda **yapamazsın** — ve bu bir eksiklik değil, kasıtlı bir güvenlik duvarı.

Düşün: aynı anda onlarca program çalışıyor (tarayıcı, müzik, terminal...). Her biri ekrana, diske, ağ kartına canı istediği gibi dokunabilseydi tam bir kaos olurdu — biri diğerinin penceresine yazar, birinin dosyasını ezer. Bu yüzden donanıma (ekran, disk, klavye) doğrudan erişim **yalnızca işletim sistemine** (OS — Linux çekirdeği) aittir. Senin programın "kullanıcı" tarafında, kilitli bir odada çalışır.

Peki ekrana nasıl yazacaksın? **OS'tan rica ederek.** "Ben ekrana şunu yazamam ama sen yazabilirsin — şu yazıyı benim için basar mısın?" dersin. İşte bu ricanın adı **sistem çağrısı**dır.

> 🔑 Program donanıma (ekran/disk/klavye) **doğrudan** dokunamaz — bu yetki yalnız işletim sistemindedir (güvenlik + düzen için). Programın tek yolu OS'a **rica** etmektir. Bu ricaya **sistem çağrısı** (syscall) denir.

---

## Sistem Çağrısı ve `int 0x80`

Bir sistem çağrısı, OS'a "şu işi yap" demektir — ama OS yüzlerce iş yapabilir (yaz, oku, dosya aç, çık...). Hangisini istediğini bir **numara** ile söylersin. 32-bit Linux'ta birkaç temel numara:

| Numara | İsim | Ne yapar |
|:---:|---|---|
| 1 | `sys_exit` | programı bitir |
| 3 | `sys_read` | girdi oku (örn. klavyeden) |
| 4 | `sys_write` | bir yere yaz (örn. ekrana) |

Ricayı OS'a iletme şekli — **32-bit Linux'ta** — `int 0x80` komutudur. `int 0x80` "OS'un kapısını çal" demektir; işçi durur, kontrol OS'a geçer, OS ricayı görür ve yapar. Ama OS "hangi iş, hangi ayrıntılarla?" diye sorar; cevabı **register'lara** önceden koyarsın. Kural:

- **`eax`** = sistem çağrısı numarası (hangi iş).
- **`ebx`, `ecx`, `edx`** = o işin argümanları (sırayla).

Tanıdık geldi mi? Bu, 16'daki calling convention'ın ta kendisi — sadece bu sefer çağırdığın "fonksiyon" işletim sistemi, ve argümanları stack yerine register'lara koyuyorsun. Aynı fikir: "veriyi kararlaştırılmış yerlere koy, sonra çağır."

> 🔑 Sistem çağrısı = OS'tan bir iş rica etmek. **`eax`** = iş numarası (1 çık, 3 oku, 4 yaz), **`ebx`/`ecx`/`edx`** = argümanlar, sonra **`int 0x80`** = "kapıyı çal, OS devral." (32-bit Linux'un yolu budur.)

---

## İlk Gerçek Çıktı: Merhaba Dünya

Ekrana yazmak için `sys_write` (4 numara). Onun argümanları şunlar:

- `ebx` = **nereye** yazılacak — buna *dosya tanıtıcısı* (file descriptor) denir; **`1` = ekran** (stdout).
- `ecx` = **neyin** yazılacağı — yazının **bellekteki adresi** (08'den: bir etiketin adresi).
- `edx` = **kaç byte** yazılacağı — yazının uzunluğu.

Yani "1 numaralı yere (ekran), şu adresteki yazıyı, şu kadar byte yaz." Yazıyı da 08'deki gibi `section .data`'da bir etikete koyarız. `merhaba.asm`:

```nasm
section .data
    mesaj:   db "Merhaba Dünya", 10    ; 10 = satır sonu (yeni satır, '\n')
    uzunluk equ $ - mesaj               ; şu anki adres - mesaj adresi = byte sayısı

section .text
    global _start
_start:
    mov eax, 4          ; sys_write
    mov ebx, 1          ; nereye: 1 = ekran (stdout)
    mov ecx, mesaj      ; neyi: yazının adresi
    mov edx, uzunluk    ; kaç byte
    int 0x80            ; OS'a rica et: yaz!

    mov eax, 1          ; sys_exit
    mov ebx, 0          ; çıkış kodu 0
    int 0x80
```

İki yeni küçük şey var. `db "...", 10`: `db` (08'deki `dd`'nin byte kardeşi) yazıyı byte byte belleğe koyar; sondaki `10` satır sonu karakteridir (imleç alt satıra insin diye). `uzunluk equ $ - mesaj`: `$` "şu anki adres" demektir; ondan `mesaj`'ın adresini çıkarınca aradaki **byte sayısı** çıkar — uzunluğu elle saymak zorunda kalmazsın. Çevir, çalıştır:

```
nasm -f elf32 merhaba.asm -o merhaba.o
ld -m elf_i386 merhaba.o -o merhaba
./merhaba
```

```
Merhaba Dünya
```

**İşte o an.** Onca hesap, karar, döngü, fonksiyondan sonra — program ilk kez sana **doğrudan** bir şey söyledi. Çıkış koduna gizlenmiş bir sayı değil; ekranda, gözünle, bir yazı.

`int 0x80`'den hemen önce register'ların gerçekten kurulduğunu GDB'de görelim:

```
(gdb) starti
(gdb) si   (×4 — dört mov'u geç)
(gdb) print $eax        →  4       (sys_write)
(gdb) print $ebx        →  1       (ekran)
(gdb) print $edx        →  15      (byte sayısı)
(gdb) x/s $ecx          →  0x804a000:  "Merhaba Dünya\n"
(gdb) x/i $eip          →  int 0x80
```

Dört register da tam yerinde: iş numarası 4, hedef 1, uzunluk 15 (ü harfi UTF-8'de 2 byte tuttuğu için 14 değil 15 — ama `equ` bunu senin için saydı), ve `ecx` tam da yazımızı gösteriyor. `int 0x80` ateşlenince OS bunları okuyup ekrana bastı.

> 🔑 Ekrana yazmak = `sys_write` (eax=4): `ebx`=1 (ekran), `ecx`=yazının adresi, `edx`=byte sayısı, sonra `int 0x80`. Yazıyı `db "...", 10` ile koyarsın (10=satır sonu), uzunluğu `equ $ - etiket` senin için sayar.

> 💡 **Aklınıza takılabilir:** *"`sys_read` (3) da tabloda — girdi de okuyabilir miyiz?"* Evet, aynı mantıkla: `sys_read` klavyeden bir yazı alıp belleğe koyar (ebx=0 = klavye/stdin, ecx=nereye, edx=en fazla kaç byte). Ekrana yazmayı öğrendin; **okumayı** ve ikisini birleştirip *"senden bir şey isteyen, cevabına göre karşılık veren"* gerçek etkileşimli programı bir sonraki derste (18) kuracağız.

---

## Eski Borç: `mov eax, 1` Neydi?

Şimdi geri dön ve programın **son iki satırına** bak:

```nasm
    mov eax, 1          ; sys_exit
    mov ebx, 0          ; çıkış kodu
    int 0x80
```

Tanıdın mı? Bu, 06'dan beri **her** programın sonuna kopyaladığın kalıp. Meğer o da bir sistem çağrısıymış — hep öyleydi, biz sadece açıklamayı bugüne ertelemiştik. Artık her parçasını okuyabiliyorsun:

- `mov eax, 1` → **`sys_exit`** (1 numaralı çağrı): "programı bitir."
- `mov ebx, 0` → çıkış çağrısının argümanı: **çıkış kodu.**
- `int 0x80` → OS'a rica et.

Ve işte bütün kursu birbirine bağlayan nokta: 06'da "sonucu `ebx`'e koy, `echo $?` onu göstersin" demiştik ya — **neden `ebx`?** Çünkü `sys_exit`'in çıkış-kodu argümanı `ebx`'te durur (yukarıdaki kural: ilk argüman `ebx`). `echo $?`'ın okuduğu o sayı, aslında senin `sys_exit`'e argüman olarak verdiğin `ebx`'ti. Baştan beri sistem çağrısı yapıyormuşsun — sadece adını bilmiyordun.

> 🔑 06'dan beri kullandığın `mov eax, 1` / `int 0x80` = **`sys_exit`** sistem çağrısı; `ebx` = çıkış kodu argümanı. `echo $?`'ın okuduğu sayı işte bu `ebx`'ti. "Sonucu neden ebx'e koyuyoruz?" sorusunun cevabı buydu — sistem çağrısı kuralı.

---

## Özet — Aklında Tut

```
☐ Program donanıma (ekran/disk/klavye) DOĞRUDAN dokunamaz; yalnız OS dokunur (güvenlik+düzen). Program OS'a RİCA eder.
☐ Bu rica = SİSTEM ÇAĞRISI. 32-bit Linux'ta:
    - eax = çağrı numarası (1=exit, 3=read, 4=write)
    - ebx, ecx, edx = argümanlar
    - int 0x80 = "kapıyı çal", kontrol OS'a geçer.  (16'daki calling convention'ın OS sürümü.)
☐ EKRANA YAZ = sys_write (eax=4): ebx=1(ekran), ecx=yazının adresi, edx=byte sayısı.
    - Yazı: db "Merhaba Dünya", 10   (10=satır sonu).  Uzunluk: equ $ - mesaj (otomatik sayar).
    - Doğrulanan: ekrana "Merhaba Dünya" basıldı; gdb: eax=4, ebx=1, edx=15, ecx→"Merhaba Dünya\n".
☐ BORÇ ÖDENDİ: mov eax,1 / int 0x80 = sys_exit; ebx = çıkış kodu. echo $?'ın okuduğu sayı = o ebx.
    "Sonucu neden ebx'e?" — çünkü sys_exit'in argümanı ebx. (06'dan beri farkında olmadan syscall yapıyorduk.)
☐ Sırada: sys_read (girdi) + hepsini birleştir → isim soran, selamlayan etkileşimli program (18).
```

---

## 🔗 İlgili Konular

- [06_ilk_gercek_program.md](./06_ilk_gercek_program.md) — `mov eax, 1` / `int 0x80` ve "sonucu ebx'e koy, `echo $?` oku" kalıbının ilk çıktığı yer; borç burada verildi, burada ödendi
- [16_calling_convention.md](./16_calling_convention.md) — "Argümanları kararlaştırılmış yerlere koy, sonra çağır" fikri; syscall bunun OS'a uygulanmış hâli (stack yerine register)
- [08_mov_ve_bellek.md](./08_mov_ve_bellek.md) — `section .data`, etiket ve adres; `ecx = mesaj` bir adres, `db` ise `dd`'nin byte hâli
- [01_bilgisayar_nedir.md](./01_bilgisayar_nedir.md) — "İşletim sistemi işçinin patronu"; donanıma neden sadece OS dokunur, resmin büyük hâli

---

**Önceki konu:** [16_calling_convention.md](./16_calling_convention.md)
**Sonraki konu:** [18_ilk_etkilesimli_program.md](./18_ilk_etkilesimli_program.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
