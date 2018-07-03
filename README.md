# Visual Regression Testing Example with Cypress

Basic example of using [Cypress](https://www.cypress.io/) to find visual regressions.

> **NOTE:** [ImageMagick](http://www.imagemagick.org/script/index.php) is required for this project to work.

## Want to try the example project?

1. Fork/Clone
1. Install dependencies - `npm install`
1. Get base images - `npm run base`
1. Run `npm test` to get find regressions

## Want to add the visual regression logic to your Cypress project?

### Setup

Install [image-diff](https://github.com/uber-archive/image-diff):

```sh
$ npm install image-diff
```

Add the "src" directory to your project root along with the config from *cypress.json*.

Add the plugin to *cypress/plugins/index.js*:

```javascript
const getCompareSnapshotsPlugin = require('../../src/plugin');

module.exports = (on) => {
  getCompareSnapshotsPlugin(on);
};
```

Add the command to *cypress/support/commands.js*:

```javascript
const compareSnapshotCommand = require('../../src/command');

compareSnapshotCommand();
```

### To Use

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
1. Allow end user to customize options (like error thresholds)
