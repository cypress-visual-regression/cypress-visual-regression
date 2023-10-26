declare namespace Cypress {
  interface Chainable {
    compareSnapshot(name: string, options?: PluginCommandOptions): Chainable<VisualRegressionResult>
  }
}
