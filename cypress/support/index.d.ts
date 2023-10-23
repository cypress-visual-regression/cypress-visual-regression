declare namespace Cypress {
  interface Chainable {
    compareSnapshot(
      name: string,
      options?: number | ScreenshotOptions
    ): Chainable<ComparisonResult | boolean>
  }
}
