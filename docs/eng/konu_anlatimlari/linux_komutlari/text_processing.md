# 🔍 Linux Commands — Text Processing

> In Linux, everything is text. Log files, config files, command output...  
> If you know these commands well, you'll find what you need among thousands of lines in seconds.

---

## 📋 Table of Contents

- [grep](#grep)
- [sort](#sort)
- [uniq](#uniq)
- [strings](#strings)
- [cut](#cut)
- [tr](#tr)
- [diff](#diff)
- [echo](#echo)
- [md5sum](#md5sum)
- [wc](#wc)
- [head & tail](#head--tail)
- [sed](#sed)

---

## grep

**Global Regular Expression Print** — Searches for a pattern in a file or stream and shows the matching lines.

### Basic Usage
```bash
grep "word" file.txt              # search in a file
grep "word" *.txt                 # search in multiple files
grep "word" file1 file2           # search in specific files
cat file.txt | grep "word"        # use with a pipe
```

### Important Flags

| Flag | Description | Example |
|---|---|---|
| `-i` | Case-insensitive | `grep -i "linux"` |
| `-v` | Show non-matching lines | `grep -v "error"` |
| `-n` | Show line numbers | `grep -n "error"` |
| `-c` | Show the count of matching lines | `grep -c "warning"` |
| `-r` | Search subdirectories too (recursive) | `grep -r "TODO" .` |
| `-l` | Show only file names | `grep -rl "TODO" .` |
| `-w` | Whole-word match | `grep -w "cat"` |
| `-A N` | Show N lines after a match | `grep -A 3 "error"` |
| `-B N` | Show N lines before a match | `grep -B 3 "error"` |
| `-C N` | Show N lines around a match | `grep -C 3 "error"` |
| `-E` | Use extended regex | `grep -E "cat\|dog"` |
| `-o` | Show only the matching part | `grep -o "[0-9]*"` |

### Regex Basics

```bash
grep "^error" file    # lines starting with 'error'
grep "error$" file    # lines ending with 'error'
grep "h.ta" file      # starts with h, ends with ta, any single character in between
grep "ha*ta" file     # ha, hata, haata, haaa...ta
grep "[0-9]" file     # lines containing a digit
grep "[a-z]" file     # lines containing a lowercase letter
grep "^$" file        # empty lines
```

### Chaining with Pipes

```bash
# filter find's output
find . -type f | grep ".txt"

# hide error lines from a command's output
ls /etc 2>&1 | grep -v "Permission"

# narrow down with multiple greps
cat log.txt | grep "ERROR" | grep "2024"
```

### Usage in Bandit
```bash
# Level 7: find the line containing the word millionth
grep "millionth" data.txt

# Level 5: find the file that is ASCII text
find . -exec file {} \; | grep "ASCII"

# Level 6: hide Permission denied errors
find / -user bandit7 2>/dev/null

# Level 24: find the correct line in the brute-force output
grep -v "Wrong" result.txt
```

---

## sort

**Sort** — Sorts lines.

### Basic Usage
```bash
sort file.txt               # sort alphabetically
sort file.txt > sorted.txt  # sort and save
cat file.txt | sort         # use with a pipe
```

### Important Flags

| Flag | Description | Example |
|---|---|---|
| `-r` | Reverse order (Z→A, 9→0) | `sort -r` |
| `-n` | Numeric sort | `sort -n` |
| `-u` | Remove duplicates (unique) | `sort -u` |
| `-k N` | Sort by the Nth column | `sort -k 2` |
| `-t ':'` | Specify a field separator | `sort -t ':' -k 3 -n` |
| `-h` | Sort human-readable sizes (1K, 2M) | `sort -h` |
| `-R` | Random sort | `sort -R` |
| `-f` | Case-insensitive | `sort -f` |

### Examples

```bash
# numeric sort
echo -e "10\n2\n1\n20" | sort -n
# Output: 1, 2, 10, 20

# alphabetical sort (default) gives a different result
echo -e "10\n2\n1\n20" | sort
# Output: 1, 10, 2, 20  ← not numeric!

# sort by the second column
sort -k 2 file.txt

# sort /etc/passwd by UID (the 3rd field)
sort -t ':' -k 3 -n /etc/passwd
```

### Using It with uniq

`uniq` only processes adjacent identical lines. That's why `sort` is needed first:

```bash
sort file.txt | uniq       # remove duplicates
sort file.txt | uniq -c    # count how many times each line appears
sort file.txt | uniq -d    # show only the duplicated lines
sort file.txt | uniq -u    # show only the lines that appear once
```

### Usage in Bandit
```bash
# Level 8: sort first to find the unique line
sort data.txt | uniq -u
```

---

## uniq

**Unique** — Filters out repeated lines. **Note:** It only processes adjacent identical lines, so it's usually used together with `sort`.

### Basic Usage
```bash
uniq file.txt               # remove repeated consecutive lines
sort file.txt | uniq        # sort, then remove duplicates
```

### Important Flags

| Flag | Description | Example |
|---|---|---|
| `-u` | Lines that appear only once | `uniq -u` |
| `-d` | Only the repeated lines | `uniq -d` |
| `-c` | Count how many times each line appears | `uniq -c` |
| `-i` | Case-insensitive | `uniq -i` |

### Examples

```bash
$ echo -e "apple\napple\npear\napplE\npear" | sort | uniq -c
      1 apple
      1 applE     # different case → counted separately
      2 apple
      1 pear

$ echo -e "apple\napple\npear\npear" | sort | uniq -u
# Output: (empty — every line appears at least twice)

$ echo -e "apple\napple\npear" | sort | uniq -u
pear              # appears only once
```

### Usage in Bandit
```bash
# Level 8: find the line that appears only once
sort data.txt | uniq -u
# Output: password (a single line)
```

---

## strings

**Strings** — Extracts printable character sequences from binary files.

### Basic Usage
```bash
strings binary_file             # list all strings
strings -n 8 binary_file        # show strings at least 8 characters long
strings file | grep "password"  # filter with a pipe
```

### Important Flags

| Flag | Description |
|---|---|
| `-n N` | Show strings at least N characters long (default: 4) |
| `-a` | Scan all sections (not just the text sections) |
| `-t x` | Show the string's offset in hex |
| `-t d` | Show the string's offset in decimal |

### When To Use

```bash
# is there hidden text in a binary file?
strings /bin/ls | head -20

# which libraries does the program use?
strings program | grep "\.so"

# is there a hardcoded password or URL?
strings program | grep -i "password\|http\|secret"

# data.txt is binary but contains text fragments
strings data.txt | grep "==="
```

### Usage in Bandit
```bash
# Level 9: find the line marked with = signs in the binary file
strings data.txt | grep "==="

# Leviathan Level 1: is there a hidden string in the binary?
strings /narnia/narnia1
```

---

## cut

**Cut** — Cuts specific fields or characters out of lines.

### Basic Usage
```bash
cut -d ':' -f 1 /etc/passwd     # split on :, take the 1st field
cut -c 1-10 file.txt            # take the first 10 characters of each line
cut -d ' ' -f 2- file.txt       # take the 2nd field to the end
```

### Important Flags

| Flag | Description | Example |
|---|---|---|
| `-d 'separator'` | Specify a field separator (default: tab) | `-d ':'` |
| `-f N` | Take the Nth field | `-f 1` |
| `-f N-M` | Take fields N through M | `-f 1-3` |
| `-f N-` | From N to the end | `-f 2-` |
| `-c N` | Take the Nth character | `-c 1` |
| `-c N-M` | Characters N through M | `-c 1-10` |

### Examples

```bash
# get the usernames from /etc/passwd
cut -d ':' -f 1 /etc/passwd

# take only the hash from md5sum output
echo "test" | md5sum
# d8e8fca2dc0f896fd7cb4cb0031ba249  -
echo "test" | md5sum | cut -d ' ' -f 1
# d8e8fca2dc0f896fd7cb4cb0031ba249

# take specific columns from a CSV
cut -d ',' -f 1,3 data.csv
```

### Usage in Bandit
```bash
# Level 22: take only the hash from md5sum output
echo I am user bandit23 | md5sum | cut -d ' ' -f 1
# 8ca319486bfbbc3663ea0fbe81326349
```

---

## tr

**Translate** — Transforms characters. Used to replace, delete, or squeeze characters.

### Basic Usage
```bash
echo "hello" | tr 'a-z' 'A-Z'         # lowercase → uppercase
echo "hello" | tr -d 'l'              # delete the 'l' characters
echo "hello" | tr -s 'l'              # squeeze consecutive 'l's into one
```

### Important Flags

| Flag | Description |
|---|---|
| `-d 'characters'` | Delete the specified characters |
| `-s 'characters'` | Squeeze consecutive repeats into one |
| `-c 'characters'` | Apply to everything except the specified ones (complement) |

### Character Ranges

```bash
tr 'a-z' 'A-Z'          # make all lowercase letters uppercase
tr 'A-Za-z' 'a-zA-Z'    # swap upper/lower case
tr '0-9' '9-0'          # reverse the digits
tr -d '0-9'             # delete all digits
tr -d '\n'              # delete line breaks
tr -s ' '               # squeeze multiple spaces into one
```

### ROT13

ROT13 shifts each letter by 13 positions. In a 26-letter alphabet, since 13+13=26, encrypting and decrypting are the same operation:

```bash
# ROT13 encrypt/decrypt
echo "Hello World" | tr 'A-Za-z' 'N-ZA-Mn-za-m'
# Output: Uryyb Jbeyq

# applying it again gives the original
echo "Uryyb Jbeyq" | tr 'A-Za-z' 'N-ZA-Mn-za-m'
# Output: Hello World
```

### A Shortcut with alias

```bash
alias rot13="tr 'A-Za-z' 'N-ZA-Mn-za-m'"
echo "Gur cnffjbeq" | rot13
```

### Usage in Bandit
```bash
# Level 11: decode the ROT13 cipher
cat data.txt | tr 'A-Za-z' 'N-ZA-Mn-za-m'
```

---

## diff

**Difference** — Shows the differences between two files.

### Basic Usage
```bash
diff file1 file2            # compare two files
diff -u file1 file2         # unified format (more readable)
diff -r folder1 folder2     # compare two directories
```

### Reading the Output

```bash
$ diff passwords.old passwords.new
42c42
< old_password_line
---
> new_password_line
```

| Symbol | Meaning |
|---|---|
| `<` | A line belonging to the first file |
| `>` | A line belonging to the second file |
| `---` | The separator between the two files |
| `42c42` | A change on line 42 (c=change, a=add, d=delete) |
| `1,5c1,5` | Lines 1-5 changed |

### Unified Format (-u)

```bash
$ diff -u file1 file2
--- file1  2024-01-01
+++ file2  2024-01-02
@@ -42,3 +42,3 @@
 unchanged line
-old line         ← present in the first file
+new line         ← present in the second file
 unchanged line
```

### Important Flags

| Flag | Description |
|---|---|
| `-u` | Unified format (used for patches) |
| `-i` | Case-insensitive |
| `-w` | Ignore whitespace differences |
| `-r` | Compare directories |
| `-q` | Just say whether they differ or not |

### Usage in Bandit
```bash
# Level 17: find the single difference between two password files
diff passwords.old passwords.new
# the line marked with > → the new password
```

---

## echo

**Echo** — Writes text to the terminal or to a file.

### Basic Usage
```bash
echo "Hello"                # write to the screen
echo "Hello" > file.txt     # write to a file (overwrites)
echo "Hello" >> file.txt    # append to a file (writes to the end)
echo $HOME                  # show a variable's value
```

### Important Flags

| Flag | Description |
|---|---|
| `-n` | Don't add a trailing newline |
| `-e` | Interpret escape sequences (`\n`, `\t`, etc.) |

### Escape Sequences (with -e)

```bash
echo -e "line1\nline2"      # \n = new line
echo -e "col1\tcol2"        # \t = tab
echo -e "\a"                # bell sound
```

### Redirection Operators

```bash
echo "text" > file.txt      # write to a file (overwrites existing)
echo "text" >> file.txt     # append to a file (adds to existing)
echo "text" | command       # pipe it into another command
```

### Using It with Variables

```bash
name="Robin"
echo "Hello $name"          # Hello Robin
echo "Hello ${name}!"       # Hello Robin! (with curly braces)
echo 'Hello $name'          # Hello $name (single quotes don't expand variables)
```

### Usage in Bandit
```bash
# Level 20: send the password to netcat through a pipe
echo -n 'password' | nc -l -p 1234 &

# Level 22: compute a hash
echo I am user bandit23 | md5sum | cut -d ' ' -f 1

# Level 24: build a brute-force list
for i in {0000..9999}; do
    echo "password $i" >> list.txt
done
```

---

## md5sum

**MD5 Checksum** — Produces the MD5 hash of a file or string.

### Basic Usage
```bash
md5sum file.txt             # MD5 hash of a file
echo "text" | md5sum        # MD5 hash of a string
md5sum file1 file2          # multiple files
```

### Output Format

```bash
$ echo "test" | md5sum
d8e8fca2dc0f896fd7cb4cb0031ba249  -
#                                  ^ - means stdin
```

It returns the hash + two spaces + the source name. To get just the hash:
```bash
echo "test" | md5sum | cut -d ' ' -f 1
# d8e8fca2dc0f896fd7cb4cb0031ba249
```

### Hash Verification

```bash
# create a hash from a file
md5sum file.txt > file.md5

# verify it later
md5sum -c file.md5
# file.txt: OK
```

### An Important Note About MD5

MD5 is no longer **secure** for cryptographic purposes — it's vulnerable to collision attacks. It should only be used for data integrity checks. For storing passwords, algorithms like `bcrypt` and `argon2` should be preferred.

### Usage in Bandit
```bash
# Level 22: compute the file name
echo I am user bandit23 | md5sum | cut -d ' ' -f 1
# 8ca319486bfbbc3663ea0fbe81326349

cat /tmp/8ca319486bfbbc3663ea0fbe81326349
```

---

## wc

**Word Count** — Counts lines, words, and characters.

### Basic Usage
```bash
wc file.txt             # line, word, byte counts
wc -l file.txt          # line count only
wc -w file.txt          # word count only
wc -c file.txt          # byte count only
cat file.txt | wc -l    # with a pipe
```

### Important Flags

| Flag | Description |
|---|---|
| `-l` | Line count |
| `-w` | Word count |
| `-c` | Byte count |
| `-m` | Character count |

### Usage Examples

```bash
# how many lines are there?
wc -l /etc/passwd

# how many files are there?
ls | wc -l

# count how many matches grep found
grep "error" log.txt | wc -l
```

### Usage in Bandit
```bash
# Krypton Level 3: for letter-frequency analysis
for i in {A..Z}; do
    cat found1 found2 found3 | tr -cd $i | wc -c | tr -d '\n'
    printf " $i\n"
done | sort -nr
```

---

## head & tail

**Head** — Shows lines from the start of a file; **Tail** — Shows lines from the end.

### Basic Usage
```bash
head file.txt           # first 10 lines (default)
head -n 20 file.txt     # first 20 lines
head -c 100 file.txt    # first 100 bytes

tail file.txt           # last 10 lines
tail -n 20 file.txt     # last 20 lines
tail -f log.txt         # live follow (for watching logs)
```

### Important Flags

| Flag | Description |
|---|---|
| `-n N` | Show N lines |
| `-c N` | Show N bytes |
| `-f` | Update as the file grows (for tail) |
| `-q` | Don't show file names |

### Using Them Together

```bash
# show lines 11-20
head -n 20 file.txt | tail -n 10

# check only the first line of a hexdump
xxd file | head -n 1
```

### Usage in Bandit
```bash
# Level 12: check the magic number
xxd compressed_data | head -n 1
# 00000000: 1f8b 0808 ...  ← 1f8b = gzip!
```

---

## sed

**Stream Editor** — Performs transformations on a text stream. Used for replacing, deleting, and inserting.

### Basic Usage
```bash
sed 's/old/new/' file.txt        # replace the first match
sed 's/old/new/g' file.txt       # replace all matches
sed 's/old/new/gi' file.txt      # case-insensitive
sed -i 's/old/new/g' file.txt    # edit the file in place
```

### Important Uses

```bash
# delete a line
sed '3d' file.txt              # delete line 3
sed '/pattern/d' file.txt      # delete lines containing pattern

# print a line
sed -n '5p' file.txt           # show only line 5
sed -n '5,10p' file.txt        # show lines 5-10

# delete blank lines
sed '/^$/d' file.txt

# trim leading/trailing whitespace
sed 's/^[[:space:]]*//' file.txt   # leading whitespace
sed 's/[[:space:]]*$//' file.txt   # trailing whitespace
```

### Usage in Bandit
```bash
# Krypton: remove all non-uppercase characters
cat krypton3 | sed 's/[^A-Z]//g'
```

---

## 📚 Quick Reference Table

| Command | Basic Usage | What It Does |
|---|---|---|
| `grep` | `grep "pattern" file` | Find lines containing a pattern |
| `grep -v` | `grep -v "pattern" file` | Show lines not containing a pattern |
| `sort` | `sort file` | Sort lines |
| `sort -n` | `sort -n file` | Numeric sort |
| `uniq -u` | `sort file \| uniq -u` | Show unique lines |
| `uniq -c` | `sort file \| uniq -c` | Count how many times each line appears |
| `strings` | `strings binary` | Extract text from a binary |
| `cut -d: -f1` | `cut -d: -f1 /etc/passwd` | Cut by field |
| `tr` | `echo "abc" \| tr 'a-z' 'A-Z'` | Translate characters |
| `tr -d` | `echo "a1b2" \| tr -d '0-9'` | Delete characters |
| `diff` | `diff file1 file2` | Difference between two files |
| `echo` | `echo "text"` | Write text |
| `echo -n` | `echo -n "text"` | Write without a trailing newline |
| `md5sum` | `echo "text" \| md5sum` | Produce an MD5 hash |
| `wc -l` | `wc -l file` | Count lines |
| `head` | `head -n 5 file` | First N lines |
| `tail` | `tail -n 5 file` | Last N lines |
| `sed` | `sed 's/old/new/g' file` | Replace text |

---

## 🔗 More Information

- `man grep` — for regex, `man 7 regex`
- [Regex101](https://regex101.com/) — test regexes interactively
- [Explain Shell](https://explainshell.com/)

---

**Previous section:** [file_system.md](./file_system.md)  
**Next section:** [compression_encoding.md](./compression_encoding.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
