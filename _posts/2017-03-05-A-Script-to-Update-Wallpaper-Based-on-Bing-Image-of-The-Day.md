---
layout: post
title:  "A Script to Update Wallpaper Based on Bing Image of the Day"
date:   2017-03-05
tags:
- Python
- Linux
- Wallpaper
---

Isn't it cool that every time you turn on your computer a new random wallpaper shows up?

In this post I am going to share a script that, when run, grabs the Bing image of the day and sets it as your wallpaper.

Please note that it only works on Unity desktop (Ubuntu) but with slight modifications you can make it work on pretty much any desktop environment in Linux.

For example, if your desktop environment is cinammon you can change the following line:

`gsettings set org.gnome.desktop.background`

To the following:

`gsettings set org.cinammon.desktop.background`

and in general to:

`gsettings set org.[NAME_OF_DESKTOP_ENVIRONMENT_HERE].desktop.background`

Here you go:

```python
# Author: Behnam Azizi
# Date: March 5, 2017
# Description: A Script to Update Wallpaper Based on Bing Image of the Day

import urllib.request
import re
import os

file_path, headers = urllib.request.urlretrieve("http://www.bing.com/")

with open(file_path, 'r') as f:
	image_url = 'http://www.bing.com' + re.findall(r'g_img\=\{url: \"([^\"]+)', f.read() )[0]
	image_path, headers = urllib.request.urlretrieve(image_url)
	print( os.popen("gsettings set org.gnome.desktop.background picture-uri file://{path}".format(path=image_path) ).read())
```
