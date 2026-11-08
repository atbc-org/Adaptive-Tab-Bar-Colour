<!-- amo-ignore-start -->
<div align="center">

<img src="https://raw.githubusercontent.com/atbc-org/Assets/main/public/atbc-rich-icon.svg" width="100">

<br>

# Adaptive Tab Bar Colour

Muda a cor do tema do Firefox para combinar com a aparência dos sites.

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

## O que a extensão faz?

Essa extensão ajusta dinamicamente o tema do Firefox para combinar com a aparência do site que você está visualizando, similar a função de coloração das abas do macOS

<!-- amo-ignore-start -->
<div align="center">

<img src="https://addons.mozilla.org/user-media/previews/full/376/376401.png" width="48%"> <img src="https://addons.mozilla.org/user-media/previews/full/376/376402.png" width="48%"> <img src="https://addons.mozilla.org/user-media/previews/full/376/376403.png" width="48%"> <img src="https://addons.mozilla.org/user-media/previews/full/376/376404.png" width="48%">

</div>
<!-- amo-ignore-end -->

## Funciona bem com

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

## Incompatível com

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- Qualquer outra extensão que modifique o tema do Firefox

## Personalizar transições de cores

O Firefox aplica nativamente um efeito de transição às mudanças de cor da barra de abas. Para desativar esse comportamento e permitir que Adaptive Tab Bar Colour (ATBC) atualize as cores instantaneamente, adicione o seguinte código ao seu tema CSS:

<!-- prettier-ignore-start -->
```css
:root {
	--ext-theme-background-transition: none !important;
	--inactive-window-transition: none !important;
}
```
<!-- prettier-ignore-end -->

Alternativamente, você pode preferir transições de cores suaves para a barra de abas. Como isso não pode ser suportado nativamente devido a limitações técnicas, adicione o seguinte código ao seu tema CSS (obrigado a [@Moarram](https://github.com/Moarram/)):

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

Para ativar a transição suave de cores na interface da Sidebery, adicione o seguinte código ao Editor de Estilo da Sidebery (graças a [@MaxHasBeenUsed](https://github.com/MaxHasBeenUsed/)):

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

## Tema adaptativo em menus de contexto

Para aplicar o tema adaptativo aos menus de contexto, adicione o seguinte código ao seu tema CSS:

<!-- prettier-ignore-start -->
```css
:is(menupopup, panel):where(:not([type="arrow"])) {
	--panel-background-color: unset !important;
	--panel-border-color: unset !important;
}
```
<!-- prettier-ignore-end -->

Além disso, os menus de contexto nativos devem ser desativados abrindo `about:config` e definindo as seguintes preferências como `false`:

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

## Compatibilidade com temas CSS de terceiros

Um tema de CSS de terceiros funciona com Adaptive Tab Bar Colour (ATBC), desde que use as variáveis de cor padrão do Firefox (por exemplo: `--lwt-accent-color` para a cor da barra de abas). [Esse](https://github.com/easonwong-de/Firefox-Simple-One-Line) é um exemplo de um tema CSS compatível com ATBC.

## Botões da barra de título no Linux com tema GTK

Os botões da barra de título do Firefox podem voltar ao estilo do Windows. Para prevenir isso, vá em “Preferências Avançadas” (`about:config`) e defina `widget.gtk.non-native-titlebar-buttons.enabled` como `false`. (graças a [@anselstetter](https://github.com/anselstetter/))

## Lembrete de segurança

Tenha cuidado com interfaces web maliciosas. É importante distinguir entre a interface do navegador e a interface web. Para mais informações, acesse [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/). (graças a [u/KazaHesto](https://www.reddit.com/user/KazaHesto/))
