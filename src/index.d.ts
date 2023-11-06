/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable @typescript-eslint/method-signature-style */
declare namespace Cypress {
  interface Chainable {
    compareSnapshot(name: string, options?: PluginCommandOptions): Chainable<VisualRegressionResult>
  }
}
