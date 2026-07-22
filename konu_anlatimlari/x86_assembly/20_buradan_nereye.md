# 🧭 x86 Assembly — Buradan Nereye?

> Başardın. 00'da "bilgisayar bir kutu" idi; şimdi o kutunun içine bakabiliyor, ona en alt dilinde emir verebiliyorsun. Bu son ders yeni bir komut öğretmeyecek — bunun yerine **nereden geldiğine** bir bakacak, sonra **nereye gidebileceğinin** haritasını çıkaracak.
> Çünkü bu kurs bir *bitiş* değil, bir *temeldir.* Öğrendiğin şey (makinenin gerçekte nasıl çalıştığı), üstüne çok şey inşa edebileceğin bir zemin. Şimdi o zeminin üstüne hangi binaların kurulabileceğine bakalım.

> **Bu derste bir tek kod var** (64-bit'e bir tadımlık), o da gerçek: kendi makinemde derleyip çalıştırdım. Gerisi yol haritası.

---

## 📋 İçindekiler

- [Ne Öğrendin? Kısa Bir Geri Bakış](#ne-%C3%B6%C4%9Frendin-k%C4%B1sa-bir-geri-bak%C4%B1%C5%9F)
- [Sonraki Durak: 64-bit'e Geçiş](#sonraki-durak-64-bite-ge%C3%A7i%C5%9F)
- [Tersine Mühendislik: Başkasının Kodunu Okumak](#tersine-m%C3%BChendislik-ba%C5%9Fkas%C4%B1n%C4%B1n-kodunu-okumak)
- [Binary Exploitation: Akışı Bükmek](#binary-exploitation-ak%C4%B1%C5%9F%C4%B1-b%C3%BCkmek)
- [Kaynaklar ve Son Söz](#kaynaklar-ve-son-s%C3%B6z)

---

## Ne Öğrendin? Kısa Bir Geri Bakış

Bir dakika durup kat ettiğin yola bak. Bu kursa başlarken "register" kelimesi bile yabancıydı; şimdi elinde şunlar var:

- **Makine modeli** (Ünite 0): bellek = numaralı kutular, register = işçinin elleri, ikilik/onaltılık, işçinin hiç akıl yürütmeden nasıl çalıştığı.
- **İlk komutlar** (Ünite 1): `mov`, bellek & pointer (`[...]`), little-endian, aritmetik (`add`/`sub`, two's complement), ve GDB'de her komutu **canlı izlemek.**
- **Akış** (Ünite 2): bayraklar & `cmp`, zıplamalar (`jmp`/`jz`/`jl`), döngüler, bit işlemleri — yani **karar** ve **tekrar.**
- **Parçalar & OS** (Ünite 3): stack, `call`/`ret`, calling convention, sistem çağrıları — ve sonunda sana **soru sorup cevaplayan** gerçek bir program.
- **Köprü** (Ünite 4): bir C programının assembly'sini **okuyabilmek.**

Yani artık soyut değil, **somut** olarak biliyorsun: bir bilgisayar "çalışırken" gerçekte ne yapıyor. Bu, çoğu programcının bile net göremediği bir zemin. Buradan çıkan üç ana yol var.

> 🔑 Bu kurs bir temeldir, bitiş değil. Makine modeli + komutlar + akış + OS arayüzü + derlenmiş kodu okuma — hepsi elinde. Üç ileri yol: **64-bit derinleşme**, **tersine mühendislik**, **binary exploitation.** Üçü de burada durduğun zeminin üstünde yükselir.

---

## Sonraki Durak: 64-bit'e Geçiş

Bu kurs boyunca **32-bit** öğrendik — çünkü daha basit ve kavramları daha temiz gösteriyor. Ama bugünkü makinelerin çoğu **64-bit** çalışır. İyi haber: fikirler **birebir aynı**; sadece birkaç isim ve detay değişir. Aynı "Merhaba"yı 64-bit yazalım (`merhaba64.asm`):

```nasm
section .text
    global _start
_start:
    mov rax, 1          ; sys_write   (64-bit'te 1 — 32-bit'te 4 idi)
    mov rdi, 1          ; ekran       (ebx yerine rdi)
    mov rsi, mesaj      ; adres       (ecx yerine rsi)
    mov rdx, uzunluk    ; uzunluk
    syscall             ; int 0x80 DEĞİL → syscall

    mov rax, 60         ; sys_exit    (64-bit'te 60 — 32-bit'te 1 idi)
    mov rdi, 0
    syscall
```

`nasm -f elf64 ... && ld ...` ile derle, çalıştır → ekrana `Merhaba (64-bit dunya)` basar. Değişenler, tanıdığın şeylerin büyümüş hâli:

| | 32-bit (öğrendiğin) | 64-bit |
|---|---|---|
| Register'lar | `eax`, `ebx`... (32 bit) | `rax`, `rbx`... (64 bit) + 8 yeni: `r8`–`r15` |
| Sistem çağrısı | `int 0x80` | `syscall` |
| Çağrı numaraları | write=4, exit=1 | write=1, exit=60 |
| Syscall argümanları | `ebx, ecx, edx` | `rdi, rsi, rdx`... |

Gördüğün gibi **kavram** hiç değişmedi — "register'a değer koy, numarayı `rax`'e yaz, çağır." Sadece isimler ve birkaç sayı farklı. 32-bit'i anladıysan, 64-bit'e geçiş bir öğleden sonralık iş.

> 🔑 64-bit, öğrendiğinin **büyümüş hâli:** `e__` register'lar `r__` olur (+ `r8`–`r15`), `int 0x80` yerine `syscall`, çağrı numaraları değişir. Kavramlar (register, stack, çağrı sözleşmesi, syscall) aynı. 32-bit sağlam temelse, 64-bit sadece yeni bir lehçe.

---

## Tersine Mühendislik: Başkasının Kodunu Okumak

19'da büyük kapıyı araladık: bir C programının assembly'sini okuyabildin. **Tersine mühendislik** (reverse engineering) tam da bunun büyütülmüş hâli — ama bu sefer elinde kaynak kod (C) **olmadan**, sadece derlenmiş programa (binary'ye) bakarak "bu ne yapıyor?" sorusunu cevaplamak.

Neden yapılır? Kaynağı olmayan bir programın nasıl çalıştığını anlamak için: bir virüsü çözümlemek, bir güvenlik açığını bulmak, kapalı bir formatı anlamak, ya da sırf merakla "bu nasıl yapmış?" demek. Ve senin yeni kazandığın göz — `push ebp`'yi, `[ebp+8]`'i, `call`'u tanıyan göz — bu işin **tam da temeli.**

Bunu kolaylaştıran araçlarla zaten tanıştın ya da tanışacaksın:

- **`objdump -d`** — bir binary'nin assembly'sini döker (bu kursta `objdump`'ı kullandık).
- **GDB** — çalışırken adım adım izlemek (kursun en güçlü aracı; RE'de de öyle).
- **Ghidra / radare2 / Cutter** — koca programları çözümlemek için profesyonel araçlar; assembly'yi okunur "sözde-C"ye bile çevirirler. Ama o sözde-C'nin doğru olup olmadığını ancak **assembly'yi okuyabilen** biri anlar — yani sen.

> 🔑 **Tersine mühendislik** = kaynak kodu olmadan, derlenmiş binary'ye bakıp "ne yapıyor" demek. 19'da yaptığının (asm okuma) kaynaksız hâli. Araçlar (`objdump`, GDB, Ghidra) işi hızlandırır ama çekirdek beceri, bu kursta kazandığın **assembly okuma** gözüdür.

---

## Binary Exploitation: Akışı Bükmek

Üçüncü yol en heyecanlısı. Tersine mühendislik "program ne yapıyor?" diye sorar; **binary exploitation** ise bir adım öteye geçer: *"programı, yazanın **hiç istemediği** bir şeyi yapmaya nasıl zorlarım?"*

Ve işte kursun sana verdiği en güzel hediye burada ödüllenir: **14'te öğrendiğin stack, exploitation'ın kalbidir.** Hatırla — `call` yapınca **dönüş adresi** stack'e yazılıyordu (15). Ya bir program, kullanıcıdan aldığı veriyi stack'te kontrolsüzce saklarsa ve o veri taşıp **dönüş adresinin üstüne** yazarsa? O zaman `ret`, artık programın gitmesi gereken yere değil, **senin** koyduğun adrese döner — akışı bükmüş olursun. Buna *buffer overflow* denir ve bütün bir güvenlik dünyasının kapısıdır.

Bunu anlamak için ihtiyacın olan her şeyi (stack, `call`/`ret`, dönüş adresi, bellek) bu kursta topladın. Ve şanslısın: bu reponun içinde tam da buraya devam eden seriler var —

- **[Binary Exploitation serisi](../binary_exploitation/00_buradan_basla.md)** — bu kursun doğrudan devamı; stack'i *bükmeye* başla.
- **OverTheWire** wargame'leri (özellikle **Narnia**, **Behemoth**) — elini kirletip gerçek zafiyetleri sömürerek öğren.

> 🔑 **Binary exploitation** = programı, yazanın istemediği davranışa zorlamak. Klasik örnek *buffer overflow*: taşan veri, stack'teki **dönüş adresini** ezer, `ret` senin istediğin yere döner (14+15!). Bu kursun stack'i, exploitation'ın tam kalbidir — devamı reponun binary_exploitation serisinde ve OverTheWire'da.

---

## Kaynaklar ve Son Söz

Nereye gidersen git, birkaç sağlam pusula:

- **Bu repo** — [x86_assembly](./00_buradan_basla.md) (bitirdiğin bu seri), [binary_exploitation](../binary_exploitation/00_buradan_basla.md), ve OverTheWire çözümleri. Aynı "en alttan yukarı" ruhla devam eder.
- **GDB'yi bırakma.** Bu kursta öğrendiğin en güçlü şey bir komut değil, bir **alışkanlık**tı: "anlamadıysan, adım adım izle, gözünle gör." 64-bit'te de, RE'de de, exploitation'da da en iyi öğretmenin bu.
- **Kendi merakını takip et.** Bir programın nasıl çalıştığını merak ettiysen, `objdump -d` ile içine bak. Artık o çıktı sana yabancı gelmeyecek. Bir uyarı değil, bir cesaret: gerçek bir binary — özellikle optimize edilmiş, PIE ve sembolsüz olanı — bu kursun tertemiz `-O0` örneklerinden daha dağınık görünür; PLT/GOT sıçramaları, isimsiz kod parçaları... Panik yok, tuğlalar hâlâ tanıdık — sadece daha çok ve daha kurnaz dizilmiş. 19'da gördüğün `-O1` kurnazlığını büyüt, hepsi o kadar.

Ve son söz. Bu kursun baştaki sözü şuydu: *araya sihir, gizli iş, görünmeyen kurallar girmez.* Umarım tuttu. Bir bilgisayarın yaptığı hiçbir şey büyü değil — sadece, çok basit işlemlerin akıl almaz bir hızla, tam da senin artık okuyabildiğin komutlarla üst üste binmesi. O kutu artık kapalı değil.

Buradan sonrası senin merakına kalmış. İyi yolculuklar. 🚀

> 🔑 Bu kurs temeldi; üç yol (64-bit, RE, exploitation) buradan çıkar. En kalıcı aracın bir komut değil, **"anlamadıysan GDB'de izle, gözünle gör"** alışkanlığı. Ve baştaki söz: makinede sihir yok — sadece artık okuyabildiğin komutlar. Kutu açıldı.

---

## 🔗 İlgili Konular

- [00_buradan_basla.md](./00_buradan_basla.md) — Nereden başladığını hatırla; "sonunda ne yapabileceksin" listesindeki her madde artık elinde
- [19_c_ile_assembly_koprusu.md](./19_c_ile_assembly_koprusu.md) — Derlenmiş kodu okuma; tersine mühendisliğin doğrudan ilk adımı
- [14_stack.md](./14_stack.md) — Binary exploitation'ın kalbi; "dönüş adresini ezmek" fikrinin dayanağı
- [../binary_exploitation/00_buradan_basla.md](../binary_exploitation/00_buradan_basla.md) — Bu kursun doğrudan devamı: öğrendiğin akışı *bükmeye* başla

---

**Önceki konu:** [19_c_ile_assembly_koprusu.md](./19_c_ile_assembly_koprusu.md)
**Sonraki adım:** [Binary Exploitation serisi](../binary_exploitation/00_buradan_basla.md) — 🎉 **x86 Assembly serisi burada tamamlanıyor.** Öğrendiğin stack'i bükmeye devam et.

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
