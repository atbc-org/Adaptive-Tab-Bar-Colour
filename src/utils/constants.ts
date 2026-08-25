import { getAppConfig } from "#imports";

/** The version of ATBC. */
export const version = getAppConfig().version;

/** Default light homepage colour. */
export const default_homeBackground_light = "#ffffff";
/** Default dark homepage colour. */
export const default_homeBackground_dark = "#2b2a33";
/** Default light fallback colour. */
export const default_fallbackColour_light = "#ffffff";
/** Default dark fallback colour. */
export const default_fallbackColour_dark = "#2b2a33";
/** Default light accent colour. */
export const default_accentColour_light = "#0062fa";
/** Default dark accent colour. */
export const default_accentColour_dark = "#00cadb";
/** Default light accent colour in Nova UI. */
export const default_accentColourNova_light = "#764edd";
/** Default dark accent colour in Nova UI. */
export const default_accentColourNova_dark = "#b89cff";

/** Default compatibility mode setting. */
export const default_compatibilityMode = !supportsThemeAPI();

// prettier-ignore
/** Colours for about:pages. */
export const aboutPageColour = Object.freeze({
	"compat": { colour: "COMPAT", reason: "PROTECTED_PAGE" },
	"deleteprofile": { colour: "HOME", reason: "HOME_PAGE" },
	"devtools-toolbox": { colour: "TOOLBOX", reason: "PROTECTED_PAGE" },
	"editprofile": { colour: "HOME", reason: "HOME_PAGE" },
	"firefoxview": { colour: "HOME", reason: "HOME_PAGE" },
	"home": { colour: "HOME", reason: "HOME_PAGE" },
	"logo": { colour: "IMAGE_VIEWER", reason: "IMAGE_VIEWER" },
	"mozilla": { colour: "MOTTO", reason: "PROTECTED_PAGE" },
	"newprofile": { colour: "HOME", reason: "HOME_PAGE" },
	"newtab": { colour: "HOME", reason: "HOME_PAGE" },
	"privatebrowsing": { colour: "PRIVATE", reason: "PROTECTED_PAGE" },
	"processes": { colour: "PROCESS", reason: "PROTECTED_PAGE" },
	"sync-log": { colour: "LOG", reason: "PROTECTED_PAGE" },
} as Record<string, { colour: BrowserColour, reason: TabMetaReason } | undefined>);

// prettier-ignore
/** Colours for restricted sites. */
export const mozillaPageColour = Object.freeze({
	"accounts-static.cdn.mozilla.net": { light: new colour("#ffffff"), dark: new colour("#1c1b22") },
	"accounts.firefox.com": { light: new colour("#fafafb"), dark: new colour("#fafafb") },
	"addons.cdn.mozilla.net": { light: new colour("#ffffff"), dark: new colour("#1c1b22") },
	"addons.mozilla.org": { light: new colour("#20113a"), dark: new colour("#20113a") },
	"content.cdn.mozilla.net": { light: new colour("#ffffff"), dark: new colour("#1c1b22") },
	"discovery.addons.mozilla.org": { light: new colour("#ffffff"), dark: new colour("#1c1b22") },
	"install.mozilla.org": { light: new colour("#ffffff"), dark: new colour("#1c1b22") },
	"support.mozilla.org": { light: new colour("#ffffff"), dark: new colour("#ffffff") },
} as Record<string, Record<Scheme, Colour> | undefined>);

// prettier-ignore
/**
 * Preset colours for Add-ons' built-in pages.
 *
 * Contributions are welcomed.
 */
export const presetAddonPageColour = Object.freeze({
	"{1018e4d6-728f-4b20-ad56-37578a4de76b}": { light: new colour("#ffffff"), dark: new colour("#ffffff") }, // Flagfox
	"{74145f27-f039-47ce-a470-a662b129930a}": { light: new colour("#343a40"), dark: new colour("#343a40") }, // ClearURLs
	"{7a7a4a92-a2a0-41d1-9fd7-1e92480d612d}": { light: new colour("#ffffff"), dark: new colour("#242424") }, // Stylus
	"{a8cf72f7-09b7-4cd4-9aaa-7a023bf09916}": { light: new colour("#191919"), dark: new colour("#191919") }, // Time Tracker
	"{aecec67f-0d10-4fa7-b7c7-609a2db280cf}": { light: new colour("#ffffff"), dark: new colour("#262626") }, // Violentmonkey
	"{ce9f4b1f-24b8-4e9a-9051-b9e472b1b2f2}": { light: new colour("#ffffff"), dark: new colour("#1c1b1f") }, // Clear Browsing Data
	"addon@darkreader.org": { light: new colour("#141e24"), dark: new colour("#141e24") }, // Dark Reader
	"adguardadblocker@adguard.com": { light: new colour("#ffffff"), dark: new colour("#1f1f1f") }, // AdGuard AdBlocker
	"copyplaintext@eros.man": { light: new colour("#ffffff"), dark: new colour("#000000") }, // Copy PlainText
	"deArrow@ajay.app": { light: new colour("f9f9f9"), dark: new colour("#333333") }, // DeArrow
	"enhancerforyoutube@maximerf.addons.mozilla.org": { light: new colour("#eeeeee"), dark: new colour("#292a2d")}, // Enhancer for YouTube™
	"gdpr@cavi.au.dk": { light: new colour("#00237a"), dark: new colour("#00237a") }, // Consent-O-Matic
	"jid1-KdTtiCj6wxVAFA@jetpack": { light: new colour("#f9f9f8"), dark: new colour("#171a18") }, // Swift Selection Search
	"sponsorBlocker@ajay.app": { light: new colour("f9f9f9"), dark: new colour("#333333") }, // SponsorBlock for YouTube
	"uBlock0@raymondhill.net": { light: new colour("#f0f0f2"), dark: new colour("#1b1b24") }, // uBlock Origin
} as Record<string, Record<Scheme, Colour> | undefined>);

