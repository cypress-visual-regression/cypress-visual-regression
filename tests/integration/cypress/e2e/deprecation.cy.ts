import type { VisualRegressionResult } from '@src/plugin'

describe('Deprecation Tests', () => {
  it(
    'should still use type deprecated variable',
    {
      env: {
        type: 'base'
      }
    },
    () => {
      cy.visit('./cypress/web/01.html')
      cy.get('H1').contains('Hello, World').should('exist')
      cy.compareSnapshot('home').then((result: VisualRegressionResult) => {
        expect(result.baseGenerated).to.be.true
      })
    }
  )

  it(
    'should still use other deprecated variables',
    {
      env: {
        failSilently: false,
        SNAPSHOT_BASE_DIRECTORY: './cypress/snapshots/deprecated/base',
        SNAPSHOT_DIFF_DIRECTORY: './cypress/snapshots/deprecated/diff',
        INTEGRATION_FOLDER: './cypress/e2e',
        ALWAYS_GENERATE_DIFF: 'always',
        ALLOW_VISUAL_REGRESSION_TO_FAIL: true
      }
    },
    () => {
      if (Cypress.env('visualRegressionType') === 'base') {
        cy.visit('./cypress/web/04.html')
        cy.get('H1').contains('bar').should('exist')
        cy.compareSnapshot('foo')
        cy.readFile('./cypress/snapshots/deprecated/base/cypress/e2e/deprecation.cy.ts/foo.png').should('exist')
        cy.get('H1').compareSnapshot('h1')
        cy.readFile('./cypress/snapshots/deprecated/base/cypress/e2e/deprecation.cy.ts/h1.png').should('exist')
      } else {
        cy.visit('./cypress/web/05.html')
        cy.get('H1').contains('none').should('exist')
        cy.compareSnapshot('foo', 0.01).should((result: VisualRegressionResult) => {
          expect(result.error).to.exist
        })
        cy.readFile('./cypress/snapshots/deprecated/diff/cypress/e2e/deprecation.cy.ts/foo.png').should('exist')
        cy.get('H1')
          .compareSnapshot('h1', 0.02)
          .should((result: VisualRegressionResult) => {
            expect(result.error).to.exist
          })
        cy.readFile('./cypress/snapshots/deprecated/diff/cypress/e2e/deprecation.cy.ts/h1.png').should('exist')
      }
    }
  )
})
