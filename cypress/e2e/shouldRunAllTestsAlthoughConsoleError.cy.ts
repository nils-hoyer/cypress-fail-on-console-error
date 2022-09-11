describe('shouldRunAllTestsAlthoughConsoleError', () => {
    it('should throw AssertionError on console.error', () => {
        cy.visit('./cypress/fixtures/consoleError.html');
    });

    it('should pass on console.info', () => {
        cy.visit('./cypress/fixtures/consoleInfo.html');
    });

    it('should throw AssertionError on console.error', () => {
        cy.visit('./cypress/fixtures/consoleError.html');
    });
});
