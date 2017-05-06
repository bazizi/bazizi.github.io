---
layout: post
title:  "Email: Tracking A Receiver's Geolocaiton/Knowing If Your Email Was Read"
date:   2017-05-06
tags:
- Networking
- Security
- Hacking
- Metasploit
- Python
---


### The Problem
This will probably be one of my most interesting posts. This post I am going to explain how something as simple as reading an email could expose someone's geolocation and/or how you could know if an email was read or not.

Recently, (and for the 100th time) I received an scam email in my spam folder telling me that I won $850,000 USD and they asked for my personal info:

![Screenshot showing the scam email I received](/images/scam-email.png)


I was thinking how I could possibly trick the scammers or gain more info about them or possibly hack them so that they would learn their lesson. I initially sent them a link to a malicious Metasploit payload (Supposedly my identification documents) that once opened I would get their IP info (e.g., through Apache HTTP logs) and upon running the executable I would gain access to their machine.

Unfortunately, based on my server logs, they did not even click on the link so I started to wonder if my email was read at all!

### Did They Read My E-mail?
The first (non-practical) idea that comes to mind is to embed some JS code in your HTML email and send it to the victim, however, almost all web browsers block JS code for security reasons.

### The Solution
But fortunately (Or unfortunately) there is even an easier way: Embedding external images/resources in your email. The idea is that if I embed an external image in the body of my email like the following:

```HTML
<meta charset="utf-8">
Hi:<br>
Here is a screenshot of my passport:
<img src="http://<HOSTNAME-GOES-HERE>/test.png">
```

Once the reader opens the email, the browser will try to load the image and therefore it would send an HTTP request to my server, and bingo! We can simulate clicking a link, and finally, get the IP info of the victim as well as knowing the exact time our email was opened!



### Different Mail Clients
Some mail applications block images by default (I think now we know why!). For example, I noticed that Yahoo does this:

![Screenshot Showing Yahoo Mail Blocking Images](/images/email-track.png)

But surprisingly, Gmail seems to load images without prompting the user:

![Screenshot Showing Gmail Not Blocking Images](/images/email-track-gmail.png)



And finally, the URLs do not even have to point to an actual file that exists on the server. For example, to track different users I can send a different URL to every victim! (As long as I know which person received which URL):

![Screenshot Showing Python Build-in HTTP Server](/images/python-http-server.png)

<small>P.S.  The above is not my nor the scammer's IP address  :)</small>

### Tracking Geo-location by IP

Of course, there is no definite way to find the geo-location of an IP address but at least this should give us an idea of whereabouts of the victim. There are various services on the internet that keep track of IP addresses by geo-location and an easy one is

`http://ipinfo.io/<IP ADDRESS HERE>`

For example:

`http://ipinfo.io/66.249.84.207`

After all, this is just one out of many things that we can do during the reconnaissance stage of our hacking adventure!
