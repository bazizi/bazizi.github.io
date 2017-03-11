---
layout: post
title:  "Bypassing NAT Firewall Using Reverse SSH Port Forwarding"
date:   2017-03-10
tags:
- SSH
- Linux
- Ubuntu
- Security
- port-forwarding
- Networking
---

**WARNING:** Everything discussed in this post is just for learning purposes. Do not use this at work without permission of your local system admin!

Probably at some time you required access your computer at home or work place and you ended up using third-party software like TeamViewer or LogMeIn. I always feel a bit inconvenient using third party software to access any machine I am responsible for. **Why? Well, for the same reason that you do not want guys at TeamViewer or LogMeIn have access to your data!**


So what's the solution? Perhaps, for example if you're using Windows, you forward port 3389 of router to the same port (whatever RDP is running on) on your machine or do the similar to make Mac or Linux work with VNC.

But what if you are not allowed to modify your router's NAT? That's when reverse connections come to the rescue, or in this case, Reverse SSH. Let's explain this using a real-world scenario:

**Scenario**

- You have SSH access to a machine with hostname `abc.com` and username `jbond`. This machine happens to have port `80` (HTTP) open but there is no service using this port
- You have a web server on your machine at home/work running on port `8000`. This web server is not accessible outside your home network

**Goal**: You want to access your web server at work/home from outside your home/work network

**Solution:**

- From your machine at home/work, create a reverse SSH connection to `abc.com` and reverse forward port `80` of `abc.com` to port `8000` (The port your web server is running on) of your localhost (127.0.0.1)

```
ssh -NR 8000:localhost:80 jbond@abc.com
```

- You can now access your web server at home by visiting `http://abc.com` (Or `http://abc.com:80`)

*It's cool isn't it? Well it is, until your computer gets infected with spyware that use a similar technique to bypass your router's basic protection!*

**In a later post, I will explain how you can use reverse connections to create a backdoor on an Android device...**
