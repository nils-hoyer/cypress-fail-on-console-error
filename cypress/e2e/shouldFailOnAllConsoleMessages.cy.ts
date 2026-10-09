describe('shouldFailOnAllConsoleMessages', () => {
    it('should throw AssertionError listing every console message that is not excluded', () => {
        cy.visit('./cypress/fixtures/consoleErrorAndWarn.html');
    });
});
