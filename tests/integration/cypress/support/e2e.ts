import { addCompareSnapshotCommand } from 'cypress-visual-regression/dist/command'
addCompareSnapshotCommand({
  pixelmatchOptions: {
    threshold: 0.1
  },
  errorThreshold: 0,
  failSilently: false,
  capture: 'fullPage'
})
