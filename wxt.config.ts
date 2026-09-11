import { defineConfig } from "wxt";
import pkg from "./package.json";

const appVersion = process.env.EXT_VERSION || pkg.version;

export default defineConfig({
	browser: "firefox",
	hooks: {
		ready: (wxt) => {
			const originalWarn = wxt.logger.warn;
			wxt.logger.warn = (...args) => {
				if (
					typeof args[0] !== "string" ||
					!args[0].startsWith("Unsupported locales:")
				) {
					originalWarn(...args);
				}
			};
		},
		"build:manifestGenerated": (wxt, manifest) => {
			manifest.version = appVersion;
			if (wxt.config.mode === "beta") {
				manifest.name += " (BETA)";
				manifest.browser_specific_settings.gecko.id =
					"ATBC-beta@EasonWong";
				manifest.action = {
					...manifest.action,
					default_area: "navbar",
				};
			}
		},
	},
	manifest: {
		action: { default_title: "__MSG_extensionName__" },
		browser_specific_settings: {
			gecko: {
				id: "ATBC@EasonWong",
				strict_min_version: "115.0",
				data_collection_permissions: { required: ["none"] },
			},
		},
		default_locale: "en",
		description: "__MSG_extensionDescription__",
		developer: { name: "Eason & Yue", url: "https://easonwong.de/" },
		homepage_url: "https://github.com/atbc-org/Adaptive-Tab-Bar-Colour/",
		icons: {
			16: "/icon/icon-16.png",
			32: "/icon/icon-32.png",
			48: "/icon/icon-48.png",
			96: "/icon/icon-96.png",
			128: "/icon/icon-128.png",
		},
		name: "__MSG_extensionName__",
		options_ui: { open_in_tab: false },
		permissions: [
			"tabs",
			"theme",
			"storage",
			"browserSettings",
			"management",
		],
	},
	manifestVersion: 3,
	modules: ["@wxt-dev/module-react", "@wxt-dev/i18n/module"],
	outDirTemplate: "atbc",
	srcDir: "src",
	vite: () => ({
		define: { __EXT_VERSION__: JSON.stringify(appVersion) },
		css: {
			modules: {
				generateScopedName: "[hash:base64:6]",
				localsConvention: "camelCase",
			},
		},
	}),
	webExt: {
		binaries: { firefox: process.env.BINARY || "firefox" },
		openDevtools: true,
		firefoxArgs: ["about:home"],
		firefoxPref: {
			"app.update.auto": false,
			"app.update.enabled": false,
			"browser.aboutConfig.showWarning": false,
			"browser.newtabpage.activity-stream.showSponsored": false,
			"browser.newtabpage.activity-stream.showSponsoredCheckboxes": false,
			"browser.newtabpage.activity-stream.showSponsoredTopSites": false,
			"browser.newtabpage.activity-stream.system.showSponsored": false,
			"datareporting.policy.dataSubmissionEnabled": false,
			"datareporting.policy.dataSubmissionPolicyBypassNotification": true,
			"devtools.toolbox.alwaysOnTop": false,
			"devtools.toolbox.selectedTool": "webconsole",
			"toolkit.telemetry.reportingpolicy.firstRun": false,
		},
	},
	zip: {
		artifactTemplate: "atbc.zip",
		sourcesTemplate: "atbc-sources.zip",
		excludeSources: [
			"tests/**",
			"scripts/**",
			"amo/**",
			"prettier.config.ts",
			"README.md",
			"CONTRIBUTING.md",
		],
	},
});
