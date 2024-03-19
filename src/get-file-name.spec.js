const { getFileName } = require("./get-file-name");

/* from Cypres documentation: https://docs.cypress.io/api/cypress-api/currenttest */
const currentTest = {
    title: "toggles the nav",
    titlePath: ["app layout and responsiveness", "toggles the nav"],
};

/* from Cypress documentation: https://docs.cypress.io/api/cypress-api/spec */
const spec = {
    name: "filter.cy.js",
    relative: "cypress/e2e/filter.cy.js",
    absolute: "/path/to/web-app/cypress/e2e/filter.cy.js",
};

/* Handle exception when name includes parent folder */
const componentTestSpec = {
    name: "internal-components/IValidationForm.cy.ts",
    relative:
        "packages/vue/src/internal-components/IValidationForm/IValidationForm.cy.ts",
    absolute:
        "fkui/packages/vue/src/internal-components/IValidationForm/IValidationForm.cy.ts",
};

it("should generate filename", () => {
    expect.assertions(1);
    const filename = getFileName(currentTest, spec);
    expect(filename).toBe(
        "filter -- app-layout-and-responsiveness-toggles-the-nav",
    );
});

it("should generate filename when name includes parent folder", () => {
    expect.assertions(1);
    const filename = getFileName(currentTest, componentTestSpec);
    expect(filename).toBe(
        "IValidationForm -- app-layout-and-responsiveness-toggles-the-nav",
    );
});
