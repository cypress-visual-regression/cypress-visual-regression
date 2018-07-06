/* eslint-disable no-undef */

function compareSnapshotCommand() {
  Cypress.Commands.add('compareSnapshot', (name) => {
    // get title based on 'type' env var
    let title = 'actual';
    if (Cypress.env('type') === 'base') { title = 'base'; }
    // take snapshot
    cy.screenshot(`${name}-${title}`);

    // run visual tests
    if (Cypress.env('type') === 'actual') {
      const options = {
        fileName: name,
        specDirectory: Cypress.spec.name,
      };
      cy.task('compareSnapshotsPlugin', options).then((results) => {
        if (!results) throw new Error(`${name} images are different`);
      });
    }
  });
}

/* eslint-enable no-undef */

module.exports = compareSnapshotCommand;
