# ⚙️ Linux Commands — Process & Shell

> The shell isn't just for running commands — with variables, pipes, redirections,  
> and background processes you can build powerful workflows.  
> These concepts are the foundation of Bandit's scripting and cron levels.

---

## 📋 Table of Contents

- [Pipe (|)](#pipe-)
- [Redirection (> >> <)](#redirection---)
- [2>/dev/null](#2devnull)
- [& (Background)](#-background)
- [jobs & fg & bg](#jobs--fg--bg)
- [Variables and $()](#variables-and-)
- [Special Variables](#special-variables)
- [echo -n](#echo--n)
- [Bash For Loop](#bash-for-loop)
- [Bash Script Basics](#bash-script-basics)
- [alias](#alias)
- [printenv & env](#printenv--env)

---

## Pipe (|)

**Pipe** — Connects one command's output to the next command's input.

### Basic Usage
```bash
cmd1 | cmd2                 # cmd1 output → cmd2 input
cmd1 | cmd2 | cmd3          # chaining
```

### How It Works

```
cat data.txt | grep "test" | sort | uniq
     ^              ^          ^       ^
     |              |          |       remove duplicates
     |              |          sort
     |              filter lines containing "test"
     read the file
```

Without a pipe, doing the same thing requires temporary files:
```bash
cat data.txt > temp1.txt
grep "test" temp1.txt > temp2.txt
sort temp2.txt > temp3.txt
uniq temp3.txt
```

With a pipe, it's a single line, no temporary files!

### Common Pipe Combinations

```bash
ls -la | grep ".txt"            # list txt files
ps aux | grep "python"          # find python processes
cat /etc/passwd | cut -d: -f1   # get the usernames
find . -type f | wc -l          # count the files
cat log.txt | grep ERROR | wc -l # count the errors
history | grep "ssh"            # ssh command history
```

### Usage in Bandit
```bash
# Level 7: search within text
cat data.txt | grep millionth

# Level 8: sort + find the unique one
sort data.txt | uniq -u

# Level 9: text from a binary + filter
strings data.txt | grep "==="

# Level 22: compute a hash
echo I am user bandit23 | md5sum | cut -d ' ' -f 1
```

---

## Redirection (> >> <)

**Redirection** — Redirects commands' input/output to files or other sources.

### Output Redirection

```bash
cmd > file          # write output to a file (erases the existing one!)
cmd >> file         # append output to a file (adds to the existing one)
```

```bash
echo "Hello" > file.txt         # writes into file.txt
echo "World" >> file.txt        # appends to the end
ls -la > list.txt               # save ls output
```

### Input Redirection

```bash
cmd < file          # read from a file
```

```bash
wc -l < file.txt    # feed the file content into wc
sort < data.txt     # feed data.txt into sort
```

### Error Redirection

In Linux there are two output channels:
- **stdout (1):** Normal output
- **stderr (2):** Error output

```bash
cmd 2> error.txt            # write the error output to a file
cmd 2>&1                    # redirect error output to stdout
cmd > output.txt 2>&1       # write both to a file
cmd &> file.txt             # shorthand: write both to a file
cmd 2>/dev/null             # hide errors
```

### What Is /dev/null?

`/dev/null` is Linux's "black hole." Everything sent there disappears. The command runs but its output isn't shown.

```bash
# see only the successful output, hide errors
find / -name "*.conf" 2>/dev/null

# hide the output entirely
cmd > /dev/null 2>&1
```

### Usage in Bandit
```bash
# Level 6: hide Permission denied errors
find / -user bandit7 -group bandit6 -size 33c 2>/dev/null

# Level 23: redirect cron job output to /dev/null
* * * * * bandit22 /usr/bin/cronjob.sh &> /dev/null
```

---

## 2>/dev/null

Used a lot, especially with the `find` command. A detailed explanation:

```bash
find / -name "secret.txt"
# you get dozens of "Permission denied: /proc/..." errors
# finding the real result becomes hard

find / -name "secret.txt" 2>/dev/null
# shows only the files that were found
```

**What does `2>` mean?**
- `1>` or `>` → redirect stdout
- `2>` → redirect stderr
- `2>&1` → redirect stderr to stdout

---

## & (Background)

Adding `&` to the end of a command runs it **in the background**. The terminal is freed up, and you can enter another command.

### Basic Usage
```bash
cmd &               # start in the background
sleep 10 &          # wait 10 seconds (in the background)
```

```bash
$ sleep 10 &
[1] 12345           # [job number] PID
$                   # the terminal is freed immediately
```

### Why Use It?

```bash
# start a server in the background, then come to the foreground and run the client
nc -l -p 1234 &
nc localhost 1234

# push a long-running task to the background
tar -czf backup.tar.gz /home/ &
```

### Usage in Bandit
```bash
# Level 20: push the netcat server to the background, then run the binary
echo -n 'password' | nc -l -p 1234 &
[1] 12345
./suconnect 1234
# Password matches!
[1]+ Done
```

---

## jobs & fg & bg

**jobs** — Lists the background processes.  
**fg** — Brings a background process to the foreground.  
**bg** — Resumes a stopped process in the background.

### Basic Usage
```bash
jobs                # list the background processes
fg                  # bring the most recent background process to the foreground
fg %1               # bring job number 1 to the foreground
bg %1               # resume job number 1 in the background
```

### Ctrl+Z and Ctrl+C

| Shortcut | Effect |
|---|---|
| `Ctrl+C` | Terminate the process |
| `Ctrl+Z` | Stop the process (push to background, not running) |
| `Ctrl+D` | Send EOF (close stdin) |

```bash
$ sleep 100
^Z                  # Ctrl+Z
[1]+  Stopped    sleep 100
$ bg %1             # resume in the background
[1]+ sleep 100 &
$ jobs
[1]+  Running    sleep 100 &
$ fg %1             # bring to the foreground
sleep 100
^C                  # terminate
```

---

## Variables and $()

### Defining a Variable

```bash
name="Robin"            # assign a value (no spaces!)
echo $name              # use it
echo ${name}            # with curly braces (safer)
echo "${name}li"        # inside a string: Robinli
```

### Assigning Command Output to a Variable

```bash
# $() syntax (recommended)
result=$(whoami)
echo $result

# backtick syntax (old method, same thing)
result=`whoami`
```

### Variable Types

```bash
# string
greeting="Hello"

# number (bash stores everything as a string but can do arithmetic)
num=42
result=$((num + 8))     # 50

# array
array=("apple" "pear" "cherry")
echo ${array[0]}         # apple
echo ${array[@]}         # all of them
```

### Usage in Bandit
```bash
# Level 22: whoami + md5sum chain
myname=$(whoami)
mytarget=$(echo I am user $myname | md5sum | cut -d ' ' -f 1)
echo $mytarget

# Level 23: using a variable in the cron script
myname=$(whoami)    # bandit23
```

---

## Special Variables

Predefined variables in the Linux shell:

| Variable | Meaning |
|---|---|
| `$0` | Script/shell name |
| `$1`, `$2`... | Script arguments |
| `$#` | Number of arguments |
| `$@` | All arguments |
| `$?` | Exit code of the last command (0=success) |
| `$$` | PID of the current shell |
| `$!` | PID of the last background process |
| `$HOME` | Home directory |
| `$PATH` | Command search paths |
| `$USER` | Username |
| `$SHELL` | Current shell |
| `$PWD` | Current directory |

```bash
echo $HOME      # /home/robin
echo $PATH      # /usr/bin:/usr/local/bin:...
echo $?         # 0 (last command succeeded)
echo $$         # 12345 (current PID)
echo $0         # /bin/bash
```

### Usage in Bandit
```bash
# Level 32: escaping the uppercase shell
# everything is converted to uppercase, but the $0 variable isn't!
>> $0
$               # a normal shell opened!
# $0 = current shell = /bin/sh → it spawned a new shell
```

---

## echo -n

By default `echo` adds a newline (`\n`). The `-n` flag prevents this.

```bash
echo "test"         # writes "test\n"
echo -n "test"      # writes "test" (no newline)
```

### Why Does It Matter?

Netcat and some protocols are sensitive to newlines. An extra `\n` can break the connection:

```bash
# wrong: sends "password\n"
echo 'password' | nc -l -p 1234

# correct: sends "password" (no newline)
echo -n 'password' | nc -l -p 1234
```

### Usage in Bandit
```bash
# Level 20: send the password exactly
echo -n '<bandit20 şifresi>' | nc -l -p 1234 &
```

---

## Bash For Loop

### Basic Syntax
```bash
for variable in list; do
    commands
done
```

### Various Uses

```bash
# number range
for i in {1..10}; do
    echo $i
done

# numbers with leading zeros
for i in {0000..9999}; do
    echo $i
done

# C-style loop
for ((i=0; i<10; i++)); do
    echo $i
done

# over files
for file in *.txt; do
    echo "Processing: $file"
    cat $file
done

# over arrays
for user in bandit0 bandit1 bandit2; do
    echo $user
done
```

### Usage in Bandit
```bash
# Level 24: try all 10000 PIN combinations
for i in {0000..9999}; do
    echo "<bandit24 şifresi> $i" >> list.txt
done
cat list.txt | nc localhost 30002 > result.txt
grep -v "Wrong" result.txt
```

---

## Bash Script Basics

### Shebang

The first line of every script specifies which interpreter to use:

```bash
#!/bin/bash     # use bash
#!/bin/sh       # use POSIX sh
#!/usr/bin/env python3  # use python3
```

### Execute Permission

```bash
chmod +x script.sh    # make it executable
./script.sh           # run it
bash script.sh        # run it directly with bash
```

### A Simple Script Example

```bash
#!/bin/bash

# define a variable
TARGET_USER="bandit24"

# run a command
HASH=$(echo "I am user $TARGET_USER" | md5sum | cut -d ' ' -f 1)

# write output
echo "Hash: $HASH"
cat /tmp/$HASH
```

### If/Else

```bash
#!/bin/bash
if [ -f "file.txt" ]; then
    echo "The file exists"
else
    echo "The file doesn't exist"
fi

# string comparison
if [ "$variable" = "value" ]; then
    echo "Equal"
fi

# numeric comparison
if [ $num -gt 10 ]; then
    echo "Greater than 10"
fi
```

### Test Conditions

| Condition | Meaning |
|---|---|
| `-f file` | Does the file exist? |
| `-d dir` | Does the directory exist? |
| `-e path` | Does the path exist? |
| `-r file` | Is it readable? |
| `-x file` | Is it executable? |
| `-z string` | Is the string empty? |
| `-n string` | Is the string non-empty? |
| `str1 = str2` | Are the strings equal? |
| `n1 -eq n2` | Are the numbers equal? |
| `n1 -gt n2` | n1 > n2? |
| `n1 -lt n2` | n1 < n2? |

### Usage in Bandit
```bash
# Level 23: write a script for cron
#!/bin/bash
cat /etc/bandit_pass/bandit24 > /tmp/mywork/password

# Level 24: brute-force script
#!/bin/bash
for i in {0000..9999}; do
    echo "PASSWORD $i" >> list.txt
done
cat list.txt | nc localhost 30002 > result.txt
```

---

## alias

**Alias** — Gives short names to long commands.

### Basic Usage
```bash
alias short='long command'      # define an alias
alias                           # list all aliases
unalias short                   # remove an alias
```

### Examples

```bash
alias ll='ls -la'
alias la='ls -A'
alias rot13="tr 'A-Za-z' 'N-ZA-Mn-za-m'"
alias grep='grep --color=auto'
alias ..='cd ..'
alias ...='cd ../..'
```

### Persistent Aliases

Aliases are lost when the terminal closes. To make them persistent, add them to `~/.bashrc` or `~/.bash_aliases`:

```bash
echo "alias ll='ls -la'" >> ~/.bashrc
source ~/.bashrc    # load the changes
```

### Usage in Bandit
```bash
# a shortcut for ROT13
alias rot13="tr 'A-Za-z' 'N-ZA-Mn-za-m'"
cat data.txt | rot13
```

---

## printenv & env

**printenv** — Lists the environment variables.  
**env** — Lists the environment variables or runs a command with a custom environment.

### Basic Usage
```bash
printenv                    # list all environment variables
printenv HOME               # show a specific variable
env                         # list all environment variables
env VAR=value command       # run a command with a custom variable
env -i command              # run with an empty environment
```

### Setting an Environment Variable

```bash
export VARIABLE="value"     # persistent with export
VARIABLE="value" command    # only for that command

# the EGG variable (Narnia)
export EGG=$(python -c 'print "\x31\xc0..."')
./narnia1                   # reads EGG
```

### Usage in Bandit
```bash
# Level 25-26: find bandit26's shell
cat /etc/passwd | grep bandit26
printenv SHELL              # see the current shell
```

---

## 📚 Quick Reference Table

| Command/Syntax | Usage | What It Does |
|---|---|---|
| `\|` | `cmd1 \| cmd2` | Connect cmd1's output to cmd2 |
| `>` | `cmd > file` | Write output to a file |
| `>>` | `cmd >> file` | Append output to a file |
| `<` | `cmd < file` | Read from a file |
| `2>/dev/null` | `find / 2>/dev/null` | Hide errors |
| `&` | `cmd &` | Run in the background |
| `jobs` | `jobs` | List background processes |
| `fg` | `fg %1` | Bring a background process to the foreground |
| `$()` | `x=$(whoami)` | Assign command output to a variable |
| `$0` | `echo $0` | Current shell name |
| `echo -n` | `echo -n "test"` | Write without a newline |
| `for` | `for i in {1..10}` | Loop |
| `alias` | `alias ll='ls -la'` | Define a shortcut |
| `export` | `export VAR=value` | Define an environment variable |
| `printenv` | `printenv PATH` | Show an environment variable |

---

## 🔗 More Information

- `man bash` — the bash manual
- [Bash Guide for Beginners](https://tldp.org/LDP/Bash-Beginners-Guide/html/)
- [ShellCheck](https://www.shellcheck.net/) — find script errors

---

**Previous section:** [permissions_users.md](./permissions_users.md)  
**Next section:** [git.md](./git.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
