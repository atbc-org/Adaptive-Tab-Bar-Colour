import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { Builder } from "selenium-webdriver";
import firefox, {
	type Driver as FirefoxDriver,
} from "selenium-webdriver/firefox.js";
import type { TestContext } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const OUTPUT_DIR = path.join(__dirname, "..", ".output");
export const SERVER_PORT = 8080;

/** Sleeps for a given duration in milliseconds. */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Resolves the extension path to use for tests. */
export async function getWebExtPath(
	dir: string,
	interactive = true,
): Promise<string> {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const files = entries
		.filter((entry) => {
			const entryName = entry.name.toLowerCase();
			if (entryName.includes("source")) return false;
			return (
				entryName.endsWith(".zip") ||
				entryName.endsWith(".xpi") ||
				entry.isDirectory()
			);
		})
		.map((entry) => entry.name)
		.sort((a, b) => a.localeCompare(b));

	if (files.length === 0)
		throw new Error(`No extension builds found in ${dir}`);

	const webExtDir =
		interactive && process.stdin.isTTY
			? await getSelection(files)
			: files[0]!;
	return path.join(dir, webExtDir);
}

/** Prompts the user to select an option from a list. */
export function getSelection(options: string[]): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		let index = 0;
		const input = process.stdin;
		const output = process.stdout;

		const render = () => {
			readline.cursorTo(output, 0, 0);
			readline.clearScreenDown(output);
			output.write("Select extension build:\n\n");
			options.forEach((option, position) => {
				const prefix =
					position === index
						? `\u001b[34m> ${option}\u001b[0m`
						: `  ${option}`;
				output.write(`${prefix}\n`);
			});
			output.write("\nUse Up/Down, Enter to select.\n");
		};

		const cleanup = () => {
			input.setRawMode(false);
			input.pause();
			input.off("data", onData);
			readline.cursorTo(output, 0, 0);
			readline.clearScreenDown(output);
		};

		const onData = (data: Buffer) => {
			const key = data.toString();
			switch (key) {
				case "\u0003":
					cleanup();
					reject(new Error("Selection cancelled"));
					return;
				case "\r":
					const selection = options[index];
					cleanup();
					if (selection === undefined) {
						reject(new Error("Invalid selection index"));
					} else {
						resolve(selection);
					}
					return;
				case "\u001b[A":
					index = (index - 1 + options.length) % options.length;
					render();
					return;
				case "\u001b[B":
					index = (index + 1) % options.length;
					render();
					return;
				default:
					return;
			}
		};

		input.setRawMode(true);
		input.resume();
		input.on("data", onData);
		render();
	});
}

/** Creates a local HTTP server that serves test pages. */
export function createServer(port = SERVER_PORT): Promise<http.Server> {
	return new Promise<http.Server>((resolve, reject) => {
		const server = http.createServer((req, res) => {
			const url = new URL(
				req.url || "/",
				`http://127.0.0.1:${port}/test`,
			);
			const backgroundColour = url.searchParams.get("background");
			const themeColour = url.searchParams.get("theme");

			const bodyStyles = `margin:0; padding:0; width: 100%; height: 100%; ${
				backgroundColour ? `background:${backgroundColour};` : ""
			}`;
			const themeMetaTag = themeColour
				? `<meta name="theme-color" content="${themeColour}">`
				: "";

			res.writeHead(200, { "Content-Type": "text/html" });
			res.end(`
				<!DOCTYPE html>
				<html>
					<head>
						<meta charset="UTF-8">
						<title>test</title>
						${themeMetaTag}
					</head>
					<body style="${bodyStyles}">
						<div id="keepalive"></div>
						<script>
							setInterval(() => {
								document.getElementById("keepalive").textContent = Date.now();
							}, 5000);
						</script>
					</body>
				</html>
			`);
		});

		server.on("error", reject);
		server.listen(port, "127.0.0.1", () => {
			resolve(server);
		});
	});
}

