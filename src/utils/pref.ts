import { nanoid } from "nanoid";

export const themeKeys: (keyof ThemePrefs)[] = [
	"popup",
	"popupBorder",
	"sidebar",
	"sidebarBorder",
	"tabSelected",
	"tabSelectedBorder",
	"tabbar",
	"tabbarBorder",
	"toolbar",
	"toolbarBorder",
	"toolbarField",
	"toolbarFieldBorder",
	"toolbarFieldOnFocus",
];

export const advancedKeys: (keyof AdvancedPrefs)[] = [
	"accentColour_dark",
	"accentColour_light",
	"allowDarkLight",
	"compatibilityMode",
	"dynamic",
	"fallbackColour_dark",
	"fallbackColour_light",
	"homeBackground_dark",
	"homeBackground_light",
	"minContrast_dark",
	"minContrast_light",
	"noThemeColour",
	"overwriteAccentColour",
	"syncSettings",
];

export const keyToPrefKeyMap = new Map<string, PrefKey>([
	...themeKeys.map((key): [string, PrefKey] => [`theme:${key}`, key]),
	...advancedKeys.map((key): [string, PrefKey] => [`advanced:${key}`, key]),
]);

let cachedPrefItems: PrefStorageItems | undefined;

/** Defines a single WXT storage item for a pref key. */
function definePrefItem<K extends PrefKey>(
	prefix: "theme" | "advanced",
	key: K,
): WxtStorageItem<Prefs[K], Record<string, unknown>> {
	const fallback = defaultPrefs[key];
	return storage.defineItem<Prefs[K]>(`local:${prefix}:${key}`, { fallback });
}

/** Gets (and lazily defines) WXT storage items for all theme and advanced prefs. */
function getPrefItems(): PrefStorageItems {
	if (cachedPrefItems) return cachedPrefItems;
	cachedPrefItems = {
		popup: definePrefItem("theme", "popup"),
		popupBorder: definePrefItem("theme", "popupBorder"),
		sidebar: definePrefItem("theme", "sidebar"),
		sidebarBorder: definePrefItem("theme", "sidebarBorder"),
		tabSelected: definePrefItem("theme", "tabSelected"),
		tabSelectedBorder: definePrefItem("theme", "tabSelectedBorder"),
		tabbar: definePrefItem("theme", "tabbar"),
		tabbarBorder: definePrefItem("theme", "tabbarBorder"),
		toolbar: definePrefItem("theme", "toolbar"),
		toolbarBorder: definePrefItem("theme", "toolbarBorder"),
		toolbarField: definePrefItem("theme", "toolbarField"),
		toolbarFieldBorder: definePrefItem("theme", "toolbarFieldBorder"),
		toolbarFieldOnFocus: definePrefItem("theme", "toolbarFieldOnFocus"),
		accentColour_dark: definePrefItem("advanced", "accentColour_dark"),
		accentColour_light: definePrefItem("advanced", "accentColour_light"),
		allowDarkLight: definePrefItem("advanced", "allowDarkLight"),
		compatibilityMode: definePrefItem("advanced", "compatibilityMode"),
		dynamic: definePrefItem("advanced", "dynamic"),
		fallbackColour_dark: definePrefItem("advanced", "fallbackColour_dark"),
		fallbackColour_light: definePrefItem(
			"advanced",
			"fallbackColour_light",
		),
		homeBackground_dark: definePrefItem("advanced", "homeBackground_dark"),
		homeBackground_light: definePrefItem(
			"advanced",
			"homeBackground_light",
		),
		minContrast_dark: definePrefItem("advanced", "minContrast_dark"),
		minContrast_light: definePrefItem("advanced", "minContrast_light"),
		noThemeColour: definePrefItem("advanced", "noThemeColour"),
		overwriteAccentColour: definePrefItem(
			"advanced",
			"overwriteAccentColour",
		),
		syncSettings: definePrefItem("advanced", "syncSettings"),
	};
	return cachedPrefItems;
}

/** Checks whether a value is a plain record. */
function isRecord(
	value: unknown,
): value is Record<string | number | symbol, unknown> {
	return (
		value !== undefined &&
		value !== null &&
		typeof value === "object" &&
		!Array.isArray(value)
	);
}

/** Checks whether syncSettings preference is currently enabled. */
export async function isSyncSettingsEnabled(): Promise<boolean> {
	return await (
		getPrefItems().syncSettings as WxtStorageItem<
			boolean,
			Record<string, unknown>
		>
	).getValue();
}

