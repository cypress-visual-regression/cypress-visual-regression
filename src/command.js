/* eslint-disable no-undef */

function compareSnapshotCommand() {
  Cypress.Commands.add('compareSnapshot', (name, errorThreshold = 0.0) => {
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
        specDirectory: Cypress.spec.name,
      };
      cy.task('compareSnapshotsPlugin', options).then((results) => {
        if (results.percentage > errorThreshold) throw new Error(`${name} images are different`);
      });
    }
  });
}

/* eslint-enable no-undef */

module.exports = compareSnapshotCommand;
