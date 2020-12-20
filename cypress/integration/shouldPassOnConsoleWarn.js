describe('', () => {
    it('should pass on console.warn', () => {
        expect(Cypress.env('failOnConsoleError')).not.to.be.undefined;
        cy.visit('./cypress/fixtures/consoleWarn.html');
    });
});
