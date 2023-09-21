import { defineConfig } from 'cypress'
import fs from 'fs'
import getCompareSnapshotsPlugin from './src/plugin'

export default defineConfig({
  // screenshotsFolder: './cypress/snapshots/actual', TODO this doesn't work boogie: same as may prev comment
  trashAssetsBeforeRuns: true,
  viewportHeight: 720,
  viewportWidth: 1280,
  video: false,
  e2e: {
    env: {
      visualRegression: {
        type: 'regression'
      }
    },
    setupNodeEvents(on: any, config: any) {
      getCompareSnapshotsPlugin(on, config)

      on('task', {
        doesExist: (path: string) => fs.existsSync(path)
      })

      return config
    }
  }
})