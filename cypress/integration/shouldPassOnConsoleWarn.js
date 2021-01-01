describe('shouldPassOnConsoleWarn', () => {
    it('should pass on console.warn', () => {
        cy.visit('./cypress/fixtures/consoleWarn.html');
    });
});
