# Kaynaklar

## R700v3.txt
MIT Instrumentation Lab, Report R-700 Cilt III — "Apollo Guidance and Navigation
System" tasarım raporu. 297 sayfa, metne çevrilmiş hali. Bu projedeki bütün
donanım iddialarının birincil kaynağı.

Sık kullanılan satırlar (grep ile doğrula, satır numarası kayabilir):
- ~7578  "A stored bit is a 1 whenever a sense wire threads a core..."  (bit kodlaması)
- ~7589  "Each module contains 512 cores and 192 sense lines... 98,304 bits"
- ~7648  "Each core stores 12 words"
- ~7594  adresleme: bir set akımı 128 çekirdeği kurmaya çalışır, inhibit iptal eder
- ~7462  "The output signal from the memory cores has an amplitude of about 50 millivolts" (SİLİNEBİLİR bellek)
- ~8866  §3.9.1.5 dokuma: bant kontrollü makine kılavuzu konumlandırır, operatör elle geçirir
- ~8875  "cordwood construction" — modülün fiziksel düzeni
- ~10322 §4.2.1 "parenthesis-free pseudocode notation for economy of storage"
- ~2113  yorumlayıcının gerekçesi: "trading off execution speed against instruction repertoire"
- ~3143  "it was estimated that 4000 words would satisfy the storage requirements"

## Luminary099.binsource
Apollo 11 Ay Modülü uçuş programının ikili kaynağı. Preset kelimeleri ve
frekans iddiaları (ör. 00006 ropede 1.717 kez) buradan sayıldı.

## KALICI YASAK LİSTESİ (doğrulayıcılar çürüttü)
- "basılı desen kağıdı" — birincil kanıt YOK
- "dokumacılar tekstil sektöründendi" — yalnızca ikincil kaynak
- "LOL memory" — R-700'de sıfır geçiş
- rope çekirdeği için herhangi bir voltaj rakamı — A_e hiçbir kaynakta yok
- "1 çekirdek = 1 bit" — silinebilir belleğin hikâyesi
- "1 ile 0 dokumak eşit emek" — kaynaksız
- inhibit teli çekirdek başına 16 — doğrusu 8 (modül başına 16, tamamlayıcı çift)
