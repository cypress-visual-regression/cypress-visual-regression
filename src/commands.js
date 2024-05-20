const { getFileName } = require("./get-file-name");
const { getFolderName } = require("./get-folder-name");

function takeScreenshot(args) {
    const deleteFolder = Cypress.spec.name.split("/")[0];
    let from = Cypress.spec.name;

    if (Cypress.browser.isHeaded) {
        from = "";
    }

    const { subject, fileName, screenshotOptions } = args;
    const objToOperateOn = subject ? cy.get(subject) : cy;
    objToOperateOn.screenshot(fileName, screenshotOptions).task(
        "visualRegressionCopy",
        {
            from,
            folderName: args.fileName,
            fileName: args.fileName,
            deleteFolder,
            type: args.type,
            testPath: Cypress.spec.absolute,
            isHeadless: Cypress.browser.isHeadless,
            absolute: Cypress.spec.absolute,
            specType: Cypress.spec.specType,
            relativePath: Cypress.spec.relativeToCommonRoot ?? "",
        },
        { log: false },
    );
}

/**
 * @typedef {object} PluginTaskOptions
 * @property {string} filename
 * @property {string} specDirectory
 * @property {"actual"|"base"} type
 * @property {number} errorThreshold
 * @property {string} testPath
 */

/**
 * @param {PluginTaskOptions} options
 * @param {number} remainingAttempts
 */
function takeScreenshotsUntilMatch(args, options, remainingAttempts) {
    takeScreenshot(args);

    cy.task("toMatchScreenshotsPlugin", options, {
        log: false,
    }).then((result) => {
        const attemptsLeft = remainingAttempts - 1;
        if (result.error) {
            if (attemptsLeft === 0) {
                throw new Error(result.error);
            }
            cy.log("Retrying after 200ms");
            cy.wait(200);
            takeScreenshotsUntilMatch(args, options, attemptsLeft);
        }
    });
}

function toMatchScreenshot(subject, screenshotOptions) {
    Cypress.log({
        name: "visual-regression",
        message: ["Matching screenshot"],
        $el: subject,
    });

    let type = "actual";
    if (Cypress.env("type") === "base") {
        type = "base";
    }
    const defaultTreshold = 0.01;
    const defaultRetries = 3;
    let errorThreshold = defaultTreshold;
    let baseDelay;
    let retries = defaultRetries;
    if (typeof screenshotOptions === "number") {
        errorThreshold = screenshotOptions;
    } else if (typeof screenshotOptions === "object") {
        baseDelay = screenshotOptions.baseDelay || undefined;
        retries = screenshotOptions.retries || defaultRetries;
        errorThreshold = screenshotOptions.errorThreshold || defaultTreshold;
    }

    const fileName = getFileName(Cypress.currentTest, Cypress.spec);
    const folderName = getFolderName(Cypress.spec);
    const args = {
        type,
        screenshotOptions,
        subject,
        folderName,
        fileName,
    };

    if (type === "actual") {
        const options = {
            fileName,
            specDirectory: folderName,
            type,
            errorThreshold,
            relative: Cypress.spec.relative,
            testingType: Cypress.testingType,
            testPath: Cypress.spec.absolute,
        };
        takeScreenshotsUntilMatch(args, options, retries);
    } else if (type === "base") {
        if (baseDelay) {
            cy.wait(baseDelay);
        }
        takeScreenshot(args);
    }
}

Cypress.Commands.add(
    "toMatchScreenshot",
    { prevSubject: "optional" },
    toMatchScreenshot,
);
