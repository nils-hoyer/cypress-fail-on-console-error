describe('', () => {
  it('should pass on console.warn', () => {
    expect(Cypress.env('failOnConsoleError')).to.be.true
    cy.visit('./cypress/fixtures/consoleWarn.html');
  })
})