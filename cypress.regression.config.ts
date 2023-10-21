import { defineConfig } from 'cypress'
import { CypressConfigEnv } from './src/command'
import { cypressConfigWithEnv } from './cypress.common.config'

const config: CypressConfigEnv = {
  visualRegression: {
    type: 'regression'
  }
}

export default defineConfig(cypressConfigWithEnv(config))
