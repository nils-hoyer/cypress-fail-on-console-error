describe('shouldFailOnConsoleError', () => {
    it('should throw AssertionError on console.error', () => {
        cy.visit('./cypress/fixtures/consoleError.html');
    });
});
