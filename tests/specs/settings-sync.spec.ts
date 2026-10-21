import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { By, until } from "selenium-webdriver";
import type { TestContext } from "../types.js";
import { OUTPUT_DIR, getWebExtPath, setupTestContext } from "../utils.js";

interface SyncTestWindow extends Window {
	browser: typeof browser;
	originalSyncSet?: typeof browser.storage.sync.set;
	originalSyncGet?: typeof browser.storage.sync.get;
	releaseSyncWrite?: () => void;
	syncWriteStarted?: boolean;
	failedSyncWrites?: number;
	failedLocalReads?: number;
	pendingSync?: Promise<unknown>;
}

describe("Settings sync", () => {
	let context: TestContext;
	let cleanup: () => Promise<void>;

	beforeAll(async () => {
		({ context, cleanup } = await setupTestContext(8081));
		await context.driver
			.manage()
			.setTimeouts({ pageLoad: 5000, script: 5000 });
		await context.driver.get(context.optionsUrl);
		await context.driver.wait(
			until.elementLocated(By.css('nav button[title="Advanced"]')),
			5000,
		);
		await context.driver
			.findElement(By.css('nav button[title="Advanced"]'))
			.click();
	});

	afterAll(async () => {
		if (cleanup) await cleanup();
	});

	const request = (enabled: boolean, choice?: "local" | "cloud") =>
		context.driver.executeScript(
			async (enabled: boolean, choice?: "local" | "cloud") =>
				browser.runtime.sendMessage({
					header: "SETTINGS_SYNC",
					enabled,
					choice,
				}),
			enabled,
			choice,
		);

	const storage = () =>
		context.driver.executeScript(async () => ({
			local: await browser.storage.local.get(),
			cloud: await browser.storage.sync.get(),
		})) as Promise<{
			local: Record<string, unknown>;
			cloud: Record<string, unknown>;
		}>;

	it("defaults on, seeds cloud, and keeps device state out of cloud", async () => {
		await context.driver.wait(
			async () => (await storage()).cloud.minContrast_light === 90,
			5000,
		);
		const { local, cloud } = await storage();
		expect(local.syncSettings).toBe(true);
		expect(cloud.syncSettings).toBeUndefined();
		expect(cloud.syncBaseline).toBeUndefined();
		expect(cloud.lastSave).toBeUndefined();
	});

	it("pauses both upload and download without deleting cloud settings", async () => {
		expect(await request(false)).toEqual({ status: "disabled" });
		await context.driver.executeScript(async () => {
			await browser.storage.local.set({
				minContrast_light: 100,
				lastSave: Date.now() + 100,
			});
			await browser.storage.sync.set({ minContrast_dark: 55 });
		});
		const { local, cloud } = await storage();
		expect(local.syncSettings).toBe(false);
		expect(local.minContrast_dark).toBe(45);
		expect(cloud.minContrast_light).toBe(90);
		expect(cloud.minContrast_dark).toBe(55);
	});

	it("asks before enabling conflicting settings and uses fresh local settings", async () => {
		expect(await request(true)).toEqual({ status: "conflict" });
		expect((await storage()).local.syncSettings).toBe(false);
		await context.driver.executeScript(async () => {
			await browser.storage.local.set({
				minContrast_light: 110,
				lastSave: Date.now() + 200,
			});
		});
		expect(await request(true, "local")).toEqual({ status: "enabled" });
		const { local, cloud } = await storage();
		expect(local.syncSettings).toBe(true);
		expect(cloud.minContrast_light).toBe(110);
		expect(cloud.minContrast_dark).toBe(45);
	});

	it("downloads remote updates without echoing local-only metadata", async () => {
		await context.driver.executeScript(async () => {
			await browser.storage.sync.set({ minContrast_dark: 60 });
		});
		await context.driver.wait(
			async () => (await storage()).local.minContrast_dark === 60,
			5000,
		);
		const { cloud } = await storage();
		expect(cloud.lastSave).toBeUndefined();
		expect(cloud.syncSettings).toBeUndefined();
	});

	it("offers both choices in Confirm and keeps cloud when selected", async () => {
		await request(false);
		await context.driver.executeScript(async () => {
			await browser.storage.sync.set({ minContrast_light: 120 });
		});
		const toggle = await context.driver.findElement(
			By.css('button[aria-label="Sync settings to cloud"]'),
		);
		await context.driver.wait(
			async () => (await toggle.getAttribute("aria-checked")) === "false",
			5000,
		);
		await toggle.click();
		const localChoice = By.xpath(
			'//button[normalize-space()="Keep local"]',
		);
		const cloudChoice = By.xpath(
			'//button[normalize-space()="Keep cloud"]',
		);
		await context.driver.wait(until.elementLocated(localChoice), 5000);
		expect(await toggle.getAttribute("aria-checked")).toBe("false");
		await context.driver.findElement(cloudChoice).click();
		await context.driver.wait(
			async () => (await storage()).local.minContrast_light === 120,
			5000,
		);
		expect((await storage()).local.syncSettings).toBe(true);
	});

	it("enables matching settings without showing Confirm", async () => {
		await request(false);
		expect(await request(true)).toEqual({ status: "enabled" });
	});

	it("uploads each rule separately and removes deleted cloud rules", async () => {
		const rule = {
			headerType: "URL",
			header: "example.com",
			type: "COLOUR",
			value: "#123456",
			scheme: "both",
		};
		await context.driver.executeScript(async (rule: unknown) => {
			await browser.storage.local.set({
				ruleList: { 1: rule },
				lastSave: Date.now() + 300,
			});
		}, rule);
		await context.driver.wait(
			async () => !!(await storage()).cloud["ruleList:1"],
			5000,
		);
		expect((await storage()).cloud["ruleList:1"]).toEqual(rule);
		expect((await storage()).cloud.ruleList).toBeUndefined();
		await context.driver.executeScript(async () => {
			await browser.storage.local.set({
				ruleList: {},
				lastSave: Date.now() + 400,
			});
		});
		await context.driver.wait(
			async () => !("ruleList:1" in (await storage()).cloud),
			5000,
		);
	});

	it("initialises empty cloud without a conflict", async () => {
		await request(false);
		await context.driver.executeScript(async () =>
			browser.storage.sync.clear(),
		);
		expect(await request(true)).toEqual({ status: "enabled" });
		expect((await storage()).cloud.minContrast_light).toBe(120);
	});

	it("preserves edits made while an enable upload is in flight", async () => {
		await request(false);
		await context.driver.executeScript(async () => {
			await browser.storage.local.set({
				minContrast_light: 130,
				lastSave: Date.now() + 500,
			});
			const background =
				(await browser.runtime.getBackgroundPage()) as SyncTestWindow;
			const original = background.browser.storage.sync.set.bind(
				background.browser.storage.sync,
			);
			background.browser.storage.sync.set = (
				items: Record<string, unknown>,
			) =>
				new Promise<void>((resolve, reject) => {
					background.syncWriteStarted = true;
					background.releaseSyncWrite = () => {
						background.browser.storage.sync.set = original;
						original(items).then(resolve, reject);
					};
				});
			(window as unknown as SyncTestWindow).pendingSync =
				browser.runtime.sendMessage({
					header: "SETTINGS_SYNC",
					enabled: true,
					choice: "local",
				});
		});
		await context.driver.wait(
			async () =>
				context.driver.executeScript(
					async () =>
						!!(
							(await browser.runtime.getBackgroundPage()) as SyncTestWindow
						).syncWriteStarted,
				),
			5000,
		);
		await context.driver.executeScript(async () => {
			await browser.storage.local.set({
				minContrast_light: 140,
				lastSave: Date.now() + 600,
			});
			(
				(await browser.runtime.getBackgroundPage()) as SyncTestWindow
			).releaseSyncWrite?.();
			await (window as unknown as SyncTestWindow).pendingSync;
		});
		const { local, cloud } = await storage();
		expect(local.minContrast_light).toBe(140);
		expect(cloud.minContrast_light).toBe(140);
	});

	it("retries when newer cloud settings arrive during reconciliation", async () => {
		await context.driver.executeScript(async () => {
			const background =
				(await browser.runtime.getBackgroundPage()) as SyncTestWindow;
			const original = background.browser.storage.sync.get.bind(
				background.browser.storage.sync,
			);
			let reads = 0;
			background.browser.storage.sync.get = async (
				keys?: string | string[] | Record<string, unknown> | null,
			) => {
				if (++reads === 2) {
					background.browser.storage.sync.get = original;
					await background.browser.storage.sync.set({
						minContrast_dark: 75,
					});
				}
				return original(keys);
			};
			await browser.storage.local.set({
				minContrast_light: 145,
				lastSave: Date.now() + 700,
			});
		});
		await context.driver.wait(async () => {
			const { local, cloud } = await storage();
			return (
				local.minContrast_dark === 75 && cloud.minContrast_light === 145
			);
		}, 5000);
		expect((await storage()).cloud.minContrast_dark).toBe(75);
	});

	it("does not enable sync or discard local settings when cloud writes fail", async () => {
		await request(false);
		await context.driver.executeScript(async () => {
			await browser.storage.local.set({
				minContrast_light: 150,
				lastSave: Date.now() + 800,
			});
			const background =
				(await browser.runtime.getBackgroundPage()) as SyncTestWindow;
			background.originalSyncSet = background.browser.storage.sync.set;
			background.browser.storage.sync.set = async () => {
				background.failedSyncWrites =
					(background.failedSyncWrites ?? 0) + 1;
				throw new Error("Simulated sync quota failure");
			};
		});
		expect(await request(true, "local")).toEqual({ status: "error" });
		const { local, cloud } = await storage();
		expect(local.syncSettings).toBe(false);
		expect(local.minContrast_light).toBe(150);
		expect(cloud.minContrast_light).toBe(145);
		await context.driver.executeScript(async () => {
			const background =
				(await browser.runtime.getBackgroundPage()) as SyncTestWindow;
			background.browser.storage.sync.set = background.originalSyncSet!;
		});
	});

	it("recovers unsynced local edits after restarting the extension", async () => {
		await request(true, "local");
		await context.driver.executeScript(async () => {
			const background =
				(await browser.runtime.getBackgroundPage()) as SyncTestWindow;
			background.failedSyncWrites = 0;
			background.browser.storage.sync.set = async () => {
				background.failedSyncWrites =
					(background.failedSyncWrites ?? 0) + 1;
				throw new Error("Simulated offline storage");
			};
			await browser.storage.local.set({
				minContrast_light: 160,
				lastSave: Date.now() + 900,
			});
		});
		await context.driver.wait(
			async () =>
				context.driver.executeScript(
					async () =>
						!!(
							(await browser.runtime.getBackgroundPage()) as SyncTestWindow
						).failedSyncWrites,
				),
			5000,
		);
		expect((await storage()).cloud.minContrast_light).toBe(150);
		await context.driver.switchTo().newWindow("tab");
		await context.driver.get("about:blank");
		const retainedHandle = await context.driver.getWindowHandle();
		await context.driver.installAddon(
			await getWebExtPath(OUTPUT_DIR, false),
			true,
		);
		await context.driver.wait(async () => {
			try {
				await context.driver.switchTo().window(retainedHandle);
				await context.driver.get(context.optionsUrl);
				return (await storage()).cloud.minContrast_light === 160;
			} catch {
				return false;
			}
		}, 10000);
		expect((await storage()).local.minContrast_light).toBe(160);
		await context.driver
			.findElement(By.css('nav button[title="Advanced"]'))
			.click();
	});

	it("keeps sync disabled after reloading options and resetting settings", async () => {
		await request(false);
		await context.driver.navigate().refresh();
		await context.driver
			.findElement(By.css('nav button[title="Advanced"]'))
			.click();
		await context.driver
			.findElement(
				By.xpath('//button[normalize-space()="Reset all settings"]'),
			)
			.click();
		await context.driver
			.findElement(By.xpath('//button[normalize-space()="Yes"]'))
			.click();
		await context.driver.wait(
			async () => (await storage()).local.minContrast_light === 90,
			5000,
		);
		expect((await storage()).local.syncSettings).toBe(false);
		expect((await storage()).cloud.minContrast_light).toBe(160);
	});
	it("keeps the local sync toggle when importing a backup", async () => {
		await context.driver.executeScript(async () => {
			const local = await browser.storage.local.get();
			const file = new File(
				[
					JSON.stringify({
						...local,
						syncSettings: true,
						minContrast_light: 135,
					}),
				],
				"settings.json",
				{ type: "application/json" },
			);
			const transfer = new DataTransfer();
			transfer.items.add(file);
			const input =
				document.querySelector<HTMLInputElement>('input[type="file"]')!;
			input.files = transfer.files;
			input.dispatchEvent(new Event("change", { bubbles: true }));
		});
		await context.driver.wait(
			async () => (await storage()).local.minContrast_light === 135,
			5000,
		);
		expect((await storage()).local.syncSettings).toBe(false);
		expect((await storage()).cloud.minContrast_light).toBe(160);
	});

	it("restores cloud settings when there are no local preferences", async () => {
		await context.driver.executeScript(async () =>
			browser.storage.local.clear(),
		);
		await context.driver.wait(async () => {
			const { local } = await storage();
			return (
				local.minContrast_light === 160 && local.syncSettings === true
			);
		}, 5000);
	});

	it("shows an error and stays off when cloud settings cannot be read", async () => {
		await request(false);
		const { cloud } = await storage();
		await context.driver.executeScript(async () =>
			browser.storage.sync.set({ version: "invalid" }),
		);
		const toggle = await context.driver.findElement(
			By.css('button[aria-label="Sync settings to cloud"]'),
		);
		await context.driver.wait(
			async () => (await toggle.getAttribute("aria-checked")) === "false",
			5000,
		);
		await toggle.click();
		await context.driver.wait(
			until.elementLocated(By.css('[role="alert"]')),
			5000,
		);
		expect((await storage()).local.syncSettings).toBe(false);
		expect((await storage()).local.minContrast_light).toBe(160);
		expect((await storage()).cloud.version).toBe("invalid");
		await context.driver.executeScript(
			async (version: unknown) => browser.storage.sync.set({ version }),
			cloud.version,
		);
	});
	it("adopts legacy cloud keys and preserves null rule placeholders", async () => {
		await context.driver.executeScript(async () => {
			await browser.storage.sync.remove("ruleListKeys");
			await browser.storage.sync.set({
				"ruleList:1": null,
				"ruleList:2": {
					headerType: "URL",
					header: "legacy.example",
					type: "COLOUR",
					value: "#123456",
					scheme: "both",
				},
			});
		});
		expect(await request(true, "cloud")).toEqual({ status: "enabled" });
		const { local, cloud } = await storage();
		expect((local.ruleList as Record<string, unknown>)["1"]).toBeNull();
		expect((local.ruleList as Record<string, unknown>)["2"]).toMatchObject({
			header: "legacy.example",
		});
		expect(cloud["ruleList:1"]).toBeNull();
		expect(cloud.ruleListKeys).toEqual(["ruleList:1", "ruleList:2"]);
		expect(local["local:ruleList"]).toBeUndefined();
	});

	it("waits for rule values when the cloud index arrives first", async () => {
		await context.driver.executeScript(async () => {
			await browser.storage.sync.set({
				ruleListKeys: ["ruleList:1", "ruleList:2", "ruleList:3"],
			});
		});
		// Let reconciliation observe an incomplete sync delivery.
		await new Promise((resolve) => setTimeout(resolve, 100));
		expect((await storage()).local.ruleList).toHaveProperty("2");
		await context.driver.executeScript(async () => {
			await browser.storage.sync.set({
				"ruleList:3": {
					headerType: "URL",
					header: "index-first.example",
					type: "COLOUR",
					value: "#234567",
					scheme: "both",
				},
			});
		});
		await context.driver.wait(
			async () =>
				!!((await storage()).local.ruleList as Record<string, unknown>)[
					"3"
				],
			5000,
		);
	});

	it("preserves new rule data arriving before its membership index", async () => {
		await context.driver.executeScript(async () => {
			await browser.storage.sync.set({
				minContrast_dark: 80,
				"ruleList:4": {
					headerType: "URL",
					header: "data-first.example",
					type: "COLOUR",
					value: "#345678",
					scheme: "both",
				},
			});
		});
		await context.driver.wait(
			async () => (await storage()).local.minContrast_dark === 80,
			5000,
		);
		const { local, cloud } = await storage();
		expect(cloud["ruleList:4"]).toMatchObject({
			header: "data-first.example",
		});
		expect(
			(local.ruleList as Record<string, unknown>)["4"],
		).toBeUndefined();
		await context.driver.executeScript(async () => {
			await browser.storage.sync.set({
				ruleListKeys: [
					"ruleList:1",
					"ruleList:2",
					"ruleList:3",
					"ruleList:4",
				],
			});
		});
		await context.driver.wait(
			async () =>
				!!((await storage()).local.ruleList as Record<string, unknown>)[
					"4"
				],
			5000,
		);
	});

	it("handles rule deletion before or after the membership index", async () => {
		await context.driver.executeScript(async () =>
			browser.storage.sync.remove("ruleList:4"),
		);
		await new Promise((resolve) => setTimeout(resolve, 100));
		expect((await storage()).local.ruleList).toHaveProperty("4");
		await context.driver.executeScript(async () =>
			browser.storage.sync.set({
				ruleListKeys: ["ruleList:1", "ruleList:2", "ruleList:3"],
			}),
		);
		await context.driver.wait(
			async () =>
				!(
					"4" in
					((await storage()).local.ruleList as Record<
						string,
						unknown
					>)
				),
			5000,
		);
		await context.driver.executeScript(async () =>
			browser.storage.sync.set({
				ruleListKeys: ["ruleList:1", "ruleList:2"],
			}),
		);
		await context.driver.wait(
			async () =>
				!(
					"3" in
					((await storage()).local.ruleList as Record<
						string,
						unknown
					>)
				),
			5000,
		);
		expect((await storage()).cloud).toHaveProperty("ruleList:3");
		await context.driver.executeScript(async () =>
			browser.storage.sync.remove("ruleList:3"),
		);
	});
	it("retries pending preference edits after a transient storage read failure", async () => {
		await request(false);
		const before = (await storage()).local;
		const dynamic = await context.driver.findElement(
			By.css('button[aria-label="Dynamic colour update"]'),
		);
		await context.driver.wait(
			async () =>
				(await dynamic.getAttribute("aria-checked")) ===
				String(before.dynamic),
			5000,
		);
		await context.driver.executeScript(() => {
			const original = browser.storage.local.get.bind(
				browser.storage.local,
			);
			browser.storage.local.get = async () => {
				browser.storage.local.get = original;
				(window as unknown as SyncTestWindow).failedLocalReads = 1;
				throw new Error("Simulated transient read failure");
			};
		});
		await dynamic.click();
		await context.driver.wait(
			async () =>
				context.driver.executeScript(
					() =>
						(window as unknown as SyncTestWindow)
							.failedLocalReads === 1,
				),
			5000,
		);
		expect((await storage()).local.dynamic).toBe(before.dynamic);
		await context.driver
			.findElement(
				By.css('button[aria-label="Ignore website’s theme colour"]'),
			)
			.click();
		await context.driver.wait(async () => {
			const { local } = await storage();
			return (
				local.dynamic === !before.dynamic &&
				local.noThemeColour === !before.noThemeColour
			);
		}, 5000);
	});
});
