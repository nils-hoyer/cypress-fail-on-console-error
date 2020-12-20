describe('', () => {
    it('should throw AssertionError on console.error', () => {
        expect(Cypress.env('failOnConsoleError')).not.to.be.undefined;
        cy.visit('./cypress/fixtures/consoleError.html');
    });
});
