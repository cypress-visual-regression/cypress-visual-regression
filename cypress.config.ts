import { defineConfig } from 'cypress'
import fs from 'fs'
import getCompareSnapshotsPlugin from './dist/plugin'

export default defineConfig({
  // screenshotsFolder: './cypress/snapshots/actual', TODO this doesn't work
  trashAssetsBeforeRuns: true,
  viewportHeight: 720,
  viewportWidth: 1280,
  video: false,
  e2e: {
    setupNodeEvents(on: any, config: any) {
      getCompareSnapshotsPlugin(on, config);

      on("task", {
        doesExist: (path: string) => fs.existsSync(path)
      })
      
      return config;
    },
  },
});
