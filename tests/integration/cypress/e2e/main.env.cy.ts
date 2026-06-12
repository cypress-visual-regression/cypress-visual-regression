const expose: Record<string, unknown> = {
  visualRegressionBaseDirectory: './cypress/snapshots/alternative-base',
  visualRegressionDiffDirectory: './cypress/snapshots/alternative-diff',
  visualRegressionGenerateDiff: 'always'
}

describe(
  'Visual Regression Example with setting paths by environment variables',
  {
    expose
  },
  () => {
    it('take screenshot with parent command', () => {
      cy.visit('./cypress/web/01.html')
      cy.get('div').contains('Hello, World')
      cy.compareSnapshot('home')
      const visualRegressionType = ((Cypress.expose() ?? {}) as Record<string, unknown>).visualRegressionType
      if (visualRegressionType === 'base') {
        cy.readFile(`${expose.visualRegressionBaseDirectory as string}/cypress/e2e/main.env.cy.ts/home.png`).should(
          'exist'
        )
      } else {
        cy.readFile(`${expose.visualRegressionDiffDirectory as string}/cypress/e2e/main.env.cy.ts/home.png`).should(
          'exist'
        )
      }
    })
    it('take screenshot with child command', () => {
      cy.visit('./cypress/web/01.html')
      cy.get('div').contains('Hello, World').compareSnapshot('home-child')
      const visualRegressionType = ((Cypress.expose() ?? {}) as Record<string, unknown>).visualRegressionType
      if (visualRegressionType === 'base') {
        cy.readFile(
          `${expose.visualRegressionBaseDirectory as string}/cypress/e2e/main.env.cy.ts/home-child.png`
        ).should('exist')
      } else {
        cy.readFile(
          `${expose.visualRegressionDiffDirectory as string}/cypress/e2e/main.env.cy.ts/home-child.png`
        ).should('exist')
      }
    })
  }
)
