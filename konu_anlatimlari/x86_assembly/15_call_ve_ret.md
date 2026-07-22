# 📞 x86 Assembly — `call` ve `ret`: Fonksiyonlar

> 14'te işçiye bir not defteri (stack) verdik ve sonunda küçük bir söz bıraktık: *"stack'in gerçek hayatı fonksiyonlarla başlıyor; `push`/`pop`'u öğrendin ki 15'te fonksiyonlar sihir gibi değil, 'stack'e not bırakmak' gibi görünsün."*
> İşte o an. Bu derste aynı iş parçasını **bir kez yazıp defalarca** kullanmayı öğreneceğiz — programcılıkta buna **fonksiyon** denir. Ve göreceğiz ki fonksiyonların bütün sırrı, 14'te öğrendiğin o basit stack'te saklı.

> **Bu derste kod var ve hepsini çalıştırıyoruz.** Aşağıdaki her program, her çıkış kodu ve her GDB çıktısı gerçek: kendi makinemde derleyip koşturdum.

---

## 📋 İçindekiler

- [Tekrar Kullanılabilir Parça: Fonksiyon](#tekrar-kullan%C4%B1labilir-par%C3%A7a-fonksiyon)
- [`jmp`'in Eksiği: Peki Nereye Döneceğim?](#jmpin-eksi%C4%9Fi-peki-nereye-d%C3%B6nece%C4%9Fim)
- [`call` ve `ret`: Git ve Geri Dön](#call-ve-ret-git-ve-geri-d%C3%B6n)
- [Perde Arkası: `call` = `push` + `jmp`](#perde-arkas%C4%B1-call--push--jmp)

---

## Tekrar Kullanılabilir Parça: Fonksiyon

Diyelim bir işi programın **birçok yerinde** yapman gerekiyor — mesela "eldeki sayıya 5 ekle." Bu üç satırı her ihtiyaç duyduğun yere tekrar tekrar yazabilirsin, ama bu hem yorucu hem hataya açık. Daha iyisi: o parçayı **bir kez** yaz, bir isim ver, ve her gerektiğinde "şunu çalıştır" de.

İşte **fonksiyon** budur: bir isme sahip, tekrar kullanılabilir bir kod parçası. 11'de öğrendiğin **etiket**le (`ekle5:`) parçaya isim verir, sonra onu istediğin yerden çağırırsın. Ve güzelliği: aynı parçayı **birden çok kez** çağırabilirsin. Şu programda `ekle5`'i iki kez çağırıyoruz:

```nasm
_start:
    mov eax, 10
    call ekle5         ; 10 + 5 = 15
    call ekle5         ; 15 + 5 = 20  (aynı parçayı tekrar kullandık)
    ...
ekle5:
    add eax, 5
    ret
```

Bu program `20` verir (birazdan çalıştıracağız) — üç satırlık `ekle5` parçasını iki kez kullandık, hiç kopyalamadan. Ama "çağırmak" (`call`) tam olarak nasıl çalışıyor? Onu anlamak için önce, elimizdeki tek "git" komutunun (`jmp`) neden yetmediğini görelim.

> 🔑 **Fonksiyon** = isme sahip, tekrar kullanılabilir kod parçası. Bir kez yaz, çağırdıkça kullan. Etiketle (11) isim verilir, `call` ile çağrılır. Amaç: kopyala-yapıştırı önlemek.

---

## `jmp`'in Eksiği: Peki Nereye Döneceğim?

İlk içgüdün "`jmp ekle5` yaparım, iş biter" olabilir. Gidiş kısmı gerçekten öyle — ama bir sorun var: `ekle5` işini bitirince **nereye geri dönecek?**

Düşün: `ekle5`'i programın iki farklı yerinden çağırdık. `ekle5` bittiğinde bazen birinci çağrının altına, bazen ikinci çağrının altına dönmesi lazım. Ama `ekle5`'in kendisi hep aynı — içine "şuraya dön" diye sabit bir adres yazamayız, çünkü dönülecek yer **her çağrıda farklı.**

Demek ki eksik olan şey **hafıza**: "seni çağırmadan hemen önce neredeydim?" bilgisini bir yere **not etmek**, işçi dönerken de o notu **okumak** gerekiyor. Bir yere geçici bir değer bırakıp sonra geri almak... Bu tanıdık gelmeli — bu tam olarak 14'teki **stack**'in işi.

> 🔑 `jmp` fonksiyona **gider** ama "nereye döneceğini" hatırlamaz. Aynı fonksiyon farklı yerlerden çağrılınca dönüş noktası değişir; bu yüzden bir **dönüş adresi**ni bir yere not etmek şart. O "bir yer" = stack (14).

---

## `call` ve `ret`: Git ve Geri Dön

x86 bu iki işi (git + dönüşü hatırla / geri dön) iki komuta koymuş:

- `call etiket` → **dönüş adresini hatırla, sonra `etiket`'e git.**
- `ret` → **hatırlanan dönüş adresine geri dön.**

İkisi bir çift: `call` ile gider, `ret` ile dönersin. Fonksiyonun sonuna `ret` koyarsın; o, "beni kim çağırdıysa oraya geri dön" demektir. `fonksiyon.asm`:

```nasm
section .text
    global _start

_start:
    mov eax, 10
    call ekle5         ; ekle5'e git (ve dönüşü hatırla)
    mov ebx, eax       ; ← ekle5 buraya döner. sonuç (15) çıkışa
    mov eax, 1
    int 0x80

ekle5:
    add eax, 5         ; eax += 5
    ret                ; çağıran yere dön
```

Akışı izle: `eax = 10`, `call ekle5` → işçi `ekle5`'e gider, `add eax, 5` ile `eax = 15` yapar, `ret` der → `call`'un **hemen altındaki** satıra (`mov ebx, eax`) döner. Çalıştır:

```
nasm -f elf32 fonksiyon.asm -o fonksiyon.o
ld -m elf_i386 fonksiyon.o -o fonksiyon
./fonksiyon
echo $?
```

```
15
```

Şimdi baştaki iki-çağrılı sürümü (`fonksiyon2.asm`, `call ekle5` iki kez) çalıştır:

```
20
```

**İşte tekrar kullanılabilir parça.** `ekle5`'i bir kez yazdın; bir kez çağırınca 15, iki kez çağırınca 20. Her `call` gitti, işi yaptırdı, `ret` doğru yere geri döndürdü. Peki `call`/`ret` bu "geri dönüş" numarasını nasıl yapıyor? Perdeyi aralayalım — ve 14'ün neden bu dersten hemen önce geldiğini göreceksin.

> 🔑 `call etiket` = dönüş adresini hatırla + etikete git. `ret` = hatırlanan adrese geri dön. Fonksiyonun sonuna `ret` koyarsın. `call`/`ret` bir çifttir: biri gidiş, biri dönüş.

---

## Perde Arkası: `call` = `push` + `jmp`

İşte sır, ve hiç de sihir değil. `call ekle5` aslında iki şey yapar:

1. **`push`** — bir sonraki komutun adresini (dönüş adresi) stack'e iter.
2. **`jmp ekle5`** — fonksiyona atlar.

Ve `ret` de tek şey yapar: stack'in tepesindeki adresi **`pop`**'layıp oraya atlar. Yani "dönüş adresi", 14'teki stack'e bırakılmış bir nottan başka bir şey değil! Bunu GDB'de gözümüzle görelim.

Önce disassembly'den adresleri bilelim — `call`'dan **sonraki** komut `mov ebx, eax`, adresi `0x804900a`:

```
 8049005:  call   8049013 <ekle5>
 804900a:  mov    ebx,eax          ← call'dan sonraki komut = dönüş adresi
 ...
 8049013 <ekle5>:  add eax,0x5
 8049016:          ret
```

Şimdi `call`'ın öncesi ve sonrasında `esp` ile stack tepesine bakalım:

```
call ÖNCESİ  esp = 0xffffc570    (sıradaki komut = dönüş adresi olacak: 0x804900a  mov ebx,eax)
call SONRASI esp = 0xffffc56c    stack tepesi [esp] = 0x0804900a    eip şimdi: 0x8049013 <ekle5>
```

Üç şeyi birden yakala:

1. **`esp` 4 azaldı** (`c570 → c56c`) — yani `call` bir **`push`** yaptı (14: push = esp−4).
2. **Stack tepesine `0x0804900a` yazıldı** — tam da `call`'dan sonraki komutun (`mov ebx, eax`) adresi. İşte **dönüş adresi**, deftere not edildi.
3. **`eip` `0x8049013`'e** (`ekle5`) atladı — fonksiyona gidildi.

`call` = "dönüş adresini stack'e not et, sonra fonksiyona zıpla." Fonksiyon işini bitirip `ret` deyince, o not (`0x804900a`) stack'ten `pop`'lanır ve işçi tam oraya döner. Farklı yerlerden çağırırsan her seferinde farklı bir dönüş adresi not edilir — `jmp`'in çözemediği sorun, bir `push`/`pop` ile çözülür.

> 🔑 `call` = **`push` (dönüş adresi) + `jmp` (fonksiyona)**; `ret` = **`pop` (dönüş adresi) + oraya git.** Dönüş adresi, stack'e bırakılan bir nottur (14!). Fonksiyonlar sihir değil; sadece "nereye döneceğini stack'e yazan" zıplamalardır. Bu yüzden 14, 15'ten hemen önce geldi.

> ⚠️ Küçük ama kritik: fonksiyonun içinde `push` yapıp dengeleyecek `pop`'u unutursan, `ret` dönüş adresi yerine **senin bıraktığın değeri** stack tepesinde bulur ve oraya "döner" — program çöker ya da saçmalar. Fonksiyon içinde stack'i nasıl **dengede** tutacağımız (ve fonksiyona nasıl veri geçireceğimiz) tam olarak 16. dersin konusu.

---

## Özet — Aklında Tut

```
☐ FONKSİYON = isme sahip, tekrar kullanılabilir kod parçası (etiketle isim, call ile çağrı). Kopyala-yapıştırı önler.
☐ jmp neden yetmez: gider ama "nereye döneceğini" hatırlamaz. Farklı çağrı yerleri → farklı dönüş noktası.
☐ call etiket = dönüş adresini HATIRLA + etikete git.   ret = hatırlanan adrese GERİ DÖN. (Bir çift; fonksiyon sonu = ret.)
☐ PERDE ARKASI (sihir yok):
    - call = push (dönüş adresi = call'dan sonraki komutun adresi) + jmp (fonksiyona).
    - ret  = pop (dönüş adresi) + oraya git.
    - Dönüş adresi = 14'teki stack'e bırakılmış bir not.
    - gdb kanıtı: call'da esp c570→c56c (-4 = push), [esp]=0x804900a (call sonrası komut), eip→ekle5.
☐ Doğrulanan: tek call 10+5=15 ; iki call 10+5+5=20 (aynı parça tekrar).
☐ DİKKAT: fonksiyon içinde push/pop dengesizse ret yanlış yere döner → çöker. Denge + veri geçişi = 16. ders.
```

---

## 🔗 İlgili Konular

- [14_stack.md](./14_stack.md) — `call`/`ret`'in üstüne kurulduğu temel; dönüş adresi stack'e `push`'lanan bir nottur. Bu ders 14 olmadan olmazdı
- [11_ziplamalar.md](./11_ziplamalar.md) — `call` özünde bir `jmp`'tir (+ dönüş adresi); etiketler de buradan
- [09_aritmetik.md](./09_aritmetik.md) — `ekle5`'in içindeki `add`; fonksiyonlar tanıdık komutları paketler
- [04.5_registerin_ici.md](./04.5_registerin_ici.md) — `eip` ("neredeyim"); `call`/`ret` aslında `eip`'i stack üzerinden yönetmektir

---

**Önceki konu:** [14_stack.md](./14_stack.md)
**Sonraki konu:** [16_calling_convention.md](./16_calling_convention.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
