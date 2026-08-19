import {defineConfig} from "vitest/config";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    resolve: {
        // Mirror the "@/*" -> "./src/*" mapping in tsconfig.json, so tests can
        // import modules the same way application code does.
        alias: {"@": path.resolve(root, "src")},
    },
    test: {
        include: ["src/**/*.test.ts"],
    },
});
