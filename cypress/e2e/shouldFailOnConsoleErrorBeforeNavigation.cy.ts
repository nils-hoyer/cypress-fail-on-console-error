describe('shouldFailOnConsoleErrorBeforeNavigation', () => {
    it('should throw AssertionError on console.error before a redirect', () => {
        cy.visit('./cypress/fixtures/consoleErrorBeforeRedirect.html');
        cy.location('search').should('equal', '?redirected');
    });

    it('should throw AssertionError on console.error when the page unloads', () => {
        cy.visit('./cypress/fixtures/consoleErrorOnPagehide.html');
        cy.get('a').click();
        cy.location('pathname').should('contain', 'noConsole');
    });
});
