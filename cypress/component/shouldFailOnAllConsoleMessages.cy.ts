import { WithErrorAndWarn } from './customComponents';

describe('shouldFailOnAllConsoleMessages', () => {
    it('should throw AssertionError listing every console message that is not excluded', () => {
        cy.mount(WithErrorAndWarn, 'with-error-and-warn');
    });
});
