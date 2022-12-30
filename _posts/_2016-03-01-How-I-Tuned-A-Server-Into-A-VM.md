---
layout: post
title:  "How I turned a live Red Hat Linux server into a VM"
date:   2016-03-01
tags:
- Linux
- VM
---

<p>In this post I am going to discuss how I managed to turn a live and running RHEL 5.4 server into a Virtual Machine.</p>

<p>Perhaps, it would not be too hard to shutdown a machine, and make an exact clone of an OS using the &#39;dd&#39; tool in Linux. But shutting down a server which could be used by anyone at any given time is not risk-free.</p>

<p><br />
&nbsp;</p>

<p>A few notes before the tutorial:</p>

<ul>
<li>
<p style="margin-bottom: 0in">This example is exactly how I done it (So you may need to make changes for your scenario).</p>
</li>
<li>
<p style="margin-bottom: 0in">The running server in question has hostname &#39;dummy-server&#39; and runs on RHEL 5.4 (Tikanga)</p>
</li>
<li>
<p style="margin-bottom: 0in">I used KVM for virtualization</p>
</li>
<li>
<p>I used commands such as &#39;virt-install&#39;, &#39;virt-rescue&#39; and &#39;virt-img&#39; (So you might need to install their corresponding packages if you don&#39;t have them)</p>
</li>
</ul>

<p><br />
&nbsp;</p>

<h2 class="western">Create a raw image container</h2>

<p align="left"><br />
&nbsp;</p>

<ul>
<li>
<p align="left">First get the total size required from the server:</p>
</li>
</ul>

<p><em>11:44:20 [build@dummy-server ~]$ df -h</em></p>

<p><em>Filesystem Size Used Avail Use% Mounted on</em></p>

<p><em>/dev/mapper/vg0-lv01 2.0G 1.6G 281M 86% /</em></p>

<p><em>/dev/mapper/vg0-lv04 3.9G 807M 2.9G 22% /tmp</em></p>

<p><em>/dev/mapper/vg0-lv03 62G 29G 31G 49% /var</em></p>

<p><em>/dev/mapper/vg0-lv05 17G 14G 2.4G 86% /usr</em></p>

<p><em>/dev/mapper/vg1-lvhome</em></p>

<p><em>99G 73G 21G 79% /home</em></p>

<p><em>/dev/cciss/c0d0p1 99M 20M 74M 22% /boot</em></p>

<p><em>tmpfs 3.0G 0 3.0G 0% /dev/shm</em></p>

<p><em>/dev/mapper/vg0-lvtest</em></p>

<p><em>31M 31M 0 100% /mnt</em></p>

<p><em>nfs-server</em><em><a href="http://ns-build-host/home/repos/www/builds">:/home/repos/www/builds</a></em></p>

<p><em>1.8T 382G 1.4T 22% /home/build/builds</em></p>

<p><br />
&nbsp;</p>

<ul>
<li>
<p>The total size required is the sum of &#39;Used&#39; space in all partitions except the NFS mount points. In this case total size required is &lt;158.</p>
</li>
</ul>

<p><br />
&nbsp;</p>

<ul>
<li>
<p>Get the amount of RAM on the machine:</p>
</li>
</ul>

<p align="left"><em>11:50:57 [build@dummy-server ~]$ free -g</em></p>

<p align="left"><em>total used free shared buffers cached</em></p>

<p align="left"><em>Mem: 5 5 0 0 0 2</em></p>

<p align="left"><em>-/+ buffers/cache: 3 2</em></p>

<p align="left"><em>Swap: 1 0 1</em></p>

<p align="left"><br />
&nbsp;</p>

<ul>
<li>
<p>When creating the image, add an extra 2*(RAM size) for swap partition (in this case ~10GB):</p>
</li>
</ul>

<p align="left"><em>qemu-img create -f qcow2 dummy-server-vm.qcow2 168G </em></p>

<h2 class="western"><a name="TheVMbackupofnsbuild2(whatitisandhowitwasdone)-Createaloopdevicetoaccessimagepartitions"></a> Create a loop device to access image partitions</h2>

