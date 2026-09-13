**アドオンは何をしますか？**

このアドオンは、Safari の macOS におけるタブバーの色調変化機能に似た形で、閲覧中のウェブサイトの外観に合わせて Firefox のテーマを動的に調整します。

**相性の良いアドオン**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**互換性のないもの**

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- Firefox のテーマを変更するその他のアドオン

**ツールバー下部の影を削除する**

ブラウザーのツールバーにウェブコンテンツが作る細い影を除去するには、設定（`about:preferences`）へ移動し、「ブラウザーのレイアウト」で「サイドバーを表示」をオフにします。あるいは、次のコードを CSS テーマに追加してください。

> `#tabbrowser-tabbox, .browserContainer {`

> > `box-shadow: none !important;`

> `}`

**色の遷移をカスタマイズする**

Firefox はタブバーの色変更にネイティブな遷移効果を適用します。この動作を無効にして Adaptive Tab Bar Colour（ATBC）が色を瞬時に更新できるようにするには、次のコードを CSS テーマに追加してください。

> `:root {`

> > ```
> > --ext-theme-background-transition: none !important;
> > --inactive-window-transition: none !important;
> > ```

> `}`

一方で、タブバーの滑らかな色遷移を好む場合もあります。技術的制限によりネイティブには対応できないため、次のコードを CSS テーマに追加してください。（提供: [@Moarram](https://github.com/Moarram/)）

> `#navigator-toolbox, #TabsToolbar, #nav-bar, #PersonalToolbar, #sidebar-box, .tab-background, .urlbar-background, findbar, body {`

> > `transition:`

> > > ```
> > > background-color 0.5s cubic-bezier(0, 0, 0, 1) !important,
> > > border-color 0.5s cubic-bezier(0, 0, 0, 1) !important,
> > > outline 0.5s cubic-bezier(0, 0, 0, 1) !important;
> > > ```

> `}`

Sidebery UI で滑らかな色遷移を有効にするには、次のコードを Sidebery Style Editor に追加してください。（提供: [@MaxHasBeenUsed](https://github.com/MaxHasBeenUsed/)）

> `.Sidebar, .bottom-space {`

> > `transition: background-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

**コンテキストメニューへの適応テーマの適用**

コンテキストメニューに適応テーマを適用するには、次のコードを CSS テーマに追加してください：

> `:is(menupopup, panel):where(:not([type="arrow"])) {`

> > ```
> > --panel-background-color: unset !important;
> > --panel-border-color: unset !important;
> > ```

> `}`

さらに、`about:config` を開き、以下の設定を `false` に変更してネイティブコンテキストメニューを無効にする必要があります：

- `widget.gtk.native-context-menus` (Linux)
- `widget.macos.native-context-menus` (macOS)

**サードパーティ CSS テーマとの互換性**

サードパーティの CSS テーマは、Firefox の標準カラー変数（例：タブバーの色に `--lwt-accent-color`）を使用していれば Adaptive Tab Bar Colour（ATBC）と連携できます。[こちら](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme) は ATBC 対応 CSS テーマの例です。

**GTK テーマ使用時の Linux のタイトルバーボタン**

Firefox のタイトルバーのボタンは Windows スタイルに戻ることがあります。これを防ぐには、「詳細設定」（`about:config`）を開き、`widget.gtk.non-native-titlebar-buttons.enabled` を `false` に設定してください。（提供: [@anselstetter](https://github.com/anselstetter/)）

**安全に関する注意喚起**

悪意のあるウェブ UI に注意してください。ブラウザー UI とウェブ UI を区別することが重要です。詳細は [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/) を参照してください。（提供: [u/KazaHesto](https://www.reddit.com/user/KazaHesto/)）

GitHub でこのプロジェクトにスターをしてください: [https://github.com/atbc-org/Adaptive-Tab-Bar-Colour](https://github.com/atbc-org/Adaptive-Tab-Bar-Colour)
