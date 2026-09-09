import { defineAppConfig } from "#imports";

declare const __EXT_VERSION__: string;

declare module "wxt/utils/define-app-config" {
	export interface WxtAppConfig {
		version: number[];
	}
}

export default defineAppConfig({
	version: __EXT_VERSION__.split(".").map(Number),
});
