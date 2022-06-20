describe('shouldPassOnConsoleErrorExcludeMessages', () => {
    it('should pass on exclude message matching console.error message', () => {
        cy.visit('./cypress/fixtures/consoleErrorExcludeMessage.html');
    });
});
