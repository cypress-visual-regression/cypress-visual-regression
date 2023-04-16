interface CompareSnapshotOptions {
  errorThreshold: number;
}

declare global {
  namespace Cypress {
    interface Chainable {
      compareSnapshot(name: string): void;
      compareSnapshot(name: string, errorThreshold?: number): void;
      compareSnapshot(name: string, options?: Partial<Cypress.ScreenshotOptions | CompareSnapshotOptions> ): void;
    }
  }
}

declare function compareSnapshotCommand(options?: Partial<Cypress.ScreenshotOptions | CompareSnapshotOptions>): void;

export = compareSnapshotCommand;
