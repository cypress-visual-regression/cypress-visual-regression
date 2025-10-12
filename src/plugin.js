const fs = require("node:fs");
const fsPromises = require("node:fs/promises");
const path = require("path");

const { getSubfolderName } = require("./get-subfolder-name");
const { compareImages } = require("./utils");

/** @type {string} */
let CYPRESS_SCREENSHOT_DIR = "cypress/screenshots";

/**
 * @param {{ screenshotsFolder?: string }} [config]
 */
function setupScreenshotPath(config = {}) {
    if (config.screenshotsFolder) {
        CYPRESS_SCREENSHOT_DIR = config.screenshotsFolder;
    }
}

/**
 * Copies both the actual and expected image to a single folder with matching
 * filenames and a `(actual)` and `(expected)` suffix for easier comparison.
 *
 * @param {string} actual - Filepath to screenshot just just taken, the "actual" image.
 * @param {string} expected - Filepath to the screenshot we are comparing with, the "expected" image.
 * @param {string} dst - Destination directory of the copied images.
 * @param {string} basename - Base filename (without suffix and extension).
 * @returns {Promise<void>} A promise resolved when the files have been copied.
 */
async function copyMismatchingFiles(actual, expected, dst, basename) {
    await fsPromises.mkdir(dst, { recursive: true });
    await fsPromises.copyFile(
        actual,
        path.join(dst, `${basename} (actual).png`),
    );
    await fsPromises.copyFile(
        expected,
        path.join(dst, `${basename} (expected).png`),
    );
}

/**
 * Remove the screenshot from folder so we aren't left with lots of them after
 * running the tests.
 *
 * @param {string} filename - Filename of the screenshot.
 * @returns {void}
 */
function cleanup(filename) {
    if (fs.existsSync(filename)) {
        fs.unlinkSync(filename);
    }
}

/**
 * Screenshots are saved to different directories depending on whenever we are
 * creating the base images or if we are comparing to them.
 *
 * - When `type` is `"base"` the target directory is `"__screenshots__"` in the same folder as the testcase.
 * - When `type` is `"actual"` the target directory is `"cypress/screenshots/actual"`.
 *
 * @param {"base" | "actual"} type - Screenshot type.
 * @param {string} testPath - Filepath to current testcase.
 * @returns Returns directory to store screenshots in.
 */
function getScreenshotTargetDirectory(type, testPath) {
    if (type === "actual") {
        return path.join(CYPRESS_SCREENSHOT_DIR, "actual");
    } else {
        return path.join(path.dirname(testPath), "__screenshots__");
    }
}

async function visualRegressionCopy(args) {
    let { from, deleteFolder } = args;
    const { absolute, specType, isHeadless, relativePath } = args;
    const folderName = getScreenshotTargetDirectory(args.type, args.testPath);

    /* In version 10, Cypress.spec.name stops inkluding parent folder.
     *  Screenshots in headless mode still include it, so need a workaround to make it work.
     */
    if (isHeadless && specType === "component") {
        let parentFolder = absolute.split("/");
        parentFolder = parentFolder.slice(-3, -1);
        /**
         * If first element is src, instead of the normal "components" or simular, that means
         * we are working with a monorepo that has cypress tests in different packages
         */
        if (parentFolder[0] === "src") {
            parentFolder = absolute.split("/").slice(-4, -1).join("/");
        } else {
            parentFolder = getSubfolderName(absolute, "src");
        }
        const checkFrom = path.join(parentFolder, from);

        if (fs.existsSync(path.join(CYPRESS_SCREENSHOT_DIR, checkFrom))) {
            from = checkFrom;
        }
    }

    if (fs.existsSync(path.join(CYPRESS_SCREENSHOT_DIR, "All Specs"))) {
        from = "All Specs";
        deleteFolder = "All Specs";
    }

    from = path.join(
        CYPRESS_SCREENSHOT_DIR,
        relativePath,
        `${args.fileName}.png`,
    );

    const to = path.join(folderName, `${args.fileName}.png`);

    deleteFolder = path.join(CYPRESS_SCREENSHOT_DIR, deleteFolder);

    await fsPromises.mkdir(folderName, { recursive: true });
    await fsPromises.rename(from, to);

    fs.rmSync(deleteFolder, {
        recursive: true,
        force: true,
    });

    return true;
}

