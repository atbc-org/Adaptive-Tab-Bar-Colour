let query: string | undefined;
let colourDataCache: TabColourData | undefined;

/** Handles incoming runtime messages from the background script. */
function handleMessage(
	message: MessageForTab,
	_: Browser.runtime.MessageSender,
	sendResponse: (response?: unknown) => void,
): void {
	if (message.header === "SETUP_SCRIPT") {
		query = message.query;
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
	return {
		light: metaThemeColourLight?.content,
		dark: metaThemeColourDark?.content,
	};
}

/** Extracts visible element colours from the top of the viewport. */
function getPageColourData(): TabElementColourData[] {
	return document
		.elementsFromPoint(window.innerWidth / 2, 3)
		.filter(
			(element) =>
				element instanceof HTMLElement &&
				element.offsetWidth >= window.innerWidth * 0.9 &&
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
		return query
			? getElementColour(document.querySelector(query))
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

const darkReaderObserver = new MutationObserver(sendColour);
const metaThemeColourObserver = new MutationObserver(sendColour);
const metaTagObserver = new MutationObserver((mutationList) =>
	mutationList.forEach((mutation) => {
		mutation.addedNodes.forEach((node) => {
			if (
				node instanceof HTMLMetaElement &&
				node.name === "theme-color"
			) {
				sendColour();
				metaThemeColourObserver.observe(node, { attributes: true });
			}
		});
	}),
);
const styleTagObserver = new MutationObserver((mutationList) => {
	if (
		mutationList.some((mutation) =>
			[...mutation.addedNodes, ...mutation.removedNodes].some(
				(node) => node.nodeName === "STYLE",
			),
		)
	) {
		sendColour();
	}
});

/** Enables dynamic colour monitoring using event listeners and observers. */
function enableDynamic(): void {
	["click", "resize", "scroll", "visibilitychange"].forEach((event) =>
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

let dispatchTimeout: ReturnType<typeof setTimeout> | undefined;
let lastSentAt = 0;
const throttleIntervalMs = 250;

/** Sends the current page colour to the background script with throttling. */
async function sendColour() {
	clearTimeout(dispatchTimeout);
	const remaining = throttleIntervalMs + lastSentAt - Date.now();
	const dispatch = async () => {
		if (document.visibilityState !== "visible") return;
		lastSentAt = Date.now();
		try {
			await sendMessageToBackground({
				header: "UPDATE_COLOUR",
				colour: getColourData(),
			});
		} catch {
			console.warn("Failed to send colour to ATBC background.");
		}
	};
	remaining <= 0
		? await dispatch()
		: (dispatchTimeout = setTimeout(() => {
				void dispatch();
			}, remaining));
}

/** Sends colour update if the document has focus. */
async function sendColourRequiresFocus() {
	if (document.hasFocus()) await sendColour();
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

export default defineContentScript({
	matches: ["http://*/*", "https://*/*"],
	main() {
		addMessageListener(handleMessage);
		sendMessageOnLoad();
	},
});
