describe('shouldFailOnConsoleErrorAfterLastCommand', () => {
    it('should pass on console.error after the last command', () => {
        cy.visit('./cypress/fixtures/consoleErrorAfterLoad.html');
    });

    it('should pass although the previous test logged after its last command', () => {
        cy.wrap('next test');
    });

    it('should throw AssertionError on console.error when a command waits for it', () => {
        cy.visit('./cypress/fixtures/consoleErrorAfterLoad.html');
        cy.get('#loaded');
    });

    it('should throw AssertionError in the after hook on console.error after the last command of the last test', () => {
        cy.visit('./cypress/fixtures/consoleErrorAfterLoad.html');
    });
});
