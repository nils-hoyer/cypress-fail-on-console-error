import { WithErrorAfterMount } from './customComponents';

describe('shouldFailOnConsoleErrorAfterLastCommand', () => {
    it('should pass on console.error after the last command', () => {
        cy.mount(WithErrorAfterMount, 'with-error-after-mount');
    });

    it('should throw AssertionError on console.error when a command waits for it', () => {
        cy.mount(WithErrorAfterMount, 'with-error-after-mount');
        cy.get('#loaded');
    });
});
