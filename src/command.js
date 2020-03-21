/* eslint-disable no-undef */

function compareSnapshotCommand(defaultScreenshotOptions) {
  Cypress.Commands.add(
    'compareSnapshot',
    { prevSubject: 'optional' },
    (subject, name, params = 0.0) => {
      let screenshotOptions = defaultScreenshotOptions;
      let errorThreshold = 0.0;
      if (typeof params === 'number') {
        errorThreshold = params;
      } else if (typeof params === 'object') {
        errorThreshold = params.errorThreshold || 0.0;
        screenshotOptions = { ...screenshotOptions, ...params };
      }
      let title = 'actual';
      if (Cypress.env('type') === 'base') {
        title = 'base';
      }

      // take snapshot
      if (subject) {
        cy.get(subject).screenshot(`${name}-${title}`, screenshotOptions);
      } else {
        cy.screenshot(`${name}-${title}`, screenshotOptions);
      }

      // run visual tests
      if (Cypress.env('type') === 'actual') {
        const options = {
          fileName: name,
          specDirectory: Cypress.spec.name,
        };
        cy.task('compareSnapshotsPlugin', options).then((results) => {
          if (results.percentage > errorThreshold) {
            throw new Error(`${name} images are different`);
          }
        });
      }
    }
  );
}

/* eslint-enable no-undef */

module.exports = compareSnapshotCommand;
