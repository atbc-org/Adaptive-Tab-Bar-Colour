import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pkg from "../../package.json" with { type: "json" };
import type { TestContext } from "../types.js";
import { compareRecord, setupTestContext, sleep } from "../utils.js";

const importedPrefs: Record<string, unknown> = {
	allowDarkLight: true,
	compatibilityMode: false,
	dynamic: 10, // Type mismatch
	extra: true, // Extra key
	fallbackColour_dark: "#2b2a33",
	fallbackColour_light: "#ffffff",
	homeBackground_dark: "#2b2a33",
	homeBackground_light: "#ffffff",
	/* minContrast_dark: 45, */ // Missing key
	minContrast_light: 90,
	noThemeColour: true,
	popup: 10,
	popupBorder: 100, // Out of bounds
	sidebar: 10,
	sidebarBorder: 10,
	siteList: {
		"1": {
			header: "example-1.com",
			headerType: "URL",
			type: "COLOUR",
			value: "#33214e",
		},
		"2": {
			header: "example-2.com",
			headerType: "URL",
			type: "THEME_COLOUR",
			value: false,
		},
		"3": {
			header: "example-3.com",
			headerType: "URL",
			type: "QUERY_SELECTOR",
			value: "body",
		},
		"4": {
			header: "example-4.com",
			headerType: "URL",
			type: "COLOUR",
			value: "red", // Non-standard colour
		},
	},
	tabSelected: 15,
	tabSelectedBorder: 10,
	tabbar: 10,
	tabbarBorder: 0,
	toolbar: 0,
	toolbarBorder: 0,
	toolbarField: 5,
	toolbarFieldBorder: 5,
	toolbarFieldOnFocus: 5,
	version: [3, 3, 2],
};

const expectedPrefs: Record<string, unknown> = {
	accentColour_dark: "#00cadb",
	accentColour_light: "#0062fa",
	allowDarkLight: true,
	compatibilityMode: false,
	dynamic: true,
	fallbackColour_dark: "#2b2a33",
	fallbackColour_light: "#ffffff",
	homeBackground_dark: "#2b2a33",
	homeBackground_light: "#ffffff",
	minContrast_dark: 45,
	minContrast_light: 90,
	noThemeColour: true,
	nova: false,
	overwriteAccentColour: false,
	popup: 10,
	popupBorder: 50,
	ruleList: {
		"1": {
			header: "example-1.com",
			headerType: "URL",
			scheme: "both",
			type: "COLOUR",
			value: "#33214e",
		},
		"2": {
			header: "example-2.com",
			headerType: "URL",
			scheme: "both",
			type: "THEME_COLOUR",
			value: false,
		},
		"3": {
			header: "example-3.com",
			headerType: "URL",
			scheme: "both",
			type: "QUERY_SELECTOR",
			value: "body",
		},
		"4": {
			header: "example-4.com",
			headerType: "URL",
			scheme: "both",
			type: "COLOUR",
			value: "#ff0000",
		},
	},
	sidebar: 10,
	sidebarBorder: 10,
	tabSelected: 15,
	tabSelectedBorder: 10,
	tabbar: 10,
	tabbarBorder: 0,
	toolbar: 0,
	toolbarBorder: 0,
	toolbarField: 5,
	toolbarFieldBorder: 5,
	toolbarFieldOnFocus: 5,
	version: pkg.version.split(".").map(Number),
};

describe("Normalise Preferences", () => {
	let context: TestContext;
	let cleanup: () => Promise<void>;
	let actualPrefs: Record<string, unknown>;

	beforeAll(async () => {
		({ context, cleanup } = await setupTestContext());
		await context.driver.get(context.optionsUrl);
		await sleep(500);

		await context.driver.executeScript(async (prefs: unknown) => {
			await browser.storage.local.set(prefs as Record<string, unknown>);
		}, importedPrefs);

		await context.driver.navigate().refresh();
		await sleep(500);

		const { lastSave, ...prefs } = (await context.driver.executeScript(
			async () => {
				return await browser.storage.local.get();
			},
		)) as Record<string, unknown>;

		actualPrefs = prefs;
	});

	afterAll(async () => {
		if (cleanup) await cleanup();
	});

	it("has no missing preference keys", () => {
		const { extraKeys1: missingKeys } = compareRecord(
			expectedPrefs,
			actualPrefs,
		);
		expect(missingKeys, `Missing: ${missingKeys.join(", ")}`).toEqual([]);
	});

	it("has no extra preference keys", () => {
		const { extraKeys2: extraKeys } = compareRecord(
			expectedPrefs,
			actualPrefs,
		);
		expect(extraKeys, `Extra: ${extraKeys.join(", ")}`).toEqual([]);
	});

	it("matches all expected preference values", () => {
		const { mismatchedValues } = compareRecord(expectedPrefs, actualPrefs);
		expect(
			mismatchedValues,
			`Mismatches: ${mismatchedValues.join(", ")}`,
		).toEqual([]);
	});
});
