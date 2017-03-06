---
layout: post
title:  "A Backup Script in Bash (Rsync)"
date:   2017-03-06
tags:
- Bash
- Linux
- Windows
- Backup
- Rsync
- GRUB
- Ubuntu
---


I bought a new PC with Windows 10 installed two months ago and, as usual, the first thing I did was to dual boot Windows 10 and Ubuntu. However, one strange issue that I've encountered is that every time I boot into Windows, the next time I try to boot into Ubuntu, the desktop does not load and instead the following error is shown (Shell access is perfectly fine):

```
[drm:cpt_set_fifo_underrun_reporting] ERROR uncleared pch fifo underrun on pch transcoder A
[drm:cpt_serr_int_handler] ERROR PCH transcoder A FIFO underrun
```

I personally find boot errors extremely annoying especially because once my PC does not boot I end up using my phone (or another PC) to look up and resolve the error. There is probably no need to mention that you cannot copy/paste either.


I booted from live USB but so much to my surprise, re-generating the GRUB boot-loader did not work:

`sudo update-grub`

But fortunately re-installing GRUB from scratch fixed the issue:

`sudo grub-install /dev/sda`

This problem happened not even once, or two times, but rather three times! Until I realized this actually happened every time I booted into Windows 10. **I probably didn't need any more reasons in my life to hate Windows more than I do but this one was added to the list as well!**


I learned my lesson and decided that regularly (almost every day) backup my whole system. I had previously used Rsync and it is indeed a very fast and great tool for doing so I wrote an Rsync script to backup my system to a separate partition.


The first time the script was run took ~30mins to backup my whole system. But now it takes ~5mins only, making it ideal since I can easily backup everything every day. Yes, Rsync is great!


Here I share my script for other people to use:

**WARNING:** Use this script wisely! You need to change the variables for to fit your scenario. I won't be responsible for your loss of data.


```bash
#!/bin/bash

# Author: Behnam Azizi
# Date: Feb 26, 2017
# Description: Back-up script


date_today=$(date +%Y-%m-%d)
backup_destination_root="/media/behnam/backup/backups/hp/"

# Locations to backup
backup_locations=("/" "/home/behnam/" "/boot/")

# Directories to exclude in backup
excludes=("/Downloads/ISOs" "/VirtualBox VMs" "/Dropbox" "/Hacks" "/WL 100" "/media" "/mnt" "/tmp" "/.cache" "/var/log")

# optional: Location to log the result
log_location="/var/log/backup.log"


# Update the directory name to represent date of backup
cd $backup_destination_root
rm *
mv *  $date_today
mkdir -p $backup_destination_root/$date_today # This is necessary to create the dir in case it does not exist



# Add excludes to file
truncate -s 0 excludes.txt
for exclude in "${excludes[@]}"
do
	echo "$exclude" >> excludes.txt
done


echo "========== $date_today ==========" >> /var/log/backup.log
dirnum=1
for backup_location in "${backup_locations[@]}"
do
	# Create backup location
	echo $backup_destination_root
	echo $backup_location
	mkdir -p $backup_destination_root/$date_today/$dirnum


	# Do the backup
	rsync -avx --exclude-from excludes.txt $backup_location $backup_destination_root/$date_today/$dirnum
	let "dirnum++"
done

echo "DONE" >> $log_location
```
