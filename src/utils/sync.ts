/** Checks whether cloud sync is currently enabled on this device. */
export async function isSyncEnabled(): Promise<boolean> {
	return normalisePref(
		"device:sync",
		await storage.getItem("local:device:sync"),
	);
}

/** Initialises preferences on background startup and listens for sync updates. */
export async function initPrefs(): Promise<Prefs> {
	const local = await storage.snapshot("local");
	const enabled = normalisePref("device:sync", local["device:sync"]);
	if (enabled) {
		const cloud = await storage.snapshot("sync");
		const bootstrap =
			!Object.hasOwn(local, "device:sync") && !hasSharedPrefs(cloud);
		const source = normaliseSnapshot(bootstrap ? local : cloud, false);
		await applySnapshot(source, "sync");
		await applySnapshot({ ...source, "device:sync": true }, "local");
	} else {
		await applySnapshot(normaliseSnapshot(local), "local");
	}

	addStorageChangeListener(async (changes, area) => {
		if (area !== "sync" || !(await isSyncEnabled())) return;
		for (const key of Object.keys(changes).filter(isPrefKey)) {
			if (key.startsWith("device:")) continue;
			const raw = await storage.getItem<unknown>(`sync:${key}`);
			await writePrefValue(key, raw, "sync");
			await writePrefValue(key, raw, "local");
		}
	});

	return getPrefs();
}

/** Toggles cloud sync settings and resolves conflicts. */
export async function setSync(
	enabled: boolean,
	choice?: SyncChoice,
): Promise<SyncResult> {
	if (!enabled) {
		await writePrefValue("device:sync", false, "local");
		return "disabled";
	}
	const local = normaliseSnapshot(await storage.snapshot("local"), false);
	const cloudRaw = await storage.snapshot("sync");
	const cloud = normaliseSnapshot(cloudRaw, false);
	const hasCloud = hasSharedPrefs(cloudRaw);
	if (hasCloud && JSON.stringify(local) !== JSON.stringify(cloud) && !choice)
		return "conflict";
	const source = choice === "cloud" && hasCloud ? cloud : local;
	await applySnapshot(source, "sync");
	await applySnapshot({ ...source, "device:sync": true }, "local");
	return "enabled";
}

/** Replaces preferences in the specified storage area to match a snapshot. */
export async function applySnapshot(
	snapshot: Record<string, unknown>,
	area: "local" | "sync",
): Promise<void> {
	const includeDevice =
		area === "local" && Object.hasOwn(snapshot, "device:sync");
	const current = await storage.snapshot(area);
	const updates = Object.entries(snapshot)
		.filter(
			([key, value]) =>
				isPrefKey(key) &&
				(includeDevice || !key.startsWith("device:")) &&
				JSON.stringify(current[key]) !== JSON.stringify(value),
		)
		.map(([key, value]) => ({ key: `${area}:${key}` as const, value }));
	const removals = Object.keys(current)
		.filter(
			(key) =>
				(includeDevice || !key.startsWith("device:")) &&
				!key.endsWith("$") &&
				!Object.hasOwn(snapshot, key),
		)
		.map((key) => `${area}:${key}` as const);
	if (updates.length) await storage.setItems(updates);
	if (removals.length) await storage.removeItems(removals);
}

/** Checks whether raw storage data contains shared preferences. */
function hasSharedPrefs(raw: Record<string, unknown>): boolean {
	return Object.keys(migratePrefs(raw)).some(
		(key) => isPrefKey(key) && !key.startsWith("device:"),
	);
}
