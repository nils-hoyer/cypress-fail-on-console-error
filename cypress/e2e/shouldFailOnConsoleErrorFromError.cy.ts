describe('shouldFailOnConsoleError', () => {
    it('should throw AssertionError on console.error from new error', () => {
        cy.visit('./cypress/fixtures/consoleErrorFromError.html');
    });
});
