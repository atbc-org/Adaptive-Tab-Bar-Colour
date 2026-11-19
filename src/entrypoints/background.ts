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
 * `prefs.advanced.allowDarkLight`:
 * A setting that decides if a light theme is allowed to be used when current.scheme is dark, or vice versa.
 *
 * meta tag theme:
 * A colour defined with a meta tag by some websites, usually static.
 * It is often more related to the branding than the actual appearance of the website.
 *
 * Theme:
 * An object that defines the colour of the Firefox UI.
 */

/** Current prefs snapshot. */
let prefs: Prefs = { ...defaultPrefs };
let isReady = false;

/** Blank tab IDs. */
const blankTabIds = new Set<number>();

/** Page colour of Firefox internal page. */
const browserColour = createBrowserColour(
	() => cache.scheme,
	() => prefs,
);

/** Runtime cache. */
const cache: {
	getRuleResult: Record<number, GetRuleResult | undefined>;
	getMetaResult: Record<number, GetMetaResult | undefined>;
	setThemeResult: Record<number, SetThemeResult | undefined>;
	scheme: Scheme;
	readonly reversedScheme: Scheme;
	clear: (windowId?: number) => Promise<void>;
} = {
	getRuleResult: {},
	getMetaResult: {},
	setThemeResult: {},
	scheme: "light",
	/** The reversed colour theme. */
	get reversedScheme() {
		return this.scheme === "light" ? "dark" : "light";
	},
	/**
	 * Updates `scheme` and clears `getRuleResult`, `getMetaResult`, and
	 * `setThemeResult`.
	 */
	async clear(windowId?: number) {
		this.scheme = await getCurrentScheme();
		if (windowId !== undefined) {
			delete this.getRuleResult[windowId];
			delete this.getMetaResult[windowId];
			delete this.setThemeResult[windowId];
		} else {
			this.getRuleResult = {};
			this.getMetaResult = {};
			this.setThemeResult = {};
		}
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
		case "UPDATE_COLOUR": {
			if (tab === undefined || !tab.active) break;
			const windowId = tab.windowId;
			const getRuleResult = cache.getRuleResult[windowId] ?? {
				url: tab.url ?? "",
			};
			const webPageMeta = await getWebPageMeta(
				tab.id,
				getRuleResult.rule,
				message.colour,
			);
			if (!webPageMeta.success) break;
			const getMetaResult = (cache.getMetaResult[windowId] =
				webPageMeta.result);
			const setThemeResult = (cache.setThemeResult[windowId] = setTheme(
				tab,
				getMetaResult,
				cache.scheme,
				prefs,
				browserColour.HOME,
			));
			sendMessageToPopup({
				header: "CACHE_UPDATE",
				windowId,
				cache: { getRuleResult, getMetaResult, setThemeResult },
			});
			break;
		}
		case "CACHE_REQUEST": {
			const windowId = await getActiveWindowId();
			if (windowId === undefined) return undefined;
			const getRuleResult = cache.getRuleResult[windowId];
			const getMetaResult = cache.getMetaResult[windowId];
			const setThemeResult = cache.setThemeResult[windowId];
			return getRuleResult && getMetaResult && setThemeResult
				? { getRuleResult, getMetaResult, setThemeResult }
				: undefined;
		}
		default:
			await run();
	}
	return true;
}

const runDebounceMs = 50;
const pendingWindowRuns = new Map<number, ReturnType<typeof setTimeout>>();

/**
 * Triggers colour update for all active tabs, or a specific window's active
 * tab.
 */
async function run(windowId?: number): Promise<void> {
	if (!isReady) return;
	if (windowId === undefined) {
		for (const timer of pendingWindowRuns.values()) clearTimeout(timer);
		pendingWindowRuns.clear();
	}
	await cache.clear(windowId);
	(await getActiveTabList(windowId)).forEach(updateTab);
}

/**
 * Schedules a debounced colour update for a window, or runs immediately if
 * global.
 */
