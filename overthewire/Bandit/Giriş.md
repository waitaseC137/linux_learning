# Giriş

OverTheWire, "güvenlik kavramlarını eğlence dolu oyunlar şeklinde öğrenmek ve uygulamak için" ücretsiz bir çevrimiçi platformdur. Her biri güvenliğin bir alanıyla ilgilenen ve "Savaş Oyunları" olarak adlandırılan farklı oyunlara sahiptir.

Tavsiye edilen ilk oyunun adı Bandit. İlk olarak tavsiye ediliyor çünkü "diğer savaş oyunlarını oynayabilmek için gereken temel bilgileri" öğretiyor. Bu temel Linux ve Git komutlarını içeriyor.

Seviyeler boyunca çalıştım ve blogum için bir yol gösterici yazmaya karar verdim. İnternette zaten farklı kişilerden ve farklı çözümlerle hazırlanmış kılavuzlar var. Yine de, en azından yazma konusunda daha rahat olmak ve belki de açıklamalarım ve düşünce süreçlerim diğer yazarlardan farklı olabileceğinden, birilerinin çözümleri daha iyi anlamasına yardımcı olmak için benimkini yayınlamaya karar verdim. Ayrıca, bu şekilde gelecekteki ben de geriye dönüp bakabileceğim bir referansa sahip olacağım.

Önemli kavramları kısaca açıklamaya çalışacağım, ancak bunlar hakkında her zaman öğrenebileceğimiz daha çok şey var. Oyunun ve benim sizi teşvik edeceğimiz şey, kendi başınıza araştırma yapmanızdır.

Harika, artık bu makalenin ne hakkında olduğunu ve bunu neden yaptığımı bildiğinize göre, Seviye 0'ın izlenecek yolu ile başlayalım.

Görev
SSH ile seviyeye giriş yapın.

Sunucu: [bandit.labs.overthewire.org](http://bandit.labs.overthewire.org/)

Bağlantı Noktası: 2220

Kullanıcı adı: bandit0

Şifre: bandit0

Bu seviye, Güvenli Kabuk Protokolü'nün kısaltması olan SSH'yi kullanmanızı ister. Bir makineye uzaktan bağlanmak için kullanılır. Adından da anlaşılacağı gibi, bu protokol makineler arasında güvenli iletişimi amaçlar.

Linux ile çalışırken, ssh komutunu kullanarak bir terminal aracılığıyla bir makineye ssh yapabilirsiniz. Neredeyse tüm Linux komutlarında olduğu gibi, bu komut ve seçenekleri hakkında daha fazla bilgi edinmek istiyorsanız man komutunu (man ssh) kullanabilirsiniz.

Windows ile PuTTY gibi bir yazılım kullanabilirsiniz.

Bu çok yaygın bir hizmettir. Aslında o kadar yaygındır ki kendi standart portu olan Port 22'ye atanmıştır. Bağlantı noktası, bilgisayarınızın hangi hizmete erişmesi gerektiğini bilmesini sağlayan bir uç noktadır - bir tür ofis oda numaraları gibi, böylece konuşmanız gereken kişinin hangi odada olduğunu bilirsiniz.

Bu kavramlar hakkında internette çok daha fazla bilgi bulabilirsiniz. Bunlara hiç aşina değilseniz, bunlar ve diğer bazı temel kavramlar hakkında daha iyi bir genel bakış elde etmek için bulabileceğiniz bir ağa giriş videosunu izlemenizi tavsiye ederim.

Makineye ssh ile girmek için bir Linux terminali kullandım. Bu seviye için bakmamız gereken ssh komutunun temel komut yapısı aşağıdaki gibidir:

ssh <kullanıcı adı>@<sunucu> -p <port>

Açılı tırnak işareti olan kısımların doğru bilgilerle değiştirilmesi gerekir. <server> geçerli bir URL ya da doğru IP adresi ile değiştirilebilir. Eğer standart port 22'ye bağlanırsak -p <port> kısmını eklememize gerek kalmaz.

İhtiyacınız olan bilgiler görev açıklamasında yer almaktadır. Bu, aşağıdaki komuta yol açar:

ssh [bandit0@bandit.labs.overthewire.org](mailto:bandit0@bandit.labs.overthewire.org) -p 2220

Komutu çalıştırdığınızda, sizden parola istenecektir, bunu yazabilirsiniz (Linux altında parola yazıldığında görüntülenmez).

[bandit0@bandit.labs.overthewire.org](mailto:bandit0@bandit.labs.overthewire.org)'un parolası:

Doğru parolayı yazdıysanız, artık uzak makinede oturum açmış olmanız ve oyun hakkında daha fazla bilgi içeren bir Hoş Geldiniz metni görmeniz gerekir.

Görev sadece oturum açmak olduğu için, bu seviye 0'ı sonlandırır.