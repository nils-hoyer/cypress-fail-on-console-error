describe('shouldFailOnConsoleErrorAfterLastCommand', () => {
    it('should pass on console.error after the last command', () => {
        cy.visit('./cypress/fixtures/consoleErrorAfterLoad.html');
    });

    it('should throw AssertionError on console.error when a command waits for it', () => {
        cy.visit('./cypress/fixtures/consoleErrorAfterLoad.html');
        cy.get('#loaded');
    });
});
