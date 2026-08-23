/*
 * System colour scheme:
 * The colour scheme of the operating system, usually light or dark.
 *
 * Browser colour scheme:
 * The "website appearance" settings of Firefox, which can be light, dark, or auto.
 *
 * `cache.scheme`:
 * Derived from system and browser colour scheme and decides whether the light theme or dark theme is preferred.
 *
 * `pref.allowDarkLight`:
 * A setting that decides if a light theme is allowed to be used when current.scheme is dark, or vice versa.
 *
 * meta tag theme:
 * A colour defined with a meta tag by some websites, usually static.
 * It is often more related to the branding than the actual appearance of the website.
 *
 * Theme:
 * An object that defines the colour of the Firefox UI.
 */
import Colour from "@/utils/colour";
import Preference from "@/utils/preference";

/** Version of Firefox. */
let firefoxVersion = 115;

/** Preference instance. */
const pref = new Preference();

/** Page colour of Firefox internal page. */
const browserColour = createBrowserColour(
	() => cache.scheme,
	() => firefoxVersion,
	pref,
);

/** Runtime cache. */
const cache: {
	ruleData: Record<number, RuleQueryResult | undefined>;
	metaData: Record<number, MetaQueryResult | undefined>;
	themeData: Record<number, ApplyThemeResult | undefined>;
	scheme: Scheme;
	readonly reversedScheme: Scheme;
	clear: () => Promise<void>;
} = {
	ruleData: {},
	metaData: {},
	themeData: {},
	scheme: "light",
	/** The reversed colour theme. */
	get reversedScheme() {
		return this.scheme === "light" ? "dark" : "light";
	},
	/** Updates `scheme` and clears `ruleData`, `metaData`, and `themeData`. */
	async clear() {
		this.scheme = await getCurrentScheme();
		this.ruleData = {};
		this.metaData = {};
		this.themeData = {};
	},
};

/** Handles incoming messages based on their header. */
async function handleMessage(
	message: MessageForBackground,
	sender: Browser.runtime.MessageSender,
): Promise<unknown> {
	const tab = sender.tab;
	switch (message.header) {
		case "SCRIPT_READY":
			if (tab === undefined || !tab.active) break;
			updateTab(tab);
			break;
		case "UPDATE_COLOUR":
			if (tab === undefined || !tab.active) break;
			const windowId = tab.windowId;
			const ruleData = cache.ruleData[windowId] ?? {
				id: 0,
				url: tab.url ?? "",
				rule: null,
			};
			const metaData = (cache.metaData[windowId] = parseTabColourData(
				message.colour,
				ruleData.rule,
			));
			const themeData = (cache.themeData[windowId] = setFrameColour(
				tab,
				metaData,
			));
			sendMessageToPopup({
				header: "CACHE_UPDATE",
				windowId,
				cache: { ruleData, metaData, themeData },
			});
			break;
		case "CACHE_REQUEST": {
			const windowId = await getActiveWindowId();
			if (windowId === undefined) return undefined;
			const ruleData = cache.ruleData[windowId];
			const metaData = cache.metaData[windowId];
			const themeData = cache.themeData[windowId];
			return ruleData && metaData && themeData
				? { ruleData, metaData, themeData }
				: undefined;
		}
		default:
			await run();
	}
	return true;
}

/** Triggers colour update for all active tabs. */
async function run(): Promise<void> {
	if (!pref.isReady) return;
	await cache.clear();
	(await getActiveTabList()).forEach(updateTab);
}

/** Updates the colour for a tab and caches its meta information. */
async function updateTab(tab: Browser.tabs.Tab): Promise<void> {
	const windowId = tab.windowId;
	const ruleData = (cache.ruleData[windowId] = await pref.getRule(
		tab.url,
		cache.scheme,
	));
	const metaData = (cache.metaData[windowId] = await getTabMeta(
		tab,
		ruleData,
	));
	const themeData = (cache.themeData[windowId] = setFrameColour(
		tab,
		metaData,
	));
	sendMessageToPopup({
		header: "CACHE_UPDATE",
		windowId: tab.windowId,
		cache: { ruleData, metaData, themeData },
	});
}

