// pins a documented limitation: iframes have their own console, which isn't watched (#540)
describe('shouldPassOnConsoleErrorInIframe', () => {
    it('should pass on console.error in a same-origin iframe', () => {
        cy.visit('./cypress/fixtures/consoleErrorInIframe.html');
        cy.get('#loaded');
    });

    it('should still throw AssertionError on console.error of the page after the iframe loaded', () => {
        cy.visit('./cypress/fixtures/consoleErrorInIframe.html');
        cy.get('#loaded');
        cy.window().then((win) => win.console.error('errorNotExcluded'));
    });
});
