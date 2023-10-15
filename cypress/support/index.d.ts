declare namespace Cypress {
  interface Chainable {
    compareSnapshot(
      name: string,
      options?: number | Partial<ScreenshotOptions | SnapshotOptions>
    ): Chainable<ComparisonResult | boolean>
  }
}
