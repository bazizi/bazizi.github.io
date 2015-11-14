---
layout: post
title:  "Create your own Agar.io game server"
date:   2015-11-14
categories: jekyll update
---
In this post I am going to explain how to create your own game Agar.io server
and play with friends. We will use an open-source implementation of Agar.io
named Ogar. The following instruction are done in Ubuntu (or any other similar
    distribution). In order to play with friends, you need to be under the
    same network (Unless you want to use a VPN server as a relay point).

## Requirements:

- Windows/Linux/Mac (The following instructions will be for Linux only)
- nodeJS
- git CLI (If you're a Windows user, you can download git CLI from
[here](https://git-scm.com/downloads)

- **Download the source code**:
{% highlight bash %}
    git clone git://github.com/OgarProject/Ogar.git
{% endhighlight %}
- **Install WebSocket module in nodeJS**:
Agar.io makes heavy use of WebSockets. To install the module run the following
command (without changing your current directory):
{% highlight bash %}
    npm install ws
{% endhighlight %}

- **Startup your Agar.io server:**
{% highlight bash %}
    npm install ws
{% endhighlight %}
- Finally, you (and your friends) can navigate to [http://127.0.0.1:443](http://127.0.0.1:443)
to play the game

## Configuring your server:
To configure the game server, you can modify the file `src/gameserver.ini`.
Some of the game variables you can change:
- Size of food
- Initial size of cells
- Maximum size of cells
- Split size

Additionally, you can run commands that change game variables in real-time.
For a list of commands please refer to [Ogar Project on Github](https://github.com/OgarProject/Ogar/tree/master/src)
