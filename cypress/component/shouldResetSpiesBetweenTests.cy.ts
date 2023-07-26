import { WithError, WithNoConsole } from './customComponents';

describe('shouldResetSpiesBetweenTests', () => {
    beforeEach(() => {
        cy.wrap({ some: 'command' });
    });

    afterEach(() => {
        cy.wrap({ some: 'command' });
    });

    it('should throw AssertionError on console.error', () => {
        cy.mount(WithError, 'with-error');
    });

    it('should pass on error excluded message', () => {
        cy.mount(WithNoConsole, 'with-no-console');
    });
});
