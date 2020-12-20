describe('', () => {
    it('should pass on exclude matching console.error', () => {
        expect(Cypress.env('failOnConsoleError')).not.to.be.undefined;
        expect(Cypress.env('failOnConsoleError').exclude[0]).to.equal(
            'console.error'
        );
        cy.visit('./cypress/fixtures/consoleError.html');
    });
});
