import { nanoid } from "nanoid";

/** Defines a boolean normaliser with a fallback. */
const defineBoolean =
	(fallback: boolean) =>
	(value: unknown): boolean =>
		typeof value === "boolean" ? value : fallback;

/** Defines a numeric normaliser with a fallback, range, and step. */
const defineNumber =
	(fallback: number, min = -50, max = 50, step = 1) =>
	(value: unknown): number => {
		if (typeof value !== "number" || !Number.isFinite(value))
			return fallback;
		const clamped = clamp(min, value, max);
		return Math.round(min + Math.round((clamped - min) / step) * step);
	};

/** Defines a colour normaliser with a fallback. */
const defineColour =
	(fallback: HexColour) =>
	(value: unknown): HexColour => {
		if (typeof value !== "string") return fallback;
		const colour = new Colour(value.trim());
		return colour.isValid() ? colour.toHex() : fallback;
	};

/** Defines a compatibility mode normaliser. */
const defineCompatibilityMode =
	() =>
	(value: unknown): boolean =>
		!supportsThemeAPI() ||
		(typeof value === "boolean" ? value : default_compatibilityMode);

/** The exhaustive schema for static preference keys. */
export const prefSchema = {
	"theme:popup": defineNumber(5),
	"theme:popupBorder": defineNumber(10),
	"theme:sidebar": defineNumber(5),
	"theme:sidebarBorder": defineNumber(10),
	"theme:tabSelected": defineNumber(15),
	"theme:tabSelectedBorder": defineNumber(0),
	"theme:tabbar": defineNumber(0),
	"theme:tabbarBorder": defineNumber(0),
	"theme:toolbar": defineNumber(0),
	"theme:toolbarBorder": defineNumber(0),
	"theme:toolbarField": defineNumber(5),
	"theme:toolbarFieldBorder": defineNumber(5),
	"theme:toolbarFieldOnFocus": defineNumber(5),
	"advanced:accentColour_dark": defineColour(default_accentColour_dark),
	"advanced:accentColour_light": defineColour(default_accentColour_light),
	"advanced:allowDarkLight": defineBoolean(true),
	"advanced:compatibilityMode": defineCompatibilityMode(),
	"advanced:dynamic": defineBoolean(true),
	"advanced:fallbackColour_dark": defineColour(default_fallbackColour_dark),
	"advanced:fallbackColour_light": defineColour(default_fallbackColour_light),
	"advanced:homeBackground_dark": defineColour(default_homeBackground_dark),
	"advanced:homeBackground_light": defineColour(default_homeBackground_light),
	"advanced:minContrast_dark": defineNumber(45, 0, 210, 5),
	"advanced:minContrast_light": defineNumber(90, 0, 210, 5),
	"advanced:noThemeColour": defineBoolean(true),
	"advanced:overwriteAccentColour": defineBoolean(false),
	"device:sync": defineBoolean(true),
} satisfies { [K in StaticPrefKey]: (value: unknown) => PrefValues[K] };

export const staticPrefKeys = Object.keys(prefSchema) as StaticPrefKey[];

export const defaultPrefs: Readonly<Prefs> = Object.freeze(normalisePrefs({}));

/** Checks if a string is a valid rule storage key. */
export function isRuleKey(key: string): key is `rule:${string}` {
	return /^rule:[A-Za-z0-9_-]+$/.test(key);
}

/** Checks if a string is a valid preference key. */
export function isPrefKey(key: string): key is PrefKey {
	return Object.hasOwn(prefSchema, key) || isRuleKey(key);
}

/** Normalises a single preference value by key. */
export function normalisePref<K extends StaticPrefKey>(
	key: K,
	value: unknown,
): PrefValues[K];
export function normalisePref<K extends PrefKey>(
	key: K,
	value: unknown,
): PrefValues[K] | undefined;
export function normalisePref(key: PrefKey, value: unknown): unknown {
	return isRuleKey(key) ? normaliseRule(value) : prefSchema[key](value);
}