/**
 * @param {{fileName: string}} args
 */
async function toMatchScreenshotsPlugin(args) {
    const { fileName } = args;
    const { testingType } = args;
    let { relative } = args;
    relative = relative.replace(/\\/g, "/");

    const actualImage = path.join(
        CYPRESS_SCREENSHOT_DIR,
        "actual",
        `${fileName}.png`,
    );

    const expectedImage = path.join(
        path.dirname(args.testPath),
        "__screenshots__",
        `${fileName}.png`,
    );
    if (!fs.existsSync(expectedImage)) {
        cleanup(actualImage);
        return {
            error: [
                `Base image not found\n`,
                `'${expectedImage}'\n`,
                `Did you forget to create image?`,
                `Add environment variable 'type=base'\n`,
                `$ npm run cypress run -- --env type=base --${testingType} --spec **/${relative}\n`,
                `It is recommended to run the screenshot test individually with 'it.only' when creating base image`,
            ].join("\n"),
        };
    }
    const result = await compareImages(actualImage, expectedImage, {});
    const percentage = result.rawMisMatchPercentage / 100;

    if (percentage > args.errorThreshold) {
        await copyMismatchingFiles(
            actualImage,
            expectedImage,
            CYPRESS_SCREENSHOT_DIR,
            fileName,
        );

        cleanup(actualImage);

        return {
            error: [
                `The "${fileName}" image is different. Threshold limit exceeded!"`,
                `Expected: ${args.errorThreshold}`,
                `Actual: ${percentage}\n`,
                `Did you forget to update image?`,
                `Add environment variable 'type=base'\n`,
                `$ npm run cypress run -- --env type=base --${testingType} --spec **/${relative}\n`,
                `It is recommended to run the screenshot test individually with 'it.only' when creating base image`,
            ].join("\n"),
        };
    }

    cleanup(actualImage);

    return {};
}

/**
 * this will produce higher resolution images and videos
 * https://on.cypress.io/browser-launch-api
 *
 * @param {{ family: "chromium" | "firefox", name: string }} browser
 */
const beforeBrowserLaunch = (browser, launchOptions) => {
    /* eslint-disable no-console -- expected to log */
    console.log();
    console.group("@forsakringskassan/cypress-visual-regression");
    console.log(`Browser family: ${browser.family}`);
    console.log(`Browser name: ${browser.name}`);
    console.log();

    if (browser.family === "chromium") {
        console.log("Disabling GPU");
        launchOptions.args.push("--disable-gpu");
    }

    if (!browser.isHeadless) {
        console.groupEnd();
        console.log();
        return launchOptions;
    }

    const width = 1920;
    const height = 1080;
    if (browser.name === "chrome") {
        console.log(
            `Changing window size to ${width}x${height} and disable retina`,
        );
        launchOptions.args.push(`--window-size=${width},${height}`);
        launchOptions.args.push("--force-device-scale-factor=1");
    }

    if (browser.name === "electron") {
        launchOptions.preferences.width = width;
        launchOptions.preferences.height = height;
    }

    console.groupEnd();
    console.log();
    return launchOptions;
    /* eslint-enable no-console */
};

function getToMatchScreenshotsPlugin(on, config) {
    setupScreenshotPath(config);
    on("before:browser:launch", beforeBrowserLaunch);
    on("task", {
        toMatchScreenshotsPlugin,
        visualRegressionCopy,
    });
    return config;
}

module.exports = getToMatchScreenshotsPlugin;
