# Change Log

All notable changes to this project will be documented in this file. This project adheres to [Semantic Versioning](http://semver.org/).

## v1.7.0

- Saves diff images only on failed tests (PR #[110](https://github.com/mjhea0/cypress-visual-regression/pull/110))

## v1.6.3

- TypeScript: Update docs and add type for plugin (PR #[98](https://github.com/mjhea0/cypress-visual-regression/pull/98))

## v1.6.2

- Adds missing `compareSnapshot` TypeScript types (PR #[102](https://github.com/mjhea0/cypress-visual-regression/pull/102))

## v1.6.1

- Uses `errorThreshold` from global options (PR #[80](https://github.com/mjhea0/cypress-visual-regression/pull/80))

## v1.6.0

- Fixes packaging of distribution (PR #[95](https://github.com/mjhea0/cypress-visual-regression/pull/95))

## v1.5.10

- Fixes serialize error object with socket communication (PR #[94](https://github.com/mjhea0/cypress-visual-regression/pull/94))

## v1.5.9

- Adds TypeScript support

## v1.5.8

- Bumps all dependency versions

## v1.5.7

- Bumps to Cypress v6.4.0
- Adds `errorThreshold` to the global options (PR #[72](https://github.com/mjhea0/cypress-visual-regression/pull/72))

## v1.5.6

- Updates `peerDependencies` (PR #[71](https://github.com/mjhea0/cypress-visual-regression/pull/71))

## v1.5.3

- Bumps to Cypress v5.6.0
- Sanitizes file names

## v1.5.2

- Bumps to Cypress v5.2.0
- Adds ability to configure paths by environment variables

## v1.5.1

- Bumps to Cypress v5.1.0

## v1.5.0

- Bumps to Cypress v4.12.1
- Checks if snapshot file exists before parsing it

## v1.4.0

- Bumps to Cypress v4.9.0
- Expands canvas before image comparison so that both images fully cover each other

## v1.3.0

- Bumps to Cypress v4.5.0
- Snapshot path now based on the CWD (`process.cwd()`)

## v1.2.0

- Bumps to Cypress v4.3.0
- Adds functionality to pass default arguments to `compareSnapshotCommand()`
- Adds functionality to pass an object to `cy.screenshot()` rather than just an error threshold:

    ```javascript
    cy.compareSnapshot('login', 0.1);

    // or

    cy.compareSnapshot('login', {
      capture: 'fullPage',
      errorThreshold: 0.1
    });
    ```

## v1.1.0

- Removes support for Node 8 and 9
- Bumps to Cypress v4.2.0
- Adds a `failSilently` option for ignore failures and proceeding with execution
- Replaces [mkdirp](https://www.npmjs.com/package/mkdirp) with [fs.mkdir](https://nodejs.org/dist/latest-v12.x/docs/api/fs.html#fs_fs_mkdir_path_options_callback)
- Adds `prepare` script to run build step
- Fixes quotes for Prettier commands in Windows

## v1.0.7

- Bumps to Cypress v4.1.0
- Updates readme

## v1.0.6

- Bumps to Cypress v4.0.2

## v1.0.5

- Bumps to Cypress v3.6.1
- Adds functionality for testing a single HTML element

## v1.0.4

- Bumps to Cypress v3.4.1

## v1.0.3

- Bumps to Cypress v3.3.2, adds Prettier, and uses [mkdirp](https://github.com/substack/node-mkdirp) instead of [fs.mkdirSync](https://nodejs.org/api/fs.html#fs_fs_mkdirsync_path_options)

## v1.0.2

- Bumps to Cypress v3.3.1

## v1.0.1

- Bumps to Cypress v3.2.0

## v1.0.0

- Uses [pixelmatch](https://github.com/mapbox/pixelmatch) instead of [image-diff](https://github.com/uber-archive/image-diff)
- **BREAKING**: `errorThreshold` now compares with the square root of the percentage of pixels that have changed. For example, if the image size is 1000 x 660, and there are 257 changed pixels, the error value would be `(257 / 1000 / 660) ** 0.5 = 0.01973306715627196663293831730957`.
