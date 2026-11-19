/**
 * Builds a browser theme object for the given colour, scheme, and preferences.
 *
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/theme
 */
function buildTheme(
	colour: Colour,
	scheme: Scheme,
	prefs: Prefs,
	homeColour: Colour,
): Theme {
	const lightDark = <T>(light: T, dark: T) =>
		scheme === "light" ? light : dark;
	const css = (value: number): string =>
		colour.brightness(lightDark(-1.5, 1) * value).toRGBA();

	const primaryColour = lightDark("#000000", "#ffffff");
	const secondaryColour = lightDark("#0000001c", "#ffffff1c");
	const accentColour = prefs.advanced.overwriteAccentColour
		? lightDark(
				prefs.advanced.accentColour_light,
				prefs.advanced.accentColour_dark,
			)
		: "AccentColor";

	return {
		colors: {
			// adaptive
			button_background_active: css(prefs.theme.tabSelected),
			frame: css(prefs.theme.tabbar),
			frame_inactive: css(prefs.theme.tabbar),
			ntp_background: homeColour.toRGBA(),
			popup: css(prefs.theme.popup),
			popup_border: css(prefs.theme.popup + prefs.theme.popupBorder),
			sidebar: css(prefs.theme.sidebar),
			sidebar_border: css(
				prefs.theme.sidebar + prefs.theme.sidebarBorder,
			),
			tab_line: css(
				prefs.theme.tabSelectedBorder + prefs.theme.tabSelected,
			),
			tab_selected: css(prefs.theme.tabSelected),
			toolbar: css(prefs.theme.toolbar),
			toolbar_bottom_separator: css(
				prefs.theme.toolbarBorder + prefs.theme.toolbar,
			),
			toolbar_field: css(prefs.theme.toolbarField),
			toolbar_field_border: css(
				prefs.theme.toolbarFieldBorder + prefs.theme.toolbarField,
			),
			toolbar_field_focus: css(prefs.theme.toolbarFieldOnFocus),
			toolbar_top_separator:
				prefs.theme.tabbarBorder === 0
					? "transparent"
					: css(prefs.theme.tabbarBorder + prefs.theme.tabbar + 5),
			// static
			icons: primaryColour,
			ntp_text: primaryColour,
			popup_text: primaryColour,
			sidebar_text: primaryColour,
			tab_background_text: primaryColour,
			tab_text: primaryColour,
			toolbar_field_text: primaryColour,
			toolbar_text: primaryColour,
			button_background_hover: secondaryColour,
			toolbar_vertical_separator: secondaryColour,
			toolbar_field_border_focus: accentColour,
			popup_highlight: accentColour,
			sidebar_highlight: accentColour,
			icons_attention: accentColour,
		},
		properties: { color_scheme: "system", content_color_scheme: "system" },
	};
}

/** Applies the colour to the browser frame. */
export function setTheme(
	tab: Browser.tabs.Tab,
	meta: GetMetaResult,
	currentScheme: Scheme,
	prefs: Prefs,
	homeColour: Colour,
): SetThemeResult {
	const { colour, scheme, corrected } = meta.colour.contrastCorrection(
		currentScheme,
		!prefs.advanced.compatibilityMode && prefs.advanced.allowDarkLight,
		prefs.advanced.minContrast_light,
		prefs.advanced.minContrast_dark,
	);
	const theme = buildTheme(colour, scheme, prefs, homeColour);

	if (prefs.advanced.compatibilityMode) {
		if (tab.id) {
			void sendMessageToTab(tab.id, {
				header: "SET_THEME_COLOUR",
				colour: colour.brightness(prefs.theme.tabbar).toRGBA(),
			}).catch(() => {
				console.warn("Could not apply theme colour to tab:", tab.url);
			});
		}
	} else {
		void updateBrowserTheme(tab.windowId, theme);
	}

	return { scheme, corrected, theme };
}
