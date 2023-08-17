interface CompareSnapshotOptions {
  errorThreshold: number;
  keepDiff: boolean;
  skipDiff: boolean;
  allowVisualRegressionToFail: boolean;
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

export default function compareSnapshotCommand(options?: Partial<Cypress.ScreenshotOptions | CompareSnapshotOptions>): void;
