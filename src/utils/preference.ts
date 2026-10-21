/** Defines a local storage item with its default value. */
function definePreferenceItem<Key extends PreferenceKey>(key: Key) {
	return storage.defineItem<PreferenceContent[Key]>(`local:${key}`, {
		fallback: structuredClone(defaultPreferenceContent[key]),
	});
}

/** Existing keys are retained so installed preferences need no data copy. */
const preferenceItems = Object.fromEntries(
	Object.keys(defaultPreferenceContent).map((key) => [
		key,
		definePreferenceItem(key as PreferenceKey),
	]),
) as PreferenceStorageItems;

const syncBaselineItem =
	storage.defineItem<Record<string, unknown>>("local:syncBaseline");

/** Declares rule membership and lets key-specific watchers discover new rules. */
const cloudRuleKeysItem = storage.defineItem<string[]>("sync:ruleListKeys");

const rulePrefix = "ruleList:";

/** Serialises values with sorted object keys for stable comparisons. */
function serialise(value: unknown): string {
	return JSON.stringify(value, (_key, item: unknown) => {
		if (!item || typeof item !== "object" || Array.isArray(item))
			return item;
		return Object.fromEntries(
			Object.entries(item).sort(([first], [second]) =>
				first.localeCompare(second),
			),
		);
	});
}

/** Stores each rule under its own cloud key to respect item size limits. */
function flatten(settings: Record<string, unknown>): Record<string, unknown> {
	const { ruleList, ...values } = settings;
	for (const [id, rule] of Object.entries((ruleList ?? {}) as RuleList))
		values[rulePrefix + id] = rule;
	return values;
}

/** Manages local preferences, site rules, and cloud synchronisation. */
export class Preference {
	/** The content of the preference. */
	#content: PreferenceContent = structuredClone(defaultPreferenceContent);

