function compareSnapshotCommand() {
  Cypress.Commands.add('compareSnapshot', (name) => {
    let title = 'actual';
    if (Cypress.env('type') === 'base') { title = 'base'; }

    cy.screenshot(`${name}-${title}`);

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

module.exports = compareSnapshotCommand;