/** Protocols of Firefox source pages. */
export const sourcePageProtocol = [
	"chrome:",
	"jar:",
	"resource:",
	"view-source:",
];

/** Extensions of files that is rendered as plaintext. */
export const plainTextExtension = [
	".css",
	".ftl",
	".js",
	".locale",
	".mjs",
	".txt",
];

/** Default content of the preference. */
export const defaultPreferenceContent = Object.freeze({
	// theme builder
	popup: 5,
	popupBorder: 10,
	sidebar: 5,
	sidebarBorder: 10,
	tabbar: 0,
	tabbarBorder: 0,
	tabSelected: 15,
	tabSelectedBorder: 0,
	toolbar: 0,
	toolbarBorder: 0,
	toolbarField: 5,
	toolbarFieldBorder: 5,
	toolbarFieldOnFocus: 5,
	// rule list
	ruleList: {},
	// advanced
	accentColour_dark: default_accentColour_dark,
	accentColour_light: default_accentColour_light,
	allowDarkLight: true,
	compatibilityMode: default_compatibilityMode,
	dynamic: true,
	fallbackColour_dark: default_fallbackColour_dark,
	fallbackColour_light: default_fallbackColour_light,
	homeBackground_dark: default_homeBackground_dark,
	homeBackground_light: default_homeBackground_light,
	minContrast_dark: 45,
	minContrast_light: 90,
	noThemeColour: true,
	nova: false,
	overwriteAccentColour: false,
	// state
	lastSave: 0,
	version,
} as PreferenceContent);

/** Creates a `browserColour` object. */
export function createBrowserColour(
	getScheme: () => Scheme,
	getFirefoxVersion: () => number,
	pref: Preference,
): Record<BrowserColour, Colour> {
	return Object.freeze({
		get ADDON() {
			return getScheme() === "light"
				? new colour("#ececec")
				: new colour("#323232");
		},
		get COMPAT() {
			return getScheme() === "light"
				? new colour("#ffffff")
				: new colour("#292833");
		},
		get DEFAULT() {
			return getScheme() === "light"
				? pref.nova
					? getFirefoxVersion() >= 153
						? new colour("#fcfbff")
						: new colour("#f7f6fb")
					: new colour("#ffffff")
				: pref.nova
					? new colour("#121114")
					: new colour("#1c1b22");
		},
		get FALLBACK() {
			return getScheme() === "light"
				? new colour(pref.fallbackColour_light)
				: new colour(pref.fallbackColour_dark);
		},
		get HOME() {
			return getScheme() === "light"
				? new colour(pref.homeBackground_light)
				: new colour(pref.homeBackground_dark);
		},
		get IMAGE_VIEWER() {
			return new colour("#212121");
		},
		get JSON_VIEWER() {
			return getSystemScheme() === "light"
				? new colour("#f9f9f8")
				: new colour("#0c0c0d");
		},
		get LOG() {
			return getScheme() === "light"
				? new colour("#ececec")
				: new colour("#282828");
		},
		get MOTTO() {
			return new colour("#800000");
		},
		get PDF_VIEWER() {
			return getScheme() === "light"
				? new colour("#f9f9f8")
				: new colour("#38383d");
		},
		get PLAINTEXT() {
			return getScheme() === "light"
				? new colour("#ffffff")
				: new colour("#1c1b22");
		},
		get PRIVATE() {
			return new colour("#25003e");
		},
		get PROCESS() {
			return getScheme() === "light"
				? new colour("#eeeeef")
				: new colour("#32313a");
		},
		get SVG() {
			return new colour("#ffffff");
		},
		get SYSTEM() {
			return getScheme() === "light"
				? new colour("#ececec")
				: new colour("#282828");
		},
		get TOOLBOX() {
			return getSystemScheme() === "light"
				? new colour("#ffffff")
				: new colour("#232327");
		},
	});
}
