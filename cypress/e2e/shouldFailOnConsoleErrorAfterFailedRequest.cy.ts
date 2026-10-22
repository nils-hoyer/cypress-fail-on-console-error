describe('shouldFailOnConsoleErrorAfterFailedRequest', () => {
    it('should throw AssertionError when the app logs a failed request', () => {
        cy.intercept('GET', '/api/users/42', { statusCode: 500 });
        cy.visit('./cypress/fixtures/consoleErrorOnFailedRequest.html');
        cy.contains('Could not load the user');
    });

    it('should pass when the test ignores the failed request', () => {
        cy.addIgnoredConsoleMessages(['Failed to load user']);
        cy.intercept('GET', '/api/users/42', { statusCode: 500 });
        cy.visit('./cypress/fixtures/consoleErrorOnFailedRequest.html');
        cy.contains('Could not load the user');
    });

    it('should pass when the request succeeds', () => {
        cy.intercept('GET', '/api/users/42', { body: { name: 'Ada' } });
        cy.visit('./cypress/fixtures/consoleErrorOnFailedRequest.html');
        cy.contains('Ada');
    });
});
