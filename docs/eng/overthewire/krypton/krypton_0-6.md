# 🔐 OverTheWire: Krypton — Level 0 to Level 6 English Guide

> Krypton is entirely about **cryptography**. You'll learn classic encryption methods and  
> how to break them — from Base64 to stream ciphers.  
> No programming knowledge required, but understanding encryption is necessary.

**Platform:** `krypton.labs.overthewire.org` | **Port:** `2231`  
**Files:** Located in `/krypton/krypton<N>/` directories  
**Reference:** [mayadevbe.me](https://mayadevbe.me/tags/krypton/) · [learnhacking.io](https://learnhacking.io/overthewire-krypton-levels-0-9/) · [overthewire.org](https://overthewire.org/wargames/krypton/)

---

## 🗺️ Overview — Introduction to Cryptography

Each level in Krypton uses a more complex encryption method:

| Level | Encryption | Difficulty |
|---|---|---|
| 0 → 1 | Base64 | ⭐ |
| 1 → 2 | ROT13 | ⭐ |
| 2 → 3 | Caesar Cipher | ⭐⭐ |
| 3 → 4 | Frequency Analysis | ⭐⭐⭐ |
| 4 → 5 | Vigenère (known key length) | ⭐⭐⭐ |
| 5 → 6 | Vigenère (unknown key length) | ⭐⭐⭐⭐ |
| 6 → 7 | Stream Cipher (XOR) | ⭐⭐⭐⭐⭐ |

Useful online tools:
- [CyberChef](https://gchq.github.io/CyberChef/) — All kinds of encoding/decoding
- [dCode.fr](https://www.dcode.fr/) — Cipher analysis tools
- [Cryptii](https://cryptii.com/) — Classic ciphers

---

## Level 0 → Level 1 — Base64

### 🎯 Task
No SSH required — decode the given Base64 string.

### 📖 Theory: Base64

**Base64:** An encoding scheme that converts binary data to text format. Usually recognized by `=` signs at the end. Commonly used in email attachments, JWT tokens, and URLs. Not encryption — just encoding!

```bash
base64 -d   # decode
base64      # encode
```

### 🔧 Solution

```bash
$ echo "S1JZUFRPTklTR1JFQVQ=" | base64 -d
KRYPTONISGREAT
```

`KRYPTONISGREAT` → password for Level 1.

---

## Level 1 → Level 2 — ROT13

### 🔐 Connection
```bash
ssh krypton1@krypton.labs.overthewire.org -p 2231
# Password: KRYPTONISGREAT
```

### 🎯 Task
`/krypton/krypton1/krypton2` file is encrypted with ROT13. Decode it.

### 📖 Theory: ROT13 and Caesar Cipher

**Caesar Cipher:** Shifts each letter in the alphabet by a fixed number. For example, with k=3: A→D, B→E, Z→C.

**ROT13:** A special case of Caesar — shifts by 13 positions. Since 13+13=26 in the 26-letter Latin alphabet, the encryption and decryption function is **identical**.

```bash
tr 'A-Za-z' 'N-ZA-Mn-za-m'   # ROT13
```

### 🔧 Solution

```bash
krypton1@krypton:~$ cd /krypton/krypton1
krypton1@krypton:/krypton/krypton1$ cat krypton2
YRIRY GJB CNFFJBEQ EBGGRA

krypton1@krypton:/krypton/krypton1$ cat krypton2 | tr 'A-Za-z' 'N-ZA-Mn-za-m'
LEVEL TWO PASSWORD ROTTEN
```

Password: `ROTTEN`

> 💡 **Define an alias:** With `alias rot13="tr 'A-Za-z' 'N-ZA-Mn-za-m'"` you can just type `cat krypton2 | rot13`.

---

## Level 2 → Level 3 — Caesar Cipher (Find the Key)

### 🔐 Connection
```bash
ssh krypton2@krypton.labs.overthewire.org -p 2231
# Password: ROTTEN
```

### 🎯 Task
The `encrypt` binary uses Caesar cipher. Find the key, decode the message.

### 📖 Theory: Calculating the Key

Knowing just one letter pair is enough to break Caesar:
- Position of cipher letter - position of plain letter = encryption key
- Decryption key = 26 - encryption key

If `A` → `M`: M is the 13th letter, key = 13-1 = **12**.  
Decryption key = 26-12 = **14**.

**By using the SUID binary `encrypt` to encrypt our chosen text, we can derive the key.**

### 🔧 Solution

```bash
krypton2@krypton:~$ cd /krypton/krypton2

# Create a temporary working directory
krypton2@krypton:/krypton/krypton2$ mktemp -d
/tmp/tmp.1RfnWl0zk4
krypton2@krypton:/krypton/krypton2$ cd /tmp/tmp.1RfnWl0zk4

# Create a symlink to keyfile (binary looks for keyfile here)
krypton2@krypton:/tmp/tmp.1RfnWl0zk4$ ln -s /krypton/krypton2/keyfile.dat
krypton2@krypton:/tmp/tmp.1RfnWl0zk4$ chmod 777 .

# Encrypt AAAAA — see where A maps to
krypton2@krypton:/tmp/tmp.1RfnWl0zk4$ echo "AAAAA" > test.txt
krypton2@krypton:/tmp/tmp.1RfnWl0zk4$ /krypton/krypton2/encrypt test.txt
krypton2@krypton:/tmp/tmp.1RfnWl0zk4$ cat ciphertext
MMMMM    # A→M, meaning shifted 12 positions
```

Encryption key = 12, decryption key = 26-12 = **14**.

Shift back 14 positions with `tr` (start from O → `O-ZA-N`):

```bash
krypton2@krypton:/krypton/krypton2$ cat krypton3 | tr 'A-Za-z' 'O-ZA-No-za-n'
CAESARISEASY
```

Password: `CAESARISEASY`

---

## Level 3 → Level 4 — Frequency Analysis

### 🔐 Connection
```bash
ssh krypton3@krypton.labs.overthewire.org -p 2231
# Password: CAESARISEASY
```

### 🎯 Task
Files `found1`, `found2`, `found3` are English texts encrypted with the same key. Perform frequency analysis, decode `krypton4`.

### 📖 Theory: Frequency Analysis and Entropy

**Monoalphabetic substitution cipher:** Each letter is replaced by another, but the mapping is fixed. Problem: Some letters are used much more frequently in English.

English letter frequency (most to least frequent):
```
E T A O I N S R H D L U C M F Y W G P B V K X Q J Z
```

Logic: The most frequent letter in the ciphertext is likely `E`. The second most frequent is `T`, etc.

```bash
# Count how many times each letter appears
for i in {A..Z}; do
    printf $i
    cat found1 found2 found3 | tr -cd $i | wc -c
done
```

### 🔧 Solution

```bash
krypton3@krypton:~$ cd /krypton/krypton3

# Sort letters by frequency
krypton3@krypton:/krypton/krypton3$ for i in {A..Z}; do
    cat found1 found2 found3 | tr -cd $i | wc -c | tr -d '\n'
    printf " $i\n"
done | sort -nr

456 S     # most frequent → likely E
340 Q     # second → likely T
301 J     # ...
257 U
246 B
...
```

Cipher order: `SQJUBNGCDZVWMYTXKELAFIORHP`  
English order: `ETAOINSRHDLUCMFYWGPBVKXQJZ`

```bash
krypton3@krypton:/krypton/krypton3$ cat krypton4 | tr 'SQJUBNGCDZVWMYTXKELAFIORHP' 'EATSORNIHCLDUPYFWGMBKVXQJZ'
WELLD ONETH ELEVE LFOUR PASSW ORDIS BRUTE
```

Password: `BRUTE`

> 💡 **Note:** Frequency analysis isn't perfect — the order may not hold for small texts. Some trial and error may be needed. You can do visual analysis at [dCode.fr](https://www.dcode.fr/frequency-analysis).

---

## Level 4 → Level 5 — Vigenère Cipher (Known Key Length)

### 🔐 Connection
```bash
ssh krypton4@krypton.labs.overthewire.org -p 2231
# Password: BRUTE
```

### 🎯 Task
Vigenère cipher is used. Key length is **6**. Find the key from `found1` and `found2`, decode `krypton5`.

### 📖 Theory: Vigenère Cipher

**Vigenère:** An advanced version of Caesar. Instead of a single shift value, it uses a **keyword**. Each letter is shifted by a different amount based on the corresponding letter in the key.

Example: Key `KEY` (K=10, E=4, Y=24), text `ABC`:
```
A + K(10) = K
B + E(4)  = F
C + Y(24) = A
D + K(10) = N  (key wraps around)
...
```

**Knowing the key length is an advantage:** You know every 6th character is encrypted with the same shift → you can do 6 separate Caesar analyses.

### 🔧 Solution

**Using an online tool (recommended):**

1. Go to [dCode.fr Vigenère](https://www.dcode.fr/vigenere-cipher)
2. Paste the contents of `found1`
3. Decryption method: "KNOWING THE KEY-LENGTH" → enter 6
4. Decrypt → Key: `FREKEY`
5. Paste contents of `krypton5`, use `FREKEY` as key → Decrypt

Password: `CLEARTEXT`

> 💡 **Alternative — Manual calculation:** You can extract partial key by guessing known word beginnings like `YYI → THE`. `C - P = K` (cipher - plaintext = key).

---

## Level 5 → Level 6 — Vigenère (Unknown Key Length)

### 🔐 Connection
```bash
ssh krypton5@krypton.labs.overthewire.org -p 2231
# Password: CLEARTEXT
```

### 🎯 Task
This time the key length is also unknown. First estimate the length, then decode.

### 📖 Theory: Kasiski Examination

**Kasiski Examination:** Finds repeated sequences in the ciphertext and the distances between them. The GCD (Greatest Common Divisor) of these distances is likely the key length.

Example: If the sequence `XYZ` repeats at positions 30 and 60 → GCD(30, 60) = 30 → key length is one of 30's divisors (1, 2, 3, 5, 6, 10, 15, 30).

### 🔧 Solution

**Using an online tool:**

1. Go to [dCode.fr Vigenère](https://www.dcode.fr/vigenere-cipher)
2. Paste the contents of `found1`
3. Decryption method: select "Automatic Decryption"
4. Decrypt → Kasiski result: key length 3, 6, or 9 (multiples of each other)
5. Key length **9** is correct, key: `KEYLENGTH`
6. Decode `krypton6` contents with `KEYLENGTH`

Password: `RANDOM`

> 💡 dCode's "Automatic Decryption" feature finds both the key length and the key in one go.

---

## Level 6 → Level 7 — Stream Cipher (XOR Attack)

### 🔐 Connection
```bash
ssh krypton6@krypton.labs.overthewire.org -p 2231
# Password: RANDOM
```

### 🎯 Task
This level uses a **stream cipher**. The keyfile is unreadable, but you can use the `encrypt6` binary to encrypt your own texts. Exploit the weak random number generator.

### 📖 Theory: Stream Cipher and XOR

**Stream Cipher:** XORs each byte separately with a "random" keystream.
```
ciphertext = plaintext XOR keystream
plaintext  = ciphertext XOR keystream
```

XOR property: XORing the ciphertext with the same keystream gives back the original text.

**Important vulnerability:** If the keystream repeats (weak RNG), the same keystream byte is XORed with every character at the same position. In this case:

1. Compare the output encrypted with a known plaintext (`AAAA...`)
2. `A XOR keystream = cipher` → `keystream = A XOR cipher`
3. After finding the keystream: `ciphertext XOR keystream = plaintext`

### 🔧 Solution

```bash
krypton6@krypton:~$ cd /krypton/krypton6
krypton6@krypton:/krypton/krypton6$ ls
encrypt6  keyfile.dat  krypton7  onetime  HINT1  HINT2  README

# Go to /tmp, link keyfile
krypton6@krypton:/krypton/krypton6$ cd /tmp
krypton6@krypton:/tmp$ mkdir mywork && cd mywork
krypton6@krypton:/tmp/mywork$ ln -s /krypton/krypton6/keyfile.dat

# Encrypt 50 A's
krypton6@krypton:/tmp/mywork$ python3 -c "print('A'*50, end='')" > test.txt
krypton6@krypton:/tmp/mywork$ /krypton/krypton6/encrypt6 test.txt output.txt
krypton6@krypton:/tmp/mywork$ cat output.txt
EICTDGYIYZKTHNSIRFXYCPFUEOCKRNEICTDGYIYZKTHNSIRFXY
```

Output repeats every 30 characters → keystream length is 30!

```bash
# Read the ciphertext
krypton6@krypton:/tmp/mywork$ cat /krypton/krypton6/krypton7
PNUKLYLWRQKGKBE
```

Calculate the shift amount for each position:
- Position 0: A(65) → E(69), shift = 4
- Position 1: A(65) → I(73), shift = 8
- ...

```python
# Automatically decode with Python
cipher_flag = "PNUKLYLWRQKGKBE"
known_plain = "AAAAAAAAAAAAAAA"
known_cipher = "EICTDGYIYZKTHNS"  # first 15 characters (first 15 of keystream)

shifts = [ord(known_cipher[i]) - ord(known_plain[i]) for i in range(len(cipher_flag))]
# shifts = [4, 8, 2, 19, 3, 6, 24, 8, 24, 25, 10, 19, 7, 13, 18]

flag = ""
for i in range(len(cipher_flag)):
    result = ord(cipher_flag[i]) - shifts[i]
    if result < ord('A'):
        result += 26
    flag += chr(result)

print(flag)  # LFSRISNOTRANDOM
```

```bash
krypton6@krypton:/tmp/mywork$ python3 decode.py
LFSRISNOTRANDOM
```

Password: `LFSRISNOTRANDOM`

---

## 🏁 Congratulations — Krypton Complete!

```bash
ssh krypton7@krypton.labs.overthewire.org -p 2231
# Password: LFSRISNOTRANDOM
```

---

## 📚 Cryptography Concepts Learned

| Concept | Description | How to Break |
|---|---|---|
| **Base64** | Binary→text conversion | Direct decode |
| **ROT13** | 13-position shift | `tr` command |
| **Caesar Cipher** | Fixed position shift | Known plaintext attack or brute force |
| **Frequency Analysis** | Breaking using letter frequency | Match with English frequency table |
| **Vigenère** | Keyword-based shifting | Kasiski examination + frequency analysis |
| **Stream Cipher** | XOR-based byte-by-byte encryption | Detect repeating keystream |

## 📚 Tools Used

| Tool | Purpose |
|---|---|
| `base64 -d` | Base64 decoding |
| `tr 'A-Za-z' 'N-ZA-Mn-za-m'` | ROT13 |
| `for i in {A..Z}; do ... done` | Letter counting loop |
| `sort -nr` | Numerical reverse sort |
| `wc -c` | Character count |
| `tr -cd $i` | Keep only a specific character |
| [CyberChef](https://gchq.github.io/CyberChef/) | General encode/decode |
| [dCode.fr](https://www.dcode.fr/) | Vigenère cracking, frequency analysis |
| [Cryptii](https://cryptii.com/) | Classic ciphers |

---

## 🔗 Useful Resources

- [OverTheWire Krypton](https://overthewire.org/wargames/krypton/)
- [MayADevBe Krypton Walkthrough](https://mayadevbe.me/tags/krypton/) (Level 0-5)
- [LearnHacking.io Krypton](https://learnhacking.io/overthewire-krypton-levels-0-9/) (includes Level 6)
- [Frequency Analysis — Wikipedia](https://en.wikipedia.org/wiki/Frequency_analysis)
- [Vigenère Cipher — Wikipedia](https://en.wikipedia.org/wiki/Vigen%C3%A8re_cipher)
- [Kasiski Examination — Wikipedia](https://en.wikipedia.org/wiki/Kasiski_examination)
- [CyberChef](https://gchq.github.io/CyberChef/) — Online tool that does everything

---

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
