describe('shouldFailOnConsoleErrorAndConsoleWarn', () => {
    it('should throw AssertionError on console.error', () => {
        cy.visit('./cypress/fixtures/consoleError.html');
    });

    it('should throw AssertionError on console.warn', () => {
        cy.visit('./cypress/fixtures/consoleWarn.html');
    });

    it('should pass on console.info', () => {
        cy.visit('./cypress/fixtures/consoleInfo.html');
    });

    it('should pass on console.debug', () => {
        cy.visit('./cypress/fixtures/consoleInfo.html');
    });

    it('should pass on console.trace', () => {
        cy.visit('./cypress/fixtures/consoleInfo.html');
    });

    it('should pass on console.trace', () => {
        cy.visit('./cypress/fixtures/consoleInfo.html');
    });
});
