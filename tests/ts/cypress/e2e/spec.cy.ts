describe('run cypress-visual-regression in ts project', () => {
  it('should run without errors', () => {
    cy.visit('https://example.cypress.io')
    cy.compareSnapshot('ts')
    cy.get('h1').compareSnapshot('ts-heading', 0.2)
  })
})
