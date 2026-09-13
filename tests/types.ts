import type { Driver as FirefoxDriver } from "selenium-webdriver/firefox.js";

export type TestContext = {
	driver: FirefoxDriver;
	optionsUrl: string;
	popupUrl: string;
	port: number;
};

declare global {
	const browser: typeof import("wxt/browser").browser;
	const Services: {
		prefs: { getStringPref(pref: string, defaultValue?: string): string };
	};
}
