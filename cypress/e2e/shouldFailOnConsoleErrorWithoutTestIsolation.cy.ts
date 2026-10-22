describe(
    'shouldFailOnConsoleErrorWithoutTestIsolation',
    { testIsolation: false },
    () => {
        it('should pass on console.error after the last command', () => {
            cy.visit('./cypress/fixtures/consoleErrorAfterLoad.html');
        });

        it('should throw AssertionError on console.error logged after the previous test ended', () => {
            cy.get('#loaded');
        });

        it('should pass on the same page without console.error', () => {
            cy.get('#loaded');
        });
    }
);
