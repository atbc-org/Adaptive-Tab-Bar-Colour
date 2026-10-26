import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TestContext } from "../types.js";
import { compareRecord, setupTestContext, sleep } from "../utils.js";

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
	"theme:popup": 5,
	"theme:popupBorder": 10,
	"theme:sidebar": 5,
	"theme:sidebarBorder": 10,
	"theme:tabSelected": 15,
	"theme:tabSelectedBorder": 0,
	"theme:tabbar": 0,
	"theme:tabbarBorder": 0,
	"theme:toolbar": 0,
	"theme:toolbarBorder": 0,
	"theme:toolbarField": 5,
	"theme:toolbarFieldBorder": 5,
	"theme:toolbarFieldOnFocus": 5,
};

describe("Initialise Prefs", () => {
	let context: TestContext;
	let cleanup: () => Promise<void>;
	let actualPrefs: Record<string, unknown>;

	beforeAll(async () => {
		({ context, cleanup } = await setupTestContext());
		await context.driver.get(context.optionsUrl);
		await sleep(500);

		expectedPrefs["advanced:compatibilityMode"] =
			(await context.driver.executeScript(() => {
				return typeof browser?.theme?.update !== "function";
			})) as boolean;

		actualPrefs = (await context.driver.executeScript(async () => {
			return await browser.storage.local.get();
		})) as Record<string, unknown>;
	});

	afterAll(async () => {
		if (cleanup) await cleanup();
	});

	it("has no missing default pref keys", () => {
		const { extraKeys1: missingKeys } = compareRecord(
			expectedPrefs,
			actualPrefs,
		);
		expect(missingKeys, `Missing: ${missingKeys.join(", ")}`).toEqual([]);
	});

	it("has no extra default pref keys", () => {
		const { extraKeys2: extraKeys } = compareRecord(
			expectedPrefs,
			actualPrefs,
		);
		expect(extraKeys, `Extra: ${extraKeys.join(", ")}`).toEqual([]);
	});

	it("matches all expected default pref values", () => {
		const { mismatchedValues } = compareRecord(expectedPrefs, actualPrefs);
		expect(
			mismatchedValues,
			`Mismatches: ${mismatchedValues.join(", ")}`,
		).toEqual([]);
	});
});
