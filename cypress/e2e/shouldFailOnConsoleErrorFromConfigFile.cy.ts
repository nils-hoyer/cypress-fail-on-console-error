describe('shouldFailOnConsoleErrorFromConfigFile', () => {
    it('should throw AssertionError on console.error from config file with exclude', () => {
        cy.visit(
            './cypress/fixtures/shouldFailOnConsoleErrorFromConfigFile.html'
        );
    });
});
