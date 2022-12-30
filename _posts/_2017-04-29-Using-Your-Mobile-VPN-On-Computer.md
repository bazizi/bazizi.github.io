---
layout: post
title:  "Using Your Mobile VPN On Computer"
date:   2017-04-29
tags:
- VPN
- Networking
- SSH
- Security
- Ubuntu
- Linux
---

When it comes to VPN software there at least a dozen free software for mobile devices that require almost zero configuration, however, I've noticed the same software often require you to sign up or pay in order to use their software on your computer. In this post I am going to explain how you could easily use the VPN service on your mobile phone (Assuming you have VPN software installed on your phone) to connect from your computer.

The trick is to create an SSH tunnel through your phone and since your phone is already connected to the rest of the world through VPN you will be all set. In summary:

`Your Computer --> SSH TUNNEL --> Mobile Device --> VPN --> Internet`


- To do so you will need to install an SSH server on your phone. My favorite SSH server on android devices is [SSHelper](https://play.google.com/store/apps/details?id=com.arachnoid.sshelper&hl=en){:target="_blank"}


- Here is how my SSH server configuration looks like:

![SSHelper Configuration Screenshot](/images/sshelper.png)


- Then on my computer I create the SSH tunnel (SOCKS):

`ssh -fCND 8080 -p 2222 192.168.1.64`

Where `192.168.1.64` is the private IP address of my mobile phone. In the above, we forward all requests to port `8080` of `localhost` to port `2222` of `192.168.1.64`, which is where our SSH server is running.

Finally you would need to configure proxy settings in your browser to forward all requests through the SOCKS tunnel (As explained in a [previous post](/2017/03/09/Using-a-SOCK-Proxy-for-Security-and-Privacy/) I made):
![Firefox Proxy Settings](/images/proxy_settings.png)

- Let's ask Google for my location by IP:

![My Location According to Google](/images/my_location.png)


I definitely do not live in SF and Bingo! We are now using VPN.
