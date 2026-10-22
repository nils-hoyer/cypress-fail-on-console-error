describe('shouldFailOnConsoleErrorInBeforeEachHook', () => {
    beforeEach(() => {
        cy.visit('./cypress/fixtures/consoleErrorNotExcludedMessage.html');
    });

    it('should throw AssertionError on console.error in the beforeEach hook', () => {
        cy.get('body');
    });

    it('should be skipped after the failed beforeEach hook', () => {
        cy.get('body');
    });
});
