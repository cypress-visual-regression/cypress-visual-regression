export type CurrentTest = {
    title: string;
    titlePath: string[];
};
export type Spec = {
    name: string;
    relative: string;
    absolute: string;
};
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
export function getFileName(test: CurrentTest, spec: Spec): string;
