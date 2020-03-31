/* eslint-disable no-undef */

function compareSnapshotCommand() {
  Cypress.Commands.add(
    'compareSnapshot',
    { prevSubject: 'optional' },
    (subject, name, errorThreshold = 0.0) => {
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
        };
        cy.task('compareSnapshotsPlugin', options).then((results) => {
          if (results.percentage > errorThreshold) {
            throw new Error(`The "${name}" image is different. Threshold limit exceeded! \nExpected: ${errorThreshold} \nActual: ${results.percentage}`);
          }
        });
      }
    }
  );
}

/* eslint-enable no-undef */

module.exports = compareSnapshotCommand;
