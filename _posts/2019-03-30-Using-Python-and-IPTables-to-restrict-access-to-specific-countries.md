---
layout: post
title:  "An adaptive firewall: Using Python and IPTables to restrict access to specific countries"
date:   2019-03-30
tags:
- Python
- IPTables
- Linux
- OpenVPN
---

Recently I setup an `OpenVPN` server for personal use with strict IPTables rules that allow incoming access only through TCP port `443` (The port I run `OpenVPN` on) and block outgoing access except through the same port (HTTPS):

```bash
-A INPUT -s 10.8.0.0/24 -i tun0 -p tcp -j ACCEPT
-A INPUT -i eth0 -p tcp -m tcp --dport 443 -j ACCEPT
-A INPUT -i eth0 -p tcp -m conntrack --ctstate ESTABLISHED -j ACCEPT
-A INPUT -i eth0 -p tcp -j DROP
-A FORWARD -i tun0 -p tcp -m tcp --dport 443 -j ACCEPT
-A FORWARD -i tun0 -p tcp -j DROP
-A FORWARD -i tun0 -p udp -m udp --dport 53 -j ACCEPT
-A FORWARD -i tun0 -p udp -j DROP
COMMIT
```

Additionally, I setup a python script that used `tcpdump` to log incoming connections to the server. Interestingly, I found out that my server got a few requests from the outside (that wasn't by me). Since the server running on port `443` was `OpenVPN` and not a real HTTPS service, I could see errors in syslog:
![Screenshot of syslog showing failure in HTTPS handshake](/images/tcp-443.png)

So I decided to write a quick-and-dirty Python script that finds the country of origin for each incoming tcp request and adds a rule to the `IPTables` firewall to block unwanted requests outside CA. Additionally, it does a very basic caching of processed hosts to avoid adding duplicate rules.

Here it goes:
```python
#!/usr/bin/python
import subprocess as sub
import re
import urllib2
import socket

def nslookup(host):
    ip_list = []
    print("Getting IP address for hostname: " + host)
    try:
        ais = socket.getaddrinfo(host,0,0,0,0)
        for result in ais:
            ip_list.append(result[-1][0])
    except:
        print("An error occured")
    return list(set(ip_list))

cached_hosts = {}
allowed_countries = {'CA'}
bufsize = 0
f = open('cached_hosts', 'r+', buffering=bufsize)
for line in f:
    cached_hosts[line.strip()] = 1
p = sub.Popen(('sudo', 'tcpdump', '-l', 'dst port 443 and dst 10.0.2.4'), stdout=sub.PIPE)
for row in iter(p.stdout.readline, b''):
    matches = re.findall(r'IP\s+([^\s]+)\.[^\s]+', row.rstrip())
    if matches: 
        if matches[0] not in cached_hosts:
            f.write(matches[0] + '\n')
            ips = nslookup(matches[0])
            if ips:
                r = urllib2.urlopen("https://ipinfo.io/" + ips[0] + "/country")    
                if r:
                    country = r.read().strip()
                    print(country)
                    cached_hosts[matches[0]] = 1
                    if country not in allowed_countries:
						print("BLOCKED:  " + matches[0] + " from country " + country)
						sub.Popen(('sudo', 'iptables', '-I', 'INPUT', '1', '-s', ips[0] , '-j', 'DROP'), stdout=sub.PIPE)
                    else:
	                    print("ALLOWED: " + matches[0] + " from country " + country)
f.close()
```