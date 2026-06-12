const { defineConfig } = require('cypress')
const { configureVisualRegression } = require('cypress-visual-regression')

module.exports = defineConfig({
  allowCypressEnv: false,
  e2e: {
    expose: {
      visualRegressionType: 'base'
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
      configureVisualRegression(on)
    }
  }
})
