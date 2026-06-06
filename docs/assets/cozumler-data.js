/* ============================================================
   Wargame Çözümleri — içerik ağacı
   base: overthewire/
   konular.js'i besler (window.READER_DATA)
   ============================================================ */
window.READER_DATA = {
  base: "overthewire/",
  rootLabel: "overthewire",
  title: "Wargame Çözümleri",
  unit: "bölüm",
  intro: "OverTheWire wargame'lerinin level-by-level çözüm rehberleri — <b style=\"color:var(--fg)\">yöntem anlatılır, şifre paylaşılmaz.</b> Bir wargame seç, kaldığın level'a git. Hepsi site içinde.",
  categories: [
    {
      id: "bandit", label: "Bandit", accent: "var(--d-low)", tag: "Zorluk 1/10 · 34 level",
      blurb: "Linux terminal temelleri — SSH, dosya okuma, izinler, temel araçlar.",
      files: [
        { f: "bandit/bandit_0-10.md",  n: "0–10",  t: "Level 0 → 10",  h: "ssh, cat, file, find, grep" },
        { f: "bandit/bandit_11-20.md", n: "11–20", t: "Level 11 → 20", h: "rot13, base64, nc, openssl, ssh key" },
        { f: "bandit/bandit_21-33.md", n: "21–33", t: "Level 21 → 33", h: "cron, git, setuid, shell escape" }
      ]
    },
    {
      id: "leviathan", label: "Leviathan", accent: "var(--d-mid)", tag: "Zorluk 3/10 · 8 level",
      blurb: "Binary analizi ve basit exploit — ltrace/strace, SUID, symlink.",
      files: [
        { f: "leviathan/leviathan_0-7.md", n: "0–7", t: "Level 0 → 7", h: "ltrace, strace, suid, symlink, gdb" }
      ]
    },
    {
      id: "krypton", label: "Krypton", accent: "var(--d-mid)", tag: "Zorluk 3/10 · 7 level",
      blurb: "Kriptografi — Caesar, Vigenère, frekans analizi, XOR.",
      files: [
        { f: "krypton/krypton_0-6.md", n: "0–6", t: "Level 0 → 6", h: "caesar, rot, vigenere, frekans, xor" }
      ]
    },
    {
      id: "natas", label: "Natas", accent: "var(--d-mid)", tag: "Zorluk 4/10 · 35 level",
      blurb: "Web güvenliği — HTTP, kaynak analizi, SQLi, XSS, file inclusion.",
      files: [
        { f: "natas/natas_0-10.md",  n: "0–10",  t: "Level 0 → 10",  h: "kaynak kodu, http, cookie, lfi" },
        { f: "natas/natas_11-20.md", n: "11–20", t: "Level 11 → 20", h: "xor, sql injection, command injection" },
        { f: "natas/natas_21-34.md", n: "21–34", t: "Level 21 → 34", h: "session, type juggling, phar, log poison" }
      ]
    },
    {
      id: "narnia", label: "Narnia", accent: "var(--d-high)", tag: "Zorluk 6/10 · 10 level",
      blurb: "Binary exploitation — buffer overflow, format string, shellcode.",
      files: [
        { f: "narnia/narnia 0 -> 1.md", n: "0→1", t: "Level 0 → 1", h: "buffer overflow temel" },
        { f: "narnia/narnia 1 -> 2.md", n: "1→2", t: "Level 1 → 2", h: "shellcode, env" },
        { f: "narnia/narnia 2 -> 3.md", n: "2→3", t: "Level 2 → 3", h: "stack overflow" },
        { f: "narnia/narnia 3 -> 4.md", n: "3→4", t: "Level 3 → 4", h: "dosya, fd" },
        { f: "narnia/narnia 4 -> 5.md", n: "4→5", t: "Level 4 → 5", h: "ret adresi" },
        { f: "narnia/narnia 5 -> 6.md", n: "5→6", t: "Level 5 → 6", h: "format string" },
        { f: "narnia/narnia 6 -> 7.md", n: "6→7", t: "Level 6 → 7", h: "fonksiyon pointer" },
        { f: "narnia/narnia 7 -> 8.md", n: "7→8", t: "Level 7 → 8", h: "got overwrite" },
        { f: "narnia/narnia 8 -> 9.md", n: "8→9", t: "Level 8 → 9", h: "ileri exploit" }
      ]
    },
    {
      id: "behemoth", label: "Behemoth", accent: "var(--d-high)", tag: "Zorluk 7/10 · 9 level",
      blurb: "Orta seviye exploit — heap, ret-to-libc, GOT/PLT, pwntools.",
      files: [
        { f: "behemoth/behemoth 0 -> 1.md", n: "0→1", t: "Level 0 → 1", h: "şifre çözme" },
        { f: "behemoth/behemoth 1 -> 2.md", n: "1→2", t: "Level 1 → 2", h: "buffer overflow" },
        { f: "behemoth/behemoth 2 -> 3.md", n: "2→3", t: "Level 2 → 3", h: "symlink, temp dosya" },
        { f: "behemoth/behemoth 3 -> 4.md", n: "3→4", t: "Level 3 → 4", h: "format string" },
        { f: "behemoth/behemoth 4 -> 5.md", n: "4→5", t: "Level 4 → 5", h: "dosya okuma" },
        { f: "behemoth/behemoth 5 -> 6.md", n: "5→6", t: "Level 5 → 6", h: "network, nc" },
        { f: "behemoth/behemoth 6 -> 7.md", n: "6→7", t: "Level 6 → 7", h: "pipe, shellcode" },
        { f: "behemoth/behemoth 7 -> 8.md", n: "7→8", t: "Level 7 → 8", h: "env, ret-to-libc" }
      ]
    },
    {
      id: "utumno", label: "Utumno", accent: "var(--d-max)", tag: "Zorluk 9/10 · 8 level",
      blurb: "İleri exploit — ROP, heap exploitation, ASLR/PIE bypass.",
      files: [
        { f: "utumno/00 - Utumno - BAŞLAMADAN ÖNCE OKUYUNUZ.md", n: "!", t: "Başlamadan Önce Oku", h: "kurulum, ortam, pwntools, uyarılar" },
        { f: "utumno/utumno 0 -> 1.md", n: "0→1", t: "Level 0 → 1", h: "stack overflow" },
        { f: "utumno/utumno 1 -> 2.md", n: "1→2", t: "Level 1 → 2", h: "shellcode" },
        { f: "utumno/utumno 2 -> 3.md", n: "2→3", t: "Level 2 → 3", h: "rop temel" },
        { f: "utumno/utumno 3 -> 4.md", n: "3→4", t: "Level 3 → 4", h: "heap" },
        { f: "utumno/utumno 4 -> 5.md", n: "4→5", t: "Level 4 → 5", h: "format string ileri" },
        { f: "utumno/utumno 5 -> 6.md", n: "5→6", t: "Level 5 → 6", h: "aslr bypass" },
        { f: "utumno/utumno 6 -> 7.md", n: "6→7", t: "Level 6 → 7", h: "pie bypass" },
        { f: "utumno/utumno 7 -> 8.md", n: "7→8", t: "Level 7 → 8", h: "rop chain" }
      ]
    },
    {
      id: "maze", label: "Maze", accent: "var(--cyan)", tag: "Bonus · 9 level",
      blurb: "Ek wargame — C++ binary'leri, vtable ve nesne yönelimli exploit.",
      files: [
        { f: "maze/00 - Maze - BAŞLAMADAN ÖNCE OKUYUNUZ.md", n: "!", t: "Başlamadan Önce Oku", h: "kurulum, c++, vtable, uyarılar" },
        { f: "maze/maze 0 -> 1.md", n: "0→1", t: "Level 0 → 1", h: "c++ binary" },
        { f: "maze/maze 1 -> 2.md", n: "1→2", t: "Level 1 → 2", h: "vtable" },
        { f: "maze/maze 2 -> 3.md", n: "2→3", t: "Level 2 → 3", h: "nesne" },
        { f: "maze/maze 3 -> 4.md", n: "3→4", t: "Level 3 → 4", h: "heap" },
        { f: "maze/maze 4 -> 5.md", n: "4→5", t: "Level 4 → 5", h: "pointer" },
        { f: "maze/maze 5 -> 6.md", n: "5→6", t: "Level 5 → 6", h: "overflow" },
        { f: "maze/maze 6 -> 7.md", n: "6→7", t: "Level 6 → 7", h: "ileri" },
        { f: "maze/maze 7 -> 8.md", n: "7→8", t: "Level 7 → 8", h: "ileri" },
        { f: "maze/maze 8 -> 9.md", n: "8→9", t: "Level 8 → 9", h: "final" }
      ]
    }
  ]
};
