---
layout: post
title:  "An Alternative to VPN - Using a SOCKS Proxy for Security and Privacy"
date:   2017-03-09
tags:
- SSH
- Proxy
- SOCKS
- Linux
- Ubuntu
- Security
- VPN
- port-forwarding
---

One of the lesser known features of SSH is port forwarding and sending data through an encrypted tunnel to a remote server.
That's the idea behind SOCKS proxies. I personally prefer SOCKS over VPN
because all you need for it is an SSH server to connect to and it requires almost zero configuration to work
(As opposed to VPN which has a crazy complicated configuration process).

Here is in general how you can tunnel through a remote server (Assuming you have SSH access):

`ssh -CND <port number> <username>@<hostname>`

Example:

`ssh -CND 8080 bazizi@fraser.sfu.ca`

In the above example, all request sent to port 8080 of localhost (127.0.0.1) will be encrypted and proxied through `fraser.sfu.ca`.
Most applications can be configured to use SOCKS proxies. In the following screen shot you can see
how Firefox can be configured to forward all requests to the tunnel we just created in the above:

![image](/images/proxy_settings.png)

So for example, if we connect to `www.facebook.com` using the above configuration, the request will
traverse the following path (at the very least).

`localhost --> fraser.sfu.ca --> www.facebook.com (HTTPS)`

Everything sent between `localhost` and `fraser.sfu.ca` in the above are encrypted by SSH, therefore, we have another
layer of encryption besides HTTPS.

This is also a basic idea behind TOR (The Onion Router) protocol, except that in TOR there are may intermediate layers of encryption.

In a later post I will explain how SSH can also be used to access an internal network behind a NAT (Network Address Translation) firewall...
