import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pkg from "../../package.json" with { type: "json" };
import type { TestContext } from "../types.js";
import { compareRecord, setupTestContext, sleep } from "../utils.js";

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
	popup: 5,
	popupBorder: 10,
	ruleList: {},
	sidebar: 5,
	sidebarBorder: 10,
	tabSelected: 15,
	tabSelectedBorder: 0,
	tabbar: 0,
	tabbarBorder: 0,
	toolbar: 0,
	toolbarBorder: 0,
	toolbarField: 5,
	toolbarFieldBorder: 5,
	toolbarFieldOnFocus: 5,
	version: pkg.version.split(".").map(Number),
};

describe("Initialise Preferences", () => {
	let context: TestContext;
	let cleanup: () => Promise<void>;
	let actualPrefs: Record<string, unknown>;

	beforeAll(async () => {
		({ context, cleanup } = await setupTestContext());
		await context.driver.get(context.optionsUrl);
		await sleep(500);

		expectedPrefs.compatibilityMode = (await context.driver.executeScript(
			() => {
				return typeof browser?.theme?.update !== "function";
			},
		)) as boolean;

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

	it("has no missing default preference keys", () => {
		const { extraKeys1: missingKeys } = compareRecord(
			expectedPrefs,
			actualPrefs,
		);
		expect(missingKeys, `Missing: ${missingKeys.join(", ")}`).toEqual([]);
	});

	it("has no extra default preference keys", () => {
		const { extraKeys2: extraKeys } = compareRecord(
			expectedPrefs,
			actualPrefs,
		);
		expect(extraKeys, `Extra: ${extraKeys.join(", ")}`).toEqual([]);
	});

	it("matches all expected default preference values", () => {
		const { mismatchedValues } = compareRecord(expectedPrefs, actualPrefs);
		expect(
			mismatchedValues,
			`Mismatches: ${mismatchedValues.join(", ")}`,
		).toEqual([]);
	});
});
