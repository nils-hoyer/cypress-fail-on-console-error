describe('shouldRunAllTestsWithConsoleError', () => {
    it('should throw AssertionError on console.error', () => {
        cy.visit('./cypress/fixtures/consoleError.html');
    });

    it('should pass on console.warn', () => {
        cy.visit('./cypress/fixtures/consoleWarn.html');
    });

    it('should pass on exclude message matching console.error message', () => {
        cy.visit('./cypress/fixtures/consoleErrorExcludeMessage.html');
    });

    it('should throw AssertionError on console.error', () => {
        cy.visit('./cypress/fixtures/consoleError.html');
    });
});