/** Gets colour metadata for a tab. */
async function getTabMeta(
	tab: Browser.tabs.Tab,
	ruleData: RuleQueryResult,
): Promise<MetaQueryResult> {
	const { id, windowId, url, title, favIconUrl } = tab;

	if (!id) {
		console.warn("Failed to get tab ID of", url);
		return { colour: browserColour.FALLBACK, reason: "ERROR_OCCURRED" };
	} else if (!url || !URL.canParse(url)) {
		console.warn("Failed to get URL of tab", id);
		return { colour: browserColour.FALLBACK, reason: "ERROR_OCCURRED" };
	}

	const { hostname, href, pathname, protocol } = new URL(url);
	const { rule, webExtId } = ruleData;

	if (rule?.type === "COLOUR") {
		sendMessageToTab(id, { header: "SETUP_SCRIPT", mode: "suspend" }).catch(
			() => {},
		);

		if (rule.headerType === "URL") {
			return {
				colour: new Colour(rule.value),
				reason: "COLOUR_SPECIFIED",
			};
		} else if (rule.headerType === "ADDON_ID") {
			const info = await getWebExtName(rule.header);
			if (info)
				return {
					colour: new Colour(rule.value),
					reason: "ADDON_SPECIFIED",
					info,
				};
		}
	}

	try {
		return parseTabColourData(
			await sendMessageToTab<TabColourData>(id, {
				header: "SETUP_SCRIPT",
				mode: pref.dynamic ? "dynamic" : "static",
				query: rule?.type === "QUERY_SELECTOR" ? rule.value : undefined,
			}),
			rule,
		);
	} catch {
		console.info("Could not connect to", url);

		if (await isHomePage(href)) {
			return { colour: browserColour.HOME, reason: "HOME_PAGE" };
		} else if (protocol === "about:") {
			return await getAboutPageMeta(windowId, href, pathname, title);
		} else if (protocol === "moz-extension:") {
			return await getWebExtPageMeta(webExtId);
		} else if (sourcePageProtocol.includes(protocol)) {
			return getSourcePageMeta(protocol, href);
		} else if (href.startsWith("data:image")) {
			return {
				colour: browserColour.IMAGE_VIEWER,
				reason: "IMAGE_VIEWER",
			};
		} else if (href.endsWith(".pdf") || title?.endsWith(".pdf")) {
			return { colour: browserColour.PDF_VIEWER, reason: "PDF_VIEWER" };
		} else if (href.endsWith(".json") || title?.endsWith(".json")) {
			return { colour: browserColour.JSON_VIEWER, reason: "JSON_VIEWER" };
		} else if (favIconUrl?.startsWith("chrome:")) {
			return { colour: browserColour.DEFAULT, reason: "PROTECTED_PAGE" };
		} else if (href.match(new RegExp(`https?:\\/\\/${title}$`, "i"))) {
			return { colour: browserColour.PLAINTEXT, reason: "TEXT_VIEWER" };
		} else if (hostname in mozillaPageColour) {
			return {
				colour:
					mozillaPageColour[hostname]?.[cache.scheme] ??
					browserColour.FALLBACK,
				reason: "PROTECTED_PAGE",
			};
		} else {
			return {
				colour: browserColour.FALLBACK,
				reason: "FALLBACK_COLOUR",
			};
		}
	}
}

/** Parses raw tab colour data to determine final colour metadata. */
function parseTabColourData(
	tabColourData: TabColourData,
	rule: Rule,
): MetaQueryResult {
	const { page, theme, query, special } = tabColourData;
	const parsePageColour = () => {
		let pageColour = new Colour();
		for (const element of page) {
			const opacity = parseFloat(element.opacity);
			if (isNaN(opacity)) continue;
			pageColour = pageColour.mix(
				new Colour(element.colour).opacity(opacity),
			);
			if (pageColour.isOpaque()) return pageColour;
		}
		return pageColour.mix(browserColour.FALLBACK);
	};
	const parseThemeColour = () => new Colour(theme[cache.scheme]);
	const parseQueryColour = () => new Colour(query?.colour);
	const getFallbackColour = () => {
		switch (special) {
			case "image":
				return browserColour.IMAGE_VIEWER;
			case "plaintext":
				return browserColour.PLAINTEXT;
			case "svg":
				return browserColour.SVG;
			default:
				return parsePageColour();
		}
	};

	switch (rule?.type) {
		case "THEME_COLOUR": {
			const themeColour = parseThemeColour();
			return themeColour.isOpaque()
				? rule?.value
					? {
							colour: themeColour,
							reason: pref.noThemeColour
								? "THEME_UNIGNORED"
								: "THEME_USED",
						}
					: { colour: getFallbackColour(), reason: "THEME_IGNORED" }
				: {
						colour: getFallbackColour(),
						reason: rule?.value ? "THEME_MISSING" : "COLOUR_PICKED",
					};
		}
		case "QUERY_SELECTOR": {
			const queryColour = parseQueryColour();
			return queryColour.isOpaque()
				? {
						colour: queryColour,
						reason: "QS_USED",
						info: rule?.value || "🕳️",
					}
				: {
						colour: getFallbackColour(),
						reason: "QS_FAILED",
						info: rule?.value || "🕳️",
					};
		}
		default: {
			const themeColour = parseThemeColour();
			return themeColour.isOpaque()
				? !pref.noThemeColour
					? { colour: themeColour, reason: "THEME_USED" }
					: { colour: getFallbackColour(), reason: "THEME_IGNORED" }
				: {
						colour: getFallbackColour(),
						reason:
							special === "image" || special === "svg"
								? "IMAGE_VIEWER"
								: special === "plaintext"
									? "TEXT_VIEWER"
									: "COLOUR_PICKED",
					};
		}
	}
}

