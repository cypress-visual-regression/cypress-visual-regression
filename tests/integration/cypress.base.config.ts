import { defineConfig } from 'cypress'
import { CypressConfigEnv } from '@src/command'
import { cypressConfigWithEnv } from './cypress.common.config'

const config: CypressConfigEnv = {
  visualRegressionType: 'base'
}

export default defineConfig(cypressConfigWithEnv(config))
