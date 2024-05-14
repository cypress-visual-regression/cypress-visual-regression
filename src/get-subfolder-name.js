/**
 * @param {string} path filepath
 * @param {string} parentFolder parent folder
 * @returns {string} subfolder path after given parent folder
 */
function getSubfolderName(path, parentFolder) {
    const splitPath = path.split("/");
    const parentFolderIndex = splitPath.findIndex((it) => it === parentFolder);

    if (parentFolderIndex === -1) {
        throw new Error(`Could not find "${parentFolder}" in path "${path}"`);
    }

    return splitPath.slice(parentFolderIndex + 1, -1).join("/");
}

module.exports = { getSubfolderName };
