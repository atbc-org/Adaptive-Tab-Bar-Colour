import { nanoid } from "nanoid";

/** Checks whether a value is a plain record. */
function isRecord(
	value: unknown,
): value is Record<string | number | symbol, unknown> {
	return (
		value !== undefined &&
		value !== null &&
		typeof value === "object" &&
		!Array.isArray(value)
	);
}

/** Normalises a single rule object, or returns `null` if invalid. */
export function normaliseRule(value: unknown, fallbackOrder = 1): Rule | null {
	const isValid =
		isRecord(value) &&
		typeof value.header === "string" &&
		["both", "dark", "light"].includes(value.scheme as string);
	if (!isValid) return null;

	const order =
		typeof value.order === "number" && Number.isInteger(value.order)
			? value.order
			: fallbackOrder;
	const scheme = value.scheme as "both" | Scheme;
	const header = value.header as string;
	const target = value.target ?? value.headerType;

	if (
		target === "ADDON_ID" &&
		value.type === "COLOUR" &&
		typeof value.value === "string"
	) {
		return {
			target: "ADDON_ID",
			header,
			type: "COLOUR",
			value: new Colour(value.value).toHex(),
			scheme,
			order,
		};
	} else if (
		target === "URL" &&
		value.type === "COLOUR" &&
		typeof value.value === "string"
	) {
		return {
			target: "URL",
			header,
			type: "COLOUR",
			value: new Colour(value.value).toHex(),
			scheme,
			order,
		};
	} else if (
		target === "URL" &&
		value.type === "THEME_COLOUR" &&
		typeof value.value === "boolean"
	) {
		return {
			target: "URL",
			header,
			type: "THEME_COLOUR",
			value: value.value,
			scheme,
			order,
		};
	} else if (
		target === "URL" &&
		value.type === "QUERY_SELECTOR" &&
		typeof value.value === "string"
	) {
		return {
			target: "URL",
			header,
			type: "QUERY_SELECTOR",
			value: value.value,
			scheme,
			order,
		};
	} else {
		return null;
	}
}

/** Adds a new rule with a generated nanoid and next order number. */
export async function addRule(newRule: NewRule): Promise<void> {
	const snapshot = await storage.snapshot("local");
	let maxOrder = 0;
	for (const [key, value] of Object.entries(snapshot)) {
		if (!key.startsWith("rule:")) continue;
		const rule = normaliseRule(value);
		if (!rule || rule.order <= maxOrder) continue;
		maxOrder = rule.order;
	}
	let id = nanoid();
	while (`rule:${id}` in snapshot) id = nanoid();
	const rule = normaliseRule({ ...newRule, order: maxOrder + 1 });
	if (!rule) return;
	await storage.setItem(`local:rule:${id}`, rule);
	await syncRuleToCloud(id, rule);
}

/** Updates an existing rule or removes it when `rule` is `null`. */
export async function setRule(id: string, rule: Rule | null): Promise<void> {
	const normalised = rule ? normaliseRule(rule, rule.order) : null;
	if (rule === null) {
		await storage.removeItem(`local:rule:${id}`);
		await syncRuleToCloud(id, null);
	} else if (normalised) {
		await storage.setItem(`local:rule:${id}`, normalised);
		await syncRuleToCloud(id, normalised);
	}
}

/** Tests whether a URL matches a regex pattern. */
function testRegex(url: string, test: string): boolean {
	try {
		return new RegExp(`^${test}$`, "i").test(url);
	} catch {
		return false;
	}
}

/** Tests whether a URL matches a wildcard pattern. */
function testWildcard(url: string, test: string): boolean {
	if (!test.includes("*") && !test.includes("?")) return false;
	try {
		const wildcardPattern = test
			.replace(/[.+^${}()|[\]\\]/g, "\\$&")
			.replace(/\*\*/g, "\0")
			.replace(/\*/g, "[^/.:]*")
			.replace(/\?/g, ".")
			.replace(/\0/g, ".*")
			.replace(/^([a-z]+:\/\/)/i, "$1")
			.replace(/^((?![a-z]+:\/\/).)/i, "(?:[a-z]+:\\/\\/)?$1");
		return new RegExp(`^${wildcardPattern}/?$`, "i").test(url);
	} catch {
		return false;
	}
}

/**
 * Tests if a URL matches a specific hostname (with optional subdomains) or
 * hostname with path.
 */
function testHostname(url: string, test: string): boolean {
	try {
		const { hostname, pathname } = new URL(url);
		const hostPart = test.split("/")[0];
		if (hostname !== hostPart && !hostname.endsWith(`.${hostPart}`))
			return false;
		const urlPath = hostPart + pathname;
		return urlPath === test || urlPath.startsWith(`${test}/`);
	} catch {
		return false;
	}
}

/** Finds the last matching rule for a URL ordered by `rule.order`. */
export async function getRule(
	url: string = "",
	scheme: Scheme,
	rules: Record<string, Rule>,
): Promise<RuleQueryResult> {
	if (!url) return { url };

	const webExtId = await getWebExtId(url);
	const cleanUrl = url.replace(/\/$/, "");
	let match: RuleQueryResult = { url, webExtId };

	const sortedRules = Object.entries(rules).sort(
		([, first], [, second]) => first.order - second.order,
	);

	for (const [id, rule] of sortedRules) {
		const isSchemeValid = rule.scheme === "both" || rule.scheme === scheme;
		if (!rule.header || !isSchemeValid) continue;

		const isAddonMatch =
			webExtId !== undefined &&
			rule.target === "ADDON_ID" &&
			rule.header === webExtId;

		const cleanHeader = rule.header.replace(/\/$/, "");
		const isUrlMatch =
			rule.target === "URL" &&
			(cleanUrl === cleanHeader ||
				testRegex(cleanUrl, cleanHeader) ||
				testWildcard(cleanUrl, cleanHeader) ||
				testHostname(cleanUrl, cleanHeader));

		if (isAddonMatch || isUrlMatch) match = { id, url, webExtId, rule };
	}

	return match;
}