/** Normalises a numeric pref within constraints. */
function normaliseNumber(
	num: number,
	{ min, max, step }: { min: number; max: number; step: number },
): number {
	const scaled = num > -1 && num < 1 ? Math.round(num * 100) : num;
	const clamped = clamp(min, scaled, max);
	return Math.round(Math.round((clamped - min) / step) * step + min);
}

/** Normalises a pref value for a specific key. */
export function normalisePref<K extends PrefKey>(
	key: K,
	value: unknown,
): Prefs[K] {
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
			return (
				typeof value === "number" && !isNaN(value)
					? normaliseNumber(value, { min: -50, max: 50, step: 1 })
					: defaultPrefs[key]
			) as Prefs[K];
		case "allowDarkLight":
		case "dynamic":
		case "noThemeColour":
		case "overwriteAccentColour":
		case "syncSettings":
			return (
				typeof value === "boolean" ? value : defaultPrefs[key]
			) as Prefs[K];
		case "compatibilityMode":
			return (!supportsThemeAPI() ||
				(typeof value === "boolean"
					? value
					: defaultPrefs[key])) as Prefs[K];
		case "accentColour_dark":
		case "accentColour_light":
		case "fallbackColour_dark":
		case "fallbackColour_light":
		case "homeBackground_dark":
		case "homeBackground_light":
			return (
				typeof value === "string" ? value : defaultPrefs[key]
			) as Prefs[K];
		case "minContrast_light":
		case "minContrast_dark":
			return (
				typeof value === "number" && !isNaN(value)
					? normaliseNumber(value, { min: 0, max: 210, step: 5 })
					: defaultPrefs[key]
			) as Prefs[K];
	}
}

/** Normalises a single rule object, or returns `null` if invalid. */
export function normaliseRule(value: unknown, fallbackOrder = 1): Rule | null {
	const isValid =
		isRecord(value) &&
		typeof value.header === "string" &&
		["both", "dark", "light"].includes(value.scheme as string);
	if (!isValid) return null;

	const order =
		typeof value.order === "number" && Number.isInteger(value.order)
			? value.order
			: fallbackOrder;
	const scheme = value.scheme as "both" | Scheme;
	const header = value.header as string;
	const target = value.target ?? value.headerType;

	if (
		target === "ADDON_ID" &&
		value.type === "COLOUR" &&
		typeof value.value === "string"
	) {
		return {
			target: "ADDON_ID",
			header,
			type: "COLOUR",
			value: new Colour(value.value).toHex(),
			scheme,
			order,
		};
	} else if (
		target === "URL" &&
		value.type === "COLOUR" &&
		typeof value.value === "string"
	) {
		return {
			target: "URL",
			header,
			type: "COLOUR",
			value: new Colour(value.value).toHex(),
			scheme,
			order,
		};
	} else if (
		target === "URL" &&
		value.type === "THEME_COLOUR" &&
		typeof value.value === "boolean"
	) {
		return {
			target: "URL",
			header,
			type: "THEME_COLOUR",
			value: value.value,
			scheme,
			order,
		};
	} else if (
		target === "URL" &&
		value.type === "QUERY_SELECTOR" &&
		typeof value.value === "string"
	) {
		return {
			target: "URL",
			header,
			type: "QUERY_SELECTOR",
			value: value.value,
			scheme,
			order,
		};
	} else {
		return null;
	}
}

/** Normalises a raw storage snapshot or imported record into a `Prefs` object. */
export function normalisePrefs(raw: Record<string, unknown>): Prefs {
	const prefs: Prefs = { ...defaultPrefs, rules: {} };

	for (const [storageKey, prefKey] of keyToPrefKeyMap.entries()) {
		const rawValue = storageKey in raw ? raw[storageKey] : raw[prefKey];
		(prefs as Record<string, unknown>)[prefKey] = normalisePref(
			prefKey,
			rawValue,
		);
	}

	const rawRules: { id: string; rule: Rule }[] = [];
	let fallbackOrder = 1;

	for (const [key, value] of Object.entries(raw)) {
		if (!key.startsWith("rule:")) continue;
		const id = key.slice(5);
		const rule = normaliseRule(value, fallbackOrder++);
		if (!id || !rule) continue;
		rawRules.push({ id, rule });
	}

	const legacyRules = isRecord(raw.rules)
		? raw.rules
		: isRecord(raw.ruleList)
			? raw.ruleList
			: null;
	if (legacyRules) {
		const sortedEntries = Object.entries(legacyRules).sort(
			([first], [second]) => Number(first) - Number(second),
		);
		for (const [, value] of sortedEntries) {
			const rule = normaliseRule(value, fallbackOrder++);
			if (!rule) continue;
			rawRules.push({ id: nanoid(), rule });
		}
	}

	rawRules
		.sort((first, second) => first.rule.order - second.rule.order)
		.forEach(({ id, rule }, index) => {
			prefs.rules[id] = { ...rule, order: index + 1 };
		});

	return prefs;
}

