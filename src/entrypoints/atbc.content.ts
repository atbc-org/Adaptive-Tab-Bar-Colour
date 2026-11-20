let colourDataCache: TabColourData | undefined;
let querySelectorCache: string | undefined;
let themeColourCache: TabThemeColourData | undefined;

let dispatchTimeout: ReturnType<typeof setTimeout> | undefined;
let dispatchFrame: number | undefined;
let lastSentAt = 0;
const throttleIntervalMs = 250;

/** Handles incoming runtime messages from the background script. */
function handleMessage(
	message: MessageForTab,
	_: Browser.runtime.MessageSender,
	sendResponse: (response?: unknown) => void,
): void {
	if (message.header === "SETUP_SCRIPT") {
		querySelectorCache = message.query;
		themeColourCache = undefined;
		switch (message.mode) {
			case "suspend":
				disableDynamic();
				sendResponse();
				break;
			case "static":
				disableDynamic();
				sendResponse(colourDataCache ?? getColourData());
				break;
			case "dynamic":
				enableDynamic();
				sendResponse(getColourData());
				break;
		}
	} else if (message.header === "SET_THEME_COLOUR") {
		setThemeColour(message.colour);
	}
}

/** Sets the theme colour by adding a meta tag. */
function setThemeColour(themeColour: string): void {
	const metaThemeColourList = document.querySelectorAll(
		`meta[name="theme-color"]`,
	);
	const newMetaThemeColour = document.createElement("meta");
	newMetaThemeColour.name = "theme-color";
	newMetaThemeColour.content = themeColour;
	(document.head ?? document.documentElement).appendChild(newMetaThemeColour);
	metaThemeColourList.forEach((metaThemeColour) => metaThemeColour.remove());
}

/** Sends message to background upon the script is loaded. */
async function sendMessageOnLoad(attempt: number = 0) {
	try {
		await sendMessageToBackground({ header: "SCRIPT_READY" });
	} catch {
		if (attempt < 10) {
			console.warn("Failed to connect to ATBC background.");
			setTimeout(() => sendMessageOnLoad(++attempt), 1000);
		} else {
			console.error("Could not connect to ATBC background.");
		}
	}
}

/** Retrieves the colour data from the current page. */
function getColourData(): TabColourData {
	const page = getPageColourData();
	const tabColourData: TabColourData = {
		page,
		theme: getThemeColourData(),
		query: getQueryColourData(),
		special: page.length > 0 ? "none" : getSpecialColourData(),
	};
	colourDataCache = tabColourData;
	return tabColourData;
}

/** Extracts the theme colour from meta tags. */
function getThemeColourData(): TabThemeColourData {
	if (themeColourCache) return themeColourCache;
	const metaThemeColour = document.querySelector<HTMLMetaElement>(
		`meta[name="theme-color"]:not([media])`,
	);
	const metaThemeColourLight =
		document.querySelector<HTMLMetaElement>(
			`meta[name="theme-color"][media="(prefers-color-scheme: light)"]`,
		) ?? metaThemeColour;
	const metaThemeColourDark =
		document.querySelector<HTMLMetaElement>(
			`meta[name="theme-color"][media="(prefers-color-scheme: dark)"]`,
		) ?? metaThemeColour;
	return (themeColourCache = {
		light: metaThemeColourLight?.content,
		dark: metaThemeColourDark?.content,
	});
}

/** Extracts visible element colours from the top of the viewport. */
function getPageColourData(): TabElementColourData[] {
	const minWidth = window.innerWidth * 0.9;
	return document
		.elementsFromPoint(window.innerWidth / 2, 3)
		.filter(
			(element) =>
				element instanceof HTMLElement &&
				element.offsetWidth >= minWidth &&
				element.offsetHeight >= 20,
		)
		.map((element) => getElementColour(element))
		.concat(
			getElementColour(document.body),
			getElementColour(document.documentElement),
		)
		.filter((colourData) => colourData !== undefined);
}

/** Extracts colour from an element matching the query. */
function getQueryColourData(): TabElementColourData | undefined {
	try {
		return querySelectorCache
			? getElementColour(document.querySelector(querySelectorCache))
			: undefined;
	} catch {
		return undefined;
	}
}

/** Determines the special page type when no page colour candidates are found. */
function getSpecialColourData(): TabSpecialColourData {
	if (
		getComputedStyle(document.documentElement).backgroundImage ===
		'url("chrome://global/skin/media/imagedoc-darknoise.png")'
	)
		return "image";
	if (document.head) {
		const stylesheetLinks = document.head.querySelectorAll(
			'link[rel="stylesheet"][href]',
		);
		if (
			stylesheetLinks.length === 1 &&
			stylesheetLinks[0]?.getAttribute("href") ===
				"resource://content-accessible/plaintext.css"
		)
			return "plaintext";
	}
	return document.documentElement instanceof SVGSVGElement ? "svg" : "none";
}

/** Extracts style properties from an element. */
function getElementColour(
	element: Element | null,
): TabElementColourData | undefined {
	if (element instanceof Element) {
		const style = getComputedStyle(element);
		const backgroundColor = style.backgroundColor;
		const opacity = style.opacity;
		if (backgroundColor !== "rgba(0, 0, 0, 0)" && opacity !== "0")
			return {
				colour: backgroundColor,
				opacity: opacity,
				filter: style.filter,
			};
	}
	return undefined;
}

