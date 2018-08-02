const compareSnapshotCommand = require('../../dist/command.js');

function compareSnapshotTestCommand() {
  Cypress.Commands.add('compareSnapshotTest', name => {
    // get image title from the 'type' environment variable
    let title = 'actual';
    if (Cypress.env('type') === 'base') {
      title = 'base';
    }

    // take snapshot
    cy.screenshot(`${name}-${title}`);

    // run visual tests
    if (Cypress.env('type') === 'actual') {
      const options = {
        fileName: name,
        specDirectory: Cypress.spec.name
      };
      cy.task('compareSnapshotsPlugin', options).then(results => {
        if (!results) return false;
      });
    }
  });
}

compareSnapshotTestCommand();
compareSnapshotCommand();
