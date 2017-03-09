---
layout: post
title:  "Linux: Mounting Windows drives on startup"
date:   2015-11-06
tags:
- fstab
- Linux
- Ubuntu
- NTFS
---
In this post I am going to explain how to mount Windows drives on start up.
In this example, my Windows machine has drives `C`, `D` and `E`.

## 1. Preparing the mount points
- The first step is to create some mount points to mount the Windows drives
{% highlight bash  %}
behnam@behnam-Aspire-5733 ~ $ cd /media
behnam@behnam-Aspire-5733 ~ $ sudo mkdir C D E tmp
{% endhighlight %}

- We will use the `tmp/` directory in the above to test the partitions and
find out which partition corresponds to which Windows drive (i.e., `C`, `D` or `E`)

## 2. Finding the mount partitions
- The next step is to find out which partitions should be mounted
{% highlight bash  %}
behnam@behnam-Aspire-5733 ~ $ sudo fdisk -l

Disk /dev/sda: 500.1 GB, 500107862016 bytes
255 heads, 63 sectors/track, 60801 cylinders, total 976773168 sectors
Units = sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 4096 bytes
I/O size (minimum/optimal): 4096 bytes / 4096 bytes
Disk identifier: 0x17d6956b

   Device Boot      Start         End      Blocks   Id  System
/dev/sda1            2048    33556479    16777216   27  Hidden NTFS WinRE
/dev/sda2   *    33556480    33761279      102400    7  HPFS/NTFS/exFAT
/dev/sda3        33761280   351658699   158948710    7  HPFS/NTFS/exFAT
/dev/sda4       351660030   976769023   312554497    f  W95 Ext\'d (LBA)
Partition 4 does not start on physical sector boundary.
/dev/sda5       547524608   771766271   112120832    7  HPFS/NTFS/exFAT
/dev/sda6       771768320   976769023   102500352    7  HPFS/NTFS/exFAT
/dev/sda7       351660032   539811839    94075904   83  Linux
/dev/sda8       539813888   547510271     3848192   82  Linux swap / Solaris

Partition table entries are not in disk order

{% endhighlight %}

- The next step is to test each of the NTFS drives to find out which one of the
partitions are either of `C`, `D` or `E` drive. In the following example,
I tested `/dev/sda3`:
{% highlight bash  %}
behnam@behnam-Aspire-5733 ~ $ sudo mount /dev/sda3 /media/tmp
behnam@behnam-Aspire-5733 ~ $ cd /media/tmp
behnam@behnam-Aspire-5733 ~ $ ls
{% endhighlight %}
- Now based on the contents of the directory you should be able to find out
which drive (`C`, `D` or `E`) the above partition corresponds to. In my case
it was `C` drive (All the following instruction are only for this partition).

## 3. Modiying "fstab"
- Assuming that you want to mount the `C` drive (That we just found to be
  `/dev/sda3`), edit `/etc/fstab` and add the following entry at the end of the
  file:
{% highlight bash  %}
/dev/sda3     /media/C           ntfs-3g    rw              0       0
{% endhighlight %}

- You need to repeat the above step for all other windows partitions that you
have.

## 4. Testing
- To test you `/etc/fstab` file, you need to run the following command:
{% highlight bash  %}
behnam@behnam-Aspire-5733 ~ $ sudo mount -a
{% endhighlight %}
- Look for any errors (If applicable) to be able to fix your `fstab` file if
required

## 5. An example
- Finally, here is how my `/etc/fstab` looks like (Some of the lines may
  be unrelated to this particular blog post):

{% highlight bash  %}
# /etc/fstab: static file system information.
#
# Use 'blkid' to print the universally unique identifier for a
# device; this may be used with UUID= as a more robust way to name devices
# that works even if disks are added and removed. See fstab(5).
#
# <file system> <mount point>   <type>  <options>       <dump>  <pass>
# / was on /dev/sda7 during installation
UUID=dd3fcb27-0764-44bc-8a76-0b2cbf8d4978 /               ext4    errors=remount-ro 0       1
# swap was on /dev/sda8 during installation
UUID=7370b7ec-2a04-4dac-97e0-f68e983f9ed5 none            swap    sw              0       0
/dev/sda3     /media/C           ntfs-3g    rw              0       0
/dev/sda5     /media/E          ntfs-3g    rw               0       0
/dev/sda6     /media/D          ntfs-3g    rw               0       0
{% endhighlight %}
