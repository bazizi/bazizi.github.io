#!/usr/bin/python
#Post generator
import time, os, sys
title = sys.argv[1]
date = time.strftime("%Y-%m-%d")
file_name = date + "-" + title.replace(" ", "-") + ".md"
if not os.path.isfile(file_name):
    f = open(file_name, "wb+")
    f.write("""---
layout: post
title:  "%s"
date:   %s
categories: jekyll update
---""" % (title, date))
    f.close()

os.system("atom " + file_name)
