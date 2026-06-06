# OverTheWire — Maze Level 5 → 6

> Hedef: `maze5`'ten `maze6` şifresi. Sonuç: **`**********`** (gizlendi)
> Teknik: Basit bir **keygen** (anahtar üretici) tersine mühendisliği + `ptrace(TRACEME)` anti-debug atlatma (auto-continue tracer) + stdio buffering zamanlaması.

---

## 1. İlk Bakış
```bash
/maze/maze5
# X----------------
#  Username:       Key: Wrong length you!
```
`scanf("%8s")` ile **Username** ve **Key** okur; ikisi de **tam 8 karakter** olmalı. Sonra `foo(user,key)` doğruysa kabuk verir.

## 2. Analiz — `main`
```c
scanf("%8s", user);  scanf("%8s", key);
if (strlen(user)!=8 || strlen(key)!=8) { puts("Wrong length you!"); exit(-1); }
if (ptrace(PTRACE_TRACEME,0,0,0) != 0) { puts("nahnah..."); return; }   // anti-debug
if (foo(user, key)) {
    puts("Yeh, here's your shell");
    setreuid(geteuid(), geteuid());
    system("/bin/sh");                  // <-- maze6 kabuğu
} else puts("Nah, wrong.");
```

## 3. Analiz — `foo` (keygen)
```c
char buf[9] = "printlol";
for (i=0; i<strlen(user); i++)
    buf[i] = buf[i] - (2*i + (user[i]-'A'));   // user'a bağlı dönüşüm
for (i=7; i>=0; i--)
    if (buf[i] != key[i]) return 0;            // key, dönüşmüş buf'a EŞİT olmalı
return 1;
```
Hem `user` hem `key` **bizde**. `user="AAAAAAAA"` seçersek `user[i]-'A'=0` → `buf[i]="printlol"[i] - 2*i`:
```
p p e h l b c ^   ->  key = "ppehlbc^"   (hepsi yazdırılabilir, scanf %s ile girilebilir)
```
(Anahtar baytlarının boşluk/NUL içermemesi gerek — bu seçim onu sağlar.)

## 4. İki Pürüz
- **`ptrace(PTRACE_TRACEME)`**: Debugger altında (-1) "nahnah" der. Normal çalıştırmada 0 döner → **geçer**. Ama yan etkisi var: süreç artık ebeveyni tarafından "izleniyor" sayılır; `system()` sırasında SIGCHLD geldiğinde **takılıp kalır**.
  - **Çözüm:** maze5'i, çocuk durduğunda otomatik `PTRACE_CONT` yapan minik bir **ebeveyn-tracer** altında çalıştır. TRACEME yine 0 döner (kontrol geçer) ama akış tıkanmaz. `setsid()` ile controlling-tty kaldırılır → job-control durması da olmaz.
- **stdio buffering**: `scanf` stdin'i blok hâlinde okur; kabuk komutlarını da yutup `system("/bin/sh")` spawn olunca kaybeder. **Çözüm:** önce kimlik bilgilerini gönder, **kısa bekle** (scanf bitsin), sonra komutları gönder → kabuk onları ham pipe'tan okur.

## 5. Exploit
```c
// tr.c — auto-continue tracer
setsid();
if(fork()==0) execl("/maze/maze5","/maze/maze5",0);
while(waitpid(pid,&st,0)==pid && !WIFEXITED(st)){
    int s=WSTOPSIG(st); if(s==SIGTRAP)s=0; ptrace(PTRACE_CONT,pid,0,s);
}
```
```bash
( printf 'AAAAAAAA\nppehlbc^\n'; sleep 2; printf 'cat /etc/maze_pass/maze6\n'; sleep 1 ) | ./tr
# Yeh, here's your shell
# uid=15006(maze6) ... <maze6 şifresi>
```

## Dersler
| Konu | Not |
|------|-----|
| Keygen RE | Doğrulama algoritması tersine çevrilerek geçerli giriş üretilir; user+key ikisi de kontrol edildiği için triviyal |
| Yazdırılabilirlik | `scanf %s` boşluk/NUL kabul etmez → girişi buna uygun seçmek gerekir |
| `ptrace(TRACEME)` anti-debug | -1 ⇒ debugger var; bypass: pre-trace ETME (yoksa TRACEME başarısız), bunun yerine **auto-continue tracer** ile yan etkiyi söndür |
| `setsid` | Controlling tty'yi kaldırıp job-control (SIGTTIN/TTOU) durmalarını engeller |
| stdio buffering | `scanf`/`read` farkı; spawn edilen kabuğa girdi vermek için **zamanlama** (önce kimlik, sonra komut) |
