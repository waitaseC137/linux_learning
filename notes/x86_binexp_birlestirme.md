# x86 Kursu ↔ Binary Exploitation Birleştirme Planı

> **Durum:** Faz 1 uygulandı (2026-07-14). Faz 2–4 kurs büyüdükçe.
> **Kritik kısıt:** `x86_assembly/` kursu **YARIM ve devam ediyor** — şu an 00–06 (Ünite 0 + ilk `mov` programı) yazılı; 07–20 yol haritasında ama henüz yazılmadı. Bu yüzden plan **eklemeli + aşamalı**: hiçbir adım repoyu bozmaz, kursu bitmiş gibi sunmaz, kurs büyüdükçe kendiliğinden entegre olur.

## Temel ilke
- **`x86_assembly/`** = kanonik, sıfırdan, derin **assembly katmanı** (makineyi kur, asm *yaz*).
- **`binary_exploitation/`** = onu *kullanan* exploitation katmanı.
- Kurs yazılıyor → binexp'in mevcut asm primer'ı **hemen silinmez** (kurs daha jmp/stack/call/syscall'a gelmedi; silsek boşluk olur). Rol devri kademeli.

## Rol bölüşümü (assembly'ye üç kapı)
| Dosya | Rol |
|---|---|
| `x86_assembly/` (kurs) | "Sıfırdan, derin yol — asm *yaz*." (yavaş = hızlı) |
| binexp `00a_assembly_bilmeden_giris` | "Hızlı on-ramp — asm'siz, C mantığıyla başla." |
| binexp `00_x86_assembly_temelleri` | ŞİMDİLİK kalır (kompakt referans/cheat-sheet). |

Üçü de birbirine linkli (Faz 1'de eklendi).

## Faz 1 — ŞİMDİ (uygulandı)
- [x] `~/Desktop/x86/` → `konu_anlatimlari/x86_assembly/` taşındı (00–06 + .5'ler + KONVANSIYONLAR).
- [x] `00_buradan_basla` "🚧 yazım aşamasında" banner'ı + 07–20 linkleri linksizleştirildi (`🚧`, 404 önlendi).
- [x] Çapraz linkler: binexp `00_buradan_basla` / `00_x86_assembly_temelleri` / `00a` → x86 kursuna; x86 `00` → binexp'e.
- [x] Site: `konular-data.js`'e `x86_assembly` kategorisi (yalnız yazılı 10 ders, tag "🚧 yazılıyor"); `KONU_ANLATIMLARI.md` bölümü; `index.html` hero "6 Konu Başlığı" + tree satırı.
- [x] `sync-docs.sh` → `docs/`'a yansıdı. **eng: YOK (kurs TR-only başlar; çeviri sonraki iş).**

## Faz 2 — kurs 07–13 yazılınca (mov/mem, aritmetik, flags, jumps, loops, bitwise)
- `konular-data.js` x86 kategorisine yeni dersleri ekle + banner'daki "yazılı" aralığını güncelle.
- binexp `00_x86_assembly_temelleri`'nin ilgili konularına "artık x86 kursunda detaylı" notu → **incelme başlar.**

## Faz 3 — kurs 14–18 yazılınca (stack, call/ret, calling convention, syscall)
- binexp `00_x86` tam **"hatırlatma kartı"na** döner; öğretmen rolü tümüyle x86 kursuna geçer.

## Faz 4 — kurs 19–20 (C köprüsü, "buradan nereye") + tam kavis
- x86 kursu → binexp doğrudan zincir.
- Büyük kavise bağ: **kapı→CPU (NandGame/salterden-bilgisayara) → x86 kursu (emir ver) → binexp (emri bük) → OverTheWire (pratik).**

## Kurs büyürken bozulmama garantisi
`sync-docs.sh` zaten `konu_anlatimlari/`'yı kapsıyor. Yeni ders eklemek için: **dosyayı koy → `konular-data.js`'e tek satır → 00'daki 🚧 link'i aç → sync.** Bu kadar.

## Açık uçlar
- eng çevirisi (kurs TR-only).
- Kurs tamamlanınca binexp `00_x86` + `00a`'nın nihai kaderi (silme vs cheat-sheet) — Faz 3'te netleşir.