function scheduleRun(windowId?: number): void {
	if (windowId === undefined) {
		void run();
		return;
	}
	const existing = pendingWindowRuns.get(windowId);
	if (existing !== undefined) clearTimeout(existing);
	pendingWindowRuns.set(
		windowId,
		setTimeout(() => {
			pendingWindowRuns.delete(windowId);
			void run(windowId);
		}, runDebounceMs),
	);
}

/** Updates the colour for a tab and caches its meta information. */
async function updateTab(tab: Browser.tabs.Tab): Promise<void> {
	const windowId = tab.windowId;
	const getRuleResult = (cache.getRuleResult[windowId] = await getRule(
		tab.url,
		cache.scheme,
		prefs.rule,
	));
	const getMetaResult = (cache.getMetaResult[windowId] = await getMeta(
		tab,
		getRuleResult,
	));
	const setThemeResult = (cache.setThemeResult[windowId] = setTheme(
		tab,
		getMetaResult,
		cache.scheme,
		prefs,
		browserColour.HOME,
	));
	sendMessageToPopup({
		header: "CACHE_UPDATE",
		windowId: tab.windowId,
		cache: { getRuleResult, getMetaResult, setThemeResult },
	});
}

/** Gets colour metadata for a tab. */
async function getMeta(
	tab: Browser.tabs.Tab,
	getRuleResult: GetRuleResult,
): Promise<GetMetaResult> {
	const { id, windowId, url, title, favIconUrl } = tab;

	if (!id) {
		console.warn("Failed to get tab ID of", url);
		return { colour: browserColour.FALLBACK, reason: "ERROR_OCCURRED" };
	} else if (!url || !URL.canParse(url)) {
		console.warn("Failed to get URL of tab", id);
		return { colour: browserColour.FALLBACK, reason: "ERROR_OCCURRED" };
	}

	const { hostname, href, pathname, protocol } = new URL(url);
	const { rule, webExtId } = getRuleResult;

	if (href !== "about:blank" && href !== "about:newtab") {
		blankTabIds.delete(id);
	}

	if (rule?.type === "COLOUR") {
		sendMessageToTab(id, { header: "SETUP_SCRIPT", mode: "suspend" }).catch(
			() => {},
		);

		if (rule.target === "URL") {
			return {
				colour: new Colour(rule.value),
				reason: "COLOUR_SPECIFIED",
			};
		} else if (rule.target === "ADDON_ID") {
			const info = await getWebExtName(rule.header);
			if (info)
				return {
					colour: new Colour(rule.value),
					reason: "ADDON_SPECIFIED",
					info,
				};
		}
	}

	const webPageMeta = await getWebPageMeta(id, rule);
	if (webPageMeta.success) return webPageMeta.result;
	console.info("Could not connect to", url);

	if (protocol === "about:") {
		return await getAboutPageMeta(id, windowId, href, pathname, title);
	} else if (protocol === "moz-extension:") {
		return await getWebExtPageMeta(webExtId);
	} else if (sourcePageProtocol.includes(protocol)) {
		return getSourcePageMeta(protocol, href);
	} else if (href.startsWith("data:image")) {
		return { colour: browserColour.IMAGE_VIEWER, reason: "IMAGE_VIEWER" };
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
		return { colour: browserColour.FALLBACK, reason: "FALLBACK_COLOUR" };
	}
}

