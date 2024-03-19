import { defineConfig } from "cypress";

const port = process.env.HTTP_PORT || "8080";

export default defineConfig({
    screenshotOnRunFailure: false,
    video: false,
    e2e: {
        baseUrl: `http://localhost:${port}`,
        setupNodeEvents(on, config) {
            /* defer importing this as Jenkins tries to load the config before
             * the plugin has been built */
            const getToMatchScreenshotsPlugin = require("./dist/plugin");
            config = getToMatchScreenshotsPlugin(on, config);
            return config;
        },
    },
});
