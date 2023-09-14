describe(
  'Visual Regression Example with setting paths by environment variables',
  {
    SNAPSHOT_BASE_DIRECTORY: './cypress/snapshots/base',
    SNAPSHOT_DIFF_DIRECTORY: './cypress/snapshots/diff'
  },
  () => {
    it('take screenshot with parent command', () => {
      if (Cypress.env('type') === 'base') {
        cy.visit('./cypress/web/01.html')
        cy.get('H1').contains('Hello, World')
        cy.compareSnapshot('home')
      } else {
        cy.visit('./cypress/web/01.html')
        cy.get('H1').contains('Hello, World')
        cy.compareSnapshot('home')
        cy.task('doesExist', './cypress/snapshots/base/main.env.cy.ts/home.png').should('be.true')
        cy.task('doesExist', './cypress/snapshots/diff/main.env.cy.ts/home.png').should('be.true')
        cy.task('doesExist', './cypress/snapshots/actual/main.env.cy.ts/home.png').should('be.true')
      }
    })

    it('take screenshot with child command', () => {
      if (Cypress.env('type') === 'base') {
        cy.visit('./cypress/web/01.html')
        cy.get('H1').contains('Hello, World').compareSnapshot('home-child')
      } else {
        cy.visit('./cypress/web/01.html')
        cy.get('H1').contains('Hello, World').compareSnapshot('home-child')
        cy.task('doesExist', './cypress/snapshots/base/main.env.cy.ts/home-child.png').should('be.true')
        cy.task('doesExist', './cypress/snapshots/diff/main.env.cy.ts/home-child.png').should('be.true')
        cy.task('doesExist', './cypress/snapshots/actual/main.env.cy.ts/home-child.png').should('be.true')
      }
    })
  }
)