	/** State for storage writes and lifecycle. */
	#state: PreferenceState = {
		isInitialised: false,
		lastWrite: 0,
		isDisposed: false,
		pendingUpdates: {},
	};

	#writePromise: Promise<boolean> = Promise.resolve(true);

	#inFlightUpdates: Partial<PreferenceContent> = {};

	/** The listeners for preference changes. */
	#onChangeListeners = new Set<() => void>();

	/** Listener for storage changes. */
	#unwatchStorage?: () => void;

	#syncQueue: Promise<unknown> = Promise.resolve();

	#syncedKeys = new Set(
		Object.keys(defaultPreferenceContent).filter(
			(key) => key !== "lastSave" && key !== "syncSettings",
		),
	);

	#syncStarted = false;

	#syncScheduled = false;

	#syncUnwatch: Array<() => void> = [];

	#ruleWatchers = new Map<string, () => void>();

	/** Validates cloud settings without changing a live preference instance. */
	static normaliseSyncedSettings(
		content: Record<string, unknown>,
	): Record<string, unknown> {
		const preference = new Preference();
		const { result } = preference.#normalise(structuredClone(content));
		for (const [key, value] of Object.entries(result))
			preference.#set(key as PreferenceKey, value);
		const {
			lastSave: _lastSave,
			syncSettings: _syncSettings,
			...settings
		} = preference.#content;
		return settings;
	}

	// Lifecycle.

	/** Loads and migrates local preferences, then watches for saved changes. */
	async initialise(): Promise<void> {
		this.#state.isDisposed = false;
		this.#unwatchStorage?.();
		const storedContent = await storage.snapshot("local");
		const { result, removedKeys } = this.#normalise(storedContent);
		await storage.removeItems(
			removedKeys.map((key) => `local:${key}` as const),
		);
		for (const [key, value] of Object.entries(result))
			this.#set(key as PreferenceKey, value);
		if (!supportsThemeAPI()) this.#set("compatibilityMode", true);
		const updates = Object.fromEntries(
			Object.entries(this.#content).filter(
				([key, value]) =>
					key !== "syncSettings" &&
					JSON.stringify(value) !==
						JSON.stringify(storedContent[key]),
			),
		);
		if (Object.keys(updates).length) await this.#save(updates);

		this.#unwatchStorage = preferenceItems.lastSave.watch(() => {
			void this.#reloadStoredPreferences().catch((error: unknown) => {
				console.error("Failed to reload preferences:", error);
			});
		});
		await this.#reloadStoredPreferences();
		this.#state.isInitialised = true;
	}

	/** Starts cloud synchronisation in the background instance only. */
	async initialiseSync(): Promise<void> {
		if (this.#syncStarted) return;
		this.#syncStarted = true;
		/** Schedules reconciliation when a watched setting changes. */
		const onChange = () => this.#scheduleReconcile();
		this.#syncUnwatch.push(
			...Object.values(preferenceItems)
				.filter((item) => item !== preferenceItems.lastSave)
				.map((item) => item.watch(onChange)),
			...[...this.#syncedKeys]
				.filter((key) => key !== "ruleList")
				.map((key) => storage.watch(`sync:${key}`, onChange)),
			cloudRuleKeysItem.watch((keys) => {
				if (Array.isArray(keys)) this.#watchRuleKeys(keys);
				onChange();
			}),
		);
		const local = await storage.snapshot("local");
		if (typeof local.syncSettings !== "boolean")
			await preferenceItems.syncSettings.setValue(true);
		await this.#enqueue(() => this.#reconcile()).catch(() => {});
	}

	/** Disposes storage listeners and pending writes. */
	dispose(): void {
		this.#state.isDisposed = true;
		if (this.#state.writeTimeout !== undefined)
			clearTimeout(this.#state.writeTimeout);
		this.#unwatchStorage?.();
		this.#unwatchStorage = undefined;
		for (const unwatch of this.#syncUnwatch) unwatch();
		this.#syncUnwatch = [];
		for (const unwatch of this.#ruleWatchers.values()) unwatch();
		this.#ruleWatchers.clear();
		this.#syncStarted = false;
	}

	// Preference access and change notifications.

	/** Gets preference instance ready state. */
	get isReady(): boolean {
		return this.#state.isInitialised && !this.#state.isDisposed;
	}

	/** Reads the current value; WXT watchers keep this view up to date. */
	get<Key extends PreferenceKey>(key: Key): PreferenceContent[Key] {
		return this.#content[key];
	}

	/** Validates an edit and queues its WXT storage write. */
	set<Key extends EditablePreferenceKey>(
		key: Key,
		value: PreferenceContent[Key],
	): void {
		this.#set(key, value);
		void this.#save({ [key]: this.#content[key] });
	}

	/** Gets the timestamp of the last update. */
	getLastSave(): number {
		return this.#content.lastSave;
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

	// Persistence, backups, and cloud controls.

	/** Persists pending writes before another process reads preferences. */
	async flush(): Promise<boolean> {
		if (this.#state.isDisposed) return false;
		if (this.#state.writeTimeout !== undefined) {
			clearTimeout(this.#state.writeTimeout);
			this.#state.writeTimeout = undefined;
		}
		this.#writePromise = this.#writePromise.then(async () => {
			if (this.#state.isDisposed) return false;
			const updates = this.#state.pendingUpdates;
			this.#state.pendingUpdates = {};
			if (Object.keys(updates).length === 0) return true;
			this.#inFlightUpdates = updates;
			let success = false;
			try {
				const storedLastSave =
					await storage.getItem<number>("local:lastSave");
				const lastSave = Math.max(
					Date.now(),
					this.#content.lastSave + 1,
					typeof storedLastSave === "number" ? storedLastSave + 1 : 0,
				);
				await storage.setItems(
					Object.entries({ ...updates, lastSave }).map(
						([key, value]) => ({ key: `local:${key}`, value }),
					),
				);
				this.#content.lastSave = Math.max(
					this.#content.lastSave,
					lastSave,
				);
				success = true;
			} catch (error) {
				console.error("Failed to save preferences:", error);
				this.#state.pendingUpdates = {
					...updates,
					...this.#state.pendingUpdates,
				};
			} finally {
				this.#inFlightUpdates = {};
				this.#state.lastWrite = Date.now();
			}
			if (success) this.syncUI();
			return success;
		});
		return this.#writePromise;
	}

	/** Resets preferences to default values. */
	async reset(keys?: string[]): Promise<void> {
		if (keys) {
			for (const key of keys)
				if (Object.hasOwn(defaultPreferenceContent, key)) {
					const prefKey = key as PreferenceKey;
					this.#set(prefKey, defaultPreferenceContent[prefKey]);
				}
		} else
			this.#content = {
				...defaultPreferenceContent,
				syncSettings: this.get("syncSettings"),
			};
		await this.#save({ ...this.#content });
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
				const prefKey = key as PreferenceKey;
				if (prefKey !== "syncSettings")
					this.#set(prefKey, parsedPref[prefKey]);
			}
			await this.#save({ ...this.#content });
			return true;
		} catch {
			return false;
		}
	}

	/** Resolves an explicit sync toggle, requesting a choice only for conflicts. */
	async setSyncEnabled(
		enabled: boolean,
		choice?: SettingsSyncChoice,
	): Promise<SettingsSyncResult> {
		try {
			return await this.#enqueue(async () => {
				const local = await storage.snapshot("local");
				if (!enabled) {
					await storage.setItems([
						{ item: preferenceItems.syncSettings, value: false },
						{
							item: preferenceItems.lastSave,
							value: Math.max(
								Date.now(),
								Number(local.lastSave || 0) + 1,
							),
						},
					]);
					return { status: "disabled" };
				}
				let source = choice;
				while (true) {
					const current = await storage.snapshot("local");
					const localSettings =
						Preference.normaliseSyncedSettings(current);
					const cloud = await this.#readCloud();
					if (
						cloud &&
						serialise(cloud) !== serialise(localSettings) &&
						!source
					)
						return { status: "conflict" };
					source ??= "local";
					const settings =
						source === "cloud" && cloud ? cloud : localSettings;
					if (!(await this.#writeCloud(settings, cloud))) continue;
					if (!(await this.#writeLocal(settings, current, true)))
						continue;
					return { status: "enabled" };
				}
			});
		} catch {
			return { status: "error" };
		}
	}

	// Site rules.

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

	// Local persistence.

	/** Saves preferences locally with a debounce. */
	async #save(updates: Partial<PreferenceContent> = {}): Promise<void> {
		if (this.#state.isDisposed) return;
		const { syncSettings: _syncSettings, ...localUpdates } = updates;
		this.#state.pendingUpdates = {
			...this.#state.pendingUpdates,
			...localUpdates,
		};
		this.syncUI();
		if (this.#state.writeTimeout !== undefined)
			clearTimeout(this.#state.writeTimeout);
		this.#state.writeTimeout = setTimeout(
			() => void this.flush(),
			Math.max(0, 50 + this.#state.lastWrite - Date.now()),
		);
	}

	/** Refreshes saved values without overwriting pending local edits. */
	async #reloadStoredPreferences(): Promise<void> {
		const entries = await storage.getItems(Object.values(preferenceItems));
		const stored = Object.fromEntries(
			entries.map(({ key, value }) => [
				key.slice("local:".length),
				value,
			]),
		);
		if (this.#state.isDisposed || !this.#isTimeStamp(stored.lastSave))
			return;
		for (const [key, value] of Object.entries(stored)) {
			if (
				!(key in this.#content) ||
				key in this.#state.pendingUpdates ||
				key in this.#inFlightUpdates
			)
				continue;
			this.#set(key as PreferenceKey, value);
		}
		this.syncUI();
	}

	// Validation and migration.

	/** Applies the stored type and numeric constraints to a preference. */
	#set(key: PreferenceKey, value: unknown): void {
		if (!Object.hasOwn(defaultPreferenceContent, key)) {
			console.warn("Unknown preference key:", key);
			return;
		}
		if (key === "version") return;
		if (key === "lastSave") {
			this.#content.lastSave = value as number;
			return;
		}
		if (key === "ruleList") {
			this.#content.ruleList = this.#normaliseRuleList(value);
			return;
		}
		const fallback = defaultPreferenceContent[key];
		let normalised: PreferenceContent[typeof key];
		if (typeof fallback === "number") {
			const contrast =
				key === "minContrast_light" || key === "minContrast_dark";
			normalised =
				typeof value === "number" && !Number.isNaN(value)
					? this.#normaliseNumber(
							value,
							contrast
								? { min: 0, max: 210, step: 5 }
								: { min: -50, max: 50, step: 1 },
						)
					: fallback;
		} else {
			normalised =
				typeof value === typeof fallback
					? (value as PreferenceContent[typeof key])
					: fallback;
		}
		Object.assign(this.#content, { [key]: normalised });
	}

	/** Normalises and migrates preferences from older versions. */
	#normalise(
		content: Record<string, unknown>,
	): PreferenceNormalisationResult {
		let merged: Record<string, unknown> = {
			...defaultPreferenceContent,
			...content,
		};
		const removedKeys: string[] = [];

		this.#migrate(content, [2, 2, 3], () => {
			merged = { ...content, ...defaultPreferenceContent };
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
			if (!Object.hasOwn(defaultPreferenceContent, key)) {
				delete merged[key];
				if (key !== "syncBaseline") removedKeys.push(key);
			}
		}

		return {
			result: { ...merged, version } as PreferenceContent,
			removedKeys,
		};
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

	/** Normalises a numeric preference within constraints. */
	#normaliseNumber(
		num: number,
		{ min, max, step }: NumberConstraints,
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
					rule.value = new Colour(rule.value).toHex();
				}
				return { id, rule };
			})
			.sort((first, second) => first.id - second.id)
			.reduce(
				(list, { rule }, i) => ({ ...list, [i + 1]: rule as Rule }),
				{} as RuleList,
			);
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

	// Cloud synchronisation.

	/** Coalesces storage events into one queued sync operation. */
	#scheduleReconcile(): void {
		if (this.#syncScheduled) return;
		this.#syncScheduled = true;
		queueMicrotask(() => {
			this.#syncScheduled = false;
			void this.#enqueue(() => this.#reconcile()).catch(() => {});
		});
	}

	/** Serialises cloud operations and keeps the queue usable after failures. */
	#enqueue<T>(operation: () => Promise<T>): Promise<T> {
		const next = this.#syncQueue.then(operation);
		this.#syncQueue = next.catch((error: unknown) => {
			console.error("Settings sync failed:", error);
		});
		return next;
	}

	/** Merges local edits with cloud settings, retrying concurrent changes. */
	async #reconcile(): Promise<void> {
		while (true) {
			const local = await storage.snapshot("local");
			if (local.syncSettings === false) return;
			const localSettings = Preference.normaliseSyncedSettings(local);
			const cloud = await this.#readCloud();
			let settings = cloud ?? localSettings;
			if (
				cloud &&
				local.syncBaseline &&
				typeof local.syncBaseline === "object" &&
				!Array.isArray(local.syncBaseline)
			) {
				const baseline = Preference.normaliseSyncedSettings(
					local.syncBaseline as Record<string, unknown>,
				);
				settings = { ...cloud };
				for (const [key, value] of Object.entries(localSettings))
					if (serialise(value) !== serialise(baseline[key]))
						settings[key] = value;
			}
			if (!(await this.#writeCloud(settings, cloud))) continue;
			if (
				serialise(localSettings) !== serialise(settings) ||
				serialise(local.syncBaseline) !== serialise(settings) ||
				local.syncSettings === undefined
			) {
				if (!(await this.#writeLocal(settings, local, true))) continue;
			}
			return;
		}
	}

	/** Watches newly discovered cloud rules for later updates. */
	#watchRuleKeys(keys: unknown[]): void {
		for (const key of keys) {
			if (
				typeof key !== "string" ||
				!/^ruleList:[1-9]\d*$/.test(key) ||
				this.#ruleWatchers.has(key)
			)
				continue;
			this.#ruleWatchers.set(
				key,
				storage.watch(`sync:${key}`, () => this.#scheduleReconcile()),
			);
		}
	}

	/** Keeps rule watchers aligned with stored and declared cloud keys. */
	#watchCloudRules(values: Record<string, unknown>): void {
		const declared = Array.isArray(values.ruleListKeys)
			? values.ruleListKeys
			: [];
		const keys = new Set([...Object.keys(values), ...declared]);
		this.#watchRuleKeys([...keys]);
		for (const [key, unwatch] of this.#ruleWatchers)
			if (!keys.has(key)) {
				unwatch();
				this.#ruleWatchers.delete(key);
			}
	}

	/** Checks whether a cloud key belongs to a synced preference or rule. */
	#isSetting(key: string): boolean {
		return (
			(this.#syncedKeys.has(key) && key !== "ruleList") ||
			/^ruleList:[1-9]\d*$/.test(key)
		);
	}

	/** Validates cloud data and rejects incomplete rule deliveries. */
	#parseCloud(
		values: Record<string, unknown>,
	): Record<string, unknown> | null {
		const keys = Object.keys(values).filter((key) => this.#isSetting(key));
		const declared: unknown = values.ruleListKeys;
		if (
			keys.length === 0 &&
			(declared === undefined ||
				(Array.isArray(declared) && declared.length === 0))
		)
			return null;
		if (declared !== undefined) {
			if (
				!Array.isArray(declared) ||
				!declared.every(
					(key: unknown) =>
						typeof key === "string" &&
						/^ruleList:[1-9]\d*$/.test(key) &&
						key in values,
				)
			)
				throw new Error("Cloud rules are incomplete or invalid");
			values = Object.fromEntries(
				Object.entries(values).filter(
					([key]) =>
						!key.startsWith(rulePrefix) || declared.includes(key),
				),
			);
		}
		if (
			!Array.isArray(values.version) ||
			!values.version.every(Number.isFinite)
		)
			throw new Error("Cloud settings are incomplete or invalid");
		return this.#expand(values);
	}

	/** Rebuilds and normalises preferences from individual cloud keys. */
	#expand(values: Record<string, unknown>): Record<string, unknown> {
		const settings: Record<string, unknown> = {};
		const rules: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(values)) {
			if (key.startsWith(rulePrefix))
				rules[key.slice(rulePrefix.length)] = value;
			else if (this.#syncedKeys.has(key)) settings[key] = value;
		}
		return Preference.normaliseSyncedSettings({
			...settings,
			ruleList: rules,
		});
	}

	/** Reads cloud settings and refreshes their rule watchers. */
	async #readCloud(): Promise<Record<string, unknown> | null> {
		const values = await storage.snapshot("sync");
		this.#watchCloudRules(values);
		return this.#parseCloud(values);
	}

	/** Writes cloud changes if the expected settings are still current. */
	async #writeCloud(
		settings: Record<string, unknown>,
		expected: Record<string, unknown> | null,
	): Promise<boolean> {
		const values = flatten(settings);
		const existing = await storage.snapshot("sync");
		this.#watchCloudRules(existing);
		if (serialise(this.#parseCloud(existing)) !== serialise(expected))
			return false;
		const updates = Object.fromEntries(
			Object.entries(values).filter(
				([key, value]) => serialise(existing[key]) !== serialise(value),
			),
		);
		const ruleKeys = Object.keys(values).filter((key) =>
			key.startsWith(rulePrefix),
		);
		if (serialise(existing.ruleListKeys) !== serialise(ruleKeys))
			updates.ruleListKeys = ruleKeys;
		if (Object.keys(updates).length) {
			// Snapshot restore preserves null rule placeholders; setItem treats null as removal.
			await storage.restoreSnapshot("sync", updates);
		}
		const previousRuleKeys = Array.isArray(existing.ruleListKeys)
			? existing.ruleListKeys.filter(
					(key): key is string => typeof key === "string",
				)
			: Object.keys(existing).filter((key) => key.startsWith(rulePrefix));
		const obsolete = previousRuleKeys.filter(
			(key) => this.#isSetting(key) && !(key in values),
		);
		if (obsolete.length)
			await storage.removeItems(
				obsolete.map((key) => `sync:${key}` as const),
			);
		return true;
	}

	/** Applies synced settings locally if no newer local edits exist. */
	async #writeLocal(
		settings: Record<string, unknown>,
		expected: Record<string, unknown>,
		enabled?: boolean,
	): Promise<boolean> {
		const local = await storage.snapshot("local");
		if (
			serialise(Preference.normaliseSyncedSettings(local)) !==
				serialise(Preference.normaliseSyncedSettings(expected)) ||
			local.syncSettings !== expected.syncSettings
		)
			return false;
		const lastSave = Math.max(
			Date.now(),
			typeof local.lastSave === "number" ? local.lastSave + 1 : 0,
		);
		await storage.setItems([
			...Object.entries(settings).map(([key, value]) => ({
				key: `local:${key}` as const,
				value,
			})),
			...(enabled === undefined
				? []
				: [{ item: preferenceItems.syncSettings, value: enabled }]),
			{ item: syncBaselineItem, value: settings },
			{ item: preferenceItems.lastSave, value: lastSave },
		]);
		return true;
	}

	// Rule matching.

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
}

export default Preference;
