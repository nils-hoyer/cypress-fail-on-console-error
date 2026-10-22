describe('shouldReportConsoleErrorsAfterLastCommandAtSpecEnd', () => {
    beforeEach(() => {
        cy.visit('./cypress/fixtures/noConsole.html');
    });

    it('should pass on console.error after the last command', () => {
        cy.visit('./cypress/fixtures/consoleErrorAfterLoad.html');
    });

    it('should pass on console.error after the last command that the test ignores', () => {
        cy.addIgnoredConsoleMessages(['errorAfterLoad']);
        cy.visit('./cypress/fixtures/consoleErrorAfterLoad.html');
    });

    it('should run its beforeEach hook although the previous tests logged after their last command', () => {
        cy.get('body');
    });

    describe('with retries', { retries: 1 }, () => {
        it('should pass on console.error after the last command', () => {
            cy.visit('./cypress/fixtures/consoleErrorAfterLoad.html');
        });

        it('should get the after all hook failure for the console.errors after the last command', () => {
            cy.get('body');
        });
    });
});
