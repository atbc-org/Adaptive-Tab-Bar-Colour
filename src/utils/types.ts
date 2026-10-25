import type { Manifest } from "webextension-polyfill";

export type Scheme = "light" | "dark";

export type BrowserColour =
	| "ADDON"
	| "BLANK"
	| "COMPAT"
	| "DEFAULT"
	| "FALLBACK"
	| "HOME"
	| "IMAGE_VIEWER"
	| "JSON_VIEWER"
	| "LOG"
	| "MOTTO"
	| "PDF_VIEWER"
	| "PLAINTEXT"
	| "PREFERENCES"
	| "PRIVATE"
	| "PROCESS"
	| "SVG"
	| "SYSTEM"
	| "TOOLBOX";

export type Theme = Manifest.ThemeType;

export interface ColourRule {
	target: "URL" | "ADDON_ID";
	header: string;
	type: "COLOUR";
	value: string;
	scheme: "both" | Scheme;
	order: number;
}

export interface ThemeColourRule {
	target: "URL";
	header: string;
	type: "THEME_COLOUR";
	value: boolean;
	scheme: "both" | Scheme;
	order: number;
}

export interface QuerySelectorRule {
	target: "URL";
	header: string;
	type: "QUERY_SELECTOR";
	value: string;
	scheme: "both" | Scheme;
	order: number;
}

export type Rule = ColourRule | ThemeColourRule | QuerySelectorRule;

export type NewRule =
	| Omit<ColourRule, "order">
	| Omit<ThemeColourRule, "order">
	| Omit<QuerySelectorRule, "order">;

export interface RuleQueryResult {
	id?: string | undefined;
	url: string;
	webExtId?: string | undefined;
	rule?: Rule | undefined;
}

export interface ThemePrefs {
	popup: number;
	popupBorder: number;
	sidebar: number;
	sidebarBorder: number;
	tabSelected: number;
	tabSelectedBorder: number;
	tabbar: number;
	tabbarBorder: number;
	toolbar: number;
	toolbarBorder: number;
	toolbarField: number;
	toolbarFieldBorder: number;
	toolbarFieldOnFocus: number;
}

export interface RulePrefs {
	rules: Record<string, Rule>;
}

export interface AdvancedPrefs {
	accentColour_dark: string;
	accentColour_light: string;
	allowDarkLight: boolean;
	compatibilityMode: boolean;
	dynamic: boolean;
	fallbackColour_dark: string;
	fallbackColour_light: string;
	homeBackground_dark: string;
	homeBackground_light: string;
	minContrast_dark: number;
	minContrast_light: number;
	noThemeColour: boolean;
	overwriteAccentColour: boolean;
}

export interface Prefs extends ThemePrefs, RulePrefs, AdvancedPrefs {
	[key: string]: Prefs[keyof Prefs];
}

export type PrefKey = keyof ThemePrefs | keyof AdvancedPrefs;

export type PrefStorageItems = {
	[K in PrefKey]: WxtStorageItem<Prefs[K], Record<string, unknown>>;
};

export interface TabThemeColourData {
	light?: string | undefined;
	dark?: string | undefined;
}

export interface TabElementColourData {
	colour: string;
	opacity: string;
	filter: string;
}

export type TabSpecialColourData = "image" | "plaintext" | "svg" | "none";

export interface TabColourData {
	page: TabElementColourData[];
	theme: TabThemeColourData;
	query?: TabElementColourData | undefined;
	special: TabSpecialColourData;
}

export type TabMetaReason =
	| "ADDON_DEFAULT"
	| "ADDON_PRESET"
	| "ADDON_SPECIFIED"
	| "COLOUR_PICKED"
	| "COLOUR_SPECIFIED"
	| "ERROR_OCCURRED"
	| "FALLBACK_COLOUR"
	| "HOME_PAGE"
	| "IMAGE_VIEWER"
	| "JSON_VIEWER"
	| "PDF_VIEWER"
	| "PROTECTED_PAGE"
	| "QS_ERROR"
	| "QS_FAILED"
	| "QS_USED"
	| "TEXT_VIEWER"
	| "THEME_IGNORED"
	| "THEME_MISSING"
	| "THEME_UNIGNORED"
	| "THEME_USED";

export interface MetaQueryResult {
	colour: Colour;
	reason: TabMetaReason;
	info?: string;
}

export interface ApplyThemeResult {
	popupColour: string;
	scheme: Scheme;
	corrected: boolean;
}

export interface ColourCorrectionResult {
	colour: Colour;
	scheme: Scheme;
	corrected: boolean;
}

export interface CacheData {
	ruleData: RuleQueryResult;
	metaData: MetaQueryResult;
	themeData: ApplyThemeResult;
}

export type MessageForBackground =
	| { header: "UPDATE_COLOUR"; colour: TabColourData }
	| { header: "SCRIPT_READY" | "CACHE_REQUEST" };

export type MessageForPopup = {
	header: "CACHE_UPDATE";
	windowId: number;
	cache: CacheData;
};

export type MessageForTab =
	| {
			header: "SETUP_SCRIPT";
			mode: "suspend" | "static" | "dynamic";
			query?: string | undefined;
	  }
	| { header: "SET_THEME_COLOUR"; colour: string };

export type BackgroundMessageListener = (
	message: MessageForBackground,
	sender: Browser.runtime.MessageSender,
	sendResponse: (response?: unknown) => void,
) => unknown;

export type PopupMessageListener = (
	message: MessageForPopup,
	sender: Browser.runtime.MessageSender,
	sendResponse: (response?: unknown) => void,
) => unknown;

export type TabMessageListener = (
	message: MessageForTab,
	sender: Browser.runtime.MessageSender,
	sendResponse: (response?: unknown) => void,
) => unknown;

export type GlyphHighlight =
	| "frame"
	| "none"
	| "popup"
	| "selectedTab"
	| "sidebar"
	| "tabBar"
	| "toolbar"
	| "urlBar";

export type IconType =
	| "background"
	| "backgroundOnFocus"
	| "border"
	| "circle"
	| "contrast"
	| "delete"
	| "download"
	| "info"
	| "moon"
	| "redirect"
	| "redo"
	| "reset"
	| "sun"
	| "sunMoon"
	| "undo"
	| "upload"
	| "warning";
