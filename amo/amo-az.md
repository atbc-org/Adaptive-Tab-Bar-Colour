**Bu əlavə nə edir?**

Bu əlavə Firefox temasını baxdığınız veb saytın görünüşünə uyğun olaraq dinamik şəkildə tənzimləyir. Davranış macOS-dakı Safari brauzerinin tab panelini rəngləmə imkanına bənzəyir.

**Yaxşı işlədiyi əlavələr**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**Uyğun gəlmədiyi əlavələr**

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- Firefox temasını dəyişdirən istənilən digər əlavə

**Alət panelinin altındakı kölgəni silmək**

Veb məzmunun brauzerin alət panelinə saldığı nazik kölgəni silmək üçün Parametrlərə (`about:preferences`) keçin və “Brauzerin quruluşu” bölməsində “Yan paneli göstər” seçimini söndürün. Bunun əvəzinə aşağıdakı kodu CSS temanıza da əlavə edə bilərsiniz:

> `#tabbrowser-tabbox, .browserContainer {`

> > `box-shadow: none !important;`

> `}`

**Rəng keçidlərini fərdiləşdirmək**

Firefox tab panelinin rəng dəyişikliklərinə öz daxili keçid effektini tətbiq edir. Bu davranışı söndürmək və Adaptive Tab Bar Colour (ATBC) əlavəsinin rəngləri dərhal yeniləməsinə imkan vermək üçün aşağıdakı kodu CSS temanıza əlavə edin:

> `:root {`

> > ```
> > --ext-theme-background-transition: none !important;
> > --inactive-window-transition: none !important;
> > ```

> `}`

Digər tərəfdən, tab paneli üçün yumşaq rəng keçidlərini üstün tuta bilərsiniz. Texniki məhdudiyyətlərə görə bu, daxili şəkildə dəstəklənmir, ona görə aşağıdakı kodu CSS temanıza əlavə edin ([@Moarram](https://github.com/Moarram/) sayəsində):

> `#navigator-toolbox, #TabsToolbar, #nav-bar, #PersonalToolbar, #sidebar-box, .tab-background, .urlbar-background, findbar, body {`

> > `transition:`

> > > ```
> > > background-color 0.5s cubic-bezier(0, 0, 0, 1) !important,
> > > border-color 0.5s cubic-bezier(0, 0, 0, 1) !important,
> > > outline 0.5s cubic-bezier(0, 0, 0, 1) !important;
> > > ```

> `}`

Sidebery interfeysində yumşaq rəng keçidlərini aktivləşdirmək üçün aşağıdakı kodu Sidebery Style Editor bölməsinə əlavə edin ([@MaxHasBeenUsed](https://github.com/MaxHasBeenUsed/) sayəsində):

> `.Sidebar, .bottom-space {`

> > `transition: background-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

**Kontekst menyularında uyğunlaşan tema**

Uyğunlaşan temanı kontekst menyularına tətbiq etmək üçün aşağıdakı kodu CSS temanıza əlavə edin:

> `:is(menupopup, panel):where(:not([type="arrow"])) {`

> > ```
> > --panel-background-color: unset !important;
> > --panel-border-color: unset !important;
> > ```

> `}`

Bundan başqa, `about:config` səhifəsini açıb aşağıdakı tərcihləri `false` etməklə sistemin öz kontekst menyuları söndürülməlidir:

- `widget.gtk.native-context-menus` (Linux)
- `widget.macos.native-context-menus` (macOS)

**Üçüncü tərəf CSS temaları ilə uyğunluq**

Üçüncü tərəf CSS teması Firefox-un standart rəng dəyişənlərindən (məsələn, tab panelinin rəngi üçün `--lwt-accent-color`) istifadə etdiyi müddətcə Adaptive Tab Bar Colour (ATBC) ilə işləyir. [Bu](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme), ATBC ilə uyğun CSS temasının nümunəsidir.

**GTK teması ilə Linux-da başlıq sətri düymələri**

Firefox-un başlıq sətri düymələri Windows üslubuna qayıda bilər. Bunun qarşısını almaq üçün “Qabaqcıl tərcihlər” (`about:config`) səhifəsini açın və `widget.gtk.non-native-titlebar-buttons.enabled` dəyərini `false` edin. ([@anselstetter](https://github.com/anselstetter/) sayəsində)

**Təhlükəsizlik xatırlatması**

Zərərli veb interfeyslərdən ehtiyatlı olun. Brauzerin interfeysi ilə veb səhifənin interfeysini ayırd etmək vacibdir. Ətraflı məlumat üçün [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/) yazısına baxın. ([u/KazaHesto](https://www.reddit.com/user/KazaHesto/) sayəsində)

Bu layihəni GitHub-da ulduzlamaqdan çəkinməyin: [https://github.com/atbc-org/Adaptive-Tab-Bar-Colour](https://github.com/atbc-org/Adaptive-Tab-Bar-Colour)
