describe('should reset spies between tests on cypress failure', () => {
    it('should throw cypress error', () => {
        cy.visit('./cypress/fixtures/fail.html');
        cy.get('.notExisting', { timeout: 2000 }).should('be.visible');
    });

    it('should pass with no console error', () => {
        cy.get('body');
    });
});
