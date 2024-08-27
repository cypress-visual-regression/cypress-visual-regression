const visualRegressionConfig = Cypress.env()

visualRegressionConfig.baseDirectory = './cypress/snapshots/alternative-base'
visualRegressionConfig.diffDirectory = './cypress/snapshots/alternative-diff'
visualRegressionConfig.generateDiff = 'always'

const env: any = {
  ...Cypress.env(),
  visualRegressionBaseDirectory: './cypress/snapshots/alternative-base',
  visualRegressionDiffDirectory: './cypress/snapshots/alternative-diff',
  visualRegressionGenerateDiff: 'always'
}

describe(
  'Visual Regression Example with setting paths by environment variables',
  {
    env
  },
  () => {
    it('take screenshot with parent command', () => {
      cy.visit('./cypress/web/01.html')
      cy.get('H1').contains('Hello, World')
      cy.compareSnapshot('home')
      if (env.visualRegressionType === 'base') {
        cy.readFile(`${env.visualRegressionBaseDirectory}/cypress/e2e/main.env.cy.ts/home.png`).should('exist')
      } else {
        cy.readFile(`${env.visualRegressionDiffDirectory}/cypress/e2e/main.env.cy.ts/home.png`).should('exist')
      }
    })

    it('take screenshot with child command', () => {
      cy.visit('./cypress/web/01.html')
      cy.get('H1').contains('Hello, World').compareSnapshot('home-child')
      if (env.visualRegressionType === 'base') {
        cy.readFile(`${visualRegressionConfig.baseDirectory}/cypress/e2e/main.env.cy.ts/home-child.png`).should('exist')
      } else {
        cy.readFile(`${visualRegressionConfig.diffDirectory}/cypress/e2e/main.env.cy.ts/home-child.png`).should('exist')
      }
    })
  }
)

describe(
  'Overriding default configuration',
  {
    env
  },
  () => {
    it('should consider errorThershold from e2e file', () => {
      cy.visit('./cypress/web/01.html')
      cy.get('H1').contains('Hello, World')
      if (env.visualRegressionType === 'base') {
        cy.get('H1').compareSnapshot('config')
      } else {
        cy.get('H1')
          .compareSnapshot('config', { padding: 30 })
          .then((result) => {
            expect(result.percentage).to.be.greaterThan(0).to.be.lessThan(5)
          })
      }
    })
  }
)
