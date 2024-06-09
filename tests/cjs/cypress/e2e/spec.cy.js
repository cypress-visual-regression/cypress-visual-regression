describe('run cypress-visual-regression in cjs project', () => {
  it('should run without errors', () => {
    cy.visit('https://example.cypress.io')
    cy.compareSnapshot('cjs')
  })
})
