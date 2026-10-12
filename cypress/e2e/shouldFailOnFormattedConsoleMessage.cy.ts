describe('shouldFailOnFormattedConsoleMessage', () => {
    it('should throw AssertionError with the format specifiers filled in', () => {
        cy.visit('./cypress/fixtures/consoleErrorWithFormat.html');
    });

    it('should pass when the filled in message is ignored', () => {
        cy.setConfig({
            ignoreConsoleMessages: [
                /^Warning: componentWillMount is deprecated/,
            ],
        });
        cy.visit('./cypress/fixtures/consoleErrorWithFormat.html');
    });
});
