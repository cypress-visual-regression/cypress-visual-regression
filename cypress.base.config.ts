import { defineConfig } from 'cypress'
import * as fs from 'node:fs'
import configureVisualRegression from './src/plugin'


export default defineConfig({
  trashAssetsBeforeRuns: true,
  viewportHeight: 720,
  viewportWidth: 1280,
  video: false,
  e2e: {
    screenshotsFolder: './cypress/snapshots/actual',
    env: {
      visualRegression: {
        type: 'base'
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
