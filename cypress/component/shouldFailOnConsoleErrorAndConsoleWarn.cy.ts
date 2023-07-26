import { WithError, WithWarn, WithInfo } from './customComponents';

describe('shouldFailOnConsoleErrorAndConsoleWarn', () => {
    it('should throw AssertionError on console.error', () => {
        cy.mount(WithError, 'with-error');
    });

    it('should throw AssertionError on console.warn', () => {
        cy.mount(WithWarn, 'with-warn');
    });

    it('should pass on console.info', () => {
        cy.mount(WithInfo, 'with-info');
    });
});
