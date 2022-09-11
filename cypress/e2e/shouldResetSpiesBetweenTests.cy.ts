describe('shouldResetSpiesBetweenTests', () => {
    beforeEach(() => {
        cy.wrap({ some: 'command' });
    });

    afterEach(() => {
        cy.wrap({ some: 'command' });
    });

    it('should throw AssertionError on console.error', () => {
        cy.visit('./cypress/fixtures/consoleError.html');
    });

    it('should pass on error excluded message', () => {
        cy.visit('./cypress/fixtures/noConsole.html');
    });
});
