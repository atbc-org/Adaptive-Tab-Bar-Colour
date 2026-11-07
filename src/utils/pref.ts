import { nanoid } from "nanoid";

interface NumberOptions {
	min?: number;
	max?: number;
	step?: number;
}

/** Defines a boolean normaliser with a fallback. */
const defineBoolean =
	(fallback: boolean) =>
	(value: unknown): boolean =>
		typeof value === "boolean" ? value : fallback;

/** Defines a numeric normaliser with a fallback, range, and step. */
const defineNumber =
	(fallback: number, { min = -50, max = 50, step = 1 }: NumberOptions = {}) =>
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
	"advanced:minContrast_dark": defineNumber(45, {
		min: 0,
		max: 210,
		step: 5,
	}),
	"advanced:minContrast_light": defineNumber(90, {
		min: 0,
		max: 210,
		step: 5,
	}),
	"advanced:noThemeColour": defineBoolean(true),
	"advanced:overwriteAccentColour": defineBoolean(false),
	"device:sync": defineBoolean(true),
} satisfies { [K in StaticPrefKey]: (value: unknown) => PrefValues[K] };

const staticPrefKeys = Object.keys(prefSchema) as StaticPrefKey[];

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

/** Migrates and normalises a raw storage record into a clean snapshot. */
function normaliseSnapshot(
	raw: Record<string, unknown>,
	includeDevice = true,
): Record<string, unknown> {
	const snapshot: Record<string, unknown> = {};
	for (const key of staticPrefKeys) {
		if (!includeDevice && key.startsWith("device:")) continue;
		const legacy = key.startsWith("device:")
			? undefined
			: raw[key.slice(key.indexOf(":") + 1)];
		const rawVal =
			raw[key] ??
			(typeof legacy === "number" && Math.abs(legacy) < 1
				? legacy * 100
				: legacy);
		snapshot[key] = prefSchema[key](rawVal);
	}
	for (const key of Object.keys(raw).filter(isRuleKey).sort()) {
		const rule = normaliseRule(raw[key]);
		if (rule) snapshot[key] = rule;
	}
	if (isRecord(raw.ruleList)) {
		let order = 1;
		for (const [, item] of Object.entries(raw.ruleList).sort(([a], [b]) =>
			a.localeCompare(b, undefined, { numeric: true }),
		)) {
			if (!isRecord(item)) continue;
			const rule = normaliseRule(
				{ ...item, target: item.target ?? item.headerType },
				order++,
			);
			if (rule) snapshot[`rule:${nanoid()}`] = rule;
		}
	}
	return snapshot;
}

/** Projects a storage record into the grouped `Prefs` model. */
export function normalisePrefs(raw: Record<string, unknown>): Prefs {
	const prefs: Prefs = {
		theme: {} as ThemePrefs,
		rule: {},
		advanced: {} as AdvancedPrefs,
		device: {} as DevicePrefs,
	};
	for (const [key, value] of Object.entries(normaliseSnapshot(raw))) {
		const sep = key.indexOf(":");
		const group = key.slice(0, sep) as keyof Prefs;
		Reflect.set(prefs[group], key.slice(sep + 1), value);
	}
	return prefs;
}

export const defaultPrefs: Readonly<Prefs> = Object.freeze(normalisePrefs({}));

/** Replaces preferences in the specified storage area to match a snapshot. */
async function applySnapshot(
	snapshot: Record<string, unknown>,
	area: "local" | "sync",
): Promise<void> {
	const includeDevice =
		area === "local" && Object.hasOwn(snapshot, "device:sync");
	const current = await storage.snapshot(area);
	const inScope = (key: string) =>
		(includeDevice || !key.startsWith("device:")) && !key.endsWith("$");

	const updates = Object.entries(snapshot)
		.filter(
			([key, val]) =>
				isPrefKey(key) &&
				inScope(key) &&
				JSON.stringify(current[key]) !== JSON.stringify(val),
		)
		.map(([key, value]) => ({ key: `${area}:${key}` as const, value }));

	const removals = Object.keys(current)
		.filter((key) => inScope(key) && !Object.hasOwn(snapshot, key))
		.map((key) => `${area}:${key}` as const);

	if (updates.length) await storage.setItems(updates);
	if (removals.length) await storage.removeItems(removals);
}

/** Checks whether cloud sync is currently enabled on this device. */
export async function isSyncEnabled(): Promise<boolean> {
	return normalisePref(
		"device:sync",
		await storage.getItem("local:device:sync"),
	);
}

/** Reads local preferences and normalises storage. */
export async function getPrefs(): Promise<Prefs> {
	const snapshot = normaliseSnapshot(await storage.snapshot("local"));
	await applySnapshot(snapshot, "local");
	return normalisePrefs(snapshot);
}