/** Fetches and parses colour metadata for a web page tab. */
async function getWebPageMeta(
	tabId: number | undefined,
	rule?: Rule,
	colourData?: TabColourData,
): Promise<{ success: true; result: GetMetaResult } | { success: false }> {
	let tabColourData = colourData;
	if (!tabColourData) {
		if (tabId === undefined) return { success: false };
		try {
			tabColourData = await sendMessageToTab<TabColourData>(tabId, {
				header: "SETUP_SCRIPT",
				mode: prefs.advanced.dynamic ? "dynamic" : "static",
				query: rule?.type === "QUERY_SELECTOR" ? rule.value : undefined,
			});
		} catch {
			return { success: false };
		}
	}

	const parsePageColour = () => {
		let pageColour = new Colour();
		for (const element of tabColourData.page) {
			const opacity = parseFloat(element.opacity);
			if (isNaN(opacity)) continue;
			pageColour = pageColour.mix(
				new Colour(element.colour).opacity(opacity),
			);
			if (pageColour.isOpaque()) return pageColour;
		}
		return pageColour.mix(browserColour.FALLBACK);
	};
	const parseThemeColour = () =>
		new Colour(tabColourData.theme[cache.scheme]);
	const parseQueryColour = () => new Colour(tabColourData.query?.colour);
	const getFallbackColour = () => {
		switch (tabColourData.special) {
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
			return {
				success: true,
				result: themeColour.isOpaque()
					? rule?.value
						? {
								colour: themeColour,
								reason: prefs.advanced.noThemeColour
									? "THEME_UNIGNORED"
									: "THEME_USED",
							}
						: {
								colour: getFallbackColour(),
								reason: "THEME_IGNORED",
							}
					: {
							colour: getFallbackColour(),
							reason: rule?.value
								? "THEME_MISSING"
								: "COLOUR_PICKED",
						},
			};
		}
		case "QUERY_SELECTOR": {
			const queryColour = parseQueryColour();
			return {
				success: true,
				result: queryColour.isOpaque()
					? {
							colour: queryColour,
							reason: "QS_USED",
							info: rule?.value || "🕳️",
						}
					: {
							colour: getFallbackColour(),
							reason: "QS_FAILED",
							info: rule?.value || "🕳️",
						},
			};
		}
		default: {
			const themeColour = parseThemeColour();
			return {
				success: true,
				result: themeColour.isOpaque()
					? !prefs.advanced.noThemeColour
						? { colour: themeColour, reason: "THEME_USED" }
						: {
								colour: getFallbackColour(),
								reason: "THEME_IGNORED",
							}
					: {
							colour: getFallbackColour(),
							reason:
								tabColourData.special === "image" ||
								tabColourData.special === "svg"
									? "IMAGE_VIEWER"
									: tabColourData.special === "plaintext"
										? "TEXT_VIEWER"
										: "COLOUR_PICKED",
						},
			};
		}
	}
}

/** Gets the colour metadata for source pages. */
function getSourcePageMeta(protocol: string, href: string): GetMetaResult {
	const reason = "PROTECTED_PAGE";
	if (href === "chrome://browser/content/blanktab.html") {
		return { colour: browserColour.BLANK, reason };
	} else if (
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
	tabId: number,
	windowId: number,
	href: string,
	pathname: string,
	title?: string,
): Promise<GetMetaResult> {
	if (href === "about:privatebrowsing") {
		return {
			colour: (await isWindowIncognito(windowId))
				? browserColour.PRIVATE
				: browserColour.DEFAULT,
			reason: "PROTECTED_PAGE",
		};
	} else if (href === "about:newtab" && blankTabIds.has(tabId)) {
		return { colour: browserColour.BLANK, reason: "PROTECTED_PAGE" };
	} else {
		const identifier =
			href === "about:blank" &&
			title?.startsWith("about:") &&
			title?.endsWith("profile")
				? title.slice(6)
				: pathname;
		const data = aboutPageColour[identifier];
		return data
			? { colour: browserColour[data.colour], reason: data.reason }
			: { colour: browserColour.DEFAULT, reason: "PROTECTED_PAGE" };
	}
}

/** Gets the colour metadata for an extension page. */
async function getWebExtPageMeta(webExtId?: string): Promise<GetMetaResult> {
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

export default defineBackground(() => {
	initPrefs().then((initial) => {
		prefs = initial;
		isReady = true;
		void run();
	});
	watchPrefs((updated) => {
		prefs = updated;
		void run();
	});
	addSchemeChangeListener(() => void run());
	addTabChangeListener(scheduleRun);
	addMessageListener(handleMessage);
	addBlankPageListener((tabId, isBlank) => {
		if (isBlank) blankTabIds.add(tabId);
		else blankTabIds.delete(tabId);
	});
	setInterval(() => void getPlatformInfo(), 2e4);
});
