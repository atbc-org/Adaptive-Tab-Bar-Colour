/** Checks whether two `Prefs` objects have identical syncable contents. */
export function areSyncedPrefsEqual(first: Prefs, second: Prefs): boolean {
	for (const prefKey of themeKeys) {
		if (first[prefKey] !== second[prefKey]) return false;
	}
	for (const prefKey of advancedKeys) {
		if (prefKey === "syncSettings") continue;
		if (first[prefKey] !== second[prefKey]) return false;
	}

	const firstRuleEntries = Object.entries(first.rules);
	const secondRuleEntries = Object.entries(second.rules);
	if (firstRuleEntries.length !== secondRuleEntries.length) return false;

	for (const [id, rule] of firstRuleEntries) {
		const secondRule = second.rules[id];
		if (!secondRule) return false;
		if (JSON.stringify(rule) !== JSON.stringify(secondRule)) return false;
	}

	return true;
}

/** Toggles cloud sync settings and handles conflict resolution. */
export async function setSyncSettings(
	enabled: boolean,
	choice?: SyncChoice,
): Promise<SyncResult> {
	const localSnapshot = await storage.snapshot("local");
	const localPrefs = normalisePrefs(localSnapshot);
	const syncSnapshot = await storage.snapshot("sync");
	const cloudPrefs = normalisePrefs(syncSnapshot);
	const hasSync = hasStorageData(syncSnapshot);

	if (!enabled) {
		await setPref("syncSettings", false);
		return "disabled";
	} else if (!hasSync) {
		await setPref("syncSettings", true);
		await syncStorage(localPrefs, syncSnapshot, "sync");
		return "enabled";
	} else if (areSyncedPrefsEqual(localPrefs, cloudPrefs)) {
		await setPref("syncSettings", true);
		return "enabled";
	} else if (!choice) {
		return "conflict";
	} else if (choice === "cloud") {
		cloudPrefs.syncSettings = true;
		await syncStorage(cloudPrefs, localSnapshot, "local");
		return "enabled";
	} else {
		localPrefs.syncSettings = true;
		await setPref("syncSettings", true);
		await syncStorage(localPrefs, syncSnapshot, "sync");
		return "enabled";
	}
}

/** Synchronises a single pref item to sync storage if sync is active. */
export async function syncPrefToCloud<
	K extends keyof ThemePrefs | keyof AdvancedPrefs,
>(key: K, value: Prefs[K]): Promise<void> {
	if (key === "syncSettings") return;
	const syncSettings = await isSyncSettingsEnabled();
	if (!syncSettings) return;

	const prefix = themeKeys.includes(key as keyof ThemePrefs)
		? "theme"
		: "advanced";
	await storage.setItem(`sync:${prefix}:${key}` as StorageItemKey, value);
}

/** Synchronises reset preferences to sync storage if sync is active. */
export async function syncResetToCloud(
	keys?: (keyof ThemePrefs | keyof AdvancedPrefs)[],
): Promise<void> {
	const syncSettings = await isSyncSettingsEnabled();
	if (!syncSettings) return;

	if (keys) {
		const syncItemsToSet: { key: StorageItemKey; value: unknown }[] = [];
		for (const key of keys) {
			if (key === "syncSettings") continue;
			const prefix = themeKeys.includes(key as keyof ThemePrefs)
				? "theme"
				: "advanced";
			syncItemsToSet.push({
				key: `sync:${prefix}:${key}` as StorageItemKey,
				value: defaultPrefs[key],
			});
		}
		if (syncItemsToSet.length > 0) await storage.setItems(syncItemsToSet);
	} else {
		const syncSnapshot = await storage.snapshot("sync");
		const syncRuleKeys = Object.keys(syncSnapshot)
			.filter((key) => key.startsWith("rule:"))
			.map((key): StorageItemKey => `sync:${key}`);
		if (syncRuleKeys.length > 0) await storage.removeItems(syncRuleKeys);
		const syncPrefsToSet = [...themeKeys, ...advancedKeys]
			.filter((key) => key !== "syncSettings")
			.map((key) => {
				const prefix = themeKeys.includes(key as keyof ThemePrefs)
					? "theme"
					: "advanced";
				return {
					key: `sync:${prefix}:${key}` as StorageItemKey,
					value: defaultPrefs[key],
				};
			});
		await storage.setItems(syncPrefsToSet);
	}
}

/** Synchronises rule update to sync storage if sync is active. */
export async function syncRuleToCloud(
	id: string,
	rule: Rule | null,
): Promise<void> {
	const syncSettings = await isSyncSettingsEnabled();
	if (!syncSettings) return;

	if (rule === null) {
		await storage.removeItem(`sync:rule:${id}`);
	} else {
		await storage.setItem(`sync:rule:${id}`, rule);
	}
}

/** Handles incoming sync storage changes and applies them to local storage. */
export async function handleSyncStorageChanges(changes: {
	[key: string]: Browser.storage.StorageChange;
}): Promise<void> {
	const syncSettings = await isSyncSettingsEnabled();
	if (!syncSettings) return;

	const relevant = Object.keys(changes).some(
		(key) =>
			keyToPrefKeyMap.has(key as ThemeStorageKey | AdvancedStorageKey) ||
			key.startsWith("rule:"),
	);
	if (!relevant) return;

	const syncSnapshot = await storage.snapshot("sync");
	const syncedPrefs = normalisePrefs(syncSnapshot);
	syncedPrefs.syncSettings = true;
	const localSnapshot = await storage.snapshot("local");
	await syncStorage(syncedPrefs, localSnapshot, "local");
}

/** Handles incoming local storage changes and mirrors them to sync storage. */
export async function handleLocalStorageChanges(changes: {
	[key: string]: Browser.storage.StorageChange;
}): Promise<void> {
	const syncSettings = await isSyncSettingsEnabled();
	if (!syncSettings) return;

	for (const [key, change] of Object.entries(changes)) {
		const isPref =
			keyToPrefKeyMap.has(key as ThemeStorageKey | AdvancedStorageKey) &&
			key !== "advanced:syncSettings";
		const isRule = key.startsWith("rule:");
		const isSyncable = isPref || isRule;
		if (!isSyncable) continue;

		if (change.newValue !== undefined) {
			await storage.setItem(
				`sync:${key}` as StorageItemKey,
				change.newValue,
			);
		} else {
			await storage.removeItem(`sync:${key}` as StorageItemKey);
		}
	}
}
