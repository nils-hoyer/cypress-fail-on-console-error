describe(
    'shouldFailOnConsoleErrorWithoutTestIsolation',
    { testIsolation: false },
    () => {
        it('should pass on console.error after the last command', () => {
            cy.visit('./cypress/fixtures/consoleErrorAfterLoad.html');
        });

        it('should pass although the previous test logged after its last command', () => {
            cy.get('#loaded');
        });

        it('should get the after all hook failure for the console.error of the first test', () => {
            cy.get('#loaded');
        });
    }
);
