import { defineConfig } from "cypress";

export default defineConfig({
    screenshotOnRunFailure: false,
    video: false,
    e2e: {
        setupNodeEvents(on, config) {
            /* defer importing this as Jenkins tries to load the config before
             * the plugin has been built */
            const getToMatchScreenshotsPlugin = require("./dist/plugin");
            config = getToMatchScreenshotsPlugin(on, config);
            return config;
        },
    },
});
