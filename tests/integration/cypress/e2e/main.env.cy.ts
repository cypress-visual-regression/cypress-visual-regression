import { CypressConfigEnv } from '@src/command'

const visualRegressionConfig = Cypress.env()

visualRegressionConfig.baseDirectory = './cypress/snapshots/alternative-base'
visualRegressionConfig.diffDirectory = './cypress/snapshots/alternative-diff'
visualRegressionConfig.generateDiff = 'always'

const env: Partial<CypressConfigEnv> = {
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
      if (env.visualRegressionType === 'base') {
        cy.visit('./cypress/web/01.html')
        cy.get('H1').contains('Hello, World')
        cy.compareSnapshot('home')
        cy.task('doesExist', `${env.visualRegressionBaseDirectory}/cypress/e2e/main.env.cy.ts/home.png`).should(
          'be.true'
        )
      } else {
        cy.visit('./cypress/web/01.html')
        cy.get('H1').contains('Hello, World')
        cy.compareSnapshot('home')
        cy.task('doesExist', `${env.visualRegressionDiffDirectory}/cypress/e2e/main.env.cy.ts/home.png`).should(
          'be.true'
        )
      }
    })
    it('take screenshot with child command', () => {
      if (env.visualRegressionType === 'base') {
        cy.visit('./cypress/web/01.html')
        cy.get('H1').contains('Hello, World').compareSnapshot('home-child')
        cy.task(
          'doesExist',
          `${visualRegressionConfig.baseDirectory}/cypress/e2e/main.env.cy.ts/home-child.png`
        ).should('be.true')
      } else {
        cy.visit('./cypress/web/01.html')
        cy.get('H1').contains('Hello, World').compareSnapshot('home-child')
        cy.task(
          'doesExist',
          `${visualRegressionConfig.diffDirectory}/cypress/e2e/main.env.cy.ts/home-child.png`
        ).should('be.true')
      }
    })
  }
)
