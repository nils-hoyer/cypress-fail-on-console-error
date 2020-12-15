describe('', () => {
  it('should throw AssertionError on console.error', () => {
    expect(Cypress.env('failOnConsoleError')).to.be.true
    cy.visit('./cypress/fixtures/consoleError.html');
  })
})