/** Launches a Firefox instance with an isolated temporary profile. */
export async function launchBrowser(
	options: { headless?: boolean } = {},
): Promise<{ driver: FirefoxDriver; profileDir: string }> {
	const headless =
		options.headless ??
		(process.env.HEADLESS === "true" || process.env.CI === "true");

	const profileDir = await fs.mkdtemp(
		path.join(os.tmpdir(), "firefox-test-profile-"),
	);

	const firefoxOptions = new firefox.Options();
	firefoxOptions.setProfile(profileDir);
	firefoxOptions.setPreference("browser.tabs.warnOnClose", false);
	firefoxOptions.setPreference("browser.warnOnQuit", false);
	firefoxOptions.setPreference("browser.tabs.closeWindowWithLastTab", false);
	firefoxOptions.setPreference("services.sync.engine.tabs", false);
	firefoxOptions.setPreference("services.sync.engine.prefs", false);
	firefoxOptions.setPreference("toolkit.startup.max_resumed_crashes", -1);
	firefoxOptions.addArguments("--new-instance", "-no-remote");

	if (headless) {
		firefoxOptions.addArguments("-headless");
	}

	const service = new firefox.ServiceBuilder().addArguments(
		"--allow-system-access",
	);

	const driver = (await new Builder()
		.forBrowser("firefox")
		.setFirefoxOptions(firefoxOptions)
		.setFirefoxService(service)
		.build()) as FirefoxDriver;

	await driver.get("about:blank");
	return { driver, profileDir };
}

/** Cleans up browser and temporary profile directory. */
export async function cleanupBrowser(
	driver: FirefoxDriver | null,
	profileDir?: string,
): Promise<void> {
	if (driver) {
		try {
			await driver.quit();
		} catch {}
	}
	if (profileDir) {
		try {
			await fs.rm(profileDir, { recursive: true, force: true });
		} catch {}
	}
}

/** Resolves the moz-extension:// base URL for an installed addon. */
export async function getExtensionUrl(
	driver: FirefoxDriver,
	extensionId: string,
): Promise<string> {
	try {
		await driver.setContext(firefox.Context.CHROME);
		const uuidsJson = (await driver.executeScript(() => {
			return Services.prefs.getStringPref(
				"extensions.webextensions.uuids",
				"{}",
			);
		})) as string;
		const uuids = JSON.parse(uuidsJson) as Record<string, string>;
		const uuid = uuids[extensionId];
		if (!uuid)
			throw new Error(`UUID not found for extension ${extensionId}`);
		return `moz-extension://${uuid}`;
	} finally {
		await driver.setContext(firefox.Context.CONTENT);
	}
}

/** Reads the browser frame's accent colour from Firefox chrome context. */
export async function getFrameColour(
	driver: FirefoxDriver,
): Promise<string | null> {
	try {
		await driver.setContext(firefox.Context.CHROME);
		return await driver.executeScript(() => {
			const style = getComputedStyle(document.documentElement);
			return style.getPropertyValue("--lwt-accent-color").trim() || null;
		});
	} finally {
		await driver.setContext(firefox.Context.CONTENT);
	}
}

/** Sets up server, browser, and installs the extension for testing. */
export async function setupTestContext(
	port = SERVER_PORT,
): Promise<{ context: TestContext; cleanup: () => Promise<void> }> {
	const headless =
		process.env.HEADLESS === "true" || process.env.CI === "true";
	const server = await createServer(port);
	const webExtPath = await getWebExtPath(OUTPUT_DIR, !headless);
	const { driver, profileDir } = await launchBrowser({ headless });

	let addonId: string | null = null;
	try {
		addonId = await driver.installAddon(webExtPath, true);
		await sleep(500);
		const extensionUrl = await getExtensionUrl(driver, addonId);
		const context: TestContext = {
			driver,
			optionsUrl: `${extensionUrl}/options.html`,
			popupUrl: `${extensionUrl}/popup.html`,
			port,
		};
		const cleanup = async () => {
			if (addonId) {
				try {
					await driver.uninstallAddon(addonId);
				} catch {}
			}
			await cleanupBrowser(driver, profileDir);
			server.close();
		};
		return { context, cleanup };
	} catch (error) {
		if (addonId) {
			try {
				await driver.uninstallAddon(addonId);
			} catch {}
		}
		await cleanupBrowser(driver, profileDir);
		server.close();
		throw error;
	}
}

