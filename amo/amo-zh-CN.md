**主要功能**

此插件可动态调整 Firefox 背景主题，使之与您正在浏览的网站融为一体——正如 macOS Safari 的标签栏着色功能一样。

**与本插件兼容的插件有**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**与本插件不兼容的有**

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- 任何修改 Firefox 背景主题的插件

**移除工具栏底部的阴影**

要移除网页内容在浏览器工具栏上投射的细微阴影，请前往设置（`about:preferences`）并在「浏览器布局」部分关闭「显示侧栏」。或者，将以下代码添加到您的 CSS 主题：

> `#tabbrowser-tabbox, .browserContainer {`

> > `box-shadow: none !important;`

> `}`

**自定义颜色过渡**

Firefox 原生会为标签栏的颜色更改应用过渡效果。如果您希望移除这个行为并让变色标签栏（ATBC）实时更改颜色，请将以下代码添加到您的 CSS 主题中：

> `:root {`

> > ```
> > --ext-theme-background-transition: none !important;
> > --inactive-window-transition: none !important;
> > ```

> `}`

另外，您可能更喜欢标签栏拥有平滑的颜色过渡。由于技术限制，这无法原生支持。不过，您可以通过将以下代码添加到您的 CSS 主题来启用此效果（感谢 [@Moarram](https://github.com/Moarram/)）：

> `#navigator-toolbox, #TabsToolbar, #nav-bar, #PersonalToolbar, #sidebar-box, .tab-background, .urlbar-background, findbar, body {`

> > `transition:`

> > > ```
> > > background-color 0.5s cubic-bezier(0, 0, 0, 1) !important,
> > > border-color 0.5s cubic-bezier(0, 0, 0, 1) !important,
> > > outline 0.5s cubic-bezier(0, 0, 0, 1) !important;
> > > ```

> `}`

要在 Sidebery 界面中启用平滑颜色过渡，请将以下代码添加到 Sidebery 样式编辑器（感谢 [@MaxHasBeenUsed](https://github.com/MaxHasBeenUsed/)）：

> `.Sidebar, .bottom-space {`

> > `transition: background-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

**在右键菜单中启用变色主题**

要在右键菜单中应用变色主题，请将以下代码添加到您的 CSS 主题中：

> `:is(menupopup, panel):where(:not([type="arrow"])) {`

> > ```
> > --panel-background-color: unset !important;
> > --panel-border-color: unset !important;
> > ```

> `}`

此外，还必须通过打开 `about:config` 并将以下首选项设置为 `false` 来禁用原生右键菜单：

- `widget.gtk.native-context-menus` (Linux)
- `widget.macos.native-context-menus` (macOS)

**与第三方 CSS 主题的兼容性**

第三方 CSS 主题可与变色标签栏（ATBC）兼容，只要它们使用 Firefox 的标准颜色变量（例如，`--lwt-accent-color` 用于标签栏颜色）。比如，[这](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme)是一个与 ATBC 兼容的 CSS 主题。

**Linux 搭配 GTK 主题时的标题栏按钮**

Firefox 的标题栏按钮可能会被重置为 Windows 风格。为了避免这种情况，请打开「高级首选项」（`about:config`），并将 `widget.gtk.non-native-titlebar-buttons.enabled` 设置为 `false`。（感谢 [@anselstetter](https://github.com/anselstetter/)）

**安全提示**

提防恶意网页界面。分辨浏览器界面与网页界面至关重要。如需更多信息，请参阅 [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/)。（感谢 [u/KazaHesto](https://www.reddit.com/user/KazaHesto/)）

欢迎您为 GitHub 仓库点亮 star：[https://github.com/atbc-org/Adaptive-Tab-Bar-Colour](https://github.com/atbc-org/Adaptive-Tab-Bar-Colour)
