import { defineConfig } from 'cypress'
import fs from 'fs'
import configureVisualRegression from './src/plugin.js'

export default defineConfig({
  trashAssetsBeforeRuns: true,
  viewportHeight: 720,
  viewportWidth: 1280,
  video: false,
  e2e: {
    screenshotsFolder: './cypress/snapshots/actual',
    env: {
      visualRegression: {
        type: 'regression'
      }
    },
    setupNodeEvents(on: any, config: any) {
      configureVisualRegression(on)

      on('task', {
        doesExist: (path: string) => fs.existsSync(path)
      })

      return config
    }
  }
})