/** Legacy formats are converted before current-schema normalisation. */
export function migratePrefs(
	raw: Record<string, unknown>,
): Record<string, unknown> {
	const result = { ...raw };
	for (const key of staticPrefKeys) {
		if (key.startsWith("device:")) continue;
		const name = key.slice(key.indexOf(":") + 1);
		if (Object.hasOwn(result, key) || !Object.hasOwn(raw, name)) continue;
		const value = raw[name];
		result[key] =
			typeof value === "number" && value > -1 && value < 1
				? value * 100
				: value;
		delete result[name];
	}
	delete result.version;
	delete result.lastSave;
	const legacy = isRecord(raw.ruleList) ? raw.ruleList : {};
	delete result.ruleList;
	let order = 1;
	for (const [, value] of Object.entries(legacy).sort(([a], [b]) =>
		a.localeCompare(b, undefined, { numeric: true }),
	)) {
		if (!isRecord(value)) continue;
		let key: `rule:${string}` = `rule:${nanoid()}`;
		while (Object.hasOwn(result, key)) key = `rule:${nanoid()}`;
		result[key] = {
			...value,
			target: value.target ?? value.headerType,
			order: order++,
		};
	}
	return result;
}

/** Normalises a raw snapshot into a clean storage record. */
export function normaliseSnapshot(
	raw: Record<string, unknown>,
	includeDevice = true,
): Record<string, unknown> {
	const migrated = migratePrefs(raw);
	const result: Record<string, unknown> = {};
	const keys = [
		...staticPrefKeys.filter((key) => key.startsWith("theme:")),
		...Object.keys(migrated).filter(isRuleKey).sort(),
		...staticPrefKeys.filter(
			(key) =>
				!key.startsWith("theme:") &&
				(includeDevice || !key.startsWith("device:")),
		),
	];
	for (const key of keys) {
		const value = normalisePref(key, migrated[key]);
		if (value !== undefined) result[key] = value;
	}
	return result;
}

/** Projects a storage snapshot into the UI/theme `Prefs` view model. */
export function normalisePrefs(raw: Record<string, unknown>): Prefs {
	const snapshot = normaliseSnapshot(raw);
	const rules: Record<string, Rule> = {};
	const prefs: Record<string, unknown> = { rules };
	for (const [key, value] of Object.entries(snapshot)) {
		if (isRuleKey(key)) rules[key.slice(5)] = value as Rule;
		else prefs[key.slice(key.indexOf(":") + 1)] = value;
	}
	return prefs as unknown as Prefs;
}

/** Reads local preferences and normalises storage. */
export async function getPrefs(): Promise<Prefs> {
	const snapshot = normaliseSnapshot(await storage.snapshot("local"));
	await applySnapshot(snapshot, "local");
	return normalisePrefs(snapshot);
}

/** Writes a single normalised preference to the given storage area. */
export async function writePrefValue(
	key: PrefKey,
	input: unknown,
	area: "local" | "sync",
): Promise<void> {
	if (area === "sync" && key.startsWith("device:")) return;
	const value = normalisePref(key, input);
	const current = await storage.getItem<unknown>(`${area}:${key}`);
	if (value === undefined) {
		if (
			current !== null ||
			Object.hasOwn(await storage.snapshot(area), key)
		)
			await storage.removeItem(`${area}:${key}`);
	} else if (JSON.stringify(current) !== JSON.stringify(value)) {
		await storage.setItem(`${area}:${key}`, value);
	}
}

/** Updates a single preference in local storage and mirrors to sync if enabled. */
export async function setPref<K extends PrefKey>(
	key: K,
	value: PrefValues[K] | undefined,
): Promise<void> {
	await writePrefValue(key, value, "local");
	if (!key.startsWith("device:") && (await isSyncEnabled()))
		await writePrefValue(key, value, "sync");
}

/** Subscribes to local preference changes. */
export function watchPrefs(callback: (prefs: Prefs) => void): () => void {
	return addStorageChangeListener(async (changes, area) => {
		if (area !== "local" || !Object.keys(changes).some(isPrefKey)) return;
		callback(normalisePrefs(await storage.snapshot("local")));
	});
}

/** Resets shared preferences, or the explicitly requested items. */
export async function resetPrefs(keys?: PrefKey[]): Promise<void> {
	if (keys) {
		for (const key of keys) await setPref(key, undefined);
		return;
	}
	await importPrefs({});
}

/** Exports shared preferences as JSON. */
export async function exportPrefs(): Promise<string> {
	const snapshot = normaliseSnapshot(await storage.snapshot("local"), false);
	return JSON.stringify(snapshot);
}

/** Imports and replaces all shared preferences from a JSON string or record. */
export async function importPrefs(
	input: string | Record<string, unknown>,
): Promise<boolean> {
	try {
		const parsed: unknown =
			typeof input === "string" ? JSON.parse(input) : input;
		if (!isRecord(parsed)) return false;
		const snapshot = normaliseSnapshot(parsed, false);
		await applySnapshot(snapshot, "local");
		if (await isSyncEnabled()) await applySnapshot(snapshot, "sync");
		return true;
	} catch {
		return false;
	}
}
