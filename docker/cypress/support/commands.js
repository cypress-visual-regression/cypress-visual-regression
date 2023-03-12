const path = require('path');
const compareSnapshotCommand = require('../../dist/command.js');

function getSuffix (type,removeSuffix ) {
  if (removeSuffix) {
    return ''
  } if (type === 'base') {
      return '-base'
  }
    return '-actual'
}

function compareSnapshotTestCommand() {
  Cypress.Commands.add('compareSnapshotTest', { prevSubject: 'optional' }, (subject, name, params = 0.0) => {
    let screenshotOptions = {};
    let errorThreshold = 0.0;
    if (typeof params === 'number') {
      errorThreshold = params;
    } else if (typeof params === 'object') {
      errorThreshold = params.errorThreshold || 0.0;
      // eslint-disable-next-line prefer-object-spread
      screenshotOptions = Object.assign({}, params);
    }
    const suffix = getSuffix(Cypress.env('type'), Cypress.env('REMOVE_SUFFIX'))

    const specDirectory = Cypress.spec.relative.replace('cypress/e2e', '');
    // take snapshot
    if (subject) {
      cy.get(subject).screenshot(`${name}${suffix}`, screenshotOptions);
    } else {
      cy.screenshot(`${name}${suffix}`, screenshotOptions);
    }

    // run visual tests
    if (Cypress.env('type') === 'actual') {
      const options = {
        fileName: name,
        specDirectory,
        failSilently: Cypress.env('failSilently') !== undefined ? Cypress.env('failSilently') : true
      };
      cy.task('compareSnapshotsPlugin', options).then(results => {
        if (results.error) {
          console.log(results.error); // eslint-disable-line no-console
          return results.error;
        }

        if (results.percentage > errorThreshold) {
          return false
        };

        return true;
      });
    }
  });
}

compareSnapshotTestCommand();
compareSnapshotCommand();
