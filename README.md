# Visual Regression Testing Example with Cypress

Module for adding visual regression testing to [Cypress](https://www.cypress.io/).

[![npm](https://img.shields.io/npm/v/npm.svg)](https://www.npmjs.com/package/cypress-visual-regression)

> **NOTE:** [ImageMagick](http://www.imagemagick.org/script/index.php) is required for this project to work.

## Getting Started

Install

```sh
$ npm install cypress-visual-regression
```

Add the following config to your *cypress.json* file:

```json
{
  "screenshotsFolder": "cypress/snapshots/actual",
  "trashAssetsBeforeRuns": true
}
```

Add the plugin to *cypress/plugins/index.js*:

```javascript
const getCompareSnapshotsPlugin = require('cypress-visual-regression/dist/plugin');

module.exports = (on) => {
  getCompareSnapshotsPlugin(on);
};
```

Add the command to *cypress/support/commands.js*:

```javascript
const compareSnapshotCommand = require('cypress-visual-regression/dist/command');

compareSnapshotCommand();
```

## To Use

Add `cy.compareSnapshot('home');` in your tests specs whenever you want to test for visual regressions, making sure to replace `home` with a relevant name.

Get base images:

```sh
$ ./node_modules/.bin/cypress run --env type=base --config screenshotsFolder=cypress/snapshots/base
```

Find regressions

```sh
$ ./node_modules/.bin/cypress run --env type=actual
```

## TODO

1. Set up an NPM Package
1. Port over [app](https://github.com/mjhea0/testcafe-visual-regression/blob/master/src/app.js) to display [results](https://github.com/mjhea0/testcafe-visual-regression/blob/master/docs/example.png) from each test run
1. Allow end user to customize options (like error thresholds, screenshot directory)
