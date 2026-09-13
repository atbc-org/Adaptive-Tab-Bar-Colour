import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TestContext } from "../types.js";
import {
	compareColour,
	getFrameColour,
	setupTestContext,
	sleep,
} from "../utils.js";

describe("Basic Apply Theme", () => {
	let context: TestContext;
	let cleanup: () => Promise<void>;

	beforeAll(async () => {
		({ context, cleanup } = await setupTestContext());
	});

	afterAll(async () => {
		if (cleanup) await cleanup();
	});

	const colourSet = [
		"rgb(255, 255, 255)",
		"rgb(221, 229, 199)",
		"rgb(105, 27, 32)",
		"rgb(8, 20, 35)",
	];

	for (const expectedColour of colourSet) {
		it(`applies correct frame colour for ${expectedColour}`, async () => {
			const url = `http://127.0.0.1:${context.port}/test`;
			await context.driver.get(
				`${url}?background=${encodeURIComponent(expectedColour)}`,
			);
			await sleep(500);

			const actualColour = await getFrameColour(context.driver);
			expect(actualColour).toBeTruthy();
			expect(
				compareColour(expectedColour, actualColour!),
				`expected: ${expectedColour}, got: ${actualColour}`,
			).toBe(true);
		});
	}
});
