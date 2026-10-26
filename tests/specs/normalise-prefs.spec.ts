import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TestContext } from "../types.js";
import { compareRecord, setupTestContext, sleep } from "../utils.js";

const importedPrefs: Record<string, unknown> = {
	"advanced:allowDarkLight": true,
	"advanced:compatibilityMode": false,
	"advanced:dynamic": 10, // Type mismatch
	"advanced:fallbackColour_dark": "#2b2a33",
	"advanced:fallbackColour_light": "#ffffff",
	"advanced:homeBackground_dark": "#2b2a33",
	"advanced:homeBackground_light": "#ffffff",
	/* "advanced:minContrast_dark": 45, */ // Missing key
	"advanced:minContrast_light": 90,
	"advanced:noThemeColour": true,
	extra: true, // Extra key
	"rule:1": {
		header: "example-1.com",
		order: 1,
		scheme: "both",
		target: "URL",
		type: "COLOUR",
		value: "#33214e",
	},
	"rule:2": {
		header: "example-2.com",
		order: 2,
		scheme: "both",
		target: "URL",
		type: "THEME_COLOUR",
		value: false,
	},
	"rule:3": {
		header: "example-3.com",
		order: 3,
		scheme: "both",
		target: "URL",
		type: "QUERY_SELECTOR",
		value: "body",
	},
	"rule:4": {
		header: "example-4.com",
		order: 4,
		scheme: "both",
		target: "URL",
		type: "COLOUR",
		value: "red", // Non-standard colour
	},
	"rule:null": null, // Null rule to purge
	"theme:popup": 10,
	"theme:popupBorder": 100, // Out of bounds
	"theme:sidebar": 10,
	"theme:sidebarBorder": 10,
	"theme:tabSelected": 15,
	"theme:tabSelectedBorder": 10,
	"theme:tabbar": 10,
	"theme:tabbarBorder": 0,
	"theme:toolbar": 0,
	"theme:toolbarBorder": 0,
	"theme:toolbarField": 5,
	"theme:toolbarFieldBorder": 5,
	"theme:toolbarFieldOnFocus": 5,
};

const expectedPrefs: Record<string, unknown> = {
	"advanced:accentColour_dark": "#b89cff",
	"advanced:accentColour_light": "#764edd",
	"advanced:allowDarkLight": true,
	"advanced:compatibilityMode": false,
	"advanced:dynamic": true,
	"advanced:fallbackColour_dark": "#2b2a33",
	"advanced:fallbackColour_light": "#ffffff",
	"advanced:homeBackground_dark": "#2b2a33",
	"advanced:homeBackground_light": "#ffffff",
	"advanced:minContrast_dark": 45,
	"advanced:minContrast_light": 90,
	"advanced:noThemeColour": true,
	"advanced:overwriteAccentColour": false,
	"advanced:syncSettings": true,
	"rule:1": {
		header: "example-1.com",
		order: 1,
		scheme: "both",
		target: "URL",
		type: "COLOUR",
		value: "#33214e",
	},
	"rule:2": {
		header: "example-2.com",
		order: 2,
		scheme: "both",
		target: "URL",
		type: "THEME_COLOUR",
		value: false,
	},
	"rule:3": {
		header: "example-3.com",
		order: 3,
		scheme: "both",
		target: "URL",
		type: "QUERY_SELECTOR",
		value: "body",
	},
	"rule:4": {
		header: "example-4.com",
		order: 4,
		scheme: "both",
		target: "URL",
		type: "COLOUR",
		value: "#ff0000",
	},
	"theme:popup": 10,
	"theme:popupBorder": 50,
	"theme:sidebar": 10,
	"theme:sidebarBorder": 10,
	"theme:tabSelected": 15,
	"theme:tabSelectedBorder": 10,
	"theme:tabbar": 10,
	"theme:tabbarBorder": 0,
	"theme:toolbar": 0,
	"theme:toolbarBorder": 0,
	"theme:toolbarField": 5,
	"theme:toolbarFieldBorder": 5,
	"theme:toolbarFieldOnFocus": 5,
};

describe("Normalise Prefs", () => {
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
		}, importedPrefs);

		await context.driver.navigate().refresh();
		await sleep(500);

		actualPrefs = (await context.driver.executeScript(async () => {
			return await browser.storage.local.get();
		})) as Record<string, unknown>;
	});

	afterAll(async () => {
		if (cleanup) await cleanup();
	});

	it("has no missing pref keys", () => {
		const { extraKeys1: missingKeys } = compareRecord(
			expectedPrefs,
			actualPrefs,
		);
		expect(missingKeys, `Missing: ${missingKeys.join(", ")}`).toEqual([]);
	});

	it("has no extra pref keys", () => {
		const { extraKeys2: extraKeys } = compareRecord(
			expectedPrefs,
			actualPrefs,
		);
		expect(extraKeys, `Extra: ${extraKeys.join(", ")}`).toEqual([]);
	});

	it("matches all expected pref values", () => {
		const { mismatchedValues } = compareRecord(expectedPrefs, actualPrefs);
		expect(
			mismatchedValues,
			`Mismatches: ${mismatchedValues.join(", ")}`,
		).toEqual([]);
	});
});
