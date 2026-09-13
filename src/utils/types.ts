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
	| "PRIVATE"
	| "PROCESS"
	| "SVG"
	| "SYSTEM"
	| "TOOLBOX";

export interface ColourRule {
	headerType: "URL" | "ADDON_ID";
	header: string;
	type: "COLOUR";
	value: string;
	scheme: "both" | Scheme;
}

export interface ThemeColourRule {
	headerType: "URL";
	header: string;
	type: "THEME_COLOUR";
	value: boolean;
	scheme: "both" | Scheme;
}

export interface QuerySelectorRule {
	headerType: "URL";
	header: string;
	type: "QUERY_SELECTOR";
	value: string;
	scheme: "both" | Scheme;
}

export type Rule = ColourRule | ThemeColourRule | QuerySelectorRule | null;

export type RuleList = Record<number, Rule>;

export interface ThemeBuilderPreferenceContent {
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

export interface RuleListPreferenceContent {
	ruleList: RuleList;
}

export interface AdvancedPreferenceContent {
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
	nova: boolean;
	overwriteAccentColour: boolean;
}

export interface PreferenceContent
	extends
		ThemeBuilderPreferenceContent,
		RuleListPreferenceContent,
		AdvancedPreferenceContent {
	lastSave: number;
	version: number[];
	[key: string]: PreferenceContent[keyof PreferenceContent];
}

export interface TabThemeColourData {
	light?: string;
	dark?: string;
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
	query?: TabElementColourData;
	special: TabSpecialColourData;
}

export interface RuleQueryResult {
	id: number;
	url: string;
	webExtId?: string;
	rule: Rule;
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

export interface CacheData {
	ruleData: RuleQueryResult;
	metaData: MetaQueryResult;
	themeData: ApplyThemeResult;
}

export interface ColourCorrectionResult {
	colour: Colour;
	scheme: Scheme;
	corrected: boolean;
}

export type Theme = Manifest.ThemeType;

export type AdditionalBackgroundsTilingEnum =
	Manifest.ThemeTypePropertiesAdditionalBackgroundsTilingItemEnum;

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
			query?: string;
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
