# 🌐 Linux Commands — Networking

> In Linux, networking tools are indispensable for both system administration  
> and security testing. From SSH to port scanning, from netcat to SSL connections,  
> these tools were used in Bandit's most critical levels.

---

## 📋 Table of Contents

- [ssh](#ssh)
- [scp](#scp)
- [nc (netcat)](#nc-netcat)
- [openssl](#openssl)
- [nmap](#nmap)
- [curl](#curl)
- [wget](#wget)

---

## ssh

**Secure Shell** — Establishes an encrypted connection to remote servers.

### What Is SSH?

SSH encrypts the communication between two computers. Unlike older protocols such as Telnet, passwords and commands don't travel over the network as plain text.

```
Local Machine ─── Encrypted Tunnel ──→ Remote Server
```

### Basic Usage
```bash
ssh user@server                    # default port 22
ssh user@server -p 2220            # custom port
ssh -i key.pem user@server         # with a private key
ssh user@server command            # run a command remotely
```

### Important Flags

| Flag | Description | Example |
|---|---|---|
| `-p PORT` | Specify the port | `-p 2220` |
| `-i FILE` | Private key file | `-i ~/.ssh/id_rsa` |
| `-v` | Verbose (debug output) | `-v` |
| `-vv` | More debug | `-vv` |
| `-t` | Force a pseudo-terminal | `-t /bin/sh` |
| `-L PORT:HOST:PORT` | Local port forwarding | `-L 8080:localhost:80` |
| `-N` | Don't run a command, just tunnel | `-N -L 8080:...` |
| `-X` | X11 forwarding (GUI applications) | `-X` |

### Logging In with an SSH Key

More secure than logging in with a password. Two keys are generated:
- **Private key** → stays with you, never share it
- **Public key** → added to the server (`~/.ssh/authorized_keys`)

```bash
# generate a key pair
ssh-keygen -t ed25519 -C "mail@example.com"

# copy the public key to the server
ssh-copy-id user@server

# now you can log in without a password
ssh user@server
```

### The SSH Config File

You can save your frequently used connections in the `~/.ssh/config` file:

```
Host bandit
    HostName bandit.labs.overthewire.org
    Port 2220
    User bandit0
```

```bash
# now you only need to type:
ssh bandit
```

### Running Commands Remotely

```bash
# run a single command
ssh user@server ls /home

# multiple commands
ssh user@server "ls /home; whoami"

# open a shell (.bashrc bypass)
ssh user@server /bin/bash
ssh user@server -t /bin/sh
```

### Usage in Bandit
```bash
# Level 0: connect
ssh bandit0@bandit.labs.overthewire.org -p 2220

# Level 13-14: connect with a private key
chmod 600 sshkey.private
ssh -i sshkey.private bandit14@localhost -p 2220

# Level 18: .bashrc bypass
ssh bandit18@bandit.labs.overthewire.org -p 2220 cat readme
ssh bandit18@bandit.labs.overthewire.org -p 2220 -t /bin/sh
```

---

## scp

**Secure Copy** — Copies files over SSH.

### Basic Usage
```bash
# copy from remote to local
scp user@server:/remote/file /local/path

# copy from local to remote
scp /local/file user@server:/remote/path

# copy a directory
scp -r folder/ user@server:/remote/path
```

### Important Flags

| Flag | Description |
|---|---|
| `-P PORT` | Specify the port (uppercase P — different from ssh!) |
| `-i FILE` | Use a private key |
| `-r` | Copy a directory recursively |
| `-v` | Verbose |
| `-C` | Transfer with compression |

### Usage in Bandit
```bash
# Level 13: download the private key to your own machine
scp -P 2220 bandit13@bandit.labs.overthewire.org:sshkey.private .
chmod 600 sshkey.private
```

---

## nc (netcat)

**Netcat** — A versatile tool that reads and writes data over the network. Known as the "Swiss Army knife of networking."

### Basic Usage
```bash
# connect to a server
nc host port

# start a listening server
nc -l -p port

# connect with a timeout
nc -w 5 host port
```

### Important Flags

| Flag | Description |
|---|---|
| `-l` | Start in listen mode |
| `-p PORT` | Specify the port |
| `-v` | Verbose |
| `-z` | Port scan mode (no data sent) |
| `-w N` | N-second timeout |
| `-u` | Use UDP (default is TCP) |
| `-e command` | Run a command once connected (in some versions) |

### Use Cases

```bash
# send data to a port
echo "hello" | nc localhost 30000

# simple web server
echo -e "HTTP/1.1 200 OK\n\nHello" | nc -l -p 8080

# port scan
nc -zv host 20-30

# file transfer
# receiver:
nc -l -p 1234 > file.txt
# sender:
nc receiver_ip 1234 < file.txt

# listen in the background
nc -l -p 1234 &
```

### Usage in Bandit
```bash
# Level 14: send the password to a port
nc localhost 30000
<password>

# Level 20: start a netcat server in the background
echo -n 'password' | nc -l -p 1234 &
./suconnect 1234
```

---

## openssl

**OpenSSL** — A connection and cryptography tool that uses the SSL/TLS protocols.

### What Are SSL/TLS?

**SSL (Secure Sockets Layer)** and its successor **TLS (Transport Layer Security)** encrypt a network connection. It's the core technology behind HTTPS. You can't connect to an SSL server with plain `nc`.

### Basic Usage
```bash
# connect to an SSL/TLS server
openssl s_client -connect host:port

# show certificate info
openssl s_client -connect host:443 -showcerts

# use a specific TLS version
openssl s_client -connect host:443 -tls1_2
```

### s_client Flags

| Flag | Description |
|---|---|
| `-connect host:port` | The address to connect to |
| `-showcerts` | Show the certificates |
| `-ign_eof` | Don't close the connection on EOF |
| `-quiet` | Hide connection info |
| `-tls1_2` | Use TLS 1.2 |
| `-tls1_3` | Use TLS 1.3 |

### After Connecting

```bash
$ openssl s_client -connect localhost:30001
# connection info appears (certificate, cipher, etc.)
# then it waits...
# type the password and press Enter
<password>
Correct!
<next password>
```

> 💡 If you see `HEARTBEATING` or `Read R BLOCK`:
> - press the `R` key, or
> - add the `-ign_eof` flag

### Other openssl Uses

```bash
# generate a hash
echo "text" | openssl md5
echo "text" | openssl sha256

# generate random data
openssl rand -hex 16         # 16 bytes hex
openssl rand -base64 24      # 24 bytes base64

# create an RSA key
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# encrypt a file
openssl enc -aes-256-cbc -in file.txt -out encrypted.bin
openssl enc -d -aes-256-cbc -in encrypted.bin -out decrypted.txt
```

### Usage in Bandit
```bash
# Level 15: send the password to a port over SSL
openssl s_client -connect localhost:30001
<password>

# Level 16: find the SSL port and send the password
openssl s_client -connect localhost:31790
<password>
```

---

## nmap

**Network Mapper** — Performs network scanning and service detection.

### Basic Usage
```bash
nmap target                     # basic scan
nmap 192.168.1.0/24             # network scan
nmap -p 80,443 target           # scan specific ports
nmap -p 1-1000 target           # scan a port range
nmap -p- target                 # scan all ports (1-65535; port 0 not included)
```

### Important Flags

| Flag | Description | Example |
|---|---|---|
| `-p PORT` | Specify a port or range | `-p 80-443` |
| `-sV` | Service/version detection | `-sV` |
| `-sS` | SYN scan (fast, stealthy) | `-sS` |
| `-sT` | TCP Connect scan | `-sT` |
| `-sU` | UDP scan | `-sU` |
| `-O` | OS detection | `-O` |
| `-A` | Aggressive (OS + version + scripts) | `-A` |
| `-v` | Verbose | `-v` |
| `-Pn` | Scan without pinging | `-Pn` |
| `--open` | Show only open ports | `--open` |
| `-oN file` | Save normal output to a file | `-oN result.txt` |

### Port States

| State | Meaning |
|---|---|
| `open` | Port is open, a service is listening |
| `closed` | Port is closed, connection refused |
| `filtered` | A firewall is blocking it |
| `open\|filtered` | Open or filtered (common with UDP) |

### Service Detection (-sV)

```bash
$ nmap -sV localhost -p 31000-32000
PORT      STATE SERVICE  VERSION
31046/tcp open  echo
31518/tcp open  ssl/echo
31691/tcp open  echo
31790/tcp open  ssl/unknown   ← an unknown service using SSL
31960/tcp open  echo
```

### Usage in Bandit
```bash
# Level 16: find the SSL port between 31000-32000
nmap -sV localhost -p 31000-32000

# ssl/echo → just echoes
# ssl/unknown → this is our target
openssl s_client -connect localhost:31790
```

---

## curl

**Client URL** — Makes HTTP/HTTPS requests. Used to test web pages and APIs.

### Basic Usage
```bash
curl https://example.com            # fetch the page
curl -o file.html https://...       # save to a file
curl -L https://...                 # follow redirects
curl -I https://...                 # show headers only
```

### Important Flags

| Flag | Description | Example |
|---|---|---|
| `-o FILE` | Save the output to a file | `-o index.html` |
| `-O` | Save with the remote file's name | `-O` |
| `-L` | Follow redirects | `-L` |
| `-I` | HEAD request (headers only) | `-I` |
| `-v` | Verbose (request and response) | `-v` |
| `-s` | Silent (no progress bar) | `-s` |
| `-u user:pass` | HTTP Basic Auth | `-u natas0:natas0` |
| `-H "Header: val"` | Add a custom header | `-H "Cookie: x=1"` |
| `-d "data"` | Send POST data | `-d "user=a&pass=b"` |
| `-X METHOD` | Specify the HTTP method | `-X POST` |
| `-b "cookie"` | Send a cookie | `-b "loggedin=1"` |
| `-c file` | Save cookies to a file | `-c cookies.txt` |

### Usage in Natas
```bash
# Level 4: change the Referer header
curl -u natas4:<password> \
  http://natas4.natas.labs.overthewire.org/ \
  -H "Referer: http://natas5.natas.labs.overthewire.org/"

# Level 9: command injection
curl -u natas9:<password> \
  "http://natas9.natas.labs.overthewire.org/?needle=;cat+/etc/natas_webpass/natas10"

# POST request
curl -u natas15:<password> \
  http://natas15.natas.labs.overthewire.org/ \
  -d "username=natas16&debug="
```

---

## wget

**Web Get** — A file download tool. Similar to curl but designed specifically for downloading files.

### Basic Usage
```bash
wget https://example.com/file.zip     # download a file
wget -O target.zip https://...        # download with a different name
wget -c https://...                   # resume an interrupted download
wget -r https://...                   # download an entire site (recursive)
wget -q https://...                   # quiet mode
```

### curl vs wget

| Feature | curl | wget |
|---|---|---|
| Purpose | API testing, flexibility | File downloading |
| Recursive download | ✗ | ✓ |
| HTTP methods | ✓ (full support) | Limited |
| Use with pipes | ✓ | ✓ |
| Resume download | ✗ | ✓ |

---

## 📚 Quick Reference Table

| Command | Basic Usage | What It Does |
|---|---|---|
| `ssh` | `ssh user@host -p 22` | Connect to a remote server |
| `ssh -i` | `ssh -i key.pem user@host` | Connect with a key |
| `ssh host command` | `ssh host cat /etc/passwd` | Run a command remotely |
| `scp` | `scp -P 22 user@host:file .` | Copy a file |
| `nc` | `nc localhost 30000` | Connect to a port |
| `nc -l` | `nc -l -p 1234` | Listen on a port |
| `openssl s_client` | `openssl s_client -connect host:443` | SSL connection |
| `nmap -sV` | `nmap -sV host -p 1-1000` | Scan ports and services |
| `curl` | `curl -u user:pass https://...` | HTTP request |
| `curl -H` | `curl -H "Header: val" https://...` | Custom header |
| `wget` | `wget https://.../file` | Download a file |

---

## 🔗 More Information

- `man ssh` · `man nc` · `man nmap` · `man curl`
- [SSH Man Page](https://man.openbsd.org/ssh)
- [Nmap Reference Guide](https://nmap.org/book/man.html)
- [curl Everything](https://everything.curl.dev/)

---

**Previous section:** [compression_encoding.md](./compression_encoding.md)  
**Next section:** [permissions_users.md](./permissions_users.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*
