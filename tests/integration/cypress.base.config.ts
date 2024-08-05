import { defineConfig } from 'cypress'
import { cypressConfigWithEnv } from './cypress.common.config'
import type { CypressConfigEnv } from '@src/command'

const config: CypressConfigEnv = {
  visualRegressionType: 'base'
}

export default defineConfig(cypressConfigWithEnv(config))
