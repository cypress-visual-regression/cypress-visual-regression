# Change Log

## v5.2.1

- Fix bug with providing options through e2e file, fixes [#267](https://github.com/cypress-visual-regression/cypress-visual-regression/issues/267)

## v5.2.0

- Enable overriding pixelmatch options, fixes [#263](https://github.com/cypress-visual-regression/cypress-visual-regression/issues/263) and [#113](https://github.com/cypress-visual-regression/cypress-visual-regression/issues/113)
- Move plugin options preparation logic to command.ts file
- Refactor how options priority works: default < e2e file < env vars < command options
- Update readme file describing the 'show difference' functionality

## v5.1.0

- Add a show difference functionality
- Expose created images in the plugin results

## v5.0.4

- Fix ignored parameters from the support file, fixes [#258](https://github.com/cypress-visual-regression/cypress-visual-regression/issues/258)

## v5.0.3

- Remove the unneeded sanitation in the commnads.ts file, add missing one in updateSnapshot function. Fixes [#247](https://github.com/cypress-visual-regression/cypress-visual-regression/issues/247) and [#252](https://github.com/cypress-visual-regression/cypress-visual-regression/issues/252)
- Split integration tests into platform, project and plugin tests
- Fix a typo in documentation. Closes issue [#248](https://github.com/cypress-visual-regression/cypress-visual-regression/issues/248)

## v5.0.2

- Switch to `tsup` library (instead of regular `esbuild`)
- Remove `"type": "module"` from `package.json` file
- Output dedicated files for `cjs`, `esm` and `ts` projects. Fix issues [#244](https://github.com/cypress-visual-regression/cypress-visual-regression/issues/244) and [#243](https://github.com/cypress-visual-regression/cypress-visual-regression/issues/243)
- Add tests different project setups (`cjs`, `esm`, `ts`)
- Downgrade to `chalk` v4 (because of `cjs` support)

## v5.0.1

- Fixing path depth and cypress wrong saved path on headless (PR [#233](https://github.com/cypress-visual-regression/cypress-visual-regression/pull/233))
- Fixing compareSnapshots paths (PR [#233](https://github.com/cypress-visual-regression/cypress-visual-regression/pull/233))
- 225 v4 spec directory not included in screenshot path (PR [#233](https://github.com/cypress-visual-regression/cypress-visual-regression/pull/233))
- Changing return type of takeScreenshot function (PR [#228](https://github.com/cypress-visual-regression/cypress-visual-regression/pull/228))
- Restore onAfterScreenshot from the original API of 'cy screenshot' (PR [#235](https://github.com/cypress-visual-regression/cypress-visual-regression/pull/235))
- build(deps-dev): bump vite from 4.5.2 to 4.5.3 (PR [#234](https://github.com/cypress-visual-regression/cypress-visual-regression/pull/234))

## v5.0.0

- Formatting using prettier

- **FIX**: [errorThreshold when used in an object](https://github.com/cypress-visual-regression/cypress-visual-regression/pull/220)

- **BREAKING**: Rollback to use single keys to configure cypress-regression-plugin, instead of using an object.
  This is due to the fact that we cannot override an object on cypress CLI , please refer to [this issue](https://github.com/cypress-visual-regression/cypress-visual-regression/issues/223) for more info .

  Now any config key will have a **namespace** and will follow **camelCase** notation:

```TypeScript
env: {
  visualRegressionType: TypeOption
  visualRegressionBaseDirectory?: string
  visualRegressionDiffDirectory?: string
  visualRegressionGenerateDiff?: DiffOption
  visualRegressionFailSilently?: boolean
}
```

## v4.0.0

- Migrating to TS files
- Adding esbuild to build plugin
- Updating dependencies
- Adding winston for logging
- Adding formatting and linting

- **BREAKING**: now type can be of type 'base' or 'regression'
- **BREAKING**: Changed visual regression cypress envs. Now all vars related to visual regression plugin will be set inside an object like:

```TypeScript
env: {
  visualRegression: {
    type: TypeOption
    baseDirectory?: string
    diffDirectory?: string
    generateDiff?: DiffOption
    failSilently?: boolean
  }
}
```

All notable changes to this project will be documented in this file. This project adheres to [Semantic Versioning](http://semver.org/).

## v3.0.0

- **BREAKING**: Remove file name suffix (PR #[172](https://github.com/cypress-visual-regression/cypress-visual-regression/pull/172))
- doc: update README

## v2.1.1

- fix: Prevent implicit dependency to fs in command.js (PR #[161](https://github.com/cypress-visual-regression/cypress-visual-regression/pull/161))

## v2.1.0

- feat: add environment-variable ALLOW_TO_FAIL (PR #[146](https://github.com/cypress-visual-regression/cypress-visual-regression/pull/126))

## v2.0.1

- fix: compile optional chaining (PR #[145](https://github.com/cypress-visual-regression/cypress-visual-regression/pull/145))

## v2.0.0

- Use relative spec path to compute the snapshot directory (PR #[139](https://github.com/cypress-visual-regression/cypress-visual-regression/pull/139))
- Drop support for node v12, v15 and v17
- Add support for node v18
- Drop support for Cypress below v10
- Add support for Cypress v10, v11 and v12

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
  cy.compareSnapshot('login', 0.1)

  // or

  cy.compareSnapshot('login', {
    capture: 'fullPage',
    errorThreshold: 0.1
  })
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
