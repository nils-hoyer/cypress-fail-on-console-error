describe('shouldFailOnConsoleErrorWithRetries', { retries: 1 }, () => {
    it('should pass when the retry has no console.error', () => {
        cy.visit(
            Cypress.currentRetry === 0
                ? './cypress/fixtures/consoleErrorNotExcludedMessage.html'
                : './cypress/fixtures/noConsole.html'
        );
    });

    it('should throw AssertionError when every attempt logs console.error', () => {
        cy.visit('./cypress/fixtures/consoleErrorNotExcludedMessage.html');
    });

    it('should pass after a test that failed every attempt', () => {
        cy.visit('./cypress/fixtures/noConsole.html');
    });
});
