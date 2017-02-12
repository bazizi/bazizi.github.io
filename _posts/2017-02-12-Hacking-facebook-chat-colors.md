---
layout: post
title:  "Setting Facebook chat to any color"
date:   2017-02-12
tags:
- HTTP
- JavaScript
- JS
categories: jekyll update
---

The UI in Facebook allows only certain colors to be set for a chat, like the following:
![Facebook chat color changer](/images/facebook-chat-color.png){:width="200"}

I noticed the body of the `POST` request contains the color  in hex format encoded like the following:

    color_choice=%23e68585& ...

Using `decodeURIComponent(str)` in JavaScript, we can see that the above color decodes to `#e68585`

By modifying the value and encoding it using [URL Encoder/Decoder](http://meyerweb.com/eric/tools/dencoder/){:target="__blank"} or `encodeURIComponent(str)` we can set the chat color to any color.
