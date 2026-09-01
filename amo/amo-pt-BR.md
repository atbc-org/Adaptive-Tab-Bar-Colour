**O que a extensão faz?**

Essa extensão ajusta dinamicamente o tema do Firefox para combinar com a aparência do site que você está visualizando, similar a função de coloração das abas do macOS

**Funciona bem com**

- [Dark Reader](https://addons.mozilla.org/firefox/addon/darkreader/)
- [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/)
- [Dark Mode Website Switcher](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/)

**Incompatível com**

- [Adaptive Theme Creator](https://addons.mozilla.org/firefox/addon/adaptive-theme-creator/)
- [Chameleon Dynamic Theme](https://addons.mozilla.org/firefox/addon/chameleon-dynamic-theme-fixed/)
- [VivaldiFox](https://addons.mozilla.org/firefox/addon/vivaldifox/)
- [Envify](https://addons.mozilla.org/firefox/addon/envify/)
- Qualquer outra extensão que modifique o tema do Firefox

**Removendo a sombra abaixo da barra de ferramentas**

Para remover a fina sombra projetada por conteúdo web na barra de ferramentas, vá em Opções (`about:preferences`) e desative “Mostrar Painel Lateral” na seção "Disposição do Navegador". Alternativamente, adicione o seguinte código a seu tema CSS:

> `#tabbrowser-tabbox, .browserContainer {`

> > `box-shadow: none !important;`

> `}`

**Personalizar transições de cores**

O Firefox aplica nativamente um efeito de transição às mudanças de cor da barra de abas. Para desativar esse comportamento e permitir que Adaptive Tab Bar Colour (ATBC) atualize as cores instantaneamente, adicione o seguinte código ao seu tema CSS:

> `:root {`

> > ```
> > --ext-theme-background-transition: none !important;
> > --inactive-window-transition: none !important;
> > ```

> `}`

Alternativamente, você pode preferir transições de cores suaves para a barra de abas. Como isso não pode ser suportado nativamente devido a limitações técnicas, adicione o seguinte código ao seu tema CSS (obrigado a [@Moarram](https://github.com/Moarram/)):

> `#navigator-toolbox, #TabsToolbar, #nav-bar, #PersonalToolbar, #sidebar-box, .tab-background, .urlbar-background, findbar, body {`

> > `transition:`

> > > ```
> > > background-color 0.5s cubic-bezier(0, 0, 0, 1) !important,
> > > border-color 0.5s cubic-bezier(0, 0, 0, 1) !important,
> > > outline 0.5s cubic-bezier(0, 0, 0, 1) !important;
> > > ```

> `}`

Para ativar a transição suave de cores na interface da Sidebery, adicione o seguinte código ao Editor de Estilo da Sidebery (graças a [@MaxHasBeenUsed](https://github.com/MaxHasBeenUsed/)):

> `.Sidebar, .bottom-space {`

> > `transition: background-color 0.5s cubic-bezier(0, 0, 0, 1) !important;`

> `}`

**Tema adaptativo em menus de contexto**

Para aplicar o tema adaptativo aos menus de contexto, adicione o seguinte código ao seu tema CSS:

> `:is(menupopup, panel):where(:not([type="arrow"])) {`

> > ```
> > --panel-background-color: unset !important;
> > --panel-border-color: unset !important;
> > ```

> `}`

Além disso, os menus de contexto nativos devem ser desativados abrindo `about:config` e definindo as seguintes preferências como `false`:

- `widget.gtk.native-context-menus` (Linux)
- `widget.macos.native-context-menus` (macOS)

**Compatibilidade com temas CSS de terceiros**

Um tema de CSS de terceiros funciona com Adaptive Tab Bar Colour (ATBC), desde que use as variáveis de cor padrão do Firefox (por exemplo: `--lwt-accent-color` para a cor da barra de abas). [Esse](https://github.com/easonwong-de/Firefox-Adaptive-Sur-Theme) é um exemplo de um tema CSS compatível com ATBC.

**Botões da barra de título no Linux com tema GTK**

Os botões da barra de título do Firefox podem voltar ao estilo do Windows. Para prevenir isso, vá em “Preferências Avançadas” (`about:config`) e defina `widget.gtk.non-native-titlebar-buttons.enabled` como `false`. (graças a [@anselstetter](https://github.com/anselstetter/))

**Lembrete de segurança**

Tenha cuidado com interfaces web maliciosas. É importante distinguir entre a interface do navegador e a interface web. Para mais informações, acesse [The Line of Death](https://textslashplain.com/2017/01/14/the-line-of-death/). (graças a [u/KazaHesto](https://www.reddit.com/user/KazaHesto/))

Sinta-se à vontade para favoritar esse projeto no GitHub: [https://github.com/atbc-org/Adaptive-Tab-Bar-Colour](https://github.com/atbc-org/Adaptive-Tab-Bar-Colour)
