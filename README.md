# Cypress Visual Regression

[![npm](https://img.shields.io/npm/v/cypress-visual-regression)](https://www.npmjs.com/package/cypress-visual-regression)

[![github actions](https://github.com/mjhea0/cypress-visual-regression/workflows/Continuous%20Integration/badge.svg)](https://github.com/mjhea0/cypress-visual-regression/actions)


Module for adding visual regression testing to [Cypress](https://www.cypress.io/).

## Getting Started

Install:

```sh
$ npm install cypress-visual-regression
```

Add the following config to your *cypress.config.js* file:

```javascript
const { defineConfig } = require("cypress");
const getCompareSnapshotsPlugin = require('cypress-visual-regression/dist/plugin');

module.exports = defineConfig({
  env: {
    screenshotsFolder: './cypress/snapshots/actual',
    trashAssetsBeforeRuns: true,
    video: false
  },
  e2e: {
    setupNodeEvents(on, config) {
      getCompareSnapshotsPlugin(on, config);
    },
  },
});
```

Add the command to *cypress/support/commands.js*:

```javascript
const compareSnapshotCommand = require('cypress-visual-regression/dist/command');

compareSnapshotCommand();
```

> Make sure you import *commands.js* in *cypress/support/e2e.js*:
>
> ```javascript
> import './commands'
> ```

### TypeScript

If you're using TypeScript, use files with a `.ts` extension, as follows:

*cypress/cypress.config.ts*

```ts
import { defineConfig } from 'cypress';
import getCompareSnapshotsPlugin from 'cypress-visual-regression/dist/plugin';

export default defineConfig({
  env: {
    screenshotsFolder: './cypress/snapshots/actual',
    trashAssetsBeforeRuns: true,
    video: false
  },
  e2e: {
    setupNodeEvents(on, config) {
      getCompareSnapshotsPlugin(on, config);
    },
  },
});
```

*cypress/support/commands.ts*

```ts
import compareSnapshotCommand from 'cypress-visual-regression/dist/command';

compareSnapshotCommand();
```

*cypress/tsconfig.json*

```json:
{
  "compilerOptions": {
    "types": [
      "cypress",
      "cypress-visual-regression"
    ]
  }
}
```

For more info on how to use TypeScript with Cypress, please refer to [this document](https://docs.cypress.io/guides/tooling/typescript-support#Set-up-your-dev-environment).


### Options

`failSilently` is enabled by default. Add the following config to your *cypress.config.js* file to see the errors:

```javascript
{
  env: {
    failSilently: false
  }
}
```

You can also pass default [arguments](https://docs.cypress.io/api/cypress-api/screenshot-api.html#Arguments) to `compareSnapshotCommand()`:

```javascript
const compareSnapshotCommand = require('cypress-visual-regression/dist/command');

compareSnapshotCommand({
  capture: 'fullPage'
});
```

These will be used by default when no parameters are passed to the `compareSnapshot` command.

**Configure snapshot paths**

You can control where snapshots should be located by setting two environment variables:

| Variable | Description |
|----------|-------------|
| SNAPSHOT_BASE_DIRECTORY | Directory of the base snapshots |
| SNAPSHOT_DIFF_DIRECTORY | Directory for the snapshot diff |

The `actual` directory always points to the configured screenshot directory.


**Configure snapshot generation**

In order to control the creation of diff images you may want to use the following environment variables which are
typically set in field `env` in `cypress.json`.

| Variable                        | Description                |
|---------------------------------|----------------------------|
| ALWAYS_GENERATE_DIFF            | Boolean, defaults to true  |
| ALLOW_VISUAL_REGRESSION_TO_FAIL | Boolean, defaults to false |


`ALWAYS_GENERATE_DIFF` specifies if diff images are generated for successful tests.

If you only want the tests to create diff images based on your threshold without the tests to fail, you can set `ALLOW_VISUAL_REGRESSION_TO_FAIL`.
If this variable is set, diffs will be computed using your thresholds but tests will not fail if a diff is found.

If you want to see all diff images which are different (based on your thresholds), use the following in your `cypress.json`:
```json
...
"env": {
  "ALWAYS_GENERATE_DIFF": false,
  "ALLOW_VISUAL_REGRESSION_TO_FAIL": true
}
```

## To Use

Add `cy.compareSnapshot('home');` in your tests specs whenever you want to test for visual regressions, making sure to replace `home` with a relevant name. You can also add an optional error threshold: Value can range from 0.00 (no difference) to 1.00 (every pixel is different). So, if you enter an error threshold of 0.51, the test would fail only if > 51% of pixels are different.

More examples:

| Threshold | Fails when |
|-----------|------------|
| .25 | > 25%  |
| .30 | > 30% |
| .50 | > 50% |
| .75 | > 75% |

Sample:

```js
it('should display the login page correctly', () => {
  cy.visit('/03.html');
  cy.get('H1').contains('Login');
  cy.compareSnapshot('login', 0.0);
  cy.compareSnapshot('login', 0.1);
});
```

You can target a single HTML element as well:

```js
cy.get('#my-header').compareSnapshot('just-header')
```

You can pass arguments as an object to `cy.compareSnapshot()`, rather than just an error threshold, as well:

```js
it('should display the login page correctly', () => {
  cy.visit('/03.html');
  cy.compareSnapshot('login', {
    capture: 'fullPage',
    errorThreshold: 0.1
  });
});
```
> Looking for more examples? Review [docker/cypress/integration/main.spec.js](https://github.com/mjhea0/cypress-visual-regression/blob/master/docker/cypress/integration/main.spec.js).


Take the base images:

```sh
$ ./node_modules/.bin/cypress run --env type=base --config screenshotsFolder=cypress/snapshots/base,testFiles=\"**/*regression-tests.js\"

# use comma separated format for multiple config commands
$ ./node_modules/.bin/cypress run \
  --env type=base \
  --config screenshotsFolder=cypress/snapshots/base,testFiles=\"**/*regression-tests.js\"
```

Find regressions:

```sh
$ ./node_modules/.bin/cypress run --env type=actual
```

## Example

![example](./cypress-visual-regression.gif)

## Tips & Tricks

### Ignore some elements

Following function creates a command that allows you to hide elements of the page based on their className:
```ts
/**
 * To be called after you setup the command, in order to add a
 * hook that does stuff before the command is triggered
 */
function beforeCompareSnapshotCommand(
  /** Element you want to ignore */
  ignoredElementsQuerySelector: string,
  /** Main app element (if you want for the page to be loaded before triggering the command) */
  appContentQuerySelector: string = "body"
) {
  Cypress.Commands.overwrite("compareSnapshot", (originalFn, ...args) => {
    return cy
      // wait for content to be ready 
      .get(appContentQuerySelector)
      // hide ignored elements
      .then($app => {
        return new Cypress.Promise((resolve, reject) => {
          setTimeout(() => {
            $app.find(ignoredElementsQuerySelector).css("visibility", "hidden");
            resolve();
            // add a very small delay to wait for the elements to be there, but you should
            // make sure your test already handles this
          }, 300);
        });
      })
      .then(() => {
        return originalFn(...args);
      });
  });
}

module.exports = beforeCompareSnapshotCommand;
```
You may then use this function like below:
```js
const compareSnapshotCommand = require("cypress-visual-regression/dist/command");
const beforeCompareSnapshotCommand = require("./commands/beforeCompareSnapshots");
compareSnapshotCommand({
  errorThreshold: 0.1
});
// add a before hook to compareSnapshot (this must be called AFTER compareSnapshotCommand() so the command can be overriden)
beforeCompareSnapshotCommand(
  ".chromatic-ignore,[data-chromatic='ignore']",
  "._app-content"
);
```
In this example, we ignore the elements that are also ignored by 3rd party tool Chromatic.
