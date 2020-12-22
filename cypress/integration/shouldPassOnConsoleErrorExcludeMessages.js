describe('shouldPassOnConsoleErrorExcludeMessages', () => {
    it('should pass on exclude message matching console.error message', () => {
        expect(Cypress.env('failOnConsoleError')).not.to.be.undefined;
        expect(Cypress.env('failOnConsoleError').excludeMessages[0]).to.equal(
            'console.error'
        );
        cy.visit('./cypress/fixtures/consoleError.html');
    });
});
