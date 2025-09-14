/**
 * @typedef {object} CurrentTest
 * @property {string} title
 * @property {string[]} titlePath
 */

/**
 * @typedef {object} Spec
 * @property {string} name
 * @property {string} relative
 * @property {string} absolute
 */

/**
 * @param {CurrentTest} test
 * @param {Spec} spec
 * @returns {string}
 */
function getFileName(test, spec) {
    const fullTitle = test.titlePath.join(" ");
    const currentTest = fullTitle
        /* eslint-disable-next-line sonarjs/slow-regex, sonarjs/regex-complexity -- technical debt */
        .match(/[A-Z]{2,}(?=[A-Z][a-z]+\d*|\b)|[A-Z]?[a-z]+\d*|[A-Z]|\d+/g)
        .map((x) => x.toLowerCase())
        .join("-");
    const prefix = spec.name.split(".")[0].split("/").pop();
    return `${prefix} -- ${currentTest}`;
}

module.exports = { getFileName };
