import { nanoid } from "nanoid";

/** Normalises a single rule object, or returns undefined if invalid. */
export function normaliseRule(
	value: unknown,
	fallbackOrder = 1,
): Rule | undefined {
	if (!isRecord(value) || typeof value.header !== "string") return undefined;
	const { header, scheme, target, type } = value;
	if (scheme !== "both" && scheme !== "dark" && scheme !== "light")
		return undefined;
	const order =
		typeof value.order === "number" &&
		Number.isSafeInteger(value.order) &&
		value.order > 0
			? value.order
			: fallbackOrder;
	if (
		(target === "URL" || target === "ADDON_ID") &&
		type === "COLOUR" &&
		typeof value.value === "string"
	) {
		const colour = new Colour(value.value.trim());
		if (!colour.isValid()) return undefined;
		return { target, header, scheme, type, value: colour.toHex(), order };
	} else if (
		target === "URL" &&
		type === "THEME_COLOUR" &&
		typeof value.value === "boolean"
	) {
		return { target, header, scheme, type, value: value.value, order };
	} else if (
		target === "URL" &&
		type === "QUERY_SELECTOR" &&
		typeof value.value === "string"
	) {
		return { target, header, scheme, type, value: value.value, order };
	} else {
		return undefined;
	}
}

/** Adds a new rule with a generated ID and next order number. */
export async function addRule(rule: NewRule): Promise<void> {
	const raw = await storage.snapshot("local");
	let maxOrder = 0;
	for (const [key, value] of Object.entries(raw)) {
		if (isRuleKey(key))
			maxOrder = Math.max(maxOrder, normaliseRule(value)?.order ?? 0);
	}
	let key: `rule:${string}` = `rule:${nanoid()}`;
	while (Object.hasOwn(raw, key)) key = `rule:${nanoid()}`;
	await setPref(key, { ...rule, order: maxOrder + 1 });
}

/** Updates a rule or removes its key when null. */
export async function setRule(id: string, rule: Rule | null): Promise<void> {
	await setPref(`rule:${id}`, rule ?? undefined);
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
