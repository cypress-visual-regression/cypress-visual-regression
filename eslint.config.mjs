import defaultConfig, { defineConfig } from "@forsakringskassan/eslint-config";
import jestConfig from "@forsakringskassan/eslint-config-jest";
import typescriptConfig from "@forsakringskassan/eslint-config-typescript";

export default [
    defineConfig({
        name: "Ignored files",
        ignores: [
            "**/coverage/**",
            "**/dist/**",
            "**/node_modules/**",
            "**/temp/**",
        ],
    }),

    ...defaultConfig,
    typescriptConfig(),
    jestConfig(),

    defineConfig({
        name: "local/cypress",
        languageOptions: {
            globals: {
                Cypress: "readonly",
                cy: "readonly",
                it: "readonly",
            },
        },
    }),

    defineConfig({
        name: "local/technical-debt",
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/unified-signatures": "off",
            "import/no-unresolved": "off",
            "tsdoc/syntax": "off",
        },
    }),
];
