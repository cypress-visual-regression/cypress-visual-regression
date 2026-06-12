import { defineConfig } from 'cypress'
import { configureVisualRegression } from 'cypress-visual-regression'

export default defineConfig({
  allowCypressEnv: false,
  e2e: {
    expose: {
      visualRegressionType: 'base'
    },
    setupNodeEvents(on) {
      // implement node event listeners here
      configureVisualRegression(on)
    }
  }
})
