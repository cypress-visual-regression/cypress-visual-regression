import { compareSnapshotCommand } from '../../src/command'
compareSnapshotCommand()

// TODO maybe delete
declare namespace Cypress {
    interface SuiteConfigOverrides {
        SNAPSHOT_BASE_DIRECTORY?: string
        SNAPSHOT_DIFF_DIRECTORY?: string
    }
}
