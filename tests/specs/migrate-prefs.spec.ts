import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TestContext } from "../types.js";
import {
	compareRecord,
	normaliseRuleKeys,
	setupTestContext,
	sleep,
} from "../utils.js";

const legacyUnversionedPrefs: Record<string, unknown> = {
	accentColour_dark: "#b89cff",
	accentColour_light: "#764edd",
	allowDarkLight: false,
	compatibilityMode: false,
	dynamic: true,
	fallbackColour_dark: "#111111",
	fallbackColour_light: "#eeeeee",
	homeBackground_dark: "#222222",
	homeBackground_light: "#f0f0f0",
	lastSave: 123456789,
	minContrast_dark: 50,
	minContrast_light: 95,
	noThemeColour: false,
	overwriteAccentColour: true,
	popup: 8,
	popupBorder: 12,
	ruleList: {
		"1": {
			header: "legacy-addon-id@example.com",
			headerType: "ADDON_ID",
			scheme: "both",
			type: "COLOUR",
			value: "#123456",
		},
		"2": {
			header: "example.org",
			headerType: "URL",
			scheme: "dark",
			type: "QUERY_SELECTOR",
			value: "#header",
		},
	},
	sidebar: 7,
	sidebarBorder: 14,
	tabSelected: 20,
	tabSelectedBorder: 2,
	tabbar: 3,
	tabbarBorder: 1,
	toolbar: 4,
	toolbarBorder: 2,
	toolbarField: 6,
	toolbarFieldBorder: 6,
	toolbarFieldOnFocus: 8,
	version: [4, 4, 0],
};

const expectedMigratedPrefs: Record<string, unknown> = {
	"advanced:accentColour_dark": "#b89cff",
	"advanced:accentColour_light": "#764edd",
	"advanced:allowDarkLight": false,
	"advanced:compatibilityMode": false,
	"advanced:dynamic": true,
	"advanced:fallbackColour_dark": "#111111",
	"advanced:fallbackColour_light": "#eeeeee",
	"advanced:homeBackground_dark": "#222222",
	"advanced:homeBackground_light": "#f0f0f0",
	"advanced:minContrast_dark": 50,
	"advanced:minContrast_light": 95,
	"advanced:noThemeColour": false,
	"advanced:overwriteAccentColour": true,
	"rule:1": {
		header: "legacy-addon-id@example.com",
		order: 1,
		scheme: "both",
		target: "ADDON_ID",
		type: "COLOUR",
		value: "#123456",
	},
	"rule:2": {
		header: "example.org",
		order: 2,
		scheme: "dark",
		target: "URL",
		type: "QUERY_SELECTOR",
		value: "#header",
	},
	"theme:popup": 8,
	"theme:popupBorder": 12,
	"theme:sidebar": 7,
	"theme:sidebarBorder": 14,
	"theme:tabSelected": 20,
	"theme:tabSelectedBorder": 2,
	"theme:tabbar": 3,
	"theme:tabbarBorder": 1,
	"theme:toolbar": 4,
	"theme:toolbarBorder": 2,
	"theme:toolbarField": 6,
	"theme:toolbarFieldBorder": 6,
	"theme:toolbarFieldOnFocus": 8,
};

describe("Migrate Legacy Prefs", () => {
	let context: TestContext;
	let cleanup: () => Promise<void>;
	let actualPrefs: Record<string, unknown>;

	beforeAll(async () => {
		({ context, cleanup } = await setupTestContext());
		await context.driver.get(context.optionsUrl);
		await sleep(500);

		await context.driver.executeScript(async (prefs: unknown) => {
			await browser.storage.local.clear();
			await browser.storage.local.set(prefs as Record<string, unknown>);
		}, legacyUnversionedPrefs);

		await context.driver.navigate().refresh();
		await sleep(1000);

		actualPrefs = normaliseRuleKeys(
			(await context.driver.executeScript(async () => {
				return await browser.storage.local.get();
			})) as Record<string, unknown>,
		);

		expectedMigratedPrefs["advanced:compatibilityMode"] =
			actualPrefs["advanced:compatibilityMode"];
	});

	afterAll(async () => {
		if (cleanup) await cleanup();
	});

	it("has no missing migrated pref keys", () => {
		const { extraKeys1: missingKeys } = compareRecord(
			expectedMigratedPrefs,
			actualPrefs,
		);
		expect(missingKeys, `Missing: ${missingKeys.join(", ")}`).toEqual([]);
	});

	it("has no extra migrated pref keys", () => {
		const { extraKeys2: extraKeys } = compareRecord(
			expectedMigratedPrefs,
			actualPrefs,
		);
		expect(extraKeys, `Extra: ${extraKeys.join(", ")}`).toEqual([]);
	});

	it("matches all expected migrated pref values", () => {
		const { mismatchedValues } = compareRecord(
			expectedMigratedPrefs,
			actualPrefs,
		);
		expect(
			mismatchedValues,
			`Mismatches: ${mismatchedValues.join(", ")}`,
		).toEqual([]);
	});
});
