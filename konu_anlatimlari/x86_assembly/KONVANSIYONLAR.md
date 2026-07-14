# KONVANSIYONLAR — Ders Yazım Disiplini

Bu dosya, "ev stili"ni (başlık formatı, kutu sözlüğü, İçindekiler...) tamamlayan üç
**disiplin kuralı**dır. Ev stili dersin nasıl *görüneceğini* söyler; bu kurallar bir
kutunun / atfın / çerçevenin ne zaman *fazla kaçtığını* söyler. Üçü de mevcut bir
konvansiyonun uzantısıdır, yeni dogma değil.

Bağlam: saf-kavram dersleri (01, 03, 04) bu disiplini zaten tutuyor; şişme ve gürültü,
"elin klavyeye değdiği" pratik derslerde (02, 05, 06), pratik bir uyarı kutuya kuyruk
ekledikçe doğuyor. Yani Ünite 1+ boyunca bu disiplin daha çok önemli, daha az değil.

---

## 1. Kutu disiplini — "bir kutu, bir fikir"

**Kural:** Bir kutu (💡 / ⚠️ / 🔑 / Aklınıza takılabilir) tek bir soruyu, tek bir çekirdek
fikirle cevaplar. Kutu "...ve tam mekanizması şöyle" diye kuyruk büyütüyorsa, o kuyruk
üç yoldan biriyle dışarı çıkar:

- **(a) 🔑'ye indir** — kuyruk aslında akılda kalması gereken tek cümleyse.
- **(b) Sahibi-derse ertele** — kuyruk başka bir dersin asıl konusuysa, oraya *tek* bir
  ileri-atıfla bırak (kural 2'ye uysun).
- **(c) Ek'e / .5'e taşı** — birden çok böyle kuyruk birikiyorsa, dersin sonuna **Ek** ya
  da bir ara ders. (Gereksiz .5 açma; kutu ya da Ek yetiyorsa onu seç.)

**Neden:** Pusula'nın ("yerinde kutu mu, ileri-not mu") kutu içine uzantısı. Hedef "sıfırdan
biri"; bir kutudan beş yarım-tutulmuş fikirle çıkması, ana metnin koruduğu "tek seferde tek
fikir" disiplinini kırar.

**Şablon (doğru):** 03'ün "byte neden 8 bit"i — ana metinde kutu sadece *işaret ediyor*
("sebebini sonda açıyoruz"), tam hikâye sondaki **Ek**'te. 04'ün "E nereden gelir" Ek'i aynı.

**Anti-örnek (düzeltilecek):** 06'nın two's-complement kutusu — tek kutuda taşma + iki yön +
isim + 09 + 10. Gözlemlenebilir gerçek kalır; mekanizma tek atıfa iner.

---

## 2. İleri-atıf litmus'u

**Kural:** Her ileri-atıf (→ sonraki ders) iki testten birini geçmeli:

- **Kaygı söndürür:** "bu neden burada açıklanmadı?" sorusunu kapatır ("merak etme, X'te tam
  açacağız").
- **Motive eder:** "şu soyut şey X'te işine yarayacak" diye okuru ileri çeker.

İkisini de geçmiyor, sadece "X'i sonra göreceğiz" envanteriyse → **sil.** Okurun henüz "08"
diye bir zihin klasörü yok; boş atıf sadece "işte bilmediğin bir şey daha" der — "korkma"
hedefinin tersi.

**Geriye-atıf serbest:** zaten sahip olunan bilgiye işaret eder, hep güvenli.

**Doğru:** 03 → 07 ("GDB'de ekran şöyle dolu olacak") motive eder. 01'in önizleme tablosu
yol haritası olduğu için meşru. **Anti-örnek:** tek kutuda üç bare atıf (06) → bire indir.

---

## 3. "Büyü" kuralı

**Kural:** Açıklanabilir-ama-şimdilik-ertelenmiş bir mekanizmaya **"büyü / sihir"** deme.
Yerine: **"şimdilik kapalı kutu, X'te açacağız."** Çünkü 00 pitch'i "araya sihir, gizli iş,
görünmeyen kurallar girmez" üzerine kurulu; bir mekanizmaya "büyü, güven" demek bu vaadi çürütür.

**İstisna — hayranlık serbest:** "büyü"yü sonucun *şaşırtıcılığı* için kullanmak sorun değil
(01: "tüm büyü bu hızdan çıkar", "süpergüç"). Bu zaten gizemi *söküyor.* Yasak olan,
**mekanizmayı** gizem gibi sunmak.

**Düzeltilecek:** 05'in açılışı + üç çıkış satırını "büyü" diye sunması; 06'nın açılışı
("üç satır 'büyü'ydü"). İkisi "kapalı kutu"ya çevrilir.

---

## Ders yazarken / düzenlerken checklist

```
☐ Her kutu tek soru + tek fikir mi? Kuyruk varsa → 🔑 / ertele / Ek-.5.
☐ Her ileri-atıf kaygı söndürüyor ya da motive ediyor mu? Yoksa sil.
☐ "Büyü/sihir" sadece hayranlık için mi? Mekanizma için ise "kapalı kutu"ya çevir.
☐ (Playtest) Sıfırdan okuyucu bir kutudan tek net fikirle mi çıkıyor, beş yarımla mı?
```

---

*Bu dosya [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) reposunun
bir parçasıdır; "ev stili" ile birlikte okunur.*