<ul>
<li>
<p>Make sure the loop device is not already connected (disconnnect it) and then re-create it:</p>
</li>
</ul>

<p><em>modprobe nbd max_part=8 </em></p>

<p><em>qemu-nbd -d /dev/nbd0 </em></p>

<p><em>qemu-nbd -c /dev/nbd0 dummy-server-vm.qcow2 </em></p>

<p><br />
&nbsp;</p>

<p>Optionally you can use &#39;losetup&#39; to manually create the block devices, but that is error-prone.</p>

<h2 class="western"><a name="TheVMbackupofnsbuild2(whatitisandhowitwasdone)-Partitiontheimage(loopdevice)usingfdisk"></a> Partition the image (loop device) using fdisk</h2>

<ul>
<li>
<p>For this step it is recommended using fdisk (as opposed to cfdisk for example) to partition the image. I once used cfdisk and that resulted in several problems (Partitions shown by cfdisk did not agree with the result outputted by fdisk). If you are not familiar with disk partitioning you may need to follow this tutorial: <a href="http://tldp.org/HOWTO/Partition/fdisk_partitioning.html">http://tldp.org/HOWTO/Partition/fdisk_partitioning.html</a></p>
</li>
<li>
<p>Create a &#39;test&#39; image to practice partitioning using fdisk. Here was how my partition table looked like at the end of the day:</p>
</li>
</ul>

<p><em>fdisk -l /dev/nbd0 </em></p>

<p><em>Device Boot Start End Blocks Id System </em></p>

<p><em># This will be my /boot partition</em></p>

<p><em>/dev/nbd1p1 * 2048 63487 30720 83 Linux </em></p>

<p><em># This will be my swap partition</em></p>

<p><em>/dev/nbd1p2 63488 21035007 10485760 82 Linux swap / Solaris </em></p>

<p><em># This will be my / partition</em></p>

<p><em>/dev/nbd1p3 21035008 308281343 143623168 83 Linux </em></p>

<ul>
<li>
<p>A few notes:</p>

<ul>
    <li>
    <p>Make sure to mark the boot partition (first partition in the above) as bootable</p>
    </li>
</ul>
</li>
</ul>

<h2 class="western"><a name="TheVMbackupofnsbuild2(whatitisandhowitwasdone)-Formatthepartitionsandmounttheblockdevices:"></a> Format the partitions and mount the block devices:</h2>

<p>Now that we have partitioned our image, we need to format the partitions and mount the block devices to be able to access the contents of the image:</p>

<p><em>mkfs.ext3 -v /dev/nbd0p1</em></p>

<p><em>mkfs.ext3 -v /dev/nbd0p3</em></p>

<p><em>mkdir -p /mnt/dummy-server-the-vm/boot </em></p>

<p><em>partprobe /dev/nbd0 </em></p>

<p><em>mount /dev/nbd0p3 /mnt/dummy-server-the-vm</em></p>

<p><em>mount /dev/nbd0p1 /mnt/dummy-server-the-vm/boot</em></p>

<h2 class="western"><a name="TheVMbackupofnsbuild2(whatitisandhowitwasdone)-Copythefilesover"></a> Copy the files over</h2>

<ul>
<li>
<p>Now that we have the mount points, we can copy the files over to the VM image from the remote server. Please note that in the following example I excluded the NFS-mounted directories:</p>
</li>
</ul>

<p>tar -C / --exclude=&#39;./home/build/builds&#39; -czf - / | ssh root@bazizi &quot;cd <em>/mnt/dummy-server-the-vm</em> &amp;&amp; tar xvzf -&quot;</p>

<p><br />
&nbsp;</p>

<ul>
<li>
<p>Q/As:</p>

