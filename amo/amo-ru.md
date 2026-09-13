**Что делает это дополнение?**

Это дополнение динамически настраивает тему Firefox в соответствии с внешним видом просматриваемого вами сайта, аналогично функции тонирования панели вкладок в Safari на macOS.

**Отлично работает вместе с**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**Несовместимо с**

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- Любыми другими дополнениями, которые изменяют тему Firefox

**Удаление тени в нижней части панели инструментов**

Чтобы удалить тонкую тень, отбрасываемую веб-контентом на панель инструментов браузера, перейдите в Настройки (`about:preferences`) и отключите «Показать боковую панель» в разделе «Внешний вид браузера». Альтернативно, добавьте следующий код в вашу CSS-тему:

> `#tabbrowser-tabbox, .browserContainer {`

> > `box-shadow: none !important;`

> `}`

**Настройка цветовых переходов**

Firefox изначально применяет эффект перехода к изменениям цвета панели вкладок. Чтобы отключить это поведение и позволить Adaptive Tab Bar Colour (ATBC) обновлять цвета мгновенно, добавьте следующий код в вашу CSS-тему:

> `:root {`

> > ```
> > --ext-theme-background-transition: none !important;
> > --inactive-window-transition: none !important;
> > ```

> `}`

В качестве альтернативы, вы можете предпочесть плавные цветовые переходы для панели вкладок. Поскольку это не может поддерживаться изначально из-за технических ограничений, добавьте следующий код в вашу CSS-тему (спасибо [@Moarram](https://github.com/Moarram/)):

> `#navigator-toolbox, #TabsToolbar, #nav-bar, #PersonalToolbar, #sidebar-box, .tab-background, .urlbar-background, findbar, body {`

> > `transition:`

> > > ```
> > > background-color 0.5s cubic-bezier(0, 0, 0, 1) !important,
> > > border-color 0.5s cubic-bezier(0, 0, 0, 1) !important,
> > > outline 0.5s cubic-bezier(0, 0, 0, 1) !important;
> > > ```

> `}`

Чтобы включить плавные переходы цвета в интерфейсе Sidebery, добавьте следующий код в редактор стилей Sidebery (спасибо [@MaxHasBeenUsed](https://github.com/MaxHasBeenUsed/)):

> `.Sidebar, .bottom-space {`

> > `transition: background-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

**Адаптивная тема в контекстных меню**

Чтобы применить адаптивную тему к контекстным меню, добавьте следующий код в вашу CSS-тему:

> `:is(menupopup, panel):where(:not([type="arrow"])) {`

> > ```
> > --panel-background-color: unset !important;
> > --panel-border-color: unset !important;
> > ```

> `}`

Кроме того, необходимо отключить нативные контекстные меню, открыв `about:config` и установив следующие параметры в значение `false`:

- `widget.gtk.native-context-menus` (Linux)
- `widget.macos.native-context-menus` (macOS)

**Совместимость со сторонними CSS-темами**

Сторонняя CSS-тема работает с Adaptive Tab Bar Colour (ATBC), если они используют стандартные цветовые переменные Firefox (например, `--lwt-accent-color` для цвета панели вкладок). [Вот пример](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme) CSS-темы, совместимой с ATBC.

**Кнопки заголовка в Linux с темой GTK**

Кнопки заголовка Firefox могут вернуться к стилю Windows. Чтобы этого избежать, откройте «расширенные настройки» (`about:config`) и установите параметр `widget.gtk.non-native-titlebar-buttons.enabled` в значение `false`. (Спасибо [@anselstetter](https://github.com/anselstetter/))

**Напоминание о безопасности**

Остерегайтесь вредоносных веб-интерфейсов. Важно различать интерфейс браузера и веб-интерфейс. Для получения дополнительной информации см. [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/). (Спасибо [u/KazaHesto](https://www.reddit.com/user/KazaHesto/))

Не забудьте отметить проект звездочкой на GitHub: [https://github.com/atbc-org/Adaptive-Tab-Bar-Colour](https://github.com/atbc-org/Adaptive-Tab-Bar-Colour)
