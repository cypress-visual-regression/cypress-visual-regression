import { defineConfig } from 'cypress'
import { configureVisualRegression } from 'cypress-visual-regression'

export default defineConfig({
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
