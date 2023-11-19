import * as fs from 'node:fs'
import {configureVisualRegression} from './src/plugin'

const cypressCommonConfig: Cypress.ConfigOptions = {
  trashAssetsBeforeRuns: true,
  viewportHeight: 720,
  viewportWidth: 1280,
  video: false,
  e2e: {
    screenshotsFolder: './cypress/snapshots/actual',
    setupNodeEvents(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
      on('before:browser:launch', (_browser, launchOptions) => {
        launchOptions.args.push('--force-device-scale-factor=1')
        return launchOptions
      })
      configureVisualRegression(on)
      on('task', {
        doesExist: (path: string) => fs.existsSync(path)
      })
      return config
    }
  }
}

export const cypressConfigWithEnv = (env: Cypress.ConfigOptions['env']): Cypress.ConfigOptions => {
  return {
    ...cypressCommonConfig,
    env: {
      ...cypressCommonConfig.env,
      ...env
    }
  }
}
