describe('shouldPassWithoutFailOnConsoleErrorConfig', () => {
    it('should pass without failOnConsoleError config', () => {
        expect(Cypress.env('failOnConsoleError')).to.be.undefined;
        cy.visit('./cypress/fixtures/consoleError.html');
    });
});
