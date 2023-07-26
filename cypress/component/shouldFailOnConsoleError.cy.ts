import { WithError } from './customComponents';

describe('shouldFailOnConsoleError', () => {
    it('should throw AssertionError on console.error', () => {
        cy.mount(WithError, 'with-error');
    });
});
