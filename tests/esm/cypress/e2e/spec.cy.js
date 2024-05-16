describe('run cypress-visual-regression in esm project', () => {
  it('should run without errors', () => {
    cy.visit('https://example.cypress.io')
    cy.compareSnapshot('esm')
  })
})
