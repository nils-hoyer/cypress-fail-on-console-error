describe('shouldFailOnIncludedConsoleMessages', () => {
    it('should throw AssertionError only on included console messages that are not excluded', () => {
        cy.getConfig().then((config) =>
            cy.setConfig({ ...config, includeConsoleMessages: [/Excluded/] })
        );
        cy.visit('./cypress/fixtures/consoleErrorAndWarn.html');
    });

    it('should pass when no console message is included', () => {
        cy.getConfig().then((config) =>
            cy.setConfig({ ...config, includeConsoleMessages: ['notLogged'] })
        );
        cy.visit('./cypress/fixtures/consoleErrorAndWarn.html');
    });

    it('should throw AssertionError only on included console messages of a console method', () => {
        cy.setConfig({
            consoleTypes: ['error', 'warn'],
            includeConsoleMessages: [{ type: 'warn', message: 'sameMessage' }],
        });
        cy.visit('./cypress/fixtures/consoleSameMessage.html');
    });
});
