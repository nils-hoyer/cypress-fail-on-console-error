import { WithFormattedError } from './customComponents';

describe('shouldFailOnFormattedConsoleMessage', () => {
    it('should throw AssertionError with the format specifiers filled in', () => {
        cy.mount(WithFormattedError, 'with-formatted-error');
    });

    it('should pass when the filled in message is ignored', () => {
        cy.setConfig({
            ignoreConsoleMessages: [
                /^Warning: componentWillMount is deprecated/,
            ],
        });
        cy.mount(WithFormattedError, 'with-formatted-error');
    });
});
