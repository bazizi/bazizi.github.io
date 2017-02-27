---
layout: post
title:  "XSS Vulnerability in GoSFU"
date:   2017-02-27
tags:
- XSS
- Hacking
- Security
- Web
- JS
- JavaScript
---

GoSFU had a feature to bookmark certain pages. I discovered multiple issues in the bookmarking feature of GoSFU:

- I could access the bookmark page without being logged into the system and I could add or remove bookmarks without any restrictions. Of course, items that were bookmarked while logged out of the system were not shown once I logged in
-  The same page had a stored XSS vulnerability and I could inject JS code into the page by modifying the bookmarks

The last and the worst, any JS code injected into the page was reflected on multiple other pages including the "Class Search" page (Students often refer to this page to search for and enroll in classes).

I reported the issues and they were fixed a few days later.

## Screenshots

Links could be modified without any restrictions:

![GoSFU](/images/GoSFU/5.png){:width="600",:height="600"}

Modifying links to contain JS code:

![GoSFU](/images/GoSFU/2.png){:width="600",:height="600"}

Dangerous characters were not escaped and JS code injected into the page was executed:
![GoSFU](/images/GoSFU/3.png){:width="600",:height="600"}

JS code injected into the page was reflected on multiple other pages including the "Class Search" page:
![GoSFU](/images/GoSFU/1.png){:width="600",:height="600"}

![GoSFU](/images/GoSFU/4.png){:width="600",:height="600"}
