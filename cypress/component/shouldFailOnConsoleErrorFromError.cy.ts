import { WithErrorFromError } from './customComponents';

describe('shouldFailOnConsoleError', () => {
    it('should throw AssertionError on console.error from new error', () => {
        cy.mount(WithErrorFromError, 'with-error-from-error');
    });
});