/** Checks whether two tab colour payloads are identical. */
function isSameTabColourData(
	a: TabColourData | undefined,
	b: TabColourData,
): boolean {
	return (
		!!a &&
		a.special === b.special &&
		a.theme.light === b.theme.light &&
		a.theme.dark === b.theme.dark &&
		isSameElementColour(a.query, b.query) &&
		a.page.length === b.page.length &&
		a.page.every((item, index) => isSameElementColour(item, b.page[index]))
	);
}

/** Checks whether two element colour entries are identical. */
function isSameElementColour(
	a?: TabElementColourData,
	b?: TabElementColourData,
): boolean {
	return (
		a === b ||
		(!!a &&
			!!b &&
			a.colour === b.colour &&
			a.opacity === b.opacity &&
			a.filter === b.filter)
	);
}

/** Sends the current page colour to the background script with throttling. */
function sendColour(): void {
	if (document.visibilityState !== "visible") return;
	clearTimeout(dispatchTimeout);
	dispatchTimeout = undefined;
	const remaining = throttleIntervalMs + lastSentAt - Date.now();
	if (remaining <= 0) {
		scheduleDispatch();
		return;
	}
	dispatchTimeout = setTimeout(scheduleDispatch, remaining);
}

/** Sends colour update if the document has focus. */
function sendColourRequiresFocus(): void {
	if (document.hasFocus()) sendColour();
}

/** Schedules a colour dispatch on the next animation frame. */
function scheduleDispatch(): void {
	if (dispatchFrame !== undefined) return;
	dispatchFrame = requestAnimationFrame(() => {
		void dispatchColour();
	});
}

/** Reads and sends the current page colour to the background script. */
async function dispatchColour(): Promise<void> {
	dispatchFrame = undefined;
	if (document.visibilityState !== "visible") return;
	lastSentAt = Date.now();
	const previousColourData = colourDataCache;
	const nextColourData = getColourData();
	if (isSameTabColourData(previousColourData, nextColourData)) return;
	try {
		await sendMessageToBackground({
			header: "UPDATE_COLOUR",
			colour: nextColourData,
		});
	} catch {
		console.warn("Failed to send colour to ATBC background.");
	}
}

/** Checks whether a node list contains a style element. */
function hasStyleNode(nodes: NodeList): boolean {
	for (const node of nodes) {
		if (node.nodeName === "STYLE") return true;
	}
	return false;
}

/** Checks whether a node is a theme-color meta element. */
function isMetaThemeColour(node: Node): node is HTMLMetaElement {
	return node instanceof HTMLMetaElement && node.name === "theme-color";
}

const darkReaderObserver = new MutationObserver(sendColour);

const metaThemeColourObserver = new MutationObserver(() => {
	themeColourCache = undefined;
	sendColour();
});

const metaTagObserver = new MutationObserver((mutationList) => {
	let changed = false;
	for (const mutation of mutationList) {
		for (const node of mutation.addedNodes) {
			if (!isMetaThemeColour(node)) continue;
			metaThemeColourObserver.observe(node, { attributes: true });
			changed = true;
		}
		if (changed) continue;
		for (const node of mutation.removedNodes) {
			if (isMetaThemeColour(node)) {
				changed = true;
				break;
			}
		}
	}
	if (!changed) return;
	themeColourCache = undefined;
	sendColour();
});

const styleTagObserver = new MutationObserver((mutationList) => {
	if (
		mutationList.some(
			(mutation) =>
				hasStyleNode(mutation.addedNodes) ||
				hasStyleNode(mutation.removedNodes),
		)
	) {
		sendColour();
	}
});

/** Enables dynamic colour monitoring using event listeners and observers. */
function enableDynamic(): void {
	document.addEventListener("scroll", sendColour, { passive: true });
	["click", "resize", "visibilitychange"].forEach((event) =>
		document.addEventListener(event, sendColour),
	);
	[
		"transitionend",
		"transitioncancel",
		"animationend",
		"animationcancel",
	].forEach((transitionEvent) =>
		document.addEventListener(transitionEvent, sendColourRequiresFocus),
	);
	darkReaderObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["data-darkreader-mode"],
	});
	document
		.querySelectorAll("meta[name=theme-color]")
		.forEach((metaTag) =>
			metaThemeColourObserver.observe(metaTag, { attributes: true }),
		);
	if (document.head)
		metaTagObserver.observe(document.head, { childList: true });
	styleTagObserver.observe(document.documentElement, { childList: true });
	if (document.head)
		styleTagObserver.observe(document.head, { childList: true });
}

/** Disables dynamic colour monitoring. */
function disableDynamic(): void {
	["click", "resize", "scroll", "visibilitychange"].forEach((event) =>
		document.removeEventListener(event, sendColour),
	);
	[
		"transitionend",
		"transitioncancel",
		"animationend",
		"animationcancel",
	].forEach((transitionEvent) =>
		document.removeEventListener(transitionEvent, sendColourRequiresFocus),
	);
	darkReaderObserver.disconnect();
	metaThemeColourObserver.disconnect();
	metaTagObserver.disconnect();
	styleTagObserver.disconnect();
	clearTimeout(dispatchTimeout);
	dispatchTimeout = undefined;
	if (dispatchFrame !== undefined) {
		cancelAnimationFrame(dispatchFrame);
		dispatchFrame = undefined;
	}
}

export default defineContentScript({
	matches: ["http://*/*", "https://*/*"],
	main() {
		addMessageListener(handleMessage);
		sendMessageOnLoad();
	},
});