/** Gets the colour metadata for source pages. */
function getSourcePageMeta(protocol: string, href: string): MetaQueryResult {
	const reason = "PROTECTED_PAGE";
	if (
		protocol === "view-source:" ||
		plainTextExtension.some((extension) => href.endsWith(extension))
	) {
		return { colour: browserColour.PLAINTEXT, reason };
	} else if ([".png", ".jpg"].some((extension) => href.endsWith(extension))) {
		return { colour: browserColour.IMAGE_VIEWER, reason };
	} else if (href.endsWith(".svg")) {
		return { colour: browserColour.SVG, reason };
	} else return { colour: browserColour.SYSTEM, reason };
}

/** Gets colour metadata for an about page. */
async function getAboutPageMeta(
	windowId: number,
	href: string,
	pathname: string,
	title?: string,
): Promise<MetaQueryResult> {
	if (
		["about:firefoxview", "about:home", "about:newtab"].some((homeHref) =>
			href.startsWith(homeHref),
		)
	) {
		return { colour: browserColour.HOME, reason: "HOME_PAGE" };
	} else if (href === "about:privatebrowsing") {
		return {
			colour: (await isWindowIncognito(windowId))
				? browserColour.PRIVATE
				: browserColour.DEFAULT,
			reason: "PROTECTED_PAGE",
		};
	} else if (
		href === "about:blank" &&
		title?.startsWith("about:") &&
		title?.endsWith("profile")
	) {
		return {
			colour: browserColour[
				aboutPageColour[title?.slice(6)] ?? "DEFAULT"
			],
			reason: "PROTECTED_PAGE",
		};
	} else {
		return {
			colour: browserColour[aboutPageColour[pathname] ?? "DEFAULT"],
			reason: "PROTECTED_PAGE",
		};
	}
}

/** Gets the colour metadata for an extension page. */
async function getWebExtPageMeta(webExtId?: string): Promise<MetaQueryResult> {
	if (webExtId !== undefined) {
		const webExtName =
			(await getWebExtName(webExtId)) ?? i18n.t("addonNotFound");
		const colour = presetAddonPageColour[webExtId]?.[cache.scheme];
		return colour !== undefined
			? { colour: colour, reason: "ADDON_PRESET", info: webExtName }
			: {
					colour: browserColour.ADDON,
					reason: "ADDON_DEFAULT",
					info: webExtName,
				};
	} else {
		return {
			colour: browserColour.ADDON,
			reason: "ADDON_DEFAULT",
			info: i18n.t("addonNotFound"),
		};
	}
}

/** Applies the home page colour to a window as soon as it is created */
function paintNewWindow(windowId: number): void {
	if (!pref.isReady || pref.compatibilityMode) return;
	const { colour, scheme } = browserColour.HOME.contrastCorrection(
		cache.scheme,
		pref.allowDarkLight,
		pref.minContrast_light,
		pref.minContrast_dark,
	);
	void applyTheme(windowId, colour, scheme);
}

/** Applies the colour to the browser frame. */
function setFrameColour(
	tab: Browser.tabs.Tab,
	meta: MetaQueryResult,
): ApplyThemeResult {
	const windowId = tab.windowId;
	const { colour, scheme, corrected } = meta.colour.contrastCorrection(
		cache.scheme,
		!pref.compatibilityMode && pref.allowDarkLight,
		pref.minContrast_light,
		pref.minContrast_dark,
	);
	pref.compatibilityMode
		? setTabThemeColour(tab, colour)
		: applyTheme(windowId, colour, scheme);
	return {
		popupColour: colour
			.brightness((scheme === "light" ? -1.5 : 1) * pref.popup)
			.toRGBA(),
		scheme: scheme,
		corrected: corrected,
	};
}

/**
 * Applies theme colour to a tab using content script (compatibility mode).
 *
 * Used when the theme API is not supported or compatibility mode is enabled.
 */
