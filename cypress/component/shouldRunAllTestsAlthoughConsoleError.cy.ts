import { WithError, WithInfo } from './customComponents';

describe('shouldRunAllTestsAlthoughConsoleError', () => {
    it('should throw AssertionError on console.error', () => {
        cy.mount(WithError, 'with-error');
    });

    it('should pass on console.info', () => {
        cy.mount(WithInfo, 'with-info');
    });

    it('should throw AssertionError on console.error', () => {
        cy.mount(WithError, 'with-error');
    });
});
