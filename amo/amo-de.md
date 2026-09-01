**Was macht die Erweiterung?**

Diese Erweiterung passt das Theme von Firefox dynamisch an das Erscheinungsbild der von dir besuchten Website an, ähnlich wie die Tab-Leisten-Einfärbung in Safari auf macOS.

**Funktioniert gut mit**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**Inkompatibel mit**

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- Jede andere Erweiterung, die das Firefox-Theme ändert

**Entfernen des Schattens am unteren Rand der Werkzeugleiste**

Um den dünnen Schatten zu entfernen, den der Webinhalt auf die Browser-Werkzeugleiste wirft, gehe zu Einstellungen (`about:preferences`) und deaktiviere „Sidebar anzeigen“ im Abschnitt „Browser-Layout“. Alternativ kannst du den folgenden Code zu deinem CSS-Theme hinzufügen:

> `#tabbrowser-tabbox, .browserContainer {`

> > `box-shadow: none !important;`

> `}`

**Farbübergänge anpassen**

Firefox wendet von Haus aus einen Übergangseffekt auf Farbänderungen der Tableiste an. Um dieses Verhalten zu deaktivieren und Anpassende Tableistenfarbe (ATBC) zu ermöglichen, Farben sofort zu aktualisieren, füge den folgenden Code zu deinem CSS-Theme hinzu:

> `:root {`

> > ```
> > --ext-theme-background-transition: none !important;
> > --inactive-window-transition: none !important;
> > ```

> `}`

Alternativ bevorzugst du vielleicht sanfte Farbübergänge für die Tableiste. Da dies aufgrund technischer Einschränkungen nicht nativ unterstützt werden kann, füge den folgenden Code zu deinem CSS-Theme hinzu (Dank an [@Moarram](https://github.com/Moarram/)):

> `#navigator-toolbox, #TabsToolbar, #nav-bar, #PersonalToolbar, #sidebar-box, .tab-background, .urlbar-background, findbar, body {`

> > `transition:`

> > > ```
> > > background-color 0.5s cubic-bezier(0, 0, 0, 1) !important,
> > > border-color 0.5s cubic-bezier(0, 0, 0, 1) !important,
> > > outline 0.5s cubic-bezier(0, 0, 0, 1) !important;
> > > ```

> `}`

Um sanfte Farbübergänge in der Sidebery-Benutzeroberfläche zu aktivieren, füge den folgenden Code zum Sidebery Style Editor hinzu (dank an [@MaxHasBeenUsed](https://github.com/MaxHasBeenUsed/)):

> `.Sidebar, .bottom-space {`

> > `transition: background-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

**Anpassendes Theme in Kontextmenüs**

Um das anpassende Theme auf Kontextmenüs anzuwenden, füge den folgenden Code zu deinem CSS-Theme hinzu:

> `:is(menupopup, panel):where(:not([type="arrow"])) {`

> > ```
> > --panel-background-color: unset !important;
> > --panel-border-color: unset !important;
> > ```

> `}`

Zusätzlich müssen native Kontextmenüs deaktiviert werden, indem du `about:config` öffnest und die folgenden Einstellungen auf `false` setzt:

- `widget.gtk.native-context-menus` (Linux)
- `widget.macos.native-context-menus` (macOS)

**Kompatibilität mit Drittanbieter-CSS-Themes**

Ein Drittanbieter-CSS-Theme funktioniert mit Anpassender Tableistenfarbe (ATBC), solange sie Firefoxs Standard-Farbvariablen verwenden (z. B. `--lwt-accent-color` für die Farbe der Tableiste). [Hier](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme) ist ein Beispiel für ein ATBC-kompatibles CSS-Theme.

**Titelleisten-Schaltflächen unter Linux mit GTK-Theme**

Die Titelleisten-Schaltflächen von Firefox könnten auf den Windows-Stil zurückgesetzt werden. Um dies zu verhindern, öffne die „Erweiterten Einstellungen“ (`about:config`) und setze `widget.gtk.non-native-titlebar-buttons.enabled` auf `false`. (Dank an [@anselstetter](https://github.com/anselstetter/))

**Sicherheitserinnerung**

Achte auf bösartige Web-UIs. Es ist wichtig, zwischen der Browser-Benutzeroberfläche und der Web-Benutzeroberfläche zu unterscheiden. Für weitere Informationen siehe [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/). (Dank an [u/KazaHesto](https://www.reddit.com/user/KazaHesto/))

Gib diesem Projekt gerne einen Stern auf GitHub: [https://github.com/atbc-org/Adaptive-Tab-Bar-Colour](https://github.com/atbc-org/Adaptive-Tab-Bar-Colour)
