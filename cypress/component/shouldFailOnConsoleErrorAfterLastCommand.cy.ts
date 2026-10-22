import { WithErrorAfterMount } from './customComponents';

describe('shouldFailOnConsoleErrorAfterLastCommand', () => {
    it('should pass on console.error after the last command', () => {
        cy.mount(WithErrorAfterMount, 'with-error-after-mount');
    });

    it('should throw AssertionError on console.error logged after the previous test ended', () => {
        cy.wrap('next test');
    });

    it('should throw AssertionError on console.error when a command waits for it', () => {
        cy.mount(WithErrorAfterMount, 'with-error-after-mount');
        cy.get('#loaded');
    });

    it('should throw AssertionError in the after hook on console.error after the last command of the last test', () => {
        cy.mount(WithErrorAfterMount, 'with-error-after-mount');
    });
});
