import { defaultPreferenceContent as defaultContent } from "./constants";

/**
 * Manages extension preferences and persistence.
 *
 * Provides methods for initialising, normalising, saving, and syncing extension
 * settings and site-specific rules with browser storage.
 *
 * @class
 */
export class Preference {
	/** The content of the preference. */
	#content: PreferenceContent = { ...defaultContent };

	/** State for storage writes and lifecycle. */
	#state: {
		isInitialised: boolean;
		lastWrite: number;
		isDisposed: boolean;
		writeTimeout?: ReturnType<typeof setTimeout>;
		pendingUpdates: Partial<PreferenceContent>;
	} = {
		isInitialised: false,
		lastWrite: 0,
		isDisposed: false,
		pendingUpdates: {},
	};

	/** The listeners for preference changes. */
	#onChangeListeners = new Set<() => void>();

	/** Listener for storage changes. */
	#storageListener?: (
		changes: { [key: string]: Browser.storage.StorageChange },
		areaName: Browser.storage.AreaName,
	) => void;

	/**
	 * Initialises preferences from storage, normalises them, and registers
	 * storage listeners.
	 *
	 * @async
	 */
	async initialise(): Promise<void> {
		this.#state.isDisposed = false;
		if (this.#storageListener)
			removeStorageChangeListener(this.#storageListener);
		const storedContent = await getStorageContent();
		const { result, removedKeys } = this.#normalise(storedContent);
		await removeStorageKeys(removedKeys);
		for (const key in result)
			this.#set(key as keyof PreferenceContent, result[key]);
		if (!supportsThemeAPI()) this.#set("compatibilityMode", true);
		await this.#save({ ...this.#content });

		this.#storageListener = (changes, areaName) => {
			if (areaName !== "local" || this.#state.isDisposed) return;
			const nextSave = changes.lastSave?.newValue;
			if (this.#isTimeStamp(nextSave)) {
				let hasUpdates = false;
				for (const [key, change] of Object.entries(changes)) {
					if (key in this.#content) hasUpdates = true;
					this.#set(key as keyof PreferenceContent, change.newValue);
				}
				if (hasUpdates) this.syncUI();
			}
		};
		addStorageChangeListener(this.#storageListener);
		this.#state.isInitialised = true;
	}

	/** Resets preferences to default values. */
	async reset(keys?: string[]): Promise<void> {
		if (keys) {
			for (const key of keys)
				if (key in defaultContent) {
					const prefKey = key as keyof PreferenceContent;
					this.#set(prefKey, defaultContent[prefKey]);
				}
		} else this.#content = { ...defaultContent };
		await this.#save({ ...this.#content });
	}

	/** Saves preferences to storage with a debounce. */
	async #save(updates: Partial<PreferenceContent> = {}): Promise<void> {
		if (this.#state.isDisposed) return;
		this.syncUI();
		this.#state.pendingUpdates = {
			...this.#state.pendingUpdates,
			...updates,
		};
		if (this.#state.writeTimeout !== undefined)
			clearTimeout(this.#state.writeTimeout);
		this.#state.writeTimeout = setTimeout(
			async () => {
				if (this.#state.isDisposed) return;
				this.#state.lastWrite = Date.now();
				const lastSave = Date.now();
				const contentToSave = {
					...this.#state.pendingUpdates,
					lastSave,
				};
				const success = await setStorageContent(contentToSave);
				if (success) {
					this.#content.lastSave = lastSave;
					this.#state.pendingUpdates = {};
					this.syncUI();
				}
			},
			Math.max(0, 50 + this.#state.lastWrite - Date.now()),
		);
	}

	/** Sets and normalises a preference value. */
	#set(key: keyof PreferenceContent, value: unknown): void {
		switch (key) {
			case "popup":
			case "popupBorder":
			case "sidebar":
			case "sidebarBorder":
			case "tabSelected":
			case "tabSelectedBorder":
			case "tabbar":
			case "tabbarBorder":
			case "toolbar":
			case "toolbarBorder":
			case "toolbarField":
			case "toolbarFieldBorder":
			case "toolbarFieldOnFocus":
				this.#content[key] =
					typeof value === "number" && !isNaN(value)
						? this.#normaliseNumber(value, {
								min: -50,
								max: 50,
								step: 1,
							})
						: defaultContent[key];
				break;
			case "ruleList":
				this.#content[key] = this.#normaliseRuleList(value);
				break;
			case "allowDarkLight":
			case "compatibilityMode":
			case "dynamic":
			case "noThemeColour":
			case "nova":
			case "overwriteAccentColour":
				this.#content[key] =
					typeof value === "boolean" ? value : defaultContent[key];
				break;
			case "accentColour_dark":
			case "accentColour_light":
			case "fallbackColour_dark":
			case "fallbackColour_light":
			case "homeBackground_dark":
			case "homeBackground_light":
				this.#content[key] =
					typeof value === "string" ? value : defaultContent[key];
				break;
			case "minContrast_light":
			case "minContrast_dark":
				this.#content[key] =
					typeof value === "number" && !isNaN(value)
						? this.#normaliseNumber(value, {
								min: 0,
								max: 210,
								step: 5,
							})
						: defaultContent[key];
				break;
			case "lastSave":
				this.#content.lastSave = value as number;
				break;
			case "version":
				break;
			default:
				console.warn("Unknown preference key:", key);
				break;
		}
	}

	/** Checks whether a value is a valid newer timestamp. */
	#isTimeStamp(value: unknown): value is number {
		return (
			typeof value === "number" &&
			!isNaN(value) &&
			value > this.#content.lastSave
		);
	}

	/** Checks whether a value is a valid rule or `null`. */
	#isRule(value: unknown): value is Rule {
		if (value === null) {
			return true;
		} else if (
			!this.#isRecord(value) ||
			typeof value.header !== "string" ||
			!["both", "dark", "light"].includes(value.scheme as string)
		) {
			return false;
		} else if (value.headerType === "ADDON_ID") {
			return value.type === "COLOUR" && typeof value.value === "string";
		} else if (value.headerType === "URL") {
			return (
				(value.type === "COLOUR" && typeof value.value === "string") ||
				(value.type === "THEME_COLOUR" &&
					typeof value.value === "boolean") ||
				(value.type === "QUERY_SELECTOR" &&
					typeof value.value === "string")
			);
		} else return false;
	}

	/** Checks whether a value is a plain record. */
	#isRecord(
		value: unknown,
	): value is Record<string | number | symbol, unknown> {
		return (
			value !== undefined &&
			value !== null &&
			typeof value === "object" &&
			!Array.isArray(value)
		);
	}

	/** Checks whether a value is a numeric array. */
	#isNumberArray(value: unknown): value is number[] {
		return (
			value !== undefined &&
			value !== null &&
			Array.isArray(value) &&
			value.every((item) => typeof item === "number" && !isNaN(item))
		);
	}

	/** Runs a migration callback when content version is older. */
	#migrate(
		content: Record<string, unknown>,
		version: number[],
		callback: () => void,
	): void {
		if (this.#isNumberArray(content.version)) {
			for (let i = 0; i < 3; i++) {
				const current = content.version[i] ?? 0;
				const target = version[i] ?? 0;
				if (current > target) return;
				if (current < target) return callback();
			}
			return;
		}
		callback();
	}

	/** Normalises and migrates preferences from older versions. */
	#normalise(content: Record<string, unknown>): {
		result: PreferenceContent;
		removedKeys: string[];
	} {
		let merged: Record<string, unknown> = { ...defaultContent, ...content };
		const removedKeys: string[] = [];

		this.#migrate(content, [2, 2, 3], () => {
			merged = { ...content, ...defaultContent };
		});
		this.#migrate(content, [2, 4], () => {
			if (merged.minContrast_light === 165) merged.minContrast_light = 90;
		});
		this.#migrate(content, [4, 0], () => {
			const ruleList: Record<string, unknown> = {};
			if (this.#isRecord(content.siteList)) {
				for (const [ruleId, ruleValue] of Object.entries(
					content.siteList,
				)) {
					ruleList[ruleId] = this.#isRecord(ruleValue)
						? { ...ruleValue, scheme: "both" }
						: null;
				}
			}
			merged.ruleList = ruleList;
		});

		for (const key in merged) {
			if (!(key in defaultContent)) {
				delete merged[key];
				removedKeys.push(key);
			}
		}

		return {
			result: { ...merged, version } as PreferenceContent,
			removedKeys,
		};
	}

	/** Normalises a numeric preference within constraints. */
	#normaliseNumber(
		num: number,
		{ min, max, step }: { min: number; max: number; step: number },
	): number {
		if (num > -1 && num < 1) num = Math.round(num * 100);
		const clamped = clamp(min, num, max);
		return Math.round(Math.round((clamped - min) / step) * step + min);
	}

	/** Normalises a rule list. */
	#normaliseRuleList(value: unknown): RuleList {
		if (!this.#isRecord(value)) return {};
		return Object.entries(value)
			.map(([id, rule]) => ({ id: Number(id), rule }))
			.filter(
				(item): item is { id: number; rule: Rule } =>
					Number.isInteger(item.id) &&
					item.id > 0 &&
					this.#isRule(item.rule),
			)
			.map(({ id, rule }) => {
				if (rule?.type === "COLOUR" && typeof rule.value === "string") {
					rule.value = new colour(rule.value).toHex();
				}
				return { id, rule };
			})
			.sort((first, second) => first.id - second.id)
			.reduce(
				(list, { rule }, i) => ({ ...list, [i + 1]: rule as Rule }),
				{} as RuleList,
			);
	}

	/** Returns preferences as JSON. */
	exportJSON(): string {
		return JSON.stringify(this.#content);
	}

	/** Imports preferences from JSON. */
	async importPref(jsonString: string): Promise<boolean> {
		try {
			const parsedPref = this.#normalise(JSON.parse(jsonString)).result;
			for (const key in parsedPref) {
				const prefKey = key as keyof PreferenceContent;
				this.#set(prefKey, parsedPref[prefKey]);
			}
			await this.#save({ ...this.#content });
			return true;
		} catch {
			return false;
		}
	}

	/** Registers a listener for preference changes. */
	addOnChangeListener(listener: () => void): () => void {
		this.#onChangeListeners.add(listener);
		return () => this.#onChangeListeners.delete(listener);
	}

	/** Synchronises the UI with the current preference state. */
	syncUI(): void {
		for (const listener of this.#onChangeListeners) listener();
	}

	/** Gets the timestamp of the last update. */
	getLastSave(): number {
		return this.#content.lastSave;
	}

	/** Adds a rule to the rule list. */
	async addRule(rule: Rule): Promise<void> {
		let id = 1;
		while (id in this.#content.ruleList) id++;
		await this.setRule(id, rule);
	}

	/** Sets a rule by ID. */
	async setRule(id: number, rule: Rule): Promise<void> {
		if (!this.#isRule(rule)) return;
		this.#content.ruleList[id] = rule;
		await this.#save({ ruleList: this.#content.ruleList });
	}

	/**
	 * Finds the last matching rule for a URL.
	 *
	 * Supports rule header being:
	 *
	 * - ID of web extension
	 * - Full URL (& trailing slash)
	 * - Regular expression
	 * - Wildcard pattern:
	 *
	 *   - `**` matches any string of any length
	 *   - `*` matches any characters except `/`, `.`, and `:`
	 *   - `?` matches any single character
	 *   - Scheme (e.g., `https://`) is optional
	 * - Hostname (& path)
	 */
	async getRule(url: string = "", scheme: Scheme): Promise<RuleQueryResult> {
		if (!url) return { id: 0, url, rule: null };

		const webExtId = await getWebExtId(url);
		const cleanUrl = url.replace(/\/$/, "");
		let match: RuleQueryResult = { id: 0, url, webExtId, rule: null };

		for (const [forId, rule] of Object.entries(this.#content.ruleList)) {
			if (
				!this.#isRule(rule) ||
				rule === null ||
				!rule.header ||
				(rule.scheme !== "both" && rule.scheme !== scheme)
			) {
				continue;
			} else if (
				webExtId !== undefined &&
				rule.headerType === "ADDON_ID" &&
				rule.header === webExtId
			) {
				match = { id: Number(forId), url, webExtId, rule };
			} else if (rule.headerType === "URL") {
				const cleanHeader = rule.header.replace(/\/$/, "");
				if (
					cleanUrl === cleanHeader ||
					this.#testRegex(cleanUrl, cleanHeader) ||
					this.#testWildcard(cleanUrl, cleanHeader) ||
					this.#testHostname(cleanUrl, cleanHeader)
				) {
					match = { id: Number(forId), url, webExtId, rule };
				}
			}
		}

		return match;
	}

	/** Tests whether a URL matches a regex pattern. */
	#testRegex(url: string, test: string): boolean {
		try {
			return new RegExp(`^${test}$`, "i").test(url);
		} catch {
			return false;
		}
	}

	/** Tests whether a URL matches a wildcard pattern. */
	#testWildcard(url: string, test: string): boolean {
		if (!test.includes("*") && !test.includes("?")) return false;
		try {
			const wildcardPattern = test
				.replace(/[.+^${}()|[\]\\]/g, "\\$&")
				.replace(/\*\*/g, "\0")
				.replace(/\*/g, "[^/.:]*")
				.replace(/\?/g, ".")
				.replace(/\0/g, ".*")
				.replace(/^([a-z]+:\/\/)/i, "$1")
				.replace(/^((?![a-z]+:\/\/).)/i, "(?:[a-z]+:\\/\\/)?$1");
			return new RegExp(`^${wildcardPattern}/?$`, "i").test(url);
		} catch {
			return false;
		}
	}

	/**
	 * Tests if a URL matches a specific hostname (with optional subdomains) or
	 * hostname with path.
	 */
	#testHostname(url: string, test: string): boolean {
		try {
			const { hostname, pathname } = new URL(url);
			const hostPart = test.split("/")[0];
			if (hostname !== hostPart && !hostname.endsWith(`.${hostPart}`))
				return false;
			const urlPath = hostPart + pathname;
			return urlPath === test || urlPath.startsWith(`${test}/`);
		} catch {
			return false;
		}
	}

	/** Gets preference instance ready state. */
	get isReady(): boolean {
		return this.#state.isInitialised && !this.#state.isDisposed;
	}

	/** Gets the popup brightness adjustment value. */
	get popup(): number {
		return this.#content.popup;
	}

	/** Sets the popup brightness adjustment value. */
	set popup(value: number) {
		this.#set("popup", value);
		this.#save({ popup: this.#content.popup });
	}

	/** Gets the popup border brightness adjustment value. */
	get popupBorder(): number {
		return this.#content.popupBorder;
	}

	/** Sets the popup border brightness adjustment value. */
	set popupBorder(value: number) {
		this.#set("popupBorder", value);
		this.#save({ popupBorder: this.#content.popupBorder });
	}

	/** Gets the sidebar brightness adjustment value. */
	get sidebar(): number {
		return this.#content.sidebar;
	}

	/** Sets the sidebar brightness adjustment value. */
	set sidebar(value: number) {
		this.#set("sidebar", value);
		this.#save({ sidebar: this.#content.sidebar });
	}

	/** Gets the sidebar border brightness adjustment value. */
	get sidebarBorder(): number {
		return this.#content.sidebarBorder;
	}

	/** Sets the sidebar border brightness adjustment value. */
	set sidebarBorder(value: number) {
		this.#set("sidebarBorder", value);
		this.#save({ sidebarBorder: this.#content.sidebarBorder });
	}

	/** Gets the selected tab brightness adjustment value. */
	get tabSelected(): number {
		return this.#content.tabSelected;
	}

	/** Sets the selected tab brightness adjustment value. */
	set tabSelected(value: number) {
		this.#set("tabSelected", value);
		this.#save({ tabSelected: this.#content.tabSelected });
	}

	/** Gets the selected tab border brightness adjustment value. */
	get tabSelectedBorder(): number {
		return this.#content.tabSelectedBorder;
	}

	/** Sets the selected tab border brightness adjustment value. */
	set tabSelectedBorder(value: number) {
		this.#set("tabSelectedBorder", value);
		this.#save({ tabSelectedBorder: this.#content.tabSelectedBorder });
	}

	/** Gets the tab bar brightness adjustment value. */
	get tabbar(): number {
		return this.#content.tabbar;
	}

	/** Sets the tab bar brightness adjustment value. */
	set tabbar(value: number) {
		this.#set("tabbar", value);
		this.#save({ tabbar: this.#content.tabbar });
	}

	/** Gets the tab bar border brightness adjustment value. */
	get tabbarBorder(): number {
		return this.#content.tabbarBorder;
	}

	/** Sets the tab bar border brightness adjustment value. */
	set tabbarBorder(value: number) {
		this.#set("tabbarBorder", value);
		this.#save({ tabbarBorder: this.#content.tabbarBorder });
	}

	/** Gets the toolbar brightness adjustment value. */
	get toolbar(): number {
		return this.#content.toolbar;
	}

	/** Sets the toolbar brightness adjustment value. */
	set toolbar(value: number) {
		this.#set("toolbar", value);
		this.#save({ toolbar: this.#content.toolbar });
	}

	/** Gets the toolbar border brightness adjustment value. */
	get toolbarBorder(): number {
		return this.#content.toolbarBorder;
	}

	/** Sets the toolbar border brightness adjustment value. */
	set toolbarBorder(value: number) {
		this.#set("toolbarBorder", value);
		this.#save({ toolbarBorder: this.#content.toolbarBorder });
	}

	/** Gets the toolbar field brightness adjustment value. */
	get toolbarField(): number {
		return this.#content.toolbarField;
	}

	/** Sets the toolbar field brightness adjustment value. */
	set toolbarField(value: number) {
		this.#set("toolbarField", value);
		this.#save({ toolbarField: this.#content.toolbarField });
	}

	/** Gets the toolbar field border brightness adjustment value. */
	get toolbarFieldBorder(): number {
		return this.#content.toolbarFieldBorder;
	}

	/** Sets the toolbar field border brightness adjustment value. */
	set toolbarFieldBorder(value: number) {
		this.#set("toolbarFieldBorder", value);
		this.#save({ toolbarFieldBorder: this.#content.toolbarFieldBorder });
	}

	/** Gets the toolbar field on focus brightness adjustment value. */
	get toolbarFieldOnFocus(): number {
		return this.#content.toolbarFieldOnFocus;
	}

	/** Sets the toolbar field on focus brightness adjustment value. */
	set toolbarFieldOnFocus(value: number) {
		this.#set("toolbarFieldOnFocus", value);
		this.#save({ toolbarFieldOnFocus: this.#content.toolbarFieldOnFocus });
	}

	/** Gets the site-specific policies list. */
	get ruleList(): RuleList {
		return this.#content.ruleList;
	}

	/** Sets the site-specific policies list. */
	set ruleList(value: RuleList) {
		this.#set("ruleList", value);
		this.#save({ ruleList: this.#content.ruleList });
	}

	/** Gets the accent colour for dark theme. */
	get accentColour_dark(): string {
		return this.#content.accentColour_dark;
	}

	/** Sets the accent colour for dark theme. */
	set accentColour_dark(value: string) {
		this.#set("accentColour_dark", value);
		this.#save({ accentColour_dark: this.#content.accentColour_dark });
	}

	/** Gets the accent colour for light theme. */
	get accentColour_light(): string {
		return this.#content.accentColour_light;
	}

	/** Sets the accent colour for light theme. */
	set accentColour_light(value: string) {
		this.#set("accentColour_light", value);
		this.#save({ accentColour_light: this.#content.accentColour_light });
	}

	/** Gets whether dark/light scheme switching is allowed. */
	get allowDarkLight(): boolean {
		return this.#content.allowDarkLight;
	}

	/** Sets whether dark/light scheme switching is allowed. */
	set allowDarkLight(value: boolean) {
		this.#set("allowDarkLight", value);
		this.#save({ allowDarkLight: this.#content.allowDarkLight });
	}

	/** Gets whether compatibility mode is enabled. */
	get compatibilityMode(): boolean {
		return this.#content.compatibilityMode;
	}

	/** Sets whether compatibility mode is enabled. */
	set compatibilityMode(value: boolean) {
		this.#set("compatibilityMode", value);
		this.#save({ compatibilityMode: this.#content.compatibilityMode });
	}

	/** Gets whether dynamic colour extraction is enabled. */
	get dynamic(): boolean {
		return this.#content.dynamic;
	}

	/** Sets whether dynamic colour extraction is enabled. */
	set dynamic(value: boolean) {
		this.#set("dynamic", value);
		this.#save({ dynamic: this.#content.dynamic });
	}

	/** Gets the fallback colour for dark theme. */
	get fallbackColour_dark(): string {
		return this.#content.fallbackColour_dark;
	}

	/** Sets the fallback colour for dark theme. */
	set fallbackColour_dark(value: string) {
		this.#set("fallbackColour_dark", value);
		this.#save({ fallbackColour_dark: this.#content.fallbackColour_dark });
	}

	/** Gets the fallback colour for light theme. */
	get fallbackColour_light(): string {
		return this.#content.fallbackColour_light;
	}

	/** Sets the fallback colour for light theme. */
	set fallbackColour_light(value: string) {
		this.#set("fallbackColour_light", value);
		this.#save({
			fallbackColour_light: this.#content.fallbackColour_light,
		});
	}

	/** Gets the home background colour for dark theme. */
	get homeBackground_dark(): string {
		return this.#content.homeBackground_dark;
	}

	/** Sets the home background colour for dark theme. */
	set homeBackground_dark(value: string) {
		this.#set("homeBackground_dark", value);
		this.#save({ homeBackground_dark: this.#content.homeBackground_dark });
	}

	/** Gets the home background colour for light theme. */
	get homeBackground_light(): string {
		return this.#content.homeBackground_light;
	}

	/** Sets the home background colour for light theme. */
	set homeBackground_light(value: string) {
		this.#set("homeBackground_light", value);
		this.#save({
			homeBackground_light: this.#content.homeBackground_light,
		});
	}

	/** Gets the minimum contrast ratio for dark theme (times 10). */
	get minContrast_dark(): number {
		return this.#content.minContrast_dark;
	}

	/** Sets the minimum contrast ratio for dark theme (times 10). */
	set minContrast_dark(value: number) {
		this.#set("minContrast_dark", value);
		this.#save({ minContrast_dark: this.#content.minContrast_dark });
	}

	/** Gets the minimum contrast ratio for light theme (times 10). */
	get minContrast_light(): number {
		return this.#content.minContrast_light;
	}

	/** Sets the minimum contrast ratio for light theme (times 10). */
	set minContrast_light(value: number) {
		this.#set("minContrast_light", value);
		this.#save({ minContrast_light: this.#content.minContrast_light });
	}

	/** Gets whether theme colour should be ignored by default. */
	get noThemeColour(): boolean {
		return this.#content.noThemeColour;
	}

	/** Sets whether theme colour should be ignored by default. */
	set noThemeColour(value: boolean) {
		this.#set("noThemeColour", value);
		this.#save({ noThemeColour: this.#content.noThemeColour });
	}

	/** Gets whether Nova UI is used. */
	get nova(): boolean {
		return this.#content.nova;
	}

	/** Sets whether Nova UI is used. */
	set nova(value: boolean) {
		this.#set("nova", value);
		this.#save({ nova: this.#content.nova });
	}

	/** Gets whether accent colour should be overwritten. */
	get overwriteAccentColour(): boolean {
		return this.#content.overwriteAccentColour;
	}

	/** Sets whether accent colour should be overwritten. */
	set overwriteAccentColour(value: boolean) {
		this.#set("overwriteAccentColour", value);
		this.#save({
			overwriteAccentColour: this.#content.overwriteAccentColour,
		});
	}

	/** Disposes storage listeners and pending writes. */
	dispose(): void {
		this.#state.isDisposed = true;
		if (this.#state.writeTimeout !== undefined)
			clearTimeout(this.#state.writeTimeout);
		if (this.#storageListener)
			removeStorageChangeListener(this.#storageListener);
		this.#storageListener = undefined;
	}
}

export default Preference;
