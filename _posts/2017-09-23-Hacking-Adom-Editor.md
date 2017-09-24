---
layout: post
title:  "Hacking Atom Editor - Defining Your Own Style Sheet"
date:   2017-09-23
tags:
- Editor
- Atom
- CSS
- Less
- Hacking
---

[Atom](https://atom.io/){:target="_blank"} editor is my of my most favorite editors
(Besides [Sublime Text](https://www.sublimetext.com/){:target="_blank"} ). I mainly like Atom because its open-source and 'hackable' nature, the fact that you can configure almost everything that you see and of course the package management system (A.K.A `apm` package manager)

In this post I am going to briefly explain how you can define your own stylesheet in Atom and configure to configure look and feel of your editor.

If you are a web developer you are probably already familiar with developer tools in popular browsers. Atom editor uses the same HTML5 technology to preview tabs, fonts, etc.

The following steps guide you to create a basic stylesheet:

- *Opening Developer Tools*: You can open the developer toos by pressing `Ctrl+Shift+I`.
The developer tools is almost identical to Chrome/Firefox Dev tools.

![Atom Dev Tools](/images/atom-devtools.png)

- *Finding CSS Attributes of an Eleemnt*: Similar to browser developer tools (e.g., Firefox),
you can find CSS attributes of an elemnt by doing the following:

    - Click on the arrow icon on the top left corner of dev tools
    - Click on the element you want to define an stylesheet for
    - In the HTML view of dev tools, right click on the element then select
        `Copy -> Copy selector`
- *Defining Your Stylesheet*: You can open up your custom stylesheet by pressing `Ctrl+Shift+P` and search for `stylesheet` then select `Application: Open your stylesheet`

At this point if you know enough of CSS/Less, you should be able to configure the style of the element (e.g., font-size, font-color, background-color, etc.) by pasting your CSS/Less
code into the `styles.less` file.

For example, the following is a simple stylesheet that sets font-size of tabs, tooltips and side pane (tree-view) to 24px and sets the font-color of the active tab to green color.

```css
@font-size: 24px;
html, body, .tree-view, .tooltip, .tab-bar .tab {
  font-size: @font-size;
}


body > atom-workspace > atom-workspace-axis > atom-workspace-axis > atom-pane-container > atom-pane > ul > li.texteditor.tab.sortable.active > div.title {
     color: green;
}
```