interface ColourChannel {
	r: number;
	g: number;
	b: number;
	a: number;
}

/** Parses a colour string into RGBA channel values. */
function parseColourString(colour: string): ColourChannel {
	const trimmed = colour.trim();
	const hexMatch = trimmed.match(/^#([0-9a-f]{3,8})$/i);
	const channel: ColourChannel = { r: 0, g: 0, b: 0, a: 1 };
	if (hexMatch && hexMatch[1]) {
		const hex = hexMatch[1];
		if (hex.length === 3 || hex.length === 4) {
			channel.r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
			channel.g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
			channel.b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
			if (hex.length === 4)
				channel.a = parseInt(hex.charAt(3) + hex.charAt(3), 16) / 255;
		} else if (hex.length === 6 || hex.length === 8) {
			channel.r = parseInt(hex.slice(0, 2), 16);
			channel.g = parseInt(hex.slice(2, 4), 16);
			channel.b = parseInt(hex.slice(4, 6), 16);
			if (hex.length === 8)
				channel.a = parseInt(hex.slice(6, 8), 16) / 255;
		}
	} else {
		const rgbMatch = trimmed.match(/^rgba?\((.+)\)$/i);
		if (rgbMatch && rgbMatch[1]) {
			const parts = rgbMatch[1].split(",").map((part) => part.trim());
			if (parts[0]) {
				channel.r = parts[0].endsWith("%")
					? (parseFloat(parts[0]) / 100) * 255
					: parseFloat(parts[0]);
			}
			if (parts[1]) {
				channel.g = parts[1].endsWith("%")
					? (parseFloat(parts[1]) / 100) * 255
					: parseFloat(parts[1]);
			}
			if (parts[2]) {
				channel.b = parts[2].endsWith("%")
					? (parseFloat(parts[2]) / 100) * 255
					: parseFloat(parts[2]);
			}
			if (parts[3]) {
				channel.a = parts[3].endsWith("%")
					? parseFloat(parts[3]) / 100
					: parseFloat(parts[3]);
			}
		}
	}
	return channel;
}

/** Checks if the difference between two colour strings is within tolerance. */
export function compareColour(
	colour1: string,
	colour2: string,
	tolerance = 5,
): boolean {
	const channel1 = parseColourString(colour1);
	const channel2 = parseColourString(colour2);
	const alphaTolerance = tolerance / 255;
	return (
		Math.abs((channel1.r ?? 0) - (channel2.r ?? 0)) <= tolerance &&
		Math.abs((channel1.g ?? 0) - (channel2.g ?? 0)) <= tolerance &&
		Math.abs((channel1.b ?? 0) - (channel2.b ?? 0)) <= tolerance &&
		Math.abs((channel1.a ?? 1) - (channel2.a ?? 1)) <= alphaTolerance
	);
}

/** Compares two records for key and value differences. */
export function compareRecord(
	record1: Record<string, unknown>,
	record2: Record<string, unknown>,
): { extraKeys1: string[]; extraKeys2: string[]; mismatchedValues: string[] } {
	const keys1 = Object.keys(record1);
	const keys2 = Object.keys(record2);
	const extraKeys1 = keys1.filter((key) => !(key in record2));
	const extraKeys2 = keys2.filter((key) => !(key in record1));
	const mismatchedValues: string[] = [];
	for (const key of keys1.filter((key1) => key1 in record2)) {
		const actualValue = JSON.stringify(record2[key]);
		const expectedValue = JSON.stringify(record1[key]);
		if (actualValue !== expectedValue) {
			mismatchedValues.push(
				`${key} - expected: ${expectedValue}, got: ${actualValue}`,
			);
		}
	}
	return { extraKeys1, extraKeys2, mismatchedValues };
}
