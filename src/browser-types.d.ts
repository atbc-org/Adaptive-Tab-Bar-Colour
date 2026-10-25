import "@wxt-dev/browser";
import type { BrowserSettings, Tabs, Theme } from "webextension-polyfill";

declare module "@wxt-dev/browser" {
	namespace Browser {
		export const theme: Theme.Static;
		export const browserSettings: BrowserSettings.Static;

		namespace events {
			interface Event<T extends (...args: any) => void> {
				addListener(
					callback: T,
					...filter: T extends (
						tabId: number,
						changeInfo: Browser.tabs.OnUpdatedInfo,
						tab: Browser.tabs.Tab,
					) => void
						? [filter?: Tabs.UpdateFilter]
						: []
				): void;
			}
		}
	}
}
