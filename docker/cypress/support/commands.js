const compareSnapshotCommand = require('../../dist/command.js');

function compareSnapshotTestCommand() {
  Cypress.Commands.add('compareSnapshotTest', { prevSubject: 'optional' }, (subject, name, errorThreshold = 0.00) => {
    // get image title from the 'type' environment variable
    let title = 'actual';
    if (Cypress.env('type') === 'base') {
      title = 'base';
    }

    // take snapshot
    if (subject) {
      cy.get(subject).screenshot(`${name}-${title}`);
    } else {
      cy.screenshot(`${name}-${title}`);
    }

    // run visual tests
    if (Cypress.env('type') === 'actual') {
      const options = {
        fileName: name,
        specDirectory: Cypress.spec.name,
        failSilently: Cypress.env("failSilently") !== undefined ? Cypress.env("failSilently") : true;
      };
      cy.task('compareSnapshotsPlugin', options).then(results => {
        if (results.percentage > errorThreshold) return false;
        return true;
      });
    }
  });
}

compareSnapshotTestCommand();
compareSnapshotCommand();
