# Level 0

Giriş
SSH: ssh [bandit0@bandit.labs.overthewire.org](mailto:bandit0@bandit.labs.overthewire.org) -p 2220

Şifre: bandit0

Görev 

- Bir sonraki seviyenin şifresi, ev dizininde bulunan benioku adlı bir dosyada saklanır.

SSH ile bir makineye belirli bir kullanıcı olarak giriş yaparsanız, o kullanıcının ev dizinine girersiniz.

Bir önceki seviyenin anlatımında man komutundan kısaca bahsetmiştim. Bu komut size bir komut hakkında hangi ek bilgilerin gerekli olduğu (örn. ssh giriş bilgisi) ve olası bayraklar (örn. ssh için portu belirtmek için -p) gibi daha fazla bilgi verir. Bu seviyede, dosya sistemi ile etkileşim kurmak için temel Linux komutlarını öğrenmeye başlayacaksınız.

`ls` Geçerli klasördeki dosyaları listeler (klasör belirtilmemişse). Bu komut için bilinmesi gereken iki isteğe bağlı bayrak, dosyaları uzun bir liste biçiminde yazdıran `-l`(bir dosya hakkında ek bilgi) ve gizli dosyaları da gösteren `-a`'dır.
`cat` Dosyaları sırayla okur ve standart çıktıya yazar ya da başka bir deyişle dosyaların içeriğini konsola yazdırır.

Çözüm
Yukarıdaki bilgilerle SSH üzerinden giriş yapıyoruz. `ls` ile bulunduğumuz dizini kontrol ediyoruz

Daha sonra, benioku dosyasının gerçekten klasörde olduğundan emin olabiliriz.

```jsx
bandit0@bandit:~$ ls
readme
```

Durum böyle olduğu için, bir dosyanın içeriğini aşağıdaki komut sözdizimiyle yazdırabiliriz: cat <dosya>.

```jsx
bandit0@bandit:~$ cat readme
boJ9jbbUNNfktd78OOpsqOltutMc3MY1
```

Elde edilen dize 'bandit1' kullanıcısının parolasıdır.