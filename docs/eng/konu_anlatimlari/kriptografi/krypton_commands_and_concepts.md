# 🔐 Krypton — Commands Used and Cryptography Concepts

> This file explains the tools used in the Krypton series and the cryptography concepts.
> Commands like `base64`, `tr` (ROT13), `ln -s`, `mktemp -d`, `chmod`
> are not repeated here, since they are covered in the **Bandit** and **Leviathan** topic guides.

---

## 📋 Table of Contents

1. [Linux Commands](#linux-commands)
   - [wc -c](#wc--c--counting-characters)
   - [sort -nr](#sort--nr--numeric-reverse-sort)
   - [tr -cd](#tr--cd--character-filtering)
   - [for i in {A..Z}](#scanning-letters-with-a-for-loop)
   - [python3 -c](#python3--c--single-line-python)
2. [Cryptography Concepts](#cryptography-concepts)
   - [Caesar Cipher](#caesar-cipher)
   - [Frequency Analysis](#frequency-analysis)
   - [Vigenère Cipher](#vigenère-cipher)
   - [Kasiski Examination](#kasiski-examination)
   - [Stream Cipher (Krypton 6: mod-26 shift)](#stream-cipher-krypton-6-mod-26-shift)
3. [Online Tools](#online-tools)

---

## Linux Commands

### `wc -c` — Counting Characters

The basic uses of the `wc` (*word count*) command:

```
wc [option] file
```

| Flag | What it does |
|---|---|
| `-l` | Shows the number of lines |
| `-w` | Shows the number of words |
| `-c` | **Shows the number of bytes (characters)** |

In Krypton, we use it during frequency analysis to count how many times each letter appears:

```bash
# Count how many times the letter "S" appears in total across the found1 found2 found3 files
cat found1 found2 found3 | tr -cd 'S' | wc -c
# Output: 456
```

> 💡 `wc -c` actually counts bytes; in ASCII text, byte = character. A difference can appear with multi-byte UTF-8 characters.

---

### `sort -nr` — Numeric Reverse Sort

`sort` was covered in the Bandit topic guide (alphabetical sorting). In Krypton we use additional flags:

```
sort [flags] file
```

| Flag | What it does |
|---|---|
| `-n` | Sorts numerically (not alphabetically: 9 < 10 < 100) |
| `-r` | Sorts in reverse (largest to smallest) |
| `-nr` | Numeric + reverse — **the largest number comes first** |

In frequency analysis, we use it to sort the letter counts from largest to smallest:

```bash
# Produce the count of each letter, sort from largest to smallest
for i in {A..Z}; do
    cat found1 found2 found3 | tr -cd $i | wc -c | tr -d '\n'
    printf " $i\n"
done | sort -nr

# Example output:
# 456 S
# 340 Q
# 301 J
# ...
```

---

### `tr -cd` — Character Filtering

We saw the `tr` (*translate*) command in the Bandit topic guide (for ROT13). In Krypton it has a different use:

```
tr [options] 'source' 'target'
```

| Flag | What it does |
|---|---|
| `-d 'characters'` | **Deletes** the specified characters |
| `-c 'characters'` | Takes the **complement** of the specified characters (everything else) |
| `-cd 'character'` | Deletes **everything except** the specified character |

```bash
# Keep only the "A" letters, delete the rest
echo "ABCAADE" | tr -cd 'A'
# Output: AAA

# Usage in frequency analysis — count the letter S:
cat found1 | tr -cd 'S' | wc -c
```

The logic: `-c` takes the complement (everything except S), `-d` deletes → only the S's remain → counted with `wc -c`.

---

### Scanning Letters with a `for` Loop

In Bash, brace expansion is used to iterate over all letters from A to Z:

```bash
for i in {A..Z}; do
    # The $i variable takes the value A, B, C, ..., Z on each iteration
    echo $i
done
```

In Krypton level 3, we used this structure for frequency analysis as follows:

```bash
for i in {A..Z}; do
    cat found1 found2 found3 | tr -cd $i | wc -c | tr -d '\n'
    printf " $i\n"
done | sort -nr
```

Line-by-line explanation:
1. `tr -cd $i` → delete everything except that letter
2. `wc -c` → count how many are left (the letter's frequency)
3. `tr -d '\n'` → remove the trailing newline character from `wc`'s output (for proper alignment)
4. `printf " $i\n"` → add the letter's name and a newline
5. `sort -nr` → sort by frequency from largest to smallest

---

### `python3 -c` — Single-Line Python

Used to run short Python code in the terminal without opening a file:

```bash
python3 -c "print('hello')"

# Produce 50 A's (in the stream cipher level)
python3 -c "print('A'*50, end='')" > test.txt
```

The `end=''` parameter removes the `\n` (newline) character that `print` normally adds — critical for sending pure text to encryption binaries.

In Krypton level 6, we also used it to solve the mod-26 keystream (the shift amount):

```python
cipher_flag = "PNUKLYLWRQKGKBE"
known_plain = "AAAAAAAAAAAAAAA"
known_cipher = "EICTDGYIYZKTHNS"

shifts = [ord(known_cipher[i]) - ord(known_plain[i]) for i in range(len(cipher_flag))]

flag = ""
for i in range(len(cipher_flag)):
    result = ord(cipher_flag[i]) - shifts[i]
    if result < ord('A'):
        result += 26
    flag += chr(result)

print(flag)  # LFSRISNOTRANDOM
```

---

## Cryptography Concepts

### Caesar Cipher

**Caesar Cipher:** Shifts each letter in the alphabet by a fixed number. The "shift amount" is the key.

```
Key = 3:  A→D, B→E, C→F, ..., Z→C
Key = 13: A→N, B→O, ... (ROT13)
```

**Cracking method — Known-Plaintext Attack:**

If the encryption binary is accessible, a known input (`AAAA`) is encrypted and the output observed to compute the key:

```
A → M  →  M's position (13) - A's position (1) = 12  →  key = 12
Decryption key = 26 - 12 = 14
```

Applying it with `tr` — shift back 14 positions:
```bash
cat krypton3 | tr 'A-Za-z' 'O-ZA-No-za-n'
```

Formula: `tr 'A-Za-z' '<14th letter>-ZA-<13th letter><lowercase form>-za-<lowercase 13th letter>'`

> 💡 The Caesar cipher has 26 possible keys — it can also be cracked by brute force.

---

### Frequency Analysis

**Principle:** In natural languages, letters are not used with equal frequency. In English:

```
Most frequent: E  T  A  O  I  N  S  R  H  D  L  U  C  M  F  Y  W  G  P  B  V  K  X  Q  J  Z
```

**Monoalphabetic substitution ciphers** (ciphers where each letter is replaced by a single letter) are breakable for this reason: whichever letter appears most frequently in the ciphertext is most likely `E`.

**Application:**

```bash
# Produce a frequency table
for i in {A..Z}; do
    cat found1 found2 found3 | tr -cd $i | wc -c | tr -d '\n'
    printf " $i\n"
done | sort -nr
```

Then the ciphertext frequency order is matched with the English frequency order:

```bash
# Ciphertext: SQJUBNGCD... → target: EATSORNIHC...  (a substitution key derived from the English frequency order and refined by trial-and-error; not the raw ETAOIN order)
cat krypton4 | tr 'SQJUBNGCDZVWMYTXKELAFIORHP' 'EATSORNIHCLDUPYFWGMBKVXQJZ'
```

> ⚠️ Frequency analysis doesn't work perfectly on small texts — some trial and error may be needed. [dCode.fr](https://www.dcode.fr/frequency-analysis) offers a visual analysis.

---

### Vigenère Cipher

**Principle:** An advanced version of the Caesar cipher. Instead of a single fixed key, it uses a **keyword** — each letter is shifted according to the position of the corresponding letter in the key.

```
Text:    A  B  C  D  E  F
Key:     K  E  Y  K  E  Y   (KEY repeats)
          ↓  ↓  ↓  ↓  ↓  ↓
K=10   E=4  Y=24 K=10 E=4  Y=24
Ciphertext: K  F  A  N  I  D
```

**Why is it stronger?**
Frequency analysis doesn't work directly — the same letter is encrypted differently at each position.

**Cracking method — Known Key Length:**

If the key length is known (for example 6), every 6th position is encrypted with the same Caesar shift. In this case, 6 separate Caesar analyses are performed.

[dCode.fr Vigenère](https://www.dcode.fr/vigenere-cipher) → solved automatically with the "Knowing the Key-Length" option.

---

### Kasiski Examination

**Problem:** What do you do if the key length is unknown?

**Kasiski Examination:** Finds repeating 3+ character sequences in the ciphertext and the distances between them.

```
Repeating sequence "XYZ":
  - 1st time: position 30
  - 2nd time: position 60
  - 3rd time: position 90

Distances: 30, 30 → GCD = 30
The key length is a divisor of 30: 1, 2, 3, 5, 6, 10, 15, 30
```

**Why does it work?**
When a sequence lines up with the same key position, it is encrypted the same way → the same ciphertext sequence is produced. The distances are multiples of the key length.

[dCode.fr](https://www.dcode.fr/vigenere-cipher) → the "Automatic Decryption" option finds both the key length and the key.

---

### Stream Cipher (Krypton 6: mod-26 shift)

**Stream Cipher:** Combines each letter/byte with a "pseudo-random" **keystream**. This combination can take two forms:

- **XOR-based** (like AES-CTR, ChaCha20): `cipher_byte = plaintext_byte XOR keystream_byte`
- **Shift (mod-26) based** — Vigenère-style, **Krypton 6 uses this one**: the keystream is a *shift amount* (0–25), NOT an XOR byte.

**Krypton 6 formulas (mod-26 addition):**
```
cipher_letter    = (plaintext_letter + shift) mod 26
plaintext_letter = (cipher_letter    − shift) mod 26
```
> Proof: the `encrypt6` output stays entirely within the A–Z range (a real bitwise XOR would produce unprintable bytes), and the flag itself is `LFSRISNOTRANDOM` — the keystream consists of shifts generated by a weak LFSR.

**Vulnerability — Repeating Keystream:**

In implementations that use a weak RNG/LFSR, the keystream repeats at a certain length. To crack it:

1. Encrypt the binary with known plaintext (`AAAA...`).
2. Extract each position's **shift**: `shift[i] = (ord(known_cipher[i]) − ord('A')) % 26`  (when the plaintext is 'A', the ciphertext = 'A' + shift).
3. Decrypt the target ciphertext: `plaintext[i] = (ord(cipher[i]) − ord('A') − shift[i]) % 26 + ord('A')`  (`ord('A')` is subtracted BEFORE the mod — otherwise the result is wrong).

```bash
# Discover the keystream: encrypt 50 A's
python3 -c "print('A'*50, end='')" > test.txt
/krypton/krypton6/encrypt6 test.txt output.txt
cat output.txt
# EICTDGYIYZKTHNSIRFXYCPFUEOCKRNEICTDGYIYZKTHNSIRFXY
#              ^repeats at 30 characters → keystream length is 30
```

> 💡 Note: XOR-based secure stream ciphers (AES-CTR, ChaCha20) use a cryptographically secure RNG — the keystream never repeats. Krypton 6's weakness is both its repeating LFSR keystream and the fact that the shift is easy to break.

---

## Online Tools

In the Krypton series, alongside the command line, online tools are also used:

| Tool | URL | For what |
|---|---|---|
| **CyberChef** | [gchq.github.io/CyberChef](https://gchq.github.io/CyberChef/) | All kinds of encoding/decoding, encryption, conversion |
| **dCode.fr** | [dcode.fr](https://www.dcode.fr/) | Vigenère cracking, Kasiski analysis, frequency analysis |
| **Cryptii** | [cryptii.com](https://cryptii.com/) | Classic ciphers (Caesar, Vigenère, etc.) |

### CyberChef

"The Cyber Swiss Army Knife" — offers 300+ operations. They can be chained (the output of one operation feeds into the next):

- Chained solutions like Base64 Decode → Gunzip → Hex Decode
- "Operations" on the left, "Recipe" (what to do) in the middle, "Output" on the right
- Works by uploading a file or pasting text

### dCode.fr

A powerful platform for cryptanalysis. The features we use most in Krypton:

- **Vigenère Cipher** → "Knowing the Key-Length" or "Automatic Decryption"
- **Frequency Analysis** → Visual letter-frequency comparison
- Result: both the key and the decrypted text are shown

---

## 📊 Summary Table

| Command / Tool | Level Used In | For what |
|---|---|---|
| `wc -c` | Level 3 | Counting letter frequency |
| `sort -nr` | Level 3 | Frequency sorting (largest to smallest) |
| `tr -cd 'X'` | Level 3 | Deleting everything except a specific letter |
| `for i in {A..Z}` | Level 3 | Loop scanning letters from A to Z |
| `python3 -c "..."` | Level 6 | Inline Python, mod-26 solving |
| **Caesar Cipher** | Level 2 | Fixed-shift cipher |
| **Frequency Analysis** | Level 3 | Breaking monoalphabetic ciphers via letter frequency |
| **Vigenère Cipher** | Level 4-5 | Polyalphabetic cipher with a keyword |
| **Kasiski Examination** | Level 5 | Finding the Vigenère key length |
| **Stream Cipher (mod-26)** | Level 6 | mod-26 shift stream cipher (Vigenère-style, not XOR) |
| CyberChef | Level 0+ | General encode/decode |
| dCode.fr | Level 4-5 | Vigenère automatic cracking |

---

## 🔗 Useful Resources

- [Frequency Analysis — Wikipedia](https://en.wikipedia.org/wiki/Frequency_analysis)
- [Vigenère Cipher — Wikipedia](https://en.wikipedia.org/wiki/Vigen%C3%A8re_cipher)
- [Kasiski Examination — Wikipedia](https://en.wikipedia.org/wiki/Kasiski_examination)
- [XOR Cipher — Wikipedia](https://en.wikipedia.org/wiki/XOR_cipher)
- [CyberChef](https://gchq.github.io/CyberChef/)
- [dCode.fr](https://www.dcode.fr/)

---

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
