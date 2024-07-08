it('test outside context', () => {
  cy.visit('./cypress/web/01.html')
  cy.compareSnapshot('outside-context')
})

describe('Inner file within context', () => {
  it('test inside context', () => {
    cy.visit('./cypress/web/01.html')
    cy.compareSnapshot('inside-context')
  })

  describe('Inner file within inner context', () => {
    it('test inside inner context', () => {
      cy.visit('./cypress/web/01.html')
      cy.compareSnapshot('inside-inner-context')
    })
  })
})
