const { defineConfig } = require('cypress')
const { configureVisualRegression } = require('cypress-visual-regression')

module.exports = defineConfig({
  e2e: {
    env: {
      visualRegressionType: 'base'
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
      configureVisualRegression(on)
    }
  }
})
