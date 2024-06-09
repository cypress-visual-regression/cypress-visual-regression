# Cypress Visual Regression

[![npm](https://img.shields.io/npm/v/cypress-visual-regression)](https://www.npmjs.com/package/cypress-visual-regression)

[![github actions](https://github.com/mjhea0/cypress-visual-regression/workflows/Continuous%20Integration/badge.svg)](https://github.com/mjhea0/cypress-visual-regression/actions)

Module for adding visual regression testing to [Cypress](https://www.cypress.io/).

## Installation

```nodejs
npm install cypress-visual-regression
```

## Configuration

### JavaScript

Configure the visual regression plugin and environment variables in your _cypress.config.js_ file like:

```javascript
const { defineConfig } = require('cypress')
const { configureVisualRegression } = require('cypress-visual-regression')

module.exports = defineConfig({
  e2e: {
    env: {
      visualRegressionType: 'regression'
    },
    screenshotsFolder: './cypress/snapshots/actual',
    setupNodeEvents(on, config) {
      configureVisualRegression(on)
    }
  }
})
```

Pay attention to the `type` option. Use 'base' to generate baseline images, and 'regression' to compare current
screenshot to the base screenshot

In your support file _cypress/support/e2e.js_ add the following:

```javascript
const { addCompareSnapshotCommand } = require('cypress-visual-regression/dist/command')
addCompareSnapshotCommand()
```

### TypeScript

If you're using TypeScript, use files with a `.ts` extension, as follows:

_cypress.config.ts_

```typescript
import { defineConfig } from 'cypress'
import { configureVisualRegression } from 'cypress-visual-regression'

export default defineConfig({
  e2e: {
    env: {
      visualRegressionType: 'regression'
    },
    screenshotsFolder: './cypress/snapshots/actual',
    setupNodeEvents(on, config) {
      configureVisualRegression(on)
    }
  }
})
```

_cypress/support/e2e.ts_

```typescript
import { addCompareSnapshotCommand } from 'cypress-visual-regression/dist/command'
addCompareSnapshotCommand()
```

_cypress/tsconfig.json_

```json:
{
  "ts-node": {
    "transpileOnly": true,
    "compilerOptions": {
      "module": "ES2015"
    }
  }
}
```

For more info on how to use TypeScript with Cypress, please refer to [this document](https://docs.cypress.io/guides/tooling/typescript-support#Set-up-your-dev-environment).

## Plugin options

All options can be configured within `visualRegression` namespace under `env` variable inside `cypress.config.js` file, like this:

```javascript
e2e: {
  screenshotsFolder: './cypress/snapshots/actual',
  env: {
    visualRegressionType: 'regression',
    visualRegressionBaseDirectory: 'cypress/snapshot/base',
    visualRegressionDiffDirectory: 'cypress/snapshot/diff',
    visualRegressionGenerateDiff: 'always',
    visualRegressionFailSilently: true
  }
}
```

| Variable                      | Default                 | Description                                                                                                                                                  |
| ----------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| visualRegressionType          | /                       | Either 'regression' or 'base'. Base will override any existing base images with new screenshots. Regression will compare the base to the current screenshot. |
| visualRegressionBaseDirectory | 'cypress/snapshot/base' | Path to the directory where the base snapshots will be stored.                                                                                               |
| visualRegressionDiffDirectory | 'cypress/snapshot/diff' | Path to the directory where the generated image differences will be stored.                                                                                  |
| visualRegressionGenerateDiff  | 'fail'                  | Either 'fail', 'never' or 'always'. Determines if and when image differences are generated.                                                                  |
| visualRegressionFailSilently  | false                   | Used to decide if any error found in regression should be thrown or returned as part of the result.                                                          |

You can also pass default cypress screenshot [arguments](https://docs.cypress.io/api/cypress-api/screenshot-api.html#Arguments) to `addCompareSnapshotCommand()`, like this:

```javascript
const { addCompareSnapshotCommand } = require('cypress-visual-regression/dist/command')
addCompareSnapshotCommand({
  capture: 'fullPage'
})
```

### How To Use

### > syntax

```TypeScript
cy.compareSnapshot(name)
cy.compareSnapshot(name, errorThreshold)
cy.compareSnapshot(name, options)
```

### > arguments

| Arguments      | Default | Description                                                                                                  |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| name           | /       | Represents the name of the base snapshot file that the actual screenshot will be compared with.              |
| errorThreshold | 0       | Threshold under which any image difference will be considered as failed test. Represented in percentages.    |
| options        | {}      | Used to provide additional cypress screenshot options as well as `failSilently` and `errorThreshold` values. |

### > examples

```TypeScript
cy.compareSnapshot('homePage') // will compare actual screenshot to current and fail if there's any difference in the images

cy.get('h1').compareSnapshot('homePage', 0.2) // will compare only the image of h1 element and fail only if the percentage of pixels that are different is bigger than 0.2%

cy.compareSnapshot('homePage', {errorThreshold: 1, failSilently: true}).then(comparisonResults => {
  console.log(comparisonResults.mismatchedPixels) // will print the number of mismatched pixels
  console.log(comparisonResults.percentage) // will print the percentage of mismatched pixels
  console.log(comparisonResults.error) // will print the visual regression error message (if any)
})
```

> Looking for more examples? See [cypress/e2e/main.cy.ts](https://github.com/cypress-visual-regression/cypress-visual-regression/blob/master/cypress/e2e/main.cy.ts).

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
export function beforeCompareSnapshots(
  /** Element you want to ignore */
  ignoredElementsQuerySelector: string,
  /** Main app element (if you want for the page to be loaded before triggering the command) */
  appContentQuerySelector: string = 'body'
) {
  Cypress.Commands.overwrite('compareSnapshots', (originalFn, ...args) => {
    return (
      cy
        // wait for content to be ready
        .get(appContentQuerySelector)
        // hide ignored elements
        .then(($app) => {
          return new Cypress.Promise((resolve, reject) => {
            setTimeout(() => {
              $app.find(ignoredElementsQuerySelector).css('visibility', 'hidden')
              resolve()
              // add a very small delay to wait for the elements to be there, but you should
              // make sure your test already handles this
            }, 300)
          })
        })
        .then(() => {
          return originalFn(...args)
        })
    )
  })
}
```

You may then use this function like:

```js
const { addCompareSnapshotCommand } = require('cypress-visual-regression/dist/command')
const beforeCompareSnapshots = require('./commands/beforeCompareSnapshots')
addCompareSnapshotCommand({
  errorThreshold: 0.1
})
// add a before hook to compareSnapshot (this must be called AFTER compareSnapshotCommand() so the command can be overriden)
beforeCompareSnapshots(".chromatic-ignore,[data-chromatic='ignore']", '._app-content')
```

In this example, we ignore the elements that are also ignored by 3rd party tool Chromatic.

## Debug

set process env `visual_regression_log` to `debug` to enable logging:

```bash
visual_regression_log=debug cypress open --e2e -b chrome -C cypress.base.config.ts
```
