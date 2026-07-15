# 🐧 linux_learning

> Şalter → mantık kapısı → işlemci → assembly → işletim sistemi → wargame.
> Bilgisayarı ve güvenliği **katman katman, en alttan** öğren — oyun oynayarak, deneye yanıla, terminale bakarak.
>
> "İşlemci nedir?" diye soranların değil, **işlemciyle dans etmek** isteyenlerin yeri.

---

## 📚 Konu Anlatımları

Komutların ve kavramların wargame bağımsız, referans olarak tutulduğu dosyalar.  
Şalterden bilgisayara (NAND'dan CPU'ya), x86 assembly, Linux komutları, binary analizi, web güvenliği, kriptografi ve binary exploitation modüllerini kapsar.

→ **[Tüm konu anlatımlarına buradan ulaşabilirsin](./konu_anlatimlari/KONU_ANLATIMLARI.md)**

> 💥 **Binary exploitation'a sıfırdan mı başlıyorsun?** Assembly bilmeden de takip edebileceğin giriş rehberi: **[00_buradan_basla.md](./konu_anlatimlari/binary_exploitation/00_buradan_basla.md)**

---

## 🎮 OverTheWire War Games

[OverTheWire](https://overthewire.org/wargames/), Linux ve güvenlik becerilerini **oyun formatında** öğreten ücretsiz bir platform. Her war game için level-by-level çözüm rehberleri.

Bandit (Linux temelleri), Leviathan ve Krypton (tersine mühendislik ve kripto), Natas (web güvenliği), Narnia, Behemoth, Utumno ve Maze (binary exploitation) — başlangıçtan ileri seviyeye kadar sekiz wargame.

→ **[Tüm war game rehberlerine buradan ulaşabilirsin](./overthewire/WARGAMES.md)**

---

## 🛠️ Nasıl Kullanılır?

1. [OverTheWire](https://overthewire.org/wargames/) sitesine gir
2. Level sayfasındaki görevi oku
3. Önce **kendi başına dene** — takılırsan buraya bak
4. Bir komut veya kavram hakkında daha fazla bilgi için `konu_anlatimlari/` klasörüne bak

> Şifreler zaman zaman değişebilir. Bu rehberlerde yöntem anlatılıyor, şifreler paylaşılmıyor — tek istisna **Krypton**: parola çözümün doğrudan çıktısı olduğu için gösteriliyor.

---

## 📚 Kaynaklar

### OverTheWire
- [OverTheWire Wargames](https://overthewire.org/wargames/)
- [Bandit Walkthrough — MayADevBe](https://mayadevbe.me/posts/overthewire/bandit/overview/)
- [Leviathan Walkthrough — MayADevBe](https://mayadevbe.me/posts/overthewire/leviathan/overview/)
- [Krypton Walkthrough — MayADevBe](https://mayadevbe.me/tags/krypton/) (0-5)
- [Krypton Level 6 — LearnHacking.io](https://learnhacking.io/overthewire-krypton-levels-0-9/)
- [Natas Walkthrough — MayADevBe](https://mayadevbe.me/tags/natas/) (0-6)
- [Natas 6-10 — LearnHacking.io](https://learnhacking.io/overthewire-natas-walkthrough-levels-6-10/)
- [Natas 7-13 — JamesCao](https://jameskaois.com/posts/overthewire-natas-level-7-13/)
- [Natas 14-20 — JamesCao](https://jameskaois.com/posts/overthewire-natas-level-14-20/)
- [Natas 21-24 — JamesCao](https://jameskaois.com/posts/overthewire-natas-level-21-24/)
- [Narnia Full Writeup — cplusperks.com](https://cplusperks.com/narnia/)
- [Narnia 0-4 — HackMD](https://hackmd.io/@Chivato/B112H_I18)

### Linux Referans
- [Linux Man Pages](https://manpages.ubuntu.com/)
- [Explain Shell](https://explainshell.com/)
- [Bash Guide for Beginners](https://tldp.org/LDP/Bash-Beginners-Guide/html/)

### Web Güvenliği
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [MDN HTTP Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP)

### Binary Exploitation
- [LiveOverflow — Binary Exploitation](https://www.youtube.com/playlist?list=PLhixgUqwRTjxglIswKp9mpkfPNfHkzyeN)
- [Shell-storm.org Shellcodes](http://shell-storm.org/shellcode/)
- [GDB Cheat Sheet](https://darkdust.net/files/GDB%20Cheat%20Sheet.pdf)
- [Format String Exploits](http://codearcana.com/posts/2013/05/02/introduction-to-format-string-exploits.html)
- [Ghidra](https://ghidra-sre.org/)
- [pwntools Dokümantasyonu](https://docs.pwntools.com/en/stable/)
- [pwntools GitHub](https://github.com/Gallopsled/pwntools)
- [Practical Reverse Engineering — Bruce Dang et al. (Wiley, 2014)](https://www.wiley.com/en-us/Practical+Reverse+Engineering%3A+x86%2C+x64%2C+ARM%2C+Windows+Kernel%2C+Reversing+Tools%2C+and+Obfuscation-p-9781118787311)
- [Intel x86 Software Developer's Manual](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [x86 Instruction Reference — Felix Cloutier](https://www.felixcloutier.com/x86/)
- [Exploit Education — Phoenix](https://exploit.education/phoenix/) *(modern pwntools ile pratik)*
- [pwn.college](https://pwn.college/) *(binary exploitation eğitim platformu)*

### Kriptografi
- [CyberChef](https://gchq.github.io/CyberChef/)
- [dCode.fr](https://www.dcode.fr/)
- [Vigenère Cipher — Wikipedia](https://en.wikipedia.org/wiki/Vigen%C3%A8re_cipher)
- [ECB Mode Weakness](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#ECB)
- [ASCII Tablosu](https://www.asciitable.com/)
- [Dosya İmzaları](https://en.wikipedia.org/wiki/List_of_file_signatures)

### Git
- [Git Resmi Dokümantasyon](https://git-scm.com/doc)
- [Pro Git Kitabı](https://git-scm.com/book/tr/v2)
- [Learn Git Branching](https://learngitbranching.js.org/)

---

## 🤖 Bu repo nasıl hazırlanıyor?

Açık olayım: bu repodaki içeriği (konu anlatımları, wargame çözümleri ve site) hazırlarken yapay zekâdan — özellikle **Claude Code**'dan — bir yardımcı asistan olarak faydalanıyorum. AI işi hızlandırıyor; taslak çıkarıyor, tekrarlayan kısımları ve sıkıcı düzenlemeleri üstleniyor.

Ama içerik benim **bilgi birikimim ve deneyimimle** şekilleniyor:

- Üretilen her çıktıyı **ben okuyup test ediyorum**; eksik veya hatalı yerleri düzeltiyorum.
- Wargame çözümlerini ve komutları düzenli olarak açıp **kendim deniyorum** — "bir sıkıntı var mı?" diye kontrol ediyorum.
- Yayınlanan son hâli **repo sahibi olarak ben onaylıyorum** ve arkasında duruyorum.

Yani evet, burada AI destekli bir akış var; ama bu repo "körlemesine üretip bırakılmış" bir yer değil — öğrenirken tuttuğum, her gün açıp gözden geçirdiğim **canlı bir defter**. Claude Code işi hızlandıran bir asistan; karar veren, doğrulayan ve sorumluluğu taşıyan benim.

**Somut bir örnek (Temmuz 2026):** Repoyu baştan sona bir güvenlik ve doğruluk incelemesinden geçirdim — bu turu **Claude Code** (Fable 5) ile birlikte yürüttük. Sızmış birkaç wargame parolasını maskeledik, sitedeki eksik/tutarsız yerleri (ana sayfada eksik kalan Maze wargame'i, birbirini tutmayan sayaçlar) düzelttik ve `docs/` aynasını kaynaktan otomatik üreten bir senkron sistemi (`scripts/sync-docs.sh` + CI kontrolü) kurduk. Bulguları Claude Code çıkardı ve düzeltmeleri uyguladı; ben her adımı inceleyip onayladım. Buradaki emek ortak — hız ve kapsam AI'dan, karar ve sorumluluk benden.

> ℹ️ **Git geçmişi neden sıfırlandı?** Bu inceleme sırasında, bazı erken commit'lerde birkaç OverTheWire parolasının yanlışlıkla düz metin kaldığını fark ettik — reponun "şifreler paylaşılmıyor" ilkesine aykırı bir durum (bir tür bilgi ifşası açığı). Güncel dosyalarda maskelemek tek başına yetmiyordu; parolalar eski commit blob'larında hâlâ okunabiliyordu. Bu yüzden git geçmişini bilinçli olarak **tek bir temiz commit'e sıfırladık** (Temmuz 2026). **İçerikte kayıp yok** — yalnızca parola sızıntısı ve dağınık eski commit'ler temizlendi. Kafada soru işareti kalmasın diye açıkça not düşüyorum: geçmişin yeniden yazılması gizlemek için değil, bir güvenlik/ilke ihlalini kökten temizlemek içindi.

---

*Repo büyümeye devam ediyor — katkı ve önerilere açık.*

Lisans: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) · Kod: MIT
