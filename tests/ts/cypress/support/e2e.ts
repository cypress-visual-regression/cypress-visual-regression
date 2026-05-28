import { addCompareSnapshotCommand } from 'cypress-visual-regression/dist/command'
addCompareSnapshotCommand()

Cypress.Commands.overwrite('compareSnapshot', (originalFn, ...args) => {
  return originalFn(...args)
})

Cypress.Commands.overwrite('compareSnapshot', (originalFn, subject, name, commandOptions) => {
  if (typeof commandOptions === 'number') {
    return originalFn(subject, name, commandOptions)
  }

  return originalFn(subject, name, {
    ...commandOptions,
    onBeforeScreenshot($el: JQuery) {
      commandOptions?.onBeforeScreenshot?.($el)
    }
  })
})
