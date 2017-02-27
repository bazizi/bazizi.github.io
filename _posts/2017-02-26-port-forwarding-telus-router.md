---
layout: post
title:  "Port Forwarding on T3200M (Telus) Router"
date:   2017-02-26
tags:
- portforwarding
- router
- networking
- nmap
---

Last week I switched form SHAW Communications to Telus internet 50. I normally forward a few ports on my router to access my web server and proxy at home while I'm at work or outside.

Surprisingly, port forwarding on the new router did not seem to work. There was absolutely no documentation online and I was abou to give up! But after digging around and hours of trial an error and searching through forums I found out that it was a combination of the following issues:

- Telus blocked well known ports (e.g., 22, 25, 80, 443) by default so I had to use ports > 1000
- When testing, I could not access my network while using Telus internet (Don't ask me why!)

I was quite surpried that when I connected using my phone data it worked, while I could not access my network using my internet at home!

There is probably no need to mention that I could not nmap either. [This](http://canyouseeme.org/){:target="_blank"} online port scanning tool helpled me find out when it worked:
