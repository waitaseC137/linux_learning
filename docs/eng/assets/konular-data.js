/* ============================================================
   Topic Guides — content tree (English)
   base: konu_anlatimlari/
   ============================================================ */
window.KONULAR = {
  base: "konu_anlatimlari/",
  rootLabel: "konu_anlatimlari",
  title: "Topic Guides",
  unit: "files",
  intro: "Wargame-independent reference for commands and concepts. Start from a category — or jump to any topic from the tree / search on the left. All readable inside the site.",
  categories: [
    {
      id: "linux_komutlari",
      label: "Linux Commands",
      accent: "var(--green)",
      tag: "Bandit",
      blurb: "The foundation of moving around the terminal — files, text, networking, permissions and git.",
      files: [
        { f: "linux_komutlari/file_system.md",          t: "File System",          h: "pwd · ls · cd · cat · file · find · cp · mv" },
        { f: "linux_komutlari/text_processing.md",       t: "Text Processing",      h: "grep · sort · uniq · strings · cut · tr · diff" },
        { f: "linux_komutlari/compression_encoding.md",  t: "Compression & Encoding", h: "base64 · xxd · gzip · bzip2 · tar · zip" },
        { f: "linux_komutlari/networking.md",            t: "Networking",            h: "ssh · scp · nc · openssl · nmap · curl · wget" },
        { f: "linux_komutlari/permissions_users.md",     t: "Permissions & Users",   h: "chmod · chown · id · su · sudo · SUID/SGID" },
        { f: "linux_komutlari/process_shell.md",         t: "Processes & Shell",     h: "| · > · & · jobs · $() · for · alias" },
        { f: "linux_komutlari/git.md",                   t: "Git",                   h: "clone · log · show · branch · checkout · commit" }
      ]
    },
    {
      id: "salterden_bilgisayara",
      label: "From Switches to a Computer (NAND to CPU)",
      accent: "var(--d-low)",
      tag: "🚧 in progress",
      blurb: "A course born from the NandGame journey — from switch/relay to NAND, from NAND to logic gates, from gates to the adder (half/full adder). Learn the processor not by asking 'what is it' but by building it from its parts yourself. Still being written (00–06, up to the Full Adder).",
      files: [
        { f: "salterden_bilgisayara/00_buradan_basla.md",        n: "→",    t: "Start Here",              h: "Course map; from switches to a CPU (🚧 in progress)" },
        { f: "salterden_bilgisayara/01_akim_salter_role.md",     n: "01",   t: "Current · Switch · Relay", h: "Electricity → switch → relay = the first logic" },
        { f: "salterden_bilgisayara/02_nanddan_kapilar.md",      n: "02",   t: "Gates from NAND",         h: "NAND is universal: derive NOT/AND/OR/XOR" },
        { f: "salterden_bilgisayara/03_xor_iki_fedai.md",        n: "03",   t: "XOR: The Two Workhorses", h: "Building XOR from OR+NAND+AND" },
        { f: "salterden_bilgisayara/03.5_soyutlama_merdiveni.md",n: "03.5", t: "The Ladder of Abstraction", h: "A gate = a closed box; climbing one floor up" },
        { f: "salterden_bilgisayara/04_teller_sayi_olunca.md",   n: "04",   t: "When Wires Become Numbers", h: "Assigning value to wires; the token logic" },
        { f: "salterden_bilgisayara/05_half_adder.md",           n: "05",   t: "Half Adder",              h: "XOR+AND = the seed of addition (sum/carry)" },
        { f: "salterden_bilgisayara/06_full_adder.md",           n: "06",   t: "Full Adder",              h: "a+b+carry-in; two half adders" }
      ]
    },
    {
      id: "x86_assembly",
      label: "x86 Assembly (from scratch)",
      accent: "var(--cyan)",
      tag: "20 lessons · complete",
      blurb: "x86 assembly from zero — the machine model, registers, first program, gdb, memory & pointers, arithmetic, control flow (jmp/loops), bit operations, the stack, functions, system calls, and the bridge to C. The full series (00–20); every program verified on a real machine.",
      files: [
        { f: "x86_assembly/00_buradan_basla.md",           n: "→",    t: "Start Here",            h: "Course map + what you'll learn (full series 00–20)" },
        { f: "x86_assembly/01_bilgisayar_nedir.md",        n: "01",   t: "What Is a Computer?",   h: "Numbered boxes + a worker; the mental model" },
        { f: "x86_assembly/01.5_sayi_ve_anlam.md",         n: "01.5", t: "Same Number, a Thousand Meanings", h: "A number ≠ its meaning; code gives it meaning" },
        { f: "x86_assembly/02_terminal_ile_tanisma.md",    n: "02",   t: "Meeting the Terminal",  h: "The terminal, typing commands, reading output" },
        { f: "x86_assembly/03_sayilar_ikilik_onaltilik.md",n: "03",   t: "Binary & Hex",          h: "Counting the way the machine counts" },
        { f: "x86_assembly/04_bellek_ve_registerlar.md",   n: "04",   t: "Memory & Registers",    h: "Boxes + the worker's hands" },
        { f: "x86_assembly/04.5_registerin_ici.md",        n: "04.5", t: "Inside a Register",     h: "AL/AH/AX/EAX — size games" },
        { f: "x86_assembly/05_kurulum_ve_ilk_program.md",  n: "05",   t: "Setup & First Program", h: "nasm/ld/gdb; write→assemble→run" },
        { f: "x86_assembly/05.5_perde_arkasi.md",          n: "05.5", t: "Behind the Curtain",    h: "PATH, nasm vs ld, _start" },
        { f: "x86_assembly/06_ilk_gercek_program.md",      n: "06",   t: "First Real Program",    h: "A value with mov, exit code, echo $?" },
        { f: "x86_assembly/07_gdb_tek_adim.md",            n: "07",   t: "Single-Stepping with GDB", h: "starti · si · info registers · eip; watch the boxes live" },
        { f: "x86_assembly/08_mov_ve_bellek.md",           n: "08",   t: "mov and Memory",        h: "[...] addressing · section .data · load/store · first pointer follow" },
        { f: "x86_assembly/08.5_little_endian.md",         n: "08.5", t: "Little-Endian",         h: "Looking at memory byte by byte; the 'exactly reversed' order" },
        { f: "x86_assembly/09_aritmetik.md",               n: "09",   t: "Arithmetic",            h: "add/sub/inc/dec · two's complement · load-compute-store" },
        { f: "x86_assembly/10_bayraklar_ve_cmp.md",        n: "10",   t: "Flags & cmp",           h: "ZF/SF · cmp · test; the raw material of a decision" },
        { f: "x86_assembly/11_ziplamalar.md",              n: "11",   t: "Jumps",                 h: "jmp/jz/jnz/jl/jg; breaking the flow, even/odd" },
        { f: "x86_assembly/12_donguler.md",                n: "12",   t: "Loops",                 h: "backward jmp + counter; sum 1..N, repeated multiply" },
        { f: "x86_assembly/13_bit_islemleri.md",           n: "13",   t: "Bit Operations",        h: "and/or/xor/shl/shr; xor eax,eax; test=and" },
        { f: "x86_assembly/14_stack.md",                   n: "14",   t: "The Stack",             h: "push/pop · esp · LIFO; why the stack grows down" },
        { f: "x86_assembly/15_call_ve_ret.md",             n: "15",   t: "call and ret",          h: "functions, return address; call=push+jmp" },
        { f: "x86_assembly/16_calling_convention.md",      n: "16",   t: "Calling Convention",    h: "cdecl: arguments/return, ebp, prologue/epilogue" },
        { f: "x86_assembly/17_sistem_cagrilari.md",        n: "17",   t: "System Calls",          h: "int 0x80, syscall number; Hello World on screen" },
        { f: "x86_assembly/18_ilk_etkilesimli_program.md", n: "18",   t: "First Interactive Program", h: "sys_read + .bss; a program that asks your name and greets you" },
        { f: "x86_assembly/19_c_ile_assembly_koprusu.md",  n: "19",   t: "The C–Assembly Bridge", h: "gcc -S; familiar patterns in compiled code" },
        { f: "x86_assembly/20_buradan_nereye.md",          n: "20",   t: "Where to From Here?",   h: "64-bit, reverse engineering, exploitation, resources" }
      ]
    },
    {
      id: "leviathan_komutlari",
      label: "Binary Analysis & RE",
      accent: "var(--yellow)",
      tag: "Leviathan",
      blurb: "Inspecting how binaries behave: tracing, symbolic links, GDB.",
      files: [
        { f: "leviathan_komutlari/before_you_start.md",      t: "Before You Start",       h: "SSH · how the game works · prerequisites · the recon reflex" },
        { f: "leviathan_komutlari/what_leviathan_teaches.md", t: "What Does Leviathan Teach?", h: "info disclosure · command injection · symlink/TOCTOU · level→concept" },
        { f: "leviathan_komutlari/file_permissions_suid.md", t: "File Permissions & SUID", h: "chmod · find -perm · privilege escalation" },
        { f: "leviathan_komutlari/binary_analysis.md",     t: "Binary Analysis",        h: "file · strings · xxd · od" },
        { f: "leviathan_komutlari/ltrace_strace.md",       t: "ltrace / strace",       h: "strcmp · fopen · access · system" },
        { f: "leviathan_komutlari/symbolic_links.md",      t: "Symbolic Links",        h: "ln -s · readlink · argument splitting" },
        { f: "leviathan_komutlari/gdb.md",                 t: "GDB",                   h: "disassemble · break · run · x · print" },
        { f: "leviathan_komutlari/brute_force_bash.md",    t: "Brute Force (bash)",    h: "for loop · conditionals · PIN brute force" }
      ]
    },
    {
      id: "web_guvenligi",
      label: "Web Security",
      accent: "var(--magenta)",
      tag: "Natas",
      blurb: "From HTTP to injection — the entire Natas web attack surface.",
      numbered: true,
      files: [
        { f: "web_guvenligi/01_html_source_and_devtools.md",   n: "01", t: "HTML Source & DevTools",      h: "Hidden fields, Developer Tools" },
        { f: "web_guvenligi/02_http_protocol.md",             n: "02", t: "HTTP Protocol",               h: "Request/response, methods, headers" },
        { f: "web_guvenligi/03_robots_and_directory_discovery.md", n: "03", t: "robots.txt & Directory Discovery", h: "Hidden paths, directory discovery" },
        { f: "web_guvenligi/04_cookie_manipulation.md",       n: "04", t: "Cookie Manipulation",         h: "Cookie structure, security flags" },
        { f: "web_guvenligi/05_php_source_code.md",           n: "05", t: "PHP Source Code",             h: "Reading source, include analysis" },
        { f: "web_guvenligi/06_encoding_and_obfuscation.md",  n: "06", t: "Encoding & Obfuscation",      h: "Base64, hex, URL encoding" },
        { f: "web_guvenligi/07_command_injection.md",         n: "07", t: "Command Injection",           h: "Chaining commands with ; · | · $()" },
        { f: "web_guvenligi/08_lfi_and_path_traversal.md",    n: "08", t: "LFI & Path Traversal",        h: "Directory traversal with ../" },
        { f: "web_guvenligi/09_xor_encryption.md",            n: "09", t: "XOR Encryption",              h: "Known-plaintext attack" },
        { f: "web_guvenligi/10_file_upload_bypass.md",        n: "10", t: "File Upload Bypass",          h: "MIME type, extension manipulation" },
        { f: "web_guvenligi/11_sql_injection.md",             n: "11", t: "SQL Injection",               h: "' OR 1=1 · UNION attack" },
        { f: "web_guvenligi/12_blind_sql_injection.md",       n: "12", t: "Blind SQL Injection",         h: "Boolean-based, char extraction" },
        { f: "web_guvenligi/13_command_injection_advanced.md", n: "13", t: "Command Injection (Advanced)", h: "grep bypass, filter evasion" },
        { f: "web_guvenligi/14_session_brute_force.md",       n: "14", t: "Session Brute Force",         h: "Session token brute force" },
        { f: "web_guvenligi/15_session_and_newline_injection.md", n: "15", t: "Session & Newline Injection", h: "CRLF, session injection" },
        { f: "web_guvenligi/16_http_redirect_bypass.md",      n: "16", t: "HTTP Redirect Bypass",        h: "302 interception, response cutting" },
        { f: "web_guvenligi/17_php_type_juggling.md",         n: "17", t: "PHP Type Juggling",           h: "== loose comparison" },
        { f: "web_guvenligi/18_php_object_injection.md",      n: "18", t: "PHP Object Injection",        h: "unserialize vulnerability" },
        { f: "web_guvenligi/19_sql_truncation.md",            n: "19", t: "SQL Truncation",              h: "Field length overflow" },
        { f: "web_guvenligi/20_ecb_mode_vulnerability.md",    n: "20", t: "ECB Mode Weakness",           h: "Block cipher pattern leak" },
        { f: "web_guvenligi/21_perl_rce.md",                  n: "21", t: "Perl RCE",                    h: "Command execution via open()" },
        { f: "web_guvenligi/22_perl_cgi_param_bypass.md",     n: "22", t: "Perl CGI Param Bypass",       h: "Parameter manipulation" },
        { f: "web_guvenligi/23_log_poisoning.md",             n: "23", t: "Log Poisoning",               h: "RCE via log + LFI" },
        { f: "web_guvenligi/24_phar_deserialization.md",      n: "24", t: "PHAR Deserialization",        h: "phar:// stream wrapper" }
      ]
    },
    {
      id: "binary_exploitation",
      label: "Binary Exploitation",
      accent: "var(--d-high)",
      tag: "Narnia → Utumno",
      blurb: "From stack overflow to ROP — exploit development from scratch to advanced.",
      numbered: true,
      files: [
        { f: "binary_exploitation/00_buradan_basla.md",                     n: "→",   t: "Start Here",                  h: "Intro for non-assembly readers + reading order" },
        { f: "binary_exploitation/00a_assembly_bilmeden_giris.md",          n: "00a", t: "Getting Started Without Assembly", h: "Minimum instruction dictionary, an end-to-end first exploit" },
        { f: "binary_exploitation/00_x86_assembly_temelleri.md",            n: "00",  t: "x86 Assembly Basics",          h: "Registers, instructions" },
        { f: "binary_exploitation/00b_gdb_ile_assembly_okumak.md",          n: "00b", t: "Reading Assembly with GDB",    h: "disassemble, stepi, x/i" },
        { f: "binary_exploitation/01_bellek_ve_memory_layout.md",           n: "01",  t: "Memory & Memory Layout",       h: "Stack, heap, .text, .bss" },
        { f: "binary_exploitation/02_little_endian.md",                     n: "02",  t: "Little Endian",                h: "Byte order, address writing" },
        { f: "binary_exploitation/03_eip_register_kontrolu.md",             n: "03",  t: "EIP Register Control",         h: "Hijacking the return address" },
        { f: "binary_exploitation/04_shellcode_ve_nop_sled.md",             n: "04",  t: "Shellcode & NOP Sled",         h: "\\x90 sled, shellcode placement" },
        { f: "binary_exploitation/05_format_string.md",                     n: "05",  t: "Format String",                h: "Reading/writing memory with %x %n" },
        { f: "binary_exploitation/06_return_to_libc_ve_fonksiyon_pointer.md", n: "06", t: "Return-to-libc & Fn Pointer", h: "system(), NX bypass" },
        { f: "binary_exploitation/07_sembolik_link.md",                     n: "07",  t: "Symbolic Link",                h: "TOCTOU, file race" },
        { f: "binary_exploitation/08_pointer_manipulation.md",              n: "08",  t: "Pointer Manipulation",         h: "Overwriting pointers" },
        { f: "binary_exploitation/09_got_plt_overwrite.md",                 n: "09",  t: "GOT/PLT Overwrite",            h: "Function table hijack" },
        { f: "binary_exploitation/10_bellek_korumalari_ve_checksec.md",     n: "10",  t: "Memory Protections & checksec", h: "NX, ASLR, Canary, PIE, RELRO" },
        { f: "binary_exploitation/11_integer_bug_truncation_signedness.md", n: "11",  t: "Integer Bug",                  h: "Truncation, signedness" },
        { f: "binary_exploitation/12_dinamik_linker_ve_kutuphane_hijacking.md", n: "12", t: "Dynamic Linker & Hijack",  h: "LD_PRELOAD, library hijack" },
        { f: "binary_exploitation/13_ptrace_anti_debugging.md",             n: "13",  t: "ptrace Anti-Debugging",        h: "Debug detection, bypass" },
        { f: "binary_exploitation/14_self_modifying_code_ve_mprotect.md",   n: "14",  t: "Self-Modifying Code & mprotect", h: "Runtime code modification" },
        { f: "binary_exploitation/15_elf_formati_ve_parser_zafiyetleri.md", n: "15",  t: "ELF Format & Parser",          h: "ELF headers, parser bugs" },
        { f: "binary_exploitation/16_file_yapisi_fsop.md",                  n: "16",  t: "FILE Structure (FSOP)",        h: "_IO_FILE exploitation" },
        { f: "binary_exploitation/17_setjmp_longjmp_ptr_mangle.md",         n: "17",  t: "setjmp/longjmp & Ptr Mangle",  h: "jmp_buf, pointer mangling" },
        { f: "binary_exploitation/18_ag_servisi_exploitasyonu.md",          n: "18",  t: "Network Service Exploitation", h: "Remote service, socket exploit" },
        { f: "binary_exploitation/19_setuid_yetki_dususu_ve_p_bayragi.md",  n: "19",  t: "setuid & the -p Flag",         h: "Privilege drop, -p flag" }
      ]
    },
    {
      id: "kriptografi",
      label: "Cryptography",
      accent: "var(--cyan)",
      tag: "Krypton",
      blurb: "From classic ciphers to frequency analysis — the concepts behind Krypton.",
      files: [
        { f: "kriptografi/krypton_commands_and_concepts.md", t: "Krypton: Commands & Concepts", h: "Caesar · Vigenère · XOR · frequency" }
      ]
    }
  ]
};
