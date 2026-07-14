/* ============================================================
   Konu Anlatımları — içerik ağacı
   base: konu_anlatimlari/
   ============================================================ */
window.KONULAR = {
  base: "konu_anlatimlari/",
  categories: [
    {
      id: "linux_komutlari",
      label: "Linux Komutları",
      accent: "var(--green)",
      tag: "Bandit",
      blurb: "Terminalde gezinmenin temeli — dosya, metin, ağ, izinler ve git.",
      files: [
        { f: "linux_komutlari/dosya_sistemi.md",        t: "Dosya Sistemi",        h: "pwd · ls · cd · cat · file · find · cp · mv" },
        { f: "linux_komutlari/metin_isleme.md",          t: "Metin İşleme",          h: "grep · sort · uniq · strings · cut · tr · diff" },
        { f: "linux_komutlari/sikistirma_encoding.md",   t: "Sıkıştırma & Encoding", h: "base64 · xxd · gzip · bzip2 · tar · zip" },
        { f: "linux_komutlari/ag.md",                    t: "Ağ",                    h: "ssh · scp · nc · openssl · nmap · curl · wget" },
        { f: "linux_komutlari/izinler_kullanici.md",     t: "İzinler & Kullanıcı",   h: "chmod · chown · id · su · sudo · SUID/SGID" },
        { f: "linux_komutlari/surec_shell.md",           t: "Süreç & Shell",         h: "| · > · & · jobs · $() · for · alias" },
        { f: "linux_komutlari/git.md",                   t: "Git",                   h: "clone · log · show · branch · checkout · commit" }
      ]
    },
    {
      id: "leviathan_komutlari",
      label: "Binary Analizi & RE",
      accent: "var(--yellow)",
      tag: "Leviathan",
      blurb: "Binary'lerin davranışını incelemek: izleme, sembolik linkler, GDB.",
      files: [
        { f: "leviathan_komutlari/baslamadan_once_on_bilgiler.md", t: "Başlamadan Önce Ön Bilgiler", h: "SSH · oyun mantığı · ön gereksinimler · keşif refleksi" },
        { f: "leviathan_komutlari/leviathan_ne_ogretiyor.md",      t: "Leviathan Ne Öğretiyor?",     h: "info disclosure · command injection · symlink/TOCTOU · seviye→kavram" },
        { f: "leviathan_komutlari/dosya_izinleri_suid.md", t: "Dosya İzinleri & SUID", h: "chmod · find -perm · privilege escalation" },
        { f: "leviathan_komutlari/binary_analizi.md",      t: "Binary Analizi",        h: "file · strings · xxd · od" },
        { f: "leviathan_komutlari/ltrace_strace.md",       t: "ltrace / strace",       h: "strcmp · fopen · access · system" },
        { f: "leviathan_komutlari/sembolik_linkler.md",    t: "Sembolik Linkler",      h: "ln -s · readlink · TOCTOU" },
        { f: "leviathan_komutlari/gdb.md",                 t: "GDB",                   h: "disassemble · break · run · x · print" },
        { f: "leviathan_komutlari/brute_force_bash.md",    t: "Brute Force (bash)",    h: "for döngüsü · koşullar · PIN brute force" }
      ]
    },
    {
      id: "web_guvenligi",
      label: "Web Güvenliği",
      accent: "var(--magenta)",
      tag: "Natas",
      blurb: "HTTP'den injection'a — Natas'ın bütün web saldırı yüzeyi.",
      numbered: true,
      files: [
        { f: "web_guvenligi/01_html_kaynak_ve_devtools.md",   n: "01", t: "HTML Kaynak & DevTools",      h: "Gizli alanlar, Developer Tools" },
        { f: "web_guvenligi/02_http_protokolu.md",            n: "02", t: "HTTP Protokolü",              h: "İstek/cevap, metodlar, header'lar" },
        { f: "web_guvenligi/03_robots_ve_dizin_kesfi.md",     n: "03", t: "robots.txt & Dizin Keşfi",    h: "Gizli yollar, dizin keşfi" },
        { f: "web_guvenligi/04_cookie_manipulasyonu.md",      n: "04", t: "Cookie Manipülasyonu",        h: "Cookie yapısı, güvenlik bayrakları" },
        { f: "web_guvenligi/05_php_kaynak_kodu.md",           n: "05", t: "PHP Kaynak Kodu",             h: "Kaynak okuma, include analizi" },
        { f: "web_guvenligi/06_encoding_ve_obfuscation.md",   n: "06", t: "Encoding & Obfuscation",      h: "Base64, hex, URL encoding" },
        { f: "web_guvenligi/07_command_injection.md",         n: "07", t: "Command Injection",           h: "; · | · $() ile komut zincirleme" },
        { f: "web_guvenligi/08_lfi_ve_path_traversal.md",     n: "08", t: "LFI & Path Traversal",        h: "../ ile dizin atlama" },
        { f: "web_guvenligi/09_xor_sifrelemesi.md",           n: "09", t: "XOR Şifrelemesi",             h: "Known-plaintext saldırısı" },
        { f: "web_guvenligi/10_dosya_yukleme_bypass.md",      n: "10", t: "Dosya Yükleme Bypass",        h: "MIME type, uzantı manipülasyonu" },
        { f: "web_guvenligi/11_sql_injection.md",             n: "11", t: "SQL Injection",               h: "' OR 1=1 · UNION saldırısı" },
        { f: "web_guvenligi/12_blind_sql_injection.md",       n: "12", t: "Blind SQL Injection",         h: "Boolean tabanlı, karakter çekme" },
        { f: "web_guvenligi/13_command_injection_ileri.md",   n: "13", t: "Command Injection (İleri)",   h: "grep bypass, filtre aşma" },
        { f: "web_guvenligi/14_session_brute_force.md",       n: "14", t: "Session Brute Force",         h: "Oturum token brute force" },
        { f: "web_guvenligi/15_session_ve_newline_injection.md", n: "15", t: "Session & Newline Injection", h: "CRLF, oturum enjeksiyonu" },
        { f: "web_guvenligi/16_http_redirect_bypass.md",      n: "16", t: "HTTP Redirect Bypass",        h: "302 yakalama, response kesme" },
        { f: "web_guvenligi/17_php_type_juggling.md",         n: "17", t: "PHP Type Juggling",           h: "== gevşek karşılaştırma" },
        { f: "web_guvenligi/18_php_object_injection.md",      n: "18", t: "PHP Object Injection",        h: "unserialize zafiyeti" },
        { f: "web_guvenligi/19_sql_truncation.md",            n: "19", t: "SQL Truncation",              h: "Alan uzunluğu taşması" },
        { f: "web_guvenligi/20_ecb_mode_zafiyeti.md",         n: "20", t: "ECB Mode Zafiyeti",           h: "Blok şifre desen sızıntısı" },
        { f: "web_guvenligi/21_perl_rce.md",                  n: "21", t: "Perl RCE",                    h: "open() ile komut çalıştırma" },
        { f: "web_guvenligi/22_perl_cgi_param_bypass.md",     n: "22", t: "Perl CGI Param Bypass",       h: "Parametre manipülasyonu" },
        { f: "web_guvenligi/23_log_poisoning.md",             n: "23", t: "Log Poisoning",               h: "Log + LFI ile RCE" },
        { f: "web_guvenligi/24_phar_deserialization.md",      n: "24", t: "PHAR Deserialization",        h: "phar:// stream wrapper" }
      ]
    },
    {
      id: "x86_assembly",
      label: "x86 Assembly (sıfırdan)",
      accent: "var(--cyan)",
      tag: "🚧 yazılıyor",
      blurb: "Sıfırdan x86 assembly — makine modeli, register, ilk program, gdb, bellek & pointer, little-endian. Yazım aşamasında: şu an Ünite 0 + Ünite 1'in başı (00–08.5).",
      files: [
        { f: "x86_assembly/00_buradan_basla.md",           n: "→",    t: "Buradan Başla",         h: "Kurs haritası + ne öğreneceksin (🚧 yazılıyor)" },
        { f: "x86_assembly/01_bilgisayar_nedir.md",        n: "01",   t: "Bilgisayar Nedir?",     h: "Numaralı kutular + işçi; zihin modeli" },
        { f: "x86_assembly/01.5_sayi_ve_anlam.md",         n: "01.5", t: "Aynı Sayı, Bin Anlam",  h: "Sayı ≠ anlam; anlamı kod verir" },
        { f: "x86_assembly/02_terminal_ile_tanisma.md",    n: "02",   t: "Terminal ile Tanışma",  h: "Terminal, komut yazma, çıktı okuma" },
        { f: "x86_assembly/03_sayilar_ikilik_onaltilik.md",n: "03",   t: "İkilik & Onaltılık",    h: "Makinenin saydığı gibi saymak" },
        { f: "x86_assembly/04_bellek_ve_registerlar.md",   n: "04",   t: "Bellek & Register'lar", h: "Kutular + işçinin elleri" },
        { f: "x86_assembly/04.5_registerin_ici.md",        n: "04.5", t: "Register'ın İçi",       h: "AL/AH/AX/EAX — boyut oyunları" },
        { f: "x86_assembly/05_kurulum_ve_ilk_program.md",  n: "05",   t: "Kurulum & İlk Program", h: "nasm/ld/gdb; yaz→çevir→çalıştır" },
        { f: "x86_assembly/05.5_perde_arkasi.md",          n: "05.5", t: "Perde Arkası",          h: "PATH, nasm vs ld, _start" },
        { f: "x86_assembly/06_ilk_gercek_program.md",      n: "06",   t: "İlk Gerçek Program",    h: "mov ile değer, çıkış kodu, echo $?" },
        { f: "x86_assembly/07_gdb_tek_adim.md",            n: "07",   t: "GDB ile Tek Adım",      h: "starti · si · info registers · eip; kutuları canlı izle" },
        { f: "x86_assembly/08_mov_ve_bellek.md",           n: "08",   t: "mov ve Bellek",         h: "[...] adresleme · section .data · AL/BIRAK · ilk pointer takibi" },
        { f: "x86_assembly/08.5_little_endian.md",         n: "08.5", t: "Little-Endian",         h: "belleğe byte byte bakmak; 'aynen ters' byte sırası" }
      ]
    },
    {
      id: "binary_exploitation",
      label: "Binary Exploitation",
      accent: "var(--d-high)",
      tag: "Narnia → Utumno",
      blurb: "Stack overflow'dan ROP'a — sıfırdan ileri seviye exploit geliştirme.",
      numbered: true,
      files: [
        { f: "binary_exploitation/00_buradan_basla.md",                     n: "→",   t: "Buradan Başla",               h: "Assembly bilmeyenler için giriş + okuma sırası" },
        { f: "binary_exploitation/00a_assembly_bilmeden_giris.md",          n: "00a", t: "Assembly Bilmeden Giriş",      h: "Minimum komut sözlüğü, uçtan uca ilk exploit" },
        { f: "binary_exploitation/00_x86_assembly_temelleri.md",            n: "00",  t: "x86 Assembly Temelleri",       h: "Register'lar, instruction'lar" },
        { f: "binary_exploitation/00b_gdb_ile_assembly_okumak.md",          n: "00b", t: "GDB ile Assembly Okumak",      h: "disassemble, stepi, x/i" },
        { f: "binary_exploitation/01_bellek_ve_memory_layout.md",           n: "01",  t: "Bellek & Memory Layout",       h: "Stack, heap, .text, .bss" },
        { f: "binary_exploitation/02_little_endian.md",                     n: "02",  t: "Little Endian",                h: "Byte sırası, adres yazımı" },
        { f: "binary_exploitation/03_eip_register_kontrolu.md",             n: "03",  t: "EIP Register Kontrolü",        h: "Return adresi ele geçirme" },
        { f: "binary_exploitation/04_shellcode_ve_nop_sled.md",             n: "04",  t: "Shellcode & NOP Sled",         h: "\\x90 sled, shellcode yerleşimi" },
        { f: "binary_exploitation/05_format_string.md",                     n: "05",  t: "Format String",                h: "%x %n ile bellek okuma/yazma" },
        { f: "binary_exploitation/06_return_to_libc_ve_fonksiyon_pointer.md", n: "06", t: "Return-to-libc & Fn Pointer", h: "system(), NX bypass" },
        { f: "binary_exploitation/07_sembolik_link.md",                     n: "07",  t: "Sembolik Link",                h: "TOCTOU, dosya yarışı" },
        { f: "binary_exploitation/08_pointer_manipulation.md",              n: "08",  t: "Pointer Manipulation",         h: "İşaretçi üzerine yazma" },
        { f: "binary_exploitation/09_got_plt_overwrite.md",                 n: "09",  t: "GOT/PLT Overwrite",            h: "Fonksiyon tablosu hijack" },
        { f: "binary_exploitation/10_bellek_korumalari_ve_checksec.md",     n: "10",  t: "Bellek Korumaları & checksec", h: "NX, ASLR, Canary, PIE, RELRO" },
        { f: "binary_exploitation/11_integer_bug_truncation_signedness.md", n: "11",  t: "Integer Bug",                  h: "Truncation, signedness" },
        { f: "binary_exploitation/12_dinamik_linker_ve_kutuphane_hijacking.md", n: "12", t: "Dinamik Linker & Hijack",  h: "LD_PRELOAD, kütüphane hijack" },
        { f: "binary_exploitation/13_ptrace_anti_debugging.md",             n: "13",  t: "ptrace Anti-Debugging",        h: "Debug tespiti, bypass" },
        { f: "binary_exploitation/14_self_modifying_code_ve_mprotect.md",   n: "14",  t: "Self-Modifying Code & mprotect", h: "Çalışma anında kod değişimi" },
        { f: "binary_exploitation/15_elf_formati_ve_parser_zafiyetleri.md", n: "15",  t: "ELF Formatı & Parser",         h: "ELF başlıkları, parser bug'ları" },
        { f: "binary_exploitation/16_file_yapisi_fsop.md",                  n: "16",  t: "FILE Yapısı (FSOP)",           h: "_IO_FILE exploitation" },
        { f: "binary_exploitation/17_setjmp_longjmp_ptr_mangle.md",         n: "17",  t: "setjmp/longjmp & Ptr Mangle",  h: "jmp_buf, pointer mangling" },
        { f: "binary_exploitation/18_ag_servisi_exploitasyonu.md",          n: "18",  t: "Ağ Servisi Exploitasyonu",     h: "Remote servis, soket exploit" },
        { f: "binary_exploitation/19_setuid_yetki_dususu_ve_p_bayragi.md",  n: "19",  t: "setuid & p Bayrağı",           h: "Yetki düşüşü, -p flag" }
      ]
    },
    {
      id: "kriptografi",
      label: "Kriptografi",
      accent: "var(--cyan)",
      tag: "Krypton",
      blurb: "Klasik şifrelerden frekans analizine — Krypton'un kavramları.",
      files: [
        { f: "kriptografi/krypton_komutlar_ve_kavramlar.md", t: "Krypton: Komutlar & Kavramlar", h: "Caesar · Vigenère · XOR · frekans" }
      ]
    }
  ]
};
