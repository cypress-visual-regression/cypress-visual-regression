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
        .match(
            /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g,
        )
        .map((x) => x.toLowerCase())
        .join("-");
    const prefix = spec.name.split(".")[0].split("/").pop();
    return `${prefix} -- ${currentTest}`;
}

module.exports = { getFileName };
