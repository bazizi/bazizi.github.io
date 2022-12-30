---
layout: post
title:  "The Many Ways To Transfer Files Over a Network"
date:   2017-05-16
tags:
- Networking
- Linux
- Windows
- Ubuntu
- Bash
---

**My purpose: I hope after reading this post, next time that you want to move files between computers you will not torture yourself, and endanger the security and privacy of your company by using services like GMail, Dropbox, or sketchy file upload services! (Seriously, I have seen quite experienced people who still do the above)**

In this post I am going to explain the many ways a file can be transfered from one machine to another in the same network. For the purpose of this blog post, our scenario is to transfer a file named `wannacry.exe` between two machines with the following specifications:

```
Sender:
    - OS: Ubuntu

Receiver:
    - OS: Windows
    - Hostname: widnows-home
    - Private IP Address: 192.168.1.200
    - User: behnam

Subnet Mask: 192.168.1.0/24
```



### Method 1: Using Netcat or NCat (Bash)
Doing so requires having a bash shell with nc or ncat installed. Of course, this can be useful on Windows too since Bash shell can now be integrated into Windows [quite easily](https://msdn.microsoft.com/en-us/commandline/wsl/install_guide){:target="_blank"}.

**On the receiver side (Server)**

```bash
nc -l 0.0.0.0 9000 > WNCry.exe

# Verify the integrity of the file
behnam@windows-home:~/bin$ sha256sum WNCry.exe
ed01ebfbc9eb5bbea545af4d01bf5f1071661840480439c6e5babe8e080e41aa  WNCry.exe
```

**On the sender side (Client)**

```bash
# Calculate checksum so that we can verify the integrity of the file on the receiver side
behnam@hp-gate:/tmp$ sha256sum wannacry.exe
ed01ebfbc9eb5bbea545af4d01bf5f1071661840480439c6e5babe8e080e41aa  wannacry.exe
behnam@hp-gate:/tmp$ cat wannacry.exe | nc 192.168.1.200 9000
```

---


### Method 2: Using HTTP (Python)

**On the sender side (Client)**

```bash
# If using python 2.x:
python -m SimpleHTTPServer 9000

# If using python 3.x
python -m http.server
```

**On the receiver side (Server)**

*Simply open [http://192.168.1.200:9000](http://192.168.1.200:9000){:target="_blank"} in your browser and you will have access to all files that reside in the working directory from which you started the server.*


---

### Method 3: Using HTTP (PHP)

**On the sender side (Client)**


```bash
php -S 0.0.0.0:9000
```

**On the receiver side (Server)**


*Simply open [http://192.168.1.200:9000/wannacry.exe](http://192.168.1.200:9000/wannacry.exe){:target="_blank"} in your browser and you can download the file.*

---

### Method 4: Using Rsync (SSH)

This method is especially useful if you want to sync many files. It can be used reliably as a backup solution as well:

**On the receiver side (Server)**

*Just make sure `rsync` and `openssh-server` are installed. For this method to work properly, the `rsync` program on the server side needs to have the same version as the one on teh client side.*

**On the sender side (Client)**

```bash
# Option 1: Without SSH
rsync -avxzP ./wannacry.exe behnam@192.168.1.200:~

# Option 2: Using SSH
rsync -avxzPe "ssh" ./wannacry.exe behnam@192.168.1.200:~
```
---

### Method 5: Using SCP
**On the receiver side (Server)**

Again for this method to work you need `openssh-server` installed on the server side:

**On the sender side (Client)**

```bash
scp ./wannacry.exe behnam@192.168.1.200:~
```
---

### Method 6: Using SFTP
**On the receiver side (Server)**

Not my favorite way of transferring files, but as long as `openssh-server` is installed on the reciever side you can transfer files using SFTP. There are also GUI programs like [FileZilla](https://filezilla-project.org/) which make your life easier.



**On the sender side (Client)**

```bash
sftp behnam@192.168.1.200
```
