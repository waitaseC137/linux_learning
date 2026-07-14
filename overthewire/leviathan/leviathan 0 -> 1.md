# Leviathan 0 → 1

> **Bağlantı:** `ssh leviathan0@leviathan.labs.overthewire.org -p 2223`
> **Başlangıç şifresi:** `leviathan0` (oyunun ilk seviyesi herkese açık)
> **Hedef:** `leviathan1` parolasını bul.

---

## 1. Keşif (Recon)

Giriş yaptıktan sonra ev dizinine bakıyoruz:

```bash
leviathan0@gibson:~$ ls -la
drwxr-x---  2 leviathan1 leviathan0 4096 .backup
-rw-r--r--  1 root       root        220 .bash_logout
-rw-r--r--  1 root       root       3851 .bashrc
-rw-r--r--  1 root       root        807 .profile
```

Sıradışı olan tek şey gizli bir `.backup` klasörü. İçine bakalım:

```bash
leviathan0@gibson:~$ ls -la .backup
-rw-r----- 1 leviathan1 leviathan0 133259 bookmarks.html
```

`bookmarks.html` — sahibi `leviathan1`, ama grubu `leviathan0` ve grup için okuma izni (`r--`) var. Yani biz (leviathan0) bu dosyayı **okuyabiliyoruz**. 133 KB'lık bir tarayıcı yer imleri (bookmark) dosyası.

## 2. Analiz

Dosya çok büyük (1399 satır), elle okumak yerine içinde "password" geçen yeri arıyoruz:

```bash
leviathan0@gibson:~$ grep -i 'password' .backup/bookmarks.html
```

Çıktı:

```html
<DT><A HREF="http://leviathan.labs.overthewire.org/passwordus.html | This will
be fixed later, the password for leviathan1 is **********" ...>password to leviathan1</A>
```

## 3. Zafiyet / Ders

Klasik bir **bilgi sızıntısı (information disclosure)**: bir bookmark girdisinin URL alanına, sözde "sonra düzeltilecek" notuyla birlikte bir sonraki seviyenin parolası düz metin olarak gömülmüş. Hassas veriler asla yedek dosyalarına / yorum satırlarına / URL'lere yazılmamalı; dosya izinleri (grup-okuma) bu sızıntıyı erişilebilir kılıyor.

## 4. Çözüm Özeti

```bash
grep -i password ~/.backup/bookmarks.html
```

→ `leviathan1` parolası: `**********`

| Adım | Komut / Bulgu |
|------|---------------|
| Recon | `ls -la` → gizli `.backup/` |
| Okuma izni | `bookmarks.html` grup-okunabilir |
| Sızıntı | `grep -i password` ile gömülü parola |
| Sonuç | leviathan1 parolası ele geçti |

**Alınan ders:** Yedek/işaret (bookmark) dosyaları sırları sızdırabilir. Bir hedefte önce gizli dosyaları (`ls -la`) ve okunabilir "yetkili" dosyaları tara, içinde `password`, `passwd`, `key`, `secret` gibi kelimeleri ara.
