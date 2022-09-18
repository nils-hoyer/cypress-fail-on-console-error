describe('shouldFailOnConsoleErrorFromSetConfig', () => {
    it('should throw AssertionError on console.error with setConsoleMessages', () => {
        cy.setConsoleMessages([]).then(() => {
            cy.visit('./cypress/fixtures/consoleErrorNotExcludedMessage.html');
        });
    });

    it('should pass AssertionError on console.error with addConsoleMessages', () => {
        cy.addConsoleMessages(['errorNotExcluded']).then(() => {
            cy.visit('./cypress/fixtures/consoleErrorNotExcludedMessage.html');
        });
    });

    it('should throw AssertionError on console.error with deleteConsoleMessages', () => {
        cy.deleteConsoleMessages(['secondErrorExcluded']).then(() => {
            cy.visit('./cypress/fixtures/consoleErrorExcludeMessage.html');
        });
    });
});
