import { WithError } from './customComponents';

describe('shouldResetConfigBetweenTests', () => {
    beforeEach(() => {
        cy.wrap({ some: 'command' });
    });

    afterEach(() => {
        cy.wrap({ some: 'command' });
    });

    it('should pass AssertionError on console.error', () => {
        cy.setConsoleMessages([
            'firstErrorExcluded',
            'secondErrorNotExcluded',
        ]).then(() => {
            cy.mount(WithError, 'with-error');
        });
    });

    it('should throw AssertionError on console.error', () => {
        cy.mount(WithError, 'with-error');
    });
});
