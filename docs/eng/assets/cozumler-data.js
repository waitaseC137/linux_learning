/* ============================================================
   Wargame Writeups — content tree (English)
   base: overthewire/
   feeds konular.js (window.READER_DATA)
   ============================================================ */
window.READER_DATA = {
  base: "overthewire/",
  rootLabel: "overthewire",
  title: "Wargame Writeups",
  unit: "parts",
  intro: "Level-by-level walkthroughs of the OverTheWire wargames — <b style=\"color:var(--fg)\">the method is explained, passwords are not shared</b> (except Krypton, where the password is the decryption output). Pick a wargame, jump to the level you're on. All readable inside the site.",
  categories: [
    {
      id: "bandit", label: "Bandit", accent: "var(--d-low)", tag: "Difficulty 1/10 · 34 levels",
      blurb: "Linux terminal basics — SSH, reading files, permissions, basic tools.",
      files: [
        { f: "bandit/bandit_0-10.md",  n: "0–10",  t: "Level 0 → 10",  h: "ssh, cat, file, find, grep" },
        { f: "bandit/bandit_11-20.md", n: "11–20", t: "Level 11 → 20", h: "rot13, base64, nc, openssl, ssh key" },
        { f: "bandit/bandit_21-33.md", n: "21–33", t: "Level 21 → 33", h: "cron, git, setuid, shell escape" }
      ]
    },
    {
      id: "leviathan", label: "Leviathan", accent: "var(--d-mid)", tag: "Difficulty 3/10 · 8 levels",
      blurb: "Binary analysis and simple exploits — ltrace/strace, SUID, symlink.",
      files: [
        { f: "leviathan/leviathan_0-7.md", n: "0–7", t: "Level 0 → 7", h: "ltrace, strace, suid, symlink, gdb" }
      ]
    },
    {
      id: "krypton", label: "Krypton", accent: "var(--d-mid)", tag: "Difficulty 3/10 · 7 levels",
      blurb: "Cryptography — Caesar, Vigenère, frequency analysis, XOR.",
      files: [
        { f: "krypton/krypton_0-6.md", n: "0–6", t: "Level 0 → 6", h: "caesar, rot, vigenere, frequency, xor" }
      ]
    },
    {
      id: "natas", label: "Natas", accent: "var(--d-mid)", tag: "Difficulty 4/10 · 35 levels",
      blurb: "Web security — HTTP, source analysis, SQLi, XSS, file inclusion.",
      files: [
        { f: "natas/natas_0-10.md",  n: "0–10",  t: "Level 0 → 10",  h: "source code, http, cookie, lfi" },
        { f: "natas/natas_11-20.md", n: "11–20", t: "Level 11 → 20", h: "xor, sql injection, command injection" },
        { f: "natas/natas_21-34.md", n: "21–34", t: "Level 21 → 34", h: "session, type juggling, phar, log poison" }
      ]
    },
    {
      id: "narnia", label: "Narnia", accent: "var(--d-high)", tag: "Difficulty 6/10 · 10 levels",
      blurb: "Binary exploitation — buffer overflow, format string, shellcode.",
      files: [
        { f: "narnia/narnia 0 -> 1.md", n: "0→1", t: "Level 0 → 1", h: "buffer overflow basics" },
        { f: "narnia/narnia 1 -> 2.md", n: "1→2", t: "Level 1 → 2", h: "shellcode, env" },
        { f: "narnia/narnia 2 -> 3.md", n: "2→3", t: "Level 2 → 3", h: "stack overflow" },
        { f: "narnia/narnia 3 -> 4.md", n: "3→4", t: "Level 3 → 4", h: "file, fd" },
        { f: "narnia/narnia 4 -> 5.md", n: "4→5", t: "Level 4 → 5", h: "return address" },
        { f: "narnia/narnia 5 -> 6.md", n: "5→6", t: "Level 5 → 6", h: "format string" },
        { f: "narnia/narnia 6 -> 7.md", n: "6→7", t: "Level 6 → 7", h: "function pointer" },
        { f: "narnia/narnia 7 -> 8.md", n: "7→8", t: "Level 7 → 8", h: "got overwrite" },
        { f: "narnia/narnia 8 -> 9.md", n: "8→9", t: "Level 8 → 9", h: "advanced exploit" }
      ]
    },
    {
      id: "behemoth", label: "Behemoth", accent: "var(--d-high)", tag: "Difficulty 7/10 · 9 levels",
      blurb: "Intermediate exploits — heap, ret-to-libc, GOT/PLT, pwntools.",
      files: [
        { f: "behemoth/behemoth 0 -> 1.md", n: "0→1", t: "Level 0 → 1", h: "password cracking" },
        { f: "behemoth/behemoth 1 -> 2.md", n: "1→2", t: "Level 1 → 2", h: "buffer overflow" },
        { f: "behemoth/behemoth 2 -> 3.md", n: "2→3", t: "Level 2 → 3", h: "symlink, temp file" },
        { f: "behemoth/behemoth 3 -> 4.md", n: "3→4", t: "Level 3 → 4", h: "format string" },
        { f: "behemoth/behemoth 4 -> 5.md", n: "4→5", t: "Level 4 → 5", h: "file reading" },
        { f: "behemoth/behemoth 5 -> 6.md", n: "5→6", t: "Level 5 → 6", h: "network, nc" },
        { f: "behemoth/behemoth 6 -> 7.md", n: "6→7", t: "Level 6 → 7", h: "pipe, shellcode" },
        { f: "behemoth/behemoth 7 -> 8.md", n: "7→8", t: "Level 7 → 8", h: "env, ret-to-libc" }
      ]
    },
    {
      id: "utumno", label: "Utumno", accent: "var(--d-max)", tag: "Difficulty 9/10 · 8 levels",
      blurb: "Advanced exploits — ROP, heap exploitation, ASLR/PIE bypass.",
      files: [
        { f: "utumno/00 - Utumno - BAŞLAMADAN ÖNCE OKUYUNUZ.md", n: "!", t: "Read Before You Start", h: "setup, environment, pwntools, warnings" },
        { f: "utumno/utumno 0 -> 1.md", n: "0→1", t: "Level 0 → 1", h: "stack overflow" },
        { f: "utumno/utumno 1 -> 2.md", n: "1→2", t: "Level 1 → 2", h: "shellcode" },
        { f: "utumno/utumno 2 -> 3.md", n: "2→3", t: "Level 2 → 3", h: "rop basics" },
        { f: "utumno/utumno 3 -> 4.md", n: "3→4", t: "Level 3 → 4", h: "heap" },
        { f: "utumno/utumno 4 -> 5.md", n: "4→5", t: "Level 4 → 5", h: "advanced format string" },
        { f: "utumno/utumno 5 -> 6.md", n: "5→6", t: "Level 5 → 6", h: "aslr bypass" },
        { f: "utumno/utumno 6 -> 7.md", n: "6→7", t: "Level 6 → 7", h: "pie bypass" },
        { f: "utumno/utumno 7 -> 8.md", n: "7→8", t: "Level 7 → 8", h: "rop chain" }
      ]
    },
    {
      id: "maze", label: "Maze", accent: "var(--cyan)", tag: "Difficulty 5/10 · 9 levels",
      blurb: "Mixed binary exploitation & RE — TOCTOU, library hijack, self-modifying code, FSOP, ELF parser, format string. Capstone.",
      files: [
        { f: "maze/00 - Maze - BAŞLAMADAN ÖNCE OKUYUNUZ.md", n: "!", t: "Read Before You Start", h: "setup, c++, vtable, warnings" },
        { f: "maze/maze 0 -> 1.md", n: "0→1", t: "Level 0 → 1", h: "c++ binary" },
        { f: "maze/maze 1 -> 2.md", n: "1→2", t: "Level 1 → 2", h: "vtable" },
        { f: "maze/maze 2 -> 3.md", n: "2→3", t: "Level 2 → 3", h: "objects" },
        { f: "maze/maze 3 -> 4.md", n: "3→4", t: "Level 3 → 4", h: "heap" },
        { f: "maze/maze 4 -> 5.md", n: "4→5", t: "Level 4 → 5", h: "pointer" },
        { f: "maze/maze 5 -> 6.md", n: "5→6", t: "Level 5 → 6", h: "overflow" },
        { f: "maze/maze 6 -> 7.md", n: "6→7", t: "Level 6 → 7", h: "advanced" },
        { f: "maze/maze 7 -> 8.md", n: "7→8", t: "Level 7 → 8", h: "advanced" },
        { f: "maze/maze 8 -> 9.md", n: "8→9", t: "Level 8 → 9", h: "final" }
      ]
    }
  ]
};
