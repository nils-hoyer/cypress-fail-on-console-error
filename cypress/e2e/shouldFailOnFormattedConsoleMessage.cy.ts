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

    it('should throw AssertionError with %%, DOM elements, Maps and Sets as the browser shows them', () => {
        cy.visit('./cypress/fixtures/consoleErrorWithValues.html');
    });
});
