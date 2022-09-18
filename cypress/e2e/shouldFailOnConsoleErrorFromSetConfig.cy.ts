describe('shouldFailOnConsoleErrorFromSetConfig', () => {
    it('should throw AssertionError on console.error with setExcludeMessages', () => {
        cy.setExcludeMessages([]).then(() => {
            cy.visit('./cypress/fixtures/consoleErrorNotExcludedMessage.html');
        });
    });

    it('should pass AssertionError on console.error with addExcludeMessages', () => {
        cy.addExcludeMessages(['errorNotExcluded']).then(() => {
            cy.visit('./cypress/fixtures/consoleErrorNotExcludedMessage.html');
        });
    });

    it('should throw AssertionError on console.error with deleteExcludeMessages', () => {
        cy.deleteExcludeMessages(['secondErrorExcluded']).then(() => {
            cy.visit('./cypress/fixtures/consoleErrorExcludeMessage.html');
        });
    });
});