/** Updates a single preference in local storage and mirrors to sync if enabled. */
export async function setPref<K extends PrefKey>(
	key: K,
	value: unknown,
): Promise<void> {
	const normalised = normalisePref(key, value);
	const areas: ("local" | "sync")[] =
		!key.startsWith("device:") && (await isSyncEnabled())
			? ["local", "sync"]
			: ["local"];
	for (const area of areas) {
		const itemKey = `${area}:${key}` as const;
		const current = await storage.getItem(itemKey);
		if (
			normalised === undefined &&
			(current !== null ||
				Object.hasOwn(await storage.snapshot(area), key))
		) {
			await storage.removeItem(itemKey);
		} else if (
			normalised !== undefined &&
			JSON.stringify(current) !== JSON.stringify(normalised)
		) {
			await storage.setItem(itemKey, normalised);
		}
	}
}

/** Resets shared preferences, or the explicitly requested items. */
export async function resetPrefs(keys?: PrefKey[]): Promise<void> {
	if (!keys) {
		await importPrefs({});
	} else {
		for (const key of keys) await setPref(key, undefined);
	}
}

/** Subscribes to local preference changes. */
export function watchPrefs(callback: (prefs: Prefs) => void): () => void {
	return addStorageChangeListener(async (changes, area) => {
		if (area !== "local" || !Object.keys(changes).some(isPrefKey)) return;
		callback(normalisePrefs(await storage.snapshot("local")));
	});
}

/** Toggles cloud sync settings and resolves conflicts. */
export async function setSync(
	enabled: boolean,
	choice?: SyncChoice,
): Promise<SyncResult> {
	if (!enabled) {
		await setPref("device:sync", false);
		return "disabled";
	}
	const local = normaliseSnapshot(await storage.snapshot("local"), false);
	const cloudRaw = await storage.snapshot("sync");
	const cloud = normaliseSnapshot(cloudRaw, false);
	const hasCloud = Object.keys(cloudRaw).some(
		(key) => !key.startsWith("device:") && !key.endsWith("$"),
	);
	if (
		hasCloud &&
		JSON.stringify(local) !== JSON.stringify(cloud) &&
		!choice
	) {
		return "conflict";
	} else {
		const source = choice === "cloud" && hasCloud ? cloud : local;
		await applySnapshot(source, "sync");
		await applySnapshot({ ...source, "device:sync": true }, "local");
		return "enabled";
	}
}

/** Initialises preferences on background startup and listens for sync updates. */
export async function initPrefs(): Promise<Prefs> {
	if (await isSyncEnabled()) await setSync(true, "cloud");
	addStorageChangeListener(async (changes, area) => {
		if (area !== "sync" || !(await isSyncEnabled())) return;
		for (const key of Object.keys(changes).filter(isPrefKey)) {
			if (!key.startsWith("device:"))
				await setPref(key, await storage.getItem(`sync:${key}`));
		}
	});
	return getPrefs();
}

/** Exports shared preferences as JSON. */
export async function exportPrefs(): Promise<string> {
	return JSON.stringify(
		normaliseSnapshot(await storage.snapshot("local"), false),
	);
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
	} catch (error) {
		console.error("Failed to import preferences:", error);
		return false;
	}
}

/** Creates a reactive proxy wrapping a `Prefs` object. */
export function createPrefsProxy(
	source: Prefs,
	onUpdate?: (updated: Prefs) => void,
): Prefs {
	const target: Prefs = {
		theme: { ...source.theme },
		rule: { ...source.rule },
		advanced: { ...source.advanced },
		device: { ...source.device },
	};
	const createGroup = <G extends keyof Prefs>(group: G): Prefs[G] =>
		new Proxy(target[group], {
			set(groupTarget, prop, value) {
				if (typeof prop !== "string") return false;
				const key = `${group}:${prop}`;
				if (!isPrefKey(key)) return false;
				const normalised =
					value === null || value === undefined
						? undefined
						: normalisePref(key, value);
				if (normalised === undefined) {
					Reflect.deleteProperty(groupTarget, prop);
				} else {
					Reflect.set(groupTarget, prop, normalised);
				}
				void setPref(key, normalised);
				onUpdate?.({ ...target });
				return true;
			},
			deleteProperty(groupTarget, prop) {
				if (group !== "rule" || typeof prop !== "string") return false;
				Reflect.deleteProperty(groupTarget, prop);
				void setPref(`rule:${prop}`, undefined);
				onUpdate?.({ ...target });
				return true;
			},
		});

	const groups: Prefs = {
		theme: createGroup("theme"),
		rule: createGroup("rule"),
		advanced: createGroup("advanced"),
		device: createGroup("device"),
	};
	return new Proxy(target, {
		get: (_, prop) => Reflect.get(groups, prop),
		set: () => false,
	});
}
