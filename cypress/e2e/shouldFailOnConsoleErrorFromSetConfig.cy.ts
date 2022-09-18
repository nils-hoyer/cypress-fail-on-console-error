describe('shouldFailOnConsoleErrorFromSetConfig', () => {
    it('should throw AssertionError on console.error with setExcludeMessages', () => {
        cy.setExcludeMessages([]).then(() => {
            cy.visit('./cypress/fixtures/consoleError.html');
        });
    });

    it('should pass AssertionError on console.error with addExcludeMessages', () => {
        cy.addExcludeMessages([
            'firstErrorExcluded',
            'secondErrorNotExcluded',
        ]).then(() => {
            cy.visit('./cypress/fixtures/consoleError.html');
        });
    });

    it('should throw AssertionError on console.error with deleteExcludeMessages', () => {
        cy.deleteExcludeMessages([
            'firstErrorExcluded',
            'secondErrorNotExcluded',
        ]).then(() => {
            cy.visit('./cypress/fixtures/consoleError.html');
        });
    });
});
