import { compareSnapshotCommand } from '../../src/command'
compareSnapshotCommand()

// TODO maybe delete boogie: I thinks it is use in main.env.cy.ts but for sure we should move this declaration to a type declaration file *.d.ts
declare namespace Cypress {
    interface SuiteConfigOverrides {
        SNAPSHOT_BASE_DIRECTORY?: string
        SNAPSHOT_DIFF_DIRECTORY?: string
    }
}
