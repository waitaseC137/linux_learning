# 🌿 Linux Komutları — Git

> Git, kod değişikliklerini takip eden dağıtık versiyon kontrol sistemidir.  
> Bandit'in son bölümünde (Level 27-31) git'in farklı özelliklerini  
> tek tek kullandık — klonlamadan push'a, branch'ten tag'e kadar.

---

## 📋 İçindekiler

- [Git Nedir?](#git-nedir)
- [git clone](#git-clone)
- [git log](#git-log)
- [git show](#git-show)
- [git branch](#git-branch)
- [git checkout](#git-checkout)
- [git tag](#git-tag)
- [git add](#git-add)
- [git commit](#git-commit)
- [git push](#git-push)
- [git diff](#git-diff)
- [git status](#git-status)
- [.gitignore](#gitignore)
- [Git Güvenlik Açıkları](#git-güvenlik-açıkları)

---

## Git Nedir?

Git, dosyalardaki değişiklikleri takip eden bir sistemdir. Her "commit" o anki durumun fotoğrafıdır.

```
Proje Tarihçesi:
  commit A (ilk)  →  commit B  →  commit C (son)
      "init"          "özellik"    "düzeltme"
```

### Temel Kavramlar

| Kavram | Açıklama |
|---|---|
| **Repository (Repo)** | Projenin tüm dosyaları + tarihçe |
| **Commit** | Değişikliklerin kaydedilmiş anlık görüntüsü |
| **Branch** | Paralel geliştirme hattı |
| **Tag** | Önemli noktaları işaret eden etiket |
| **Remote** | Uzak sunucudaki repo (GitHub gibi) |
| **Clone** | Uzak repoyu yerel kopyalama |
| **Push** | Yerel değişiklikleri uzağa gönderme |
| **Pull** | Uzak değişiklikleri yerele alma |
| **Merge** | Branch'leri birleştirme |
| **HEAD** | Şu an bulunduğun commit |

### Git Yapısı

```
Çalışma Dizini → Staging (git add) → Yerel Repo (git commit) → Uzak Repo (git push)
```

---

## git clone

Uzak bir repoyu yerel makineye kopyalar.

### Temel Kullanım
```bash
git clone https://github.com/user/repo
git clone https://github.com/user/repo hedef-klasor
git clone ssh://user@host/yol/repo
git clone ssh://user@host:port/yol/repo
```

### Önemli Bayraklar

| Bayrak | Açıklama |
|---|---|
| `--depth 1` | Sadece son commit'i al (hızlı) |
| `--branch <branch>` | Belirli branch'i klonla |
| `--single-branch` | Sadece bir branch |
| `-q` | Sessiz mod |

### Protokoller

```bash
# HTTPS (kullanıcı adı/şifre)
git clone https://github.com/user/repo

# SSH (key ile)
git clone git@github.com:user/repo

# Yerel (Bandit'te kullanılan)
git clone ssh://bandit27-git@localhost:2220/home/bandit27-git/repo
```

### Bandit'te Kullanım
```bash
# Level 27: repo'yu klonla
cd $(mktemp -d)
git clone ssh://bandit27-git@localhost:2220/home/bandit27-git/repo
# Şifre sor → bandit27'nin şifresini gir
cd repo
cat README
```

---

## git log

Commit geçmişini gösterir.

### Temel Kullanım
```bash
git log                     # tüm geçmiş
git log --oneline           # kısa özet (1 satır/commit)
git log -n 5                # son 5 commit
git log --all               # tüm branch'lerdeki commitler
git log --graph             # branch grafiği
git log --oneline --graph --all  # güzel özet
```

### Örnek Çıktı

```bash
$ git log
commit edd935d60906b33f0619605abd1689808ccdd5ee
Author: Morla Pussygato <morla@overthewire.org>
Date:   Thu May 7 2020 ...

    fix info leak        ← commit mesajı

commit c086d11b00cad37ed77e1abf54c4bde3dfba15bb
...

    add missing data
```

### Bayraklar

| Bayrak | Açıklama |
|---|---|
| `--oneline` | Her commit tek satırda |
| `--graph` | ASCII branch grafiği |
| `--all` | Tüm branch ve tag'ler |
| `-n N` | Son N commit |
| `--author="ad"` | Belirli yazarın commitleri |
| `--since="2024-01-01"` | Belirli tarihten itibaren |
| `--grep="kelime"` | Commit mesajında ara |
| `-p` | Değişiklikleri de göster |
| `--stat` | Dosya değişiklik istatistiği |

### Bandit'te Kullanım
```bash
# Level 28: commit geçmişinde şifre gizlenmiş
git log
# commit edd935d...  "fix info leak" ← şüpheli!
git show edd935d...
```

---

## git show

Commit veya tag'in detaylarını gösterir.

### Temel Kullanım
```bash
git show                    # son commit'in değişiklikleri
git show <commit_id>        # belirli commit
git show HEAD               # son commit
git show HEAD~1             # sondan bir önceki
git show <tag_adı>          # tag detayı
```

### Çıktıyı Okumak

```bash
$ git show edd935d...
commit edd935d...
Author: ...
Date: ...

    fix info leak

diff --git a/README.md b/README.md
index ...
--- a/README.md
+++ b/README.md
@@ -4,3 +4,3 @@
 username: natas9
-password: <eski şifre — git geçmişinde kalmış>   ← ESKİ (silinen)
+password: xxxxxxxxxx                            ← YENİ (eklenen)
```

`-` ile başlayan satırlar kaldırıldı, `+` ile başlayanlar eklendi.

### Bandit'te Kullanım
```bash
# Level 28: şifrenin silindiği commit'i göster
git show edd935d60906b33f0619605abd1689808ccdd5ee
# - password: <ESKİ_ŞİFRE>   ← bunu arıyoruz
# + password: xxxxxxxxxx
```

---

## git branch

Branch'leri listeler, oluşturur veya siler.

### Temel Kullanım
```bash
git branch                  # yerel branch'leri listele
git branch -a               # tüm branch'ler (remote dahil)
git branch -r               # sadece remote branch'ler
git branch yeni-branch      # yeni branch oluştur
git branch -d branch-adı    # branch sil (merged olmalı)
git branch -D branch-adı    # zorla sil
```

### Branch Adlandırma Kuralları

```
master / main   → production kodu
dev             → geliştirme
feature/login   → yeni özellik
bugfix/login    → hata düzeltme
hotfix/login    → acil düzeltme
```

### Örnek Çıktı

```bash
$ git branch -a
* master                          ← * = şu an buradasın
  remotes/origin/dev              ← remote branch
  remotes/origin/master
  remotes/origin/sploits-dev
```

### Bandit'te Kullanım
```bash
# Level 29: tüm branch'leri listele
git branch -a
# remotes/origin/dev ← production'da şifre yok ama dev'de var!

git checkout dev
cat README.md   # şifre burada
```

---

## git checkout

Branch veya commit'e geçiş yapar.

### Temel Kullanım
```bash
git checkout branch-adı         # branch'e geç
git checkout -b yeni-branch     # yeni branch oluşturup geç
git checkout <commit_id>        # belirli commit'e git (detached HEAD)
git checkout -- dosya.txt       # dosyayı son commit'e geri al
```

### Branch Geçişi

```bash
# Remote branch'e geç
git checkout dev
# veya tam yol:
git checkout -b dev origin/dev

# Yeni branch oluştur ve geç
git checkout -b feature/login
```

### Detached HEAD

```bash
git checkout abc1234
# HEAD artık bir branch değil, doğrudan o commit'i gösteriyor
# Uyarı: detached HEAD state
```

### Bandit'te Kullanım
```bash
# Level 29: dev branch'ine geç
git checkout dev
cat README.md   # şifre!
```

---

## git tag

Tag oluşturur veya listeler. Tag'ler önemli noktaları işaretler (versiyon numaraları gibi).

### Temel Kullanım
```bash
git tag                     # tag'leri listele
git tag v1.0                # lightweight tag oluştur
git tag -a v1.0 -m "mesaj" # annotated tag (mesajlı)
git show v1.0               # tag detayını göster
git tag -d v1.0             # tag sil
```

### Tag Türleri

```bash
# Lightweight (basit işaret)
git tag v1.0

# Annotated (mesajlı, imzalı)
git tag -a v1.0 -m "Versiyon 1.0 yayınlandı"
```

### Bandit'te Kullanım
```bash
# Level 30: README boş, log tek commit, branch yok...
git tag
# secret    ← gizli tag!

git show secret
# <şifre buraya gelir>
```

---

## git add

Değiştirilmiş dosyaları "staging area"ya ekler. Commit'lenmeden önce hazırlama alanı.

### Temel Kullanım
```bash
git add dosya.txt           # tek dosya ekle
git add .                   # mevcut dizindeki tüm değişiklikleri ekle
git add -A                  # tüm değişiklikleri ekle (silmeler dahil)
git add -p                  # değişiklikleri parça parça ekle (interactive)
git add -f dosya.txt        # .gitignore'a rağmen zorla ekle
```

### -f (force) Bayrağı

`.gitignore` dosyasında listelenen dosyalar normalde `git add` ile eklenemez. `-f` bayrağı bunu zorlar:

```bash
# .gitignore içinde *.txt var
cat .gitignore
# *.txt

git add key.txt         # hata! gitignore'da
git add -f key.txt      # zorla ekle!
```

### Bandit'te Kullanım
```bash
# Level 31: .gitignore *.txt'yi engelliyor
cat .gitignore    # *.txt

echo 'May I come in?' > key.txt
git add -f key.txt  # zorla ekle
git commit -m "add key"
git push
```

---

## git commit

Staging area'daki değişiklikleri kalıcı olarak kaydeder.

### Temel Kullanım
```bash
git commit -m "Commit mesajı"       # mesajla commit
git commit -am "Mesaj"              # add + commit (takip edilen dosyalar)
git commit --amend                  # son commit'i düzelt
git commit --amend -m "Yeni mesaj"  # son commit mesajını değiştir
```

### İyi Commit Mesajı Yazımı

```bash
# KÖTÜ
git commit -m "düzeltme"
git commit -m "aaa"

# İYİ
git commit -m "feat: kullanıcı giriş sayfası eklendi"
git commit -m "fix: şifre sıfırlama hatası düzeltildi"
git commit -m "docs: README güncellendi"
```

### Conventional Commits

```
feat:     yeni özellik
fix:      hata düzeltme
docs:     dokümantasyon
style:    format değişikliği
refactor: kod yeniden yapılandırma
test:     test ekleme/düzenleme
chore:    bakım işleri
```

### Bandit'te Kullanım
```bash
# Level 31: değişiklikleri kaydet
git add -f key.txt
git commit -m "add key"
git push
```

---

## git push

Yerel commit'leri uzak repo'ya gönderir.

### Temel Kullanım
```bash
git push                            # mevcut branch'i push'la
git push origin main                # belirli remote ve branch
git push -u origin main             # upstream ayarla ve push'la
git push --force                    # zorla push (dikkatli!)
git push origin --delete branch     # remote branch sil
```

### İlk Push

```bash
# Remote bağlantısı yoksa ekle
git remote add origin https://github.com/user/repo.git

# Upstream ayarla
git push -u origin main
# Sonraki seferler sadece "git push" yeterli
```

### Kimlik Doğrulama

```bash
# HTTPS (kullanıcı adı + token)
git push    # kullanıcı adı ve şifre/token sorar

# SSH (key ile otomatik)
git remote set-url origin git@github.com:user/repo.git
git push    # şifre sormaz
```

### Bandit'te Kullanım
```bash
# Level 31: push'la, remote şifreyi verir
git push -u origin master
# remote: Well done! Here is the password:
# remote: <şifre>
```

---

## git diff

Değişiklikleri karşılaştırır.

### Temel Kullanım
```bash
git diff                    # working directory vs staging
git diff --staged           # staging vs son commit
git diff HEAD               # working directory vs son commit
git diff branch1 branch2    # iki branch karşılaştır
git diff <commit1> <commit2>  # iki commit karşılaştır
```

---

## git status

Çalışma dizininin durumunu gösterir.

### Temel Kullanım
```bash
git status                  # durum göster
git status -s               # kısa özet
```

### Örnek Çıktı

```bash
$ git status
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        new file:   key.txt        ← staging'de

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
        modified:   README.md      ← değiştirildi ama add edilmedi

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        temp.txt                   ← git bilmiyor
```

---

## .gitignore

Hangi dosyaların git tarafından **yoksayılacağını** belirtir.

### Sözdizimi

```gitignore
# Yorum satırı
*.log           # tüm .log dosyaları
*.txt           # tüm .txt dosyaları
build/          # build klasörü
!README.txt     # README.txt'yi yoksayma (istisna)
/root.txt       # sadece kök dizindeki root.txt
doc/*.txt       # doc klasöründeki .txt dosyaları
**/*.log        # tüm alt dizinlerdeki .log dosyaları
```

### Bandit'te Kullanım
```bash
# Level 31: .gitignore *.txt'yi engelliyor
cat .gitignore
# *.txt

# Ama -f ile bypass edilebilir
git add -f key.txt
```

---

## Git Güvenlik Açıkları

Bandit'te öğrendiğimiz kritik güvenlik dersleri:

### 1. Git Geçmişi Her Şeyi Saklar

```bash
# Bir dosyayı silsen bile geçmişte kalır!
git rm şifre.txt
git commit -m "şifreyi sildim"

# Ama hala erişilebilir:
git log --all
git show <eski_commit>
# şifre hala burada!
```

**Çözüm:** Hassas veriyi hiç commit'leme. `git-secrets`, `gitleaks` gibi araçlar kullan.

### 2. Tüm Branch'leri Kontrol Et

```bash
# Sadece main'e bakma!
git branch -a
git checkout dev   # başka branch'te bilgi olabilir
```

### 3. Tag'ler Gizli Bilgi İçerebilir

```bash
git tag
git show <tag>   # hassas bilgi olabilir
```

### 4. .gitignore Güvenlik Değildir

`.gitignore` dosyaları gizlemez, sadece takip etmez. Zaten commit'lenmiş dosyalar hala görünür.

---

## 📚 Hızlı Referans Tablosu

| Komut | Kullanım | Ne Yapar |
|---|---|---|
| `git clone` | `git clone <url>` | Repo'yu indir |
| `git log` | `git log --oneline` | Commit geçmişi |
| `git show` | `git show <id>` | Commit detayı |
| `git branch -a` | `git branch -a` | Tüm branch'ler |
| `git checkout` | `git checkout dev` | Branch değiştir |
| `git tag` | `git tag` | Tag'leri listele |
| `git show <tag>` | `git show secret` | Tag içeriği |
| `git add -f` | `git add -f dosya` | gitignore bypass |
| `git commit -m` | `git commit -m "msg"` | Değişiklikleri kaydet |
| `git push` | `git push` | Remote'a gönder |
| `git status` | `git status` | Durum göster |
| `git diff` | `git diff` | Değişiklikleri göster |

---

## 🔗 Daha Fazla Bilgi

- [Git Resmi Dokümantasyon](https://git-scm.com/doc)
- [Pro Git Kitabı (Türkçe)](https://git-scm.com/book/tr/v2)
- [GitHub Guides](https://guides.github.com/)
- [Learn Git Branching](https://learngitbranching.js.org/) — interaktif öğrenme
- [gitleaks](https://github.com/gitleaks/gitleaks) — git'te hassas veri tespiti

---

**Önceki bölüm:** [surec_shell.md](./surec_shell.md)

*Bu rehber [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun bir parçasıdır.*
