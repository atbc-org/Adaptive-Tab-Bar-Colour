import { type Config } from "prettier";

const config: Config = {
	endOfLine: "lf",
	importOrder: [
		"<BUILTIN_MODULES>",
		"<THIRD_PARTY_MODULES>",
		"^[./](?!.*\\.css$)",
		"^[./]",
	],
	importOrderSortSpecifiers: true,
	objectWrap: "collapse",
	overrides: [
		{
			files: ["*.yml", "*.yaml"],
			options: { proseWrap: "always", tabWidth: 2, useTabs: false },
		},
	],
	plugins: [
		"@trivago/prettier-plugin-sort-imports",
		"prettier-plugin-css-order",
		"prettier-plugin-jsdoc",
		"prettier-plugin-sort-json",
		"prettier-plugin-yaml",
	],
	printWidth: 80,
	tabWidth: 4,
	useTabs: true,
	yamlBlockStyle: "folded",
	yamlQuoteKeys: false,
	yamlQuoteValues: false,
};

export default config;
