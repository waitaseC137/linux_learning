# 🐧 linux_learning

> Linux'u öğrenmek için topladığım kaynaklar, notlar ve çözümler.  
> Oyun oynayarak, deneye yanıla, terminal ekranına bakarak.

---

## 🐱 Robin Agent — Terminal Wargame Asistanı

**Robin Agent**, OverTheWire wargame'lerini çözerken sana eşlik eden terminal tabanlı bir eğitim aracıdır. SSH oturumunu senin yerine açar, ilerlemeni kaydeder ve takıldığın yerde NotebookLM destekli yapay zekâya soru sorabilmeni sağlar — hepsi tek bir terminal ekranında.

### Ne yapar?

- **Wargame seçim menüsü** — Bandit, Leviathan, Krypton, Natas, Narnia, Behemoth, Utumno arasından seç
- **Otomatik SSH bağlantısı** — şifreni girer, oturumu açar, ilerlemeni `progress.json`'da tutar
- **Yan panelde AI sohbeti** — TMUX split ekranıyla solda wargame, sağda Robin Chat. Çözerken takılınca o oyuna özel NotebookLM defterine soru sorarsın
- **İki mod** — `[1] AI destekli` (NotebookLM kurulur, her wargame için defter hazırlanır) veya `[2] Hard mode` (AI yok, direkt wargame)
- **Repoyla entegre** — her oyunun konu anlatımları ve walkthrough'ları NotebookLM defterine kaynak olarak yüklenir

### Kurulum ve Çalıştırma

```bash
cd robinagent

# Sanal ortam oluştur ve bağımlılıkları kur
python3 -m venv .venv
source .venv/bin/activate          # fish için: source .venv/bin/activate.fish
pip install -r requirements.txt

# AI modu istiyorsan (opsiyonel)
pip install "notebooklm-py[browser]"
playwright install chromium

# Çalıştır
python robinagent.py
```

> **Not:** Robin Agent TMUX içinde çalışır (yan panel için). TMUX kurulu değilse otomatik kurmaya çalışır; kuruluysa kendi oturumunu başlatır.

### Bağımlılıklar

`textual` (TUI arayüzü) · `pexpect` (SSH pty yönetimi) · `rich` (terminal çıktısı) · `pyyaml` (oyun tanımları) · `notebooklm-py` (opsiyonel, AI modu)

### Yapı

```
robinagent/
├── robinagent.py        # giriş noktası
├── core/                # SSH yönetimi, ilerleme takibi, NotebookLM köprüsü
├── ui/                  # Textual ekranları (welcome, oyun seçimi, sohbet)
├── games/               # her wargame için YAML tanımı (host, port, konular)
└── scripts/             # NotebookLM kurulum ve defter oluşturma
```

---

## 📚 Konu Anlatımları

Komutların ve kavramların wargame bağımsız, referans olarak tutulduğu dosyalar.  
Linux komutları, binary analizi, web güvenliği, kriptografi, binary exploitation ve Behemoth modüllerini kapsar.

→ **[Tüm konu anlatımlarına buradan ulaşabilirsin](./konu_anlatimlari/KONU_ANLATIMLARI.md)**

---

## 🎮 OverTheWire War Games

[OverTheWire](https://overthewire.org/wargames/), Linux ve güvenlik becerilerini **oyun formatında** öğreten ücretsiz bir platform. Her war game için level-by-level çözüm rehberleri.

Bandit (Linux temelleri), Leviathan ve Krypton (tersine mühendislik ve kripto), Natas (web güvenliği), Narnia, Behemoth ve Utumno (binary exploitation) — başlangıçtan ileri seviyeye kadar yedi wargame.

→ **[Tüm war game rehberlerine buradan ulaşabilirsin](./overthewire/WARGAMES.md)**

---

## 🛠️ Nasıl Kullanılır?

1. [OverTheWire](https://overthewire.org/wargames/) sitesine gir
2. Level sayfasındaki görevi oku
3. Önce **kendi başına dene** — takılırsan buraya bak
4. Bir komut veya kavram hakkında daha fazla bilgi için `konu_anlatimlari/` klasörüne bak

> Şifreler zaman zaman değişebilir. Bu rehberlerde yöntem anlatılıyor, şifreler paylaşılmıyor.

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

*Repo büyümeye devam ediyor — katkı ve önerilere açık.*
