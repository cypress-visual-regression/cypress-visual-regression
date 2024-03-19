require("@forsakringskassan/eslint-config/patch/modern-module-resolution");

module.exports = {
    root: true,
    extends: ["@forsakringskassan"],
    globals: {
        Cypress: "readonly",
        cy: "readonly",
        describe: "readonly",
        it: "readonly",
    },

    overrides: [
        {
            files: "*.spec.[jt]s",
            extends: ["@forsakringskassan/jest"],
        },
    ],
};
