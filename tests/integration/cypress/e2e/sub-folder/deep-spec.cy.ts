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

describe('File name tests', () => {
  it('test file names', () => {
    cy.on('fail', (error) => {
      if (
        error.message.includes(
          'The "files-1[2<3>4:5"6\\7|8?9*10, 11]12(13)" image is different. Threshold limit exceeded!'
        )
      ) {
        return
      }
      throw error
    })
    if (Cypress.env('visualRegressionType') === 'base') {
      cy.visit('./cypress/web/07.html')
      cy.compareSnapshot('files-1[2<3>4:5"6\\7|8?9*10, 11]12(13)')
      cy.task(
        'doesExist',
        './cypress/snapshots/base/cypress/e2e/sub-folder/deep-spec.cy.ts/files-1[2345678910, 11]12(13).png'
      ).should('be.true')
    } else {
      cy.visit('./cypress/web/08.html')
      cy.compareSnapshot('files-1[2<3>4:5"6\\7|8?9*10, 11]12(13)').then((result) => {
        expect(result.error).to.exist
      })
    }
  })
})
