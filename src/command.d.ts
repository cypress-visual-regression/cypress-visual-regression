
declare global {
  namespace Cypress {
    interface Chainable {
      compareSnapshot(name: string, errorThreshold?: number ): void;
    }
  }
}

export default function compareSnapshotCommand(options?: Partial<Cypress.ScreenshotDefaultsOptions>): void;
