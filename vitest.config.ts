import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["tests/specs/**/*.spec.ts"],
		fileParallelism: false,
		maxConcurrency: 1,
		testTimeout: 60000,
		hookTimeout: 60000,
	},
});
