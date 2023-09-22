import { defineConfig } from 'cypress'
import fs from 'fs'
import getCompareSnapshotsPlugin from './src/plugin.js'

export default defineConfig({
  // screenshotsFolder: './cypress/snapshots/actual', TODO this doesn't work ?!  boogie: I think it does, but we need to set it inside "e2e" or "component"
  trashAssetsBeforeRuns: true,
  viewportHeight: 720,
  viewportWidth: 1280,
  video: false,
  e2e: {
    env: {
      visualRegression: {
        type: 'base'
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