/** Synchronises a `Prefs` object with a storage snapshot. */
export async function syncStorage(
	prefs: Prefs,
	snapshot: Record<string, unknown>,
	area: "local" | "sync" = "local",
): Promise<void> {
	const expected: Record<string, unknown> = {};
	for (const [storageKey, prefKey] of keyToPrefKeyMap.entries()) {
		if (area === "sync" && prefKey === "syncSettings") continue;
		expected[storageKey] = prefs[prefKey];
	}
	for (const [id, rule] of Object.entries(prefs.rules)) {
		expected[`rule:${id}`] = rule;
	}

	const keysToRemove: StorageItemKey[] = [];
	for (const key of Object.keys(snapshot)) {
		if (area === "sync" && key === "advanced:syncSettings") continue;
		if (!(key in expected)) {
			keysToRemove.push(`${area}:${key}` as StorageItemKey);
		}
	}

	const itemsToSet: { key: StorageItemKey; value: unknown }[] = [];
	for (const [key, value] of Object.entries(expected)) {
		if (
			!(key in snapshot) ||
			JSON.stringify(snapshot[key]) !== JSON.stringify(value)
		) {
			itemsToSet.push({ key: `${area}:${key}` as StorageItemKey, value });
		}
	}

	if (itemsToSet.length > 0) await storage.setItems(itemsToSet);
	if (keysToRemove.length > 0) await storage.removeItems(keysToRemove);
}

/** Determines whether a storage snapshot contains any actual pref or rule data. */
export function hasStorageData(snapshot: Record<string, unknown>): boolean {
	return Object.keys(snapshot).some(
		(key) =>
			key !== "version" &&
			key !== "lastSave" &&
			(keyToPrefKeyMap.has(key) ||
				key.startsWith("rule:") ||
				themeKeys.includes(key as keyof ThemePrefs) ||
				advancedKeys.includes(key as keyof AdvancedPrefs) ||
				key === "rules" ||
				key === "ruleList"),
	);
}

/**
 * Retrieves all prefs from WXT Storage, normalising and cleaning up storage if
 * needed.
 */
export async function getPrefs(): Promise<Prefs> {
	const localSnapshot = await storage.snapshot("local");
	const syncSnapshot = await storage.snapshot("sync");
	const localPrefs = normalisePrefs(localSnapshot);

	if (!hasStorageData(localSnapshot) && hasStorageData(syncSnapshot)) {
		const prefs = normalisePrefs(syncSnapshot);
		prefs.syncSettings = true;
		await syncStorage(prefs, localSnapshot, "local");
		return prefs;
	} else if (localPrefs.syncSettings) {
		await syncStorage(localPrefs, localSnapshot, "local");
		await syncStorage(localPrefs, syncSnapshot, "sync");
		return localPrefs;
	} else {
		await syncStorage(localPrefs, localSnapshot, "local");
		return localPrefs;
	}
}

/** Sets a single theme or advanced pref in WXT Storage. */
export async function setPref<K extends PrefKey>(
	key: K,
	value: Prefs[K],
): Promise<void> {
	const normalised = normalisePref(key, value);
	await (
		getPrefItems()[key] as WxtStorageItem<Prefs[K], Record<string, unknown>>
	).setValue(normalised);
	await syncPrefToCloud(key, normalised);
}

/** Resets specified keys (or all prefs and rules) to default values. */
export async function resetPrefs(keys?: PrefKey[]): Promise<void> {
	const items = getPrefItems();

	if (keys) {
		await storage.setItems(
			keys.map((key) => ({ item: items[key], value: defaultPrefs[key] })),
		);
		await syncResetToCloud(keys);
	} else {
		const localSnapshot = await storage.snapshot("local");
		const ruleKeys = Object.keys(localSnapshot)
			.filter((key) => key.startsWith("rule:"))
			.map((key): StorageItemKey => `local:${key}`);
		if (ruleKeys.length > 0) await storage.removeItems(ruleKeys);
		const allKeys = [...themeKeys, ...advancedKeys];
		await storage.setItems(
			allKeys.map((key) => ({
				item: items[key],
				value: defaultPrefs[key],
			})),
		);
		await syncResetToCloud();
	}
}

