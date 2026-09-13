**Bu Eklenti Ne İşe Yarar?**

Bu eklenti, Firefox temasını dinamik olarak görüntülediğiniz web sitesinin görünümüyle eşlemek için değiştirir. macOS'teki Safari'nin site rengini sekme çubuğunda gösterme özelliğine benzer.

**Beraber İyi Çalışan Eklentiler**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**Uyumsuz Eklentiler**

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- Firefox temasını değiştiren herhangi bir diğer eklenti

**Araç Çubuğunun Altındaki Gölgeden Kurtulmak**

Web içeriği tarafından tarayıcı araç çubuğuna vuran ince gölgeyi kaldırmak için, Ayarlar'a (`about:preferences`) gidin ve “Tarayıcı Düzeni” bölümündeki “Kenar çubuğunu göster” ayarını kapatın. Dilerseniz bunun yerine aşağıdaki kodu CSS temanıza da ekleyebilirsiniz:

> `#tabbrowser-tabbox, .browserContainer {`

> > `box-shadow: none !important;`

> `}`

**Renk Geçişlerini Özelleştirme**

Firefox sekme çubuğu renk değişikliklerine yerel olarak bir geçiş efekti uygular. Bu davranışı devre dışı bırakmak ve Adaptive Tab Bar Colour (ATBC)'nin renkleri anında güncellemesini sağlamak için aşağıdaki kodu CSS temanıza ekleyin:

> `:root {`

> > ```
> > --ext-theme-background-transition: none !important;
> > --inactive-window-transition: none !important;
> > ```

> `}`

Alternatif olarak sekme çubuğu için yumuşak renk geçişlerini tercih edebilirsiniz. Teknik sınırlamalar nedeniyle bu yerel olarak desteklenemediğinden aşağıdaki kodu CSS temanıza ekleyin ([@Moarram](https://github.com/Moarram/)'a teşekkürler):

> `#navigator-toolbox, #TabsToolbar, #nav-bar, #PersonalToolbar, #sidebar-box, .tab-background, .urlbar-background, findbar, body {`

> > `transition:`

> > > ```
> > > background-color 0.5s cubic-bezier(0, 0, 0, 1) !important,
> > > border-color 0.5s cubic-bezier(0, 0, 0, 1) !important,
> > > outline 0.5s cubic-bezier(0, 0, 0, 1) !important;
> > > ```

> `}`

Sidebery arayüzünde yumuşak renk geçişlerini devreye almak için aşağıdaki kodu Sidebery Style Editor'e ekleyin ([@MaxHasBeenUsed](https://github.com/MaxHasBeenUsed/)'a teşekkürler):

> `.Sidebar, .bottom-space {`

> > `transition: background-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

**Sağ Tık Menülerinde Uyumlu Tema**

Uyumlu temayı sağ tık (bağlam) menülerine uygulamak için aşağıdaki kodu CSS temanıza ekleyin:

> `:is(menupopup, panel):where(:not([type="arrow"])) {`

> > ```
> > --panel-background-color: unset !important;
> > --panel-border-color: unset !important;
> > ```

> `}`

Ayrıca `about:config` sayfasını açıp aşağıdaki tercihleri `false` olarak ayarlayarak yerel sağ tık menülerini devre dışı bırakmalısınız:

- `widget.gtk.native-context-menus` (Linux)
- `widget.macos.native-context-menus` (macOS)

**Üçüncü Taraf CSS Temalarıyla Uyumluluk**

Firefox'un standart renk değişkenlerini (örneğin sekme çubuğu rengi için `--lwt-accent-color`) kullandığı sürece üçüncü taraf bir CSS teması Adaptive Tab Bar Colour (ATBC) ile beraber çalışır. [Burada](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme) ATBC ile uyumlu bir CSS temasının örneğini bulabilirsiniz.

**GTK Temalı Linux'ta Başlık Çubuğu Düğmeleri**

Firefox'un başlık çubuğu düğmeleri Windows tarzına geri dönebilir. Bunu önlemek için, “Gelişmiş Tercihler”i (`about:config`) açın ve `widget.gtk.non-native-titlebar-buttons.enabled` özelliğini `false` olarak ayarlayın. ([@anselstetter](https://github.com/anselstetter/)'e teşekkürler)

**Güvenlik İçin Hatırlatma**

Kötü niyetli web arayüzlerine karşı dikkatli olun. Tarayıcı arayüzüyle web sayfasının arayüzü arasındaki ayrımın farkında olmak önemlidir. Daha fazla bilgi için lütfen [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/) makalesine başvurun. ([u/KazaHesto](https://www.reddit.com/user/KazaHesto/)'ya teşekkürler)

Bu projeyi GitHub'da yıldızlamaktan çekinmeyin: [https://github.com/atbc-org/Adaptive-Tab-Bar-Colour](https://github.com/atbc-org/Adaptive-Tab-Bar-Colour)
