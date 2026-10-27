import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { By, until } from "selenium-webdriver";
import type { TestContext } from "../types.js";
import { setupTestContext, sleep } from "../utils.js";

describe("Sync Prefs", () => {
	let context: TestContext;
	let cleanup: () => Promise<void>;

	beforeAll(async () => {
		({ context, cleanup } = await setupTestContext());
		await context.driver.get(context.optionsUrl);
		await sleep(500);
		const advancedTabButton = await context.driver.wait(
			until.elementLocated(By.css('nav button[title="Advanced"]')),
			5000,
		);
		await advancedTabButton.click();
		await sleep(300);
	});

	afterAll(async () => {
		if (cleanup) await cleanup();
	});

	it("mirrors local changes to sync storage when sync is true", async () => {
		const dynamicSwitch = await context.driver.findElement(
			By.css('button[role="switch"][aria-label="Dynamic colour update"]'),
		);
		await dynamicSwitch.click();
		await sleep(300);

		const syncValue = await context.driver.executeScript(async () => {
			const res = await browser.storage.sync.get("advanced:dynamic");
			return res["advanced:dynamic"];
		});
		expect(syncValue).toBe(false);

		const syncSettingsInSync = await context.driver.executeScript(
			async () => {
				const res = await browser.storage.sync.get("device:sync");
				return res["device:sync"] ?? null;
			},
		);
		expect(syncSettingsInSync).toBeNull();
	});

	it("does not mirror to sync storage when sync is false", async () => {
		const syncSwitch = await context.driver.findElement(
			By.css(
				'button[role="switch"][aria-label="Sync settings to cloud"]',
			),
		);
		await syncSwitch.click();
		await sleep(300);

		const localSyncState = await context.driver.executeScript(async () => {
			const res = await browser.storage.local.get("device:sync");
			return res["device:sync"];
		});
		expect(localSyncState).toBe(false);

		const dynamicSwitch = await context.driver.findElement(
			By.css('button[role="switch"][aria-label="Dynamic colour update"]'),
		);
		await dynamicSwitch.click();
		await sleep(300);

		const syncValue = await context.driver.executeScript(async () => {
			const res = await browser.storage.sync.get("advanced:dynamic");
			return res["advanced:dynamic"];
		});
		expect(syncValue).toBe(false);
	});

	it("detects conflict and keeps local settings when requested", async () => {
		const syncSwitch = await context.driver.findElement(
			By.css(
				'button[role="switch"][aria-label="Sync settings to cloud"]',
			),
		);
		await syncSwitch.click();
		await sleep(300);

		const keepLocalButton = await context.driver.wait(
			until.elementLocated(
				By.xpath("//button[normalize-space()='Keep local']"),
			),
			3000,
		);
		await keepLocalButton.click();
		await sleep(300);

		const syncValue = await context.driver.executeScript(async () => {
			const res = await browser.storage.sync.get("advanced:dynamic");
			return res["advanced:dynamic"];
		});
		expect(syncValue).toBe(true);
	});

	it("resolves conflict and keeps cloud settings when requested", async () => {
		const syncSwitch = await context.driver.findElement(
			By.css(
				'button[role="switch"][aria-label="Sync settings to cloud"]',
			),
		);
		await syncSwitch.click();
		await sleep(300);

		const dynamicSwitch = await context.driver.findElement(
			By.css('button[role="switch"][aria-label="Dynamic colour update"]'),
		);
		await dynamicSwitch.click();
		await sleep(300);

		await syncSwitch.click();
		await sleep(300);

		const keepCloudButton = await context.driver.wait(
			until.elementLocated(
				By.xpath("//button[normalize-space()='Keep cloud']"),
			),
			3000,
		);
		await keepCloudButton.click();
		await sleep(300);

		const localValue = await context.driver.executeScript(async () => {
			const res = await browser.storage.local.get("advanced:dynamic");
			return res["advanced:dynamic"];
		});
		expect(localValue).toBe(true);
	});

	it("propagates external sync storage changes to local storage", async () => {
		await context.driver.executeScript(async () => {
			await browser.storage.sync.set({
				"advanced:homeBackground_light": "#fedcba",
			});
		});
		await sleep(300);

		const localValue = await context.driver.executeScript(async () => {
			const res = await browser.storage.local.get(
				"advanced:homeBackground_light",
			);
			return res["advanced:homeBackground_light"];
		});
		expect(localValue).toBe("#fedcba");
	});

	it("remains off when sync preference is disabled and user clicks outside", async () => {
		const syncSwitch = await context.driver.findElement(
			By.css(
				'button[role="switch"][aria-label="Sync settings to cloud"]',
			),
		);
		const isChecked =
			(await syncSwitch.getAttribute("aria-checked")) === "true";
		if (!isChecked) {
			await syncSwitch.click();
			await sleep(300);
		}

		await syncSwitch.click();
		await sleep(300);

		const heading = await context.driver.findElement(
			By.id("advanced-backup"),
		);
		await heading.click();
		await context.driver.executeScript(() => {
			window.dispatchEvent(new Event("blur"));
			document.dispatchEvent(new Event("blur"));
		});
		await sleep(300);

		const localSyncState = await context.driver.executeScript(async () => {
			const res = await browser.storage.local.get("device:sync");
			return res["device:sync"];
		});
		expect(localSyncState).toBe(false);
	});
});
