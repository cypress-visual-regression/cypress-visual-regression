declare namespace Cypress {
  interface SuiteConfigOverrides {
    SNAPSHOT_BASE_DIRECTORY?: string
    SNAPSHOT_DIFF_DIRECTORY?: string
  }
}
