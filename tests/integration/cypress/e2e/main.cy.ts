import { faker } from '@faker-js/faker'

describe('Visual Regression Example', () => {
  it('should display the home page correctly', () => {
    cy.visit('./cypress/web/01.html')
    cy.get('div').contains('Hello, World').should('exist')
    cy.compareSnapshot('home')
  })

  it('handle missing base snapshot file as a failed spec', () => {
    const randomWord = faker.word.verb()
    cy.on('fail', (error) => {
      expect(error.message).to.match(new RegExp(`Base screenshot not found at .*${randomWord}.png`))
      expect(error.message).to.not.contain(' - [Show Difference]')
      return
    })
    cy.visit('./cypress/web/01.html')
    cy.compareSnapshot(randomWord)
  })

  it('should display the register page correctly', () => {
    cy.visit('./cypress/web/02.html')
    cy.get('div').contains('Register').should('exist')
    cy.compareSnapshot('register')
  })

  it('should display the login page correctly', () => {
    cy.visit('./cypress/web/03.html')
    cy.get('div').contains('Login').should('exist')
    cy.compareSnapshot('login', 0.0)
    cy.compareSnapshot('login', 0.1)
  })

  it('should display the component correctly', () => {
    cy.visit('./cypress/web/03.html')
    cy.get('div').contains('Login').should('exist')
    cy.get('form')
      .compareSnapshot('login-form')
      .should((result) => {
        if (Cypress.env('visualRegressionType') === 'base') {
          expect(result.mismatchedPixels).to.not.exist
          expect(result.percentage).to.not.exist
          expect(result.error).to.not.exist
          expect(result.images.actual).to.exist
          expect(result.images.base).to.not.exist
          expect(result.images.diff).to.not.exist
          expect(result.baseGenerated).to.be.true
        } else {
          expect(result.mismatchedPixels).to.equal(0)
          expect(result.percentage).to.equal(0)
          expect(result.error).to.not.exist
          expect(result.images.actual).to.exist
          expect(result.images.base).to.exist
          expect(result.images.diff).to.not.exist
          expect(result.baseGenerated).to.not.exist
        }
      })
    cy.get('form')
      .compareSnapshot('login-form', 0.02)
      .should((result) => {
        if (Cypress.env('visualRegressionType') === 'base') {
          expect(result.baseGenerated).to.be.true
        } else {
          expect(result.mismatchedPixels).to.equal(0)
          expect(result.percentage).to.equal(0)
          expect(result.error).to.not.exist
        }
      })
  })

  it('should display the foo page incorrectly', () => {
    cy.on('fail', (error) => {
      if (error.message.includes("The 'bar' image is different.")) {
        expect(error.message).to.contain("Threshold limit of '0.007' exceeded")
        expect(error.message).to.contain(' - [Show Difference]')
        return
      }
      throw error
    })
    if (Cypress.env('visualRegressionType') === 'base') {
      cy.visit('./cypress/web/04.html')
      cy.get('div').contains('bar').should('exist')
    } else {
      cy.visit('./cypress/web/05.html')
      cy.get('div').contains('none').should('exist')
    }
    cy.compareSnapshot('bar')
  })

  it('should handle custom error thresholds correctly', () => {
    if (Cypress.env('visualRegressionType') === 'base') {
      cy.visit('./cypress/web/04.html')
      cy.compareSnapshot('foo')
      cy.get('div').compareSnapshot('bar')
    } else {
      cy.visit('./cypress/web/05.html')
      cy.get('div').contains('none').should('exist')
      cy.compareSnapshot('foo', 0.2).should((result) => {
        expect(result.error).to.be.undefined
        expect(result.percentage).to.be.below(0.2)
      })
      cy.compareSnapshot('foo', { errorThreshold: 0.01, failSilently: true }).should((result) => {
        expect(result.percentage).to.be.above(0.01)
        expect(result.error).to.exist
      })
      cy.get('div')
        .compareSnapshot('bar', 0.085)
        .should((result) => {
          expect(result.error).to.be.undefined
          expect(result.percentage).to.be.below(0.085)
        })
      cy.get('div')
        .compareSnapshot('bar', { errorThreshold: 0.01, failSilently: true })
        .should((result) => {
          expect(result.percentage).to.be.above(0.01)
          expect(result.images.actual).to.exist
          expect(result.images.base).to.exist
          expect(result.images.diff).to.exist
          expect(result.error).to.exist
        })
    }
  })

  it('should handle custom error thresholds correctly - take 2', () => {
    if (Cypress.env('visualRegressionType') === 'base') {
      cy.visit('./cypress/web/06.html')
    } else {
      cy.visit('./cypress/web/07.html')
    }
    cy.get('div').contains('Color').should('exist')
    cy.compareSnapshot('baz', 0.029)
    cy.compareSnapshot('baz', { errorThreshold: 0.02, failSilently: true })
    cy.compareSnapshot('baz', { failSilently: true })
  })

  it('should compare images of different sizes', () => {
    cy.on('fail', (error) => {
      if (error.message.includes("The 'bar-07' image is different. Threshold limit of '0.1' exceeded")) {
        return
      }
      throw error
    })
    if (Cypress.env('visualRegressionType') === 'base') {
      cy.visit('./cypress/web/07.html')
      cy.get('div').contains('Color').should('exist')
      cy.compareSnapshot('bar-07', 0.1)
    } else {
      cy.visit('./cypress/web/08.html')
      cy.get('div').contains('Color').should('exist')
      cy.compareSnapshot('bar-07', 0.1).then((result) => {
        expect(result.error).to.exist
      })
    }
  })

  it('should pass parameters to cy.screenshot', () => {
    cy.visit('./cypress/web/08.html')
    cy.compareSnapshot('screenshot-params-full', {
      capture: 'fullPage'
    }).then((result) => {
      expect(result.error).is.undefined
    })
  })

  const visualRegressionConfig = Cypress.env()

  it(
    'should not fail if failSilently is set in env',
    {
      env: {
        ...visualRegressionConfig,
        visualRegressionFailSilently: true
      }
    },
    () => {
      if (Cypress.env('visualRegressionType') === 'base') {
        cy.visit('./cypress/web/04.html')
        cy.get('div').contains('bar').should('exist')
        cy.compareSnapshot('foo')
        cy.get('div').compareSnapshot('bar')
      } else {
        cy.visit('./cypress/web/05.html')
        cy.get('div').contains('none').should('exist')
        cy.compareSnapshot('foo', 0.01).should((result) => {
          expect(result.error).to.exist
        })
        cy.get('div')
          .compareSnapshot('bar', 0.02)
          .should((result) => {
            expect(result.error).to.exist
          })
      }
    }
  )

  it.only('should log command options to Cypress.log', () => {
    cy.on('fail', (error) => {
      if (error.message.includes("The 'random' image is different.")) {
        return
      }
      throw error
    })
    cy.on('log:added', (attr) => {
      if (attr.name === 'compareScreenshots') {
        let options: any, result: any
        const cypressVersion = Number.parseInt(Cypress.version.match(/^\d+/)[0])
        if (cypressVersion <= 12) {
          options = attr.consoleProps.Options
          result = attr.consoleProps.Result
        } else {
          options = attr.consoleProps.props.Options
          result = attr.consoleProps.props.Result
        }
        expect(options.baseDirectory).to.equal('cypress/snapshots/base')
        expect(options.diffDirectory).to.equal('cypress/snapshots/diff')
        expect(options.pluginOptions.errorThreshold).to.equal(0.007)
        expect(options.pluginOptions.failSilently).to.be.false
        expect(options.generateDiff).to.equal('fail')
        expect(options.screenshotAbsolutePath).to.exist
        expect(options.screenshotName).to.equal('random')
        expect(options.screenshotOptions.pixelmatchOptions.threshold).to.equal(0.1)
        expect(options.spec.baseName).to.equal('main.cy.ts')
        expect(options.type).to.exist

        if (options.type === 'base') {
          expect(result.baseGenerated).to.be.true
        } else {
          expect(options.type).to.equal('regression')
          expect(result.error).to.contain("The 'random' image is different")
          expect(result.images.base).to.exist
          expect(result.images.diff).to.exist
          expect(result.mismatchedPixels).to.be.greaterThan(0)
          expect(result.percentage).to.be.greaterThan(0)
        }
        expect(result.images.actual).to.exist
      }
    })
    cy.visit('./cypress/web/random.html')
    cy.get('div').should('be.visible')
    cy.compareSnapshot('random')
  })

  it('should not detect errors because of default pixelmatch sensitivity', () => {
    cy.visit('./cypress/web/pixelmatch.html')
    if (Cypress.env('visualRegressionType') === 'base') {
      cy.get('#first').compareSnapshot('pixelmatch-1')
    } else {
      cy.get('#second').compareSnapshot('pixelmatch-1')
    }
  })

  it('should detect errors when pixelmatch sensitivity is 0', () => {
    cy.on('fail', (error) => {
      if (error.message.includes("The 'pixelmatch-2' image is different.")) {
        return
      }
      throw error
    })
    cy.visit('./cypress/web/pixelmatch.html')
    if (Cypress.env('visualRegressionType') === 'base') {
      cy.get('#first').compareSnapshot('pixelmatch-2')
    } else {
      cy.get('#second')
        .compareSnapshot('pixelmatch-2', { pixelmatchOptions: { threshold: 0 } })
        .then((result) => {
          expect(result.error).to.exist
        })
    }
  })
})