/** Subscribes to any pref or rule change in storage. */
export function watchPrefs(callback: (prefs: Prefs) => void): () => void {
	const listener = async (
		changes: { [key: string]: Browser.storage.StorageChange },
		areaName: Browser.storage.AreaName,
	) => {
		const isRelevantLocal =
			areaName === "local" &&
			Object.keys(changes).some(
				(key) => keyToPrefKeyMap.has(key) || key.startsWith("rule:"),
			);

		if (isRelevantLocal) {
			const snapshot = await storage.snapshot("local");
			callback(normalisePrefs(snapshot));
		} else if (areaName === "sync") {
			await handleSyncStorageChanges(changes);
		}
	};
	browser.storage?.onChanged?.addListener(listener);
	return () => {
		browser.storage?.onChanged?.removeListener(listener);
	};
}

/** Exports current local storage snapshot as JSON. */
export async function exportPrefs(): Promise<string> {
	const snapshot = await storage.snapshot("local");
	return JSON.stringify(snapshot);
}

/** Imports, normalises, and persists prefs from a JSON string or record. */
export async function importPrefs(
	input: string | Record<string, unknown>,
): Promise<boolean> {
	try {
		const parsed: unknown =
			typeof input === "string" ? JSON.parse(input) : input;
		if (!isRecord(parsed)) return false;

		const prefs = normalisePrefs(parsed);
		const localSnapshot = await storage.snapshot("local");
		await syncStorage(prefs, localSnapshot, "local");

		if (prefs.syncSettings) {
			const syncSnapshot = await storage.snapshot("sync");
			await syncStorage(prefs, syncSnapshot, "sync");
		}
		return true;
	} catch {
		return false;
	}
}

/** Adds a new rule with a generated nanoid and next order number. */
export async function addRule(newRule: NewRule): Promise<void> {
	const snapshot = await storage.snapshot("local");
	let maxOrder = 0;
	for (const [key, value] of Object.entries(snapshot)) {
		if (!key.startsWith("rule:")) continue;
		const rule = normaliseRule(value);
		if (!rule || rule.order <= maxOrder) continue;
		maxOrder = rule.order;
	}
	let id = nanoid();
	while (`rule:${id}` in snapshot) id = nanoid();
	const rule = normaliseRule({ ...newRule, order: maxOrder + 1 });
	if (!rule) return;
	await storage.setItem(`local:rule:${id}`, rule);
	await syncRuleToCloud(id, rule);
}

/** Updates an existing rule or removes it when `rule` is `null`. */
export async function setRule(id: string, rule: Rule | null): Promise<void> {
	const normalised = rule ? normaliseRule(rule, rule.order) : null;
	if (rule === null) {
		await storage.removeItem(`local:rule:${id}`);
		await syncRuleToCloud(id, null);
	} else if (normalised) {
		await storage.setItem(`local:rule:${id}`, normalised);
		await syncRuleToCloud(id, normalised);
	}
}

/** Tests whether a URL matches a regex pattern. */
function testRegex(url: string, test: string): boolean {
	try {
		return new RegExp(`^${test}$`, "i").test(url);
	} catch {
		return false;
	}
}

/** Tests whether a URL matches a wildcard pattern. */
function testWildcard(url: string, test: string): boolean {
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
function testHostname(url: string, test: string): boolean {
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

/** Finds the last matching rule for a URL ordered by `rule.order`. */
export async function getRule(
	url: string = "",
	scheme: Scheme,
	rules: Record<string, Rule>,
): Promise<RuleQueryResult> {
	if (!url) return { url };

	const webExtId = await getWebExtId(url);
	const cleanUrl = url.replace(/\/$/, "");
	let match: RuleQueryResult = { url, webExtId };

	const sortedRules = Object.entries(rules).sort(
		([, first], [, second]) => first.order - second.order,
	);

	for (const [id, rule] of sortedRules) {
		const isSchemeValid = rule.scheme === "both" || rule.scheme === scheme;
		if (!rule.header || !isSchemeValid) continue;

		const isAddonMatch =
			webExtId !== undefined &&
			rule.target === "ADDON_ID" &&
			rule.header === webExtId;

		const cleanHeader = rule.header.replace(/\/$/, "");
		const isUrlMatch =
			rule.target === "URL" &&
			(cleanUrl === cleanHeader ||
				testRegex(cleanUrl, cleanHeader) ||
				testWildcard(cleanUrl, cleanHeader) ||
				testHostname(cleanUrl, cleanHeader));

		if (isAddonMatch || isUrlMatch) match = { id, url, webExtId, rule };
	}

	return match;
}
