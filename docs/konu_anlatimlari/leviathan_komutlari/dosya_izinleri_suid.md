# Dosya İzinleri ve SUID

---

## İzin Sistemi

Linux'ta her dosyanın bir sahibi (user), bir grubu (group) ve diğerleri (others) için tanımlı izinleri vardır.

```
ls -la ile görüntüleme:

-rwxr-x---  1  leviathan2  leviathan1  7452  check
 ^^^---^^^      ^^^^^^^^^   ^^^^^^^^^
 |  |  |        sahip        grup
 |  |  └── others: ---  (erişim yok)
 |  └───── group:  r-x  (okuma + çalıştırma)
 └──────── user:   rwx  (okuma + yazma + çalıştırma)
```

İlk karakter dosya türünü gösterir: `-` normal dosya, `d` dizin, `l` sembolik link.

---

## chmod — İzin Değiştirme

```bash
chmod [mod] dosya
```

**Sembolik mod:**

```bash
chmod u+x dosya      # sahibine çalıştırma ekle
chmod g-w dosya      # gruptan yazma al
chmod o+r dosya      # diğerlerine okuma ekle
chmod a+x dosya      # herkese çalıştırma ekle (a = all)
chmod 777 klasör     # herkese tam yetki (rwxrwxrwx)
chmod 755 dosya      # rwxr-xr-x
```

**Sayısal mod:**

| Sayı | İzin |
|---|---|
| 7 | rwx |
| 6 | rw- |
| 5 | r-x |
| 4 | r-- |
| 0 | --- |

```bash
chmod 777 /tmp/mydir    # herkese tam yetki — geçici çalışma dizinleri için
chmod 644 dosya         # sahibi okur/yazar, diğerleri sadece okur
```

---

## SUID — Set User ID

**SUID biti:** Bir binary çalıştırıldığında, çalıştıran kullanıcının değil **dosyanın sahibinin** yetkileriyle çalışır.

```
ls -la çıktısında SUID:

-r-sr-x---  1  leviathan2  leviathan1  7452  check
      ^
      s → SUID biti set edilmiş (normalde x olurdu)
```

**`s` harfinin anlamı:**
- Küçük `s` → SUID + çalıştırma izni var
- Büyük `S` → SUID var ama çalıştırma izni yok (işlevsiz)

**Neden önemli?**  
Leviathan'daki binary'ler SUID'li ve sahibi bir sonraki level'ın kullanıcısıdır. Binary'yi çalıştırınca o kullanıcının yetkileriyle işlem yapılır → şifre dosyasına erişilebilir.

```bash
# SUID binary'leri bul
find / -perm -u=s -type f 2>/dev/null
find / -perm /4000 -type f 2>/dev/null    # aynı şey, farklı sözdizimi
```

---

## find -perm — İzne Göre Dosya Arama

```bash
find [nereden] -perm [mod]
```

| Kullanım | Anlamı |
|---|---|
| `-perm 4755` | tam olarak bu izin setine sahip |
| `-perm -4000` | SUID biti set edilmiş (diğer bitler fark etmez) |
| `-perm /4000` | aynı — GNU find'da tercih edilen sözdizimi |
| `-perm -u=s` | sahibi için SUID set edilmiş |

```bash
# Sistemdeki tüm SUID binary'leri listele, hata çıktılarını gizle
find / -perm -u=s -type f 2>/dev/null

# Sadece /usr altında ara
find /usr -perm -4000 -type f 2>/dev/null
```

---

## whoami ve id — Mevcut Kullanıcıyı Öğrenme

```bash
whoami         # mevcut kullanıcı adını gösterir
id             # uid, gid ve grup üyeliklerini gösterir
```

```bash
$ whoami
leviathan1

$ id
uid=12001(leviathan1) gid=12001(leviathan1) groups=12001(leviathan1)

# SUID binary çalıştırınca:
$ ./check
password: sex
$ whoami
leviathan2     ← SUID sayesinde yetki değişti!
```

---

## Privilege Escalation (Yetki Yükseltme)

**Privilege escalation:** Düşük yetkili bir kullanıcıdan daha yüksek yetkiye sahip olmak. Leviathan'ın tüm konusu bu.

Temel yöntemler:
1. **SUID binary istismarı** — binary'nin sahibinin yetkileriyle kod çalıştırma
2. **Sembolik link saldırısı** — binary'nin okuduğu dosyayı değiştirme
3. **Kütüphane çağrısı açığı** — `ltrace` ile sızdırılan şifreler

```bash
# Şifre her zaman burada:
cat /etc/leviathan_pass/leviathan<N>
# Okumak için o kullanıcının yetkisi gerekir — SUID binary ile elde edilir.
```
