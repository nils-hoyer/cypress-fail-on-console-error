import { WithErrorNotExcluded, WithExcludedError } from './customComponents';

describe('shouldAllowSpiesOnConsole', () => {
    it('should pass with cy.spy on console.error', () => {
        cy.spy(console, 'error').as('consoleError');
        cy.mount(WithExcludedError, 'with-excluded-error');
        cy.get('@consoleError').should(
            'have.been.calledWith',
            'secondErrorExcluded'
        );
    });

    it('should throw AssertionError on console.error with cy.spy', () => {
        cy.spy(console, 'error');
        cy.mount(WithErrorNotExcluded, 'with-not-excluded');
    });

    it('should pass with cy.stub on console.error', () => {
        cy.stub(console, 'error').as('consoleError');
        cy.mount(WithErrorNotExcluded, 'with-not-excluded');
        cy.get('@consoleError').should(
            'have.been.calledWith',
            'errorNotExcluded'
        );
    });
});
