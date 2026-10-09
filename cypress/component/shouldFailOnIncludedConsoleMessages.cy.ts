import { WithErrorAndWarn, WithSameMessage } from './customComponents';

describe('shouldFailOnIncludedConsoleMessages', () => {
    it('should throw AssertionError only on included console messages that are not excluded', () => {
        cy.getConfig().then((config) =>
            cy.setConfig({ ...config, includeConsoleMessages: [/Excluded/] })
        );
        cy.mount(WithErrorAndWarn, 'with-error-and-warn');
    });

    it('should pass when no console message is included', () => {
        cy.getConfig().then((config) =>
            cy.setConfig({ ...config, includeConsoleMessages: ['notLogged'] })
        );
        cy.mount(WithErrorAndWarn, 'with-error-and-warn');
    });

    it('should throw AssertionError only on included console messages of a console method', () => {
        cy.setConfig({
            consoleTypes: ['error', 'warn'],
            includeConsoleMessages: [{ type: 'warn', message: 'sameMessage' }],
        });
        cy.mount(WithSameMessage, 'with-same-message');
    });
});
