# 💻 x86 Assembly — Terminal ile Tanışma

> Şimdiye kadar bilgisayara hep *tıklayarak* konuştun: simgeye bas, pencere açılsın.
> Terminal ise bilgisayara **yazarak** emir verdiğin yerdir — fareyle değil, klavyeyle, tek tek.
> İlk başta çıplak ve ürkütücü görünür; ama aslında bir önceki dersteki o "harfiyen itaatkâr işçi"yle
> doğrudan, aracısız konuşmanın en temiz yoludur. Bu derste ilk kez kendi ellerinle ona emir vereceğiz.

> **Bu derste tek satır assembly yok.** Sadece terminali tanıyacak, içine birkaç komut yazıp
> ne olduğunu *gözünle* göreceğiz. Amaç: terminalin önünde rahat hissetmek. Bu rahatlık,
> ileride kod yazıp çalıştırırken her şeyin temeli olacak.

---

## 📋 İçindekiler

- [Terminal Nedir? (Ve Neden Fareyle Değil?)](#terminal-nedir-ve-neden-fareyle-de%C4%9Fil)
- [Terminali Nasıl Açarım?](#terminali-nas%C4%B1l-a%C3%A7ar%C4%B1m)
- [Terminalin Anatomisi: Yaz, Enter'a Bas, Oku](#terminalin-anatomisi-yaz-entera-bas-oku)
- [İlk Emrin: `echo`](#i%CC%87lk-emrin-echo)
- [Neredeyim? Ne Var Burada?](#neredeyim-ne-var-burada)
- [Klasör Yap, İçine Gir](#klas%C3%B6r-yap-i%CC%87%C3%A7ine-gir)
- [Dosya Oluştur ve İçine Bak](#dosya-olu%C5%9Ftur-ve-i%CC%87%C3%A7ine-bak)
- [Az Önce Ne Oldu? (Program mı, Process mi?)](#az-%C3%B6nce-ne-oldu-program-m%C4%B1-process-mi)
- [Hata Aldın mı? Güzel.](#hata-ald%C4%B1n-m%C4%B1-g%C3%BCzel)

---

## Terminal Nedir? (Ve Neden Fareyle Değil?)

Bir simgeye çift tıkladığında aslında bilgisayara şunu demiş olursun: "şu programı çalıştır." Sadece bunu **fareyle** dersin. Terminal ise aynı şeyi **yazarak** dediğin bir penceredir: bir komut yazarsın, Enter'a basarsın, bilgisayar onu yapar.

Peki neden tıklamak dururken yazalım? Çünkü:

- **Kesinlik.** Fareyle "şunu kastettim" olmaz; yazdığın komut neyse o çalışır. Bir önceki dersteki "harfiyen itaatkâr işçi"yle konuşmanın doğal yolu budur.
- **Güç.** Tek bir satırla, fareyle dakikalarca uğraşacağın işi anında yaptırabilirsin.
- **Zorunluluk.** Assembly yazıp çalıştırmak, kodu derlemek, programı adım adım izlemek — bunların hepsi terminalden yapılır. Yani bu kurs için terminal bir tercih değil, evimiz.

> 💡 "Terminal", "konsol", "komut satırı", "shell" — hepsini aşağı yukarı aynı şey için duyacaksın: yazarak komut verdiğin o pencere. Şimdilik aralarındaki ince farkları dert etme.

---

## Terminali Nasıl Açarım?

Bu kurs tamamen **Linux** üzerinedir — assembly aletlerimiz (nasm, ld, gdb) orada yaşar. Windows ve macOS kullanmayacağız; doğrudan Linux'tan gidiyoruz.

Linux'ta terminali açmanın birkaç yolu var:

- Uygulamalar arasında **"Terminal"** (bazı sistemlerde **"Konsol"**) adlı uygulamayı bulup aç.
- Ya da çoğu masaüstünde işe yarayan kısayol: **`Ctrl + Alt + T`**.

> 💡 Henüz çalışan bir Linux'un yoksa dert etme: ortamın ve aletlerin tam kurulumunu [05_kurulum_ve_ilk_program](./05_kurulum_ve_ilk_program.md)'da baştan sona birlikte yapacağız. Bu dersi şimdilik **okuyarak** geçip, terminali kurduktan sonra geri dönüp komutları kendin denemen de tamamen olur.

Açtığında karşına büyük ihtimalle koyu renkli, içinde birkaç kelime ve yanıp sönen küçük bir çizgi olan bir pencere çıkar. Korkma — birazdan onu çözeceğiz.

---

## Terminalin Anatomisi: Yaz, Enter'a Bas, Oku

Terminal penceresinde gördüğün o ilk satıra **prompt** (komut istemi) denir. Sana "buyur, emrini yaz" diyen satırdır. Kabaca şöyle görünür:

```
kullanici@bilgisayar:~$ ▮
```

Parça parça:

```
 kullanici   → senin kullanıcı adın
 @           → "şurada" demek
 bilgisayar  → makinenin adı
 ~           → şu an bulunduğun klasör (~ = ev klasörün)
 $           → "buraya komut yazabilirsin" işareti
 ▮           → yanıp sönen imleç: yazdığın harfler buraya gider
```

Terminalle tek bir ritimde konuşursun:

```
   1) Komutu YAZ
   2) ENTER'a bas
   3) Bilgisayar komutu çalıştırır, sonucu (çıktıyı) yazar
   4) Sana yeni bir prompt verir: "buyur, sıradaki?"
```

Hepsi bu. Yanıp sönen imleç seni beklediği için sabırlıdır; acele yok. Yanlış yazarsan, Enter'a basmadan silebilirsin. Hadi ilk emrini verelim.

---

## İlk Emrin: `echo`

`echo`, "sana ne verirsem onu ekrana geri yaz" demektir. En zararsız, en güven verici ilk komuttur. Şunu yazıp Enter'a bas:

```
echo Merhaba
```

Göreceğin:

```
Merhaba
```

Oldu! Bilgisayara bir şey söyledin, o da harfiyen yaptı — ne eksik ne fazla, tıpkı o aptal-ama-itaatkâr işçi gibi. İstersen başka bir şey de yazdır:

```
echo bilgisayara ben hukmediyorum
```
```
bilgisayara ben hukmediyorum
```

> 💡 Bu küçük an önemli: ekrandaki o yazıyı **sen** çıkardın, fareyle hiçbir yere tıklamadan. Terminalin tüm mantığı bu — yaz, çalışsın, sonucu gör.

---

## Neredeyim? Ne Var Burada?

Terminal her zaman bir **klasörün içinde** durur (tıpkı dosya gezgininde bir klasör açıkken durman gibi, ama görünmez). İki temel soru:

**"Şu an hangi klasördeyim?"** → `pwd` (İngilizce *print working directory*)

```
pwd
```
```
/home/kullanici
```

Yani şu an `kullanici` adlı kişinin ev klasöründesin. (Prompt'taki `~` işareti de zaten bunu söylüyordu.)

**"Bu klasörde ne var?"** → `ls` (İngilizce *list*)

```
ls
```
```
Belgeler  Indirilenler  Masaustu  Resimler
```

`ls`, bulunduğun klasördeki dosya ve klasörleri sıralar. Boş bir klasörde hiçbir şey yazmaz — bu da normaldir, "burada bir şey yok" demektir.

> 🔑 Aklında tut: terminalde **her zaman bir yerdesin.** "Neredeyim?" `pwd`, "burada ne var?" `ls`. Kaybolduğunu hissedersen bu ikisi pusulandır.

---

## Klasör Yap, İçine Gir

Kursun dosyalarını dağınık bırakmamak için kendine bir çalışma klasörü açalım.

**Klasör oluştur** → `mkdir` (İngilizce *make directory*)

```
mkdir asm_dersi
```

Ekrana bir şey yazmaz — ama sessizlik burada "tamam, yaptım" demektir. (İşçi gereksiz konuşmaz.) `ls` ile kontrol et, artık `asm_dersi` görünüyor olmalı.

**Klasörün içine gir** → `cd` (İngilizce *change directory*)

```
cd asm_dersi
```

Şimdi `pwd` yazarsan sonunda `/asm_dersi` gördüğünü fark edeceksin — içeri girdin. Geri çıkmak istersen:

```
cd ..
```

`..` "bir üst klasör" demektir. `cd` ile klasörler arasında, bir binanın odaları arasında gezer gibi dolaşırsın.

> 💡 Komutu yazarken klasör/dosya adının ilk birkaç harfini yazıp **Tab** tuşuna basmayı dene — terminal gerisini senin için tamamlar. Hem hızlandırır hem de yazım hatasını önler. (Buna *tab completion* denir; vazgeçilmezindir.)

---

## Dosya Oluştur ve İçine Bak

`asm_dersi` klasörünün içindeyken küçük bir not dosyası oluşturalım:

```
echo "ilk notum" > not.txt
```

Burada yeni bir şey var: `>` işareti. Normalde `echo` çıktıyı **ekrana** yazardı; `>` ise "çıktıyı ekrana değil, **şu dosyaya** yaz" demektir. Yani bu satır, içinde `ilk notum` yazan `not.txt` adlı bir dosya oluşturur. Ekrana bir şey çıkmaz — çıktı artık dosyaya gitti.

`ls` yazarsan `not.txt`'yi görürsün. Peki içinde ne var? **Bir dosyanın içeriğini görmek** → `cat`:

```
cat not.txt
```
```
ilk notum
```

İşte: bir dosya oluşturdun ve içine baktın — hepsi klavyeden.

> ⚠️ Dikkat: `>` dosyanın **içini sıfırlayıp baştan yazar.** `not.txt` zaten doluyken tekrar `echo "..." > not.txt` yaparsan eskisi silinir. İçeriğin **sonuna eklemek** istersen tek `>` yerine çift `>>` kullanılır. Şimdilik bunu sadece bir kenara not et.

---

## Az Önce Ne Oldu? (Program mı, Process mi?)

Şimdi geriye dönüp güzel bir bağlantı kuralım. `echo`, `ls`, `cat` — bunların hepsi aslında **birer programdır.** Diskte duran, "ekrana yaz", "klasörü listele", "dosyayı göster" işini bilen küçük programlar.

Sen `ls` yazıp Enter'a bastığında olan şey, bir önceki dersteki resmin ta kendisidir:

```
  1) İşletim sistemi "ls" adlı programı diskte bulur
  2) Onu belleğe (depoya) yükler
  3) İşçi (işlemci) o programın emir listesini çalıştırır → çıktı ekrana gelir
  4) Program biter, kontrol sana döner → yeni prompt
```

> 🔑 Burada o iki kelime somutlaşıyor:
> - **Program** = diskte duran emir listesi (tarif). Örn: `ls` programı.
> - **Process** = o programın belleğe yüklenip **şu an çalışmakta olan** hâli (mutfakta pişen tarif).
>
> Yani `ls` diskte bir programdır; sen onu çalıştırdığında kısa ömürlü bir process doğar, işini yapar, ölür ve sana prompt'u geri verir. Her komut, küçük bir process'in doğup ölmesidir.

İleride `nasm` ile **kendi** programını yazıp çalıştıracağız. O da tam böyle olacak: yazdığın dosya diskte bir program, çalıştırdığında bir process. Terminal, bu döngüyü başlattığın yerdir.

---

## Hata Aldın mı? Güzel.

Er ya da geç bir komutu yanlış yazacaksın. Mesela `echo` yerine yanlışlıkla:

```
eco Merhaba
```
```
eco: command not found
```

Panik yok — bu, terminalin sana kızması değil; sadece **"eco diye bir program tanımıyorum"** demesi. Yani harfi yanlış yazmışsın. Düzelt, tekrar dene. Olağan programcılık döngüsü zaten budur: yaz → hata al → oku → düzelt.

Hata mesajlarını **düşman değil, ipucu** olarak gör. Çoğu zaman tam olarak neyin yanlış olduğunu söyler:

- `command not found` → komut adını yanlış yazdın ya da o program kurulu değil.
- `No such file or directory` → olmayan bir dosya/klasör adı verdin (yine çoğu zaman yazım hatası).
- `Permission denied` → o işi yapmaya iznin yok (ileride değineceğiz).

> 💡 En sık üç hatanın üçü de aslında "yazım hatası" çıkar. Bu yüzden **Tab ile tamamlama** (yukarıda gördük) hem hız hem de hata kalkanıdır.

> 💡 **Aklınıza takılabilir:** *"Yanlış bir şey yazarsam canım Linux'umu ya da dosyalarımı yanlışlıkla siler miyim?"* Bildiğin komutlar (`echo`, `ls`, `pwd`, `cd`, `mkdir`, `cat`) hiçbir şey **silmez** — sadece bakar, gezdirir, oluşturur. Dosya silen gerçek keskin bıçak `rm`'dir, ama onu henüz öğretmedik bile; geldiğinde bağıra çağıra işaret edeceğiz. Komutu yanlış yazmak da zararsız: sonucu olsa olsa `command not found`, yani hiçbir şey olmaz. (Sistem dosyaları ayrıca `sudo` + parola ister, kazara denk gelemezsin.)

---

## Özet — Aklında Tut

```
☐ Terminal = bilgisayara fareyle değil, YAZARAK emir verdiğin pencere.
☐ Ritim: komutu yaz → Enter → çıktıyı oku → yeni prompt.
☐ Terminalde her zaman bir klasörün içindesin:
    - pwd  → "neredeyim?"      (hangi klasör)
    - ls   → "burada ne var?"  (dosya/klasör listesi)
☐ Gezinme ve oluşturma:
    - mkdir <ad>  → klasör oluştur
    - cd <ad>     → klasöre gir     |   cd ..  → bir üst klasör
☐ Dosya:
    - echo "..." > dosya  → çıktıyı ekrana değil dosyaya yaz (içini SIFIRLAR; eklemek için >>)
    - cat dosya           → dosyanın içeriğini göster
☐ echo/ls/cat birer PROGRAMDIR; çalıştırınca kısa ömürlü birer PROCESS olurlar.
☐ Hata = düşman değil, ipucu. Çoğu hata yazım hatasıdır. Tab ile tamamla.
```

---

## 🔗 İlgili Konular

- [01_bilgisayar_nedir.md](./01_bilgisayar_nedir.md) — Programı çalıştıran "işçi" ve program/process ayrımı
- [05_kurulum_ve_ilk_program.md](./05_kurulum_ve_ilk_program.md) — Terminale assembly aletlerini kurup ilk programı çalıştırma
- [03_sayilar_ikilik_onaltilik.md](./03_sayilar_ikilik_onaltilik.md) — Makinenin saydığı gibi saymak

---

**Önceki konu:** [01.5_sayi_ve_anlam.md](./01.5_sayi_ve_anlam.md)
**Sonraki konu:** [03_sayilar_ikilik_onaltilik.md](./03_sayilar_ikilik_onaltilik.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
