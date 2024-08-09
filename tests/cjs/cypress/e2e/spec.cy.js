describe('run cypress-visual-regression in cjs project', () => {
  it('should run without errors', () => {
    cy.visit('https://example.cypress.io')
    cy.compareSnapshot('cjs')
  })

  it('test file names on cjs', () => {
    cy.on('fail', (error) => {
      if (
        error.message.includes(
          "The 'files-1[2<3>4:5\"6\\7|8?9*10, 11]12(13)' image is different. Threshold limit of '0' exceeded"
        )
      ) {
        return
      }
      throw error
    })
    if (Cypress.env('visualRegressionType') === 'base') {
      cy.visit('https://example.cypress.io/')
      cy.compareSnapshot('files-1[2<3>4:5"6\\7|8?9*10, 11]12(13)')
      cy.readFile('./cypress/snapshots/base/cypress/e2e/spec.cy.js/files-1[2345678910, 11]12(13).png').should('exist')
    } else {
      cy.visit('https://example.cypress.io/utilities')
      cy.compareSnapshot('files-1[2<3>4:5"6\\7|8?9*10, 11]12(13)').then((result) => {
        expect(result.error).to.exist
      })
    }
  })
})
