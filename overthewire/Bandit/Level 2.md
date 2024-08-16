# Level 2

Giriş
SSH: ssh [bandit2@bandit.labs.overthewire.org](mailto:bandit2@bandit.labs.overthewire.org) -p 2220

Şifre: CV1DtqXWVFXTvM2F0k09SHz0YwRINYA9

Görev

- Bir sonraki seviye için şifre, ev dizininde bulunan bu dosya adındaki boşluk adlı bir dosyada saklanır.

Önceki seviyede olduğu gibi, bir dosya adına (ve bir dizin adına) boşluk eklemek alışılmadık bir durumdur ve uygulamaya aykırıdır. Bunun yerine, bir alt çizgi (_) veya bir tire (-) kullanabilirsiniz.

Bunun nedenini çözümün ilk bölümünde görebilirsiniz. Bir komutta, boşluklar komuta yeni bir ekleme yapıldığını gösterir. Örneğin (çözümde), metin çıktısı almak için birden fazla dosya adı alabilen cat komutunu kullanıyoruz. Ve bu dosya adları boşluk ile ayrılacaktır. Çözümde görülebileceği gibi, 'spaces in this filename' adlı dosyadan metin çıktısı almak yerine, 'spaces', 'in', 'this', 'filename' adlı dört dosya arar.

Boşluk içeren bir dosya veya dizinle karşılaşmanız durumunda, kelimelerin birlikte tek bir isme ait olduğunu belirtmeniz gerekir. Bu, bölümün çözümünde görüldüğü gibi tırnak işaretleriyle (tek veya çift) yapılabilir.

Çözüm
Önceki seviyeye benzer şekilde, sadece dosya adını kullanmaya çalışmak işe yaramaz:

```bash
bandit2@bandit:~$ cat spaces in this filename
cat: spaces: No such file or directory
cat: in: No such file or directory
cat: this: No such file or directory
cat: filename: No such file or directory
```

Bunun nedeni, dört dosyaya (veya dizine) baktığımızı varsaymasıdır, ancak bunlar mevcut değildir.

Bunun yerine, tümünün tek bir dosyanın adına ait olduğunu belirtmek için isimleri tırnak işaretleriyle (tek veya çift) boşluklarla çevrelememiz gerekir:

```bash
bandit2@bandit:~$ cat "spaces in this filename"
XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
