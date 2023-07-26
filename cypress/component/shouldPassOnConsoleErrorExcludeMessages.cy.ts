import { WithExcludedError } from './customComponents';

describe('shouldPassOnConsoleErrorExcludeMessages', () => {
    it('should pass on exclude message matching console.error message', () => {
        cy.mount(WithExcludedError, 'with-excluded-error');
    });
});
