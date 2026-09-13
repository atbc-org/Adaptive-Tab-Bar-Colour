import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import readline from "node:readline";
import { pathToFileURL } from "node:url";
import type { WebDriver } from "selenium-webdriver";
import { Command } from "selenium-webdriver/lib/command.js";
import type { TestCase } from "./types.js";

/** Resolves the extension path to use for tests. */
export async function getWebExtPath(
	dir: string,
	interactive = true,
): Promise<string> {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const files = entries
		.filter((entry) => {
			const entryName = entry.name.toLowerCase();
			return (
				entryName.endsWith(".zip") ||
				entryName.endsWith(".xpi") ||
				(interactive && entry.isDirectory())
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

/** Discovers test cases from spec files in a directory. */
export async function getTestCases(dir: string): Promise<TestCase[]> {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const files = entries
		.filter(
			(entry) =>
				entry.isFile() &&
				entry.name.endsWith(".spec.ts") &&
				!entry.name.startsWith("."),
		)
		.map((entry) => entry.name)
		.sort((a, b) => a.localeCompare(b));

	const testCases: TestCase[] = [];
	for (const specFile of files) {
		const specPath = path.join(dir, specFile);
		const module = await import(specPath);
		const module = await import(pathToFileURL(specPath).href);
		if (!module.testCase)
			throw new Error(`Missing testCase export in ${specFile}`);
		testCases.push(module.testCase as TestCase);
	}
	return testCases;
}

/**
 * Creates a local HTTP server that serves test pages.
 *
 * @example
 * 	const server = await createServer();
 * 	await driver.get("http://127.0.0.1:8080?background=white&theme=white");
 */
export function createServer(port = 8080): Promise<http.Server> {
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
			console.log(`Serving test pages on http://127.0.0.1:${port}`);
			resolve(server);
		});
	});
}

/** Reads the browser frame's accent colour from Firefox chrome context. */
export async function getFrameColour(
	driver: WebDriver,
): Promise<string | null> {
	try {
		await driver.execute(
			new Command("setContext").setParameter("context", "chrome"),
		);
		return await driver.executeScript(() => {
			const style = getComputedStyle(document.documentElement);
			return style.getPropertyValue("--lwt-accent-color").trim() || null;
		});
	} finally {
		await driver.execute(
			new Command("setContext").setParameter("context", "content"),
		);
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

/** Checks if the difference between two colour strings is within tolerence. */
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