async function setTabThemeColour(
	tab: Browser.tabs.Tab,
	colour: Colour,
): Promise<void> {
	if (!tab.id) return;
	try {
		await sendMessageToTab(tab.id, {
			header: "SET_THEME_COLOUR",
			colour: colour.brightness(pref.tabbar).toRGBA(),
		});
	} catch {
		console.warn("Could not apply theme colour to tab:", tab.url);
	}
}

/**
 * Applies a browser theme to a window.
 *
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/theme
 */
async function applyTheme(
	windowId: number,
	colour: Colour,
	scheme: Scheme,
): Promise<void> {
	if (scheme !== "light" && scheme !== "dark") return;

	const lightDark = <T>(light: T, dark: T) =>
		scheme === "light" ? light : dark;
	const css = (value: number): string =>
		colour.brightness(lightDark(-1.5, 1) * value).toRGBA();
	const dataURL = async (colour: string): Promise<string> => {
		const canvas = new OffscreenCanvas(16, 16);
		const context = canvas.getContext("2d")!;
		context.fillStyle = colour;
		context.fillRect(0, 0, 16, 16);
		const blob = await canvas.convertToBlob();
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result as string);
			reader.readAsDataURL(blob);
		});
	};
	const nova = <T>(mapping: Record<number, () => T>): T | undefined => {
		if (!pref.nova) return mapping[0]?.();
		let match = 0;
		for (const key in mapping) {
			const version = Number(key);
			if (firefoxVersion >= version && version > match) match = version;
		}
		return mapping[match]?.();
	};

	const primaryColour = lightDark("#000000", "#ffffff");
	const secondaryColour = lightDark("#0000001c", "#ffffff1c");
	const accentColour = pref.overwriteAccentColour
		? lightDark(pref.accentColour_light, pref.accentColour_dark)
		: "AccentColor";

	const theme: Theme = {
		images: {
			additional_backgrounds: await nova({
				0: () => undefined,
				152: async () => [await dataURL(css(pref.tabbar))],
				153: () => undefined,
			}),
		},
		colors: {
			// adaptive
			button_background_active: css(pref.tabSelected),
			frame: css(pref.tabbar),
			frame_inactive: css(pref.tabbar),
			ntp_background: browserColour.HOME.toRGBA(),
			popup: css(pref.popup),
			popup_border: css(pref.popup + pref.popupBorder),
			sidebar: css(pref.sidebar),
			sidebar_border: css(pref.sidebar + pref.sidebarBorder),
			tab_line: css(pref.tabSelectedBorder + pref.tabSelected),
			tab_selected: css(pref.tabSelected),
			toolbar: nova({
				0: () => css(pref.toolbar),
				153: () =>
					pref.toolbar === 0
						? "transparent"
						: css(pref.toolbar + pref.tabbar + 5),
			}),
			toolbar_bottom_separator: nova({
				0: () => css(pref.toolbarBorder + pref.toolbar),
				152: () => css(pref.tabbarBorder + pref.tabbar),
			}),
			toolbar_field: nova({
				0: () => css(pref.toolbarField),
				153: () => css(pref.toolbarField + 5),
			}),
			toolbar_field_border: nova({
				0: () => css(pref.toolbarFieldBorder + pref.toolbarField),
				153: () => css(pref.toolbarFieldBorder + pref.toolbarField + 5),
			}),
			toolbar_field_focus: nova({
				0: () => css(pref.toolbarFieldOnFocus),
				153: () => css(pref.toolbarFieldOnFocus + 5),
			}),
			toolbar_top_separator: nova({
				0: () =>
					pref.tabbarBorder === 0
						? "transparent"
						: css(pref.tabbarBorder + pref.tabbar + 5),
				152: () => css(pref.toolbarBorder + pref.toolbar),
				153: () =>
					pref.toolbarBorder === 0
						? "transparent"
						: css(
								pref.toolbarBorder +
									pref.toolbar +
									pref.tabbar +
									5,
							),
			}),
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
		properties: {
			color_scheme: "system",
			content_color_scheme: "system",
			additional_backgrounds_tiling: nova({
				0: () => undefined,
				152: () => ["repeat"] as AdditionalBackgroundsTilingEnum[],
				153: () => undefined,
			}),
		},
	};
	void updateBrowserTheme(windowId, theme);
}

export default defineBackground(() => {
	addWindowCreatedListener(paintNewWindow);
	pref.initialise().then(run);
	pref.addOnChangeListener(run);
	addSchemeChangeListener(run);
	addTabChangeListener(run);
	addMessageListener(handleMessage);
	getFirefoxVersion().then((version) => (firefoxVersion = version));
	setInterval(() => void browser.runtime.getPlatformInfo(), 2e4);
});
