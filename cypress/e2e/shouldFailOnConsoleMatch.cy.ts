describe('shouldFailOnConsoleMatch', () => {
    it('should throw AssertionError on console.error', () => {
        cy.setConfig({ consoleTypes: ['error'] }).then(() => {
            cy.visit('./cypress/fixtures/shouldFailOnConsoleMatch.html');
        });
    });

    it('should throw AssertionError on console.warn', () => {
        cy.setConfig({ consoleTypes: ['warn'] }).then(() => {
            cy.visit('./cypress/fixtures/shouldFailOnConsoleMatch.html');
        });
    });

    it('should throw AssertionError on console.info', () => {
        cy.setConfig({ consoleTypes: ['info'] }).then(() => {
            cy.visit('./cypress/fixtures/shouldFailOnConsoleMatch.html');
        });
    });

    it('should throw AssertionError on console.debug', () => {
        cy.setConfig({ consoleTypes: ['debug'] }).then(() => {
            cy.visit('./cypress/fixtures/shouldFailOnConsoleMatch.html');
        });
    });

    it('should throw AssertionError on console.trace', () => {
        cy.setConfig({ consoleTypes: ['trace'] }).then(() => {
            cy.visit('./cypress/fixtures/shouldFailOnConsoleMatch.html');
        });
    });

    it('should throw AssertionError on console.table', () => {
        cy.setConfig({ consoleTypes: ['table'] }).then(() => {
            cy.visit('./cypress/fixtures/shouldFailOnConsoleMatch.html');
        });
    });
});
