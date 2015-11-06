---
layout: post
title:  "Run C++ like a scripting language/Create your own bash command"
date:   2015-11-05
categories: [bash, scripting, Linux, Uniz]
---

Here I am going to explain how to run C++ like any other scripting language.  
In addition, I am going to explain how to define your own bash command.
**Note:** This tutorial assumes you have `g++` installed. If not, run the following:
`sudo apt-get install g++`

**Goal:** When I run `cpp abc.cpp`, I want the shell to compile and execute
the  C++ file named `abc.cpp`

- Open up `~/.bashrc` as a super-user:
{% highlight bash %}
sudo vim ~/.bashrc
{% endhighlight %}

- Add the following function anywhere (preferable at the end) in the file
{% highlight bash %}
cpp(){
  g++ $1 && ./a.out
}
{% endhighlight %}

- Done. From now on you can run your C++ scripts the same way you run a scripting
language (e.g., Python, Ruby etc.) by just doing:

`cpp <script name>`
