describe('shouldResetConfigBetweenTests', () => {
    beforeEach(() => {
        cy.wrap({ some: 'command' });
    });

    afterEach(() => {
        cy.wrap({ some: 'command' });
    });

    it('should pass AssertionError on console.error', () => {
        cy.setConsoleMessages([
            'firstErrorExcluded',
            'secondErrorNotExcluded',
        ]).then(() => {
            cy.visit('./cypress/fixtures/consoleError.html');
        });
    });

    it('should throw AssertionError on console.error', () => {
        cy.visit('./cypress/fixtures/consoleError.html');
    });
});
