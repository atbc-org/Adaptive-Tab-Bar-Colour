/**
 * Retrieves the media query list for dark mode detection. Guards against
 * environments lacking the native window object.
 */
const getDarkSchemeDetection = (): MediaQueryList | undefined => {
	if (
		typeof window !== "undefined" &&
		typeof window.matchMedia === "function"
	)
		return window.matchMedia("(prefers-color-scheme: dark)");
};

/** Detects the system colour scheme. */
export function getSystemScheme(): Scheme {
	const detection = getDarkSchemeDetection();
	return detection?.matches ? "dark" : "light";
}

/**
 * Retrieves the preferred colour scheme. Falls back to the system scheme if no
 * browser preference is set.
 */
export async function getCurrentScheme(): Promise<Scheme> {
	try {
		const webAppearanceSetting =
			await browser.browserSettings?.overrideContentColorScheme?.get({});
		const webAppearance = webAppearanceSetting?.value;
		return webAppearance === "light" || webAppearance === "dark"
			? (webAppearance as Scheme)
			: getSystemScheme();
	} catch {
		return getSystemScheme();
	}
}

/** Registers a listener for colour scheme changes. */
export function addSchemeChangeListener(
	listener: (scheme: Scheme) => void,
): void {
	const onChange = async () => listener(await getCurrentScheme());
	getDarkSchemeDetection()?.addEventListener("change", onChange);
	browser?.browserSettings?.overrideContentColorScheme?.onChange?.addListener(
		onChange,
	);
}

/** Retrieves local storage content. */
export async function getStorageContent(): Promise<Record<string, unknown>> {
	try {
		return (await browser.storage?.local.get()) ?? {};
	} catch {
		return {};
	}
}

/** Saves content to local storage. */
export async function setStorageContent(
	content: Partial<PreferenceContent>,
): Promise<boolean> {
	try {
		await browser.storage?.local.set(content);
		return true;
	} catch {
		return false;
	}
}

/** Removes local storage keys. */
export async function removeStorageKeys(keys: string[]): Promise<void> {
	await Promise.all(
		keys.map(async (key) => await browser.storage?.local.remove(key)),
	);
}

/** Registers a listener for local storage changes. */
export function addStorageChangeListener(
	listener: (
		changes: { [key: string]: Browser.storage.StorageChange },
		areaName: Browser.storage.AreaName,
	) => void,
): void {
	browser.storage?.onChanged?.addListener(listener);
}

/** Removes a listener for local storage changes. */
export function removeStorageChangeListener(
	listener: (
		changes: { [key: string]: Browser.storage.StorageChange },
		areaName: Browser.storage.AreaName,
	) => void,
): void {
	browser.storage?.onChanged?.removeListener(listener);
}

/** Registers a listener for tab and window change events. */
export function addTabChangeListener(listener: () => void): void {
	browser.tabs?.onAttached?.addListener(listener);
	browser.tabs?.onActivated?.addListener(listener);
	browser.tabs?.onUpdated?.addListener(listener, { properties: ["status"] });
	browser.windows?.onFocusChanged?.addListener(listener);
	browser.windows?.onBoundsChanged?.addListener(listener);
}

/** Checks whether the tab's window is incognito. */
export async function isWindowIncognito(windowId: number): Promise<boolean> {
	try {
		return (await browser.windows?.get(windowId))?.incognito ?? false;
	} catch {
		return false;
	}
}

/** Retrieves the ID of the current or last active window. */
export async function getActiveWindowId(): Promise<number | undefined> {
	return (
		(await browser.tabs?.query({ active: true, currentWindow: true }))?.[0]
			?.windowId ?? (await browser.windows?.getLastFocused())?.id
	);
}

/** Retrieves all active and fully loaded tabs. */
export async function getActiveTabList(): Promise<Browser.tabs.Tab[]> {
	return (
		(await browser.tabs?.query({ active: true, status: "complete" })) ?? []
	);
}

/** Checks whether the browser exposes theme API. */
export function supportsThemeAPI(): boolean {
	return typeof browser.theme?.update === "function";
}

/** Updates the browser theme for a specific window. */
export async function updateBrowserTheme(
	windowId: number,
	theme: Theme,
): Promise<boolean> {
	try {
		await browser.theme?.update(windowId, theme);
		return true;
	} catch {
		console.error(
			"Failed to update browser theme. Theme API might not be supported.",
		);
		return false;
	}
}

/** Resolves the extension ID from a `moz-extension:` URL. */
export async function getWebExtId(url: string): Promise<string | undefined> {
	if (!url.startsWith("moz-extension:") || !URL.canParse(url)) return;
	const targetHost = new URL(url).hostname;
	const addonList = (await browser.management?.getAll()) ?? [];
	return addonList.find(
		(addon) =>
			addon.type === "extension" &&
			addon.hostPermissions?.some(
				(host) =>
					host.startsWith("moz-extension:") &&
					URL.canParse(host) &&
					new URL(host).hostname === targetHost,
			),
	)?.id;
}

/** Resolves the extension name from an add-on ID. */
export async function getWebExtName(id: string): Promise<string | undefined> {
	try {
		const addon = await browser.management?.get(id);
		if (addon?.type === "extension") return addon.name;
	} catch {}
}

/** Sends a message to the background script. */
export async function sendMessageToBackground<T = unknown>(
	message: MessageForBackground,
): Promise<T> {
	return await browser.runtime?.sendMessage(message);
}

/** Sends a message to popup listeners. */
export async function sendMessageToPopup<T = unknown>(
	message: MessageForPopup,
): Promise<T> {
	return await browser.runtime?.sendMessage(message).catch(() => {});
}

/** Sends a message to a specific tab. */
export async function sendMessageToTab<T = unknown>(
	tabId: number,
	message: MessageForTab,
): Promise<T> {
	return await browser.tabs?.sendMessage(tabId, message);
}

/** Registers a runtime message listener. */
export function addMessageListener(
	listener:
		BackgroundMessageListener | PopupMessageListener | TabMessageListener,
): void {
	browser.runtime?.onMessage?.addListener(listener);
}

/** Removes a runtime message listener. */
export function removeMessageListener(
	listener:
		BackgroundMessageListener | PopupMessageListener | TabMessageListener,
): void {
	browser.runtime?.onMessage?.removeListener(listener);
}

/** Clamps a number between a minimum and maximum value. */
export function clamp(min: number, num: number, max: number): number {
	return Math.max(min, Math.min(max, num));
}

/** Retrieves the major Firefox version. */
export async function getFirefoxVersion(): Promise<number> {
	const minVersion = 115;
	try {
		if (typeof browser.runtime?.getBrowserInfo !== "function")
			return minVersion;
		const browserInfo = await browser.runtime.getBrowserInfo();
		if (browserInfo.name !== "Firefox") return minVersion;
		const version = parseInt(browserInfo.version, 10);
		return isNaN(version) ? minVersion : version;
	} catch {
		return minVersion;
	}
}
