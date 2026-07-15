# Vortex'e Başlamadan Önce Okuyunuz — Ön Hazırlık & Konu Rehberi

> Bu doküman, OverTheWire **Vortex** wargame'ine başlamadan önce hangi konulara hâkim
> olman gerektiğini anlatır. Vortex, **32-bit x86 Linux binary exploitation** oyunudur ama
> ilginç biçimde **ağ/soket programlamayla başlar** (27 seviye: vortex0 → vortex26). Narnia/
> Behemoth'un aksine tek bir kalıbı değil, **klasik ikili istismar müfredatının tamamını**
> dolaşır: overflow, format string, heap, ret2libc/ROP, sonra kriptanaliz + RE/keygen.
> (Bu doküman **çözüm içermez** — yalnızca ön-bilgi ve arazi haritası.)

---

## 0. Vortex nedir, ne bekler?

- **Giriş farklı:** vortex0 SSH değil, **`vortex.labs.overthewire.org:5842`** portuna bağlanıp bir ağ görevini çözmekle başlar; ödül olarak vortex1 kimliğini verir.
- **Sonrası SSH:** `ssh vortexN@vortex.labs.overthewire.org -p 2228` (⚠️ **2228**, 2223 değil — o Leviathan).
- Sunucu **32-bit x86, little-endian**. Dosyalar `/vortex/` altında; her seviye programı `-r-sr-x---` (bir sonraki kullanıcıya **setuid**).
- Hedef parola `/etc/vortex_pass/vortexN` (yalnız o kullanıcı okur) → programı istismar edip o yetkiyle okutmak genel mantık.
- **Kaynak kod çoğu seviyede VERİLMEZ** → binary'yi `objdump`/`gdb` ile kendin sökersin. "Assembly öğretir" demesinin somut sebebi bu.
- **Önkoşul wargame'ler:** Bandit → Narnia → Behemoth → Utumno (sonra Vortex). Zorluk ~6/10 ama **konu yelpazesi** çok geniş.

**Sürpriz uyarısı:** "ileri bellek-bozma" (heap/ROP) beklediğin üst yarıda **değil**, orta bölgede (8–13) toplanır. Üst yarı (14–26) daha çok **kriptanaliz + tersine mühendislik + keygen**.

---

## 1. Seviye Haritası (kavramsal — çözüm değil)

| # | Tema | Anahtar kavram |
|---|------|----------------|
| 0 | **Ağ + endianness** | soket istemcisi; 4×uint32'yi **host byte order** (little-endian) oku/topla/gönder |
| 1 | **Sınırsız işaretçi** | `ptr` decrement (sınır yok) → kendi üstüne yaz → gömülü shell koşulu |
| 2 | **Argüman enjeksiyonu** | setuid program kullanıcı argümanını `tar`'a operand geçirir |
| 3 | **Shellcode + setuid** | stack overflow; kabuk yetki düşürür → shellcode'da `setresuid` |
| 4 | **Format string** | `%x` sızdır / `%n` yaz; argc kontrolü kıvrımı; GOT overwrite |
| 5 | **Kripto brute** | kısa (5 karakter) MD5 kaba kuvvet |
| 6 | **Tersine mühendislik** | kaynak yok → disassemble edip deliği kendin bul |
| 7 | **CRC32 ters çevirme** | hedef checksum'a ulaşacak girdi üret |
| 8 | **Dinamik link / PLT-GOT** | dinamik bağlı binary analizi + fonksiyon işaretçisi |
| 9 | **NX / ret2libc** (resmî açıklama yok → kendin doğrula) | çalıştırılamaz stack'i kod-yeniden-kullanımıyla aş |
| 10 | **PRNG seed** | 20 sayıdan tohumu geri bul (30 sn sınır) |
| 11 | **Heap** | phkmalloc (OpenBSD) metadata bozma |
| 12 | **NX bypass** | ret2libc / ROP |
| 13 | **ROP + boyut kısıtı** | NX + çok küçük alana sığan payload |
| 14 | **Zayıf akış şifresi** | RC4-tipi + trafik analizi |
| 15 | **Known-plaintext** | 8-byte A–Z anahtar brute + dosya imzası doğrulama |
| 16 | **Kısmi anahtar** | 128-bit anahtarın 100 biti verili, ~28 biti brute |
| 17 | **Working backwards** | hedef verilmez; kara-kutu gözlemden zafiyeti çıkar |
| 18 | **Öngörülebilir tohum** | zayıf `urandom`/PRNG seeding |
| 19 | **Keygen** | zayıf binary şifrelemeyi çözüp anahtar üreteci yaz |
| 20 | **Integer overflow** | uzaktan tamsayı sınır hatası |
| 21 | **Reverse-me** | encryptor'ı anlayarak çöz |
| 22 | **Object analiz** | `.o` dosyalarından doğrulama mantığı → keygen |
| 23 | **"Mirror"** (belirsiz) | başlık ipucu; bağımsız araştırma |
| 24 | **glibc `random_r`** | RNG iç durumundan tohumu geri hesapla |
| 25 | **KAYIP** | artık aktif değil (24→26 köprü) |
| 26 | **Meta-final** | kendi seviyeni + exploit'ini yaz (bitiş) |

