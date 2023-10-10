const visualRegressionConfig = Cypress.env('visualRegression')

visualRegressionConfig.baseDirectory = './cypress/snapshots/alternative-base'
visualRegressionConfig.diffDirectory = './cypress/snapshots/alternative-diff'
visualRegressionConfig.generateDiff = 'always'

describe(
  'Visual Regression Example with setting paths by environment variables',
  {
    env: visualRegressionConfig
  },
  () => {
    it('take screenshot with parent command', () => {
      if (Cypress.env('visualRegression').type === 'base') {
        cy.visit('./cypress/web/01.html')
        cy.get('H1').contains('Hello, World')
        cy.compareSnapshot('home')
        cy.task('doesExist', `${visualRegressionConfig.baseDirectory}/main.env.cy.ts/home.png`).should('be.true')
      } else {
        cy.visit('./cypress/web/01.html')
        cy.get('H1').contains('Hello, World')
        cy.compareSnapshot('home')
        cy.task('doesExist', `${visualRegressionConfig.diffDirectory}/main.env.cy.ts/home.png`).should('be.true')
      }
    })
    it('take screenshot with child command', () => {
      if (Cypress.env('visualRegression').type === 'base') {
        cy.visit('./cypress/web/01.html')
        cy.get('H1').contains('Hello, World').compareSnapshot('home-child')
        cy.task('doesExist', `${visualRegressionConfig.baseDirectory}/main.env.cy.ts/home-child.png`).should('be.true')
      } else {
        cy.visit('./cypress/web/01.html')
        cy.get('H1').contains('Hello, World').compareSnapshot('home-child')
        cy.task('doesExist', `${visualRegressionConfig.diffDirectory}/main.env.cy.ts/home-child.png`).should('be.true')
      }
    })
  }
)
