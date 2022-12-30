---
layout: post
title:  "Emscripten And The Future of Web Gaming"
date:   2017-05-27
tags:
- gaming
- Unity3d
- Unity
- game engine
- Emscripten
- JS
- 3D

---

Recently I've been learning game development using [Unity Game Engine](https://unity3d.com/){:target="_blank"} and I plan to make a game this year. So far there have been lots of concepts around game mechanics that I have been learning (The concepts I learned in my Physics 120 were not so useless after all!).


One of the unbelievably cool features of of [Unity Game Engine](https://unity3d.com/){:target="_blank"} is the fact that it can cross compile your C# or JS code to make it work on multiple platforms including  Android, iOS, PC and even Web!

[Here](https://blogs.unity3d.com/2014/04/29/on-the-future-of-web-publishing-in-unity/){:target="_blank"} I saw a blog about how Unity uses [Emscripten](https://github.com/kripken/emscripten){:target="_blank"} to compile machine language into JS code that runs in browser! It's pretty amazing isn't it?




**Long story short, here you can see a simple 3D game I made that is cross-compiled to work with WebGL. The game may take up to 10 seconds to load:**

<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>Unity WebGL Player | Ball Game</title>
<link rel="shortcut icon" href="/ball-game/TemplateData/favicon.ico">
<link rel="stylesheet" href="/ball-game/TemplateData/style.css">
<script src="/ball-game/TemplateData/UnityProgress.js"></script>  
<script src="/ball-game/Build/UnityLoader.js"></script>
<script>
  var gameInstance = UnityLoader.instantiate("gameContainer", "/ball-game/Build/Html5.json", {onProgress: UnityProgress});
</script>


<div class="">
  <div id="gameContainer" style="width: 960px; height: 600px"></div>
  <div class="footer">
    <div class="webgl-logo"></div>
    <div class="fullscreen" onclick="gameInstance.SetFullscreen(1)"></div>
  </div>
</div>

**Controls:**

- jump: Mouse left click / Space
- move using arrow keys
- rotate the camera using mouse