> Son teknik seviye pratikte **24** (25 kayıp, 26 meta). vortex9/23 resmî açıklaması yok → kutuda kendin doğrula.

---

## 2. Ağ & Byte Sırası — vortex0'ın kalbi

- **host byte order** = makinenin doğal sırası (x86 → **little-endian**); **network byte order** = big-endian. `htonl`/`ntohl` bu ikisini çevirir.
- Ham soket: `recv` az byte dönebilir → döngüyle tamamla; `struct.pack/unpack` (`<`=little) ile ikili veri yorumla/paketle.
- 32-bit taşma: 4 sayının toplamı 32-bit'i aşar → `& 0xFFFFFFFF` (mod 2³²).

## 3. x86 (32-bit) Assembly & Bellek

- **Stack frame:** `push ebp; mov ebp,esp`; lokaller `ebp-N`, kaydedilmiş dönüş adresi `[ebp+4]`. Overflow mesafesi (offset) bu düzenden hesaplanır.
- **Calling convention (cdecl):** argümanlar sağdan sola stack'e; çağıran temizler. Format-string ve ret2libc'de belirleyici.
- **Register'lar:** EAX (dönüş), EBP/ESP (çerçeve), EIP (hedef). Adresler 4-byte **little-endian**.
- **Syscall:** `int 0x80` + EAX (no) / EBX,ECX,EDX (arg). (64-bit'teki `syscall`+RDI/RSI **değil**.)
- Okuma: `objdump -d -M intel`, `pwndbg`/`gdb` (breakpoint, `x/`, `info registers`).

## 4. Shellcode

- `execve("/bin/sh")` (32-bit), string'e gömülüyorsa **null-free** olmalı (`strcpy` 0x00'da keser → xor ile register sıfırlama).
- setuid seviyelerinde kabuk yetki düşürebilir → shellcode'da `setreuid/setresuid(geteuid())`.
- `pwntools`: `asm(...,arch='i386')`, `shellcraft.i386.linux.sh()`, `cyclic`/`cyclic_find` (offset).

## 5. Kriptanaliz & RNG (üst yarı)

- Kısa/zayıf hash (MD5), zayıf akış şifresi (RC4), known-plaintext, kısıtlı-keyspace brute.
- **PRNG zafiyeti** üçlüsü (10, 18, 24): çıktıdan tohum/durum geri hesaplama; glibc `random_r` iç yapısı.
- RE/keygen: `objdump`/`radare2` ile doğrulama algoritmasını çıkarıp tersine kodlama.

## 6. Güvenlik Korumaları — her seviyede ÖNCE bak

| Koruma | Kontrol | Etkisi |
|--------|---------|--------|
| NX/DEP | `checksec`, `readelf -l` GNU_STACK | kapalı → shellcode; açık → ret2libc/ROP |
| Canary | `checksec` | overflow stratejisi (Vortex'te bazı seviyelerde var) |
| ASLR | genelde deterministik değil → seviyeye göre teyit et | adres bulma |

---

## 7. Araçlar

`ssh`, `nc`, `python3` (soket + `struct`), `objdump -d -M intel`, `readelf`, `nm`, `strings`,
`gdb`/`pwndbg`, `strace`/`ltrace`, `gcc -m32`, `nasm`, `pwntools` (`ssh`/`process`/`p32`/`asm`/`cyclic`/`ROP`),
`ropper`/`ROPgadget` (ROP), `radare2` (RE/keygen).

## 8. "Hazır mıyım?" Kontrol Listesi

- [ ] Bir TCP soket istemcisi yazıp **host vs network byte order** farkını uygulayabiliyorum
- [ ] 32-bit stack frame + `objdump` disasm okuyabiliyorum (kaynak verilmez!)
- [ ] null-free `execve` shellcode + setuid yetki-düşmesini (`setresuid`) biliyorum
- [ ] format string `%n` / GOT overwrite mantığını uygulayabiliyorum
- [ ] NX'i ret2libc / ROP ile aşmayı biliyorum (ropper/ROPgadget)
- [ ] heap (phkmalloc) ve PRNG-seed geri hesaplama kavramlarını duydum
- [ ] `radare2`/`objdump` ile keygen için algoritma çıkarabiliyorum

Çoğuna "evet" diyorsan Vortex'e hazırsın. "Hayır"ların varsa önce **Narnia + Behemoth**'u pekiştir.

---

> Bu rehber yalnızca **konu/önbilgi** listesidir, çözüm içermez. OverTheWire, çözümlerin
> web'de yayınlanmamasını rica eder — bu notlar kişisel çalışman içindir. Şifreler bu repoda
> her zaman **maskeli** (`**********`) tutulur.
