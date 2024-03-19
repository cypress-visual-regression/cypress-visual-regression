/**
 * @typedef {object} Spec
 * @property {string} name
 * @property {string} relative
 * @property {string} absolute
 */

/**
 * @param {Spec} spec
 * @returns {string}
 */
function getFolderName(spec) {
    const folderName = spec.name.split("/");
    folderName.pop();
    return folderName.join("/");
}

module.exports = { getFolderName };
