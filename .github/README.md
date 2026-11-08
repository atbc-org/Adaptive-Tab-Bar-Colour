<!-- amo-ignore-start -->
<div align="center">

<img src="https://raw.githubusercontent.com/atbc-org/Assets/main/public/atbc-rich-icon.svg" width="100">

<br>

# Adaptive Tab Bar Colour

Changes the colour of Firefox theme to match the website’s appearance.

[![Mozilla Add-on Users](https://img.shields.io/amo/users/adaptive-tab-bar-colour)](https://addons.mozilla.org/firefox/addon/adaptive-tab-bar-colour/)
[![Mozilla Add-on Rating](https://img.shields.io/amo/stars/adaptive-tab-bar-colour)](https://addons.mozilla.org/firefox/addon/adaptive-tab-bar-colour/)
[![Mozilla Add-on](https://img.shields.io/amo/v/adaptive-tab-bar-colour?color=violet&label=version)](https://addons.mozilla.org/firefox/addon/adaptive-tab-bar-colour/)
[![Sponsors](https://img.shields.io/badge/sponsors-31-gold)](https://www.buymeacoffee.com/easonwong/)
[![WXT](https://img.shields.io/badge/WXT-67D55E?logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTM1NC40MzUgNDE4LjE0MUMzODMuMjE3IDQxOC4xNDEgNDA2LjU1IDM5NC44MDggNDA2LjU1IDM2Ni4wMjZWMzEzLjkxSDQxNi4wMjZDNDQ0LjgwOCAzMTMuOTEgNDY4LjE0MSAyOTAuNTc4IDQ2OC4xNDEgMjYxLjc5NUM0NjguMTQxIDIzMy4wMTMgNDQ0LjgwOCAyMDkuNjggNDE2LjAyNiAyMDkuNjhINDA2LjU1VjE1Ny41NjVDNDA2LjU1IDEyOC43ODMgMzgzLjIxNyAxMDUuNDUgMzU0LjQzNSAxMDUuNDVIMzAyLjMyVjk1Ljk3NDVDMzAyLjMyIDY3LjE5MjEgMjc4Ljk4NyA0My44NTk0IDI1MC4yMDUgNDMuODU5NEMyMjEuNDIyIDQzLjg1OTQgMTk4LjA5IDY3LjE5MjEgMTk4LjA5IDk1Ljk3NDVWMTA1LjQ1SDE0NS45NzRDMTE3LjE5MiAxMDUuNDUgOTMuODU5NCAxMjguNzgzIDkzLjg1OTQgMTU3LjU2NVYyMDkuNjhIMTAzLjMzNUMxMzIuMTE3IDIwOS42OCAxNTUuNDUgMjMzLjAxMyAxNTUuNDUgMjYxLjc5NUMxNTUuNDUgMjkwLjU3OCAxMzIuMTE3IDMxMy45MSAxMDMuMzM1IDMxMy45MUg5My44NTk0VjQxOC4xNDFIMTk4LjA5VjQwOC42NjVDMTk4LjA5IDM3OS44ODMgMjIxLjQyMiAzNTYuNTUgMjUwLjIwNSAzNTYuNTVDMjc4Ljk4NyAzNTYuNTUgMzAyLjMyIDM3OS44ODMgMzAyLjMyIDQwOC42NjVWNDE4LjE0MUgzNTQuNDM1WiIgc3Ryb2tlPSIjNjdENTVFIiBzdHJva2Utd2lkdGg9IjQwIi8+PC9zdmc+&labelColor=grey&color=%2367D55E)](https://wxt.dev/)

[English](README.md) | [English (US)](README.en-US.md) | [Azərbaycan](README.az.md) | [Deutsch](README.de.md) | [Español](README.es-ES.md) | [Français](README.fr.md) | [日本語](README.ja.md) | [Português (Brasil)](README.pt-BR.md) | [Русский](README.ru.md) | [Türkçe](README.tr.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

<a href="https://addons.mozilla.org/firefox/addon/adaptive-tab-bar-colour/" target="_blank">
	<img src="https://raw.githubusercontent.com/atbc-org/Assets/main/public/amo-download-button.svg" width="150" alt="Get the Add-on">
</a>

</div>
<!-- amo-ignore-end -->

## What Does the Add-on Do?

This add-on dynamically adjusts the Firefox theme to match the appearance of the website you are viewing, similar to the tab bar tinting feature in Safari on macOS.

<!-- amo-ignore-start -->
<div align="center">

<img src="https://addons.mozilla.org/user-media/previews/full/376/376401.png" width="48%"> <img src="https://addons.mozilla.org/user-media/previews/full/376/376402.png" width="48%"> <img src="https://addons.mozilla.org/user-media/previews/full/376/376403.png" width="48%"> <img src="https://addons.mozilla.org/user-media/previews/full/376/376404.png" width="48%">

</div>
<!-- amo-ignore-end -->

## Works Well With

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

## Incompatible With

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- Any other add-on that modifies the Firefox theme

## Customising Colour Transitions

Firefox natively applies a transition effect to tab bar colour changes. To disable this behaviour and allow Adaptive Tab Bar Colour (ATBC) to update colours instantaneously, add the following code to your CSS theme:

<!-- prettier-ignore-start -->
```css
:root {
	--ext-theme-background-transition: none !important;
	--inactive-window-transition: none !important;
}
```
<!-- prettier-ignore-end -->

Alternatively, you may prefer smooth colour transitions for the tab bar. As this cannot be natively supported due to technical limitations, add the following code to your CSS theme (thanks to [@Moarram](https://github.com/Moarram/)):

<!-- prettier-ignore-start -->
```css
body, findbar, #navigator-toolbox, #TabsToolbar, #nav-bar, #PersonalToolbar, #sidebar-box, .tab-background, .urlbar-background {
	transition:
		background-color 0.5s cubic-bezier(0, 0, 0, 1) !important,
		border-color 0.5s cubic-bezier(0, 0, 0, 1) !important,
		outline 0.5s cubic-bezier(0, 0, 0, 1) !important;
}
```
<!-- prettier-ignore-end -->

To enable smooth colour transitions in the Sidebery UI, add the following code to the Sidebery Style Editor (thanks to [@MaxHasBeenUsed](https://github.com/MaxHasBeenUsed/)):

<!-- prettier-ignore-start -->
```css
.Sidebar, .bottom-space {
	transition: background-color 0.5s cubic-bezier(0, 0, 0, 1) !important;
}
```
<!-- prettier-ignore-end -->

<!-- amo-ignore-start -->
<details>
<summary>How to apply custom CSS</summary>

1. Type `about:config` in the address bar and press Enter.
2. Search for `toolkit.legacyUserProfileCustomizations.stylesheets` and set it to `true`.
3. Type `about:support` in the address bar.
4. Find “Profile Folder” and click the “Show in Finder” (macOS) or “Open Folder” (Windows/Linux) button.
5. Create a new folder named `chrome` in your profile directory.
6. Inside the `chrome` folder, create a text file named `userChrome.css`.
7. Paste the code above into `userChrome.css` and save the file.
8. Restart Firefox.

</details>
<!-- amo-ignore-end -->

## Adaptive Theme in Context Menus

To apply the adaptive theme to context menus, add the following code to your CSS theme:

<!-- prettier-ignore-start -->
```css
:is(menupopup, panel):where(:not([type="arrow"])) {
	--panel-background-color: unset !important;
	--panel-border-color: unset !important;
}
```
<!-- prettier-ignore-end -->

Additionally, native context menus must be disabled by opening `about:config` and setting the following preferences to `false`:

- `widget.gtk.native-context-menus` (Linux)
- `widget.macos.native-context-menus` (macOS)

<!-- amo-ignore-start -->
<details>
<summary>How to apply custom CSS</summary>

1. Type `about:config` in the address bar and press Enter.
2. Search for `toolkit.legacyUserProfileCustomizations.stylesheets` and set it to `true`.
3. Type `about:support` in the address bar.
4. Find “Profile Folder” and click the “Show in Finder” (macOS) or “Open Folder” (Windows/Linux) button.
5. Create a new folder named `chrome` in your profile directory.
6. Inside the `chrome` folder, create a text file named `userChrome.css`.
7. Paste the code above into `userChrome.css` and save the file.
8. Restart Firefox.

</details>
<!-- amo-ignore-end -->

## Compatibility with Third-Party CSS Themes

A third-party CSS theme works with Adaptive Tab Bar Colour (ATBC), as long as they use Firefox’s standard colour variables (e.g. `--lwt-accent-color` for the tab bar colour). [This](https://github.com/easonwong-de/Firefox-Simple-One-Line) is an example of an ATBC-compatible CSS theme.

## Title Bar Buttons on Linux with GTK Theme

Firefox’s title bar buttons may revert to the Windows style. To prevent this, access “Advanced Preferences” (`about:config`) and set `widget.gtk.non-native-titlebar-buttons.enabled` to `false`. (Thanks to [@anselstetter](https://github.com/anselstetter/))

## Safety Reminder

Beware of malicious web UIs. It is important to distinguish between the browser UI and the web UI. For further information, please refer to [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/). (Thanks to [u/KazaHesto](https://www.reddit.com/user/KazaHesto/))
