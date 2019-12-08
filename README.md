# Cypress Visual Regression

[![NPM](https://nodei.co/npm/cypress-visual-regression.png)](https://nodei.co/npm/cypress-visual-regression/)

[![Build Status](https://travis-ci.org/mjhea0/cypress-visual-regression.svg?branch=master)](https://travis-ci.org/mjhea0/cypress-visual-regression)

Module for adding visual regression testing to [Cypress](https://www.cypress.io/).

## Getting Started

Install:

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

Add `cy.compareSnapshot('home');` in your tests specs whenever you want to test for visual regressions, making sure to replace `home` with a relevant name. You can also add an optional error threshold: Value can range from 0.00 (no difference) to 1.00 (every pixel is different). So, if you enter an error threshold of 0.50, the test would fail only if 0.51 percent of pixels are different.

For example:

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

> Looking for more examples? Review [docker/cypress/integration/main.spec.js](https://github.com/mjhea0/cypress-visual-regression/blob/master/docker/cypress/integration/main.spec.js).


Take the base images:

```sh
$ ./node_modules/.bin/cypress run --env type=base --config screenshotsFolder=cypress/snapshots/base

# use comma separated format for multiple config commands
$ ./node_modules/.bin/cypress run \
  --env type=base \
  --config screenshotsFolder=cypress/snapshots/base,testFiles=\"**/*regression-tests.js\
```

Find regressions:

```sh
$ ./node_modules/.bin/cypress run --env type=actual
```

## Example

![example](./cypress-visual-regression.gif)

## TODO

1. Allow end user to customize options (screenshot directory)
1. Test functionality of taking screenshots without running visual regression
1. Prevent "base" tests runs from actually running the regular Cypress tests