<ul>
    <li>
    <p>Q: Why do we use tar+ssh instead of rsync?</p>

    <p>A: I have tried both methods and it turned out tar+ssh multiple times faster than regular rsync (Not just because of the compression! It turns out even regular &#39;tar -c&#39; without compression is faster than sending individual files). If you have a wide bandwidth you may want to use rsync</p>
    </li>
</ul>
</li>
</ul>

<h2 class="western"><a name="TheVMbackupofnsbuild2(whatitisandhowitwasdone)-Setupgrubandre-generateinitrd.img"></a> Setup grub and re-generate initrd.img</h2>

<p>Once the files are copied over, we need to deal with more low-level parts of the VM (i.e., MBR and Grub). To do this step, you need to choose either of the following methods:</p>

<h3 class="western"><a name="TheVMbackupofnsbuild2(whatitisandhowitwasdone)-Method1:Usingvirt-rescue(recommended)"></a> Method 1: Using virt-rescue (recommended)</h3>

<ul>
<li>
<p>Access the contents of the VM using virt-rescue:</p>
</li>
</ul>

<p><em>virt-rescue dummy-server-vm2.raw </em></p>

<ul>
<li>
<p>Mount (bind) procfs and other devices:</p>
</li>
</ul>

<p><em>mount /dev/sda3 /sysroot/ </em></p>

<p><em>mount /dev/sda1 /sysroot/boot/ </em></p>

<p><em>mount --bind /dev /sysroot/dev </em></p>

<p><em>mkdir -p /sysroot/dev/pts </em></p>

<p><em>mount --bind /dev/pts /sysroot/dev/pts </em></p>

<p><em>mount --bind /proc /sysroot/proc </em></p>

<p><em>mount --bind /sys /sysroot/sys </em></p>

<ul>
<li>
<p>Change root:</p>
</li>
</ul>

<p><em>chroot /sysroot/ </em></p>

<ul>
<li>
<p>Now that your root is changed, setup grub:</p>
</li>
</ul>

<p><em>grub </em></p>

<p align="left"><em>&gt; </em><em>root (hd0,0) </em></p>

<p><em>&gt; </em><em>setup (hd0) </em></p>

<ul>
<li>
<p>Here was my output after running the above:</p>
</li>
</ul>

<p><em>grub&gt; setup (hd0) </em></p>

<p><em>setup (hd0) </em></p>

<p><em>Checking if &quot;/boot/grub/stage1&quot; exists... no </em></p>

<p><em>Checking if &quot;/grub/stage1&quot; exists... yes </em></p>

<p><em>Checking if &quot;/grub/stage2&quot; exists... yes </em></p>

<p><em>Checking if &quot;/grub/e2fs_stage1_5&quot; exists... yes </em></p>

<p><em>Running &quot;embed /grub/e2fs_stage1_5 (hd0)&quot;... 15 sectors are embedded. </em></p>

<p><em>succeeded </em></p>

<p><em>Running &quot;install /grub/stage1 (hd0) (hd0)1+15 p (hd0,0)/grub/stage2 /grub/grub.conf&quot;... succeeded </em></p>

<p><em>Done. </em></p>

<ul>
<li>
<p>Assuming that you got no errors, next you need to re-generate the &#39;initrd*.img&#39; file like the following:</p>
</li>
</ul>

<p><em>mkinitrd --with virtio_pci --with virtio_blk /boot/initrd-2.6.18-194.img 2.6.18-194.el5 </em></p>

<p>where &#39;2.6.18-194.el5 &#39; was found by running:</p>

<p><em>uname -a</em></p>

<p><em>Linux dummy-server-the-vm 2.6.18-194.el5 #1 SMP Mon Mar 29 22:10:29 EDT 2010 x86_64 x86_64 x86_64 GNU/Linux</em></p>

<h3 class="western"><a name="TheVMbackupofnsbuild2(whatitisandhowitwasdone)-Method2:Withoutusingvirt-rescue"></a> Method 2: Without using virt-rescue</h3>

<p>If you decide to choose this method, all you need to do is to run the mount commands in &#39;Method 1&#39; and continue from there.</p>

<h2 class="western"><a name="TheVMbackupofnsbuild2(whatitisandhowitwasdone)-Editgrub.conf"></a> Edit grub.conf</h2>

<ul>
<li>
<p>We need to edit &#39;/boot/grub/grub.conf&#39; to reflect our changes. Here is how my grub configuration file looks like:</p>
</li>
</ul>

<p><em>default=0</em></p>

<p><em>timeout=5</em></p>

<p><em>splashimage=(hd0,0)/grub/splash.xpm.gz</em></p>

<p><em>hiddenmenu</em></p>

<p><em>title Enterprise Linux Enterprise Linux Server (2.6.18-194.el5)</em></p>

<p><em>root (hd0,0)</em></p>

<p><em>kernel /vmlinuz-2.6.18-194.el5 ro root=/dev/vda3 rhgb</em></p>

<p><em>initrd /initrd-2.6.18-194.img</em></p>

<p><em>title Enterprise Linux (2.6.18-164.el5)</em></p>

<p><em>root (hd0,0) </em></p>

<p><em>kernel /vmlinuz-2.6.18-164.el5 ro root=/dev/vda3 rhgb</em></p>

<p><em>initrd /initrd-2.6.18-164.img</em></p>

<p><br />
&nbsp;</p>

<ul>
<li>
<p>A few notes:</p>

<ul>
    <li>
    <p>I used &#39;/dev/vda3&#39; instead of &#39;/dev/nbd0p3&#39; (root partition) because KVM sees partitions in format &#39;/dev/vdax&#39;</p>
    </li>
    <li>
    <p>In the above, you need to replace <em>&#39;/<a href="http://initrd-2.6.18-164.im/">initrd-2.6.18-164.im</a>g&#39; </em>with the initrd image you generated in the previous steps</p>
    </li>
</ul>
</li>
</ul>

<p><br />
&nbsp;</p>

<h2 class="western"><a name="TheVMbackupofnsbuild2(whatitisandhowitwasdone)-Editfstab"></a> Edit fstab</h2>

<p>You also need to edit your fstab to mount the correct partitions to the correct locations (Depending on your partitioning scheme). Please note that physical partitions have format &#39;/dev/vdax&#39;. For example, here is how my fstab looks like:</p>

<p><br />
&nbsp;</p>

<p><em>/dev/vda3 / ext3 defaults 1 1 </em></p>

<p><em>/dev/vda1 /boot ext3 defaults 1 2 </em></p>

<p><em>devpts /dev/pts devpts gid=5,mode=620 0 0 </em></p>

<p><em>sysfs /sys sysfs defaults 0 0 </em></p>

<p><em>proc /proc proc defaults 0 0 </em></p>

<p><em>/dev/vda2 swap swap defaults 0 0 </em></p>

<h2 class="western"><a name="TheVMbackupofnsbuild2(whatitisandhowitwasdone)-AddaNetworkDevice"></a> Add a Network Device</h2>

<ul>
<li>
<p>The new VM does not have a network device by default so you need to add one to be able to connect to the network. Most virtual machine managers (e.g., KVM, virtualbox etc.) provide easy ways to add new network devices.</p>

<p>&nbsp;</p>
</li>
</ul>

<h2 class="western"><a name="TheVMbackupofnsbuild2(whatitisandhowitwasdone)-BoottheVM"></a> Boot the VM</h2>

<p>Boot the VM and let&#39;s hope everything goes smoothly! If not, most probably you made a mistake steps &#39;Setup grub and re-generate initrd.img&#39; or &#39;Edit grub.conf&#39;.</p>

<h2 class="western"><a name="TheVMbackupofnsbuild2(whatitisandhowitwasdone)-ChangetheHostname/IP"></a> Change the Hostname/IP</h2>

<p># vim /etc/sysconfig/network-scripts/ifcfg-eth0</p>

<p>DEVICE=eth0</p>

<p>BOOTPROTO=none</p>

<p>ONBOOT=yes</p>

<p>HWADDR=&lt;YOUR MAC ADDRESS GOES HERE&gt;</p>

<p>IPADDR=&lt;YOUR IP ADDRESS GOES HERE&gt;</p>

<p><br />
&nbsp;</p>

<p># service network restart</p>

<p><br />
&nbsp;</p>
