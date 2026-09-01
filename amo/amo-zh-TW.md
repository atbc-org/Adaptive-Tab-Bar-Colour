**主要功能**

此擴充套件可動態調整 Firefox 佈景主題，使之與閣下正在瀏覽的網站融為一體——正如 macOS Safari 的標題列着色功能一樣。

**和此擴充套件運作無間的有**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**和此擴充套件不相容的有**

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- 任何修改 Firefox 佈景主題的擴充套件

**移除工具列底部的陰影**

要移除網頁內容在瀏覽器工具列上投射的細微陰影，請前往設定（`about:preferences`）並在「瀏覽器版面」部分關閉「顯示側邊欄」。另外，閣下亦可將以下程式碼加入閣下的 CSS 主題：

> `#tabbrowser-tabbox, .browserContainer {`

> > `box-shadow: none !important;`

> `}`

**自訂色彩轉場**

Firefox 預設會為標題列的色彩變更套用轉場效果。若要停用此行為並讓變色標題列（ATBC）即時更新色彩，請將以下程式碼加入你的 CSS 主題：

> `:root {`

> > ```
> > --ext-theme-background-transition: none !important;
> > --inactive-window-transition: none !important;
> > ```

> `}`

或者，你可能偏好標題列擁有平滑的色彩轉場。由於技術限制，這無法原生支援。不過，閣下可將以下程式碼加入你的 CSS 主題（感謝 [@Moarram](https://github.com/Moarram/)）：

> `#navigator-toolbox, #TabsToolbar, #nav-bar, #PersonalToolbar, #sidebar-box, .tab-background, .urlbar-background, findbar, body {`

> > `transition:`

> > > ```
> > > background-color 0.5s cubic-bezier(0, 0, 0, 1) !important,
> > > border-color 0.5s cubic-bezier(0, 0, 0, 1) !important,
> > > outline 0.5s cubic-bezier(0, 0, 0, 1) !important;
> > > ```

> `}`

若要啟用 Sidebery 介面的平滑色彩轉場，請將以下程式碼加入 Sidebery 樣式編輯器（感謝 [@MaxHasBeenUsed](https://github.com/MaxHasBeenUsed/)）：

> `.Sidebar, .bottom-space {`

> > `transition: background-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

**在右鍵功能表套用動態主題**

若要在右鍵功能表套用動態主題，請將以下程式碼加入你的 CSS 主題：

> `:is(menupopup, panel):where(:not([type="arrow"])) {`

> > ```
> > --panel-background-color: unset !important;
> > --panel-border-color: unset !important;
> > ```

> `}`

此外，亦必須透過開啟 `about:config` 並將以下偏好設定設為 `false` 以停用原生右鍵功能表：

- `widget.gtk.native-context-menus` (Linux)
- `widget.macos.native-context-menus` (macOS)

**與第三方 CSS 主題的相容性**

第三方 CSS 主題可與變色標題列（ATBC）相容，只要它們使用 Firefox 的標準顏色變數（例如，`--lwt-accent-color` 用於標題列顏色）。譬如，[這](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme)是一個與 ATBC 相容的 CSS 主題。

**Linux 配搭 GTK 主題時的標題列按鈕**

Firefox 的標題列按鈕或會重設為 Windows 風格。為免此發生，請開啟「進階偏好設定」（`about:config`），並將 `widget.gtk.non-native-titlebar-buttons.enabled` 設為 `false`。（感謝 [@anselstetter](https://github.com/anselstetter/)）

**安全提示**

提防惡意網頁介面。分辨瀏覽器介面與網頁介面至關重要。如需更多資訊，請參閱 [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/)。（感謝 [u/KazaHesto](https://www.reddit.com/user/KazaHesto/)）

閣下可移步 GitHub 為此專案加星標：[https://github.com/atbc-org/Adaptive-Tab-Bar-Colour](https://github.com/atbc-org/Adaptive-Tab-Bar-Colour)
