import type { ComparisonResult } from '../../src/command'

describe('Deprecation Tests', () => {
  it(
    'should still use type deprecated variables',
    {
      env: {
        type: 'base'
      }
    },
    () => {
      expect(Cypress.env('type')).to.equal('base')
    }
  )

  it(
    'should still use other deprecated variables',
    {
      env: {
        failSilently: true,
        SNAPSHOT_BASE_DIRECTORY: './cypress/snapshots/deprecated/base',
        SNAPSHOT_DIFF_DIRECTORY: './cypress/snapshots/deprecated/diff',
        INTEGRATION_FOLDER: './cypress/e2e',
        ALWAYS_GENERATE_DIFF: 'always',
        ALLOW_VISUAL_REGRESSION_TO_FAIL: false
      }
    },
    () => {
      if (Cypress.env('visualRegression').type === 'base') {
        cy.visit('./cypress/web/04.html')
        cy.get('H1').contains('bar').should('exist')
        cy.compareSnapshot('foo')
        cy.task('doesExist', './cypress/snapshots/deprecated/base/deprecation.cy.ts/foo.png').should('be.true')
        cy.get('H1').compareSnapshot('h1')
        cy.task('doesExist', './cypress/snapshots/deprecated/base/deprecation.cy.ts/h1.png').should('be.true')
      } else {
        cy.visit('./cypress/web/05.html')
        cy.get('H1').contains('none').should('exist')
        cy.compareSnapshot('foo', 0.01).should((comparisonResult: ComparisonResult) => {
          expect(comparisonResult.error).to.exist
        })
        cy.task('doesExist', './cypress/snapshots/deprecated/diff/deprecation.cy.ts/foo.png').should('be.true')
        cy.get('H1')
          .compareSnapshot('h1', 0.02)
          .should((comparisonResult: ComparisonResult) => {
            expect(comparisonResult.error).to.exist
          })
        cy.task('doesExist', './cypress/snapshots/deprecated/diff/deprecation.cy.ts/h1.png').should('be.true')
      }
    }
  )
})
