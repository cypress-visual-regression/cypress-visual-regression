import { addCompareSnapshotCommand } from 'cypress-visual-regression/dist/command'
addCompareSnapshotCommand({
  errorThreshold: 0.5,
  capture: 'fullPage'
})
