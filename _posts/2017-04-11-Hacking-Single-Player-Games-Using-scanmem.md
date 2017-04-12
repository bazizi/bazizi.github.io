---
layout: post
title:  "Hacking Single Player Games Using scanmem"
date:   2017-04-11
tags:
- Hacking
- Facebook
- scanmem
- cheat engine
- Ubuntu
- Linux
---

If you are reading this post you may already be familiar with [Cheat Engine](http://www.cheatengine.org/){:target="_blank"} in Windows. In this post I am going to talk about   [scanmem](https://github.com/scanmem/scanmem){:target="_blank"}, that is, an open-source, Linux-based tool similar to [Cheat Engine](http://www.cheatengine.org/) that can be used to hack client-side applications, or more specifically, games.

The project on GitHub explains very nicely what the tool does:

>>"scanmem is a debugging utility designed to isolate the address of an arbitrary variable in an executing process. scanmem simply needs to be told the pid of the process and the value of the variable at several different times.

>> After several scans of the process, scanmem isolates the position of the variable and allows you to modify its value."

*Scanmem* allows you to search for a value in memory and modify it. The idea is that given that you know the memory address of a variable in a game, you can modify it to any value you want (Of course, to modify the memory address being used by another process you need root/admin access).

*Scanmem* can be installed quite easily on Ubuntu by running:

`sudo apt-get install gameconqueror`

The hard part is that often (almost always) when you search for a value there are 1000s of addresses in memory that hold the value you search for. Scanmem, however, makes the job easier by allowing you to modify the values in the game and make your search narrower.



This of course will not normally work on most multi-player games unless the developers do the logic on the client-side.

It is pretty nice when you get back to the games you once found hard and conquer them with no effort! (Of course it will basically ruin the game too)

Here are a few of games on the Internet that I tried and could be hacked easily:

- [Plants vs. Zombies](http://www.addictinggames.com/download-games/plantsvszombies.jsp){:target="_blank"}
- [kingdom Rush](http://armorgames.com/play/12141/kingdom-rush){:target="_blank"}
- [kingdom Rush Frontiers](http://armorgames.com/play/15717/kingdom-rush-frontiers){:target="_blank"}
- [Candy Crush Saga](https://apps.facebook.com/candycrush/){:target="_blank"}
- [Lethal Race](https://www.miniclip.com/games/lethal-race/en/){:target="_blank"}

## Screenshots:
UI of Scanmem (Game Conqueror):
![User Interface of Scanmem](/images/scanmem.png)

A few hacked games:
![Candy Crush - Hacked](/images/scanmem-1.png)
![Lethal Race - Hacked](/images/scanmem-2.png)
